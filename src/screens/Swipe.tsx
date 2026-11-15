import { useMemo, useRef, useState } from 'react'
import { useGroup, useStore } from '../store'
import { shuffled } from '../data/members'
import { CUISINE_LABEL, distanceKm } from '../model/features'
import { confidence } from '../model/learn'
import { conflictsFor } from '../model/rank'
import { SwipeCard, type SwipeCardHandle } from '../components/SwipeCard'
import { swipes } from '../components/Bits'
import { ConfidenceDots } from '../components/ConfidenceDots'
import { HeartIcon, UndoIcon, XIcon } from '../components/Icons'

export function SwipeScreen({ goToRanking }: { goToRanking: () => void }) {
  const { state, set, restaurants } = useStore()
  const { actor, hotel } = useGroup()
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
    // @hcai AMR-16 After each swipe one line says how it changes the ranking
    setFeedback(liked ? `Noted. ${what} move up for you.` : `Noted. ${what} move down a little.`)
  }
  const undo = () => {
    set((s) => ({ swipes: { ...s.swipes, [actor.id]: (s.swipes[actor.id] ?? []).slice(0, -1) } }))
    setFeedback('Last swipe undone.')
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="title">{actor.id === 'me' ? 'Discover' : `Swiping as ${actor.name}`}</h1>
          {/* @hcai AMR-02 The header always shows how sure the app is, in words, next to the swipe count */}
          <div className="conf muted"><ConfidenceDots level={conf.level} />{conf.label} · {swipes(actor.swipes.length)}</div>
        </div>
        <button className="btn slim" onClick={goToRanking}>Ranking</button>
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
            />
          </div>
          <p className="feedback" role="status">
            {feedback ||
              (mine.length >= deck.length
                ? `You have seen all ${deck.length} places. Keep going to refine your taste.`
                : hidden > 0
                  ? `${hidden} places are hidden because of your diet or allergies.`
                  : 'Swipe right to like, left to skip. Or use the buttons.')}
          </p>
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
  )
}
