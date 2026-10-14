import { create } from 'zustand'
import * as api from '@/lib/api'
import { DATA_SOURCE, fetchRealGraph } from '@/lib/api/real'
import { rescoreViaBackend, type EngineStat } from '@/lib/api/score'
import type { GraphSchema } from '@/lib/api/types'

interface GraphState {
  graph: GraphSchema | null
  loading: boolean
  scoring: boolean
  /** stats from the last live scoring run, for the demo toast */
  engine: EngineStat | null
  error: string | null
  refresh: () => Promise<void>
  /** recompute analytics live via the NetworkX engine; returns null if offline */
  runHeuristics: () => Promise<EngineStat | null>
  reset: () => Promise<void>
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: null,
  loading: false,
  scoring: false,
  engine: null,
  error: null,

  /**
   * Load the case graph, then let the engine re-score it. If the engine is
   * unreachable we keep the fixture scores — a missing backend must never
   * break the demo.
   */
  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const base = DATA_SOURCE === 'real' ? await fetchRealGraph() : await api.getGraph()
      set({ graph: base, loading: false })
      await get().runHeuristics()
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  runHeuristics: async () => {
    const g = get().graph
    if (!g) return null
    set({ scoring: true })
    try {
      const { graph, engine } = await rescoreViaBackend(g)
      set({ graph, engine, scoring: false, error: null })
      return engine
    } catch (e) {
      // engine offline → keep current scores, surface a soft error
      set({ scoring: false, error: `scoring engine offline: ${(e as Error).message}` })
      return null
    }
  },

  reset: async () => {
    set({ loading: true })
    await api.resetDemo()
    const base = await api.getGraph()
    set({ graph: base, loading: false })
    await get().runHeuristics()
  },
}))
