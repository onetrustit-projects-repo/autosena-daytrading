import React, { useState, useEffect } from 'react'

const PERIODS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
]

// Mock data for demo
const mockLeaderboard = [
  { rank: 1, userId: 'user_1', username: 'TraderJoe', displayName: 'Trader Joe', avatarUrl: null, profitLoss: 4520.50, sharpeRatio: 2.34, sortinoRatio: 3.12, maxDrawdown: 3.2, winRate: 78, totalTrades: 156, score: 892.5 },
  { rank: 2, userId: 'user_2', username: 'DiamondHands', displayName: 'Diamond Hands', avatarUrl: null, profitLoss: 3890.25, sharpeRatio: 2.18, sortinoRatio: 2.89, maxDrawdown: 4.1, winRate: 74, totalTrades: 203, score: 834.2 },
  { rank: 3, userId: 'user_3', username: 'CryptoQueen', displayName: 'Crypto Queen', avatarUrl: null, profitLoss: 3150.75, sharpeRatio: 1.98, sortinoRatio: 2.56, maxDrawdown: 5.5, winRate: 71, totalTrades: 89, score: 756.8 },
  { rank: 4, userId: 'user_4', username: 'MoonWalker', displayName: 'Moon Walker', avatarUrl: null, profitLoss: 2890.00, sharpeRatio: 1.87, sortinoRatio: 2.34, maxDrawdown: 4.8, winRate: 69, totalTrades: 134, score: 698.4 },
  { rank: 5, userId: 'user_5', username: 'BullRunner', displayName: 'Bull Runner', avatarUrl: null, profitLoss: 2340.50, sharpeRatio: 1.76, sortinoRatio: 2.12, maxDrawdown: 6.2, winRate: 66, totalTrades: 178, score: 645.1 },
  { rank: 6, userId: 'user_6', username: 'TradeMaster', displayName: 'Trade Master', avatarUrl: null, profitLoss: 1980.25, sharpeRatio: 1.65, sortinoRatio: 1.98, maxDrawdown: 5.9, winRate: 64, totalTrades: 211, score: 598.7 },
  { rank: 7, userId: 'user_7', username: 'WallStWiz', displayName: 'Wall St Wizard', avatarUrl: null, profitLoss: 1650.75, sharpeRatio: 1.54, sortinoRatio: 1.87, maxDrawdown: 7.1, winRate: 62, totalTrades: 95, score: 542.3 },
  { rank: 8, userId: 'user_8', username: 'PipHunter', displayName: 'Pip Hunter', avatarUrl: null, profitLoss: 1420.00, sharpeRatio: 1.48, sortinoRatio: 1.76, maxDrawdown: 6.8, winRate: 60, totalTrades: 167, score: 498.6 },
  { rank: 9, userId: 'user_9', username: 'ScalpKing', displayName: 'Scalp King', avatarUrl: null, profitLoss: 1180.50, sharpeRatio: 1.39, sortinoRatio: 1.65, maxDrawdown: 7.5, winRate: 58, totalTrades: 289, score: 451.2 },
  { rank: 10, userId: 'user_10', username: 'DayTraderPro', displayName: 'Day Trader Pro', avatarUrl: null, profitLoss: 890.25, sharpeRatio: 1.28, sortinoRatio: 1.52, maxDrawdown: 8.2, winRate: 56, totalTrades: 312, score: 405.8 },
]

