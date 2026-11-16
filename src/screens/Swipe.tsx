import { useMemo, useRef, useState } from 'react'
import type { Because, Restaurant, Swipe } from '../types'
import { useGroup, useStore } from '../store'
import { shuffled } from '../data/members'
import { distanceKm, featureLabel } from '../model/features'
import { swipeEffect } from '../model/explain'
import { confidence, learn } from '../model/learn'
import { tableMatch, type TableMatch } from '../model/match'
import { groupPlaces } from '../model/rank'
import { AnimatePresence, motion } from 'framer-motion'
import { SwipeCard, type SwipeCardHandle } from '../components/SwipeCard'
import { PlaceSheet } from '../components/PlaceSheet'
import { GroupTable } from '../components/GroupTable'
import { TableMatchOverlay } from '../components/TableMatch'
import { swipes } from '../components/Bits'
import { ConfidenceDots } from '../components/ConfidenceDots'
import { HeartIcon, UndoIcon, XIcon } from '../components/Icons'

/** `label` is on the chip, `phrase` is used in the sentence after a tap. */
const WHY: { id: Because; label: string; phrase: string }[] = [
  { id: 'food', label: 'Food', phrase: 'The food' },
  { id: 'vibe', label: 'Vibe', phrase: 'The vibe' },
  { id: 'price', label: 'Price', phrase: 'The price' },
  { id: 'near', label: 'Location', phrase: 'The location' },
]

