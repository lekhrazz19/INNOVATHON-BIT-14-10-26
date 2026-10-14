"""
TrustLens — live heuristic scoring engine.

Computes the 7 investigative heuristics over the person-projection graph,
mirroring src/lib/fixtures/dataset.ts (HEURISTIC_WEIGHTS / HEURISTIC_META).

The fixture dataset ships PRE-COMPUTED analytics; this module computes them
LIVE so /ingest → "Run heuristics" re-ranks the network on screen.

Rules (documented thresholds from HEURISTIC_META; tunable in CONFIG):
  HUB             degree > HUB_MULT × mean degree
  BROKER          betweenness centrality in the top BROKER_FRAC
  COMMUNITY       Louvain community of size ≥ COMMUNITY_MIN
  BURST           an edge event-count ≥ BURST_MULT × median AND ≥ BURST_MIN
  NEW_CONNECTION  first_seen within NEW_DAYS of the case date
  FADEOUT         latest activity ≥ FADEOUT_DAYS before the case date
  STAR            degree ≥ STAR_DEG and clustering coefficient < STAR_CLUST

BURST / FADEOUT / NEW_CONNECTION are temporal. The person-projection edges
carry first_seen / last_seen / event_count (not raw per-event timestamps), so
these three use documented proxies over those fields.

Deterministic: same graph in → same scores out. Pure networkx + stdlib.
"""
from __future__ import annotations

import math
from datetime import date
from typing import Any

import networkx as nx

# weights must stay in sync with src/lib/fixtures/dataset.ts
HEURISTIC_WEIGHTS: dict[str, float] = {
    "HUB": 0.25,
    "BROKER": 0.25,
    "BURST": 0.15,
    "NEW_CONNECTION": 0.15,
    "STAR": 0.10,
    "FADEOUT": 0.05,
    "COMMUNITY": 0.05,
}

# analyst-tunable thresholds — edit here, no code change needed
CONFIG: dict[str, float] = {
    "HUB_MULT": 1.5,          # post-hoc relaxed from the literal 2× so a small
                              # graph still surfaces the coordinators; set to 2.0
                              # for the strict documented rule
    "BROKER_FRAC": 0.25,      # top 25% of persons (literal "top 10%" is ~2 nodes
                              # on a 16-person graph and reads as empty)
    "COMMUNITY_MIN": 3,
    "BURST_MULT": 2.0,
    "BURST_MIN": 30,
    "NEW_DAYS": 30,
    "FADEOUT_DAYS": 30,
    "STAR_DEG": 4,
    "STAR_CLUST": 0.3,
}

ORDER = ["HUB", "BROKER", "BURST", "NEW_CONNECTION", "STAR", "FADEOUT", "COMMUNITY"]

# node types the engine ranks. ORGANIZATION is included so real criminal-network
# datasets (crimenet.json — 4,504 organisations) score without a schema rewrite.
RANKABLE_TYPES = {"PERSON", "ORGANIZATION"}

# above this node count betweenness is sampled (Brandes is O(n·m))
BETWEENNESS_SAMPLE_ABOVE = 1500
BETWEENNESS_SAMPLES = 500


def score_from_heuristics(fired: list[str]) -> float:
    """Same formula as dataset.ts scoreFromHeuristics — keep in sync."""
    raw = sum(HEURISTIC_WEIGHTS[k] for k in fired if k in HEURISTIC_WEIGHTS)
    return round(raw * 10 * 10) / 10


def _parse_day(s: str) -> date | None:
    try:
        return date.fromisoformat(str(s)[:10])
    except (ValueError, TypeError):
        return None


