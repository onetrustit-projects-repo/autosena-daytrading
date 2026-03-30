import { useState, useEffect } from 'react'
import { Activity, Cpu, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Server, BarChart3, Signal } from 'lucide-react'

const API_BASE = '/api'

function App() {
  const [eas, setEas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEa, setSelectedEa] = useState(null)
  const [eaPerformance, setEaPerformance] = useState(null)
  const [eaSignals, setEaSignals] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchEAs()
    const interval = setInterval(fetchEAs, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedEa) {
      fetchEAPerformance(selectedEa)
      fetchEASignals(selectedEa)
      fetchEAStats(selectedEa)
    }
  }, [selectedEa])

  const fetchEAs = async () => {
    try {
      const res = await fetch(`${API_BASE}/ea`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setEas(data.eas || [])
      if (data.eas?.length > 0 && !selectedEa) {
        setSelectedEa(data.eas[0].id)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch EAs:', err)
      setLoading(false)
    }
  }

  const fetchEAPerformance = async (eaId) => {
    try {
      const res = await fetch(`${API_BASE}/ea/${eaId}/performance/summary`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setEaPerformance(data.summary)
    } catch (err) {
      console.error('Failed to fetch performance:', err)
    }
  }

  const fetchEASignals = async (eaId) => {
    try {
      const res = await fetch(`${API_BASE}/ea/${eaId}/signals?limit=50`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setEaSignals(data.signals || [])
    } catch (err) {
      console.error('Failed to fetch signals:', err)
    }
  }

  const fetchEAStats = async (eaId) => {
    try {
      const res = await fetch(`${API_BASE}/ea/${eaId}/signals/stats`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const getStatusColor = (isOnline) => isOnline ? 'bg-emerald-500' : 'bg-slate-500'
  const getStatusText = (isOnline) => isOnline ? 'Online' : 'Offline'
  const getSignalIcon = (type) => type.includes('BUY') ? TrendingUp : TrendingDown
  const getSignalColor = (type) => type.includes('BUY') ? 'text-emerald-400' : 'text-red-400'
  const getSignalBg = (type) => type.includes('BUY') ? 'bg-emerald-500/20' : 'bg-red-500/20'

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">MT Connector</span>
              <p className="text-xs text-slate-400">MetaTrader EA Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{eas.length} EAs connected</span>
            <button 
              onClick={fetchEAs}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-lg hover:bg-slate-700 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : eas.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No Expert Advisors Connected</h2>
            <p className="text-slate-500 mb-6">Connect your MetaTrader EA to start monitoring</p>
            <div className="bg-slate-900 rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm text-slate-400 mb-2">EA Configuration (MQL5):</p>
              <code className="text-xs text-emerald-400 block">
                CONFIG_URL = "http://your-server:3000/api"<br/>
                CONFIG_SECRET = "ea-secret-key"<br/>
                CONFIG_EA_ID = "" // Auto-generated if empty
              </code>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* EA List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-white mb-4">Expert Advisors</h2>
              <div className="space-y-3">
                {eas.map((ea) => (
                  <div
                    key={ea.id}
                    onClick={() => setSelectedEa(ea.id)}
                    className={`bg-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-750 ${
                      selectedEa === ea.id ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(ea.isOnline)}`}></div>
                        <span className="font-medium text-white">{ea.id.split('_')[0]}</span>
                      </div>
                      <span className="text-xs text-slate-500">{getStatusText(ea.isOnline)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Balance</p>
                        <p className="text-white font-medium">${ea.balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Platform</p>
                        <p className="text-white">{ea.platform}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Broker</p>
                        <p className="text-white text-xs truncate">{ea.broker || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Symbols</p>
                        <p className="text-white text-xs">{ea.symbols?.join(', ') || _Symbol}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EA Details */}
            <div className="lg:col-span-2">
              {selectedEa ? (
                <div className="space-y-6">
                  {/* Tabs */}
                  <div className="flex gap-4 border-b border-slate-700">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-3 px-1 text-sm font-medium transition-colors ${
                        activeTab === 'overview' 
                          ? 'text-emerald-400 border-b-2 border-emerald-400' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('signals')}
                      className={`pb-3 px-1 text-sm font-medium transition-colors ${
                        activeTab === 'signals' 
                          ? 'text-emerald-400 border-b-2 border-emerald-400' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Signals ({eaSignals.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('performance')}
                      className={`pb-3 px-1 text-sm font-medium transition-colors ${
                        activeTab === 'performance' 
                          ? 'text-emerald-400 border-b-2 border-emerald-400' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Performance
                    </button>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Quick Stats */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Net Profit</span>
                          </div>
                          <p className={`text-2xl font-bold ${(eaPerformance?.trading?.totalNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(eaPerformance?.trading?.totalNetProfit || 0) >= 0 ? '+' : ''}{eaPerformance?.trading?.totalNetProfit?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Win Rate</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{eaPerformance?.trading?.winRate || '0'}%</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Profit Factor</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{eaPerformance?.trading?.profitFactor || '0'}</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Max Drawdown</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-400">{eaPerformance?.risk?.maxDrawdown || '0'}%</p>
                        </div>
                      </div>

                      {/* Signal Distribution */}
                      {stats && (
                        <div className="bg-slate-800 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Signal Distribution</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-slate-500 mb-2">By Type</p>
                              <div className="space-y-2">
                                {Object.entries(stats.byType || {}).map(([type, count]) => (
                                  <div key={type} className="flex items-center justify-between">
                                    <span className={type.includes('BUY') ? 'text-emerald-400' : 'text-red-400'}>{type}</span>
                                    <span className="text-white font-medium">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 mb-2">By Symbol</p>
                              <div className="space-y-2">
                                {Object.entries(stats.bySymbol || {}).map(([symbol, count]) => (
                                  <div key={symbol} className="flex items-center justify-between">
                                    <span className="text-white">{symbol}</span>
                                    <span className="text-slate-400">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
                            <span className="text-slate-500">Signals in last 24h</span>
                            <span className="text-white font-medium">{stats.last24h}</span>
                          </div>
                        </div>
                      )}

                      {/* Recent Signals Preview */}
                      <div className="bg-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Recent Signals</h3>
                          <button 
                            onClick={() => setActiveTab('signals')}
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                          >
                            View All →
                          </button>
                        </div>
                        {eaSignals.length > 0 ? (
                          <div className="space-y-3">
                            {eaSignals.slice(0, 5).map((signal) => {
                              const Icon = getSignalIcon(signal.type);
                              return (
                                <div key={signal.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSignalBg(signal.type)}`}>
                                      <Icon className={`w-5 h-5 ${getSignalColor(signal.type)}`} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">{signal.type} {signal.symbol}</p>
                                      <p className="text-sm text-slate-500">@{signal.price}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(signal.timestamp).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-slate-500">{signal.reason}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-center py-8">No signals recorded yet</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Signals Tab */}
                  {activeTab === 'signals' && (
                    <div className="bg-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Signal History</h3>
                      {eaSignals.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-sm text-slate-500 border-b border-slate-700">
                                <th className="pb-3">Time</th>
                                <th className="pb-3">Type</th>
                                <th className="pb-3">Symbol</th>
                                <th className="pb-3">Volume</th>
                                <th className="pb-3">Price</th>
                                <th className="pb-3">Ticket</th>
                                <th className="pb-3">Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eaSignals.map((signal) => (
                                <tr key={signal.id} className="border-b border-slate-700/50 last:border-0">
                                  <td className="py-3 text-sm text-slate-400">
                                    {new Date(signal.timestamp).toLocaleString()}
                                  </td>
                                  <td className="py-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                                      signal.type.includes('BUY') 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {signal.type}
                                    </span>
                                  </td>
                                  <td className="py-3 text-white font-medium">{signal.symbol}</td>
                                  <td className="py-3 text-slate-400">{signal.volume}</td>
                                  <td className="py-3 text-white">{signal.price}</td>
                                  <td className="py-3 text-slate-400">#{signal.ticket}</td>
                                  <td className="py-3 text-slate-500">{signal.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">No signals recorded yet</p>
                      )}
                    </div>
                  )}

                  {/* Performance Tab */}
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      {eaPerformance ? (
                        <>
                          <div className="bg-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Trading Summary</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Total Signals</p>
                                <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Winning Trades</p>
                                <p className="text-3xl font-bold text-emerald-400">{eaPerformance.trading.winningTrades}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Losing Trades</p>
                                <p className="text-3xl font-bold text-red-400">{eaPerformance.trading.losingTrades}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Profit/Loss Analysis</h3>
                            <div className="grid md:grid-cols-4 gap-6">
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Total Profit</p>
                                <p className="text-xl font-bold text-emerald-400">+${eaPerformance.trading.totalProfit.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Total Loss</p>
                                <p className="text-xl font-bold text-red-400">-${eaPerformance.trading.totalLoss.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Net Profit</p>
                                <p className={`text-xl font-bold ${eaPerformance.trading.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {eaPerformance.trading.totalNetProfit >= 0 ? '+' : ''}${eaPerformance.trading.totalNetProfit.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Profit Factor</p>
                                <p className="text-xl font-bold text-white">{eaPerformance.trading.profitFactor}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Average Drawdown</p>
                                <p className="text-xl font-bold text-yellow-400">{eaPerformance.risk.avgDrawdown}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Maximum Drawdown</p>
                                <p className="text-xl font-bold text-orange-400">{eaPerformance.risk.maxDrawdown}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Sharpe Ratio</p>
                                <p className="text-xl font-bold text-white">{eaPerformance.sharpeRatio}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Balance History</h3>
                            <div className="grid md:grid-cols-4 gap-6">
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Initial Balance</p>
                                <p className="text-xl font-bold text-white">${eaPerformance.balance.initial.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Current Balance</p>
                                <p className="text-xl font-bold text-white">${eaPerformance.balance.current.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Balance Change</p>
                                <p className={`text-xl font-bold ${eaPerformance.balance.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {eaPerformance.balance.change >= 0 ? '+' : ''}${eaPerformance.balance.change.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Return</p>
                                <p className={`text-xl font-bold ${eaPerformance.balance.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {eaPerformance.balance.changePercent >= 0 ? '+' : ''}{eaPerformance.balance.changePercent.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-500">
                              Period: {new Date(eaPerformance.period.from).toLocaleDateString()} - {new Date(eaPerformance.period.to).toLocaleDateString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-800 rounded-xl p-12 text-center">
                          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400">No performance data available yet</p>
                          <p className="text-sm text-slate-500 mt-2">Performance data is collected every 5 minutes from the EA</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-12 text-center">
                  <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select an Expert Advisor to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
