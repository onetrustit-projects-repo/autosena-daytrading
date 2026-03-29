import React, { useState, useEffect } from 'react'

const mockUserData = {
  user: {
    id: 'user_demo_123',
    username: 'DemoTrader',
    display_name: 'Demo Trader',
    avatar_url: null,
    total_profit: 547.32,
    total_trades: 100,
    winning_trades: 63,
    losing_trades: 37,
    followers_count: 10,
    following_count: 5,
    credits: 1250,
    created_at: '2024-01-15T10:00:00Z',
    streak: {
      current_streak: 3,
      longest_streak: 7,
      isActive: true,
      last_profitable_date: '2024-03-28'
    },
    achievementsCount: 5
  }
}

const mockCalendar = [
  { date: '2024-03-28', profitable: true },
  { date: '2024-03-27', profitable: true },
  { date: '2024-03-26', profitable: false },
  { date: '2024-03-25', profitable: true },
  { date: '2024-03-24', profitable: true },
  { date: '2024-03-23', profitable: true },
  { date: '2024-03-22', profitable: false },
  { date: '2024-03-21', profitable: true },
  { date: '2024-03-20', profitable: true },
  { date: '2024-03-19', profitable: true },
  { date: '2024-03-18', profitable: true },
  { date: '2024-03-17', profitable: false },
  { date: '2024-03-16', profitable: true },
  { date: '2024-03-15', profitable: true },
]

export function Profile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setUser(mockUserData.user)
      setLoading(false)
    }, 500)
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-700"></div>
            <div className="space-y-3">
              <div className="h-6 w-48 bg-slate-700 rounded"></div>
              <div className="h-4 w-32 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const winRate = user.total_trades > 0 
    ? ((user.winning_trades / user.total_trades) * 100).toFixed(1) 
    : 0

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-brand-500/30">
            {user.username.slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
            <p className="text-slate-400">@{user.username}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <span className="text-brand-400">👥</span>
                <span className="text-white font-medium">{user.followers_count}</span>
                <span className="text-slate-500 text-sm">followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-brand-400">🎖️</span>
                <span className="text-white font-medium">{user.achievementsCount}</span>
                <span className="text-slate-500 text-sm">achievements</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-400">🪙</span>
                <span className="text-white font-medium">{user.credits}</span>
                <span className="text-slate-500 text-sm">credits</span>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <button className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
            <span>📤</span>
            Share Profile
          </button>
        </div>
      </div>

      {/* Streak Banner */}
      {user.streak?.current_streak > 0 && (
        <div className="card p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-pulse">🔥</div>
              <div>
                <p className="text-2xl font-bold text-white">{user.streak.current_streak} Day Streak!</p>
                <p className="text-slate-400">Keep it going! Best: {user.streak.longest_streak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 text-sm">Active</p>
              <p className="text-white font-medium">+{user.streak.current_streak * 5} daily bonus</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['stats', 'calendar', 'achievements', 'social'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all capitalize
              ${activeTab === tab
                ? 'bg-brand-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6">
            <p className="text-slate-400 text-sm mb-1">Total Profit</p>
            <p className={`text-3xl font-bold ${user.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {user.total_profit >= 0 ? '+' : ''}${Math.abs(user.total_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-slate-400 text-sm mb-1">Win Rate</p>
            <p className={`text-3xl font-bold ${parseFloat(winRate) >= 60 ? 'text-emerald-400' : parseFloat(winRate) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {winRate}%
            </p>
          </div>
          <div className="card p-6">
            <p className="text-slate-400 text-sm mb-1">Total Trades</p>
            <p className="text-3xl font-bold text-white">{user.total_trades}</p>
          </div>
          <div className="card p-6">
            <p className="text-slate-400 text-sm mb-1">Avg Win</p>
            <p className="text-3xl font-bold text-brand-400">
              ${((user.total_profit / user.total_trades) * 2).toFixed(2)}
            </p>
          </div>

          {/* Win/Loss Breakdown */}
          <div className="card p-6 md:col-span-2">
            <p className="text-slate-400 text-sm mb-3">Win/Loss Breakdown</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${winRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-emerald-400 font-semibold">{user.winning_trades}</span>
                  <span className="text-slate-500"> wins</span>
                </div>
                <div>
                  <span className="text-red-400 font-semibold">{user.losing_trades}</span>
                  <span className="text-slate-500"> losses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="card p-6 md:col-span-2">
            <p className="text-slate-400 text-sm mb-3">Risk Score</p>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🛡️</div>
              <div>
                <p className="text-2xl font-bold text-brand-400">B+</p>
                <p className="text-slate-500 text-sm">Good risk management</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Calendar (Last 14 Days)</h3>
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
            {mockCalendar.map((day, idx) => (
              <div 
                key={idx} 
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                  ${day.profitable 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }
                `}
                title={day.date}
              >
                {day.date.split('-')[2]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
              <span className="text-slate-400">Profitable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/10 border border-red-500/20"></div>
              <span className="text-slate-400">Loss</span>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {['💵', '🔥', '📊', '💰', '👥', '🏆', '⚡', '🎯'].map((icon, idx) => (
            <div key={idx} className="card p-4 text-center card-hover">
              <div className="text-4xl mb-2">{icon}</div>
              <p className="text-white text-sm font-medium">Badge {idx + 1}</p>
              <p className="text-slate-500 text-xs">Earned</p>
            </div>
          ))}
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Social Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Followers</p>
              <p className="text-2xl font-bold text-white">{user.followers_count}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Following</p>
              <p className="text-2xl font-bold text-white">{user.following_count}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium">Edit Profile</button>
            <button className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium">Copy Trading Settings</button>
          </div>
        </div>
      )}
    </div>
  )
}