def _projection(
    nodes: list[dict[str, Any]], edges: list[dict[str, Any]]
) -> tuple[dict[str, dict], nx.Graph]:
    """Rankable-entity projection: RANKABLE_TYPES joined by ASSOCIATED_WITH edges."""
    persons = {n["id"]: n for n in nodes if n.get("type") in RANKABLE_TYPES}
    g = nx.Graph()
    g.add_nodes_from(sorted(persons))
    for e in edges:
        if e.get("type") != "ASSOCIATED_WITH":
            continue
        s, t = e.get("source"), e.get("target")
        if s in persons and t in persons:
            g.add_edge(
                s,
                t,
                weight=float(e.get("weight", 0.5)),
                event_count=int(e.get("event_count", 1)),
                first_seen=e.get("first_seen", ""),
                last_seen=e.get("last_seen", ""),
            )
    return persons, g


def _activity_date(persons: dict[str, dict], g: nx.Graph) -> date:
    """
    Reference 'now' = median of each person's latest activity.

    Using the global max last_seen is fragile: one outlying edge drags the
    reference forward and falsely flags everyone else as faded out.
    """
    lasts: list[date] = []
    for pid in persons:
        days = [
            d
            for d in (_parse_day(x.get("last_seen", "")) for _, _, x in g.edges(pid, data=True))
            if d
        ]
        if days:
            lasts.append(max(days))
    if not lasts:
        return date(2026, 3, 31)
    lasts.sort()
    return lasts[len(lasts) // 2]


def score_graph(graph: dict[str, Any]) -> dict[str, Any]:
    """Recompute priority_score / fired_heuristics / community for persons."""
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    persons, g = _projection(nodes, edges)

    if len(persons) == 0:
        return graph

    deg = dict(g.degree())
    mean_deg = sum(deg.values()) / len(deg) if deg else 0.0
    betweenness = (
        nx.betweenness_centrality(g, k=BETWEENNESS_SAMPLES, seed=42)
        if g.number_of_nodes() > BETWEENNESS_SAMPLE_ABOVE
        else nx.betweenness_centrality(g)
    ) if g.number_of_edges() else {n: 0.0 for n in g}
    clust = nx.clustering(g)

    # community detection (Louvain), numbered largest-first for stable colours
    try:
        comms = nx.community.louvain_communities(g, seed=42)
    except Exception:
        comms = [set(c) for c in nx.connected_components(g)]
    comms = sorted(comms, key=lambda c: (-len(c), min(c) if c else ""))
    comm_of: dict[str, int] = {}
    size_of: dict[int, int] = {}
    for i, c in enumerate(comms, start=1):
        size_of[i] = len(c)
        for nid in c:
            comm_of[nid] = i

    case = _activity_date(persons, g)
    fired_map: dict[str, list[str]] = {}

    for pid in persons:
        fired: list[str] = []

        # HUB
        if mean_deg > 0 and deg.get(pid, 0) > CONFIG["HUB_MULT"] * mean_deg:
            fired.append("HUB")

        # BROKER — top BROKER_FRAC by betweenness, must be non-zero
        n_nonzero = sum(1 for v in betweenness.values() if v > 0)
        k = max(1, math.ceil(CONFIG["BROKER_FRAC"] * n_nonzero)) if n_nonzero else 0
        top = {
            n
            for n, _ in sorted(
                betweenness.items(), key=lambda kv: (-kv[1], kv[0])
            )[:k]
        }
        if pid in top and betweenness.get(pid, 0.0) > 0:
            fired.append("BROKER")

        # BURST — an incident edge with a volume spike
        inc = [d for _, _, d in g.edges(pid, data=True)]
        if inc:
            counts = [d["event_count"] for d in inc]
            counts_sorted = sorted(counts)
            med = counts_sorted[len(counts_sorted) // 2]
            if any(c >= CONFIG["BURST_MULT"] * med and c >= CONFIG["BURST_MIN"] for c in counts):
                fired.append("BURST")

        # NEW_CONNECTION — first contact within NEW_DAYS of the case date
        recent = case.toordinal() - CONFIG["NEW_DAYS"]
        if any(
            (d := _parse_day(x.get("first_seen", ""))) and d.toordinal() >= recent
            for _, _, x in g.edges(pid, data=True)
        ):
            fired.append("NEW_CONNECTION")

        # STAR — many contacts that don't talk to each other
        if deg.get(pid, 0) >= CONFIG["STAR_DEG"] and clust.get(pid, 0.0) < CONFIG["STAR_CLUST"]:
            fired.append("STAR")

        # FADEOUT — went quiet before the case date
        last = [
            d for d in (_parse_day(x.get("last_seen", "")) for _, _, x in g.edges(pid, data=True)) if d
        ]
        if last and (case.toordinal() - max(last).toordinal()) >= CONFIG["FADEOUT_DAYS"]:
            fired.append("FADEOUT")

        # COMMUNITY — member of a ring of size ≥ COMMUNITY_MIN
        cid = comm_of.get(pid)
        if cid is not None and size_of.get(cid, 0) >= CONFIG["COMMUNITY_MIN"]:
            fired.append("COMMUNITY")

        fired_map[pid] = [k for k in ORDER if k in fired]

    scores = {pid: score_from_heuristics(f) for pid, f in fired_map.items()}
    ranked = sorted(
        (pid for pid, s in scores.items() if s > 0),
        key=lambda p: (-scores[p], p),
    )
    rank_of = {pid: i + 1 for i, pid in enumerate(ranked)}

    out_nodes: list[dict[str, Any]] = []
    for n in nodes:
        if n.get("type") not in RANKABLE_TYPES or n["id"] not in persons:
            out_nodes.append(n)
            continue
        pid = n["id"]
        fired = fired_map[pid]
        enriched = {
            **n,
            "priority_score": scores[pid],
            "fired_heuristics": fired,
            "sub_scores": {k: (1 if k in fired else 0) for k in HEURISTIC_WEIGHTS},
            "degree": deg.get(pid, 0),
            "community": comm_of.get(pid, n.get("community")),
            "rank": rank_of.get(pid),
        }
        out_nodes.append(enriched)

    return {**graph, "nodes": out_nodes}


if __name__ == "__main__":
    # self-check: formula parity with dataset.ts + a live end-to-end pass
    assert score_from_heuristics([]) == 0.0
    assert score_from_heuristics(["BROKER"]) == 2.5
    assert score_from_heuristics(["HUB", "BROKER", "BURST", "STAR", "COMMUNITY"]) == 8.0

    demo = {
        "nodes": [{"id": f"p{i}", "type": "PERSON", "label": f"P{i}"} for i in range(5)],
        "edges": [
            {"source": "p0", "target": "p1", "type": "ASSOCIATED_WITH", "weight": 0.9,
             "event_count": 40, "first_seen": "2026-03-01", "last_seen": "2026-03-15"},
            {"source": "p0", "target": "p2", "type": "ASSOCIATED_WITH", "weight": 0.8,
             "event_count": 5, "first_seen": "2025-06-01", "last_seen": "2026-03-01"},
            {"source": "p0", "target": "p3", "type": "ASSOCIATED_WITH", "weight": 0.7,
             "event_count": 5, "first_seen": "2025-06-01", "last_seen": "2026-03-01"},
            {"source": "p0", "target": "p4", "type": "ASSOCIATED_WITH", "weight": 0.7,
             "event_count": 5, "first_seen": "2025-06-01", "last_seen": "2026-03-01"},
            {"source": "p1", "target": "p2", "type": "ASSOCIATED_WITH", "weight": 0.6,
             "event_count": 4, "first_seen": "2025-06-01", "last_seen": "2026-02-01"},
        ],
    }
    out = score_graph(demo)
    p0 = next(n for n in out["nodes"] if n["id"] == "p0")
    assert p0["priority_score"] > 0, "top node must score"
    assert p0["rank"] == 1, "p0 is the degree hub → rank 1"
    assert all("HUB" in n["fired_heuristics"] for n in out["nodes"] if n["id"] == "p0")
    ranked = [n["priority_score"] for n in out["nodes"] if n.get("priority_score")]
    assert ranked == sorted(ranked, reverse=True), "ranking must be descending"
    print("score.py self-check OK —", out["nodes"][0]["fired_heuristics"])
