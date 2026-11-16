import type { Features, Member, Restaurant, Weights } from '../types'
import { BIAS, featurePhrase } from './features'
import { TASTE_THRESHOLD } from './learn'
import { rankGroup, type RankInput } from './rank'
import { personalFit } from './musthave'

export interface Reason {
  feature: string
  text: string
  positive: boolean
}

// @hcai XAI-16 "Why" lists the features that pushed this member's score most, up and down, in plain words
export function reasonsFor(w: Weights, x: Features, max = 2, you = false): Reason[] {
  return Object.keys(x)
    .filter((f) => f !== BIAS)
    .map((f) => ({ feature: f, c: (w[f] ?? 0) * x[f] }))
    .filter((r) => Math.abs(r.c) >= 0.15)
    .sort((a, b) => Math.abs(b.c) - Math.abs(a.c))
    .slice(0, max)
    .map(({ feature, c }) => ({
      feature,
      positive: c > 0,
      text: featurePhrase(feature, you)[c > 0 ? 0 : 1],
    }))
}

/**
 * What one swipe changed in the member's taste, as feature names.
 * After a like: the features that got stronger and now count as a like.
 * After a skip: the features that got weaker and now count as a skip.
 * Uses the same threshold as the taste chips in Profile, so the two never disagree.
 * Empty when the swipe did not move anything over that threshold.
 */
export function swipeEffect(before: Weights, after: Weights, liked: boolean, max = 2): string[] {
  return Object.keys(after)
    .filter((f) => f !== BIAS)
    .map((f) => ({ f, now: after[f], change: after[f] - (before[f] ?? 0) }))
    .filter(({ now, change }) => (liked ? change > 0 && now >= TASTE_THRESHOLD : change < 0 && now <= -TASTE_THRESHOLD))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, max)
    .map(({ f }) => f)
}

export type MatchLevel = 'strong' | 'good' | 'mixed' | 'weak'

// @hcai XAI-10 Scores are shown as words and bar lengths, the raw number never reaches the screen
export function matchLevel(score: number): { level: MatchLevel; label: string } {
  if (score >= 0.72) return { level: 'strong', label: 'Strong match' }
  if (score >= 0.56) return { level: 'good', label: 'Good match' }
  if (score >= 0.42) return { level: 'mixed', label: 'Mixed' }
  return { level: 'weak', label: 'Weak match' }
}

// @hcai XAI-15 Counterfactual: "without Mia this would be number 2" shows how much one person moves the rank
export function rankWithout(input: RankInput, restaurantId: string, memberId: string): number | null {
  const members = input.members.filter((m) => m.id !== memberId)
  if (members.length === 0) return null
  const { ranked } = rankGroup({ ...input, members, pinnedId: null })
  const i = ranked.findIndex((r) => r.restaurant.id === restaurantId)
  return i < 0 ? null : i + 1
}

/**
 * What a place means for the viewer's own private trip settings: matched must-haves, matched
 * free-text preferences, over budget. Call it only with the viewer, never for another member.
 */
export function ownFitReasons(r: Restaurant, viewer: Member): Reason[] {
  const fit = personalFit(r, viewer)
  return [
    ...fit.mustHaves.map((m) => ({ feature: 'must-have', positive: true, text: `matches your must-have "${m.text}"` })),
    ...fit.prefs.map((m) => ({ feature: 'pref', positive: true, text: `fits "${m.text}"` })),
    ...(fit.overBudget ? [{ feature: 'budget', positive: false, text: 'is above your budget' }] : []),
  ]
}

export interface SharedReasons {
  /** Members whose reasons may be shown with their name: the viewer and those who opted in. */
  named: { member: Member; reasons: Reason[] }[]
  /** The other members' main reasons, counted and without names. */
  summary: string[]
}

// @hcai AMR-05 Other members' reasons are counted without names ("two people prefer cheaper places") unless they chose to share them
// Must-haves and budgets are private even for members who share: only the viewer's own show up, and only to them.
export function sharedReasons(
  members: Member[],
  weights: Record<string, Weights>,
  x: Features,
  viewerId: string,
  /** Pass the place to add the viewer's own must-have and budget lines to the viewer's reasons. */
  restaurant?: Restaurant,
): SharedReasons {
  const named: SharedReasons['named'] = []
  const counts = new Map<string, { feature: string; positive: boolean; n: number }>()
  for (const m of members) {
    const mine = m.id === viewerId
    if (mine || m.sharesReasons) {
      const taste = reasonsFor(weights[m.id] ?? {}, x, 2, m.id === 'me')
      named.push({ member: m, reasons: mine && restaurant ? [...ownFitReasons(restaurant, m), ...taste] : taste })
      continue
    }
    const top = reasonsFor(weights[m.id] ?? {}, x, 1)[0]
    if (!top) continue
    const key = `${top.feature}|${top.positive}`
    const entry = counts.get(key) ?? { feature: top.feature, positive: top.positive, n: 0 }
    entry.n++
    counts.set(key, entry)
  }
  const words = ['', 'One person', 'Two people', 'Three people', 'Four people', 'Five people']
  const summary = [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .map((c) => `${words[c.n] ?? `${c.n} people`} ${featurePhrase(c.feature, c.n > 1)[c.positive ? 0 : 1]}`)
  return { named, summary }
}
