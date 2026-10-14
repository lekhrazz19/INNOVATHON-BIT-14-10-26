/**
 * Real-data source. Enabled with VITE_DATA=real, which makes the app load a
 * converted real graph (backend/convert.py → public/real-graph.json) instead of
 * the built-in fixture case.
 */
import type { GraphSchema } from './types'

export const DATA_SOURCE: 'fixture' | 'real' =
  import.meta.env.VITE_DATA === 'real' ? 'real' : 'fixture'

export async function fetchRealGraph(): Promise<GraphSchema> {
  const res = await fetch(`${import.meta.env.BASE_URL}real-graph.json`)
  if (!res.ok) throw new Error(`real graph not found (${res.status}) — run backend/convert.py`)
  return (await res.json()) as GraphSchema
}