export function SwipeScreen({ goToRanking }: { goToRanking: () => void }) {
  const { state, set, restaurants } = useStore()
  const { actor, hotel, members, features } = useGroup()
  const [more, setMore] = useState(false)
  // how many others liked the place I just liked, as a number only
  const [echo, setEcho] = useState<{ name: string; fans: number; key: number } | null>(null)
  // the question names the place, because the next card is already on screen when it shows
  const [ask, setAsk] = useState<{ liked: boolean; name: string } | null>(null)
  const [match, setMatch] = useState<{ restaurant: Restaurant; match: TableMatch } | null>(null)
  const card = useRef<SwipeCardHandle>(null)
  const [feedback, setFeedback] = useState('')

  // the deck only changes when someone's diet or allergies change, not on every swipe
  const dietKey = members.map((m) => [...m.diets, ...m.allergies].join(',')).join('|')
  const deck = useMemo(
    // a place that one member cannot eat at never reaches the group ranking, so nobody spends a swipe on it
    () => groupPlaces(shuffled(restaurants, 7), members),
    [restaurants, dietKey], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const mine = state.swipes[actor.id] ?? []
  // the next cards are the places not swiped yet, so the deck ends after one pass and never repeats
  const swipedIds = new Set(mine.map((s) => s.restaurantId))
  const todo = deck.filter((r) => !swipedIds.has(r.id))
  const current = todo[0] ?? null
  const next = todo[1] ?? null
  const conf = confidence(actor.swipes.length)
  const hidden = restaurants.length - deck.length
  const others = useMemo(() => deck.filter((r) => r.id !== current?.id).map((r) => r.location), [deck, current?.id])

  // What a swipe changed, in the words of the taste chips in Profile. Both read the same weights
  // with the same threshold, so this line can never say something that the Profile contradicts.
  const effectLine = (before: Swipe[], after: Swipe[], liked: boolean): string => {
    const weightsBefore = learn(actor.tripPrefs, before, features, actor.muted)
    const weightsAfter = learn(actor.tripPrefs, after, features, actor.muted)
    const named = swipeEffect(weightsBefore, weightsAfter, liked).map(featureLabel)
    if (named.length === 0) return ''
    return liked ? `Stronger in your likes: ${named.join(', ')}.` : `Stronger in what you skip: ${named.join(', ')}.`
  }

  const decide = (liked: boolean) => {
    if (!current) return
    const swipe: Swipe = { restaurantId: current.id, liked }
    set((s) => ({
      swipes: { ...s.swipes, [actor.id]: [...(s.swipes[actor.id] ?? []), swipe] },
    }))
    // the why question comes after the swipe, never before it
    setAsk({ liked, name: current.displayName })
    // a table match is only shown after my own like, and only real swipes of the others count
    const found = liked ? tableMatch(current.id, actor.id, members) : null
    setMatch(found ? { restaurant: current, match: found } : null)
    // @hcai AMR-05 Others' likes show only after my own like and only as a count ("2 friends liked this"), never as faces or names, so nobody feels watched
    const fans = liked
      ? members.filter((m) => m.id !== actor.id && m.swipes.some((s) => s.restaurantId === current.id && s.liked)).length
      : 0
    setEcho(fans > 0 ? { name: current.displayName, fans, key: mine.length } : null)
    // @hcai AMR-16 After each swipe one line names what got stronger in the member's taste, in the same words as the chips in Profile
    setFeedback(effectLine(actor.swipes, [...actor.swipes, swipe], liked) || 'Noted. Your taste picture stays the same for now.')
  }
  // @hcai AMR-15 One optional tap after a swipe says what it was about (food, vibe, price or location), beyond like and skip
  const because = (b: Because, phrase: string) => {
    set((s) => {
      const list = [...(s.swipes[actor.id] ?? [])]
      if (list.length) list[list.length - 1] = { ...list[list.length - 1], because: b }
      return { swipes: { ...s.swipes, [actor.id]: list } }
    })
    // the answer narrows the swipe to one part of the card, so the line is worked out again from that
    const last = actor.swipes[actor.swipes.length - 1]
    const before = actor.swipes.slice(0, -1)
    const effect = last ? effectLine(before, [...before, { ...last, because: b }], last.liked) : ''
    setFeedback(`Only ${phrase.toLowerCase()} counts for this one. ${effect}`.trim())
    setAsk(null)
  }
  const undo = () => {
    set((s) => ({ swipes: { ...s.swipes, [actor.id]: (s.swipes[actor.id] ?? []).slice(0, -1) } }))
    setEcho(null)
    setAsk(null)
    setMatch(null)
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
          <GroupTable members={members} size={108} seat={26} />
          <AnimatePresence>
            {echo && (
              <motion.span key={echo.key} className="echo-badge" aria-hidden="true"
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
                <HeartIcon size={12} />{echo.fans}
              </motion.span>
            )}
          </AnimatePresence>
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
              stay={hotel}
              others={others}
              onDecide={decide}
              onMore={() => setMore(true)}
            />
          </div>
          <p className="feedback" role="status">
            {echo && (
              <span className="echo-line">
                <HeartIcon size={14} />{echo.fans === 1 ? '1 friend' : `${echo.fans} friends`} liked {echo.name} too
              </span>
            )}
            <span>{feedback || 'Swipe right to like, left to skip.'}</span>
          </p>
          {ask && (
            <div className="why-ask" role="group" aria-labelledby="why-q">
              <p className="small muted" id="why-q">{ask.liked ? `What won you over at ${ask.name}?` : `What put you off at ${ask.name}?`}</p>
              <div className="chips">
                {WHY.map((w) => (
                  <button key={w.id} className="chip why" onClick={() => because(w.id, w.phrase)}>{w.label}</button>
                ))}
              </div>
            </div>
          )}
          <div className="swipe-actions">
            <button className="round md" onClick={undo} disabled={mine.length === 0} aria-label="Undo last swipe"><UndoIcon size={22} /></button>
            <button className="round lg" onClick={() => card.current?.fling(false)} aria-label="Skip"><XIcon size={30} /></button>
            <button className="round lg like" onClick={() => card.current?.fling(true)} aria-label="Like"><HeartIcon size={30} /></button>
            <span style={{ width: 48 }} aria-hidden="true" />
          </div>
        </>
      ) : deck.length > 0 ? (
        <div className="card stack" style={{ marginTop: 24 }}>
          <p className="h2">You have seen all {deck.length} places.</p>
          <p className="muted small">
            Your swipes are in the group ranking.
            {hidden > 0 && ` ${hidden} more places are left out because of a diet or allergy in your group.`}
          </p>
          <button className="btn primary" onClick={goToRanking}>See the group ranking</button>
          <button className="btn" onClick={undo} disabled={mine.length === 0}>Undo last swipe</button>
        </div>
      ) : (
        <div className="card stack" style={{ marginTop: 24 }}>
          <p className="strong">No places work for every diet and allergy in your group.</p>
          <p className="muted small">Change yours in Profile to see places again.</p>
        </div>
      )}
    </div>
    <AnimatePresence>
      {more && current && (
        <PlaceSheet restaurant={current} distanceKm={distanceKm(hotel, current.location)} hotelLabel={hotel.label}
          onClose={() => setMore(false)}
          onDecide={(liked) => { setMore(false); card.current?.fling(liked) }} />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {match && (
        <TableMatchOverlay restaurant={match.restaurant} viewer={actor} members={members} match={match.match}
          onClose={() => setMatch(null)} onRanking={() => { setMatch(null); goToRanking() }} />
      )}
    </AnimatePresence>
    </>
  )
}
