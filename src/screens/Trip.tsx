import { useState } from 'react'
import { restaurantSource } from '../data/source'
import { useGroup, useStore } from '../store'
import { confidence } from '../model/learn'
import { Avatar, swipes } from '../components/Bits'
import { ConfidenceDots } from '../components/ConfidenceDots'
import { InviteCard, TripFields } from './JoinTrip'

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export function TripScreen() {
  const { state } = useStore()
  const { members, hotel } = useGroup()
  const [editing, setEditing] = useState(false)
  return (
    <div className="screen">
      <div className="stack" style={{ gap: 24 }}>
        <h1 className="title">Group</h1>

        <section className="card stack" aria-label="Trip">
          <div className="row between">
            <div>
              <p className="eyebrow">Trip {state.trip.code}</p>
              <p className="h2">Barcelona · {hotel.label}</p>
              <p className="small muted">{fmt(state.trip.from)} to {fmt(state.trip.to)}</p>
            </div>
            <button className="btn slim" style={{ background: 'var(--bg)' }} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
          </div>
          {editing && <TripFields />}
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
                      {cap([...m.diets, ...m.allergies.map((a) => `no ${a}`)].join(', ')) || 'No restrictions'}
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

        <section className="card stack" aria-labelledby="how-h" style={{ gap: 10 }}>
          <h2 className="h2" id="how-h">How the ranking works</h2>
          <ul className="stack small" style={{ margin: 0, paddingLeft: 18, gap: 8 }}>
            <li>The app learns from each like and skip: cuisine, vibe, price, distance and rating. It never looks at who you are.</li>
            <li>Each person gets their own guess per place. The group score is the plain average, so everyone counts the same.</li>
            <li>Diets and allergies are not a matter of taste. A place one person cannot eat at is removed for all.</li>
            <li>It is a guess, and a rough one with few swipes. Filter people, re-rank for yourself, or pin a place to overrule it.</li>
          </ul>
        </section>

        <section className="stack" aria-labelledby="data-h" style={{ gap: 8 }}>
          <h2 className="h2" id="data-h">About this data</h2>
          <p className="small muted">{restaurantSource.note}</p>
        </section>
      </div>
    </div>
  )
}
