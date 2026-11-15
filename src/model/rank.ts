import type { Features, Member, Restaurant, Weights } from '../types'
import { score } from './learn'

export interface Conflict {
  memberId: string
  kind: 'diet' | 'allergy'
  what: string
}

export interface Ranked {
  restaurant: Restaurant
  /** The group's score, 0 to 1: the average, or the lowest member score under "nobody left unhappy". */
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

/** The member's latest swipe on a place: true for a like, false for a skip, null when they have not swiped it. */
export function swipeOn(member: Member, restaurantId: string): boolean | null {
  let liked: boolean | null = null
  for (const s of member.swipes) if (s.restaurantId === restaurantId) liked = s.liked
  return liked
}

/** The places every member can eat at. Only these reach the swipe deck and the group ranking. */
export function groupPlaces(restaurants: Restaurant[], members: Member[]): Restaurant[] {
  return restaurants.filter((r) => members.every((m) => conflictsFor(r, m).length === 0))
}

/** How many of these places the member has not swiped yet. Zero means there is nothing left to ask them. */
export function leftToSwipe(member: Member, places: Restaurant[]): number {
  return places.filter((r) => swipeOn(member, r.id) === null).length
}

export type GroupRule = 'average' | 'least-misery'

export interface RankInput {
  restaurants: Restaurant[]
  members: Member[]
  weights: Record<string, Weights>
  features: Record<string, Features>
  pinnedId?: string | null
  /** Extra weights for a personal re-rank, added to every included member. */
  boost?: Weights
  rule?: GroupRule
}

export function rankGroup({ restaurants, members, weights, features, pinnedId, boost, rule = 'average' }: RankInput): {
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
      const guess = score(w, features[r.id])
      // @hcai HOR-02 A real swipe beats the guess: a place the member liked counts as a match for them and a skipped one does not, the guess only orders the rest
      const swiped = swipeOn(m, r.id)
      const s = swiped === null ? guess : swiped ? 0.9 + 0.1 * guess : 0.1 * guess
      memberScores[m.id] = s
      sum += s
      if (s < memberScores[lowestMemberId]) lowestMemberId = m.id
    }
    // @hcai FAIR-04 (trade-off) One member one vote under both rules: someone with 40 swipes counts the same as someone with 5
    // @hcai FAIR-05 The group picks its fairness rule: best on average, or nobody left unhappy (the lowest score counts)
    const groupScore = !members.length ? 0 : rule === 'average' ? sum / members.length : memberScores[lowestMemberId]
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

const noon = (iso: string) => new Date(iso + 'T12:00:00')
const pad = (n: number) => String(n).padStart(2, '0')

/** The nights of a trip as ISO dates, from the first to the last day, at most a week. */
export function tripNights(from: string, to: string): string[] {
  const day = noon(from)
  const last = noon(to)
  if (Number.isNaN(day.getTime())) return []
  const nights: string[] = []
  while (nights.length < 7 && (nights.length === 0 || day <= last)) {
    nights.push(`${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`)
    day.setDate(day.getDate() + 1)
  }
  return nights
}

/** Sample rule: Friday and Saturday are the busy nights. */
export function isBusyNight(night: string): boolean {
  const weekday = noon(night).getDay()
  return weekday === 5 || weekday === 6
}

/** The table times of a place on one night. On a busy night the two earliest times are taken. */
export function slotsOn(r: Restaurant, night?: string): Restaurant['sample']['reservation']['slots'] {
  const { slots } = r.sample.reservation
  return night && isBusyNight(night) ? slots.slice(2) : slots
}

/** When a party of this size can expect a table. Without a night, an ordinary weekday is assumed. */
export function expectedReservation(r: Restaurant, partySize: number, night?: string): Reservation {
  const busy = night ? isBusyNight(night) : false
  // on a busy night a walk-in only works for a smaller party
  const walkInUpTo = r.sample.reservation.walkInUpTo - (busy ? 2 : 0)
  if (partySize <= walkInUpTo) return { kind: 'walk-in' }
  const slot = slotsOn(r, night).find((s) => s.maxParty >= partySize)
  return slot ? { kind: 'slot', time: slot.time } : { kind: 'none' }
}
