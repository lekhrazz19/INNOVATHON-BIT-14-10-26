import type { GraphSchema } from '@/lib/api/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { priorityBand } from '@/lib/graph/theme'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/lib/store/uiStore'

export function PriorityList({ graph }: { graph: GraphSchema }) {
  const selectedEntityId = useUiStore((s) => s.selectedEntityId)
  const selectEntity = useUiStore((s) => s.selectEntity)

  const ranked = graph.nodes
    .filter((n) => (n.priority_score ?? 0) > 0 && !n.meta?.alias_of)
    .sort(
      (a, b) =>
        (b.priority_score ?? 0) - (a.priority_score ?? 0) ||
        (b.degree ?? 0) - (a.degree ?? 0) ||
        a.label.localeCompare(b.label),
    )

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold">High-priority entities</h2>
        <p className="text-[10px] text-muted-foreground">
          investigative ranking score · not a probability
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {ranked.map((n, i) => {
            const band = priorityBand(n.priority_score)
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => selectEntity(n.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent group',
                  selectedEntityId === n.id && 'bg-primary/10',
                )}
                title={`${n.label} — ${band.label} Tier (${(n.priority_score ?? 0).toFixed(1)}/10)\n${band.psychology}`}
              >
                <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground">
                  {i + 1}
                </span>
                {/* Color psychology identity marker with glowing halo */}
                <div className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full opacity-50 blur-[2px] transition-opacity group-hover:opacity-80"
                    style={{ background: band.underlayColor }}
                  />
                  <span
                    className="relative h-2 w-2 rounded-full ring-1"
                    style={{
                      background: band.color,
                      borderColor: `${band.color}aa`,
                      boxShadow: `0 0 6px ${band.color}`,
                    }}
                  />
                </div>
                <span className="min-w-0 flex-1 truncate text-xs font-medium" title={n.label}>
                  {n.label}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-wider shrink-0"
                  style={{
                    color: band.color,
                    background: `${band.color}18`,
                    border: `1px solid ${band.color}35`,
                  }}
                >
                  {band.label}
                </span>
                <span
                  className="w-7 shrink-0 text-right font-mono text-xs font-semibold tabular-nums"
                  style={{ color: band.color }}
                >
                  {(n.priority_score ?? 0).toFixed(1)}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
