"""
red.string — scoring engine API.

Stateless: the client POSTs the graph, gets it back with live analytics.
    GET  /api/health   → engine identity + tunable thresholds
    POST /api/score    → {case_id, nodes, edges} → same graph, persons re-scored

Run:  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from score import CONFIG, HEURISTIC_WEIGHTS, score_graph

app = FastAPI(title="red.string scoring engine", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo: Vite dev server on a different origin
    allow_methods=["*"],
    allow_headers=["*"],
)


class Graph(BaseModel):
    case_id: str = "demo"
    case_title: str = ""
    generated: str = ""
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "engine": "networkx",
        "heuristics": list(HEURISTIC_WEIGHTS),
        "weights": HEURISTIC_WEIGHTS,
        "config": CONFIG,
    }


@app.post("/api/score")
def score(graph: Graph) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = score_graph(graph.model_dump())
    persons = sum(1 for n in result["nodes"] if n.get("type") == "PERSON")
    ranked = [n for n in result["nodes"] if n.get("priority_score")]
    result["_engine"] = {
        "persons": persons,
        "signals": len(graph.edges),
        "scored": len(ranked),
        "ms": round((time.perf_counter() - t0) * 1000, 1),
    }
    return result
