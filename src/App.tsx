import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import type { Restaurant } from './types'
import { restaurantSource } from './data/source'
import { StoreProvider, useStore } from './store'
import { TabBar, type Tab } from './components/TabBar'
import { Welcome } from './screens/Welcome'
import { ProfileSetup } from './screens/Profile'
import { InviteStep, ReadyStep, TripDetails, TripEntry } from './screens/JoinTrip'
import { SwipeScreen } from './screens/Swipe'
import { RankingScreen } from './screens/Ranking'
import { TripScreen } from './screens/Trip'
import { ProfileScreen } from './screens/Profile'
import './styles/dashboard-swipe.css'

export function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null)
  useEffect(() => {
    restaurantSource.list().then(setRestaurants)
  }, [])
  if (!restaurants) return <div className="phone" aria-busy="true" />
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider restaurants={restaurants}>
        <Shell />
      </StoreProvider>
    </MotionConfig>
  )
}

function Shell() {
  const { state, set } = useStore()
  const [tab, setTab] = useState<Tab>('swipe')
  // the last setup step lets the member choose where to land: the trip overview or the swipe deck
  const finishSetup = (to: Tab) => {
    setTab(to)
    set({ stage: 'app' })
  }
  if (state.stage === 'welcome') return <div className="phone"><Welcome /></div>
  if (state.stage === 'profile') return <div className="phone"><ProfileSetup /></div>
  if (state.stage === 'trip') return <div className="phone"><TripEntry /></div>
  if (state.stage === 'invite') return <div className="phone"><InviteStep /></div>
  if (state.stage === 'details') return <div className="phone"><TripDetails /></div>
  if (state.stage === 'ready') return <div className="phone"><ReadyStep onDone={finishSetup} /></div>
  return (
    <div className="phone">
      {tab === 'swipe' && <SwipeScreen goToRanking={() => setTab('ranking')} />}
      {tab === 'ranking' && <RankingScreen goToSwipe={() => setTab('swipe')} />}
      {tab === 'trip' && <TripScreen />}
      {tab === 'profile' && <ProfileScreen />}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
