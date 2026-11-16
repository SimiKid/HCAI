import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { Budget, LatLng, PersonalTrip, Stay, TripPref } from '../types'
import { HOTEL_AREAS, resolveStay } from '../data/source'
import { matchText } from '../model/musthave'
import { patchPersonal, patchTrip, personalOf, useGroup, useStore } from '../store'
import { Avatar, ChipToggle, StepBar, price } from '../components/Bits'
import { XIcon } from '../components/Icons'
import { GroupTable } from '../components/GroupTable'
import '../styles/setup.css'

export const TRIP_PREFS: { value: TripPref; label: string }[] = [
  { value: 'traditional', label: 'Eat traditionally' },
  { value: 'trendy', label: 'Trendy areas' },
  { value: 'local', label: 'Where locals eat' },
  { value: 'treat', label: 'Happy to splurge' },
  { value: 'near', label: 'Close to where we stay' },
]

const BUDGETS: (Budget['maxPriceLevel'] | null)[] = [null, 1, 2, 3]

// the map only offers Barcelona, the one city in the prototype
const CITY_BOUNDS = L.latLngBounds([41.32, 2.05], [41.47, 2.25])
const round = (n: number) => Math.round(n * 1e5) / 1e5
const noEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

export const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
)

/** A small map of the city. A tap moves the pin of the stay. */
function StayMap({ point, onPick }: { point: LatLng; onPick: (p: LatLng) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const pin = useRef<L.Marker | null>(null)
  const pick = useRef(onPick)
  pick.current = onPick
  const start = useRef(point)

  useEffect(() => {
    if (!el.current) return
    const p: L.LatLngExpression = [start.current.latitude, start.current.longitude]
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, maxBounds: CITY_BOUNDS, maxBoundsViscosity: 1, minZoom: 12 }).setView(p, 14)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    pin.current = L.marker(p, {
      icon: L.divIcon({ className: '', html: '<div class="map-pin hotel">H</div>', iconSize: [30, 30], iconAnchor: [15, 15] }),
      interactive: false,
      keyboard: false,
    }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (CITY_BOUNDS.contains(e.latlng)) pick.current({ latitude: round(e.latlng.lat), longitude: round(e.latlng.lng) })
    })
    // wait one frame so the container has its final size
    const t = setTimeout(() => m.invalidateSize(), 60)
    return () => { clearTimeout(t); m.remove(); pin.current = null }
  }, [])

  useEffect(() => {
    pin.current?.setLatLng([point.latitude, point.longitude])
  }, [point.latitude, point.longitude])

  return <div className="stay-map" ref={el} role="application" aria-label="Map of Barcelona. Tap where you stay." />
}

