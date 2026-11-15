import type { Restaurant } from '../types'
import fixed from './restaurants.barcelona.json'

/**
 * The only way screens get restaurants. Today it is a fixed file. A
 * GooglePlacesSource can implement the same interface later (Places Nearby
 * Search for the list, Place Photos for `photos`), and nothing else changes.
 */
export interface RestaurantSource {
  /** Human-readable note about where the data comes from, shown in the app. */
  readonly note: string
  list(): Promise<Restaurant[]>
}

export class FixedSource implements RestaurantSource {
  readonly note =
    'Real Barcelona restaurants from OpenStreetMap. Photos show the type of food and a similar dining room, not the place itself. Ratings, review counts, table times and "popular with" are sample values.'
  async list(): Promise<Restaurant[]> {
    return fixed as Restaurant[]
  }
}

export const restaurantSource: RestaurantSource = new FixedSource()

export const HOTEL_AREAS: { id: string; label: string; latitude: number; longitude: number }[] = [
  { id: 'gotic', label: 'Barri Gòtic', latitude: 41.3833, longitude: 2.1767 },
  { id: 'born', label: 'El Born', latitude: 41.3851, longitude: 2.1826 },
  { id: 'eixample', label: 'Eixample', latitude: 41.3915, longitude: 2.165 },
  { id: 'gracia', label: 'Gràcia', latitude: 41.4036, longitude: 2.157 },
  { id: 'barceloneta', label: 'Barceloneta', latitude: 41.3795, longitude: 2.1894 },
  { id: 'poblesec', label: 'Poble-sec', latitude: 41.3735, longitude: 2.163 },
]
