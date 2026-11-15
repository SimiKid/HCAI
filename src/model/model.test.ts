import { describe, expect, it } from 'vitest'
import type { Member, Restaurant } from '../types'
import data from '../data/restaurants.barcelona.json'
import { simulatedMembers } from '../data/members'
import { featuresOf } from './features'
import { confidence, learn, priorWeights, score, update } from './learn'
import { conflictsFor, expectedReservation, rankGroup } from './rank'
import { matchLevel, rankWithout, reasonsFor } from './explain'

const restaurants = data as Restaurant[]
const hotel = { latitude: 41.3833, longitude: 2.1767 }
const features = Object.fromEntries(restaurants.map((r) => [r.id, featuresOf(r, hotel)]))
const byType = (t: string) => restaurants.filter((r) => r.primaryType === t)
const member = (over: Partial<Member>): Member => ({
  id: 'x', name: 'X', color: '#000', diets: [], allergies: [], tripPrefs: [], swipes: [], muted: [], simulated: false, ...over,
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
    const heavy = member({ id: 'a', swipes: Array(40).fill({ restaurantId: restaurants[0].id, liked: true }) })
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

  it('a boost re-ranks without touching the learned weights', () => {
    const { ranked } = rankGroup({ restaurants, members: [a], weights, features, boost: { 'price:high': 8 } })
    expect(ranked[0].restaurant.priceLevel).toBeGreaterThanOrEqual(3)
    expect(weights.a).toEqual({ 'cuisine:pizza': 3 })
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
})
