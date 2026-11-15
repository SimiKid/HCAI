import { describe, expect, it } from 'vitest'
import type { Member, Restaurant } from '../types'
import data from '../data/restaurants.barcelona.json'
import { moreSwipes, simulatedMembers } from '../data/members'
import { featuresOf } from './features'
import { confidence, learn, priorWeights, score, tasteProfile, update } from './learn'
import { conflictsFor, expectedReservation, groupPlaces, isBusyNight, leftToSwipe, rankGroup, swipeOn, tripNights } from './rank'
import { matchLevel, rankWithout, reasonsFor, sharedReasons, swipeEffect } from './explain'
import { tableMatch } from './match'

const restaurants = data as Restaurant[]
const hotel = { latitude: 41.3833, longitude: 2.1767 }
const features = Object.fromEntries(restaurants.map((r) => [r.id, featuresOf(r, hotel)]))
const byType = (t: string) => restaurants.filter((r) => r.primaryType === t)
const member = (over: Partial<Member>): Member => ({
  id: 'x', name: 'X', color: '#000', avatar: '', diets: [], allergies: [], tripPrefs: [], swipes: [], muted: [], sharesReasons: false, simulated: false, ...over,
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
    const w = priorWeights(['budget'])
    const cheap = restaurants.find((r) => r.priceLevel === 1)!
    const pricey = restaurants.find((r) => r.priceLevel === 4)!
    expect(score(w, features[cheap.id])).toBeGreaterThan(score(w, features[pricey.id]))
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
