import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Allergy, Diet, Features, LatLng, Member, Restaurant, Swipe, TripPref, Weights } from './types'
import { HOTEL_AREAS } from './data/source'
import { simulatedMembers } from './data/members'
import { featuresOf } from './model/features'
import { learn } from './model/learn'
import { tripNights, type GroupRule } from './model/rank'

export interface State {
  stage: 'welcome' | 'profile' | 'trip' | 'invite' | 'details' | 'app'
  name: string
  avatar: string
  diets: Diet[]
  allergies: Allergy[]
  /** `role` is 'owner' when this person started the trip, 'guest' when they joined by invite or code. */
  trip: { code: string; role: 'owner' | 'guest'; hotelId: string; from: string; to: string; prefs: TripPref[] }
  /** The night of the trip the group plans dinner for, as an ISO date. Empty means the first night. */
  night: string
  /** Swipes made in this app, by member id. Simulated members also have seeded swipes. */
  swipes: Record<string, Swipe[]>
  muted: Record<string, string[]>
  pin: { restaurantId: string; by: string } | null
  showPopularWith: boolean
  /** Members who let the group see their reasons by name. Missing means the member's default. */
  share: Record<string, boolean>
  /** How member scores become one group score. */
  rule: GroupRule
  /** Demo only: swipe and pin as another group member. */
  actingAs: string
}

const KEY = 'restaurant-tinder-v2'

export const initialState: State = {
  stage: 'welcome',
  name: '',
  avatar: '',
  diets: [],
  allergies: [],
  trip: { code: '', role: 'guest', hotelId: 'gotic', from: '2026-11-20', to: '2026-11-23', prefs: [] },
  night: '',
  swipes: {},
  muted: {},
  pin: null,
  showPopularWith: false,
  share: {},
  rule: 'average',
  actingAs: 'me',
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
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
  hotel: LatLng & { label: string }
  features: Record<string, Features>
  members: Member[]
  weights: Record<string, Weights>
  /** The member who swipes and pins right now. */
  actor: Member
}

export function useGroup(): Group {
  const { state, restaurants } = useStore()
  const hotel = HOTEL_AREAS.find((h) => h.id === state.trip.hotelId) ?? HOTEL_AREAS[0]
  const features = useMemo(
    () => Object.fromEntries(restaurants.map((r) => [r.id, featuresOf(r, hotel)])),
    [restaurants, hotel],
  )
  const sims = useMemo(() => simulatedMembers(restaurants, features), [restaurants, features])
  return useMemo(() => {
    const me: Member = {
      id: 'me',
      name: state.name.trim() || 'You',
      color: '#E0144C',
      avatar: state.avatar,
      diets: state.diets,
      allergies: state.allergies,
      tripPrefs: state.trip.prefs,
      swipes: state.swipes.me ?? [],
      muted: state.muted.me ?? [],
      sharesReasons: state.share.me ?? false,
      simulated: false,
    }
    const members = [
      me,
      ...sims.map((m) => ({
        ...m,
        swipes: [...m.swipes, ...(state.swipes[m.id] ?? [])],
        muted: state.muted[m.id] ?? [],
        sharesReasons: state.share[m.id] ?? m.sharesReasons,
      })),
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