/** A preset area, or a custom name and a tap on the map. */
function StayPicker() {
  const { state, set } = useStore()
  const stay = state.trip.stay
  const custom = stay.kind === 'custom'
  const setStay = (next: Stay) => set((s) => patchTrip(s, { stay: next }))
  // changes to a custom stay always start from the latest saved one, so a typed name and a map tap never overwrite each other
  const editCustom = (patch: Partial<Extract<Stay, { kind: 'custom' }>>) =>
    set((s) => (s.trip.stay.kind === 'custom' ? patchTrip(s, { stay: { ...s.trip.stay, ...patch } }) : {}))
  const goCustom = () => {
    if (custom) return
    const here = resolveStay(stay)
    setStay({ kind: 'custom', label: '', latitude: here.latitude, longitude: here.longitude })
  }
  return (
    <div className="field">
      <span className="label" id="area-label">Where are you staying?</span>
      <div className="chips" role="group" aria-labelledby="area-label">
        {HOTEL_AREAS.map((h) => (
          <button key={h.id} type="button" className="chip" aria-pressed={stay.kind === 'area' && stay.id === h.id}
            onClick={() => setStay({ kind: 'area', id: h.id })}>
            {h.label}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={custom} onClick={goCustom}>Somewhere else</button>
      </div>
      {custom && (
        <>
          <input className="input" aria-label="Hotel name or address" placeholder="Hotel name or address" maxLength={60}
            value={stay.label} onKeyDown={noEnter} onChange={(e) => editCustom({ label: e.target.value })} />
          <StayMap point={stay} onPick={(p) => editCustom(p)} />
          <p className="small muted">Tap the map where it is. Walking times start from the pin.</p>
        </>
      )}
    </div>
  )
}

/** The shared trip: where the group stays and when. Set by whoever starts the trip, edited later in Our trip. */
export function TripFields() {
  const { state, set } = useStore()
  const trip = state.trip
  const patch = (p: Partial<typeof trip>) => set((s) => patchTrip(s, p))
  return (
    <>
      <StayPicker />
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
    </>
  )
}

/** Free-text entries as removable chips, with a field to add one more. Each chip says how many places it matches. */
function TextChips({ label, placeholder, items, onChange, max = 5 }: {
  label: string
  placeholder: string
  items: string[]
  onChange: (next: string[]) => void
  max?: number
}) {
  const { restaurants } = useStore()
  const [text, setText] = useState('')
  const value = text.trim()
  const add = () => {
    if (!value || items.some((t) => t.toLowerCase() === value.toLowerCase())) return setText('')
    onChange([...items, value])
    setText('')
  }
  const matches = (t: string) => restaurants.filter((r) => matchText(r, t)).length
  return (
    <>
      {items.length > 0 && (
        <ul className="chips" aria-label={label} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((t) => {
            const n = matches(t)
            return (
              <li key={t} className="chip mine">
                {t}
                <span className="count">{n === 0 ? 'no match yet' : `${n} ${n === 1 ? 'place' : 'places'}`}</span>
                <button type="button" className="chip-x" aria-label={`Remove ${t}`} onClick={() => onChange(items.filter((x) => x !== t))}>
                  <XIcon size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {items.length < max && (
        <div className="add-row">
          <input className="input" aria-label={label} placeholder={placeholder} value={text} maxLength={40}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <button type="button" className="btn slim" disabled={!value} onClick={add}>Add</button>
        </div>
      )}
    </>
  )
}

/** This member's own wishes for the trip: mood, own words, must-haves and budget. Never shown to the group. */
export function PersonalTripFields() {
  const { state, set } = useStore()
  const mine = personalOf(state, 'me')
  const patch = (p: Partial<PersonalTrip>) => set((s) => patchPersonal(s, 'me', p))
  return (
    <>
      <div className="field">
        <span className="label">What are you in the mood for?</span>
        <ChipToggle label="Trip preferences" options={TRIP_PREFS} selected={mine.prefs} onChange={(prefs) => patch({ prefs })} />
        <TextChips label="Add your own preference" placeholder="Add your own, e.g. natural wine"
          items={mine.customPrefs} onChange={(customPrefs) => patch({ customPrefs })} />
      </div>
      <div className="field">
        <span className="label">Must-haves on this trip</span>
        <TextChips label="Add a must-have" placeholder="Paella, no negotiation"
          items={mine.mustHaves.map((h) => h.text)} onChange={(t) => patch({ mustHaves: t.map((text) => ({ text })) })} />
        <p className="small muted">Places that have it move up for you.</p>
      </div>
      <div className="field">
        <span className="label" id="budget-label">Budget</span>
        <div className="chips" role="radiogroup" aria-labelledby="budget-label">
          {BUDGETS.map((b) => (
            <button key={b ?? 'any'} type="button" role="radio" className="chip" aria-label={b === null ? 'Any price' : `Up to ${price(b)}`}
              aria-checked={(mine.budget?.maxPriceLevel ?? null) === b} onClick={() => patch({ budget: b === null ? null : { maxPriceLevel: b } })}>
              {b === null ? 'Any' : price(b)}
            </button>
          ))}
        </div>
        <p className="small muted">Your top price. Pricier places move down for you.</p>
      </div>
    </>
  )
}

/** The one trip that exists in the prototype. A real backend would look codes up. */
export const DEMO_TRIP = {
  code: 'BCN-2611', city: 'Barcelona', from: '2026-11-20', to: '2026-11-23', invitedBy: 'mia',
  stay: { kind: 'area', id: 'gotic' } as Stay,
}

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
    set({ stage: 'details', trip: { ...state.trip, code: c, role: 'guest', stay: DEMO_TRIP.stay, from: DEMO_TRIP.from, to: DEMO_TRIP.to } })
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
          <p className="eyebrow">Step 2 of 4</p>
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

/** Code, link and share button. Used in the invite step and on the Our trip tab. */
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
      await navigator.share({ title: 'Forkcast', text: `Join our trip with the code ${code}`, url: link })
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
          <p className="eyebrow">Step 2 of 4</p>
          <h1 className="title">Invite your group</h1>
          <p className="muted">Everyone who joins swipes on their own phone. You can invite more people later in Our trip.</p>
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

/** The trip as someone who joined sees it: filled in by the person who started it. */
function TripGiven({ by }: { by: string }) {
  const { state } = useStore()
  const { hotel } = useGroup()
  return (
    <section className="card trip-given" aria-labelledby="given-h">
      <div className="row between">
        <h2 className="h2" id="given-h">The trip</h2>
        <span className="small muted">Set by {by}</span>
      </div>
      <dl>
        <dt>Stay</dt><dd>Barcelona · {hotel.label}</dd>
        <dt>Dates</dt><dd>{day(state.trip.from)} to {day(state.trip.to)}</dd>
      </dl>
      <p className="small muted">The group can change it later in Our trip.</p>
    </section>
  )
}

/** Step 3: the shared trip (set by its starter, filled in for everyone else), then this person's own wishes. */
export function TripDetails() {
  const { state, set } = useStore()
  const { members } = useGroup()
  const owner = state.trip.role === 'owner'
  const starter = members.find((m) => m.id === DEMO_TRIP.invitedBy) ?? members.find((m) => m.simulated)
  return (
    <form className="screen-form" onSubmit={(e) => { e.preventDefault(); set({ stage: 'ready' }) }}>
      <div className="screen">
        <div className="stack" style={{ gap: 28 }}>
          <div className="stack" style={{ gap: 8 }}>
            <StepBar step={3} />
            <p className="eyebrow">Step 3 of 4 · Trip {state.trip.code}</p>
            <h1 className="title">{owner ? 'Set up the trip' : 'You are in'}</h1>
            <p className="muted">{owner ? 'Where the group stays and when. Barcelona is the only city in this prototype.' : 'The trip is set. One more thing, just for you.'}</p>
          </div>

          {owner ? (
            <section className="setup-section" aria-label="The trip">
              <TripFields />
              <p className="small muted">Everyone in the group sees this.</p>
            </section>
          ) : (
            <TripGiven by={starter?.name ?? 'the group'} />
          )}

          {/* @hcai AMR-05 Mood, own words, must-haves and budget sit apart from the shared trip under "Only you see this", and the group only ever sees the combined ranking */}
          <section className="setup-section" aria-labelledby="mine-h">
            <div className="setup-section-head">
              <h2 className="h2" id="mine-h">Just for you</h2>
              <p className="privacy-hint"><LockIcon />Only you see this</p>
              <p className="small muted">It moves places up or down for you. Nobody sees what you picked.</p>
            </div>
            <PersonalTripFields />
          </section>
          <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set({ stage: owner ? 'invite' : 'trip' })}>Back</button>
        </div>
      </div>
      <div className="screen-foot">
        <button className="btn primary">Done</button>
      </div>
    </form>
  )
}

/** Step 4: setup is done. Straight to swiping, or first a look at the trip. */
export function ReadyStep({ onDone }: { onDone: (to: 'trip' | 'swipe') => void }) {
  const { state, set } = useStore()
  const { members, hotel } = useGroup()
  return (
    <div className="screen-form">
      <div className="screen">
        <div className="stack" style={{ gap: 8 }}>
          <StepBar step={4} />
          <p className="eyebrow">Step 4 of 4 · Trip {state.trip.code}</p>
        </div>
        <div className="ready">
          <GroupTable members={members} size={190} seat={42} animateKey="ready" />
          <h1 className="title">You're all set!</h1>
          <p className="muted">Ready to swipe? Every swipe teaches the app your taste.</p>
          <p className="small muted">Barcelona · {hotel.label} · {members.length} people</p>
        </div>
        <button className="link" style={{ alignSelf: 'flex-start', marginTop: 16 }} onClick={() => set({ stage: 'details' })}>Back</button>
      </div>
      <div className="screen-foot">
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn primary" onClick={() => onDone('swipe')}>Start swiping</button>
          <button className="btn" onClick={() => onDone('trip')}>Group overview</button>
        </div>
      </div>
    </div>
  )
}
