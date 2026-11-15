import type { Features, Weights } from '../types'
import { BIAS, featurePhrase } from './features'
import { rankGroup, type RankInput } from './rank'

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
