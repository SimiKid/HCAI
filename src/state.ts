import type { Allergy, Budget, Diet, MustHave, PersonalTrip, Stay, Swipe, TripPref } from './types'
import type { GroupRule } from './model/rank'

/** Shared by the whole group. Whoever starts the trip sets it, people who join get it filled in. */
// @hcai MM-01 The profile holds the person (name, diet, allergies), each trip holds its shared stay and dates set once by its starter, and every member's private mood and must-haves live with the trip, so nobody mistakes their own wishes for group settings
export interface TripState {
  code: string
  /** 'owner' when this person started the trip, 'guest' when they joined by invite or code. */
  role: 'owner' | 'guest'
  stay: Stay
  from: string
  to: string
}

/** A trip this person was on before the current one. Only where and when is kept. */
export interface PastTrip {
  code: string
  stay: Stay
  from: string
  to: string
}

export interface State {
  /** Shape version of the saved state, see migrateState(). */
  v: number
  stage: 'welcome' | 'profile' | 'trip' | 'invite' | 'details' | 'ready' | 'app'
  name: string
  avatar: string
  diets: Diet[]
  allergies: Allergy[]
  trip: TripState
  /** Earlier trips, newest first. One trip is active at a time. */
  pastTrips: PastTrip[]
  /** Each member's own settings for this trip, by member id. Private to that member. Simulated members fall back to their persona. */
  personal: Record<string, PersonalTrip>
  /** "Book early first": the ranking is grouped by how early a place has to be reserved. */
  bookEarly: boolean
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

export const STATE_VERSION = 4

export const EMPTY_PERSONAL: PersonalTrip = { prefs: [], customPrefs: [], mustHaves: [], budget: null }

export const initialState: State = {
  v: STATE_VERSION,
  stage: 'welcome',
  name: '',
  avatar: '',
  diets: [],
  allergies: [],
  trip: { code: '', role: 'guest', stay: { kind: 'area', id: 'gotic' }, from: '2026-11-20', to: '2026-11-23' },
  pastTrips: [],
  personal: {},
  bookEarly: false,
  swipes: {},
  muted: {},
  pin: null,
  showPopularWith: false,
  share: {},
  rule: 'average',
  actingAs: 'me',
}

const MOODS: TripPref[] = ['traditional', 'trendy', 'local', 'treat', 'near']
const STAGES: State['stage'][] = ['welcome', 'profile', 'trip', 'invite', 'details', 'ready', 'app']

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const strings = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [])

function migrateStay(raw: Record<string, unknown>): Stay {
  const s = raw.stay
  if (isObj(s) && s.kind === 'custom' && typeof s.latitude === 'number' && typeof s.longitude === 'number')
    return { kind: 'custom', label: typeof s.label === 'string' ? s.label : '', latitude: s.latitude, longitude: s.longitude }
  if (isObj(s) && s.kind === 'area' && typeof s.id === 'string') return { kind: 'area', id: s.id }
  // v2 kept the preset area as hotelId
  if (typeof raw.hotelId === 'string') return { kind: 'area', id: raw.hotelId }
  return initialState.trip.stay
}

function migrateTrip(raw: Record<string, unknown>): TripState {
  return {
    code: typeof raw.code === 'string' ? raw.code : '',
    role: raw.role === 'owner' ? 'owner' : 'guest',
    stay: migrateStay(raw),
    from: typeof raw.from === 'string' ? raw.from : initialState.trip.from,
    to: typeof raw.to === 'string' ? raw.to : initialState.trip.to,
  }
}

function migratePersonal(raw: unknown): PersonalTrip {
  if (!isObj(raw)) return EMPTY_PERSONAL
  const prefs = strings(raw.prefs)
  const b = isObj(raw.budget) ? Number(raw.budget.maxPriceLevel) : NaN
  // v2 had "Keep it cheap" as a trip preference, now it is a personal budget
  const budget: Budget | null =
    b >= 1 && b <= 4 ? { maxPriceLevel: b as Budget['maxPriceLevel'] } : prefs.includes('budget') ? { maxPriceLevel: 2 } : null
  return {
    // "Top rated" is gone: ratings are on every card
    prefs: prefs.filter((p): p is TripPref => (MOODS as string[]).includes(p)),
    customPrefs: strings(raw.customPrefs),
    mustHaves: Array.isArray(raw.mustHaves)
      ? raw.mustHaves.filter((h): h is MustHave => isObj(h) && typeof h.text === 'string').map((h) => ({ text: h.text }))
      : [],
    budget,
  }
}

