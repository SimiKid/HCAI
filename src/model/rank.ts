import type { Features, Member, Restaurant, Weights } from '../types'
import { score } from './learn'
import { bookingStatus, bookingTier, type BookingMode, type BookingStatus } from './booking'
import { adjustForFit, personalFit } from './musthave'

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
  /** How the group can get a table in the chosen booking mode. Null when no mode was given. */
  booking: BookingStatus | null
  /** True when the place has no table in the chosen mode. It stays in the list, sorted down and marked. */
  unavailable: boolean
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
  /** When the group wants to eat. Without it the order is by taste only. */
  when?: BookingMode
  /** The ISO date of the dinner, for the busy-night rule. See bookingNight(). */
  night?: string
  /** Party size for table checks. Defaults to the number of members ranked. */
  partySize?: number
}

export function rankGroup({ restaurants, members, weights, features, pinnedId, boost, rule = 'average', when, night, partySize }: RankInput): {
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
      // private must-haves, free-text preferences and budget move this member's guess, never anyone else's
      const guess = adjustForFit(score(w, features[r.id]), personalFit(r, m))
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
    const booking = when ? bookingStatus(r, when, partySize ?? members.length, night) : null
    ranked.push({ restaurant: r, groupScore, memberScores, lowestMemberId, pinned, conflicts, booking, unavailable: booking?.availability === 'full' })
  }
  // @hcai ERR-12 A place with no table in the chosen mode is sorted down and marked, never hidden, and ad-hoc mode puts places free tonight first
  const tier = (x: Ranked) => (x.booking ? bookingTier(x.booking) : 0)
  ranked.sort((a, b) => Number(b.pinned) - Number(a.pinned) || tier(a) - tier(b) || b.groupScore - a.groupScore)
  return { ranked, blocked }
}

function addWeights(a: Weights, b: Weights): Weights {
  const out: Weights = { ...a }
  for (const f in b) out[f] = (out[f] ?? 0) + b[f]
  return out
}

// the reservation helpers moved to booking.ts, re-exported so older imports keep working
export { expectedReservation, isBusyNight, slotsOn, tripNights, type Reservation } from './booking'
