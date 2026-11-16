import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Features, Member, Place, Restaurant, Weights } from './types'
import { resolveStay } from './data/source'
import { simulatedMembers } from './data/members'
import { featuresOf } from './model/features'
import { learn } from './model/learn'
import { tripNights } from './model/rank'
import { bookingNight, type BookingMode } from './model/booking'
import { initialState, migrateState, personalOf, type State } from './state'

export { initialState, migrateState, patchPersonal, patchTrip, personalOf, type State, type TripState } from './state'

// same key as v2: migrateState() moves an old saved state to the new shape
const KEY = 'restaurant-tinder-v2'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? migrateState(JSON.parse(raw)) : initialState
  } catch {
    return initialState
  }
}

interface Store {
  state: State
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void
  restaurants: Restaurant[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ restaurants, children }: { restaurants: Restaurant[]; children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  // profile, swipes and the learned taste stay in this browser's storage, nothing is sent to a server
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* private mode: the app still works for this visit */
    }
  }, [state])
  const store = useMemo<Store>(
    () => ({
      state,
      restaurants,
      set: (patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })),
    }),
    [state, restaurants],
  )
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export interface Group {
  /** Where the group stays, a preset area or a custom place. All walking times start here. */
  hotel: Place
  features: Record<string, Features>
  members: Member[]
  weights: Record<string, Weights>
  /** The member who swipes and pins right now. */
  actor: Member
}

export function useGroup(): Group {
  const { state, restaurants } = useStore()
  const stayKey = JSON.stringify(state.trip.stay)
  const hotel = useMemo(() => resolveStay(state.trip.stay), [stayKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const features = useMemo(
    () => Object.fromEntries(restaurants.map((r) => [r.id, featuresOf(r, hotel)])),
    [restaurants, hotel],
  )
  const sims = useMemo(() => simulatedMembers(restaurants, features), [restaurants, features])
  return useMemo(() => {
    const mine = personalOf(state, 'me')
    const me: Member = {
      id: 'me',
      name: state.name.trim() || 'You',
      color: '#E0144C',
      avatar: state.avatar,
      diets: state.diets,
      allergies: state.allergies,
      tripPrefs: mine.prefs,
      customPrefs: mine.customPrefs,
      mustHaves: mine.mustHaves,
      budget: mine.budget,
      swipes: state.swipes.me ?? [],
      muted: state.muted.me ?? [],
      sharesReasons: state.share.me ?? false,
      simulated: false,
    }
    const members = [
      me,
      ...sims.map((m) => {
        const own = personalOf(state, m.id, { prefs: m.tripPrefs, customPrefs: m.customPrefs, mustHaves: m.mustHaves, budget: m.budget })
        return {
        ...m,
        tripPrefs: own.prefs,
        customPrefs: own.customPrefs,
        mustHaves: own.mustHaves,
        budget: own.budget,
        swipes: [...m.swipes, ...(state.swipes[m.id] ?? [])],
        muted: state.muted[m.id] ?? [],
        sharesReasons: state.share[m.id] ?? m.sharesReasons,
        }
      }),
    ]
    const weights = Object.fromEntries(
      members.map((m) => [m.id, learn(m.tripPrefs, m.swipes, features, m.muted)]),
    )
    const actor = members.find((m) => m.id === state.actingAs) ?? me
    return { hotel, features, members, weights, actor }
  }, [state, sims, features, hotel])
}

export interface Night {
  /** ISO date of the chosen night, empty when the trip has no valid dates. */
  iso: string
  /** Short form, for example "Fri 20 Nov". */
  label: string
  /** For example "Friday". */
  weekday: string
  /** All nights of the trip, to choose from. */
  nights: string[]
}

export function nightLabel(iso: string): string {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
}

/** The night the group plans dinner for. Falls back to the first night when the trip dates change. */
export function useNight(): Night {
  const { state } = useStore()
  const nights = tripNights(state.trip.from, state.trip.to)
  const iso = nights.includes(state.night) ? state.night : (nights[0] ?? '')
  const weekday = iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' }) : ''
  return { iso, label: nightLabel(iso), weekday, nights }
}

export interface Booking {
  when: BookingMode
  /** ISO date of the dinner the mode plans for: tonight, tomorrow, or the picked night of the trip. */
  night: string
  /** For example "Fri 20 Nov". */
  nightLabel: string
}

/** The group's booking mode and the night it points at. Pass when, night and party size to rankGroup. */
export function useBooking(): Booking {
  const { state } = useStore()
  const night = bookingNight(state.when, state.trip.from, state.trip.to, state.night)
  return { when: state.when, night, nightLabel: nightLabel(night) }
}

// one tap erases everything the app learned about me, a second one deletes the whole profile
export function eraseLearning(s: State, memberId: string): Partial<State> {
  return {
    swipes: { ...s.swipes, [memberId]: [] },
    muted: { ...s.muted, [memberId]: [] },
  }
}

export function deleteProfile(): State {
  return initialState
}
