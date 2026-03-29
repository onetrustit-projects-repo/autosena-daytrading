import React, { useState, useEffect } from 'react';

/**
 * Journal Analytics - AI Insights Dashboard
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

const JournalAnalytics = () => {
  const [insights, setInsights] = useState(null);
  const [behavioralPatterns, setBehavioralPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    // Simulated API call
    const mockInsights = generateMockAnalytics();
    setInsights(mockInsights);
    setBehavioralPatterns(mockInsights.behavioralPatterns);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Analyzing your trading patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Trading Insights</h1>
            <p className="text-gray-400 mt-1">Behavioral analysis and improvement recommendations</p>
          </div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <PerformanceCard 
            title="Win Rate"
            value={`${insights?.winRate?.toFixed(1)}%`}
            trend={insights?.winRateTrend}
            benchmark="50%"
          />
          <PerformanceCard 
            title="Avg Win/Loss"
            value={insights?.avgWinLossRatio?.toFixed(2)}
            trend={insights?.ratioTrend}
            benchmark="1.5"
          />
          <PerformanceCard 
            title="Total P&L"
            value={`$${insights?.totalPnL?.toFixed(0)}`}
            trend={insights?.pnlTrend}
          />
          <PerformanceCard 
            title="Trading Days"
            value={insights?.tradingDays}
            trend={null}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Behavior Analysis */}
          <BehaviorAnalysisPanel patterns={behavioralPatterns} />
          
          {/* Pattern Performance */}
          <PatternPerformancePanel patterns={insights?.patternAnalysis} />
        </div>

        {/* Detailed Insights */}
        <div className="grid grid-cols-3 gap-6">
          {/* Session Performance */}
          <SessionAnalysisPanel sessions={insights?.sessionPerformance} />
          
          {/* Day of Week Analysis */}
          <DayOfWeekAnalysisPanel days={insights?.dayOfWeekAnalysis} />
          
          {/* AI Recommendations */}
          <AIRecommendationsPanel recommendations={insights?.aiRecommendations} />
        </div>
      </div>
    </div>
  );
};

/**
 * Performance Card Component
 */
