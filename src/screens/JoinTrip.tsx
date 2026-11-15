import { useEffect, useState } from 'react'
import type { TripPref } from '../types'
import { HOTEL_AREAS } from '../data/source'
import { useGroup, useStore } from '../store'
import { Avatar, ChipToggle, StepBar } from '../components/Bits'

export const TRIP_PREFS: { value: TripPref; label: string }[] = [
  { value: 'traditional', label: 'Eat traditionally' },
  { value: 'trendy', label: 'Trendy areas' },
  { value: 'local', label: 'Where locals eat' },
  { value: 'budget', label: 'Keep it cheap' },
  { value: 'treat', label: 'Happy to splurge' },
  { value: 'near', label: 'Close to the hotel' },
  { value: 'top', label: 'Top rated' },
]

export function TripFields() {
  const { state, set } = useStore()
  const trip = state.trip
  const patch = (p: Partial<typeof trip>) => set({ trip: { ...trip, ...p } })
  return (
    <>
      <div className="field">
        <span className="label" id="area-label">Where are you staying?</span>
        <div className="chips" role="group" aria-labelledby="area-label">
          {HOTEL_AREAS.map((h) => (
            <button key={h.id} type="button" className="chip" aria-pressed={trip.hotelId === h.id}
              onClick={() => patch({ hotelId: h.id })}>
              {h.label}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <div className="field grow">
          <label htmlFor="from">From</label>
          <input id="from" className="input" type="date" value={trip.from} onChange={(e) => patch({ from: e.target.value })} />
        </div>
        <div className="field grow">
          <label htmlFor="to">To</label>
          <input id="to" className="input" type="date" value={trip.to} min={trip.from} onChange={(e) => patch({ to: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <span className="label">What are you in the mood for on this trip?</span>
        <ChipToggle label="Trip preferences" options={TRIP_PREFS} selected={trip.prefs} onChange={(prefs) => patch({ prefs })} />
        <p className="small muted">A starting point for the ranking. Your swipes refine it.</p>
      </div>
    </>
  )
}

/** The one trip that exists in the prototype. A real backend would look codes up. */
export const DEMO_TRIP = { code: 'BCN-2611', city: 'Barcelona', from: '2026-11-20', to: '2026-11-23', invitedBy: 'mia' }

const day = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const newCode = () => 'BCN-' + Math.random().toString(36).slice(2, 6).toUpperCase()
// no backend: any well-formed code counts as an existing trip
const validCode = (code: string) => /^BCN-[A-Z0-9]{4}$/.test(code)
const inviteLink = (code: string) => `${location.origin}/?join=${encodeURIComponent(code)}`

/** Step 2: accept an invite, enter a code, or start a new trip. */
export function TripEntry() {
  const { state, set } = useStore()
  const { members } = useGroup()
  const others = members.filter((m) => m.simulated)
  const inviter = others.find((m) => m.id === DEMO_TRIP.invitedBy) ?? others[0]
  const linked = new URLSearchParams(location.search).get('join')?.toUpperCase() ?? ''
  const fromLink = validCode(linked) ? linked : ''
  const [code, setCode] = useState(fromLink)
  const [error, setError] = useState('')

  const join = (c: string) =>
    set({ stage: 'details', trip: { ...state.trip, code: c, role: 'guest', from: DEMO_TRIP.from, to: DEMO_TRIP.to } })
  const submitCode = () => {
    const c = code.trim().toUpperCase()
    if (validCode(c)) join(c)
    else setError(`No trip with the code ${c}. Check it with the person who invited you.`)
  }

  return (
    <div className="screen">
      <div className="stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <StepBar step={2} />
          <p className="eyebrow">Step 2 of 3</p>
          <h1 className="title">Your trip</h1>
          <p className="muted">Join the trip your friends set up, or start one and invite them.</p>
        </div>

        <section className="card stack" aria-labelledby="invite-h">
          <p className="eyebrow">{fromLink ? `You opened an invite link · Trip ${fromLink}` : 'Invitation'}</p>
          <div className="row">
            <Avatar member={inviter} />
            <div className="grow">
              <h2 className="h2" id="invite-h">{inviter.name} invited you to {DEMO_TRIP.city}</h2>
              <p className="small muted">{day(DEMO_TRIP.from)} to {day(DEMO_TRIP.to)} · {others.length} people already in</p>
            </div>
          </div>
          <div className="row" style={{ gap: 4 }}>
            {others.map((m) => <Avatar key={m.id} member={m} small />)}
            <span className="small muted" style={{ marginLeft: 6 }}>{others.map((m) => m.name).join(', ')}</span>
          </div>
          <button className="btn primary" onClick={() => join(fromLink || DEMO_TRIP.code)}>Join trip</button>
        </section>

        <form className="field" onSubmit={(e) => { e.preventDefault(); submitCode() }}>
          <label htmlFor="code">Have a trip code?</label>
          <div className="row">
            <input id="code" className="input grow" value={code} placeholder="BCN-0000" autoCapitalize="characters" autoComplete="off"
              aria-invalid={error ? true : undefined} aria-describedby={error ? 'code-error' : undefined}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }} />
            <button className="btn" style={{ width: 'auto' }} disabled={!code.trim()}>Join</button>
          </div>
          {error && <p id="code-error" role="alert" className="small" style={{ color: 'var(--crimson-text)' }}>{error}</p>}
        </form>

        <div className="stack" style={{ gap: 8 }}>
          <hr className="divider" />
          <p className="label">Planning it yourself?</p>
          <button className="btn" onClick={() => set({ stage: 'invite', trip: { ...state.trip, code: newCode(), role: 'owner' } })}>
            Start a new trip
          </button>
        </div>
        <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set({ stage: 'profile' })}>Back</button>
      </div>
    </div>
  )
}

/** Code, link and share button. Used in the invite step and on the Group tab. */
export function InviteCard({ code }: { code: string }) {
  const [status, setStatus] = useState('')
  const link = inviteLink(code)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setStatus('Invite link copied.')
    } catch {
      setStatus(`Copy this link: ${link}`)
    }
  }
  const share = async () => {
    try {
      await navigator.share({ title: 'Restaurant Tinder', text: `Join our trip with the code ${code}`, url: link })
    } catch {
      /* closed the share sheet: nothing to do */
    }
  }
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div>
        <p className="eyebrow">Trip code</p>
        <p className="trip-code">{code}</p>
      </div>
      <div className="row">
        <button className="btn primary" onClick={copy}>Copy invite link</button>
        {typeof navigator.share === 'function' && <button className="btn" style={{ background: 'var(--bg)' }} onClick={share}>Share</button>}
      </div>
      <p className="small muted" role="status">{status || 'Friends open the link or type the code after creating their profile.'}</p>
    </div>
  )
}

