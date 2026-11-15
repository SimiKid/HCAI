import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Member } from '../types'
import { useStore, type Group } from '../store'
import { CUISINE_LABEL, distanceKm } from '../model/features'
import { confidence } from '../model/learn'
import { matchLevel, rankWithout, reasonsFor } from '../model/explain'
import { expectedReservation, type RankInput, type Ranked } from '../model/rank'
import { Avatar, count, km, price, swipes } from './Bits'
import { reservationText } from './RankRow'
import { ClockIcon, CrownIcon, StarIcon, XIcon } from './Icons'

interface Props {
  item: Ranked
  rank: number
  input: RankInput
  group: Group
  party: number
  canPin: boolean
  onClose: () => void
}

export function WhySheet({ item, rank, input, group, party, canPin, onClose }: Props) {
  const { state, set } = useStore()
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
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={r.displayName}
        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
        <div className="sheet-photo">
          <img src={r.photos[0].src} alt={`${CUISINE_LABEL[r.primaryType]} dish`} />
          <button ref={closeRef} className="icon-btn sheet-close" onClick={onClose} aria-label="Close"><XIcon size={20} /></button>
        </div>
        <div className="stack" style={{ paddingTop: 16 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 className="title" style={{ fontSize: '1.5rem' }}>{r.displayName}</h2>
            <div className="meta">
              <span>{CUISINE_LABEL[r.primaryType]}</span>
              <span>{price(r.priceLevel)}</span>
              <span className="fact"><StarIcon size={13} />{r.rating.toFixed(1)} ({count(r.userRatingCount)} reviews)</span>
              <span>{km(distanceKm(group.hotel, r.location))} from {group.hotel.label}</span>
            </div>
            <p className="small muted">{r.formattedAddress}</p>
          </div>

          {item.pinned && (
            // @hcai FAIR-01 A pinned place carries the name of who pinned it and says that it overrides the ranking
            <div className="note stack" style={{ gap: 8 }}>
              <p><span className="strong">Pinned to the top by {pinnedBy?.name ?? 'someone'}.</span> This overrides the group ranking.</p>
              {item.conflicts.length > 0 && (
                <p>Heads up: {item.conflicts.map((c) => `${nameOf(group.members, c.memberId)} ${c.kind === 'diet' ? `needs ${c.what} food` : `is allergic to ${c.what}`}`).join(', ')}, and this place may not work for that.</p>
              )}
              {/* @hcai FAIR-03 Anyone in the group can undo a pin with one tap, so the group keeps the last word */}
              <button className="btn slim" style={{ alignSelf: 'flex-start' }} onClick={() => set({ pin: null })}>Unpin</button>
            </div>
          )}

          <section className="stack" aria-labelledby="why-h">
            <h3 className="h2" id="why-h">{item.pinned ? 'What the ranking says' : `Why it is number ${rank}`}</h3>
            {/* @hcai AMR-11 Every place explains its rank per member: a match word, a bar and the two reasons that mattered most */}
            {input.members.map((m) => {
              const s = item.memberScores[m.id]
              const match = matchLevel(s)
              const reasons = reasonsFor(group.weights[m.id], x, 2, m.id === 'me')
              const conf = confidence(m.swipes.length)
              return (
                <div className="member-line" key={m.id}>
                  <Avatar member={m} />
                  <div className="row" style={{ gap: 8 }}>
                    <span className="strong" style={{ minWidth: 56 }}>{m.id === 'me' ? 'You' : m.name}</span>
                    <span className={match.level === 'strong' ? 'bar strong' : 'bar'} aria-hidden="true"><i style={{ width: `${Math.round(s * 100)}%` }} /></span>
                    <span className="match">{match.label}</span>
                  </div>
                  <p className="reasons small muted">
                    {reasons.length
                      ? sentence(reasons.map((x) => x.text))
                      : 'No clear signal yet.'}
                    {conf.level === 'low' && ` Rough guess, only ${swipes(m.swipes.length)}.`}
                  </p>
                </div>
              )
            })}
            {input.members.length > 1 && lowest && (
              <p className="small">Works least well for <span className="strong">{lowest.id === 'me' ? 'you' : lowest.name}</span>.
                {swing && ` Without ${swing.member.id === 'me' ? 'you' : swing.member.name}, it would be number ${swing.to}.`}
              </p>
            )}
          </section>

          <hr className="divider" />

          <section className="stack" aria-labelledby="res-h" style={{ gap: 8 }}>
            <h3 className="h2" id="res-h">Tables tonight</h3>
            <p className="row" style={{ gap: 6 }}><ClockIcon size={18} />{reservationText(expectedReservation(r, party), party)}</p>
            <div className="chips">
              {r.sample.reservation.slots.map((s) => (
                <span key={s.time} className={s.maxParty >= party ? 'chip static lav' : 'chip static'}>
                  {s.time} · up to {s.maxParty}
                </span>
              ))}
            </div>
          </section>

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

          {canPin && !item.pinned && (
            <div className="stack" style={{ gap: 8 }}>
              <button className="btn primary" onClick={() => { set({ pin: { restaurantId: r.id, by: group.actor.id } }); onClose() }}>
                <CrownIcon size={20} />Pin to the top for everyone
              </button>
              <p className="small muted">Dictator mode. The whole group sees this place first, with your name on it. Anyone can undo it.</p>
            </div>
          )}
          <p className="tiny muted">Ratings, review counts, table times and “popular with” are sample values. The photo shows the type of food, not this restaurant. {r.photos[0].attribution}.</p>
        </div>
      </motion.div>
    </>
  )
}

function nameOf(members: Member[], id: string): string {
  return id === 'me' ? 'You' : (members.find((m) => m.id === id)?.name ?? id)
}

function sentence(parts: string[]): string {
  const s = parts.join(' and ')
  return s[0].toUpperCase() + s.slice(1) + '.'
}
