import React, { useState, useEffect } from 'react'

const mockRewards = {
  balance: 1250,
  totalEarned: 2500,
  totalClaimed: 1250,
  availableRewards: [
    { period: 'daily', rank: 4, reward: 50, badge: null, alreadyClaimed: false, canClaim: true },
    { period: 'weekly', rank: 7, reward: 50, badge: null, alreadyClaimed: true, canClaim: false },
  ],
  recentRewards: [
    { id: '1', type: 'leaderboard', amount: 100, reason: 'Leaderboard daily rank #3', created_at: '2024-03-27T10:00:00Z' },
    { id: '2', type: 'achievement', amount: 25, reason: 'Achievement: Half K', created_at: '2024-03-22T10:00:00Z' },
    { id: '3', type: 'redemption', amount: -500, reason: 'Redeemed: Feature My Profile', created_at: '2024-03-20T10:00:00Z' },
    { id: '4', type: 'leaderboard', amount: 200, reason: 'Leaderboard weekly rank #5', created_at: '2024-03-17T10:00:00Z' },
    { id: '5', type: 'achievement', amount: 15, reason: 'Achievement: Hot Streak', created_at: '2024-03-18T10:00:00Z' },
  ]
}

const redemptionOptions = [
  { id: 'feature_profile', name: 'Feature My Profile', description: 'Get featured on the leaderboard for 24 hours', credits: 500, icon: '⭐' },
  { id: 'highlight_trade', name: 'Highlight Trade', description: 'Highlight a winning trade for all to see', credits: 100, icon: '📌' },
  { id: 'extra_analytics', name: 'Premium Analytics', description: 'Access advanced analytics for 7 days', credits: 200, icon: '📊' },
  { id: 'copy_badge', name: 'Copy Trading Badge', description: 'Display "Top Copied Trader" badge', credits: 300, icon: '👑' },
  { id: 'mentor_badge', name: 'Mentor Badge', description: 'Show "Verified Mentor" on profile', credits: 400, icon: '🎓' },
]

export function Rewards({ userId }) {
  const [rewards, setRewards] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setRewards(mockRewards)
      setLoading(false)
    }, 500)
  }, [userId])

  const handleClaim = (period) => {
    setClaiming(period)
    setTimeout(() => {
      setRewards(prev => ({
        ...prev,
        balance: prev.balance + (prev.availableRewards.find(r => r.period === period)?.reward || 0),
        availableRewards: prev.availableRewards.map(r => 
          r.period === period ? { ...r, canClaim: false, alreadyClaimed: true } : r
        )
      }))
      setClaiming(null)
    }, 1000)
  }

  const handleRedeem = (optionId) => {
    const option = redemptionOptions.find(o => o.id === optionId)
    if (!option || !rewards || rewards.balance < option.credits) return

    if (confirm(`Redeem ${option.name} for ${option.credits} credits?`)) {
      setRewards(prev => ({
        ...prev,
        balance: prev.balance - option.credits,
        recentRewards: [
          { id: Date.now().toString(), type: 'redemption', amount: -option.credits, reason: `Redeemed: ${option.name}`, created_at: new Date().toISOString() },
          ...prev.recentRewards
        ]
      }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-8 animate-pulse">
          <div className="h-20 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!rewards) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Rewards</h1>
        <p className="text-slate-400 mt-1">Earn credits and redeem exclusive perks</p>
      </div>

      {/* Balance Card */}
      <div className="card p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-amber-400">{rewards.balance}</p>
              <p className="text-slate-400">credits</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Total Earned</p>
            <p className="text-xl font-bold text-emerald-400">+{rewards.totalEarned}</p>
            <p className="text-slate-500 text-sm">Total Spent: {rewards.totalClaimed}</p>
          </div>
        </div>
      </div>

      {/* Available Rewards to Claim */}
      {rewards.availableRewards.filter(r => r.canClaim).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">🎁</span> Claim Your Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.availableRewards.filter(r => r.canClaim).map((reward) => (
              <div key={reward.period} className="card p-4 border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-white font-medium capitalize">{reward.period} Rank</span>
                  </div>
                  <span className="text-3xl font-bold text-amber-400">#{reward.rank}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 font-semibold">+{reward.reward} credits</p>
                    {reward.badge && <p className="text-slate-400 text-sm">{reward.badge}</p>}
                  </div>
                  <button
                    onClick={() => handleClaim(reward.period)}
                    disabled={claiming === reward.period}
                    className={`
                      px-4 py-2 rounded-lg font-semibold transition-all
                      ${claiming === reward.period
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }
                    `}
                  >
                    {claiming === reward.period ? 'Claiming...' : 'Claim'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redemption Options */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Redeem Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {redemptionOptions.map((option) => {
            const canAfford = rewards.balance >= option.credits
            return (
              <div 
                key={option.id} 
                className={`
                  card p-4 card-hover
                  ${canAfford ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{option.icon}</div>
                  <div className="text-right">
                    <p className={`font-bold ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
                      {option.credits}
                    </p>
                    <p className="text-slate-500 text-xs">credits</p>
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-1">{option.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{option.description}</p>
                <button
                  onClick={() => handleRedeem(option.id)}
                  disabled={!canAfford}
                  className={`
                    w-full py-2 rounded-lg font-medium transition-all
                    ${canAfford
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  {canAfford ? 'Redeem' : 'Not enough credits'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Rewards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {rewards.recentRewards.map((reward) => (
                <tr key={reward.id} className="card-hover">
                  <td className="px-4 py-3">
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${reward.type === 'leaderboard' ? 'bg-brand-500/20 text-brand-400' : ''}
                      ${reward.type === 'achievement' ? 'bg-amber-500/20 text-amber-400' : ''}
                      ${reward.type === 'redemption' ? 'bg-red-500/20 text-red-400' : ''}
                    `}>
                      {reward.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{reward.reason}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${reward.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {reward.amount >= 0 ? '+' : ''}{reward.amount}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-sm">
                    {new Date(reward.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard Rewards Tiers */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏆 Leaderboard Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily */}
          <div>
            <h4 className="text-brand-400 font-medium mb-3">Daily</h4>
            <div className="space-y-2">
              {[{ rank: 1, credits: 500 }, { rank: 2, credits: 250 }, { rank: 3, credits: 100 }].map((tier) => (
                <div key={tier.rank} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-300">#{tier.rank}</span>
                  <span className="text-amber-400 font-medium">{tier.credits} credits</span>
                </div>
              ))}
            </div>
          </div>
          {/* Weekly */}
          <div>
            <h4 className="text-purple-400 font-medium mb-3">Weekly</h4>
            <div className="space-y-2">
              {[{ rank: 1, credits: 2000 }, { rank: 2, credits: 1000 }, { rank: 3, credits: 500 }].map((tier) => (
                <div key={tier.rank} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-300">#{tier.rank}</span>
                  <span className="text-amber-400 font-medium">{tier.credits} credits</span>
                </div>
              ))}
            </div>
          </div>
          {/* Monthly */}
          <div>
            <h4 className="text-amber-400 font-medium mb-3">Monthly</h4>
            <div className="space-y-2">
              {[{ rank: 1, credits: 10000 }, { rank: 2, credits: 5000 }, { rank: 3, credits: 2500 }].map((tier) => (
                <div key={tier.rank} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-300">#{tier.rank}</span>
                  <span className="text-amber-400 font-medium">{tier.credits} credits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
