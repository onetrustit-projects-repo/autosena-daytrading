const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store for demo (replace with MongoDB in production)
const eaRegistry = new Map();
const heartbeatStore = new Map();

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
  if (heartbeats.length > 1000) heartbeats.shift(); // Keep last 1000
  heartbeatStore.set(ea.id, heartbeats);
  
  // Update EA status
  ea.lastHeartbeat = heartbeat.timestamp;
  ea.status = 'active';
  eaRegistry.set(ea.id, ea);
  
  res.json({ success: true, heartbeat });
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
