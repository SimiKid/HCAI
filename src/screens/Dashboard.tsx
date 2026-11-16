import { useMemo } from 'react'
import type { Member } from '../types'
import { useGroup, useStore } from '../store'
import { confidence } from '../model/learn'
import { groupPlaces, leftToSwipe } from '../model/rank'
import { Avatar } from '../components/Bits'
import { MiniMap } from '../components/MiniMap'
import { CardsIcon, GroupIcon, ListIcon } from '../components/Icons'

/** Swipes after which the app has a clear picture of someone, as in confidence(). */
const CLEAR_AT = 20

const short = (iso: string, month: boolean) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', month ? { day: 'numeric', month: 'short' } : { day: 'numeric' })

/** "20 to 23 Nov", or "30 Nov to 2 Dec" across a month. */
function dates(from: string, to: string): string {
  if (Number.isNaN(new Date(from + 'T12:00:00').getTime())) return ''
  const sameMonth = from.slice(0, 7) === to.slice(0, 7)
  return `${short(from, !sameMonth)} to ${short(to, true)}`
}

interface Props {
  goToSwipe: () => void
  goToRanking: () => void
}

/** The overview after setup: where the group stays, the places around it, who is done, and what to do next. */
// @hcai DM-02 After setup the app opens on an overview (map of the stay and places, group progress, next step) before any swiping
export function Dashboard({ goToSwipe, goToRanking }: Props) {
  const { state, set, restaurants } = useStore()
  const { hotel, members, actor } = useGroup()
  const places = useMemo(() => groupPlaces(restaurants, members), [restaurants, members])
  const spots = useMemo(() => places.map((r) => r.location), [places])

  // someone who has seen every place they can eat at is done, however few places that was
  const clear = (m: Member) => confidence(m.swipes.length).level === 'high' || leftToSwipe(m, places) === 0
  const done = members.filter(clear)
  const waiting = members.filter((m) => m.id !== actor.id && !clear(m))
  const firstVisit = !state.seenDashboard

  const next: { text: string; cta?: string; go?: () => void; Icon: typeof CardsIcon } =
    places.length === 0
      ? { text: 'No place works for every diet and allergy in your group yet.', Icon: GroupIcon }
      : !clear(actor)
        ? {
            text: actor.swipes.length === 0
              ? 'Swipe through a few places. The app learns your taste from every swipe.'
              : `Swipe about ${Math.min(CLEAR_AT - actor.swipes.length, leftToSwipe(actor, places))} more places for a clear picture of your taste.`,
            cta: 'Swipe', go: goToSwipe, Icon: CardsIcon,
          }
        : waiting.length > 0
          ? {
              text: `You are done. Waiting for ${waiting.length === 1 ? '1 friend' : `${waiting.length} friends`}, you can nudge them in Ranking.`,
              cta: 'Ranking', go: goToRanking, Icon: GroupIcon,
            }
          : { text: 'Everyone is in. The group ranking is ready.', cta: 'See it', go: goToRanking, Icon: ListIcon }

  const swipeNow = () => {
    set({ seenDashboard: true })
    goToSwipe()
  }

  return (
    <div className="screen-form">
      <div className="screen dash">
        <header>
          <p className="dash-eyebrow">Forkcast</p>
          <h1 className="title">Your trip</h1>
          <p className="small muted">
            {[hotel.label, dates(state.trip.from, state.trip.to), `${members.length} people`].filter(Boolean).join(' · ')}
          </p>
        </header>

        <div className="dash-map">
          <MiniMap stay={hotel} others={spots} bottomInset={44}
            label={`Map: ${places.length} places around ${hotel.label}, where your group stays`} />
          <div className="dash-legend" aria-hidden="true">
            <span><i className="h" />Your stay</span>
            <span><i />{places.length} places</span>
          </div>
        </div>

        <section className="card stack" style={{ gap: 10 }} aria-label="Group progress">
          <p className="strong">Clear picture of {done.length} of {members.length} people</p>
          <span className="progress-track" aria-hidden="true">
            {members.map((m) => <i key={m.id} className={clear(m) ? 'on' : ''} />)}
          </span>
          <div className="dash-people">
            {members.map((m) => (
              <span key={m.id} className={clear(m) ? 'who clear' : 'who'} title={m.id === 'me' ? 'You' : m.name}>
                <Avatar member={m} />
              </span>
            ))}
          </div>
          <p className="tiny muted">About {CLEAR_AT} swipes each make the ranking reliable. Nobody gets a bigger vote.</p>
        </section>

        <section className="card dash-next" aria-label="Next step">
          <span className="dash-step" aria-hidden="true"><next.Icon size={20} /></span>
          <div className="grow">
            <p className="label">Next step</p>
            <p className="small muted">{next.text}</p>
          </div>
          {!firstVisit && next.cta && <button className="btn slim" onClick={next.go}>{next.cta}</button>}
        </section>
      </div>
      {firstVisit && places.length > 0 && (
        <div className="dash-foot">
          <button className="btn primary" onClick={swipeNow}>Swipe now</button>
        </div>
      )}
    </div>
  )
}
