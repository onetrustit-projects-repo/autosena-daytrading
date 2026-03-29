import React from 'react'

const navItems = [
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'achievements', label: 'Achievements', icon: '🎖️' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

export function Navigation({ currentPage, onNavigate }) {
  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AutoSena</h1>
              <p className="text-xs text-slate-400">Trading Leaderboard</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${currentPage === item.id
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Demo User</p>
              <p className="text-xs text-brand-400">1,250 Credits</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900">
              DU
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
