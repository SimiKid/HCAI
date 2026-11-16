import type { Restaurant } from '../types'

/** How early the group has to reserve a place. Sample data, read from `sample.booking`. */
export type Lead = 'walk-in' | 'same-day' | 'day-before' | 'before-trip'

/** Earliest booking first: the order of the groups under "Book early first". */
export const LEADS: Lead[] = ['before-trip', 'day-before', 'same-day', 'walk-in']

// @hcai AMR-04 Every place says how early to reserve in the same four short labels on the swipe card, the list and the bill, no dates to pick
export const LEAD_LABEL: Record<Lead, string> = {
  'walk-in': 'Walk in',
  'same-day': 'Book the same day',
  'day-before': 'Book a day ahead',
  'before-trip': 'Book before you go',
}

/** How early a place has to be reserved. A place with easy walk-ins needs no booking at all. */
export function leadOf(r: Restaurant): Lead {
  const { walkIn, bookAhead } = r.sample.booking
  return walkIn === 'easy' ? 'walk-in' : bookAhead
}

/**
 * The double sort behind "Book early first": groups by how early a place has to be reserved,
 * earliest first, and keeps the given order (the group ranking) inside each group. Empty groups are left out.
 */
export function byLead<T extends { restaurant: Restaurant }>(items: T[]): { lead: Lead; items: T[] }[] {
  return LEADS.map((lead) => ({ lead, items: items.filter((x) => leadOf(x.restaurant) === lead) })).filter((g) => g.items.length > 0)
}
