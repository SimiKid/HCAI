import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Member, Weights } from '../types'
import { nightLabel, useBooking, useGroup, useNight, useStore } from '../store'
import { confidence } from '../model/learn'
import { sharedReasons } from '../model/explain'
import { groupPlaces, leftToSwipe, rankGroup, swipeOn, type GroupRule, type RankInput, type Ranked } from '../model/rank'
import { Avatar, InfoHeading, Segmented } from '../components/Bits'
import { RankRow } from '../components/RankRow'
import { FrontRunner, TooEarly } from '../components/FrontRunner'
import { GroupProgress } from '../components/GroupProgress'
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

/** How many places the list shows before "Show all". */
const TOP = 10

const RULE_LABEL: Record<GroupRule, string> = { average: 'Best on average', 'least-misery': 'Nobody left unhappy' }

export function RankingScreen({ goToSwipe }: { goToSwipe: () => void }) {
  const { state, set, restaurants } = useStore()
  const group = useGroup()
  const night = useNight()
  const booking = useBooking()
  const { members, weights, features, actor } = group
  const [adjust, setAdjust] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [scope, setScope] = useState<'group' | 'mine'>('group')
  const [excluded, setExcluded] = useState<string[]>([])
  const [boosts, setBoosts] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showRough, setShowRough] = useState(false)
  const [showAll, setShowAll] = useState(false)

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
      rule: scope === 'group' ? state.rule : 'average',
      when: booking.when, night: booking.night, partySize: party,
    }
  }, [restaurants, included.map((m) => m.id).join(), weights, features, state.pin, state.rule, scope, boosts, booking.when, booking.night, party]) // eslint-disable-line react-hooks/exhaustive-deps

  const { ranked, blocked } = useMemo(() => rankGroup(input), [input])
  const pinnedBy = state.pin ? members.find((m) => m.id === state.pin!.by) : undefined
  const openIndex = ranked.findIndex((r) => r.restaurant.id === openId)

  // someone with nothing left to swipe is never waited for, or a short deck (strict diets) would block the ranking for good
  const places = groupPlaces(restaurants, members)
  const left = (m: Member) => leftToSwipe(m, places)
  // @hcai AMR-10 Until everyone at the table has 8 swipes, or has seen every place they can eat at, there is no front-runner, only an unordered shortlist of three
  const waiting = scope === 'group' ? included.filter((m) => confidence(m.swipes.length).level === 'low' && left(m) > 0) : []
  const tooEarly = waiting.length > 0 && !ranked[0]?.pinned
  const shortlist = tooEarly ? [...ranked.slice(0, 3)].sort((a, b) => a.restaurant.displayName.localeCompare(b.restaurant.displayName)) : []

  // number one is already on the front-runner plate, so the list starts at number two
  const firstRow = scope === 'group' && !tooEarly ? 1 : 0
  const rows = ranked.slice(firstRow, showAll ? ranked.length : TOP)
  // the bar compares a place with the best and the worst place in the list, so small score gaps stay visible
  const listScores = ranked.filter((r) => !r.pinned).map((r) => r.groupScore)
  const best = Math.max(...listScores)
  const worst = Math.min(...listScores)
  const barPercent = (score: number) => (best === worst ? 100 : Math.round(15 + (85 * (score - worst)) / (best - worst)))

  const whyLine = (item: Ranked): string => {
    const { named, summary } = sharedReasons(included, weights, features[item.restaurant.id], actor.id)
    const fans = named
      .map((n) => ({ m: n.member, s: item.memberScores[n.member.id], r: n.reasons[0] }))
      .filter((f) => f.r)
      .sort((a, b) => b.s - a.s)
    const name = (id: string) => (id === 'me' ? 'You' : (members.find((m) => m.id === id)?.name ?? ''))
    const top = fans.find((f) => f.r.positive)
    const low = [...fans].reverse().find((f) => !f.r.positive && f.m.id !== top?.m.id)
    const parts = [top && `${name(top.m.id)} ${top.r.text}`, low && `${name(low.m.id)} ${low.r.text}`].filter(Boolean)
    return (parts.length ? parts : summary.slice(0, 1)).join(' · ')
  }
  const blockedWhy = (c: { memberId: string; kind: 'diet' | 'allergy'; what: string }) => {
    const whom = c.memberId === actor.id ? 'you' : 'someone in the group'
    return c.kind === 'diet' ? `no ${c.what} option, needed by ${whom}` : `${c.what} hard to avoid, a problem for ${whom}`
  }

  const toggleMember = (id: string) => {
    const next = excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]
    if (next.length < members.length) setExcluded(next) // at least one member stays in
  }

  // one line that says what the folded settings are set to
  const people = included.length === members.length ? `All ${members.length} people` : `${included.length} of ${members.length} people`
  const summary = [night.label, scope === 'group' ? people : 'Only your taste', scope === 'group' ? RULE_LABEL[state.rule] : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className="screen" style={view === 'map' ? { display: 'flex', flexDirection: 'column' } : undefined}>
        <div className="stack" style={{ gap: 12 }}>
          <h1 className="title">{scope === 'group' ? 'Group ranking' : actor.id === 'me' ? 'Your ranking' : `${actor.name}'s ranking`}</h1>
          <div className="row">
            <div className="grow"><Segmented label="Whose ranking" value={scope} onChange={setScope} options={[{ value: 'group', label: 'Group' }, { value: 'mine', label: actor.id === 'me' ? 'Mine' : actor.name }]} /></div>
            <div className="grow"><Segmented label="View" value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'map', label: 'Map' }]} /></div>
          </div>

          {/* the settings fold into one line that always shows their state, so the front-runner is the first thing on screen */}
          <button className="adjust" aria-expanded={adjust} aria-controls="adjust-panel" onClick={() => setAdjust(!adjust)}>
            <span className="grow">{summary}</span>
            <span className="adjust-cta">{adjust ? 'Done' : 'Adjust'}<ChevronIcon size={16} style={{ transform: adjust ? 'rotate(-90deg)' : 'rotate(90deg)' }} /></span>
          </button>

          {adjust && (
            <div className="adjust-panel stack" id="adjust-panel" style={{ gap: 14 }}>
              {night.nights.length > 1 && (
                <div className="stack" style={{ gap: 6 }}>
                  <InfoHeading level="label" title="Dinner on" info="Table times follow the night. Friday and Saturday are busier." />
                  <div className="chips" role="group" aria-label="Dinner on">
                    {night.nights.map((iso) => (
                      <button key={iso} className="chip" aria-pressed={iso === night.iso} onClick={() => set({ night: iso })}>{nightLabel(iso)}</button>
                    ))}
                  </div>
                </div>
              )}
              {scope === 'group' && (
                <>
                  {/* @hcai FAIR-16 The people filter lets anyone switch members off and see whose taste shapes the list, with each swipe count in view */}
                  <div className="stack" style={{ gap: 6 }}>
                    <InfoHeading level="label" title="Who counts"
                      info="Everyone counts the same, however much they swiped. The number next to a name is their swipes. Tap a name to leave someone out." />
                    <div className="chips" role="group" aria-label="Who counts">
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
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <p className="label">How the group is counted</p>
                    <Segmented label="How the group is counted" value={state.rule} onChange={(rule) => set({ rule })}
                      options={[{ value: 'average', label: RULE_LABEL.average }, { value: 'least-misery', label: RULE_LABEL['least-misery'] }]} />
                    <p className="tiny muted">
                      {state.rule === 'average'
                        ? 'The highest average wins, even if one of you is lukewarm about it.'
                        : 'A place only counts as much as it suits the least happy person.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {scope === 'mine' && (
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
            {tooEarly && (
              <>
                <TooEarly members={included} waiting={waiting} left={left} />
                {/* open here: without a front-runner, getting people to swipe is the next thing to do */}
                <GroupProgress members={included} features={features} actorId={actor.id} left={left} onSwipeMore={goToSwipe} defaultOpen />
                <h2 className="h2" style={{ marginTop: 12 }}>Shortlist so far</h2>
                <p className="tiny muted" style={{ marginTop: -6 }}>Three places that look promising, in no particular order.</p>
                <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
                  {shortlist.map((item) => (
                    <RankRow key={item.restaurant.id} rank={0} unranked item={item} whyLine={whyLine(item)} liked={swipeOn(actor, item.restaurant.id) === true}
                      onOpen={() => setOpenId(item.restaurant.id)} />
                  ))}
                </ol>
                {!showRough && <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setShowRough(true)}>Show the rough ranking anyway</button>}
                {showRough && <h2 className="h2" style={{ marginTop: 12 }}>Rough ranking</h2>}
              </>
            )}
            {scope === 'group' && !tooEarly && ranked.length > 0 && (
              <>
                <FrontRunner item={ranked[0]} members={included} viewerId={actor.id} party={party} pinnedBy={pinnedBy} onOpen={() => setOpenId(ranked[0].restaurant.id)} />
                <GroupProgress members={included} features={features} actorId={actor.id} left={left} onSwipeMore={goToSwipe} />
                {ranked.length > 1 && (
                  <div style={{ marginTop: 12 }}>
                    <InfoHeading title="Runners-up" info="The bar compares each place with the best and the worst in this list. Tap a place to see its bill." />
                  </div>
                )}
              </>
            )}
            {(!tooEarly || showRough) && (
              <>
                <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
                  {rows.map((item, j) => (
                    <RankRow key={item.restaurant.id} rank={firstRow + j + 1} item={item} whyLine={whyLine(item)} liked={swipeOn(actor, item.restaurant.id) === true}
                      barPercent={barPercent(item.groupScore)} pinnedBy={pinnedBy} onOpen={() => setOpenId(item.restaurant.id)} />
                  ))}
                </ol>
                {ranked.length > TOP && (
                  <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAll(!showAll)}>
                    {showAll ? `Show the top ${TOP} only` : `Show all ${ranked.length} places`}
                  </button>
                )}
              </>
            )}
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
                        {[...new Set(b.conflicts.map(blockedWhy))].join(', ')}
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
