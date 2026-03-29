import React, { useState } from 'react'

const mockAlerts = [
  { id: 1, symbol: 'NVDA', type: 'SENTIMENT_THRESHOLD', condition: 'ABOVE', threshold: 0.7, currentValue: 0.82, triggered: true, triggeredAt: '10m ago' },
  { id: 2, symbol: 'TSLA', type: 'SENTIMENT_SHIFT', condition: 'SHIFT', threshold: 0.3, currentValue: -0.45, triggered: true, triggeredAt: '25m ago' },
  { id: 3, symbol: 'AAPL', type: 'SENTIMENT_THRESHOLD', condition: 'ABOVE', threshold: 0.6, currentValue: 0.72, triggered: false },
  { id: 4, symbol: 'SPY', type: 'SENTIMENT_THRESHOLD', condition: 'BELOW', threshold: -0.5, currentValue: 0.28, triggered: false },
]

export function AlertsPage({ userId }) {
  const [alerts, setAlerts] = useState(mockAlerts)
  const [showCreate, setShowCreate] = useState(false)
  const [newAlert, setNewAlert] = useState({ symbol: '', condition: 'ABOVE', threshold: 0.5 })

  const handleAcknowledge = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, triggered: false } : a))
  }

  const handleDelete = (id) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  const handleCreate = () => {
    const newId = Math.max(...alerts.map(a => a.id)) + 1
    setAlerts([...alerts, { ...newAlert, id: newId, triggered: false, currentValue: null, triggeredAt: null }])
    setShowCreate(false)
    setNewAlert({ symbol: '', condition: 'ABOVE', threshold: 0.5 })
  }

  const triggeredCount = alerts.filter(a => a.triggered).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-slate-400">
            {triggeredCount > 0 
              ? `${triggeredCount} alert${triggeredCount > 1 ? 's' : ''} triggered`
              : 'No active alerts'
            }
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create Alert'}
        </button>
      </div>

      {/* Create Alert Form */}
      {showCreate && (
        <div className="card p-6 bg-violet-500/10 border-violet-500/30 animate-slide-up">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Alert</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Symbol</label>
              <input
                type="text"
                value={newAlert.symbol}
                onChange={e => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                placeholder="NVDA"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Condition</label>
              <select
                value={newAlert.condition}
                onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ABOVE">Above</option>
                <option value="BELOW">Below</option>
                <option value="SHIFT">Sentiment Shift</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Threshold</label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={newAlert.threshold}
                onChange={e => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                disabled={!newAlert.symbol}
                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredCount > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Triggered Alerts
          </h2>
          {alerts.filter(a => a.triggered).map(alert => (
            <div key={alert.id} className="card p-4 border-red-500/30 bg-red-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-xl">
                    🚨
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.symbol}</span>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {alert.condition} {alert.threshold} • Current: {(alert.currentValue * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-500">{alert.triggeredAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    View Signal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Alerts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">All Alerts</h2>
        {alerts.map(alert => (
          <div key={alert.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  alert.triggered ? 'bg-red-500/20' : 'bg-slate-700/50'
                }`}>
                  {alert.triggered ? '🚨' : '🔔'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{alert.symbol}</span>
                    <span className="text-xs text-slate-400">
                      {alert.condition} {(alert.threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{alert.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDelete(alert.id)}
                  className="px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
