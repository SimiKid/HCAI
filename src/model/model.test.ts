import { describe, expect, it } from 'vitest'
import { VIBES, type Member, type Restaurant } from '../types'
import data from '../data/restaurants.barcelona.json'
import { moreSwipes, simulatedMembers } from '../data/members'
import { resolveStay } from '../data/source'
import { initialState, migrateState, STATE_VERSION } from '../state'
import { distanceKm, featuresOf } from './features'
import { bookingNight, bookingStatus, bookingTier } from './booking'
import { matchText, personalFit } from './musthave'
import { confidence, learn, priorWeights, score, tasteProfile, update } from './learn'
import { conflictsFor, expectedReservation, groupPlaces, isBusyNight, leftToSwipe, rankGroup, swipeOn, tripNights, type Ranked } from './rank'
import { matchLevel, ownFitReasons, rankWithout, reasonsFor, sharedReasons, swipeEffect } from './explain'
import { tableMatch } from './match'

const restaurants = data as Restaurant[]
const hotel = { latitude: 41.3833, longitude: 2.1767 }
const features = Object.fromEntries(restaurants.map((r) => [r.id, featuresOf(r, hotel)]))
const byType = (t: string) => restaurants.filter((r) => r.primaryType === t)
const member = (over: Partial<Member>): Member => ({
  id: 'x', name: 'X', color: '#000', avatar: '', diets: [], allergies: [], tripPrefs: [], customPrefs: [], mustHaves: [], budget: null, swipes: [], muted: [], sharesReasons: false, simulated: false, ...over,
})

