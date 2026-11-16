import type { Member, Restaurant } from '../types'
import { CUISINE_LABEL } from './features'

export interface PersonalMatch {
  /** The member's own words, as they typed them. */
  text: string
  /** The word on the place that matched, for example "paella" or "seafood". */
  term: string
  kind: 'must-have' | 'pref'
}

/** What a place means for one member's private trip settings. Only ever shown to that member. */
export interface PersonalFit {
  mustHaves: PersonalMatch[]
  prefs: PersonalMatch[]
  overBudget: boolean
}

/** A matched must-have closes this share of the gap to a perfect score. */
export const MUST_HAVE_BOOST = 0.5
/** A matched free-text preference, a softer nudge. */
export const PREF_BOOST = 0.25
/** A place above the member's budget keeps this share of its score. */
export const OVER_BUDGET_FACTOR = 0.5

// a word someone types, and the words on a place that count as a match for it
const RELATED: Record<string, string[]> = {
  paella: ['paella', 'rice', 'seafood'],
  rice: ['rice', 'paella'],
  arroz: ['rice', 'paella'],
  seafood: ['seafood', 'fish', 'prawns', 'clams', 'oysters', 'mussels', 'shellfish', 'lobster', 'percebes'],
  fish: ['fish', 'seafood', 'sea bass', 'suquet de peix'],
  shellfish: ['shellfish', 'seafood', 'clams', 'mussels', 'oysters', 'lobster', 'prawns'],
  sushi: ['sushi', 'nigiri', 'omakase', 'japanese'],
  japanese: ['japanese', 'sushi', 'ramen', 'udon'],
  noodles: ['ramen', 'udon', 'noodle'],
  ramen: ['ramen'],
  pizza: ['pizza', 'margherita', 'neapolitan pizza'],
  pasta: ['pasta', 'lasagne', 'carbonara', 'fresh pasta'],
  italian: ['italian', 'pasta', 'pizza'],
  steak: ['steak', 'grill', 'entraña steak', 'dry-aged steak'],
  meat: ['steak', 'grill', 'meat', 'oxtail', 'lamb'],
  tapas: ['tapas', 'montaditos', 'croquetas', 'patatas bravas'],
  vegan: ['vegan', 'plant-based'],
  plant: ['vegan', 'plant-based'],
  vegetarian: ['vegan', 'plant-based', 'vegetarian tasting menu'],
  curry: ['curry', 'indian', 'butter chicken', 'biryani'],
  spicy: ['indian', 'curry', 'spice'],
  tacos: ['tacos', 'mexican', 'tacos al pastor'],
  mexican: ['mexican', 'tacos', 'mole'],
  wine: ['wine', 'natural wine', 'red wine'],
  vermouth: ['vermouth'],
  vermut: ['vermouth'],
  cocktails: ['cocktails', 'mezcal', 'margaritas'],
  beer: ['craft beer', 'beer'],
  burger: ['burger', 'vegan burger', 'veggie burger'],
  mezze: ['mezze', 'hummus', 'falafel', 'lebanese'],
  catalan: ['catalan'],
  kids: ['family', 'families'],
  family: ['family', 'families'],
  tasting: ['tasting menu', 'omakase', 'seafood tasting', 'vegetarian tasting menu'],
}

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'some', 'any', 'with', 'for', 'of', 'on', 'in', 'at', 'to', 'one', 'once',
  'i', 'we', 'want', 'wants', 'would', 'like', 'love', 'eat', 'have', 'try', 'must', 'least', 'really', 'very',
  'good', 'great', 'nice', 'best', 'real', 'proper', 'place', 'places', 'food', 'dinner', 'night', 'trip',
])

/** Lowercase, no accents, so "Paëlla" and "paella" are the same word. */
export function normalise(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** "prawns" and "prawn" are the same word for matching. */
const stem = (w: string) => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)

const words = (text: string) => normalise(text).split(/[^a-z0-9-]+/).filter(Boolean)

/** Everything on a place a must-have can match: cuisine, dishes, vibe tags and who it is popular with. */
function placeTerms(r: Restaurant): string[] {
  return [r.primaryType, CUISINE_LABEL[r.primaryType] ?? '', ...r.sample.dishes, ...r.sample.vibes, ...r.sample.popularWith]
    .map(normalise)
    .filter(Boolean)
}

/**
 * The first word on the place that matches a piece of free text, or null.
 * A typed word matches itself and its related words (RELATED). Whole words only, plurals ignored.
 */
export function matchText(r: Restaurant, text: string): string | null {
  const terms = placeTerms(r)
  const termWords = new Set(terms.flatMap((t) => words(t).map(stem)))
  const typed = words(text).filter((w) => w.length >= 3 && !STOP.has(w))
  for (const w of typed) {
    const wanted = RELATED[w] ?? RELATED[stem(w)] ?? [w]
    for (const want of wanted) {
      const n = normalise(want)
      // a phrase like "natural wine" has to appear as written, a single word as a whole word
      const hit = n.includes(' ') ? terms.some((t) => t.includes(n)) : termWords.has(stem(n))
      if (hit) return want
    }
  }
  return null
}

// @hcai FAIR-14 Private must-haves in a member's own words ("paella") feed the ranking through a simple keyword match the member can predict
export function personalFit(r: Restaurant, m: Pick<Member, 'mustHaves' | 'customPrefs' | 'budget'>): PersonalFit {
  const mustHaves: PersonalMatch[] = []
  for (const h of m.mustHaves) {
    const term = matchText(r, h.text)
    if (term) mustHaves.push({ text: h.text, term, kind: 'must-have' })
  }
  const prefs: PersonalMatch[] = []
  for (const p of m.customPrefs) {
    const term = matchText(r, p)
    if (term) prefs.push({ text: p, term, kind: 'pref' })
  }
  const overBudget = m.budget ? r.priceLevel > m.budget.maxPriceLevel : false
  return { mustHaves, prefs, overBudget }
}

/**
 * The member's guess for a place after their must-haves, free-text preferences and budget.
 * Applied to the guess only: a real swipe on the place still beats it.
 */
export function adjustForFit(guess: number, fit: PersonalFit): number {
  let s = guess
  if (fit.mustHaves.length) s += (1 - s) * MUST_HAVE_BOOST
  if (fit.prefs.length) s += (1 - s) * PREF_BOOST
  if (fit.overBudget) s *= OVER_BUDGET_FACTOR
  return s
}
