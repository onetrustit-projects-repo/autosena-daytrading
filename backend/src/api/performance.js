const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store
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

// Submit performance metrics from EA
router.post('/:eaId/performance', authenticateConnector, (req, res) => {
  try {
    const { eaId } = req.params;
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
      eaId,
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
    
    // Store metric
    const metrics = performanceStore.get(eaId) || [];
    metrics.push(metric);
    if (metrics.length > 10000) metrics.shift();
    performanceStore.set(eaId, metrics);
    
    console.log(`Performance received from ${eaId}: Equity ${equity}, Drawdown ${maxDrawdown}%`);
    
    res.status(201).json({ success: true, metric });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to process performance data' });
  }
});

// Get performance history for an EA
router.get('/:eaId/performance', authenticateConnector, (req, res) => {
  const { eaId } = req.params;
  const { limit = 100, offset = 0, from, to } = req.query;
  
  let metrics = performanceStore.get(eaId) || [];
  
  // Filter by date range if provided
  if (from) {
    const fromDate = new Date(from);
    metrics = metrics.filter(m => new Date(m.timestamp) >= fromDate);
  }
  
  if (to) {
    const toDate = new Date(to);
    metrics = metrics.filter(m => new Date(m.timestamp) <= toDate);
  }
  
  // Sort by timestamp descending
  metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Paginate
  const paginatedMetrics = metrics.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ 
    metrics: paginatedMetrics,
    total: metrics.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Get performance summary/analytics
router.get('/:eaId/performance/summary', authenticateConnector, (req, res) => {
  const { eaId } = req.params;
  const metrics = performanceStore.get(eaId) || [];
  
  if (metrics.length === 0) {
    return res.json({ 
      summary: null,
      message: 'No performance data available'
    });
  }
  
  // Calculate summary statistics
  const latest = metrics[metrics.length - 1]; // Oldest since sorted desc
  const current = metrics[0]; // Newest
  
  const totalNetProfit = current.balance - (latest?.balance || current.balance);
  const avgWinRate = metrics.reduce((sum, m) => sum + m.winRate, 0) / metrics.length;
  const avgDrawdown = metrics.reduce((sum, m) => sum + m.maxDrawdown, 0) / metrics.length;
  const maxDrawdownEver = Math.max(...metrics.map(m => m.maxDrawdown));
  
  // Calculate profit factor
  const totalProfitAll = metrics.reduce((sum, m) => sum + m.totalProfit, 0);
  const totalLossAll = metrics.reduce((sum, m) => sum + m.totalLoss, 0);
  const profitFactor = totalLossAll > 0 ? totalProfitAll / totalLossAll : totalProfitAll > 0 ? Infinity : 0;
  
  // Calculate return percentage
  const initialBalance = latest?.balance || current.balance;
  const returnPct = initialBalance > 0 ? ((current.balance - initialBalance) / initialBalance) * 100 : 0;
  
  const summary = {
    eaId,
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

module.exports = router;
