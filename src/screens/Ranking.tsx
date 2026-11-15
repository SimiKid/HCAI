import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Weights } from '../types'
import { useGroup, useStore } from '../store'
import { reasonsFor } from '../model/explain'
import { rankGroup, type RankInput, type Ranked } from '../model/rank'
import { Avatar, Segmented } from '../components/Bits'
import { RankRow } from '../components/RankRow'
import { WhySheet } from '../components/WhySheet'
import { MapView } from '../components/MapView'
import { ChevronIcon } from '../components/Icons'

const BOOSTS: { id: string; label: string; weights: Weights }[] = [
  { id: 'cheap', label: 'Cheaper', weights: { 'price:low': 2.5, 'price:high': -2.5 } },
  { id: 'near', label: 'Closer', weights: { near: 4 } },
  { id: 'traditional', label: 'More traditional', weights: { 'vibe:traditional': 2.5 } },
  { id: 'trendy', label: 'Trendier', weights: { 'vibe:trendy': 2.5 } },
  { id: 'top', label: 'Top rated', weights: { rated: 3 } },
]

export function RankingScreen() {
  const { state, restaurants } = useStore()
  const group = useGroup()
  const { members, weights, features, actor } = group
  const [view, setView] = useState<'list' | 'map'>('list')
  const [scope, setScope] = useState<'group' | 'mine'>('group')
  const [excluded, setExcluded] = useState<string[]>([])
  const [boosts, setBoosts] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)

  const included = scope === 'mine' ? [actor] : members.filter((m) => !excluded.includes(m.id))
  const party = scope === 'mine' ? members.length : included.length

  const input: RankInput = useMemo(() => {
    const boost: Weights = {}
    if (scope === 'mine')
      for (const b of BOOSTS) if (boosts.includes(b.id)) for (const f in b.weights) boost[f] = (boost[f] ?? 0) + b.weights[f]
    return {
      restaurants, members: included, weights, features,
      // @hcai HCAI-02 The ranking is automatic, and people steer it three ways: filter members, re-rank for yourself, or pin a place
      pinnedId: scope === 'group' ? state.pin?.restaurantId : null,
      boost: scope === 'mine' ? boost : undefined,
    }
  }, [restaurants, included.map((m) => m.id).join(), weights, features, state.pin, scope, boosts]) // eslint-disable-line react-hooks/exhaustive-deps

  const { ranked, blocked } = useMemo(() => rankGroup(input), [input])
  const pinnedBy = state.pin ? members.find((m) => m.id === state.pin!.by) : undefined
  const openIndex = ranked.findIndex((r) => r.restaurant.id === openId)

  const whyLine = (item: Ranked): string => {
    const name = (id: string) => (id === 'me' ? 'You' : (members.find((m) => m.id === id)?.name ?? ''))
    const fans = included
      .map((m) => ({ m, s: item.memberScores[m.id], r: reasonsFor(weights[m.id], features[item.restaurant.id], 1, m.id === 'me')[0] }))
      .filter((f) => f.r)
      .sort((a, b) => b.s - a.s)
    const top = fans.find((f) => f.r.positive)
    const low = [...fans].reverse().find((f) => !f.r.positive && f.m.id !== top?.m.id)
    return [top && `${name(top.m.id)} ${top.r.text}`, low && `${name(low.m.id)} ${low.r.text}`]
      .filter(Boolean).join(' · ')
  }

  const toggleMember = (id: string) => {
    const next = excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]
    if (next.length < members.length) setExcluded(next) // at least one member stays in
  }

  return (
    <>
      <div className="screen" style={view === 'map' ? { display: 'flex', flexDirection: 'column' } : undefined}>
        <div className="stack">
          <h1 className="title">{scope === 'group' ? 'Group ranking' : actor.id === 'me' ? 'Your ranking' : `${actor.name}'s ranking`}</h1>
          <div className="row">
            <div className="grow"><Segmented label="Whose ranking" value={scope} onChange={setScope} options={[{ value: 'group', label: 'Group' }, { value: 'mine', label: actor.id === 'me' ? 'Mine' : actor.name }]} /></div>
            <div className="grow"><Segmented label="View" value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'map', label: 'Map' }]} /></div>
          </div>

          {scope === 'group' ? (
            // @hcai FAIR-16 The people filter lets anyone switch members off and see whose taste shapes the list, with each swipe count in view
            <div className="stack" style={{ gap: 6 }}>
              <div className="chips scroll" role="group" aria-label="People in the ranking">
                {members.map((m) => {
                  const on = !excluded.includes(m.id)
                  return (
                    <button key={m.id} className={on ? 'chip' : 'chip off'} aria-pressed={on} onClick={() => toggleMember(m.id)}
                      aria-label={`${m.id === 'me' ? 'You' : m.name}, ${m.swipes.length} swipes, ${on ? 'included' : 'left out'}`}
                      style={on ? { background: 'var(--bg)', color: 'var(--ink)', borderColor: m.color } : undefined}>
                      <Avatar member={m} small />{m.id === 'me' ? 'You' : m.name}<span className="count">{m.swipes.length}</span>
                    </button>
                  )
                })}
              </div>
              <p className="tiny muted">Everyone counts the same, however much they swiped. The number is their swipes. Tap a name to leave someone out.</p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 6 }}>
              <div className="chips scroll" role="group" aria-label="Re-rank by">
                {BOOSTS.map((b) => (
                  <button key={b.id} className="chip" aria-pressed={boosts.includes(b.id)}
                    onClick={() => setBoosts(boosts.includes(b.id) ? boosts.filter((x) => x !== b.id) : [...boosts, b.id])}>
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="tiny muted">Only you see this order. It does not change the group ranking or what the app learned.</p>
            </div>
          )}
        </div>

        {view === 'list' ? (
          <div className="stack" style={{ marginTop: 16, gap: 10 }}>
            <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
              {ranked.map((item, i) => (
                <RankRow key={item.restaurant.id} rank={i + 1} item={item} party={party} whyLine={whyLine(item)}
                  pinnedBy={pinnedBy} onOpen={() => setOpenId(item.restaurant.id)} />
              ))}
            </ol>
            {blocked.length > 0 && (
              // @hcai ERR-12 Places removed by a diet or allergy are not silently dropped: the list says how many, and why for each
              <div className="card stack" style={{ gap: 8 }}>
                <button className="row between" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, width: '100%', textAlign: 'left' }}
                  aria-expanded={showBlocked} onClick={() => setShowBlocked(!showBlocked)}>
                  <span className="strong">{blocked.length} places hidden for diets or allergies</span>
                  <ChevronIcon size={20} style={{ transform: showBlocked ? 'rotate(90deg)' : undefined }} />
                </button>
                {showBlocked && (
                  <ul className="stack small" style={{ margin: 0, paddingLeft: 18, gap: 4 }}>
                    {blocked.map((b) => (
                      <li key={b.restaurant.id}>
                        <span className="strong">{b.restaurant.displayName}</span>:{' '}
                        {b.conflicts.map((c) => `${c.kind === 'diet' ? `no ${c.what} option` : `${c.what} hard to avoid`} for ${c.memberId === 'me' ? 'you' : members.find((m) => m.id === c.memberId)?.name}`).join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MapView ranked={ranked} hotel={group.hotel} onOpen={setOpenId} />
            <p className="tiny muted">Top {Math.min(15, ranked.length)} of {ranked.length}. H is where you stay. Tap a number for details.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {openIndex >= 0 && (
          <WhySheet item={ranked[openIndex]} rank={openIndex + 1} input={input} group={group} party={party}
            canPin={scope === 'group'} onClose={() => setOpenId(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
