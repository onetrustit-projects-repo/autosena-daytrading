import { useState, useEffect } from 'react'
import { Activity, Cpu, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Server } from 'lucide-react'

const API_BASE = '/api'

function App() {
  const [eas, setEas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEa, setSelectedEa] = useState(null)
  const [eaPerformance, setEaPerformance] = useState(null)
  const [eaSignals, setEaSignals] = useState([])

  useEffect(() => {
    fetchEAs()
    const interval = setInterval(fetchEAs, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedEa) {
      fetchEAPerformance(selectedEa)
      fetchEASignals(selectedEa)
    }
  }, [selectedEa])

  const fetchEAs = async () => {
    try {
      const res = await fetch(`${API_BASE}/ea`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setEas(data.eas || [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch EAs:', err)
      setLoading(false)
    }
  }

  const fetchEAPerformance = async (eaId) => {
    try {
      const res = await fetch(`${API_BASE}/performance/${eaId}/performance/summary`, {
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
      const res = await fetch(`${API_BASE}/signals/${eaId}/signals?limit=20`, {
        headers: { 'X-Connector-Secret': 'ea-secret-key' }
      })
      const data = await res.json()
      setEaSignals(data.signals || [])
    } catch (err) {
      console.error('Failed to fetch signals:', err)
    }
  }

  const getStatusColor = (isOnline) => isOnline ? 'bg-emerald-500' : 'bg-slate-500'
  const getStatusText = (isOnline) => isOnline ? 'Online' : 'Offline'

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
            <div className="bg-slate-900 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-slate-400 mb-2">EA Configuration:</p>
              <code className="text-xs text-emerald-400">
                CONFIG_URL = "http://your-server:3000/api"<br/>
                CONFIG_SECRET = "ea-secret-key"
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
                        <p className="text-white font-medium">${ea.balance?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Platform</p>
                        <p className="text-white">{ea.platform}</p>
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
                  {/* Performance Summary */}
                  <div className="bg-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                    {eaPerformance ? (
                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-slate-500 text-sm mb-1">Net Profit</p>
                          <p className={`text-2xl font-bold ${eaPerformance.trading.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {eaPerformance.trading.totalNetProfit >= 0 ? '+' : ''}{eaPerformance.trading.totalNetProfit.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm mb-1">Win Rate</p>
                          <p className="text-2xl font-bold text-white">{eaPerformance.trading.winRate}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm mb-1">Profit Factor</p>
                          <p className="text-2xl font-bold text-white">{eaPerformance.trading.profitFactor}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-sm mb-1">Max Drawdown</p>
                          <p className="text-2xl font-bold text-yellow-400">{eaPerformance.risk.maxDrawdown}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Loading performance data...</p>
                    )}
                  </div>

                  {/* Recent Signals */}
                  <div className="bg-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Signals</h3>
                    {eaSignals.length > 0 ? (
                      <div className="space-y-3">
                        {eaSignals.slice(0, 10).map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                signal.type.includes('BUY') ? 'bg-emerald-500/20' : 'bg-red-500/20'
                              }`}>
                                {signal.type.includes('BUY') ? (
                                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-400" />
                                )}
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
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No signals recorded yet</p>
                    )}
                  </div>
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
