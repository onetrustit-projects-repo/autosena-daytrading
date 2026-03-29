import React, { useState, useEffect } from 'react'

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'SPY']

const mockSentimentData = {
  'AAPL': { label: 'BULLISH', score: 0.72, positive: 68, negative: 12, neutral: 20, volume: 12450 },
  'GOOGL': { label: 'BULLISH', score: 0.58, positive: 55, negative: 18, neutral: 27, volume: 8920 },
  'MSFT': { label: 'NEUTRAL', score: 0.12, positive: 38, negative: 28, neutral: 34, volume: 6540 },
  'TSLA': { label: 'BEARISH', score: -0.45, positive: 22, negative: 48, neutral: 30, volume: 28400 },
  'AMZN': { label: 'BULLISH', score: 0.35, positive: 48, negative: 25, neutral: 27, volume: 11200 },
  'NVDA': { label: 'BULLISH', score: 0.82, positive: 78, negative: 8, neutral: 14, volume: 15680 },
  'META': { label: 'NEUTRAL', score: 0.05, positive: 35, negative: 32, neutral: 33, volume: 9870 },
  'SPY': { label: 'BULLISH', score: 0.28, positive: 45, negative: 22, neutral: 33, volume: 45000 },
}

const mockMarketSentiment = {
  overallScore: 0.38,
  overallLabel: 'BULLISH',
  bullishCount: 5,
  bearishCount: 1,
  neutralCount: 2,
}

export function SentimentDashboard() {
  const [sentiment, setSentiment] = useState(mockSentimentData)
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [loading, setLoading] = useState(false)

  const currentData = sentiment[selectedSymbol]

  const getSentimentColor = (label) => {
    if (label === 'BULLISH') return 'text-emerald-400'
    if (label === 'BEARISH') return 'text-red-400'
    return 'text-slate-400'
  }

  const getSentimentBg = (label) => {
    if (label === 'BULLISH') return 'bg-emerald-500/20 border-emerald-500/30'
    if (label === 'BEARISH') return 'bg-red-500/20 border-red-500/30'
    return 'bg-slate-500/20 border-slate-500/30'
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="card p-6 bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-violet-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Market Sentiment</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-4xl font-bold ${getSentimentColor(mockMarketSentiment.overallLabel)}`}>
                {mockMarketSentiment.overallLabel}
              </p>
              <p className="text-2xl text-slate-400">
                {(mockMarketSentiment.overallScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{mockMarketSentiment.bullishCount}</p>
              <p className="text-xs text-slate-400">Bullish</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{mockMarketSentiment.bearishCount}</p>
              <p className="text-xs text-slate-400">Bearish</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-400">{mockMarketSentiment.neutralCount}</p>
              <p className="text-xs text-slate-400">Neutral</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symbol Grid */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {SYMBOLS.map(symbol => (
          <button
            key={symbol}
            onClick={() => setSelectedSymbol(symbol)}
            className={`p-3 rounded-xl border transition-all ${
              selectedSymbol === symbol
                ? 'bg-violet-500/20 border-violet-500/50'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className="font-bold text-white">{symbol}</p>
            <div className={`text-lg font-bold ${getSentimentColor(sentiment[symbol]?.label)}`}>
              {sentiment[symbol]?.label === 'BULLISH' ? '📈' : sentiment[symbol]?.label === 'BEARISH' ? '📉' : '➖'}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Symbol Detail */}
      {currentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {/* Sentiment Gauge */}
          <div className={`card p-6 border ${getSentimentBg(currentData.label)}`}>
            <h3 className="text-lg font-semibold text-white mb-4">{selectedSymbol} Sentiment</h3>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={currentData.label === 'BULLISH' ? '#10b981' : currentData.label === 'BEARISH' ? '#ef4444' : '#64748b'}
                    strokeWidth="8"
                    strokeDasharray={`${(Math.abs(currentData.score) * 141.37)} 141.37`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`text-3xl font-bold ${getSentimentColor(currentData.label)}`}>
                    {(currentData.score * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-slate-400">{currentData.label}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Positive</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${currentData.positive}%` }}></div>
                  </div>
                  <span className="text-emerald-400 font-medium w-12 text-right">{currentData.positive}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Negative</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${currentData.negative}%` }}></div>
                  </div>
                  <span className="text-red-400 font-medium w-12 text-right">{currentData.negative}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Neutral</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500" style={{ width: `${currentData.neutral}%` }}></div>
                  </div>
                  <span className="text-slate-400 font-medium w-12 text-right">{currentData.neutral}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volume & Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Data Overview</h3>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Total Mentions</span>
                  <span className="text-white font-bold text-xl">{currentData.volume.toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-500">Last 24 hours across all sources</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">📰</p>
                  <p className="text-slate-400 text-xs">News</p>
                  <p className="text-white font-semibold">{Math.floor(currentData.volume * 0.15)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">🐦</p>
                  <p className="text-slate-400 text-xs">Twitter</p>
                  <p className="text-white font-semibold">{Math.floor(currentData.volume * 0.55)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">🤖</p>
                  <p className="text-slate-400 text-xs">Reddit</p>
                  <p className="text-white font-semibold">{Math.floor(currentData.volume * 0.25)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">💬</p>
                  <p className="text-slate-400 text-xs">StockTwits</p>
                  <p className="text-white font-semibold">{Math.floor(currentData.volume * 0.05)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
                  Refresh Data
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  📊
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Feed */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Sentiment</h3>
        <div className="space-y-3">
          {[
            { source: 'Twitter', content: '$AAPL looking strong! This breakout could push us higher 🚀', sentiment: 'BULLISH', time: '2m ago' },
            { source: 'Reddit', content: 'DD on $NVDA - Here\'s why I think we\'re going to $800', sentiment: 'BULLISH', time: '5m ago' },
            { source: 'News', content: 'Analysts Upgrade $MSFT to Strong Buy, Price Target $450', sentiment: 'BULLISH', time: '12m ago' },
            { source: 'Twitter', content: '$TSLA concerns me. Charts looking ugly', sentiment: 'BEARISH', time: '15m ago' },
            { source: 'Reddit', content: 'Is $GOOGL a trap? Let\'s discuss...', sentiment: 'NEUTRAL', time: '22m ago' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                item.sentiment === 'BULLISH' ? 'bg-emerald-500' :
                item.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-slate-500'
              }`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-violet-400 font-medium">{item.source}</span>
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
                <p className="text-slate-300 text-sm">{item.content}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                item.sentiment === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' :
                item.sentiment === 'BEARISH' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
              }`}>
                {item.sentiment}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
