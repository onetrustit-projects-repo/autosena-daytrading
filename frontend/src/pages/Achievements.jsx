import React, { useState, useEffect } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏆' },
  { id: 'profit', label: 'Profit', icon: '💰' },
  { id: 'streak', label: 'Streaks', icon: '🔥' },
  { id: 'consistency', label: 'Trades', icon: '📊' },
  { id: 'skill', label: 'Skill', icon: '🎯' },
  { id: 'social', label: 'Social', icon: '👥' },
]

const mockAchievements = {
  earned: [
    { id: 'ach_profit_100', code: 'PROFIT_100', name: 'First Hundred', description: 'Earn $100 in total profit', category: 'profit', icon: '💵', threshold: 100, reward_credits: 10, rarity: 'common', completed: true, completed_at: '2024-03-15T10:00:00Z' },
    { id: 'ach_streak_3', code: 'STREAK_3', name: 'Hot Streak', description: '3 consecutive profitable days', category: 'streak', icon: '🔥', threshold: 3, reward_credits: 15, rarity: 'common', completed: true, completed_at: '2024-03-18T10:00:00Z' },
    { id: 'ach_trades_100', code: 'TRADES_100', name: 'Active Trader', description: 'Complete 100 trades', category: 'consistency', icon: '📊', threshold: 100, reward_credits: 30, rarity: 'common', completed: true, completed_at: '2024-03-20T10:00:00Z' },
    { id: 'ach_profit_500', code: 'PROFIT_500', name: 'Half K', description: 'Earn $500 in total profit', category: 'profit', icon: '💰', threshold: 500, reward_credits: 25, rarity: 'common', completed: true, completed_at: '2024-03-22T10:00:00Z' },
    { id: 'ach_followers_10', code: 'FOLLOWERS_10', name: 'Rising Star', description: 'Get 10 followers', category: 'social', icon: '👥', threshold: 10, reward_credits: 20, rarity: 'common', completed: true, completed_at: '2024-03-25T10:00:00Z' },
  ],
  available: [
    { id: 'ach_profit_1k', code: 'PROFIT_1K', name: 'Grand Profit', description: 'Earn $1,000 in total profit', category: 'profit', icon: '💎', threshold: 1000, reward_credits: 50, rarity: 'rare', progress: 547, percentComplete: 54.7 },
    { id: 'ach_streak_5', code: 'STREAK_5', name: 'On Fire', description: '5 consecutive profitable days', category: 'streak', icon: '🔥', threshold: 5, reward_credits: 40, rarity: 'rare', progress: 3, percentComplete: 60 },
    { id: 'ach_profit_5k', code: 'PROFIT_5K', name: 'Big Player', description: 'Earn $5,000 in total profit', category: 'profit', icon: '🏆', threshold: 5000, reward_credits: 150, rarity: 'epic', progress: 547, percentComplete: 10.9 },
    { id: 'ach_winrate_60', code: 'WINRATE_60', name: 'Winning Edge', description: 'Maintain 60% win rate', category: 'skill', icon: '🎯', threshold: 60, reward_credits: 50, rarity: 'rare', progress: 58, percentComplete: 96.7 },
    { id: 'ach_streak_10', code: 'STREAK_10', name: 'Unstoppable', description: '10 consecutive profitable days', category: 'streak', icon: '⚡', threshold: 10, reward_credits: 100, rarity: 'epic', progress: 3, percentComplete: 30 },
    { id: 'ach_trades_500', code: 'TRADES_500', name: 'Trading Machine', description: 'Complete 500 trades', category: 'consistency', icon: '🤖', threshold: 500, reward_credits: 100, rarity: 'rare', progress: 100, percentComplete: 20 },
    { id: 'ach_followers_50', code: 'FOLLOWERS_50', name: 'Popular', description: 'Get 50 followers', category: 'social', icon: '⭐', threshold: 50, reward_credits: 75, rarity: 'rare', progress: 10, percentComplete: 20 },
    { id: 'ach_profit_10k', code: 'PROFIT_10K', name: 'Diamond Hands', description: 'Earn $10,000 in total profit', category: 'profit', icon: '👑', threshold: 10000, reward_credits: 500, rarity: 'legendary', progress: 547, percentComplete: 5.47 },
  ],
  stats: {
    totalEarned: 5,
    totalAvailable: 13,
    credits: 1250,
    rarities: { common: 3, rare: 2, epic: 0, legendary: 0 }
  }
}

