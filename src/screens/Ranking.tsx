import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Member, Weights } from '../types'
import { useGroup, useStore } from '../store'
import { confidence } from '../model/learn'
import { ownFitReasons, sharedReasons } from '../model/explain'
import { byLead, LEAD_LABEL } from '../model/booking'
import { groupPlaces, leftToSwipe, rankGroup, swipeOn, type GroupRule, type RankInput, type Ranked } from '../model/rank'
import { InfoHeading, Segmented, Switch } from '../components/Bits'
import { RankRow } from '../components/RankRow'
import { TooEarly } from '../components/FrontRunner'
import { GroupProgress } from '../components/GroupProgress'
import { GroupTable } from '../components/GroupTable'
import { WhySheet } from '../components/WhySheet'
import { MapView } from '../components/MapView'
import { ChevronIcon } from '../components/Icons'
import '../styles/ranking.css'

const BOOSTS: { id: string; label: string; weights: Weights }[] = [
  { id: 'cheap', label: 'Cheaper', weights: { 'price:low': 2.5, 'price:high': -2.5 } },
  { id: 'near', label: 'Closer', weights: { near: 4 } },
  { id: 'traditional', label: 'More traditional', weights: { 'vibe:traditional': 2.5 } },
  { id: 'trendy', label: 'Trendier', weights: { 'vibe:trendy': 2.5 } },
  { id: 'top', label: 'Top rated', weights: { rated: 3 } },
]

const RULE_LABEL: Record<GroupRule, string> = { average: 'Best on average', 'least-misery': 'Nobody left unhappy' }

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const listStyle = { listStyle: 'none', margin: 0, padding: 0, gap: 10 } as const

