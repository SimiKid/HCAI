import { useState } from 'react'
import type { Allergy, Diet } from '../types'
import { deleteProfile, eraseLearning, useGroup, useStore } from '../store'
import { confidence, tasteProfile } from '../model/learn'
import { featureLabel } from '../model/features'
import { motion } from 'framer-motion'
import { ACCESSORIES, CHARACTERS, FoodAvatar, avatarId, avatarParts } from '../components/FoodAvatar'
import { ChipToggle, Switch, swipes } from '../components/Bits'
import { XIcon } from '../components/Icons'
import { ConfidenceDots } from '../components/ConfidenceDots'

const DIETS: { value: Diet; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten-free', label: 'Gluten-free' },
]
const ALLERGIES: { value: Allergy; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
]

function PersonFields() {
  const { state, set } = useStore()
  const { character, accessory } = avatarParts(state.avatar)
  const pick = (c: string, a: string) => set({ avatar: avatarId(c, a) })
  const surprise = () => {
    const c = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id
    const a = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id
    pick(c, a)
  }
  return (
    <>
      <div className="field">
        <div className="row between">
          <span className="label" id="avatar-label">Who are you at the table?</span>
          <button type="button" className="link" onClick={surprise}>Surprise me</button>
        </div>
        <div className="avatar-stage">
          <motion.span key={state.avatar} className="avatar-big" style={{ background: character?.bg ?? 'var(--surface)' }}
            initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }}>
            {character ? <FoodAvatar id={state.avatar} /> : <span aria-hidden="true">{state.name.trim()[0]?.toUpperCase() || '?'}</span>}
          </motion.span>
          <p className="small muted" aria-live="polite">
            {character
              ? `${character.label}${accessory ? ` with ${ACCESSORIES.find((x) => x.id === accessory)?.label.toLowerCase()}` : ''}`
              : 'Pick a character, then dress it up.'}
          </p>
        </div>
        <div className="avatar-grid" role="radiogroup" aria-labelledby="avatar-label">
          {CHARACTERS.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={character?.id === c.id} aria-label={c.label}
              className="avatar-pick" style={{ background: c.bg }} onClick={() => pick(c.id, accessory)}>
              <FoodAvatar id={c.id} still />
            </button>
          ))}
        </div>
        {character && (
          <>
            <span className="label" id="acc-label" style={{ marginTop: 8 }}>Dress it up</span>
            <div className="chips scroll" role="radiogroup" aria-labelledby="acc-label" style={{ paddingTop: 12, paddingBottom: 6 }}>
              {ACCESSORIES.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={accessory === a.id} aria-label={a.label}
                  className="avatar-pick acc" style={{ background: character.bg }} onClick={() => pick(character.id, a.id)}>
                  <FoodAvatar id={avatarId(character.id, a.id)} still />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="field">
        <label htmlFor="name">Your first name</label>
        <input id="name" className="input" value={state.name} autoComplete="given-name"
          onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="field">
        <span className="label">Diet</span>
        <ChipToggle label="Diet" options={DIETS} selected={state.diets} onChange={(diets) => set({ diets })} />
      </div>
      <div className="field">
        <span className="label">Allergies</span>
        <ChipToggle label="Allergies" options={ALLERGIES} selected={state.allergies} onChange={(allergies) => set({ allergies })} />
      </div>
      {/* @hcai AMR-16 Before saving, the form says what a diet or allergy will do: hide places for the whole group */}
      <p className="note">
        Diets and allergies hide places you cannot eat at, for you and for the group ranking. They
        are stored on this phone only. You can change or delete them any time in Profile.
      </p>
    </>
  )
}

export function ProfileSetup() {
  const { state, set } = useStore()
  return (
    <div className="screen">
      <form className="stack" style={{ gap: 24 }} onSubmit={(e) => { e.preventDefault(); set({ stage: 'trip' }) }}>
        <div className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="title">About you</h1>
          <p className="muted">A face for the group, and what you can eat, so you never end up somewhere that does not work for you.</p>
        </div>
        <PersonFields />
        <button className="btn primary" disabled={!state.name.trim()}>Continue</button>
      </form>
    </div>
  )
}

export function ProfileScreen() {
  const { state, set } = useStore()
  const { members, weights, actor } = useGroup()
  const [confirm, setConfirm] = useState<'erase' | 'delete' | null>(null)
  const taste = tasteProfile(weights[actor.id])
  const likes = taste.filter((t) => t.weight > 0).slice(0, 8)
  const skips = taste.filter((t) => t.weight < 0).reverse().slice(0, 8)
  const conf = confidence(actor.swipes.length)
  const forget = (feature: string) =>
    set((s) => ({ muted: { ...s.muted, [actor.id]: [...(s.muted[actor.id] ?? []), feature] } }))

  return (
    <div className="screen">
      <div className="stack" style={{ gap: 24 }}>
        <h1 className="title">Profile</h1>

        {/* @hcai MM-03 The app's picture of the member is on screen as chips, and each chip can be removed */}
        <section className="card stack" aria-labelledby="taste-h">
          <div className="row between">
            <h2 className="h2" id="taste-h">What the app thinks {actor.id === 'me' ? 'you like' : `${actor.name} likes`}</h2>
          </div>
          <div className="conf"><ConfidenceDots level={conf.level} />{conf.label} · {swipes(actor.swipes.length)}</div>
          {taste.length === 0 && <p className="small muted">Nothing yet. Swipe a few places and come back.</p>}
          {likes.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              <p className="small strong">Likes</p>
              <div className="chips">
                {likes.map((t) => (
                  <button key={t.feature} className="chip" onClick={() => forget(t.feature)} aria-label={`Forget: ${featureLabel(t.feature)}`}>
                    {featureLabel(t.feature)} <XIcon size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {skips.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              <p className="small strong">Tends to skip</p>
              <div className="chips">
                {skips.map((t) => (
                  <button key={t.feature} className="chip" onClick={() => forget(t.feature)} aria-label={`Forget: ${featureLabel(t.feature)}`}>
                    {featureLabel(t.feature)} <XIcon size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {taste.length > 0 && <p className="small muted">Wrong? Tap a chip and the app forgets it.</p>}
          {(state.muted[actor.id]?.length ?? 0) > 0 && (
            <button className="link" style={{ alignSelf: 'flex-start' }}
              onClick={() => set((s) => ({ muted: { ...s.muted, [actor.id]: [] } }))}>
              Bring back {state.muted[actor.id].length} forgotten
            </button>
          )}
        </section>

        <section className="stack" aria-label="About you">
          <h2 className="h2">About you</h2>
          <PersonFields />
        </section>

        <section className="stack" aria-label="Settings">
          <h2 className="h2">Settings</h2>
          {/* @hcai FAIR-13 "Popular with" uses taste groups, not age or gender, and stays off until a member turns it on */}
          <div className="toggle-row">
            <div className="grow">
              <p className="strong">Show who tends to like each place</p>
              <p className="small muted">Taste groups such as “seafood fans”. Sample data, off by default.</p>
            </div>
            <Switch checked={state.showPopularWith} onChange={(v) => set({ showPopularWith: v })} label="Show who tends to like each place" />
          </div>
          <div className="field">
            <span className="label" id="act-label">Demo: use the app as</span>
            <div className="chips" role="group" aria-labelledby="act-label">
              {members.map((m) => (
                <button key={m.id} className="chip" aria-pressed={state.actingAs === m.id} onClick={() => set({ actingAs: m.id })}>
                  {m.id === 'me' ? 'Me' : m.name}
                </button>
              ))}
            </div>
            <p className="small muted">The other members are simulated. Switch to swipe or pin as one of them.</p>
          </div>
        </section>

        <section className="stack" aria-label="Your data">
          <h2 className="h2">Your data</h2>
          {confirm === null && (
            <>
              <button className="btn" onClick={() => setConfirm('erase')}>Reset what the app learned</button>
              <button className="btn danger" onClick={() => setConfirm('delete')}>Delete my profile</button>
            </>
          )}
          {confirm === 'erase' && (
            <div className="card stack">
              <p>This removes {actor.id === 'me' ? 'your' : `${actor.name}'s`} swipes from this phone. The ranking goes back to trip preferences only.</p>
              <div className="row">
                <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="btn primary" onClick={() => { set((s) => eraseLearning(s, actor.id)); setConfirm(null) }}>Reset</button>
              </div>
            </div>
          )}
          {confirm === 'delete' && (
            <div className="card stack">
              <p>This deletes your name, diet, allergies, trip and swipes from this phone. It cannot be undone.</p>
              <div className="row">
                <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="btn primary" onClick={() => set(deleteProfile())}>Delete</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