const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'common': return 'from-slate-400 to-slate-600'
    case 'rare': return 'from-blue-400 to-blue-600'
    case 'epic': return 'from-purple-400 to-purple-600'
    case 'legendary': return 'from-amber-400 to-orange-500'
    default: return 'from-slate-400 to-slate-600'
  }
}

const getRarityBorder = (rarity) => {
  switch (rarity) {
    case 'common': return 'border-slate-500/30'
    case 'rare': return 'border-blue-500/30'
    case 'epic': return 'border-purple-500/30'
    case 'legendary': return 'border-amber-500/30'
    default: return 'border-slate-500/30'
  }
}

export function Achievements({ userId }) {
  const [category, setCategory] = useState('all')
  const [achievements, setAchievements] = useState(mockAchievements)
  const [loading, setLoading] = useState(true)
  const [showEarned, setShowEarned] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setAchievements(mockAchievements)
      setLoading(false)
    }, 500)
  }, [userId])

  const filteredAvailable = category === 'all' 
    ? achievements.available 
    : achievements.available.filter(a => a.category === category)

  const filteredEarned = category === 'all'
    ? achievements.earned
    : achievements.earned.filter(a => a.category === category)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-slate-400 mt-1">Unlock badges and earn rewards</p>
        </div>

        {/* Stats Card */}
        <div className="card p-4 flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-400">{achievements.stats.totalEarned}</p>
            <p className="text-xs text-slate-400">Earned</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{achievements.stats.totalAvailable}</p>
            <p className="text-xs text-slate-400">Available</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-400">{achievements.stats.credits}</p>
            <p className="text-xs text-slate-400">Credits</p>
          </div>
        </div>
      </div>

      {/* Rarity Summary */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(achievements.stats.rarities).map(([rarity, count]) => (
          <div key={rarity} className={`card px-4 py-2 border ${getRarityBorder(rarity)}`}>
            <span className="text-sm text-slate-400 capitalize">{rarity}: </span>
            <span className="font-bold text-white">{count}</span>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${category === cat.id
                ? 'bg-brand-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Earned Section */}
      {filteredEarned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">✓</span> Earned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEarned.map((achievement, idx) => (
              <div 
                key={achievement.id} 
                className={`
                  card p-4 border ${getRarityBorder(achievement.rarity)} 
                  bg-gradient-to-br ${getRarityColor(achievement.rarity)}/10
                  animate-slide-up
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 capitalize">
                    {achievement.rarity}
                  </span>
                </div>
                <h3 className="text-white font-bold mb-1">{achievement.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{achievement.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400">+{achievement.reward_credits} credits</span>
                  <span className="text-emerald-400">Unlocked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Section */}
      {filteredAvailable.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">In Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAvailable.map((achievement, idx) => (
              <div 
                key={achievement.id} 
                className={`
                  card p-4 border ${getRarityBorder(achievement.rarity)} 
                  card-hover
                  animate-slide-up
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl opacity-50">{achievement.icon}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-400 capitalize">
                    {achievement.rarity}
                  </span>
                </div>
                <h3 className="text-white font-bold mb-1">{achievement.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{achievement.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-brand-400">{Math.round(achievement.percentComplete)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} transition-all duration-500`}
                      style={{ width: `${achievement.percentComplete}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {achievement.progress || 0} / {achievement.threshold}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400">+{achievement.reward_credits} credits</span>
                  <span className="text-slate-500">Locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEarned.length === 0 && filteredAvailable.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎖️</div>
          <h3 className="text-xl font-bold text-white mb-2">No achievements in this category</h3>
          <p className="text-slate-400">Check back later or explore other categories</p>
        </div>
      )}
    </div>
  )
}
