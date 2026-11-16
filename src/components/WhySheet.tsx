import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Member } from '../types'
import { useBooking, useStore, type Group } from '../store'
import { CUISINE_LABEL, distanceKm } from '../model/features'
import { confidence } from '../model/learn'
import { matchLevel, rankWithout, sharedReasons } from '../model/explain'
import { swipeOn, type RankInput, type Ranked } from '../model/rank'
import { BOOKING_MODES, bookAheadLabel, bookingStatus, slotsOn, walkInLabel } from '../model/booking'
import { Avatar, count, km, price, swipes } from './Bits'
import { DataNote, Gallery } from './Gallery'
import { ChevronIcon, CrownIcon, HeartIcon, XIcon } from './Icons'

interface Props {
  item: Ranked
  rank: number
  input: RankInput
  group: Group
  party: number
  canPin: boolean
  onClose: () => void
}

/** "The bill": why a place is where it is, itemised per person like a restaurant receipt. */
export function WhySheet({ item, rank, input, group, party, canPin, onClose }: Props) {
  const { state, set } = useStore()
  const booking = useBooking()
  const r = item.restaurant
  const x = group.features[r.id]
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pinnedBy = state.pin ? group.members.find((m) => m.id === state.pin!.by) : undefined
  const lowest = input.members.find((m) => m.id === item.lowestMemberId)
  const who = (m: Member) => (m.id === 'me' ? 'You' : m.name)
  const viewerId = group.actor.id
  // one person's reasons are open at a time, and the sheet starts with the viewer's own
  const [openMember, setOpenMember] = useState<string | null>(viewerId)
  const [showTimes, setShowTimes] = useState(false)
  // with the place passed in, the viewer's own must-have and budget lines come first in their reasons, nobody else's
  const shared = sharedReasons(input.members, group.weights, x, viewerId, r)
  const table = item.booking ?? bookingStatus(r, booking.when, party, booking.night)
  const modeLabel = BOOKING_MODES.find((m) => m.value === booking.when)?.label ?? ''
  const viewerSwiped = swipeOn(group.actor, r.id) !== null
  const open = (m: Member) => m.id === viewerId || m.sharesReasons

  // which member moves this place most when they are left out
  let swing: { member: Member; to: number } | null = null
  if (input.members.length > 1 && !item.pinned) {
    for (const m of input.members) {
      const to = rankWithout(input, r.id, m.id)
      if (to !== null && to !== rank && (!swing || Math.abs(to - rank) > Math.abs(swing.to - rank))) swing = { member: m, to }
    }
  }

  return (
    <>
      <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={`The bill for ${r.displayName}`}
        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
        <div className="sheet-top">
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close"><XIcon size={20} /></button>
        </div>
        <div className="stack">
          <Gallery restaurant={r} />

          {item.pinned && (
            // @hcai FAIR-01 A pinned place carries the name of who pinned it and says that it overrides the ranking
            <div className="note stack" style={{ gap: 8 }}>
              <p><span className="strong">Pinned to the top by {pinnedBy?.name ?? 'someone'}.</span> This overrides the group ranking.</p>
              {item.conflicts.length > 0 && (
                <p>Heads up: {item.conflicts.map((c) => (c.memberId === viewerId
                  ? (c.kind === 'diet' ? `you need ${c.what} food` : `you are allergic to ${c.what}`)
                  : (c.kind === 'diet' ? `someone in the group needs ${c.what} food` : `someone in the group is allergic to ${c.what}`))).join(', ')}, and this place may not work for that.</p>
              )}
              {/* @hcai FAIR-03 Anyone in the group can undo a pin with one tap, so the group keeps the last word */}
              <button className="btn slim" style={{ alignSelf: 'flex-start' }} onClick={() => set({ pin: null })}>Unpin</button>
            </div>
          )}

          {/* @hcai XAI-09 The explanation is a receipt: one line per person, a dashed rule, the group result as the total */}
          <div className="bill-wrap">
            <section className="bill" aria-labelledby="bill-h">
              <div className="bill-center">
                <p className="bill-caps">The bill · Trip {state.trip.code || 'BCN'}</p>
                <h2 className="bill-title" id="bill-h">{r.displayName}</h2>
                {/* the verdict comes first, the details that left the list rows come after it */}
                <p className="bill-verdict">{item.pinned ? 'Pinned to the top' : `Number ${rank} · ${matchLevel(item.groupScore).label}`}</p>
                <p className="bill-small">
                  {CUISINE_LABEL[r.primaryType]} in {r.neighbourhood} · {price(r.priceLevel)} · {r.rating.toFixed(1)} stars ({count(r.userRatingCount)} reviews)
                </p>
                <p className="bill-small">{r.formattedAddress} · {km(distanceKm(group.hotel, r.location))} from {group.hotel.label}</p>
              </div>
              <hr />
              <p className="bill-caps" style={{ marginBottom: 6 }}>{item.pinned ? 'What the ranking says' : `Why it is number ${rank}`}</p>
              {/* @hcai AMR-11 Every place explains its rank per member: a match word for everyone, and one tap shows the two reasons that mattered most */}
              {input.members.map((m) => {
                const match = matchLevel(item.memberScores[m.id])
                const reasons = shared.named.find((n) => n.member.id === m.id)?.reasons
                const conf = confidence(m.swipes.length)
                const isOpen = openMember === m.id
                const swiped = swipeOn(m, r.id)
                // a heart is a real like. Others' likes only show once the viewer has swiped this place too
                const showLike = swiped === true && (m.id === viewerId || viewerSwiped)
                // the viewer's own swipe comes first: it is a fact, the reasons after it are the app's guess
                let ownSwipe = ''
                if (m.id === viewerId) {
                  if (swiped === null) ownSwipe = `${who(m)} ${m.id === 'me' ? 'have' : 'has'} not seen this place yet. `
                  else ownSwipe = `${who(m)} ${swiped ? 'liked' : 'skipped'} this place. `
                }
                return (
                  <div key={m.id}>
                    <button className="bill-line bill-toggle" aria-expanded={isOpen} onClick={() => setOpenMember(isOpen ? null : m.id)}>
                      <span className="who">
                        <Avatar member={m} small />{who(m)}
                        {showLike && <span className="liked-mark" style={{ marginLeft: 0 }} role="img" aria-label="liked it"><HeartIcon size={12} /></span>}
                      </span>
                      <span className="dots" aria-hidden="true" />
                      <span>{match.label}</span>
                      <ChevronIcon size={14} style={{ flex: 'none', transform: isOpen ? 'rotate(90deg)' : undefined }} />
                    </button>
                    {isOpen && (
                      <p className="bill-reason">
                        {ownSwipe}
                        {!reasons ? 'Keeps their reasons private.' : reasons.length ? reasonText(reasons) : 'No clear signal yet.'}
                        {/* a place the member really swiped is not a guess, however few swipes they have */}
                        {conf.level === 'low' && swiped === null && ` Rough guess, only ${swipes(m.swipes.length)}.`}
                      </p>
                    )}
                  </div>
                )
              })}
              {shared.summary.length > 0 && <p style={{ marginTop: 4 }}>From the others: {shared.summary.join('. ')}.</p>}
              <hr />
              <div className="bill-line bill-total">
                <span>{input.members.length > 1 ? `Group of ${input.members.length}` : 'Total'}</span>
                <span className="dots" aria-hidden="true" />
                <span>{matchLevel(item.groupScore).label}</span>
              </div>
              <p className="bill-small" style={{ marginTop: 6 }}>
                {input.rule === 'least-misery'
                  ? 'Nobody left unhappy: the place is counted by its least happy person.'
                  : 'Split evenly: everyone counts the same, however much they swiped.'}
              </p>
              {input.members.length > 1 && lowest && (
                <p style={{ marginTop: 10 }}>
                  Works least well for {lowest.id === 'me' ? 'you' : open(lowest) ? lowest.name : 'one person at the table'}.
                  {swing && ` Without ${swing.member.id === 'me' ? 'you' : open(swing.member) ? swing.member.name : swing.member.id === lowest.id ? 'that person' : 'one of the others'}, it would be number ${swing.to}.`}
                </p>
              )}
              <hr />
              <p className="bill-caps" style={{ marginBottom: 8 }}>Table for {party} · {modeLabel}{booking.nightLabel && `, ${booking.nightLabel}`}</p>
              <p className="strong">{table.availability === 'full' ? `Unavailable: ${table.label}` : table.label}</p>
              <p className="bill-small">{walkInLabel(r.sample.booking.walkIn)} · {bookAheadLabel(r.sample.booking.bookAhead)}</p>
              <button className="bill-link" aria-expanded={showTimes} onClick={() => setShowTimes(!showTimes)}>
                {showTimes ? 'Hide the times' : 'See all times'}
              </button>
              {showTimes && (
                <div className="chips" style={{ marginTop: 6 }}>
                  {(booking.when === 'trip' ? r.sample.reservation.slots : slotsOn(r, booking.night)).map((s) => (
                    <span key={s.time} className={s.maxParty >= party ? 'chip static lav' : 'chip static'}>
                      {s.time} · up to {s.maxParty}
                    </span>
                  ))}
                </div>
              )}
              <hr />
              <p className="bill-small bill-center">A guess, not a verdict. Your group has the last word.</p>
            </section>
          </div>

          {state.showPopularWith ? (
            <section className="stack" aria-labelledby="pop-h" style={{ gap: 8 }}>
              <h3 className="h2" id="pop-h">Popular with</h3>
              <div className="chips">{r.sample.popularWith.map((p) => <span key={p} className="chip static">{p}</span>)}</div>
            </section>
          ) : (
            <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set({ showPopularWith: true })}>
              Show who tends to like this place
            </button>
          )}

          <DataNote restaurant={r} />

          {/* the one action of this sheet stays in reach at the bottom, however long the bill is */}
          {canPin && !item.pinned && (
            <div className="sheet-foot">
              <button className="btn primary" onClick={() => { set({ pin: { restaurantId: r.id, by: group.actor.id } }); onClose() }}>
                <CrownIcon size={20} />Pin to the top for everyone
              </button>
              <p className="tiny muted">Dictator mode: your name shows on it, and anyone can undo it.</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// the viewer's own must-have, preference and budget lines (only they get them) read as one sentence about the place, before their taste
const OWN_FIT = new Set(['must-have', 'pref', 'budget'])
function reasonText(reasons: { feature: string; text: string }[]): string {
  const fit = reasons.filter((q) => OWN_FIT.has(q.feature)).map((q) => q.text)
  const taste = reasons.filter((q) => !OWN_FIT.has(q.feature)).map((q) => q.text)
  return [fit.length ? sentence(['it ' + fit[0], ...fit.slice(1)]) : '', taste.length ? sentence(taste) : ''].filter(Boolean).join(' ')
}

function sentence(parts: string[]): string {
  const s = parts.join(' and ')
  return s[0].toUpperCase() + s.slice(1) + '.'
}
