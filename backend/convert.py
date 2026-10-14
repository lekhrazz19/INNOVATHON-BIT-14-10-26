"""
Convert a real dataset into the app's GraphSchema (src/lib/api/types.ts).

    python3 convert.py --source crimenet --limit 400 --out ../public/real-graph.json
    python3 convert.py --source mafia --out ../real/mafia-graph.json

crimenet  datasets/crimenet/crimenet.json  4,504 criminal organisations, 10,935 ties
mafia     datasets/criminal-network/mafia_meetings.csv  space-delimited edge list

Run the engine on the full graph with:
    python3 convert.py --source crimenet --out /tmp/full.json    # no --limit
    python3 -c "import json,score; print(score.score_graph(json.load(open('/tmp/full.json'))))"
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATASETS = ROOT / "datasets"

# cooperation ties are stronger than conflict ties
WEIGHT = {"cooperation": 0.9, "conflict": 0.7, "other": 0.5}


def slug(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:64] or "n"


def _edge_id(a: str, b: str, rel: str) -> str:
    return f"{a}~{rel}~{b}"


def convert_crimenet(limit: int | None) -> dict[str, Any]:
    raw = json.loads((DATASETS / "crimenet" / "crimenet.json").read_text())
    raw_nodes, raw_edges = raw["nodes"], raw["edges"]

    # degree over the raw edge list, for the --limit subgraph
    deg: dict[str, int] = {}
    for e in raw_edges:
        deg[e["source"]] = deg.get(e["source"], 0) + 1
        deg[e["target"]] = deg.get(e["target"], 0) + 1

    keep: set[str] | None = None
    if limit:
        keep = {n["standard_name"] for n in sorted(raw_nodes, key=lambda x: -deg.get(x["standard_name"], 0))[:limit]}

    id_of: dict[str, str] = {}
    used: set[str] = set()
    nodes: list[dict[str, Any]] = []
    for n in raw_nodes:
        name = n["standard_name"]
        if keep is not None and name not in keep:
            continue
        nid = slug(name)
        while nid in used:
            nid += "-x"
        used.add(nid)
        id_of[name] = nid
        meta: dict[str, Any] = {}
        if n.get("country"):
            meta["country"] = n["country"]
        if n.get("profiled") is not None:
            meta["profiled"] = str(n["profiled"])
        if n.get("founded_year"):
            meta["founded_year"] = n["founded_year"]
        if n.get("time_period"):
            meta["time_period"] = n["time_period"]
        nodes.append(
            {
                "id": nid,
                "type": "ORGANIZATION",
                "label": name,
                "aliases": [a for a in (n.get("aliases") or []) if a][:8],
                "meta": meta,
                "evidence_ids": [],
            }
        )

    edges: list[dict[str, Any]] = []
    seen: set[str] = set()
    for e in raw_edges:
        s, t = id_of.get(e["source"]), id_of.get(e["target"])
        if not s or not t or s == t:
            continue
        rel = e.get("relationship", "other")
        eid = _edge_id(s, t, rel)
        if eid in seen:
            continue
        seen.add(eid)
        # crimenet edges carry no event timestamps, only coarse periods — leaving
        # the window blank keeps the temporal heuristics correctly inert
        edges.append(
            {
                "id": eid,
                "source": s,
                "target": t,
                "type": "ASSOCIATED_WITH",
                "weight": WEIGHT.get(rel, 0.5),
                "event_count": 1,
                "first_seen": "",
                "last_seen": "",
                "evidence_ids": [],
            }
        )

    return {
        "case_id": "CRIMENET",
        "case_title": "Global organised-crime network (crimenet.json)",
        "generated": datetime.now(timezone.utc).isoformat(),
        "nodes": nodes,
        "edges": edges,
    }


def convert_mafia(limit: int | None) -> dict[str, Any]:
    path = DATASETS / "criminal-network" / "mafia_meetings.csv"
    rows = list(csv.DictReader(path.open(), delimiter=" "))
    ids = sorted({r["Source"] for r in rows} | {r["Target"] for r in rows})
    if limit:
        ids = ids[:limit]
    keep = set(ids)
    nodes = [{"id": i, "type": "PERSON", "label": i, "evidence_ids": []} for i in ids]
    edges = []
    for i, r in enumerate(rows):
        if r["Source"] not in keep or r["Target"] not in keep:
            continue
        edges.append(
            {
                "id": f"m{i}",
                "source": r["Source"],
                "target": r["Target"],
                "type": "ASSOCIATED_WITH",
                "weight": 1.0,
                "event_count": 1,
                "first_seen": "",
                "last_seen": "",
                "evidence_ids": [],
            }
        )
    return {
        "case_id": "MAFIA",
        "case_title": "Mafia meeting network (mafia_meetings.csv)",
        "generated": datetime.now(timezone.utc).isoformat(),
        "nodes": nodes,
        "edges": edges,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["crimenet", "mafia"], required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--limit", type=int, default=None, help="keep top-N nodes by degree")
    a = ap.parse_args()

    g = convert_crimenet(a.limit) if a.source == "crimenet" else convert_mafia(a.limit)
    out = Path(a.out)
    if not out.is_absolute():
        out = (Path(__file__).resolve().parent / out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(g))
    print(f"{a.source}: {len(g['nodes'])} nodes, {len(g['edges'])} edges -> {out}")


if __name__ == "__main__":
    main()
