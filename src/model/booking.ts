import type { BookAhead, Restaurant, WalkIn } from '../types'

/** When the group wants to eat: tonight on the spot, tomorrow, or a night booked before the trip. */
export type BookingMode = 'now' | 'tomorrow' | 'trip'

export const BOOKING_MODES: { value: BookingMode; label: string; hint: string }[] = [
  { value: 'now', label: 'Now', hint: 'Tonight, without a booking or with a same-day one' },
  { value: 'tomorrow', label: 'Tomorrow', hint: 'Book today for tomorrow night' },
  { value: 'trip', label: 'Before the trip', hint: 'Book ahead for a night of the trip' },
]

/** How a place can be had in the chosen mode, best first. */
export type Availability = 'walk-in' | 'book' | 'maybe' | 'full'

export interface BookingStatus {
  mode: BookingMode
  availability: Availability
  /** 0 to 1, how likely the group gets a table. Only for sorting, never shown as a number. */
  score: number
  /** Short line for a card or row, for example "Walk in now" or "Book today for 20:30". */
  label: string
  /** The table time, when a booking is the way in. */
  time?: string
}

export type Reservation =
  | { kind: 'walk-in' }
  | { kind: 'slot'; time: string }
  | { kind: 'none' }

const noon = (iso: string) => new Date(iso + 'T12:00:00')
const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The nights of a trip as ISO dates, from the first to the last day, at most a week. */
export function tripNights(from: string, to: string): string[] {
  const day = noon(from)
  const last = noon(to)
  if (Number.isNaN(day.getTime())) return []
  const nights: string[] = []
  while (nights.length < 7 && (nights.length === 0 || day <= last)) {
    nights.push(isoOf(day))
    day.setDate(day.getDate() + 1)
  }
  return nights
}

/** Sample rule: Friday and Saturday are the busy nights. */
export function isBusyNight(night: string): boolean {
  const weekday = noon(night).getDay()
  return weekday === 5 || weekday === 6
}

/** The table times of a place on one night. On a busy night the two earliest times are taken. */
export function slotsOn(r: Restaurant, night?: string): Restaurant['sample']['reservation']['slots'] {
  const { slots } = r.sample.reservation
  return night && isBusyNight(night) ? slots.slice(2) : slots
}

/** Largest party that can walk in. On a busy night a walk-in only works for a smaller party. */
export function walkInLimit(r: Restaurant, night?: string): number {
  return r.sample.reservation.walkInUpTo - (night && isBusyNight(night) ? 2 : 0)
}

/** When a party of this size can expect a table. Without a night, an ordinary weekday is assumed. */
export function expectedReservation(r: Restaurant, partySize: number, night?: string): Reservation {
  if (partySize <= walkInLimit(r, night)) return { kind: 'walk-in' }
  const slot = slotsOn(r, night).find((s) => s.maxParty >= partySize)
  return slot ? { kind: 'slot', time: slot.time } : { kind: 'none' }
}

/**
 * The night a mode plans for, as an ISO date.
 * 'now': today if today is a night of the trip, otherwise the first night (the prototype acts as if the group is there).
 * 'tomorrow': the night after that.
 * 'trip': the night the group picked, or the first night.
 */
export function bookingNight(mode: BookingMode, from: string, to: string, planned = '', today: Date = new Date()): string {
  const nights = tripNights(from, to)
  const first = nights[0] ?? isoOf(today)
  if (mode === 'trip') return nights.includes(planned) ? planned : first
  const tonight = nights.includes(isoOf(today)) ? isoOf(today) : first
  if (mode === 'now') return tonight
  const next = noon(tonight)
  next.setDate(next.getDate() + 1)
  return isoOf(next)
}

/**
 * Can the group get a table in this mode? Follows the table-time rule: on Friday and Saturday
 * the two earliest times are gone and walk-ins only work for smaller parties.
 * - now: walk in, or a same-day booking for a place that takes them; otherwise maybe or full.
 * - tomorrow: a booking a day ahead works unless the place books out before the trip.
 * - trip: booked weeks ahead, every table time is still open.
 */
export function bookingStatus(r: Restaurant, mode: BookingMode, partySize: number, night?: string): BookingStatus {
  const { walkIn, bookAhead } = r.sample.booking
  const walkInFits = partySize <= walkInLimit(r, night)
  if (mode === 'now') {
    if (walkInFits) return { mode, availability: 'walk-in', score: 1, label: 'Walk in now' }
    const slot = bookAhead === 'same-day' ? slotsOn(r, night).find((s) => s.maxParty >= partySize) : undefined
    if (slot) return { mode, availability: 'book', score: 0.75, label: `Book today for ${slot.time}`, time: slot.time }
    if (walkIn !== 'rare') return { mode, availability: 'maybe', score: 0.3, label: 'Maybe a walk-in, call first' }
    return { mode, availability: 'full', score: 0, label: bookAhead === 'before-trip' ? 'Booked out tonight' : 'No table tonight' }
  }
  if (mode === 'tomorrow') {
    const slot = bookAhead !== 'before-trip' ? slotsOn(r, night).find((s) => s.maxParty >= partySize) : undefined
    if (slot) return { mode, availability: 'book', score: 1, label: `Book now for ${slot.time} tomorrow`, time: slot.time }
    if (walkInFits) return { mode, availability: 'walk-in', score: 0.8, label: 'Walk in tomorrow' }
    if (bookAhead === 'before-trip') return { mode, availability: 'full', score: 0, label: 'Books out weeks ahead' }
    return { mode, availability: 'full', score: 0, label: `No table for ${partySize} tomorrow` }
  }
  const slot = r.sample.reservation.slots.find((s) => s.maxParty >= partySize)
  if (slot) return { mode, availability: 'book', score: 1, label: bookAheadLabel(bookAhead), time: slot.time }
  if (walkInFits) return { mode, availability: 'walk-in', score: 0.8, label: 'Walk-in only' }
  return { mode, availability: 'full', score: 0, label: `No table for ${partySize}` }
}

/**
 * Sort key under a mode, lower comes first. In 'now' (ad-hoc) a place you can get into tonight
 * comes before a maybe, and a maybe before a full place. In the other modes only a place with
 * no table sinks. Places are never hidden: the group still sees them, marked.
 */
export function bookingTier(status: BookingStatus): number {
  if (status.mode === 'now') return status.availability === 'full' ? 2 : status.availability === 'maybe' ? 1 : 0
  return status.availability === 'full' ? 1 : 0
}

export function walkInLabel(w: WalkIn): string {
  return w === 'easy' ? 'Walk-ins easy' : w === 'sometimes' ? 'Walk-ins sometimes' : 'Walk-ins rare'
}

export function bookAheadLabel(b: BookAhead): string {
  return b === 'same-day' ? 'Book on the day' : b === 'day-before' ? 'Book a day ahead' : 'Book before you travel'
}