export function RankingScreen({ goToSwipe }: { goToSwipe: () => void }) {
  const { state, set, restaurants } = useStore()
  const group = useGroup()
  const { members, weights, features, actor } = group
  const [view, setView] = useState<'list' | 'map'>('list')
  const [scope, setScope] = useState<'group' | 'mine'>('group')
  const [excluded, setExcluded] = useState<string[]>([])
  const [boosts, setBoosts] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showRough, setShowRough] = useState(false)
  const [showRule, setShowRule] = useState(false)

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
    }
  }, [restaurants, included.map((m) => m.id).join(), weights, features, state.pin, state.rule, scope, boosts]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // the group's number one gets the front-runner marker, also when "Book early first" moves it down the screen
  const frontId = scope === 'group' && !tooEarly && ranked[0] && !ranked[0].pinned ? ranked[0].restaurant.id : null
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
  // the viewer's own must-have, never another member's: ownFitReasons is only ever called with the viewer
  const mineFor = (item: Ranked): string | undefined => {
    const hit = ownFitReasons(item.restaurant, actor).find((x) => x.feature === 'must-have')
    return hit ? cap(hit.text) : undefined
  }
  const blockedWhy = (c: { memberId: string; kind: 'diet' | 'allergy'; what: string }) => {
    const whom = c.memberId === actor.id ? 'you' : 'someone in the group'
    return c.kind === 'diet' ? `no ${c.what} option, needed by ${whom}` : `${c.what} hard to avoid, a problem for ${whom}`
  }

  const toggleMember = (id: string) => {
    const next = excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]
    if (next.length < members.length) setExcluded(next) // at least one member stays in
  }
  const nameOf = (m: Member) => (m.id === 'me' ? 'You' : m.name)
  const out = members.filter((m) => excluded.includes(m.id))

  // every row keeps its place in the group ranking as its number, whichever way the list is sorted
  const row = (item: Ranked) => (
    <RankRow key={item.restaurant.id} rank={ranked.indexOf(item) + 1} item={item} whyLine={whyLine(item)}
      liked={swipeOn(actor, item.restaurant.id) === true} mine={mineFor(item)} barPercent={barPercent(item.groupScore)}
      front={item.restaurant.id === frontId} pinnedBy={pinnedBy} onOpen={() => setOpenId(item.restaurant.id)} />
  )
  const pinnedRows = ranked.filter((r) => r.pinned)

  return (
    <>
      <div className="screen" style={view === 'map' ? { display: 'flex', flexDirection: 'column' } : undefined}>
        <div className="stack" style={{ gap: 12 }}>
          <h1 className="title">{scope === 'group' ? 'Group ranking' : actor.id === 'me' ? 'Your ranking' : `${actor.name}'s ranking`}</h1>

          {/* who the app has a clear picture of comes first: it says how far to trust everything below */}
          {scope === 'group' && (
            <GroupProgress members={included} features={features} actorId={actor.id} left={left} onSwipeMore={goToSwipe} defaultOpen={tooEarly} />
          )}

          <div className="row">
            <div className="grow"><Segmented label="Whose ranking" value={scope} onChange={setScope} options={[{ value: 'group', label: 'Group' }, { value: 'mine', label: actor.id === 'me' ? 'Mine' : actor.name }]} /></div>
            <div className="grow"><Segmented label="View" value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'map', label: 'Map' }]} /></div>
          </div>

          {scope === 'group' && (
            <section className="rk-who" aria-labelledby="who-h">
              {/* @hcai FAIR-16 Anyone can switch members off and see whose taste shapes the list */}
              <div id="who-h">
                <InfoHeading level="label" title="Who counts in this ranking"
                  info="Tap a person to leave them out, tap again to bring them back. Everyone counts the same, however much they swiped." />
              </div>
              {/* @hcai DM-01 The people filter is the table itself: every seat shows a check or a cross, a tap leaves that person out and the list re-ranks at once, a second tap brings them back */}
              <GroupTable members={members} size={Math.min(240, 190 + members.length * 10)} seat={46} onSeat={toggleMember} off={excluded} label="Who counts in this ranking"
                seatLabel={(m) => `${nameOf(m)}, ${m.swipes.length} swipes, ${excluded.includes(m.id) ? 'left out, tap to bring back' : 'counts, tap to leave out'}`} />
              <p className="sr-only" role="status">{out.length === 0 ? 'Everyone counts' : `Without ${out.map(nameOf).join(' and ')}`}</p>
              <button className="rk-rule" aria-expanded={showRule} aria-controls="rule-panel" onClick={() => setShowRule(!showRule)}>
                {RULE_LABEL[state.rule]}<ChevronIcon size={14} style={{ transform: showRule ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
              </button>
              {showRule && (
                <div className="stack" id="rule-panel" style={{ gap: 6 }}>
                  <p className="label">How the group is counted</p>
                  <Segmented label="How the group is counted" value={state.rule} onChange={(rule) => set({ rule })}
                    options={[{ value: 'average', label: RULE_LABEL.average }, { value: 'least-misery', label: RULE_LABEL['least-misery'] }]} />
                  <p className="tiny muted">
                    {state.rule === 'average'
                      ? 'The highest average wins, even if one of you is lukewarm about it.'
                      : 'A place only counts as much as it suits the least happy person.'}
                  </p>
                </div>
              )}
            </section>
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
                <TooEarly waiting={waiting} left={left} />
                <h2 className="h2" style={{ marginTop: 12 }}>Shortlist so far</h2>
                <p className="tiny muted" style={{ marginTop: -6 }}>Three places that look promising, in no particular order.</p>
                <ol className="stack" style={listStyle}>
                  {shortlist.map((item) => (
                    <RankRow key={item.restaurant.id} rank={0} unranked item={item} whyLine={whyLine(item)} liked={swipeOn(actor, item.restaurant.id) === true}
                      mine={mineFor(item)} onOpen={() => setOpenId(item.restaurant.id)} />
                  ))}
                </ol>
                {!showRough && <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setShowRough(true)}>Show the rough ranking anyway</button>}
                {showRough && <h2 className="h2" style={{ marginTop: 12 }}>Rough ranking</h2>}
              </>
            )}
            {!tooEarly && ranked.length > 0 && (
              <InfoHeading title={`All ${ranked.length} places`} info="The bar compares each place with the best and the worst in this list. Tap a place to see its bill." />
            )}
            {(!tooEarly || showRough) && ranked.length > 0 && (
              <>
                {/* @hcai ERR-04 "Book early first" is a predictable second sort the group switches on: it only groups the list by how early to reserve, keeps the group order inside each group and the front-runner marker on the overall number one */}
                <div className="rk-sort">
                  <div className="grow">
                    <p className="strong">Book early first</p>
                    <p className="tiny muted">Places you have to reserve earliest come first. The group order stays inside each.</p>
                  </div>
                  <Switch checked={state.bookEarly} onChange={(bookEarly) => set({ bookEarly })} label="Book early first" />
                </div>
                {!state.bookEarly ? (
                  <ol className="stack" style={listStyle}>{ranked.map(row)}</ol>
                ) : (
                  <>
                    {pinnedRows.length > 0 && <ol className="stack" style={listStyle}>{pinnedRows.map(row)}</ol>}
                    {byLead(ranked.filter((r) => !r.pinned)).map((g) => (
                      <section key={g.lead} className="stack" style={{ gap: 10 }} aria-labelledby={`lead-${g.lead}`}>
                        <h3 className="lead-head" id={`lead-${g.lead}`}>{LEAD_LABEL[g.lead]}<span className="n">· {g.items.length}</span></h3>
                        <ol className="stack" style={listStyle}>{g.items.map(row)}</ol>
                      </section>
                    ))}
                  </>
                )}
              </>
            )}
            {blocked.length > 0 && (
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
          <div style={{ flex: '1 0 auto', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
