import type { Allergy, Budget, Diet, MustHave, PersonalTrip, Stay, Swipe, TripPref } from './types'
import type { BookingMode } from './model/booking'
import type { GroupRule } from './model/rank'

/** Shared by the whole group. Whoever starts the trip sets it, people who join get it filled in. */
// @hcai MM-01 The trip (stay, dates) is shared and set once by its starter, personal mood and must-haves live per member, so nobody mistakes their own wishes for group settings
export interface TripState {
  code: string
  /** 'owner' when this person started the trip, 'guest' when they joined by invite or code. */
  role: 'owner' | 'guest'
  stay: Stay
  from: string
  to: string
}

export interface State {
  /** Shape version of the saved state, see migrateState(). */
  v: number
  stage: 'welcome' | 'profile' | 'trip' | 'invite' | 'details' | 'app'
  name: string
  avatar: string
  diets: Diet[]
  allergies: Allergy[]
  trip: TripState
  /** Each member's own settings for this trip, by member id. Private to that member. Simulated members fall back to their persona. */
  personal: Record<string, PersonalTrip>
  /** When the group wants to eat. Drives table availability in the ranking. */
  when: BookingMode
  /** The night of the trip the group plans dinner for in 'trip' mode, as an ISO date. Empty means the first night. */
  night: string
  /** True once this person has seen the overview dashboard after setup. */
  seenDashboard: boolean
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

export const STATE_VERSION = 3

export const EMPTY_PERSONAL: PersonalTrip = { prefs: [], customPrefs: [], mustHaves: [], budget: null }

export const initialState: State = {
  v: STATE_VERSION,
  stage: 'welcome',
  name: '',
  avatar: '',
  diets: [],
  allergies: [],
  trip: { code: '', role: 'guest', stay: { kind: 'area', id: 'gotic' }, from: '2026-11-20', to: '2026-11-23' },
  personal: {},
  when: 'trip',
  night: '',
  seenDashboard: false,
  swipes: {},
  muted: {},
  pin: null,
  showPopularWith: false,
  share: {},
  rule: 'average',
  actingAs: 'me',
}

const MOODS: TripPref[] = ['traditional', 'trendy', 'local', 'treat', 'near']
const MODES: BookingMode[] = ['now', 'tomorrow', 'trip']
const STAGES: State['stage'][] = ['welcome', 'profile', 'trip', 'invite', 'details', 'app']

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
 * Old shapes (v2: trip.hotelId and trip.prefs) are moved to their new place, unknown values fall back to defaults.
 */
export function migrateState(raw: unknown): State {
  if (!isObj(raw)) return initialState
  const s = { ...initialState, ...raw } as State & Record<string, unknown>
  const oldTrip = isObj(raw.trip) ? raw.trip : {}
  const trip: TripState = {
    code: typeof oldTrip.code === 'string' ? oldTrip.code : '',
    role: oldTrip.role === 'owner' ? 'owner' : 'guest',
    stay: migrateStay(oldTrip),
    from: typeof oldTrip.from === 'string' ? oldTrip.from : initialState.trip.from,
    to: typeof oldTrip.to === 'string' ? oldTrip.to : initialState.trip.to,
  }
  const personal: Record<string, PersonalTrip> = {}
  if (isObj(raw.personal)) for (const [id, p] of Object.entries(raw.personal)) personal[id] = migratePersonal(p)
  if (!personal.me && 'prefs' in oldTrip) personal.me = migratePersonal({ prefs: oldTrip.prefs })
  const muted: Record<string, string[]> = {}
  if (isObj(raw.muted))
    for (const [id, list] of Object.entries(raw.muted)) muted[id] = strings(list).map((f) => (f === 'vibe:fancy' ? 'vibe:posh' : f))
  return {
    v: STATE_VERSION,
    stage: STAGES.includes(s.stage) ? s.stage : initialState.stage,
    name: typeof s.name === 'string' ? s.name : '',
    avatar: typeof s.avatar === 'string' ? s.avatar : '',
    diets: Array.isArray(s.diets) ? s.diets : [],
    allergies: Array.isArray(s.allergies) ? s.allergies : [],
    trip,
    personal,
    when: MODES.includes(s.when) ? s.when : initialState.when,
    night: typeof s.night === 'string' ? s.night : '',
    seenDashboard: s.seenDashboard === true,
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
