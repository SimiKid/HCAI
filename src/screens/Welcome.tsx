import { useStore } from '../store'
import { ForkIcon } from '../components/Icons'

// circles laid out like a loose cluster: [left %, top %, size px]
const SPOTS: [number, number, number][] = [
  [34, 6, 150],
  [74, -4, 170],
  [8, 38, 190],
  [58, 40, 120],
  [66, 62, 230],
]

export function Welcome() {
  const { set, restaurants } = useStore()
  const picks = ['tapas', 'seafood', 'pizza', 'vegan', 'catalan']
    .map((t) => restaurants.find((r) => r.primaryType === t))
    .filter((r) => r !== undefined)
  return (
    <div className="welcome">
      <div className="collage" aria-hidden="true">
        <div className="logo" style={{ left: 24, top: 'calc(20px + env(safe-area-inset-top))', width: 64, height: 64 }}>
          <ForkIcon size={30} />
        </div>
        {picks.map((r, i) => (
          <img key={r.id} src={r.photos[0].src} alt=""
            style={{ left: `${SPOTS[i][0]}%`, top: `${SPOTS[i][1]}%`, width: SPOTS[i][2], height: SPOTS[i][2] }} />
        ))}
      </div>
      <div className="stack" style={{ gap: 12, paddingTop: 24 }}>
        <p className="eyebrow">Restaurant Tinder</p>
        <h1 className="title" style={{ fontSize: '2.25rem' }}>Dinner,<br />decided together.</h1>
        {/* @hcai AMR-01 The first screen says what the app does and that it only guesses, before any data is asked for */}
        <p className="muted">
          Swipe on places you like. The app learns your taste and ranks restaurants for your whole
          group. It only guesses, and your group always has the last word.
        </p>
        <button className="btn primary" style={{ marginTop: 12 }} onClick={() => set({ stage: 'profile' })}>
          Get started
        </button>
      </div>
    </div>
  )
}
