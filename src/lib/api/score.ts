/**
 * Live scoring client — POSTs the graph to the FastAPI/NetworkX engine
 * (backend/main.py) and returns it with recomputed analytics.
 *
 * Fail-safe by design: if the engine is unreachable the caller keeps the
 * existing fixture scores, so a missing backend never breaks the demo.
 */
import type { GraphSchema } from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

export interface EngineStat {
  persons: number
  signals: number
  scored: number
  ms: number
}

export interface ScoreResult {
  graph: GraphSchema
  engine: EngineStat
}

export async function rescoreViaBackend(graph: GraphSchema): Promise<ScoreResult> {
  const res = await fetch(`${BASE}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) throw new Error(`scoring engine returned ${res.status}`)
  const data = (await res.json()) as GraphSchema & { _engine?: EngineStat }
  const { _engine, ...scored } = data
  return {
    graph: scored as GraphSchema,
    engine: _engine ?? { persons: 0, signals: 0, scored: 0, ms: 0 },
  }
}
