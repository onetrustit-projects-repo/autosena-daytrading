const express = require('express');
const router = express.Router();
const AlertService = require('../../services/alertService');

// GET /api/alerts - Get user's alerts
router.get('/', (req, res) => {
  try {
    const { userId, symbol, enabled } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const alerts = AlertService.getUserAlerts(userId, symbol, enabled !== 'false');
    res.json({ alerts });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/alerts/history - Get alert history
router.get('/history', (req, res) => {
  try {
    const { userId, symbol, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const history = AlertService.getAlertHistory(userId, symbol, parseInt(limit));
    res.json({ history });
  } catch (error) {
    console.error('Alert history error:', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', (req, res) => {
  try {
    const { userId, days = 30 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const stats = AlertService.getAlertStats(userId, parseInt(days));
    res.json({ stats });
  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({ error: 'Failed to fetch alert stats' });
  }
});

// POST /api/alerts - Create alert
router.post('/', (req, res) => {
  try {
    const { userId, symbol, alertType, condition, threshold } = req.body;
    
    if (!userId || !symbol) {
      return res.status(400).json({ error: 'userId and symbol required' });
    }

    let alerts;
    if (alertType === AlertService.ALERT_TYPES.SENTIMENT_THRESHOLD) {
      alerts = AlertService.createSentimentThreshold(userId, symbol.toUpperCase(), threshold, -threshold);
    } else {
      const alert = AlertService.createAlert(userId, symbol.toUpperCase(), alertType, condition, threshold);
      alerts = [alert];
    }

    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// POST /api/alerts/:alertId/acknowledge - Acknowledge alert
router.post('/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = AlertService.acknowledgeAlert(alertId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/alerts/check - Check alerts for symbol
router.post('/check', (req, res) => {
  try {
    const { symbol, userId } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }

    const triggered = AlertService.checkAlerts(symbol.toUpperCase(), userId);
    res.json({ triggered, count: triggered.length });
  } catch (error) {
    console.error('Alert check error:', error);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
});

// PUT /api/alerts/:alertId - Update alert
router.put('/:alertId', (req, res) => {
  try {
    const { alertId } = req.params;
    const { threshold, condition, enabled } = req.body;

    const alert = AlertService.updateAlert(alertId, { threshold, condition, enabled });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Alert update error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// DELETE /api/alerts/:alertId - Delete alert
router.delete('/:alertId', (req, res) => {
  try {
    const { alertId } = req.params;
    AlertService.deleteAlert(alertId);
    res.json({ success: true });
  } catch (error) {
    console.error('Alert delete error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
