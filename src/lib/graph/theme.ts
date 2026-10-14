import type { EntityType } from '@/lib/api/types'

/** muted categorical palette, tuned for a near-black canvas */
export const COMMUNITY_COLORS: Record<number, string> = {
  1: '#fbbf24', // core ring — fuchsia (red is reserved for priority / suspicious)
  2: '#fb923c', // mule pool — orange
  3: '#a78bfa', // recruiters — violet
  4: '#4ade80', // legitimate cluster — green
  5: '#64748b', // noise — slate
  6: '#94a3b8', // namesake / trap
  7: '#94a3b8',
}

export function communityColor(c?: number): string {
  if (c === undefined) return '#52525b'
  return COMMUNITY_COLORS[c] ?? '#52525b'
}

export type ThreatTier = 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'GUARDED' | 'BENIGN'

export interface ThreatBand {
  min: number
  max: number
  tier: ThreatTier
  label: string
  color: string
  underlayColor: string
  underlayOpacity: number
  underlayPadding: number
  badge: 'destructive' | 'warning' | 'secondary' | 'success' | 'string'
  psychology: string
  rationale: string
  tacticalAction: string
}

/**
 * Criminal Network Color Psychology Threat Spectrum
 * Based on cognitive ergonomics and intelligence threat-escalation models:
 * - Red stimulates the amygdala for urgent threat containment (Kingpin/Hubs)
 * - Orange induces active vigilance without alarm fatigue (Mule handlers/Brokers)
 * - Yellow captures focal scrutiny for caution & verification (Couriers/Watchlist)
 * - Blue provides analytical calm for monitored low-threat associates
 * - Green signals safe, verified legitimate, or noise baseline
 */
export const THREAT_BANDS: ThreatBand[] = [
  {
    min: 7.0,
    max: 10.0,
    tier: 'CRITICAL',
    label: 'CRITICAL',
    color: '#ef4444', // Crimson Red
    underlayColor: '#dc2626',
    underlayOpacity: 0.50,
    underlayPadding: 10,
    badge: 'destructive',
    psychology: 'Crimson Red stimulates rapid amygdala response, signaling critical danger and immediate operational priority.',
    rationale: 'Primary target / Kingpin / Syndicate coordinator with multiple high-risk heuristics active.',
    tacticalAction: 'Immediate apprehension / Priority judicial intercept',
  },
  {
    min: 5.0,
    max: 6.99,
    tier: 'ELEVATED',
    label: 'ELEVATED',
    color: '#f97316', // Vivid Alert Orange
    underlayColor: '#ea580c',
    underlayOpacity: 0.40,
    underlayPadding: 8,
    badge: 'warning',
    psychology: 'Vivid Orange evokes heightened vigilance, focusing analyst attention on operational hazards without causing alert fatigue.',
    rationale: 'Core financial handler / Mule coordinator / Syndicate bridge operating near the inner circle.',
    tacticalAction: 'Financial freezing orders & telecom tracking',
  },
  {
    min: 3.0,
    max: 4.99,
    tier: 'MODERATE',
    label: 'MODERATE',
    color: '#eab308', // Amber Warning Yellow
    underlayColor: '#ca8a04',
    underlayOpacity: 0.30,
    underlayPadding: 6,
    badge: 'warning',
    psychology: 'Amber Yellow captures optic focus first, signaling investigative caution and scrutiny before escalation.',
    rationale: 'Recruiter / Field courier / Intermediary node with recurring suspicious connections.',
    tacticalAction: 'Field KYC verification & physical surveillance',
  },
  {
    min: 1.0,
    max: 2.99,
    tier: 'GUARDED',
    label: 'GUARDED',
    color: '#0ea5e9', // Cool Cyan Blue
    underlayColor: '#0284c7',
    underlayOpacity: 0.22,
    underlayPadding: 4,
    badge: 'secondary',
    psychology: 'Cool Steel Blue promotes calm, detached analytical observation, minimizing cognitive bias for peripheral nodes.',
    rationale: 'Peripheral contact / Monitored subscriber with limited direct criminal linkage.',
    tacticalAction: 'Passive log monitoring & link preservation',
  },
  {
    min: -1.0,
    max: 0.99,
    tier: 'BENIGN',
    label: 'BENIGN',
    color: '#10b981', // Emerald Green
    underlayColor: '#059669',
    underlayOpacity: 0.16,
    underlayPadding: 3,
    badge: 'success',
    psychology: 'Emerald Green conveys safety and stability, reassuring investigators of legitimate or baseline status.',
    rationale: 'Verified legitimate party / Witness / Noise record with zero suspicious heuristic markers.',
    tacticalAction: 'Excluded from adverse action / Clear status',
  },
]

export const PRIORITY_BANDS = THREAT_BANDS

export function priorityBand(score = 0): ThreatBand {
  return THREAT_BANDS.find((b) => score >= b.min) ?? THREAT_BANDS[THREAT_BANDS.length - 1]
}

export function threatBand(score = 0): ThreatBand {
  return priorityBand(score)
}

export const ENTITY_META: Record<EntityType, { label: string; short: string; color: string }> = {
  PERSON: { label: 'Person', short: 'PER', color: '#e4e4e7' },
  PHONE: { label: 'Phone', short: 'PH', color: '#38bdf8' },
  ACCOUNT: { label: 'Account', short: 'AC', color: '#34d399' },
  VEHICLE: { label: 'Vehicle', short: 'VEH', color: '#fbbf24' },
  LOCATION: { label: 'Location', short: 'LOC', color: '#c084fc' },
  ORGANIZATION: { label: 'Organization', short: 'ORG', color: '#f472b6' },
  CASE: { label: 'Case', short: 'CASE', color: '#94a3b8' },
}

export const EDGE_META: Record<
  string,
  { label: string; color: string; dashed?: boolean }
> = {
  ASSOCIATED_WITH: { label: 'Association', color: '#52525b' },
  CALLED: { label: 'Call', color: '#38bdf8' },
  TRANSFERRED_TO: { label: 'Transfer', color: '#34d399' },
  OWNS: { label: 'Owns', color: '#3f3f46', dashed: true },
  LOCATED_AT: { label: 'Located at', color: '#7c3aed', dashed: true },
  MET: { label: 'Met', color: '#f59e0b' },
  MENTIONED_IN: { label: 'Mentioned in', color: '#475569', dashed: true },
  SAME_AS: { label: 'Merged identity', color: '#a1a1aa', dashed: true },
}

export const STRING_RED = '#ef4444'
