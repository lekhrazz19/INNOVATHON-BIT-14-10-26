import Papa from 'papaparse'
import type { EntityType, GraphEdge, GraphNode } from '@/lib/api/types'
import { BASE_GRAPH } from '@/lib/fixtures/dataset'

export interface Extraction {
  key: string
  value: string
  type: EntityType | 'DATE'
  method: 'regex' | 'ner' | 'date-parser'
  confidence: number
}

export interface ParsedIngest {
  kind: 'CDR' | 'TXN' | 'NETWORK' | 'CRIME_LOG' | 'GENERIC' | 'UNKNOWN'
  sourceLabel: string
  rowCount: number
  extractions: Extraction[]
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const CONFIDENCE_THRESHOLD = 0.6

const PHONE_RE = /^(\+?91[\s-]?)?[6-9]\d{9}$|^\+?\d[\d\s-]{8,}$/
const IMEI_RE = /^\d{2}-\d{6}-\d{6}-\d$|^\d{15}$/
const ACCOUNT_RE = /^\d{9,18}$|^[A-Z]{4}0[A-Z0-9]{6}$/i

/* map known person / account labels back to their canonical fixture ids */
const NAME_TO_ID = new Map<string, string>()
for (const n of BASE_GRAPH.nodes) {
  NAME_TO_ID.set(n.label.toLowerCase(), n.id)
  for (const a of n.aliases ?? []) NAME_TO_ID.set(a.toLowerCase(), n.id)
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}
function personId(name: string): string {
  return NAME_TO_ID.get(name.toLowerCase()) ?? `p_ing_${slug(name)}`
}
function phoneId(num: string): string {
  return `ph_ing_${slug(num)}`
}
function accountId(acc: string): string {
  return NAME_TO_ID.get(acc.toLowerCase()) ?? `ac_ing_${slug(acc)}`
}

function normKey(k: string): string {
  return k.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
}

function findCol(headers: string[], candidates: string[]): string | undefined {
  const normMap = new Map<string, string>()
  for (const h of headers) normMap.set(normKey(h), h)

  for (const cand of candidates) {
    const direct = normMap.get(cand)
    if (direct) return direct
  }
  for (const [norm, orig] of normMap.entries()) {
    for (const cand of candidates) {
      if (norm === cand || norm.startsWith(`${cand}_`) || norm.endsWith(`_${cand}`) || norm.includes(cand)) {
        return orig
      }
    }
  }
  return undefined
}

export function parseCsv(text: string, fileName: string): ParsedIngest {
  if (!text || !text.trim()) {
    return { kind: 'UNKNOWN', sourceLabel: fileName, rowCount: 0, extractions: [], nodes: [], edges: [] }
  }

  const { data } = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })

  const rows = (data || []).filter((r) => r && typeof r === 'object' && Object.keys(r).length > 0)
  if (rows.length === 0) {
    return { kind: 'UNKNOWN', sourceLabel: fileName, rowCount: 0, extractions: [], nodes: [], edges: [] }
  }

  const headers = Object.keys(rows[0])

  // 1. Check for CDR indicators
  const callerCol = findCol(headers, ['caller', 'calling', 'caller_name', 'caller_number', 'calling_no', 'from', 'source_number', 'ani', 'phone_a'])
  const calleeCol = findCol(headers, ['callee', 'called', 'callee_name', 'called_number', 'called_no', 'to', 'destination_number', 'dest', 'dnis', 'phone_b'])
  if (callerCol && calleeCol && callerCol !== calleeCol) {
    return parseCdr(rows, fileName, callerCol, calleeCol, headers)
  }

  // 2. Check for Transaction indicators
  const senderCol = findCol(headers, ['sender_account', 'sender', 'from_account', 'payer', 'remitter', 'source_account', 'dr_account', 'sender_acc', 'debit_account'])
  const receiverCol = findCol(headers, ['receiver_account', 'receiver', 'to_account', 'payee', 'beneficiary', 'target_account', 'cr_account', 'receiver_acc', 'credit_account'])
  if (senderCol && receiverCol && senderCol !== receiverCol) {
    return parseTxn(rows, fileName, senderCol, receiverCol, headers)
  }

  // 3. Check for Network / Meeting / Edge list indicators
  const sourceCol = findCol(headers, ['source', 'node1', 'person1', 'entity1', 'suspect', 'from', 'actor'])
  const targetCol = findCol(headers, ['target', 'node2', 'person2', 'entity2', 'associate', 'to', 'recipient'])
  if (sourceCol && targetCol && sourceCol !== targetCol) {
    return parseNetwork(rows, fileName, sourceCol, targetCol, headers)
  }

  // 4. Generic entity discovery fallback
  return parseGeneric(rows, fileName, headers)
}

