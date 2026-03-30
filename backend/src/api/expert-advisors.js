const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store for demo (replace with MongoDB in production)
const eaRegistry = new Map();
const heartbeatStore = new Map();
const signalStore = new Map();
const performanceStore = new Map();

// Auth middleware
const authenticateConnector = (req, res, next) => {
  const secret = req.headers['x-connector-secret'];
  const expectedSecret = process.env.MT_CONNECTOR_SECRET || 'ea-secret-key';
  
  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid connector secret' });
  }
  next();
};

// Register new EA
router.post('/register', authenticateConnector, (req, res) => {
  try {
    const { ea_id, account_id, broker, currency, balance, platform, version, symbols } = req.body;
    
    if (!ea_id) {
      return res.status(400).json({ error: 'ea_id is required' });
    }
    
    const eaData = {
      id: ea_id,
      accountId: account_id,
      broker,
      currency,
      balance: parseFloat(balance) || 0,
      platform: platform || 'MT5',
      version: version || '1.0',
      symbols: symbols || [],
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      status: 'active'
    };
    
    eaRegistry.set(ea_id, eaData);
    heartbeatStore.set(ea_id, []);
    
    console.log(`EA Registered: ${ea_id} from account ${account_id}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'EA registered successfully',
      ea: eaData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get all EAs
router.get('/', authenticateConnector, (req, res) => {
  const eas = Array.from(eaRegistry.values()).map(ea => ({
    ...ea,
    isOnline: isEAOnline(ea.id)
  }));
  res.json({ eas, total: eas.length });
});

// Get specific EA
router.get('/:id', authenticateConnector, (req, res) => {
  const ea = eaRegistry.get(req.params.id);
  
  if (!ea) {
    return res.status(404).json({ error: 'EA not found' });
  }
  
  res.json({ 
    ea: { 
      ...ea, 
      isOnline: isEAOnline(ea.id),
      recentHeartbeats: heartbeatStore.get(ea.id)?.slice(-10) || []
    }
  });
});

// EA Heartbeat
router.post('/:id/heartbeat', authenticateConnector, (req, res) => {
  const ea = eaRegistry.get(req.params.id);
  
  if (!ea) {
    return res.status(404).json({ error: 'EA not found' });
  }
  
  const { timestamp, account_balance, equity, margin, free_margin, open_positions, pending_orders } = req.body;
  
  const heartbeat = {
    timestamp: timestamp || new Date().toISOString(),
    accountBalance: parseFloat(account_balance) || 0,
    equity: parseFloat(equity) || 0,
    margin: parseFloat(margin) || 0,
    freeMargin: parseFloat(free_margin) || 0,
    openPositions: parseInt(open_positions) || 0,
    pendingOrders: parseInt(pending_orders) || 0
  };
  
  // Store heartbeat
  const heartbeats = heartbeatStore.get(ea.id) || [];
  heartbeats.push(heartbeat);
  if (heartbeats.length > 1000) heartbeats.shift();
  heartbeatStore.set(ea.id, heartbeats);
  
  // Update EA status
  ea.lastHeartbeat = heartbeat.timestamp;
  ea.status = 'active';
  eaRegistry.set(ea.id, ea);
  
  res.json({ success: true, heartbeat });
});

// Submit signals for an EA
router.post('/:id/signals', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const { symbol, type, volume, price, ticket, reason, timestamp } = req.body;
  
  if (!symbol || !type) {
    return res.status(400).json({ error: 'symbol and type are required' });
  }
  
  const signal = {
    id: uuidv4(),
    eaId: id,
    symbol,
    type,
    volume: parseFloat(volume) || 0,
    price: parseFloat(price) || 0,
    ticket: parseInt(ticket) || 0,
    reason: reason || 'ea_signal',
    timestamp: timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    status: 'received'
  };
  
  const signals = signalStore.get(id) || [];
  signals.push(signal);
  if (signals.length > 10000) signals.shift();
  signalStore.set(id, signals);
  
  console.log(`Signal received from EA ${id}: ${type} ${symbol} @ ${price}`);
  
  res.status(201).json({ success: true, signal });
});

// Get signals for an EA
router.get('/:id/signals', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  
  const signals = signalStore.get(id) || [];
  signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const paginatedSignals = signals.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ 
    signals: paginatedSignals,
    total: signals.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Get signal statistics for an EA
router.get('/:id/signals/stats', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const signals = signalStore.get(id) || [];
  
  const stats = {
    total: signals.length,
    byType: {},
    bySymbol: {},
    last24h: 0,
    lastSignal: signals.length > 0 ? signals[0] : null
  };
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  signals.forEach(s => {
    stats.byType[s.type] = (stats.byType[s.type] || 0) + 1;
    stats.bySymbol[s.symbol] = (stats.bySymbol[s.symbol] || 0) + 1;
    if (new Date(s.timestamp) > oneDayAgo) {
      stats.last24h++;
    }
  });
  
  res.json({ stats });
});

// Submit performance metrics for an EA
router.post('/:id/performance', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const { 
    timestamp,
    balance,
    equity,
    total_profit,
    total_loss,
    net_profit,
    winning_trades,
    losing_trades,
    win_rate,
    max_drawdown,
    sharpe_ratio
  } = req.body;
  
  const metric = {
    id: uuidv4(),
    eaId: id,
    timestamp: timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    balance: parseFloat(balance) || 0,
    equity: parseFloat(equity) || 0,
    totalProfit: parseFloat(total_profit) || 0,
    totalLoss: parseFloat(total_loss) || 0,
    netProfit: parseFloat(net_profit) || 0,
    winningTrades: parseInt(winning_trades) || 0,
    losingTrades: parseInt(losing_trades) || 0,
    winRate: parseFloat(win_rate) || 0,
    maxDrawdown: parseFloat(max_drawdown) || 0,
    sharpeRatio: parseFloat(sharpe_ratio) || 0
  };
  
  const metrics = performanceStore.get(id) || [];
  metrics.push(metric);
  if (metrics.length > 10000) metrics.shift();
  performanceStore.set(id, metrics);
  
  console.log(`Performance received from EA ${id}: Equity ${equity}, Drawdown ${max_drawdown}%`);
  
  res.status(201).json({ success: true, metric });
});

// Get performance for an EA
router.get('/:id/performance', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const { limit = 100, offset = 0, from, to } = req.query;
  
  let metrics = performanceStore.get(id) || [];
  
  if (from) {
    const fromDate = new Date(from);
    metrics = metrics.filter(m => new Date(m.timestamp) >= fromDate);
  }
  
  if (to) {
    const toDate = new Date(to);
    metrics = metrics.filter(m => new Date(m.timestamp) <= toDate);
  }
  
  metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const paginatedMetrics = metrics.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ 
    metrics: paginatedMetrics,
    total: metrics.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Get performance summary for an EA
router.get('/:id/performance/summary', authenticateConnector, (req, res) => {
  const { id } = req.params;
  const metrics = performanceStore.get(id) || [];
  
  if (metrics.length === 0) {
    return res.json({ 
      summary: null,
      message: 'No performance data available'
    });
  }
  
  const latest = metrics[metrics.length - 1];
  const current = metrics[0];
  
  const totalNetProfit = current.balance - (latest?.balance || current.balance);
  const avgWinRate = metrics.reduce((sum, m) => sum + m.winRate, 0) / metrics.length;
  const avgDrawdown = metrics.reduce((sum, m) => sum + m.maxDrawdown, 0) / metrics.length;
  const maxDrawdownEver = Math.max(...metrics.map(m => m.maxDrawdown));
  
  const totalProfitAll = metrics.reduce((sum, m) => sum + m.totalProfit, 0);
  const totalLossAll = metrics.reduce((sum, m) => sum + m.totalLoss, 0);
  const profitFactor = totalLossAll > 0 ? totalProfitAll / totalLossAll : totalProfitAll > 0 ? Infinity : 0;
  
  const initialBalance = latest?.balance || current.balance;
  const returnPct = initialBalance > 0 ? ((current.balance - initialBalance) / initialBalance) * 100 : 0;
  
  const summary = {
    eaId: id,
    dataPoints: metrics.length,
    period: {
      from: latest?.timestamp,
      to: current.timestamp
    },
    balance: {
      initial: initialBalance,
      current: current.balance,
      change: current.balance - initialBalance,
      changePercent: returnPct
    },
    trading: {
      totalNetProfit,
      totalProfit: totalProfitAll,
      totalLoss: totalLossAll,
      profitFactor: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
      winningTrades: current.winningTrades,
      losingTrades: current.losingTrades,
      winRate: avgWinRate.toFixed(2)
    },
    risk: {
      avgDrawdown: avgDrawdown.toFixed(2),
      maxDrawdown: maxDrawdownEver.toFixed(2)
    },
    sharpeRatio: current.sharpeRatio.toFixed(2)
  };
  
  res.json({ summary });
});

// Delete/Deregister EA
router.delete('/:id', authenticateConnector, (req, res) => {
  const ea = eaRegistry.get(req.params.id);
  
  if (!ea) {
    return res.status(404).json({ error: 'EA not found' });
  }
  
  ea.status = 'deregistered';
  ea.deregisteredAt = new Date().toISOString();
  
  console.log(`EA Deregistered: ${req.params.id}`);
  
  res.json({ success: true, message: 'EA deregistered successfully' });
});

// Helper: Check if EA is online (heartbeat within 5 minutes)
function isEAOnline(eaId) {
  const ea = eaRegistry.get(eaId);
  if (!ea || ea.status === 'deregistered') return false;
  
  const lastHeartbeat = new Date(ea.lastHeartbeat);
  const now = new Date();
  const diffMinutes = (now - lastHeartbeat) / (1000 * 60);
  
  return diffMinutes < 5;
}

module.exports = router;
