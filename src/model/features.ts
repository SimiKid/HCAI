import type { Features, LatLng, Restaurant, Vibe } from '../types'

export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad
  const dLng = (b.longitude - a.longitude) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export const BIAS = '_bias'

// @hcai XAI-13 The model only sees features a person can name (cuisine, vibe, price, distance, rating), no image embeddings
export function featuresOf(r: Restaurant, hotel: LatLng): Features {
  const x: Features = { [BIAS]: 1, [`cuisine:${r.primaryType}`]: 1 }
  for (const v of r.sample.vibes) x[`vibe:${v}`] = 1
  if (r.priceLevel <= 2) x['price:low'] = r.priceLevel === 1 ? 1 : 0.5
  if (r.priceLevel >= 3) x['price:high'] = r.priceLevel === 4 ? 1 : 0.5
  x['near'] = Math.max(0, 1 - distanceKm(hotel, r.location) / 2.5)
  x['rated'] = Math.min(1, Math.max(0, (r.rating - 4.0) / 0.8))
  return x
}

export const CUISINE_LABEL: Record<string, string> = {
  tapas: 'Tapas',
  catalan: 'Catalan',
  seafood: 'Seafood',
  spanish: 'Spanish',
  italian: 'Italian',
  pizza: 'Pizza',
  japanese: 'Japanese',
  ramen: 'Ramen',
  burger: 'Veggie burgers',
  mexican: 'Mexican',
  indian: 'Indian',
  vegan: 'Plant-based',
  lebanese: 'Lebanese',
  steak: 'Grill',
}

/** Chip label for each vibe tag. */
export const VIBE_LABEL: Record<Vibe, string> = {
  traditional: 'Traditional',
  trendy: 'Trendy',
  local: 'Local',
  touristy: 'Touristy',
  posh: 'Posh',
  casual: 'Casual',
  cosy: 'Cosy',
  lively: 'Lively',
  quiet: 'Quiet',
  family: 'Family-friendly',
}

/** Cuisines named after a place or a people: they keep their capital letter inside a sentence. */
const PROPER_CUISINES = new Set(['catalan', 'spanish', 'italian', 'japanese', 'mexican', 'indian', 'lebanese'])

/**
 * Plain words for a feature, as [when liked, when skipped].
 * `you` switches to the second person: "like tapas" instead of "likes tapas".
 */
export function featurePhrase(feature: string, you = false): [string, string] {
  const v = (third: string, second: string) => (you ? second : third)
  const [kind, value] = feature.split(':')
  if (kind === 'cuisine') {
    // "likes Spanish" keeps its capital letter, "likes tapas" does not
    const label = CUISINE_LABEL[value] ?? value
    const c = PROPER_CUISINES.has(value) ? label : label.toLowerCase()
    return [`${v('likes', 'like')} ${c}`, `${v('tends', 'tend')} to skip ${c}`]
  }
  if (kind === 'vibe') {
    const vibe = (VIBE_LABEL[value as Vibe] ?? value).toLowerCase()
    return [`${v('likes', 'like')} ${vibe} places`, `${v('tends', 'tend')} to skip ${vibe} places`]
  }
  if (feature === 'price:low') return [`${v('prefers', 'prefer')} cheaper places`, `${v('is', 'are')} not looking for cheap places`]
  if (feature === 'price:high') return [`${v('is', 'are')} happy to pay more`, `${v('avoids', 'avoid')} pricey places`]
  if (feature === 'near') return [`${v('prefers', 'prefer')} places near the hotel`, `${v('does', 'do')} not mind a longer walk`]
  if (feature === 'rated') return [`${v('goes', 'go')} for top-rated places`, `${v('cares', 'care')} less about ratings`]
  return [feature, feature]
}

/** Short chip label for a feature. */
export function featureLabel(feature: string): string {
  const [kind, value] = feature.split(':')
  if (kind === 'cuisine') return CUISINE_LABEL[value] ?? value
  if (kind === 'vibe') return VIBE_LABEL[value as Vibe] ?? value[0].toUpperCase() + value.slice(1)
  if (feature === 'price:low') return 'Cheaper places'
  if (feature === 'price:high') return 'Pricier places'
  if (feature === 'near') return 'Near the hotel'
  if (feature === 'rated') return 'Top rated'
  return feature
}
