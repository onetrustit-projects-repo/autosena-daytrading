import React, { useState, useEffect } from 'react';

/**
 * Trade Journal - Main View
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

const TradeJournal = () => {
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTradeData();
  }, []);

  const loadTradeData = async () => {
    setLoading(true);
    // Simulated API call - would fetch from backend
    const mockTrades = generateMockTrades();
    setTrades(mockTrades);
    setJournalEntries(mockTrades.map(t => t.journalEntry));
    setInsights(generateMockInsights(mockTrades));
    setLoading(false);
  };

  const filteredTrades = trades.filter(trade => {
    if (filter === 'profitable') return trade.pnl?.net > 0;
    if (filter === 'losing') return trade.pnl?.net < 0;
    if (filter === 'open') return trade.status === 'open';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Trade Journal</h1>
            <p className="text-gray-400 mt-1">AI-Powered Trade Analysis</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button 
              onClick={loadTradeData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {insights && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Total Trades" 
              value={insights.totalTrades} 
              subtext={`${insights.winRate.toFixed(1)}% win rate`}
            />
            <StatCard 
              label="Total P&L" 
              value={`$${insights.totalPnL.toFixed(2)}`} 
              positive={insights.totalPnL >= 0}
            />
            <StatCard 
              label="Best Trade" 
              value={`$${insights.bestTrade?.pnl?.net?.toFixed(2) || 0}`}
              positive={true}
            />
            <StatCard 
              label="Avg Trade" 
              value={`$${insights.avgTrade?.toFixed(2) || 0}`}
              positive={insights.avgTrade >= 0}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Trade List */}
          <div className="col-span-2 bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Trades</h2>
              <div className="flex gap-2">
                {['all', 'profitable', 'losing', 'open'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filter === f 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTrades.map(trade => (
                <TradeRow 
                  key={trade.id} 
                  trade={trade} 
                  onClick={() => setSelectedTrade(trade)}
                  isSelected={selectedTrade?.id === trade.id}
                />
              ))}
            </div>
          </div>

          {/* Trade Detail / AI Insights */}
          <div className="col-span-1">
            {selectedTrade ? (
              <TradeDetail trade={selectedTrade} />
            ) : (
              <AIInsightsPanel insights={insights} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ label, value, subtext, positive }) => (
  <div className="bg-gray-800 rounded-xl p-4">
    <p className="text-gray-400 text-sm">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${positive !== undefined ? (positive ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
      {value}
    </p>
    {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
  </div>
);

/**
 * Trade Row Component
 */
const TradeRow = ({ trade, onClick, isSelected }) => {
  const pnl = trade.pnl?.net || 0;
  const isProfitable = pnl >= 0;
  
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-900 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            trade.side === 'long' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {trade.side.toUpperCase()}
          </span>
          <span className="font-semibold">{trade.symbol}</span>
          <span className="text-gray-400 text-sm">{trade.strategy}</span>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {isProfitable ? '+' : ''}{pnl.toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(trade.entryTime).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Trade Detail Component
 */
const TradeDetail = ({ trade }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{trade.symbol}</h3>
          <p className="text-gray-400 text-sm">
            {new Date(trade.entryTime).toLocaleString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          trade.pnl?.net >= 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
        }`}>
          {trade.pnl?.net >= 0 ? 'PROFIT' : 'LOSS'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        {['overview', 'insights', 'context'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <DetailRow label="Side" value={trade.side.toUpperCase()} />
          <DetailRow label="Entry" value={`$${trade.entryPrice}`} />
          {trade.exitPrice && <DetailRow label="Exit" value={`$${trade.exitPrice}`} />}
          <DetailRow label="Quantity" value={trade.quantity} />
          <DetailRow label="P&L" value={`$${trade.pnl?.net?.toFixed(2) || 0}`} positive={trade.pnl?.net >= 0} />
          <DetailRow label="Commission" value={`$${trade.pnl?.commission?.toFixed(2) || 0}`} />
          <DetailRow label="Slippage" value={`$${trade.pnl?.slippage?.toFixed(2) || 0}`} />
          <DetailRow label="Strategy" value={trade.strategy} />
          <DetailRow label="Status" value={trade.status} />
        </div>
      )}

      {activeTab === 'insights' && trade.aiInsights && (
        <div className="space-y-4">
          <InsightCard 
            type={trade.aiInsights.emotionalTrade ? 'warning' : 'success'}
            title="Trade Analysis"
            text={trade.aiInsights.emotionalTrade 
              ? 'This trade may have been influenced by emotional decisions'
              : 'Good trade execution and discipline observed'}
          />
          
          {trade.aiInsights.recommendations?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Recommendations</h4>
              {trade.aiInsights.recommendations.map((rec, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded-lg mb-2">
                  <p className="text-sm">{rec.text}</p>
                  <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                    rec.priority === 'high' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'context' && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-1">Market Phase</h4>
            <p className="text-white">{trade.metadata?.marketPhase || 'Unknown'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-1">Trading Session</h4>
            <p className="text-white">{trade.metadata?.tradingSession || 'Unknown'}</p>
          </div>
          {trade.metadata?.sentiment && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-1">Market Sentiment</h4>
              <p className="text-white capitalize">{trade.metadata.sentiment.label}</p>
            </div>
          )}
          {trade.metadata?.newsContext?.headlines?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-1">Related News</h4>
              {trade.metadata.newsContext.headlines.slice(0, 3).map((headline, i) => (
                <p key={i} className="text-sm text-gray-300">• {headline}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Detail Row Component
 */
const DetailRow = ({ label, value, positive }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400 text-sm">{label}</span>
    <span className={`font-medium ${positive !== undefined ? (positive ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
      {value}
    </span>
  </div>
);

/**
 * Insight Card Component
 */
const InsightCard = ({ type, title, text }) => (
  <div className={`p-3 rounded-lg ${type === 'warning' ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
    <h4 className={`font-semibold ${type === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
      {title}
    </h4>
    <p className="text-sm text-gray-300 mt-1">{text}</p>
  </div>
);

/**
 * AI Insights Panel Component
 */
const AIInsightsPanel = ({ insights }) => {
  if (!insights) return <div className="bg-gray-800 rounded-xl p-4">Loading insights...</div>;

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">AI Insights</h3>
      
      {/* Pattern Insights */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Best Performing</h4>
        <div className="space-y-2">
          {insights.patternInsights?.byStrategy?.slice(0, 3).map((pattern, i) => (
            <div key={i} className="bg-gray-700 p-2 rounded-lg">
              <div className="flex justify-between">
                <span className="capitalize">{pattern.group}</span>
                <span className="text-green-400">{(pattern.avgPnL || 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400">{pattern.trades} trades | {pattern.winRate?.toFixed(0)}% win rate</p>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Analysis */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Behavioral Patterns</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Plan Following Rate</span>
            <span className="text-green-400">{(insights.planFollowingRate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Emotional Trade Frequency</span>
            <span className="text-yellow-400">{(insights.emotionalTradeFrequency * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Recommendations</h4>
          {insights.recommendations.map((rec, i) => (
            <div key={i} className="bg-blue-900/30 p-2 rounded-lg mb-2">
              <p className="text-sm">{rec}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mock data generators
function generateMockTrades() {
  const strategies = ['momentum', 'mean_reversion', 'breakout', 'scalping'];
  const symbols = ['SENA', 'EC', 'COP', 'COLCAP'];
  
  return Array.from({ length: 15 }, (_, i) => {
    const side = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = Math.random() * 100 + 50;
    const exitPrice = side === 'long' 
      ? entryPrice * (1 + (Math.random() - 0.4) * 0.05)
      : entryPrice * (1 - (Math.random() - 0.4) * 0.05);
    const quantity = Math.floor(Math.random() * 1000 + 100) * 10;
    const pnl = side === 'long' 
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;

    return {
      id: `trade_${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side,
      quantity,
      entryPrice: entryPrice.toFixed(2),
      exitPrice: exitPrice.toFixed(2),
      entryTime: new Date(Date.now() - Math.random() * 86400000 * 7),
      pnl: {
        net: pnl,
        gross: pnl,
        commission: Math.random() * 5,
        slippage: Math.random() * 2
      },
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      status: 'closed',
      metadata: {
        marketPhase: ['volatile', 'quiet', 'trending', 'ranging'][Math.floor(Math.random() * 4)],
        tradingSession: ['open', 'midday', 'close'][Math.floor(Math.random() * 3)],
        sentiment: { score: Math.random() * 2 - 1, label: 'neutral' }
      },
      aiInsights: {
        emotionalTrade: Math.random() > 0.8,
        goodEntry: Math.random() > 0.5,
        followsPlan: Math.random() > 0.3,
        recommendations: [
          { type: 'risk', priority: 'medium', text: 'Consider reducing position size during volatile sessions' }
        ]
      },
      journalEntry: {
        id: `journal_${i}`,
        summary: `${side.toUpperCase()} ${quantity} ${symbols[0]} @ ${entryPrice.toFixed(2)}`,
        tags: ['momentum', 'profitable']
      }
    };
  });
}

function generateMockInsights(trades) {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const winners = closedTrades.filter(t => t.pnl?.net > 0);
  
  return {
    totalTrades: closedTrades.length,
    winRate: (winners.length / closedTrades.length) * 100,
    totalPnL: closedTrades.reduce((sum, t) => sum + (t.pnl?.net || 0), 0),
    avgTrade: closedTrades.reduce((sum, t) => sum + (t.pnl?.net || 0), 0) / closedTrades.length,
    bestTrade: closedTrades.reduce((best, t) => (!best || t.pnl?.net > best.pnl?.net) ? t : best, null),
    worstTrade: closedTrades.reduce((worst, t) => (!worst || t.pnl?.net < worst.pnl?.net) ? t : worst, null),
    planFollowingRate: 0.75,
    emotionalTradeFrequency: 0.15,
    patternInsights: {
      byStrategy: [
        { group: 'momentum', trades: 8, avgPnL: 150, winRate: 65 },
        { group: 'mean_reversion', trades: 5, avgPnL: 80, winRate: 55 },
        { group: 'breakout', trades: 3, avgPnL: -20, winRate: 40 }
      ]
    },
    recommendations: [
      'Focus on momentum strategies which show highest win rate',
      'Consider wider stop losses for breakout trades'
    ]
  };
}

export default TradeJournal;
