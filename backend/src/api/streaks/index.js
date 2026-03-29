const express = require('express');
const router = express.Router();
const StreakService = require('../../services/streakService');

// GET /api/streaks/user/:userId - Get user's streak data
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const streak = StreakService.getUserStreak(userId);
    const milestones = StreakService.getMilestones();
    
    res.json({ streak, milestones });
  } catch (error) {
    console.error('Streak fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch streak data' });
  }
});

// POST /api/streaks/update - Update streak after daily close
router.post('/update', (req, res) => {
  try {
    const { userId, date, profitLoss } = req.body;
    
    if (!userId || profitLoss === undefined) {
      return res.status(400).json({ 
        error: 'userId and profitLoss required' 
      });
    }

    const streak = StreakService.updateStreak(userId, date, profitLoss);
    const newMilestones = StreakService.checkMilestone(streak);
    
    res.json({ 
      success: true,
      streak,
      newMilestones
    });
  } catch (error) {
    console.error('Streak update error:', error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// GET /api/streaks/milestones - Get all streak milestones
router.get('/milestones', (req, res) => {
  try {
    const milestones = StreakService.getMilestones();
    res.json({ milestones });
  } catch (error) {
    console.error('Milestones fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

module.exports = router;
