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
  photos: { src: string; attribution: string; kind: 'food' | 'inside' }[]
  /** Values Google does not provide. Sample data in the prototype. */
  sample: {
    vibes: Vibe[]
    dietOptions: Diet[]
    allergens: Allergy[]
    reservation: { walkInUpTo: number; slots: { time: string; maxParty: number }[] }
    popularWith: string[]
  }
}

/** What a swipe was mostly about, when the member chose to say. */
export type Because = 'food' | 'vibe' | 'price' | 'near'

export interface Swipe {
  restaurantId: string
  liked: boolean
  because?: Because
}

export interface Member {
  id: string
  name: string
  color: string
  /** Id of a preset avatar, empty for the initial letter. */
  avatar: string
  diets: Diet[]
  allergies: Allergy[]
  tripPrefs: TripPref[]
  swipes: Swipe[]
  /** Features the member told the app to forget. */
  muted: string[]
  /** True when this member lets the group see their reasons by name. */
  sharesReasons: boolean
  simulated: boolean
}

/** One number per feature. Positive means "likes", negative means "tends to skip". */
export type Weights = Record<string, number>
export type Features = Record<string, number>
