import type { Features, Member, Restaurant, Weights } from '../types'
import { score } from './learn'

export interface Conflict {
  memberId: string
  kind: 'diet' | 'allergy'
  what: string
}

export interface Ranked {
  restaurant: Restaurant
  /** Average of the included members' scores, 0 to 1. */
  groupScore: number
  memberScores: Record<string, number>
  /** The member this place works least well for. */
  lowestMemberId: string
  pinned: boolean
  conflicts: Conflict[]
}

export interface Blocked {
  restaurant: Restaurant
  conflicts: Conflict[]
}

export function conflictsFor(r: Restaurant, member: Member): Conflict[] {
  const out: Conflict[] = []
  for (const d of member.diets)
    if (!r.sample.dietOptions.includes(d)) out.push({ memberId: member.id, kind: 'diet', what: d })
  for (const a of member.allergies)
    if (r.sample.allergens.includes(a)) out.push({ memberId: member.id, kind: 'allergy', what: a })
  return out
}

export interface RankInput {
  restaurants: Restaurant[]
  members: Member[]
  weights: Record<string, Weights>
  features: Record<string, Features>
  pinnedId?: string | null
  /** Extra weights for a personal re-rank, added to every included member. */
  boost?: Weights
}

export function rankGroup({ restaurants, members, weights, features, pinnedId, boost }: RankInput): {
  ranked: Ranked[]
  blocked: Blocked[]
} {
  const ranked: Ranked[] = []
  const blocked: Blocked[] = []
  for (const r of restaurants) {
    const conflicts = members.flatMap((m) => conflictsFor(r, m))
    const pinned = r.id === pinnedId
    // @hcai FAIR-10 Diets and allergies are a veto, not a taste: one member who cannot eat there removes the place for the group
    if (conflicts.length > 0 && !pinned) {
      blocked.push({ restaurant: r, conflicts })
      continue
    }
    const memberScores: Record<string, number> = {}
    let sum = 0
    let lowestMemberId = members[0]?.id ?? ''
    for (const m of members) {
      const w = boost ? addWeights(weights[m.id] ?? {}, boost) : (weights[m.id] ?? {})
      const s = score(w, features[r.id])
      memberScores[m.id] = s
      sum += s
      if (s < memberScores[lowestMemberId]) lowestMemberId = m.id
    }
    // @hcai FAIR-04 (trade-off) Plain average, one member one vote: someone with 40 swipes counts the same as someone with 5
    const groupScore = members.length ? sum / members.length : 0
    ranked.push({ restaurant: r, groupScore, memberScores, lowestMemberId, pinned, conflicts })
  }
  ranked.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.groupScore - a.groupScore)
  return { ranked, blocked }
}

function addWeights(a: Weights, b: Weights): Weights {
  const out: Weights = { ...a }
  for (const f in b) out[f] = (out[f] ?? 0) + b[f]
  return out
}

export type Reservation =
  | { kind: 'walk-in' }
  | { kind: 'slot'; time: string }
  | { kind: 'none' }

/** When a party of this size can expect a table tonight. */
export function expectedReservation(r: Restaurant, partySize: number): Reservation {
  const { walkInUpTo, slots } = r.sample.reservation
  if (partySize <= walkInUpTo) return { kind: 'walk-in' }
  const slot = slots.find((s) => s.maxParty >= partySize)
  return slot ? { kind: 'slot', time: slot.time } : { kind: 'none' }
}
