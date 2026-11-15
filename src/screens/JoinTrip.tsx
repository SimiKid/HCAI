import type { TripPref } from '../types'
import { HOTEL_AREAS } from '../data/source'
import { useGroup, useStore } from '../store'
import { Avatar, ChipToggle } from '../components/Bits'

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

export function JoinTrip() {
  const { state, set } = useStore()
  const { members } = useGroup()
  const others = members.filter((m) => m.simulated)
  const trip = state.trip
  return (
    <div className="screen">
      <form className="stack" style={{ gap: 24 }} onSubmit={(e) => { e.preventDefault(); set({ stage: 'app' }) }}>
        <div className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">Step 2 of 2</p>
          <h1 className="title">Join your group</h1>
        </div>
        <div className="field">
          <label htmlFor="code">Trip code</label>
          <input id="code" className="input" value={trip.code} autoCapitalize="characters"
            onChange={(e) => set({ trip: { ...trip, code: e.target.value.toUpperCase() } })} />
          <div className="card row" style={{ padding: 12 }}>
            <div className="row" style={{ gap: 4 }}>
              {others.map((m) => <Avatar key={m.id} member={m} />)}
            </div>
            <p className="small grow">
              <span className="strong">Barcelona trip.</span> {others.map((m) => m.name).join(', ')} are already in.
            </p>
          </div>
        </div>
        <TripFields />
        <button className="btn primary" disabled={!trip.code.trim()}>Start swiping</button>
      </form>
    </div>
  )
}
