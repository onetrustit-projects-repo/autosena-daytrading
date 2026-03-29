const express = require('express');
const router = express.Router();
const LeaderboardEngine = require('../../services/leaderboardEngine');

// GET /api/leaderboard?period=daily|weekly|monthly
router.get('/', (req, res) => {
  try {
    const { period = 'daily', limit = 100 } = req.query;
    const validPeriods = ['daily', 'weekly', 'monthly'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period',
        validPeriods 
      });
    }

    const leaderboard = LeaderboardEngine.getLeaderboard(period, parseInt(limit));
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/leaderboard/user/:userId
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'daily' } = req.query;
    
    const rank = LeaderboardEngine.getUserRank(userId, period);
    
    if (!rank) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ rank });
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

// POST /api/leaderboard/snapshot (admin/triggered)
router.post('/snapshot', (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    const result = LeaderboardEngine.saveSnapshot(period);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Snapshot save error:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// GET /api/leaderboard/history/:userId
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = require('../../models/schema');
    
    const history = db.prepare(`
      SELECT * FROM leaderboard_snapshots
      WHERE user_id = ?
      ORDER BY period_start DESC, period DESC
      LIMIT 30
    `).all(userId);

    res.json({ history });
  } catch (error) {
    console.error('Leaderboard history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
