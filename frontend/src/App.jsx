import React, { useState, useEffect } from 'react'
import { SentimentDashboard } from './pages/SentimentDashboard'
import { SignalsFeed } from './pages/SignalsFeed'
import { AlertsPage } from './pages/AlertsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [userId] = useState('user_demo')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <SentimentDashboard />
      case 'signals': return <SignalsFeed />
      case 'alerts': return <AlertsPage userId={userId} />
      default: return <SentimentDashboard />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <span className="text-xl">📡</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Sentiment Signals</h1>
                <p className="text-xs text-slate-400">Social Trading Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['dashboard', 'signals', 'alerts'].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    currentPage === page
                      ? 'bg-violet-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
