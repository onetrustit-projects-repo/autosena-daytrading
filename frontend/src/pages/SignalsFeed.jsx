import React, { useState } from 'react'

const mockSignals = [
  { id: 1, symbol: 'NVDA', type: 'SENTIMENT', direction: 'BUY', strength: 0.85, sources: ['sentiment'], price: 878.50, sentiment: 0.82, time: '3m ago', description: 'Bullish sentiment with 82% score' },
  { id: 2, symbol: 'AAPL', type: 'SENTIMENT', direction: 'BUY', strength: 0.72, sources: ['sentiment'], price: 182.30, sentiment: 0.72, time: '8m ago', description: 'Strong bullish sentiment detected' },
  { id: 3, symbol: 'TSLA', type: 'SENTIMENT_SHIFT', direction: 'SELL', strength: 0.65, sources: ['sentiment'], price: 172.45, sentiment: -0.45, time: '15m ago', description: 'Sentiment shift to bearish' },
  { id: 4, symbol: 'AMZN', type: 'SENTIMENT', direction: 'BUY', strength: 0.58, sources: ['sentiment'], price: 178.20, sentiment: 0.35, time: '22m ago', description: 'Moderate bullish sentiment' },
  { id: 5, symbol: 'GOOGL', type: 'COMPOSITE', direction: 'BUY', strength: 0.78, sources: ['sentiment', 'news'], price: 175.80, sentiment: 0.58, time: '1h ago', description: 'Composite signal from 2 sources' },
]

export function SignalsFeed() {
  const [filter, setFilter] = useState('all')

  const filteredSignals = filter === 'all' 
    ? mockSignals 
    : mockSignals.filter(s => s.direction === filter.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Signals</h1>
          <p className="text-slate-400">AI-generated signals from social sentiment</p>
        </div>
        <div className="flex gap-2">
          {['all', 'buy', 'sell'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                filter === f
                  ? f === 'buy' ? 'bg-emerald-500 text-white' : f === 'sell' ? 'bg-red-500 text-white' : 'bg-violet-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Active Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSignals.map(signal => (
          <div 
            key={signal.id} 
            className={`card p-5 border ${
              signal.direction === 'BUY' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  signal.direction === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {signal.direction === 'BUY' ? '📈' : '📉'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{signal.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      signal.direction === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {signal.direction}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{signal.type} • {signal.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${signal.price}</p>
                <p className={`text-sm font-medium ${
                  signal.sentiment >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(signal.sentiment * 100).toFixed(0)}% sentiment
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4">{signal.description}</p>

            {/* Strength Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Confidence</span>
                <span className="text-white font-medium">{(signal.strength * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${signal.direction === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${signal.strength * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Sources */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {signal.sources.map((source, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                    {source}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                  View
                </button>
                <button className={`px-3 py-1.5 ${
                  signal.direction === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                } text-white text-sm rounded-lg transition-colors`}>
                  Execute
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Stats */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Signal Performance (30d)</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white">47</p>
            <p className="text-slate-400 text-sm">Total Signals</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">68%</p>
            <p className="text-slate-400 text-sm">Win Rate</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white">+2.4%</p>
            <p className="text-slate-400 text-sm">Avg Return</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">1.52</p>
            <p className="text-slate-400 text-sm">Profit Factor</p>
          </div>
        </div>
      </div>
    </div>
  )
}
