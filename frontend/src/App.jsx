import React, { useState } from 'react'
import { Leaderboard } from './pages/Leaderboard'
import { Achievements } from './pages/Achievements'
import { Profile } from './pages/Profile'
import { Rewards } from './pages/Rewards'
import { Navigation } from './components/Navigation'

function App() {
  const [currentPage, setCurrentPage] = useState('leaderboard')
  const [userId] = useState('user_demo_123') // Demo user

  const renderPage = () => {
    switch (currentPage) {
      case 'leaderboard':
        return <Leaderboard userId={userId} />
      case 'achievements':
        return <Achievements userId={userId} />
      case 'profile':
        return <Profile userId={userId} />
      case 'rewards':
        return <Rewards userId={userId} />
      default:
        return <Leaderboard userId={userId} />
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
