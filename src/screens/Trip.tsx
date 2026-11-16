import { useMemo, useState } from 'react'
import { restaurantSource } from '../data/source'
import { patchPersonal, personalOf, useGroup, useStore } from '../store'
import { confidence } from '../model/learn'
import { groupPlaces } from '../model/rank'
import { Avatar, Fold, price, swipes, tripDates } from '../components/Bits'
import { ConfidenceDots } from '../components/ConfidenceDots'
import { MiniMap } from '../components/MiniMap'
import { InviteCard, LockIcon, PersonalTripFields, TRIP_PREFS, TripFields } from './JoinTrip'

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** One line about this member's own wishes for the trip, only ever shown to them. */
function myPrefs(p: ReturnType<typeof personalOf>): string[] {
  return [
    ...p.prefs.map((v) => TRIP_PREFS.find((t) => t.value === v)?.label ?? v),
    ...p.customPrefs,
    ...p.mustHaves.map((h) => `Must-have: ${h.text}`),
    ...(p.budget ? [`Up to ${price(p.budget.maxPriceLevel)}`] : []),
  ]
}

/** What I picked as filled chips, and the preset ideas I have not picked as one-tap suggestions. */
function TripPrefsPreview() {
  const { state, set } = useStore()
  const mine = personalOf(state, 'me')
  const picked = myPrefs(mine)
  const ideas = TRIP_PREFS.filter((t) => !mine.prefs.includes(t.value))
  return (
    <>
      {picked.length > 0
        ? <ul className="pref-chips" aria-label="Your preferences">
            {picked.map((t) => <li key={t} className="pref-chip">{t}</li>)}
          </ul>
        : <p className="small muted">Nothing added yet. Your preferences move places up or down for you.</p>}
      {ideas.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <p className="small muted">Ideas, tap to add</p>
          <ul className="pref-chips" aria-label="Ideas">
            {ideas.map((t) => (
              <li key={t.value}>
                <button type="button" className="pref-idea" onClick={() => set((s) => patchPersonal(s, 'me', { prefs: [...personalOf(s, 'me').prefs, t.value] }))}>
                  <span aria-hidden="true">+ </span>{t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

/** The trip: where the group stays and the places around it, your own wishes for it, and the people. */
export function TripScreen() {
  const { state, restaurants } = useStore()
  const { members, hotel } = useGroup()
  const [editing, setEditing] = useState(false)
  const [editingMine, setEditingMine] = useState(false)
  const places = useMemo(() => groupPlaces(restaurants, members), [restaurants, members])
  const spots = useMemo(() => places.map((r) => r.location), [places])
  return (
    <div className="screen">
      <div className="stack" style={{ gap: 24 }}>
        <h1 className="title">Our trip</h1>

        <section className="stack" aria-label="Trip" style={{ gap: 12 }}>
          <div className="card stack">
            <div className="row between">
              <div>
                <p className="eyebrow">Trip {state.trip.code}</p>
                <p className="h2">Barcelona · {hotel.label}</p>
                <p className="small muted">{[tripDates(state.trip.from, state.trip.to), `${members.length} people`].filter(Boolean).join(' · ')}</p>
              </div>
              <button className="btn slim" style={{ background: 'var(--bg)' }} aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
            </div>
            {editing && <TripFields />}
          </div>
          <div className="trip-map">
            <MiniMap stay={hotel} others={spots} bottomInset={44}
              label={`Map: ${places.length} places around ${hotel.label}, where your group stays`} />
            <div className="trip-legend" aria-hidden="true">
              <span><i className="h" />Your stay</span>
              <span><i />{places.length} places for your group</span>
            </div>
          </div>
        </section>

        {/* private: the member's own wishes for this trip, never shown to the group */}
        <section className="private-box" aria-labelledby="mine-h">
          <div className="setup-section-head">
            <h2 className="h2" id="mine-h">Your preferences for this trip</h2>
            <p className="privacy-hint"><LockIcon />Everyone sets their own. Only you see yours.</p>
          </div>
          {!editingMine && <TripPrefsPreview />}
          {editingMine && <div className="setup-section"><PersonalTripFields /></div>}
          <button className="btn slim private-box-add" aria-expanded={editingMine} onClick={() => setEditingMine(!editingMine)}>
            {editingMine ? 'Done' : <><span aria-hidden="true">+ </span>Add a preference</>}
          </button>
        </section>

        <section className="stack" aria-labelledby="members-h">
          <h2 className="h2" id="members-h">{members.length} people</h2>
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
            {members.map((m) => {
              const c = confidence(m.swipes.length)
              return (
                <li key={m.id} className="row">
                  <Avatar member={m} />
                  <div className="grow">
                    <p className="strong">{m.id === 'me' ? `${m.name} (you)` : m.name}</p>
                    <p className="small muted">
                      {m.id === 'me'
                        ? cap([...m.diets, ...m.allergies.map((a) => `no ${a}`)].join(', ')) || 'No restrictions'
                        : m.sharesReasons ? 'Shares their reasons' : 'Keeps their reasons private'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="small strong">{swipes(m.swipes.length)}</p>
                    <p className="conf tiny muted" style={{ justifyContent: 'flex-end' }}><ConfidenceDots level={c.level} />{c.label}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="stack" aria-labelledby="invite-h" style={{ gap: 12 }}>
          <h2 className="h2" id="invite-h">Invite people</h2>
          <InviteCard code={state.trip.code} />
        </section>

        {/* the two long texts open on a tap, so the tab is first about the trip and the people */}
        <section className="stack" aria-label="More about the app" style={{ gap: 10 }}>
          <Fold title="How the ranking works">
          <ul className="stack small" style={{ margin: 0, paddingLeft: 18, gap: 8 }}>
            <li>The app learns from each like and skip: cuisine, vibe, price, distance and rating. It never looks at who you are.</li>
            <li>Each person gets their own guess per place. The group score is the plain average, or the lowest guess if your group chose “nobody left unhappy”. Everyone counts the same under both.</li>
            <li>Diets and allergies are not a matter of taste. A place one person cannot eat at is removed for all, without saying whose diet it was.</li>
            <li>You see your own reasons. Other people's reasons are only counted, unless they chose to share them by name.</li>
            <li>It is a guess, and a rough one with few swipes. Filter people, re-rank for yourself, or pin a place to overrule it.</li>
            <li>In the list, the bar compares each place with the best and the worst one, so small differences show.</li>
            <li>“Book early first” only groups the list by how early you have to reserve. Inside each group the order stays the same.</li>
          </ul>
          </Fold>
          <Fold title="About this data">
            <p className="small muted">{restaurantSource.note}</p>
          </Fold>
        </section>
      </div>
    </div>
  )
}
