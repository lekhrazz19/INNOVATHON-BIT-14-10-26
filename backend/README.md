# TrustLens — scoring engine

Live, transparent analytics for the criminal-network graph. Replaces the
pre-computed values in `src/lib/fixtures/dataset.ts` with a real computation:
the client POSTs the graph, the engine returns it with `priority_score`,
`fired_heuristics`, `sub_scores`, `community`, `degree`, `rank` filled in.

NetworkX only — no database, no Docker.

## Run (two terminals)

```bash
# 1. engine
cd backend
pip install -r requirements.txt       # already present on the dev box
uvicorn main:app --reload --port 8000

# 2. app
cd ..
npm run dev                            # http://localhost:5173
```

Then on the dashboard hit **Run heuristics** — the priority list re-ranks live
and a toast reports the runtime. Ingest a CSV → Commit and the graph re-scores
automatically.

## Endpoints

| Method | Path | Body / returns |
|---|---|---|
| GET | `/api/health` | engine identity + tunable thresholds |
| POST | `/api/score` | `{case_id, nodes, edges}` → same graph, persons re-scored |

## Heuristics

| Key | Weight | Fires when |
|---|---|---|
| HUB | 0.25 | degree > `HUB_MULT` × mean degree |
| BROKER | 0.25 | betweenness centrality in top `BROKER_FRAC` |
| BURST | 0.15 | an incident edge's event-count is a volume spike |
| NEW_CONNECTION | 0.15 | first contact within `NEW_DAYS` of the case date |
| STAR | 0.10 | degree ≥ `STAR_DEG` and clustering < `STAR_CLUST` |
| FADEOUT | 0.05 | latest activity ≥ `FADEOUT_DAYS` before the case date |
| COMMUNITY | 0.05 | member of a Louvain community of size ≥ `COMMUNITY_MIN` |

`priority_score = round(sum(fired weights) × 10, 1)` — identical formula to
`scoreFromHeuristics()` in the fixture, max 10.0.

Thresholds live in `CONFIG` at the top of `score.py`; edit and reload — no code
change. BURST / FADEOUT / NEW_CONNECTION use documented proxies over the
projection edges' `first_seen` / `last_seen` / `event_count` (raw per-event
timestamps are not in the projection).

## Self-check

```bash
cd backend && python3 score.py
```

Asserts formula parity with the fixture and a live end-to-end pass.

## Real data

`convert.py` turns a real dataset into the app's GraphSchema.

```bash
# 400-node visual slice served to the app
python3 convert.py --source crimenet --limit 400 --out ../public/real-graph.json

# full graph, for engine evaluation (4,504 orgs / 8,183 ties, ~12 s to score)
python3 convert.py --source crimenet --out /tmp/full.json
python3 -c "import json,score; g=json.load(open('/tmp/full.json')); print(len(score.score_graph(g)['nodes']))"
```

Then run the app with `VITE_DATA=real`:

```bash
cd .. && cp .env.example .env && sed -i 's/^VITE_DATA=$/VITE_DATA=real/' .env && npm run dev
```

Sources: `datasets/crimenet/crimenet.json` (4,504 criminal organisations),
`datasets/criminal-network/mafia_meetings.csv` (95-node meeting network).
The engine ranks `ORGANIZATION` as well as `PERSON`; crimenet edges carry no
event timestamps so the temporal heuristics stay inert, and the top band is
MEDIUM (6.5) — the ceiling without BURST / NEW_CONNECTION / FADEOUT signals.
