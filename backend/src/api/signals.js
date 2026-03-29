const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store
const signalStore = new Map();

// Auth middleware
const authenticateConnector = (req, res, next) => {
  const secret = req.headers['x-connector-secret'];
  const expectedSecret = process.env.MT_CONNECTOR_SECRET || 'ea-secret-key';
  
  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid connector secret' });
  }
  next();
};

// Submit signals from EA
router.post('/:eaId/signals', authenticateConnector, (req, res) => {
  try {
    const { eaId } = req.params;
    const { symbol, type, volume, price, ticket, reason, timestamp } = req.body;
    
    if (!symbol || !type) {
      return res.status(400).json({ error: 'symbol and type are required' });
    }
    
    const signal = {
      id: uuidv4(),
      eaId,
      symbol,
      type,
      volume: parseFloat(volume) || 0,
      price: parseFloat(price) || 0,
      ticket: parseInt(ticket) || 0,
      reason: reason || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      status: 'received'
    };
    
    // Store signal
    const signals = signalStore.get(eaId) || [];
    signals.push(signal);
    if (signals.length > 10000) signals.shift();
    signalStore.set(eaId, signals);
    
    console.log(`Signal received: ${type} ${symbol} @ ${price} from ${eaId}`);
    
    res.status(201).json({ success: true, signal });
  } catch (error) {
    console.error('Signal error:', error);
    res.status(500).json({ error: 'Failed to process signal' });
  }
});

// Get signals for an EA
router.get('/:eaId/signals', authenticateConnector, (req, res) => {
  const { eaId } = req.params;
  const { limit = 100, offset = 0, symbol, type } = req.query;
  
  let signals = signalStore.get(eaId) || [];
  
  // Filter by symbol if provided
  if (symbol) {
    signals = signals.filter(s => s.symbol === symbol);
  }
  
  // Filter by type if provided
  if (type) {
    signals = signals.filter(s => s.type === type);
  }
  
  // Sort by timestamp descending
  signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Paginate
  const paginatedSignals = signals.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ 
    signals: paginatedSignals,
    total: signals.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Get signal statistics
router.get('/:eaId/signals/stats', authenticateConnector, (req, res) => {
  const { eaId } = req.params;
  const signals = signalStore.get(eaId) || [];
  
  const stats = {
    total: signals.length,
    byType: {},
    bySymbol: {},
    last24h: 0,
    lastSignal: signals.length > 0 ? signals[signals.length - 1] : null
  };
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  signals.forEach(s => {
    // By type
    stats.byType[s.type] = (stats.byType[s.type] || 0) + 1;
    
    // By symbol
    stats.bySymbol[s.symbol] = (stats.bySymbol[s.symbol] || 0) + 1;
    
    // Last 24h
    if (new Date(s.timestamp) > oneDayAgo) {
      stats.last24h++;
    }
  });
  
  res.json({ stats });
});

module.exports = router;