describe('data', () => {
  it('has 40 restaurants with a photo, rating and review count', () => {
    expect(restaurants).toHaveLength(40)
    for (const r of restaurants) {
      expect(r.photos[0].src).toMatch(/^\/photos\//)
      expect(r.rating).toBeGreaterThanOrEqual(4)
      expect(r.userRatingCount).toBeGreaterThan(0)
    }
  })
})

describe('learning', () => {
  it('a like raises and a skip lowers the score of that place', () => {
    const x = features[byType('pizza')[0].id]
    const before = score({}, x)
    expect(score(update({}, x, true), x)).toBeGreaterThan(before)
    expect(score(update({}, x, false), x)).toBeLessThan(before)
  })

  it('likes carry over to similar places', () => {
    const [a, b] = byType('pizza')
    const swipes = [{ restaurantId: a.id, liked: true }, { restaurantId: byType('japanese')[0].id, liked: false }]
    const w = learn([], swipes, features)
    expect(score(w, features[b.id])).toBeGreaterThan(score(w, features[byType('japanese')[1].id]))
  })

  it('trip preferences set the starting point before any swipe', () => {
    const w = priorWeights(['treat'])
    const cheap = restaurants.find((r) => r.priceLevel === 1)!
    const pricey = restaurants.find((r) => r.priceLevel === 4)!
    expect(score(w, features[pricey.id])).toBeGreaterThan(score(w, features[cheap.id]))
  })

  it('one swipe never flips a strong preference', () => {
    const x = features[byType('tapas')[0].id]
    let w = {}
    for (let i = 0; i < 10; i++) w = update(w, x, true)
    expect(score(update(w, x, false), x)).toBeGreaterThan(0.5)
  })

  it('a muted taste is forgotten', () => {
    const a = byType('pizza')[0]
    const w = learn([], [{ restaurantId: a.id, liked: true }], features, ['cuisine:pizza'])
    expect(w['cuisine:pizza']).toBeUndefined()
  })

  it('confidence grows with the number of swipes', () => {
    expect(confidence(3).level).toBe('low')
    expect(confidence(12).level).toBe('medium')
    expect(confidence(30).level).toBe('high')
  })
})

describe('group ranking', () => {
  const a = member({ id: 'a' })
  const b = member({ id: 'b' })
  const weights = { a: { 'cuisine:pizza': 3 }, b: { 'cuisine:tapas': 3 } }

  it('the group score is the plain average of the member scores', () => {
    const { ranked } = rankGroup({ restaurants, members: [a, b], weights, features })
    for (const r of ranked) {
      expect(r.groupScore).toBeCloseTo((r.memberScores.a + r.memberScores.b) / 2, 10)
    }
  })

  it('swipe count gives no extra weight', () => {
    // swipes on a place outside the list: only their number differs, not what is known about these places
    const heavy = member({ id: 'a', swipes: Array(40).fill({ restaurantId: 'somewhere-else', liked: true }) })
    const one = rankGroup({ restaurants, members: [a, b], weights, features }).ranked.map((r) => r.restaurant.id)
    const two = rankGroup({ restaurants, members: [heavy, b], weights, features }).ranked.map((r) => r.restaurant.id)
    expect(two).toEqual(one)
  })

  it('a diet or allergy removes the place for the whole group', () => {
    const veg = member({ id: 'b', diets: ['vegetarian'], allergies: ['nuts'] })
    const { ranked, blocked } = rankGroup({ restaurants, members: [a, veg], weights, features })
    expect(blocked.length).toBeGreaterThan(0)
    expect(ranked.length + blocked.length).toBe(40)
    for (const r of ranked) expect(conflictsFor(r.restaurant, veg)).toHaveLength(0)
  })

  it('the people filter changes the order', () => {
    const both = rankGroup({ restaurants, members: [a, b], weights, features }).ranked[0].restaurant
    const onlyA = rankGroup({ restaurants, members: [a], weights, features }).ranked[0].restaurant
    expect(onlyA.primaryType).toBe('pizza')
    expect(['pizza', 'tapas']).toContain(both.primaryType)
  })

  it('a pin puts one place on top and nothing else moves', () => {
    const plain = rankGroup({ restaurants, members: [a, b], weights, features }).ranked
    const last = plain[plain.length - 1].restaurant.id
    const pinned = rankGroup({ restaurants, members: [a, b], weights, features, pinnedId: last }).ranked
    expect(pinned[0].restaurant.id).toBe(last)
    expect(pinned[0].pinned).toBe(true)
    expect(pinned.slice(1).map((r) => r.restaurant.id)).toEqual(plain.slice(0, -1).map((r) => r.restaurant.id))
  })

  it('a real swipe beats the guess for that member', () => {
    const tapas = byType('tapas')[0].id
    const pizza = byType('pizza')[0].id
    // a loves pizza on paper, but skipped this pizza place and liked this tapas place
    const swiped = member({ id: 'a', swipes: [{ restaurantId: pizza, liked: false }, { restaurantId: tapas, liked: true }] })
    const { ranked } = rankGroup({ restaurants, members: [swiped, b], weights, features })
    const scoreOf = (id: string) => ranked.find((r) => r.restaurant.id === id)!.memberScores.a
    expect(scoreOf(tapas)).toBeGreaterThanOrEqual(0.9)
    expect(scoreOf(pizza)).toBeLessThanOrEqual(0.1)
    expect(matchLevel(scoreOf(tapas)).level).toBe('strong')
    expect(matchLevel(scoreOf(pizza)).level).toBe('weak')
  })

  it('knows which places are left to swipe for a member', () => {
    const vegan = member({ id: 'v', diets: ['vegan'], allergies: ['nuts'] })
    const places = groupPlaces(restaurants, [a, vegan])
    expect(places.length).toBeGreaterThan(0)
    expect(places.length).toBeLessThan(8)
    for (const r of places) expect(conflictsFor(r, vegan)).toHaveLength(0)
    expect(leftToSwipe(a, places)).toBe(places.length)
    const done = member({ id: 'a', swipes: places.map((r) => ({ restaurantId: r.id, liked: true })) })
    expect(leftToSwipe(done, places)).toBe(0)
    expect(swipeOn(done, places[0].id)).toBe(true)
    expect(swipeOn(a, places[0].id)).toBeNull()
  })

  it('a boost re-ranks without touching the learned weights', () => {
    const { ranked } = rankGroup({ restaurants, members: [a], weights, features, boost: { 'price:high': 8 } })
    expect(ranked[0].restaurant.priceLevel).toBeGreaterThanOrEqual(3)
    expect(weights.a).toEqual({ 'cuisine:pizza': 3 })
  })
})

describe('fairness rule', () => {
  it('nobody left unhappy ranks by the least happy member', () => {
    const a = member({ id: 'a' })
    const b = member({ id: 'b' })
    const weights = { a: { 'cuisine:pizza': 4 }, b: { 'cuisine:pizza': -4, 'cuisine:tapas': 0.5 } }
    const base = { restaurants, members: [a, b], weights, features }
    const misery = rankGroup({ ...base, rule: 'least-misery' }).ranked
    for (const r of misery) expect(r.groupScore).toBeCloseTo(Math.min(r.memberScores.a, r.memberScores.b), 10)
    expect(misery[0].restaurant.primaryType).not.toBe('pizza')
  })
})

describe('asking why', () => {
  it('a like "because of the vibe" teaches the vibe, and nothing else on the card', () => {
    const r = byType('tapas')[0]
    const plain = learn([], [{ restaurantId: r.id, liked: true }], features)
    const vibe = learn([], [{ restaurantId: r.id, liked: true, because: 'vibe' }], features)
    const v = `vibe:${r.sample.vibes[0]}`
    expect(vibe[v]).toBeGreaterThan(plain[v])
    expect(plain['cuisine:tapas']).toBeGreaterThan(0)
    expect(vibe['cuisine:tapas']).toBeUndefined()
  })
})

describe('feedback after a swipe', () => {
  const r = byType('tapas')[0]
  const x = features[r.id]

  it('names only what the profile now shows as a like', () => {
    const before = {}
    const after = learn([], [{ restaurantId: r.id, liked: true, because: 'food' }], features)
    const named = swipeEffect(before, after, true)
    expect(named).toContain('cuisine:tapas')
    const chips = tasteProfile(after).filter((t) => t.weight > 0).map((t) => t.feature)
    for (const f of named) expect(chips).toContain(f)
  })

  it('stays silent when a like does not turn a skip into a like', () => {
    const before = { 'cuisine:tapas': -3 }
    const after = update(before, x, true)
    expect(after['cuisine:tapas']).toBeGreaterThan(before['cuisine:tapas'])
    expect(swipeEffect(before, after, true)).not.toContain('cuisine:tapas')
  })

  it('names skips after a skip, never likes', () => {
    const before = {}
    const after = learn([], [{ restaurantId: r.id, liked: false, because: 'food' }], features)
    expect(swipeEffect(before, after, false)).toContain('cuisine:tapas')
    expect(swipeEffect(before, after, true)).toEqual([])
  })
})

describe('privacy in the group', () => {
  it('names only the viewer and members who share, and counts the rest', () => {
    const x = features[byType('pizza')[0].id]
    const me = member({ id: 'me' })
    const open = member({ id: 'o', sharesReasons: true })
    const shy1 = member({ id: 's1', name: 'Shy' })
    const shy2 = member({ id: 's2', name: 'Shyer' })
    const w = { 'cuisine:pizza': 2 }
    const out = sharedReasons([me, open, shy1, shy2], { me: w, o: w, s1: w, s2: w }, x, 'me')
    expect(out.named.map((n) => n.member.id)).toEqual(['me', 'o'])
    expect(out.summary).toEqual(['Two people like pizza'])
    expect(out.summary.join(' ')).not.toMatch(/Shy/)
  })
})

describe('reservation', () => {
  it('bigger parties never get an earlier table', () => {
    for (const r of restaurants) {
      const small = expectedReservation(r, 2)
      const big = expectedReservation(r, 6)
      if (big.kind === 'walk-in') expect(small.kind).toBe('walk-in')
      if (small.kind === 'slot' && big.kind === 'slot') expect(big.time >= small.time).toBe(true)
    }
  })

  it('a trip has one night per day, at most a week', () => {
    expect(tripNights('2026-11-20', '2026-11-23')).toEqual(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'])
    expect(tripNights('2026-11-20', '2026-11-19')).toEqual(['2026-11-20'])
    expect(tripNights('2026-11-20', '2026-12-31')).toHaveLength(7)
    expect(tripNights('', '')).toEqual([])
  })

  it('a busy night never gives an earlier table', () => {
    const friday = '2026-11-20'
    const sunday = '2026-11-22'
    expect(isBusyNight(friday)).toBe(true)
    expect(isBusyNight(sunday)).toBe(false)
    for (const r of restaurants) {
      const quiet = expectedReservation(r, 5, sunday)
      const busy = expectedReservation(r, 5, friday)
      if (busy.kind === 'walk-in') expect(quiet.kind).toBe('walk-in')
      if (quiet.kind === 'slot' && busy.kind === 'slot') expect(busy.time >= quiet.time).toBe(true)
    }
  })
})

describe('table match', () => {
  const place = restaurants[0].id
  const like = { restaurantId: place, liked: true }
  const skip = { restaurantId: place, liked: false }

  it('needs two other likes and no skip', () => {
    const a = member({ id: 'a', swipes: [like] })
    const b = member({ id: 'b', swipes: [like] })
    const c = member({ id: 'c' })
    const me = member({ id: 'me', swipes: [like] })
    const match = tableMatch(place, 'me', [me, a, b, c])
    expect(match?.fans.map((m) => m.id)).toEqual(['a', 'b'])
    expect(match?.unseen.map((m) => m.id)).toEqual(['c'])
    expect(tableMatch(place, 'me', [me, a, c])).toBeNull()
    expect(tableMatch(place, 'me', [me, a, b, member({ id: 'd', swipes: [skip] })])).toBeNull()
  })

  it('the latest swipe on a place counts', () => {
    const a = member({ id: 'a', swipes: [like] })
    const changed = member({ id: 'b', swipes: [skip, like] })
    expect(tableMatch(place, 'me', [a, changed])?.fans).toHaveLength(2)
  })
})

describe('explanations', () => {
  it('names the features that moved the score', () => {
    const x = features[byType('pizza')[0].id]
    const reasons = reasonsFor({ 'cuisine:pizza': 2, 'price:low': -1 }, x)
    expect(reasons[0]).toMatchObject({ feature: 'cuisine:pizza', positive: true, text: 'likes pizza' })
  })

  it('never puts a number in the match label', () => {
    for (const s of [0.1, 0.5, 0.6, 0.9]) expect(matchLevel(s).label).not.toMatch(/\d/)
  })

  it('counterfactual rank drops the member', () => {
    const a = member({ id: 'a' })
    const b = member({ id: 'b' })
    const weights = { a: { 'cuisine:pizza': 3 }, b: { 'cuisine:pizza': -3 } }
    const input = { restaurants, members: [a, b], weights, features }
    const pizza = byType('pizza')[0].id
    expect(rankWithout(input, pizza, 'b')!).toBeLessThanOrEqual(3)
  })
})

describe('simulated members', () => {
  it('are the same on every run and have different swipe counts', () => {
    const one = simulatedMembers(restaurants, features)
    const two = simulatedMembers(restaurants, features)
    expect(one).toEqual(two)
    expect(one.map((m) => m.swipes.length)).toEqual([28, 9, 17, 36])
    for (const m of one) {
      const likes = m.swipes.filter((s) => s.liked).length
      expect(likes).toBeGreaterThan(0)
      expect(likes).toBeLessThan(m.swipes.length)
    }
  })

  it('a nudge adds new places only and is the same on every run', () => {
    const jonas = simulatedMembers(restaurants, features)[1]
    const seen = jonas.swipes.map((s) => s.restaurantId)
    const more = moreSwipes(jonas.id, restaurants, features, seen, 12)
    expect(more).toHaveLength(12)
    expect(more.some((s) => seen.includes(s.restaurantId))).toBe(false)
    expect(moreSwipes(jonas.id, restaurants, features, seen, 12)).toEqual(more)
    expect(moreSwipes('nobody', restaurants, features, [], 12)).toEqual([])
  })
})

const byName = (name: string) => restaurants.find((r) => r.displayName === name)!

describe('sample data for round 1', () => {
  it('every place has a short top review, two or three vibe tags, dishes and booking info', () => {
    for (const r of restaurants) {
      expect(r.sample.topReview.text.length).toBeLessThanOrEqual(120)
      expect(r.sample.topReview.rating).toBeGreaterThanOrEqual(1)
      expect(r.sample.vibes.length).toBeGreaterThanOrEqual(2)
      expect(r.sample.vibes.length).toBeLessThanOrEqual(3)
      for (const v of r.sample.vibes) expect(VIBES).toContain(v)
      expect(r.sample.dishes.length).toBeGreaterThan(0)
    }
  })

  it('walk-in info agrees with the table times', () => {
    for (const r of restaurants) {
      const up = r.sample.reservation.walkInUpTo
      expect(r.sample.booking.walkIn).toBe(up >= 4 ? 'easy' : up >= 2 ? 'sometimes' : 'rare')
      if (r.priceLevel === 4) expect(r.sample.booking.bookAhead).toBe('before-trip')
    }
  })
})

describe('booking mode', () => {
  const weekday = '2026-11-19' // Thursday
  const saturday = '2026-11-21'
  const easy = restaurants.find((r) => r.sample.booking.walkIn === 'easy' && r.sample.reservation.walkInUpTo === 4)!
  const ahead = restaurants.find((r) => r.sample.booking.bookAhead === 'before-trip')!
  const dayBefore = restaurants.find((r) => r.sample.booking.bookAhead === 'day-before' && r.sample.booking.walkIn === 'rare')!

  it('now: a small party walks in, a busy night needs a smaller party', () => {
    expect(bookingStatus(easy, 'now', 4, weekday).availability).toBe('walk-in')
    expect(bookingStatus(easy, 'now', 4, saturday).availability).not.toBe('walk-in')
    expect(bookingStatus(easy, 'now', 2, saturday).availability).toBe('walk-in')
  })

  it('now: a place that books out before the trip has no table tonight', () => {
    const s = bookingStatus(ahead, 'now', 5, weekday)
    expect(s.availability).toBe('full')
    expect(s.score).toBe(0)
  })

  it('tomorrow: a day-ahead booking works, a before-the-trip place does not', () => {
    expect(bookingStatus(dayBefore, 'tomorrow', 4, weekday).availability).toBe('book')
    expect(bookingStatus(ahead, 'tomorrow', 4, weekday).availability).toBe('full')
  })

  it('before the trip: even the busiest place can be booked', () => {
    const s = bookingStatus(ahead, 'trip', 5)
    expect(s.availability).toBe('book')
    expect(s.label).toBe('Book before you travel')
  })

  it('a busy night never gives an earlier booking', () => {
    for (const r of restaurants) {
      const a = bookingStatus(r, 'tomorrow', 5, weekday)
      const b = bookingStatus(r, 'tomorrow', 5, saturday)
      if (a.time && b.time) expect(b.time >= a.time).toBe(true)
      expect(b.score).toBeLessThanOrEqual(a.score)
    }
  })

  it('picks tonight and tomorrow from the trip dates', () => {
    const before = new Date('2026-11-16T18:00:00')
    expect(bookingNight('now', '2026-11-20', '2026-11-23', '', before)).toBe('2026-11-20')
    expect(bookingNight('tomorrow', '2026-11-20', '2026-11-23', '', before)).toBe('2026-11-21')
    const during = new Date('2026-11-22T18:00:00')
    expect(bookingNight('now', '2026-11-20', '2026-11-23', '', during)).toBe('2026-11-22')
    expect(bookingNight('trip', '2026-11-20', '2026-11-23', '2026-11-21', during)).toBe('2026-11-21')
  })

  const sims = simulatedMembers(restaurants, features)
  const weights = Object.fromEntries(sims.map((m) => [m.id, learn(m.tripPrefs, m.swipes, features)]))
  const base = { restaurants, members: sims, weights, features }

  it('ad-hoc mode puts every place free tonight above the ones that are not', () => {
    const { ranked } = rankGroup({ ...base, when: 'now', night: saturday })
    const tiers = ranked.map((x) => bookingTier(x.booking!))
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    expect(ranked.some((x) => x.unavailable)).toBe(true)
    // marked, never hidden
    expect(ranked.length).toBe(rankGroup(base).ranked.length)
  })

  it('a pin stays on top even when the place is full', () => {
    const full = rankGroup({ ...base, when: 'now', night: saturday }).ranked.find((x) => x.unavailable)!
    const { ranked } = rankGroup({ ...base, when: 'now', night: saturday, pinnedId: full.restaurant.id })
    expect(ranked[0].restaurant.id).toBe(full.restaurant.id)
    expect(ranked[0].unavailable).toBe(true)
  })

  it('without a mode the order is by taste only and no booking is attached', () => {
    const { ranked } = rankGroup(base)
    expect(ranked.every((x) => x.booking === null && !x.unavailable)).toBe(true)
  })
})

describe('private must-haves', () => {
  it('matches the typed word, related words and dishes, whole words only', () => {
    expect(matchText(byName('Morralet'), 'paella')).toBe('paella')
    expect(matchText(byName('Enjoy Vegan'), 'I want a real Paëlla!')).toBe('paella')
    expect(matchText(byName('Botafumeiro'), 'paella')).toBe('rice')
    expect(matchText(byName('Passadís del Pep'), 'paella')).toBe('seafood')
    expect(matchText(byName('Alain Pizza'), 'paella')).toBeNull()
    expect(matchText(byName('Kuyi'), 'sushi')).toBe('sushi')
    expect(matchText(byName('Kuyi'), 'the')).toBeNull()
  })

  const me = member({ id: 'me', mustHaves: [{ text: 'paella' }] })
  const other = member({ id: 'o' })
  const paella = byName('Morralet')
  const ranked = (ms: Member[]) => rankGroup({ restaurants, members: ms, weights: { me: {}, o: {} }, features }).ranked
  const find = (list: Ranked[], id: string) => list.find((x) => x.restaurant.id === id)!

  it('a matched must-have clearly raises that member score, and only theirs', () => {
    const plain = find(ranked([member({ id: 'me' }), other]), paella.id)
    const boosted = find(ranked([me, other]), paella.id)
    expect(boosted.memberScores.me).toBeGreaterThan(plain.memberScores.me + 0.15)
    expect(boosted.memberScores.o).toBe(plain.memberScores.o)
  })

  it('a real skip still beats the must-have', () => {
    const skipped = member({ id: 'me', mustHaves: [{ text: 'paella' }], swipes: [{ restaurantId: paella.id, liked: false }] })
    expect(find(ranked([skipped, other]), paella.id).memberScores.me).toBeLessThan(0.15)
  })

  it('a place above the budget scores lower for that member', () => {
    const pricey = restaurants.find((r) => r.priceLevel === 4)!
    const tight = member({ id: 'me', budget: { maxPriceLevel: 2 } })
    expect(find(ranked([tight, other]), pricey.id).memberScores.me).toBeLessThan(find(ranked([member({ id: 'me' }), other]), pricey.id).memberScores.me)
    expect(personalFit(pricey, tight).overBudget).toBe(true)
  })

  it('the viewer sees their own must-have, never anyone else\'s, even from a member who shares reasons', () => {
    const sharer = member({ id: 'noah', name: 'Noah', sharesReasons: true, mustHaves: [{ text: 'paella' }] })
    const quiet = member({ id: 'elif', name: 'Elif', mustHaves: [{ text: 'paella' }] })
    const viewer = member({ id: 'me', mustHaves: [{ text: 'paella' }] })
    const w = { me: {}, noah: { 'cuisine:spanish': 2 }, elif: { 'cuisine:spanish': 2 } }
    const asViewer = sharedReasons([viewer, sharer, quiet], w, features[paella.id], 'me', paella)
    expect(asViewer.named.find((n) => n.member.id === 'me')!.reasons[0].text).toContain('must-have')
    const asOther = sharedReasons([member({ id: 'me' }), sharer, quiet], w, features[paella.id], 'me', paella)
    const all = JSON.stringify([asOther.named.map((n) => n.reasons), asOther.summary])
    expect(all).not.toContain('must-have')
    expect(all).not.toContain('paella')
    expect(ownFitReasons(paella, member({ id: 'me' }))).toEqual([])
  })
})

describe('where the group stays', () => {
  it('a custom stay keeps its label and position, and walking distance starts there', () => {
    const r = byName('Botafumeiro')
    const stay = resolveStay({ kind: 'custom', label: 'Airbnb on Carrer Gran', latitude: r.location.latitude, longitude: r.location.longitude })
    expect(stay.label).toBe('Airbnb on Carrer Gran')
    expect(distanceKm(stay, r.location)).toBeLessThan(0.001)
    expect(featuresOf(r, stay).near).toBeCloseTo(1)
    const far = resolveStay({ kind: 'area', id: 'barceloneta' })
    expect(featuresOf(r, far).near).toBeLessThan(featuresOf(r, stay).near)
  })

  it('an unknown area falls back to the first preset', () => {
    expect(resolveStay({ kind: 'area', id: 'nowhere' }).label).toBe('Barri Gòtic')
    expect(resolveStay(undefined).label).toBe('Barri Gòtic')
  })
})

describe('saved state', () => {
  it('moves an old saved state to the new shape', () => {
    const old = {
      stage: 'app', name: 'Ana', trip: { code: 'BCN-AAAA', role: 'owner', hotelId: 'born', from: '2026-11-20', to: '2026-11-23', prefs: ['budget', 'top', 'local'] },
      muted: { me: ['vibe:fancy', 'near'] }, swipes: { me: [{ restaurantId: 'x', liked: true }] }, rule: 'least-misery',
    }
    const s = migrateState(old)
    expect(s.trip.stay).toEqual({ kind: 'area', id: 'born' })
    expect(s.personal.me).toEqual({ prefs: ['local'], customPrefs: [], mustHaves: [], budget: { maxPriceLevel: 2 } })
    expect(s.muted.me).toEqual(['vibe:posh', 'near'])
    expect(s.when).toBe('trip')
    expect(s.seenDashboard).toBe(false)
    expect(s.rule).toBe('least-misery')
    expect(s.swipes.me).toHaveLength(1)
    expect(s.v).toBe(STATE_VERSION)
  })

  it('survives garbage and keeps a current state as it is', () => {
    expect(migrateState('nonsense')).toEqual(initialState)
    expect(migrateState({ stage: 42, trip: null, when: 'never' }).stage).toBe('welcome')
    const custom = { ...initialState, trip: { ...initialState.trip, stay: { kind: 'custom' as const, label: 'Hostel', latitude: 41.39, longitude: 2.17 } }, when: 'now' as const }
    expect(migrateState(JSON.parse(JSON.stringify(custom)))).toEqual(custom)
  })
})