const PerformanceCard = ({ title, value, trend, benchmark }) => (
  <div className="bg-gray-800 rounded-xl p-4">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      {trend !== null && trend !== undefined && (
        <span className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
    {benchmark && (
      <p className="text-gray-500 text-xs mt-2">Benchmark: {benchmark}</p>
    )}
  </div>
);

/**
 * Behavior Analysis Panel
 */
const BehaviorAnalysisPanel = ({ patterns }) => {
  const metrics = [
    { label: 'Plan Following', value: patterns?.planFollowingRate || 0, color: 'blue' },
    { label: 'Emotional Trading', value: patterns?.emotionalTradingRate || 0, color: 'yellow', inverse: true },
    { label: 'Overtrading Index', value: patterns?.overtradingIndex || 0, color: 'red', inverse: true },
    { label: 'Patience Score', value: patterns?.patienceScore || 0, color: 'green' }
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">Behavioral Analysis</h3>
      <div className="space-y-4">
        {metrics.map((metric, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">{metric.label}</span>
              <span className={`text-sm font-bold ${
                metric.inverse 
                  ? (metric.value > 0.5 ? 'text-red-400' : 'text-green-400')
                  : (metric.value > 0.5 ? 'text-green-400' : 'text-red-400')
              }`}>
                {(metric.value * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${metric.color}-500 rounded-full transition-all`}
                style={{ width: `${metric.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Behavioral Flags */}
      {patterns?.flags?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Behavioral Flags</h4>
          {patterns.flags.map((flag, i) => (
            <div key={i} className="bg-yellow-900/30 p-2 rounded-lg mb-2">
              <p className="text-sm">{flag}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Pattern Performance Panel
 */
const PatternPerformancePanel = ({ patterns }) => {
  if (!patterns) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">Strategy Performance</h3>
      <div className="space-y-3">
        {patterns.map((pattern, i) => (
          <div key={i} className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold capitalize">{pattern.strategy}</span>
              <span className={pattern.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                ${pattern.pnl.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{pattern.trades} trades</span>
              <span>{pattern.winRate?.toFixed(0)}% win rate</span>
              <span>Avg: ${pattern.avgTrade?.toFixed(0)}</span>
            </div>
            <div className="mt-2 flex gap-1">
              {pattern.tags?.map((tag, j) => (
                <span key={j} className="text-xs px-2 py-0.5 bg-gray-600 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Session Analysis Panel
 */
const SessionAnalysisPanel = ({ sessions }) => {
  if (!sessions) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">Performance by Session</h3>
      <div className="space-y-2">
        {sessions.map((session, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                session.performance > 0 ? 'bg-green-500' : session.performance < 0 ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="capitalize">{session.session}</span>
            </div>
            <div className="text-right">
              <span className={session.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {session.performance >= 0 ? '+' : ''}{session.performance.toFixed(1)}%
              </span>
              <p className="text-xs text-gray-400">{session.trades} trades</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Day of Week Analysis Panel
 */
const DayOfWeekAnalysisPanel = ({ days }) => {
  if (!days) return null;

  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const orderedDays = dayOrder.map(day => days.find(d => d.day === day) || { day, pnl: 0, trades: 0 });

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">Performance by Day</h3>
      <div className="flex justify-between items-end h-32 gap-2">
        {orderedDays.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full rounded-t ${
                day.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ height: `${Math.min(Math.abs(day.pnl) / 100, 100)}%` }}
            />
            <span className="text-xs text-gray-400 mt-2">{day.day}</span>
            <span className="text-xs">{day.trades}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AI Recommendations Panel
 */
const AIRecommendationsPanel = ({ recommendations }) => {
  if (!recommendations?.length) return null;

  const priorityColors = {
    high: 'border-red-500 bg-red-900/30',
    medium: 'border-yellow-500 bg-yellow-900/30',
    low: 'border-blue-500 bg-blue-900/30'
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4">AI Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className={`p-3 rounded-lg border-l-4 ${priorityColors[rec.priority]}`}>
            <div className="flex items-start gap-3">
              <span className={`text-lg ${
                rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵'
              }`} />
              <div>
                <p className="font-semibold">{rec.title}</p>
                <p className="text-sm text-gray-300 mt-1">{rec.description}</p>
                {rec.action && (
                  <p className="text-sm text-blue-400 mt-2">→ {rec.action}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock data generator
function generateMockAnalytics() {
  return {
    winRate: 58.5,
    winRateTrend: 3.2,
    avgWinLossRatio: 1.8,
    ratioTrend: -0.1,
    totalPnL: 4250,
    pnlTrend: 12.5,
    tradingDays: 18,
    behavioralPatterns: {
      planFollowingRate: 0.75,
      emotionalTradingRate: 0.12,
      overtradingIndex: 0.23,
      patienceScore: 0.68,
      flags: [
        'Tendency to add to losing positions',
        'Trading more frequently after losses'
      ]
    },
    patternAnalysis: [
      { strategy: 'momentum', trades: 25, winRate: 65, pnl: 2100, avgTrade: 84, tags: ['high-frequency', 'trending'] },
      { strategy: 'mean_reversion', trades: 18, winRate: 55, pnl: 850, avgTrade: 47, tags: ['overnight', 'low-vol'] },
      { strategy: 'breakout', trades: 12, winRate: 42, pnl: -350, avgTrade: -29, tags: ['volatile', 'high-risk'] },
      { strategy: 'scalping', trades: 30, winRate: 61, pnl: 1650, avgTrade: 55, tags: ['quick', 'commission-heavy'] }
    ],
    sessionPerformance: [
      { session: 'open', trades: 28, performance: 2.3 },
      { session: 'midday', trades: 22, performance: -0.8 },
      { session: 'close', trades: 35, performance: 1.5 }
    ],
    dayOfWeekAnalysis: [
      { day: 'Mon', trades: 12, pnl: 380 },
      { day: 'Tue', trades: 15, pnl: 520 },
      { day: 'Wed', trades: 18, pnl: -120 },
      { day: 'Thu', trades: 14, pnl: 290 },
      { day: 'Fri', trades: 16, pnl: 180 }
    ],
    aiRecommendations: [
      {
        priority: 'high',
        title: 'Reduce midday trading',
        description: 'Your win rate during midday sessions is below 45%. Consider reducing position sizes or avoiding new entries during this period.',
        action: 'Set a rule to reduce position size by 50% between 11am-2pm'
      },
      {
        priority: 'medium',
        title: 'Improve breakout strategy',
        description: 'Breakout trades show negative expectancy. The issue appears to be late entry timing rather than the setups themselves.',
        action: 'Use market-on-open orders instead of limit orders for breakout entries'
      },
      {
        priority: 'low',
        title: 'Consider longer holding periods',
        description: 'Scalping trades have high commission costs relative to profits. Consider holding winning positions longer.',
        action: 'Set a minimum profit target of 2:1 before taking profits'
      }
    ]
  };
}

export default JournalAnalytics;
