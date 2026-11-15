import { useMemo, useRef, useState } from 'react'
import type { Because } from '../types'
import { useGroup, useStore } from '../store'
import { shuffled } from '../data/members'
import { CUISINE_LABEL, distanceKm } from '../model/features'
import { confidence } from '../model/learn'
import { conflictsFor } from '../model/rank'
import { AnimatePresence } from 'framer-motion'
import { SwipeCard, type SwipeCardHandle } from '../components/SwipeCard'
import { PlaceSheet } from '../components/PlaceSheet'
import { GroupTable, type Reaction } from '../components/GroupTable'
import { swipes } from '../components/Bits'
import { ConfidenceDots } from '../components/ConfidenceDots'
import { HeartIcon, UndoIcon, XIcon } from '../components/Icons'

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const WHY: { id: Because; label: string }[] = [
  { id: 'food', label: 'The food' },
  { id: 'vibe', label: 'The vibe' },
  { id: 'price', label: 'The price' },
  { id: 'near', label: 'The location' },
]

export function SwipeScreen({ goToRanking }: { goToRanking: () => void }) {
  const { state, set, restaurants } = useStore()
  const { actor, hotel, members } = useGroup()
  const [more, setMore] = useState(false)
  const [echo, setEcho] = useState<Record<string, Reaction>>({})
  const [ask, setAsk] = useState<{ liked: boolean } | null>(null)
  const card = useRef<SwipeCardHandle>(null)
  const [feedback, setFeedback] = useState('')

  // @hcai FAIR-09 The deck is in a fixed shuffled order, not sorted by predicted taste, so every place gets the same chance to be seen
  const deck = useMemo(
    () => shuffled(restaurants, 7).filter((r) => conflictsFor(r, actor).length === 0),
    [restaurants, actor.diets, actor.allergies], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const mine = state.swipes[actor.id] ?? []
  const current = deck.length ? deck[mine.length % deck.length] : null
  const next = deck.length > 1 ? deck[(mine.length + 1) % deck.length] : null
  const conf = confidence(actor.swipes.length)
  const hidden = restaurants.length - deck.length

  const decide = (liked: boolean) => {
    if (!current) return
    set((s) => ({
      swipes: { ...s.swipes, [actor.id]: [...(s.swipes[actor.id] ?? []), { restaurantId: current.id, liked }] },
    }))
    const what = `${CUISINE_LABEL[current.primaryType]} and ${current.sample.vibes[0]} places`
    // friends who liked the same place lean in only after my own swipe, so nobody swipes to fit in
    setAsk({ liked })
    const fans = liked
      ? members.filter((m) => m.id !== actor.id && m.swipes.some((s) => s.restaurantId === current.id && s.liked))
      : []
    setEcho(liked ? Object.fromEntries([actor, ...fans].map((m) => [m.id, 'liked' as Reaction])) : {})
    // @hcai AMR-16 After each swipe one line says how it changes the ranking
    setFeedback(
      fans.length
        ? `${listNames(fans.map((m) => m.name))} liked this too. ${what} move up for you.`
        : liked ? `Noted. ${what} move up for you.` : `Noted. ${what} move down a little.`,
    )
  }
  // @hcai AMR-15 One optional tap after a swipe says what it was about (food, vibe, price or location), beyond like and skip
  const because = (b: Because, label: string) => {
    set((s) => {
      const list = [...(s.swipes[actor.id] ?? [])]
      if (list.length) list[list.length - 1] = { ...list[list.length - 1], because: b }
      return { swipes: { ...s.swipes, [actor.id]: list } }
    })
    setFeedback(ask?.liked ? `Got it. ${label} counts more for you now.` : `Got it. ${label} was the problem.`)
    setAsk(null)
  }
  const undo = () => {
    set((s) => ({ swipes: { ...s.swipes, [actor.id]: (s.swipes[actor.id] ?? []).slice(0, -1) } }))
    setEcho({})
    setAsk(null)
    setFeedback('Last swipe undone.')
  }

  return (
    <>
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="title">{actor.id === 'me' ? 'Discover' : `Swiping as ${actor.name}`}</h1>
          {/* @hcai AMR-02 The header always shows how sure the app is, in words, next to the swipe count */}
          <div className="conf muted"><ConfidenceDots level={conf.level} />{conf.label} · {swipes(actor.swipes.length)}</div>
        </div>
        <button className="table-btn" onClick={goToRanking} aria-label={`Your table of ${members.length}. See the group ranking`}>
          <GroupTable members={members} size={108} seat={26} reactions={echo} />
        </button>
      </header>

      {current ? (
        <>
          <div className="deck">
            {next && (
              <div className="swipe-card" style={{ transform: 'scale(0.95) translateY(10px)', boxShadow: 'none' }} aria-hidden="true">
                <img src={next.photos[0].src} alt="" />
              </div>
            )}
            <SwipeCard
              key={`${current.id}-${mine.length}`}
              ref={card}
              restaurant={current}
              distanceKm={distanceKm(hotel, current.location)}
              hotelLabel={hotel.label}
              onDecide={decide}
              onMore={() => setMore(true)}
            />
          </div>
          <p className="feedback" role="status">
            {feedback ||
              (mine.length >= deck.length
                ? `You have seen all ${deck.length} places. Keep going to refine your taste.`
                : hidden > 0
                  ? `${hidden} places are hidden because of your diet or allergies.`
                  : 'Swipe right to like, left to skip. Tap the photo for more pictures.')}
          </p>
          {ask && (
            <div className="chips scroll" role="group" aria-label={ask.liked ? 'What won you over?' : 'What put you off?'} style={{ paddingBottom: 4 }}>
              <span className="small strong" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{ask.liked ? 'What won you over?' : 'What put you off?'}</span>
              {WHY.map((w) => (
                <button key={w.id} className="chip why" onClick={() => because(w.id, w.label)}>{w.label}</button>
              ))}
            </div>
          )}
          {/* @hcai DM-11 Like, skip and undo are buttons too, so the swipe gesture is never the only way */}
          <div className="swipe-actions">
            <button className="round md" onClick={undo} disabled={mine.length === 0} aria-label="Undo last swipe"><UndoIcon size={22} /></button>
            <button className="round lg" onClick={() => card.current?.fling(false)} aria-label="Skip"><XIcon size={30} /></button>
            <button className="round lg like" onClick={() => card.current?.fling(true)} aria-label="Like"><HeartIcon size={30} /></button>
            <span style={{ width: 48 }} aria-hidden="true" />
          </div>
        </>
      ) : (
        <div className="card stack" style={{ marginTop: 24 }}>
          <p className="strong">No places match your diet and allergies.</p>
          <p className="muted small">Change them in Profile to see places again.</p>
        </div>
      )}
    </div>
    <AnimatePresence>
      {more && current && (
        <PlaceSheet restaurant={current} distanceKm={distanceKm(hotel, current.location)} hotelLabel={hotel.label}
          party={members.length} onClose={() => setMore(false)}
          onDecide={(liked) => { setMore(false); card.current?.fling(liked) }} />
      )}
    </AnimatePresence>
    </>
  )
}
