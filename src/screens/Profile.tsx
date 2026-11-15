import { useEffect, useState } from 'react'
import type { Allergy, Diet } from '../types'
import { deleteProfile, eraseLearning, useGroup, useStore } from '../store'
import { confidence, tasteProfile } from '../model/learn'
import { featureLabel } from '../model/features'
import { motion } from 'framer-motion'
import { ACCESSORIES, CHARACTERS, FoodAvatar, avatarId, avatarParts } from '../components/FoodAvatar'
import { Avatar, ChipToggle, StepBar, Switch, swipes } from '../components/Bits'
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

/** "Vegetarian, no nuts", or a plain line when there is nothing to list. */
function foodSummary(diets: Diet[], allergies: Allergy[]): string {
  const parts = [...diets, ...allergies.map((a) => `no ${a}`)]
  if (parts.length === 0) return 'No diet or allergies'
  const text = parts.join(', ')
  return text[0].toUpperCase() + text.slice(1)
}

const pickOne = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const randomAvatar = () => avatarId(pickOne(CHARACTERS).id, pickOne(ACCESSORIES).id)

function PersonFields() {
  const { state, set } = useStore()
  // the character builder is one tap away, so the screen first shows a face, a name and the food questions
  const [choosing, setChoosing] = useState(false)
  const { character, accessory } = avatarParts(state.avatar)
  const pick = (c: string, a: string) => set({ avatar: avatarId(c, a) })
  return (
    <>
      <div className="field">
        <span className="label" id="avatar-label">Who are you at the table?</span>
        <div className="avatar-stage">
          <motion.span key={state.avatar} className="avatar-big" style={{ background: character?.bg ?? 'var(--surface)' }}
            initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }}>
            {character ? <FoodAvatar id={state.avatar} /> : <span aria-hidden="true">{state.name.trim()[0]?.toUpperCase() || '?'}</span>}
          </motion.span>
          <p className="small muted" aria-live="polite">
            {character
              ? `${character.label}${accessory ? ` with ${ACCESSORIES.find((x) => x.id === accessory)?.label.toLowerCase()}` : ''}`
              : 'No character yet.'}
          </p>
          <div className="row" style={{ gap: 24 }}>
            <button type="button" className="link" onClick={() => set({ avatar: randomAvatar() })}>Surprise me</button>
            <button type="button" className="link" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>
              {choosing ? 'Done' : 'Choose my own'}
            </button>
          </div>
        </div>
        {choosing && (
          <>
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
      <p className="note">
        These hide places you cannot eat at, for the whole group. The group sees that a place is
        ruled out, never by whom.
      </p>
    </>
  )
}

export function ProfileSetup() {
  const { state, set } = useStore()
  // a new member starts with a random character, so the first screen asks for less
  useEffect(() => {
    if (!state.avatar) set({ avatar: randomAvatar() })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <form className="screen-form" onSubmit={(e) => { e.preventDefault(); set({ stage: 'trip' }) }}>
      <div className="screen">
        <div className="stack" style={{ gap: 24 }}>
          <div className="stack" style={{ gap: 8 }}>
            <StepBar step={1} />
            <p className="eyebrow">Step 1 of 3</p>
            <h1 className="title">About you</h1>
            <p className="muted">A face for the group, and what you can eat.</p>
          </div>
          <PersonFields />
        </div>
      </div>
      <div className="screen-foot">
        <button className="btn primary" disabled={!state.name.trim()}>Continue</button>
      </div>
    </form>
  )
}

export function ProfileScreen() {
  const { state, set } = useStore()
  const { members, weights, actor } = useGroup()
  const [confirm, setConfirm] = useState<'erase' | 'delete' | null>(null)
  const [editing, setEditing] = useState(false)
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

        {/* one summary row, and the full form only while editing */}
        <section className="stack" aria-label="About you">
          <h2 className="h2">About you</h2>
          <div className="card row">
            <Avatar member={{ name: state.name || 'You', color: '#E0144C', avatar: state.avatar }} />
            <div className="grow">
              <p className="strong">{state.name || 'You'}</p>
              <p className="small muted">{foodSummary(state.diets, state.allergies)}</p>
            </div>
            <button className="btn slim" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
          </div>
          {editing && <PersonFields />}
        </section>

        <section className="stack" aria-label="Settings">
          <h2 className="h2">Settings</h2>
          {/* @hcai FAIR-13 "Popular with" uses taste groups, not age or gender, and stays off until a member turns it on */}
          <div className="toggle-row">
            <div className="grow">
              <p className="strong">Show who tends to like each place</p>
              <p className="small muted">Taste groups such as “seafood fans”. Sample data.</p>
            </div>
            <Switch checked={state.showPopularWith} onChange={(v) => set({ showPopularWith: v })} label="Show who tends to like each place" />
          </div>
          {/* @hcai FAIR-17 Showing my reasons to the group by name is my choice, off by default, and can be switched back any time */}
          <div className="toggle-row">
            <div className="grow">
              <p className="strong">Show my reasons to the group</p>
              <p className="small muted">On: they show next to your name. Off: they are only counted.</p>
            </div>
            <Switch checked={actor.sharesReasons} onChange={(v) => set((s) => ({ share: { ...s.share, [actor.id]: v } }))} label="Show my reasons to the group" />
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

        {/* not a real setting: it only exists to show the prototype, so it sits apart at the end */}
        <section className="stack" aria-labelledby="demo-h">
          <h2 className="h2" id="demo-h">Demo tools</h2>
          <div className="field">
            <span className="label" id="act-label">Use the app as</span>
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
      </div>
    </div>
  )
}
