export type Diet = 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'gluten-free'
export type Allergy = 'gluten' | 'nuts' | 'shellfish' | 'dairy' | 'eggs'
export type Vibe = 'traditional' | 'trendy' | 'local' | 'touristy' | 'cosy' | 'lively' | 'fancy'
export type TripPref = 'traditional' | 'trendy' | 'local' | 'budget' | 'treat' | 'near' | 'top'

export interface LatLng {
  latitude: number
  longitude: number
}

/** Field names follow Google Places (New) so a Places source can fill the same shape. */
export interface Restaurant {
  id: string
  displayName: string
  primaryType: string
  location: LatLng
  neighbourhood: string
  formattedAddress: string
  priceLevel: 1 | 2 | 3 | 4
  rating: number
  userRatingCount: number
  photos: { src: string; attribution: string }[]
  /** Values Google does not provide. Sample data in the prototype. */
  sample: {
    vibes: Vibe[]
    dietOptions: Diet[]
    allergens: Allergy[]
    reservation: { walkInUpTo: number; slots: { time: string; maxParty: number }[] }
    popularWith: string[]
  }
}

export interface Swipe {
  restaurantId: string
  liked: boolean
}

export interface Member {
  id: string
  name: string
  color: string
  diets: Diet[]
  allergies: Allergy[]
  tripPrefs: TripPref[]
  swipes: Swipe[]
  /** Features the member told the app to forget. */
  muted: string[]
  simulated: boolean
}

/** One number per feature. Positive means "likes", negative means "tends to skip". */
export type Weights = Record<string, number>
export type Features = Record<string, number>