/** Only for someone who starts a trip: send the invite and watch friends join. */
export function InviteStep() {
  const { state, set } = useStore()
  const { members } = useGroup()
  const others = members.filter((m) => m.simulated)
  const [joined, setJoined] = useState(0)
  // prototype: the simulated friends accept one after the other
  useEffect(() => {
    if (joined >= others.length) return
    const t = setTimeout(() => setJoined(joined + 1), 1100)
    return () => clearTimeout(t)
  }, [joined, others.length])

  return (
    <div className="screen">
      <div className="stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <StepBar step={2} />
          <p className="eyebrow">Step 2 of 3</p>
          <h1 className="title">Invite your group</h1>
          <p className="muted">Everyone who joins swipes on their own phone. You can invite more people later in Group.</p>
        </div>
        <InviteCard code={state.trip.code} />
        <section className="stack" aria-labelledby="joined-h" style={{ gap: 12 }}>
          <h2 className="h2" id="joined-h" aria-live="polite">{joined} of {others.length} friends joined</h2>
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
            {others.map((m, i) => (
              <li key={m.id} className="row" style={{ opacity: i < joined ? 1 : 0.45 }}>
                <Avatar member={m} />
                <span className="grow strong">{m.name}</span>
                <span className="small muted">{i < joined ? 'Joined' : 'Invited'}</span>
              </li>
            ))}
          </ul>
          <p className="small muted">In this prototype the friends are simulated and join by themselves.</p>
        </section>
        <button className="btn primary" onClick={() => set({ stage: 'details' })}>Continue</button>
        <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set({ stage: 'trip' })}>Back</button>
      </div>
    </div>
  )
}

/** Step 3: where this person stays and what they are in the mood for. */
export function TripDetails() {
  const { state, set } = useStore()
  const owner = state.trip.role === 'owner'
  return (
    <form className="screen-form" onSubmit={(e) => { e.preventDefault(); set({ stage: 'app' }) }}>
      <div className="screen">
        <div className="stack" style={{ gap: 24 }}>
          <div className="stack" style={{ gap: 8 }}>
            <StepBar step={3} />
            <p className="eyebrow">Step 3 of 3 · Trip {state.trip.code}</p>
            <h1 className="title">{owner ? 'Set up the trip' : 'You are in'}</h1>
            <p className="muted">{owner ? 'Barcelona is the only city in this prototype.' : 'Two more things about your stay in Barcelona.'}</p>
          </div>
          <TripFields />
          <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set({ stage: owner ? 'invite' : 'trip' })}>Back</button>
        </div>
      </div>
      <div className="screen-foot">
        <button className="btn primary">Start swiping</button>
      </div>
    </form>
  )
}
