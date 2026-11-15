import type { Features, Swipe, TripPref, Weights } from '../types'
import { BIAS } from './features'

// @hcai AMR-14 Small learning rate, one swipe nudges the taste profile and never flips it
export const LEARNING_RATE = 0.35

const PRIOR: Record<TripPref, Weights> = {
  traditional: { 'vibe:traditional': 1.2, 'vibe:touristy': -0.4 },
  trendy: { 'vibe:trendy': 1.2 },
  local: { 'vibe:local': 1.2, 'vibe:touristy': -0.8 },
  budget: { 'price:low': 1.2, 'price:high': -1.2 },
  treat: { 'price:high': 1.0 },
  near: { near: 1.5 },
  top: { rated: 1.2 },
}

/** Starting weights from what the member said about the trip, before any swipe. */
export function priorWeights(prefs: TripPref[]): Weights {
  const w: Weights = {}
  for (const p of prefs) for (const [f, v] of Object.entries(PRIOR[p])) w[f] = (w[f] ?? 0) + v
  return w
}

export function dot(w: Weights, x: Features): number {
  let s = 0
  for (const f in x) s += (w[f] ?? 0) * x[f]
  return s
}

/** How likely the member is to like a place, between 0 and 1. */
export function score(w: Weights, x: Features): number {
  return 1 / (1 + Math.exp(-dot(w, x)))
}

// @hcai AMR-13 Each like or skip moves the weights of that card's features, more when the guess was wrong
export function update(w: Weights, x: Features, liked: boolean): Weights {
  const error = (liked ? 1 : 0) - score(w, x)
  const next: Weights = { ...w }
  for (const f in x) next[f] = (next[f] ?? 0) + LEARNING_RATE * error * x[f]
  return next
}

export function learn(
  prefs: TripPref[],
  swipes: Swipe[],
  featuresById: Record<string, Features>,
  muted: string[] = [],
): Weights {
  let w = priorWeights(prefs)
  for (const s of swipes) {
    const x = featuresById[s.restaurantId]
    if (x) w = update(w, x, s.liked)
  }
  // @hcai AMR-09 A taste the member removed in "What the app thinks you like" is forgotten, whatever the swipes said
  for (const f of muted) delete w[f]
  return w
}

export type ConfidenceLevel = 'low' | 'medium' | 'high'

// @hcai FAIR-18 Confidence follows the number of swipes and is worded, never a percentage
export function confidence(swipeCount: number): { level: ConfidenceLevel; label: string } {
  if (swipeCount < 8) return { level: 'low', label: 'Rough guess' }
  if (swipeCount < 20) return { level: 'medium', label: 'Getting clearer' }
  return { level: 'high', label: 'Clear picture' }
}

/** Features sorted from most liked to most skipped, without the bias. */
export function tasteProfile(w: Weights): { feature: string; weight: number }[] {
  return Object.entries(w)
    .filter(([f, v]) => f !== BIAS && Math.abs(v) >= 0.25)
    .map(([feature, weight]) => ({ feature, weight }))
    .sort((a, b) => b.weight - a.weight)
}
