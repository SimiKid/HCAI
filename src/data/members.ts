import type { Allergy, Diet, Features, Member, Restaurant, Swipe, TripPref, Weights } from '../types'
import { score } from '../model/learn'

interface Persona {
  id: string
  name: string
  color: string
  diets: Diet[]
  allergies: Allergy[]
  tripPrefs: TripPref[]
  /** What this person really likes. Only used to generate their swipes, the app never reads it. */
  taste: Weights
  swipeCount: number
  seed: number
}

// Personas come from the interviews in the task analysis (1.1): vegetarian needs,
// budget, a friend who only eats food they know, an organiser who wants local food.
const PERSONAS: Persona[] = [
  {
    id: 'mia', name: 'Mia', color: '#7C5CE0', diets: ['vegetarian'], allergies: [], tripPrefs: ['trendy'],
    taste: { _bias: -0.3, 'cuisine:vegan': 2, 'cuisine:indian': 1.2, 'cuisine:lebanese': 1.2, 'cuisine:mexican': 1, 'vibe:trendy': 1, 'vibe:cosy': 0.6, 'cuisine:steak': -2, 'cuisine:seafood': -1.5 },
    swipeCount: 28, seed: 11,
  },
  {
    id: 'jonas', name: 'Jonas', color: '#1F8A70', diets: [], allergies: [], tripPrefs: ['budget', 'near'],
    taste: { _bias: -0.2, 'price:low': 2, 'price:high': -2.5, near: 1, 'cuisine:pizza': 0.8, 'cuisine:burger': 0.8, 'cuisine:mexican': 0.6 },
    swipeCount: 9, seed: 23,
  },
  {
    id: 'elif', name: 'Elif', color: '#D9730D', diets: [], allergies: [], tripPrefs: [],
    taste: { _bias: -0.2, 'cuisine:pizza': 2, 'cuisine:italian': 1.8, 'cuisine:burger': 1.2, 'cuisine:steak': 1.2, 'cuisine:spanish': 0.6, 'cuisine:tapas': 0.4, 'cuisine:japanese': -2, 'cuisine:ramen': -1.5, 'cuisine:indian': -2, 'cuisine:lebanese': -1.5, 'cuisine:seafood': -1.2, 'cuisine:vegan': -1 },
    swipeCount: 17, seed: 37,
  },
  {
    id: 'noah', name: 'Noah', color: '#2F6FDB', diets: [], allergies: [], tripPrefs: ['traditional', 'local'],
    taste: { _bias: -0.6, 'vibe:traditional': 1.5, 'vibe:local': 1.5, 'vibe:touristy': -1.5, 'cuisine:catalan': 1.8, 'cuisine:tapas': 1.5, 'cuisine:seafood': 1.2, 'cuisine:spanish': 1, 'cuisine:pizza': -1, 'cuisine:burger': -1.5 },
    swipeCount: 36, seed: 51,
  },
]

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffled<T>(items: T[], seed: number): T[] {
  const rnd = mulberry32(seed)
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** The other group members, with the same swipes on every run. */
export function simulatedMembers(restaurants: Restaurant[], features: Record<string, Features>): Member[] {
  return PERSONAS.map((p) => {
    const rnd = mulberry32(p.seed * 7919)
    const seen = shuffled(restaurants, p.seed).slice(0, p.swipeCount)
    const swipes: Swipe[] = seen.map((r) => ({
      restaurantId: r.id,
      // a little noise: people do not swipe perfectly in line with their taste
      liked: score(p.taste, features[r.id]) + (rnd() - 0.5) * 0.3 > 0.5,
    }))
    return {
      id: p.id, name: p.name, color: p.color, diets: p.diets, allergies: p.allergies,
      tripPrefs: p.tripPrefs, swipes, muted: [], simulated: true,
    }
  })
}
