export type Diet = 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'gluten-free'
export type Allergy = 'gluten' | 'nuts' | 'shellfish' | 'dairy' | 'eggs'

/** The fixed set of vibe tags. A place has two or three. They show on the card and the model learns from them. */
export type Vibe =
  | 'traditional' | 'trendy' | 'local' | 'touristy' | 'posh'
  | 'casual' | 'cosy' | 'lively' | 'quiet' | 'family'
export const VIBES: Vibe[] = ['traditional', 'trendy', 'local', 'touristy', 'posh', 'casual', 'cosy', 'lively', 'quiet', 'family']

/** Personal mood for one trip. Private to the member. */
export type TripPref = 'traditional' | 'trendy' | 'local' | 'treat' | 'near'

export interface LatLng {
  latitude: number
  longitude: number
}

/** A point the group measures walking times from, with a name to show. */
export type Place = LatLng & { label: string }

/** Where the group stays: one of the preset areas, or a custom address or map tap. */
export type Stay =
  | { kind: 'area'; id: string }
  | { kind: 'custom'; label: string; latitude: number; longitude: number }

/** How easy it is to walk in without a booking. Sample data. */
export type WalkIn = 'easy' | 'sometimes' | 'rare'
/** How far ahead a table has to be booked. Sample data. */
export type BookAhead = 'same-day' | 'day-before' | 'before-trip'

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
    /** Signature dishes, used to match free-text must-haves. */
    dishes: string[]
    dietOptions: Diet[]
    allergens: Allergy[]
    reservation: { walkInUpTo: number; slots: { time: string; maxParty: number }[] }
    popularWith: string[]
    booking: { walkIn: WalkIn; bookAhead: BookAhead }
    /** One short review quote with its stars, like the top review on a map listing. */
    topReview: { text: string; rating: 1 | 2 | 3 | 4 | 5 }
  }
}

/** What a swipe was mostly about, when the member chose to say. */
export type Because = 'food' | 'vibe' | 'price' | 'near'

export interface Swipe {
  restaurantId: string
  liked: boolean
  because?: Because
}

/** Something one member wants on this trip, in their own words, for example "paella". Private. */
export interface MustHave {
  text: string
}

/** Highest price level the member wants to pay on this trip. */
export type Budget = { maxPriceLevel: 1 | 2 | 3 | 4 }

/** A member's own settings for one trip. Only that member ever sees them. */
export interface PersonalTrip {
  prefs: TripPref[]
  /** Free-text "add your own" preferences. A softer nudge than a must-have. */
  customPrefs: string[]
  mustHaves: MustHave[]
  budget: Budget | null
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
  customPrefs: string[]
  mustHaves: MustHave[]
  budget: Budget | null
  swipes: Swipe[]
  /** Features the member told the app to forget. */
  muted: string[]
  /** True when this member lets the group see their reasons by name. Must-haves stay private either way. */
  sharesReasons: boolean
  simulated: boolean
}

/** One number per feature. Positive means "likes", negative means "tends to skip". */
export type Weights = Record<string, number>
export type Features = Record<string, number>