/* ------------------------------------------------------------------ CDR */

function parseCdr(
  rows: Record<string, string>[],
  fileName: string,
  callerCol: string,
  calleeCol: string,
  headers: string[],
): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const pairAgg = new Map<
    string,
    { a: string; b: string; count: number; dur: number; first: string; last: string; imei: string }
  >()

  const callerNameCol = findCol(headers, ['caller_name', 'source_name', 'from_name'])
  const calleeNameCol = findCol(headers, ['callee_name', 'dest_name', 'to_name'])
  const timeCol = findCol(headers, ['timestamp', 'time', 'date', 'call_date', 'datetime'])
  const durCol = findCol(headers, ['duration_s', 'duration', 'duration_sec', 'dur'])
  const imeiCol = findCol(headers, ['imei', 'device_id', 'handset'])
  const towerCol = findCol(headers, ['cell_tower', 'tower', 'location', 'site', 'city'])

  rows.forEach((r, i) => {
    const rawCaller = (r[callerCol] || '').trim()
    const rawCallee = (r[calleeCol] || '').trim()
    if (!rawCaller && !rawCallee) return

    const callerName = (callerNameCol && r[callerNameCol]?.trim()) || rawCaller || `Caller ${i + 1}`
    const calleeName = (calleeNameCol && r[calleeNameCol]?.trim()) || rawCallee || `Callee ${i + 1}`
    const ts = (timeCol && r[timeCol]?.trim().slice(0, 10)) || '2026-03-01'
    const dur = durCol ? Number(r[durCol] || 0) : 0
    const imei = (imeiCol && r[imeiCol]?.trim()) || ''
    const tower = (towerCol && r[towerCol]?.trim()) || ''

    if (callerName) extractions.push(ex(`r${i}-caller`, callerName, 'PERSON', 'ner', 0.72))
    if (calleeName) extractions.push(ex(`r${i}-callee`, calleeName, 'PERSON', 'ner', 0.72))
    if (rawCaller && (PHONE_RE.test(rawCaller) || rawCaller !== callerName))
      extractions.push(ex(`r${i}-cph`, rawCaller, 'PHONE', 'regex', 0.97))
    if (rawCallee && (PHONE_RE.test(rawCallee) || rawCallee !== calleeName))
      extractions.push(ex(`r${i}-eph`, rawCallee, 'PHONE', 'regex', 0.97))
    if (imei && IMEI_RE.test(imei)) extractions.push(ex(`r${i}-imei`, imei, 'PHONE', 'regex', 0.98))
    if (tower) extractions.push(ex(`r${i}-loc`, tower, 'LOCATION', 'ner', 0.65))
    if (ts) extractions.push(ex(`r${i}-ts`, ts, 'DATE', 'date-parser', 0.99))

    const pa = personId(callerName)
    const pb = personId(calleeName)
    ensurePerson(nodeMap, pa, callerName)
    ensurePerson(nodeMap, pb, calleeName)

    if (rawCaller) {
      const id = phoneId(rawCaller)
      nodeMap.set(id, { id, type: 'PHONE', label: rawCaller, meta: { owner: pa, imei }, ingested: true })
    }
    if (rawCallee) {
      const id = phoneId(rawCallee)
      nodeMap.set(id, { id, type: 'PHONE', label: rawCallee, meta: { owner: pb }, ingested: true })
    }

    const [x, y] = [pa, pb].sort()
    const key = `${x}|${y}`
    const agg = pairAgg.get(key) ?? { a: x, b: y, count: 0, dur: 0, first: ts, last: ts, imei }
    agg.count += 1
    agg.dur += dur
    agg.first = ts < agg.first ? ts : agg.first
    agg.last = ts > agg.last ? ts : agg.last
    pairAgg.set(key, agg)
  })

  const edges: GraphEdge[] = []
  let seq = 0
  for (const agg of pairAgg.values()) {
    const w = Math.min(0.9, 0.3 + agg.count * 0.12)
    edges.push(edge(`ing_call_${seq}`, agg.a, agg.b, 'CALLED', {
      weight: w,
      event_count: agg.count,
      total_duration_min: Math.round(agg.dur / 60),
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    edges.push(edge(`ing_assoc_${seq}`, agg.a, agg.b, 'ASSOCIATED_WITH', {
      weight: w,
      event_count: agg.count,
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    seq += 1
  }

  for (const [id, n] of nodeMap) {
    if (n.type === 'PHONE' && n.meta?.owner) {
      edges.push(edge(`ing_owns_${id}`, String(n.meta.owner), id, 'OWNS', { weight: 1 }))
    }
  }

  return {
    kind: 'CDR',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* ------------------------------------------------------------------ TXN */

function parseTxn(
  rows: Record<string, string>[],
  fileName: string,
  senderCol: string,
  receiverCol: string,
  headers: string[],
): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const pairAgg = new Map<
    string,
    { from: string; to: string; count: number; amount: number; first: string; last: string }
  >()

  const senderNameCol = findCol(headers, ['sender_name', 'payer_name', 'remitter_name', 'from_name'])
  const receiverNameCol = findCol(headers, ['receiver_name', 'payee_name', 'beneficiary_name', 'to_name'])
  const amountCol = findCol(headers, ['amount', 'txn_amount', 'transaction_amount', 'value', 'inr'])
  const timeCol = findCol(headers, ['timestamp', 'time', 'date', 'txn_date', 'datetime'])

  rows.forEach((r, i) => {
    const rawSender = (r[senderCol] || '').trim()
    const rawReceiver = (r[receiverCol] || '').trim()
    if (!rawSender && !rawReceiver) return

    const senderName = (senderNameCol && r[senderNameCol]?.trim()) || rawSender || `Sender ${i + 1}`
    const receiverName = (receiverNameCol && r[receiverNameCol]?.trim()) || rawReceiver || `Receiver ${i + 1}`
    const ts = (timeCol && r[timeCol]?.trim().slice(0, 10)) || '2026-03-01'
    const amount = amountCol ? Number(String(r[amountCol]).replace(/[^0-9.]/g, '') || 0) : 0

    extractions.push(ex(`r${i}-sn`, senderName, 'PERSON', 'ner', 0.72))
    extractions.push(ex(`r${i}-rn`, receiverName, 'PERSON', 'ner', 0.72))
    if (rawSender && (ACCOUNT_RE.test(rawSender) || rawSender !== senderName))
      extractions.push(ex(`r${i}-sa`, rawSender, 'ACCOUNT', 'regex', 0.95))
    if (rawReceiver && (ACCOUNT_RE.test(rawReceiver) || rawReceiver !== receiverName))
      extractions.push(ex(`r${i}-ra`, rawReceiver, 'ACCOUNT', 'regex', 0.95))
    if (ts) extractions.push(ex(`r${i}-ts`, ts, 'DATE', 'date-parser', 0.99))

    const pf = personId(senderName)
    const pt = personId(receiverName)
    ensurePerson(nodeMap, pf, senderName)
    ensurePerson(nodeMap, pt, receiverName)

    if (rawSender) {
      const id = accountId(rawSender)
      if (id.startsWith('ac_ing'))
        nodeMap.set(id, { id, type: 'ACCOUNT', label: rawSender, meta: { owner: pf }, ingested: true })
    }
    if (rawReceiver) {
      const id = accountId(rawReceiver)
      if (id.startsWith('ac_ing'))
        nodeMap.set(id, { id, type: 'ACCOUNT', label: rawReceiver, meta: { owner: pt }, ingested: true })
    }

    const key = `${pf}|${pt}`
    const agg = pairAgg.get(key) ?? { from: pf, to: pt, count: 0, amount: 0, first: ts, last: ts }
    agg.count += 1
    agg.amount += amount
    agg.first = ts < agg.first ? ts : agg.first
    agg.last = ts > agg.last ? ts : agg.last
    pairAgg.set(key, agg)
  })

  const edges: GraphEdge[] = []
  let seq = 0
  for (const agg of pairAgg.values()) {
    const w = Math.min(0.9, 0.35 + agg.count * 0.15)
    edges.push(edge(`ing_txn_${seq}`, agg.from, agg.to, 'TRANSFERRED_TO', {
      weight: w,
      event_count: agg.count,
      total_amount: agg.amount,
      first_seen: agg.first,
      last_seen: agg.last,
      suspicious: agg.amount > 250000,
    }))
    edges.push(edge(`ing_txn_assoc_${seq}`, agg.from, agg.to, 'ASSOCIATED_WITH', {
      weight: w,
      event_count: agg.count,
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    seq += 1
  }

  return {
    kind: 'TXN',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* ---------------------------------------------------------------- NETWORK */

function parseNetwork(
  rows: Record<string, string>[],
  fileName: string,
  sourceCol: string,
  targetCol: string,
  headers: string[],
): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const weightCol = findCol(headers, ['weight', 'strength', 'value', 'count'])
  const edges: GraphEdge[] = []

  rows.forEach((r, i) => {
    const src = (r[sourceCol] || '').trim()
    const tgt = (r[targetCol] || '').trim()
    if (!src || !tgt) return

    const rawWeight = weightCol ? Number(r[weightCol] || 1) : 1
    const weight = Math.min(1.0, Math.max(0.1, Number.isFinite(rawWeight) ? rawWeight : 0.5))

    extractions.push(ex(`r${i}-src`, src, 'PERSON', 'ner', 0.8))
    extractions.push(ex(`r${i}-tgt`, tgt, 'PERSON', 'ner', 0.8))

    const idSrc = personId(src)
    const idTgt = personId(tgt)
    ensurePerson(nodeMap, idSrc, src)
    ensurePerson(nodeMap, idTgt, tgt)

    edges.push(edge(`ing_net_${i}`, idSrc, idTgt, 'ASSOCIATED_WITH', {
      weight,
      event_count: Math.round(weight * 5) || 1,
      first_seen: '2026-03-01',
      last_seen: '2026-03-15',
    }))
  })

  return {
    kind: 'NETWORK',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* ---------------------------------------------------------------- GENERIC */

function parseGeneric(rows: Record<string, string>[], fileName: string, headers: string[]): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []

  // Identify column roles heuristically
  const nameCols = headers.filter((h) => /name|person|suspect|alias|actor|user|member/i.test(h))
  const phoneCols = headers.filter((h) => /phone|mobile|contact|cell|number/i.test(h))
  const locCols = headers.filter((h) => /city|location|state|district|address|tower|place/i.test(h))
  const dateCols = headers.filter((h) => /date|time|timestamp/i.test(h))

  // Primary label column: first name col, or first non-empty text column
  const primaryCol = nameCols[0] || headers[0]

  rows.slice(0, 100).forEach((r, i) => {
    const entitiesInRow: string[] = []

    // Extract primary entity
    const primaryVal = (r[primaryCol] || '').trim()
    if (primaryVal && primaryVal.length > 1) {
      const pid = personId(primaryVal)
      ensurePerson(nodeMap, pid, primaryVal)
      extractions.push(ex(`gen-${i}-p`, primaryVal, 'PERSON', 'ner', 0.75))
      entitiesInRow.push(pid)
    }

    // Scan all columns for phones, locations, dates
    for (const h of headers) {
      const val = (r[h] || '').trim()
      if (!val) continue

      if (phoneCols.includes(h) || PHONE_RE.test(val)) {
        extractions.push(ex(`gen-${i}-${h}`, val, 'PHONE', 'regex', 0.95))
        const phId = phoneId(val)
        nodeMap.set(phId, { id: phId, type: 'PHONE', label: val, meta: { owner: entitiesInRow[0] }, ingested: true })
        if (entitiesInRow[0]) {
          edges.push(edge(`ing_owns_${i}_${h}`, entitiesInRow[0], phId, 'OWNS', { weight: 1 }))
        }
      } else if (locCols.includes(h)) {
        extractions.push(ex(`gen-${i}-${h}`, val, 'LOCATION', 'ner', 0.6))
      } else if (dateCols.includes(h)) {
        extractions.push(ex(`gen-${i}-${h}`, val.slice(0, 10), 'DATE', 'date-parser', 0.9))
      } else if (nameCols.includes(h) && h !== primaryCol && val.length > 1) {
        const otherPid = personId(val)
        ensurePerson(nodeMap, otherPid, val)
        extractions.push(ex(`gen-${i}-${h}`, val, 'PERSON', 'ner', 0.7))
        entitiesInRow.push(otherPid)
      }
    }

    // Create pairwise associations among entities found in the same row
    for (let j = 0; j < entitiesInRow.length; j++) {
      for (let k = j + 1; k < entitiesInRow.length; k++) {
        edges.push(edge(`ing_gen_${i}_${j}_${k}`, entitiesInRow[j], entitiesInRow[k], 'ASSOCIATED_WITH', {
          weight: 0.5,
          event_count: 1,
          first_seen: '2026-03-01',
          last_seen: '2026-03-15',
        }))
      }
    }
  })

  return {
    kind: 'GENERIC',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* --------------------------------------------------------------- helpers */

function ex(
  key: string,
  value: string,
  type: Extraction['type'],
  method: Extraction['method'],
  confidence: number,
): Extraction {
  return { key, value, type, method, confidence }
}

function ensurePerson(map: Map<string, GraphNode>, id: string, label: string) {
  if (id.startsWith('p_ing_') && !map.has(id)) {
    map.set(id, {
      id,
      type: 'PERSON',
      label,
      community: 2,
      priority_score: 0,
      fired_heuristics: [],
      ingested: true,
      meta: { role: 'Added via live ingest — not yet scored' },
    })
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  type: GraphEdge['type'],
  opts: Partial<GraphEdge>,
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    weight: opts.weight ?? 0.5,
    event_count: opts.event_count ?? 1,
    first_seen: opts.first_seen ?? '2026-03-01',
    last_seen: opts.last_seen ?? '2026-03-01',
    total_amount: opts.total_amount,
    total_duration_min: opts.total_duration_min,
    suspicious: opts.suspicious,
    evidence_ids: [],
    ingested: true,
  }
}
