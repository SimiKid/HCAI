import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import type { Restaurant } from './types'
import { restaurantSource } from './data/source'
import { StoreProvider, useStore } from './store'
import { TabBar, type Tab } from './components/TabBar'
import { Welcome } from './screens/Welcome'
import { ProfileSetup } from './screens/Profile'
import { JoinTrip } from './screens/JoinTrip'
import { SwipeScreen } from './screens/Swipe'
import { RankingScreen } from './screens/Ranking'
import { TripScreen } from './screens/Trip'
import { ProfileScreen } from './screens/Profile'

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
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('swipe')
  if (state.stage === 'welcome') return <div className="phone"><Welcome /></div>
  if (state.stage === 'profile') return <div className="phone"><ProfileSetup /></div>
  if (state.stage === 'trip') return <div className="phone"><JoinTrip /></div>
  return (
    <div className="phone">
      {tab === 'swipe' && <SwipeScreen goToRanking={() => setTab('ranking')} />}
      {tab === 'ranking' && <RankingScreen />}
      {tab === 'trip' && <TripScreen />}
      {tab === 'profile' && <ProfileScreen />}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
