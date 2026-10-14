import { Fingerprint, Banknote, Network, Layers, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn, formatDate } from '@/lib/utils'
import { useGraphStore } from '@/lib/store/graphStore'
import {
  TIME_MAX,
  TIME_MIN,
  useUiStore,
} from '@/lib/store/uiStore'

export function GraphControls() {
  const { graphView, setGraphView, highlight, setHighlight, timeEnd, setTimeEnd } = useUiStore()
  const scoring = useGraphStore((s) => s.scoring)
  const runHeuristics = useGraphStore((s) => s.runHeuristics)

  async function rescore() {
    const e = await runHeuristics()
    if (e) {
      toast.success(`Recomputed ${e.signals} signals across ${e.persons} entities in ${e.ms} ms`)
    } else {
      toast.error('Scoring engine offline — showing cached scores')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex overflow-hidden rounded-md border border-border">
        <button
          type="button"
          onClick={() => setGraphView('projection')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            graphView === 'projection'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-accent',
          )}
        >
          <Network className="h-3.5 w-3.5" />
          Person projection
        </button>
        <button
          type="button"
          onClick={() => setGraphView('full')}
          className={cn(
            'flex items-center gap-1.5 border-l border-border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            graphView === 'full'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-accent',
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Full graph
        </button>
      </div>

      <Button
        variant={highlight === 'imei' ? 'string' : 'outline'}
        size="sm"
        className="gap-1.5"
        onClick={() => setHighlight('imei')}
      >
        <Fingerprint className="h-3.5 w-3.5" />
        IMEI pivot
      </Button>
      <Button
        variant={highlight === 'money' ? 'string' : 'outline'}
        size="sm"
        className="gap-1.5"
        onClick={() => setHighlight('money')}
      >
        <Banknote className="h-3.5 w-3.5" />
        Money path
      </Button>
      <Button
        variant="string"
        size="sm"
        className="gap-1.5"
        disabled={scoring}
        onClick={rescore}
        title="Recompute all heuristics live on the case graph"
      >
        <Zap className={cn('h-3.5 w-3.5', scoring && 'animate-pulse')} />
        {scoring ? 'Scoring…' : 'Run heuristics'}
      </Button>

      <div className="ml-auto flex min-w-[220px] items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          as of
        </span>
        <Slider
          value={[timeEnd]}
          min={TIME_MIN}
          max={TIME_MAX}
          step={24 * 3600 * 1000}
          onValueChange={([v]) => setTimeEnd(v)}
          className="flex-1"
        />
        <span className="w-20 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
          {formatDate(new Date(timeEnd).toISOString())}
        </span>
      </div>
    </div>
  )
}