/**
 * Turns whatever was saved in this browser into a valid current State.
 * Old shapes are moved to their new place (v2: trip.hotelId and trip.prefs), fields that no longer exist
 * (v3: the booking mode `when`, `night` and `seenDashboard`) are dropped, unknown values fall back to defaults.
 */
export function migrateState(raw: unknown): State {
  if (!isObj(raw)) return initialState
  const s = { ...initialState, ...raw } as State & Record<string, unknown>
  const oldTrip = isObj(raw.trip) ? raw.trip : {}
  const personal: Record<string, PersonalTrip> = {}
  if (isObj(raw.personal)) for (const [id, p] of Object.entries(raw.personal)) personal[id] = migratePersonal(p)
  if (!personal.me && 'prefs' in oldTrip) personal.me = migratePersonal({ prefs: oldTrip.prefs })
  const muted: Record<string, string[]> = {}
  if (isObj(raw.muted))
    for (const [id, list] of Object.entries(raw.muted)) muted[id] = strings(list).map((f) => (f === 'vibe:fancy' ? 'vibe:posh' : f))
  const pastTrips = Array.isArray(raw.pastTrips)
    ? raw.pastTrips.filter(isObj).map((t) => { const { code, stay, from, to } = migrateTrip(t); return { code, stay, from, to } })
    : []
  return {
    v: STATE_VERSION,
    stage: STAGES.includes(s.stage) ? s.stage : initialState.stage,
    name: typeof s.name === 'string' ? s.name : '',
    avatar: typeof s.avatar === 'string' ? s.avatar : '',
    diets: Array.isArray(s.diets) ? s.diets : [],
    allergies: Array.isArray(s.allergies) ? s.allergies : [],
    trip: migrateTrip(oldTrip),
    pastTrips,
    personal,
    bookEarly: s.bookEarly === true,
    swipes: isObj(s.swipes) ? s.swipes : {},
    muted,
    pin: isObj(s.pin) ? s.pin : null,
    showPopularWith: s.showPopularWith === true,
    share: isObj(s.share) ? s.share : {},
    rule: s.rule === 'least-misery' ? 'least-misery' : 'average',
    actingAs: typeof s.actingAs === 'string' ? s.actingAs : 'me',
  }
}

/** A member's own trip settings: what they saved, or the given fallback (a persona's defaults). */
export function personalOf(s: State, memberId: string, fallback: PersonalTrip = EMPTY_PERSONAL): PersonalTrip {
  return s.personal[memberId] ?? fallback
}

/** State patch that changes one member's own trip settings. */
export function patchPersonal(s: State, memberId: string, patch: Partial<PersonalTrip>, fallback?: PersonalTrip): Partial<State> {
  return { personal: { ...s.personal, [memberId]: { ...personalOf(s, memberId, fallback), ...patch } } }
}

/** State patch that changes the shared trip (stay, dates). */
export function patchTrip(s: State, patch: Partial<TripState>): Partial<State> {
  return { trip: { ...s.trip, ...patch } }
}

/**
 * State patch that starts a new trip and keeps the profile (name, avatar, diet, allergies, settings, forgotten tastes).
 * The current trip moves to past trips with only where and when. Everything that belonged to it starts fresh:
 * the group's swipes, private wishes, pin and fairness rule. Then setup continues at the trip step.
 */
export function startNewTrip(s: State): Partial<State> {
  const { code, stay, from, to } = s.trip
  return {
    stage: 'trip',
    pastTrips: code ? [{ code, stay, from, to }, ...s.pastTrips] : s.pastTrips,
    trip: initialState.trip,
    personal: {},
    swipes: {},
    pin: null,
    rule: initialState.rule,
    actingAs: 'me',
  }
}