export function Leaderboard({ userId }) {
  const [period, setPeriod] = useState('daily')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      setLeaderboard(mockLeaderboard)
      setUserRank(mockLeaderboard.find(e => e.userId === userId) || null)
      setLoading(false)
    }, 500)
  }, [period, userId])

  const formatCurrency = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getScoreColor = (score) => {
    if (score >= 800) return 'text-amber-400'
    if (score >= 600) return 'text-brand-400'
    if (score >= 400) return 'text-emerald-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400 mt-1">Compete with traders and climb the ranks</p>
        </div>
        
        {/* Period Tabs */}
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${period === p.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {/* 2nd Place */}
          <div className="order-1 text-center pt-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-3xl font-bold text-slate-900 ring-4 ring-slate-700">
              {leaderboard[1].username.slice(0, 2).toUpperCase()}
            </div>
            <p className="mt-2 text-slate-400 font-medium">{leaderboard[1].displayName}</p>
            <p className="text-2xl">🥈</p>
            <p className="text-slate-400 text-sm">{formatCurrency(leaderboard[1].profitLoss)}</p>
          </div>

          {/* 1st Place */}
          <div className="order-2 text-center">
            <div className="inline-block animate-pulse-glow">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-slate-900 ring-4 ring-amber-500/50">
                {leaderboard[0].username.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <p className="mt-3 text-white font-bold">{leaderboard[0].displayName}</p>
            <p className="text-3xl">🥇</p>
            <p className="text-emerald-400 font-semibold">{formatCurrency(leaderboard[0].profitLoss)}</p>
            <p className="text-xs text-slate-500 mt-1">Score: {leaderboard[0].score}</p>
          </div>

          {/* 3rd Place */}
          <div className="order-3 text-center pt-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-amber-700/50">
              {leaderboard[2].username.slice(0, 2).toUpperCase()}
            </div>
            <p className="mt-2 text-slate-400 font-medium">{leaderboard[2].displayName}</p>
            <p className="text-2xl">🥉</p>
            <p className="text-slate-400 text-sm">{formatCurrency(leaderboard[2].profitLoss)}</p>
          </div>
        </div>
      )}

      {/* User's Rank Card */}
      {userRank && (
        <div className="card p-4 border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-lg font-bold">
                #{userRank.rank}
              </div>
              <div>
                <p className="text-white font-medium">Your Rank</p>
                <p className="text-brand-400 text-sm">
                  {userRank.profitLoss >= 0 ? 'Profitable' : 'In Loss'} • {userRank.totalTrades} trades
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${userRank.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(userRank.profitLoss)}
              </p>
              <p className="text-slate-500 text-sm">Win Rate: {userRank.winRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Trader</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">P/L</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Win %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Sharpe</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Max DD</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-8 bg-slate-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-700 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-700 rounded ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-700 rounded ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-700 rounded ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-700 rounded ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-700 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                leaderboard.map((entry) => (
                  <tr 
                    key={entry.userId} 
                    className={`
                      card-hover cursor-pointer
                      ${entry.userId === userId ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : ''}
                    `}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getRankBadge(entry.rank) ? (
                          <span className="text-2xl">{getRankBadge(entry.rank)}</span>
                        ) : (
                          <span className="text-slate-400 font-semibold">#{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{entry.displayName}</p>
                          <p className="text-slate-500 text-sm">@{entry.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right font-semibold ${entry.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(entry.profitLoss)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-300">
                      {entry.winRate}%
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={entry.sharpeRatio >= 2 ? 'text-emerald-400' : entry.sharpeRatio >= 1.5 ? 'text-brand-400' : 'text-slate-400'}>
                        {entry.sharpeRatio.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={entry.maxDrawdown <= 5 ? 'text-emerald-400' : entry.maxDrawdown <= 10 ? 'text-amber-400' : 'text-red-400'}>
                        {entry.maxDrawdown.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${getScoreColor(entry.score)}`}>
                      {entry.score.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Scoring System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-brand-400 font-semibold mb-1">Profit Score</p>
            <p className="text-slate-400 text-sm">Based on total P/L with logarithmic scaling</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-brand-400 font-semibold mb-1">Risk Metrics</p>
            <p className="text-slate-400 text-sm">Sharpe & Sortino ratios weighted by 35%</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-brand-400 font-semibold mb-1">Consistency</p>
            <p className="text-slate-400 text-sm">Trade count bonus for active traders</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-brand-400 font-semibold mb-1">Win Rate</p>
            <p className="text-slate-400 text-sm">Performance above 50% adds bonus points</p>
          </div>
        </div>
      </div>
    </div>
  )
}
