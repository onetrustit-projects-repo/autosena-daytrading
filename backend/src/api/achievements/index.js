const express = require('express');
const router = express.Router();
const AchievementService = require('../../services/achievementService');

// GET /api/achievements - Get all achievements
router.get('/', (req, res) => {
  try {
    const achievements = AchievementService.getAllAchievements();
    res.json({ achievements });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// GET /api/achievements/user/:userId - Get user's achievements
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = AchievementService.getUserAchievements(userId);
    const stats = AchievementService.getStats(userId);
    
    res.json({ ...result, stats });
  } catch (error) {
    console.error('User achievements fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

// POST /api/achievements/progress - Update progress (called after trades)
router.post('/progress', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const result = AchievementService.updateProgress(userId);
    res.json({ 
      success: true, 
      newAchievements: result.newAchievements,
      message: result.newAchievements.length > 0 
        ? `Unlocked ${result.newAchievements.length} achievement(s)!`
        : 'Progress updated'
    });
  } catch (error) {
    console.error('Achievement progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/achievements/stats/:userId - Get achievement stats
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const stats = AchievementService.getStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ stats });
  } catch (error) {
    console.error('Achievement stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
