const express = require('express');
const router = express.Router();
const RewardsService = require('../../services/rewardsService');

// GET /api/rewards/user/:userId - Get user's rewards/credits
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const rewards = RewardsService.getUserRewards(userId);
    
    if (!rewards) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ rewards });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// POST /api/rewards/claim - Claim a leaderboard reward
router.post('/claim', (req, res) => {
  try {
    const { userId, period } = req.body;
    
    if (!userId || !period) {
      return res.status(400).json({ 
        error: 'userId and period required' 
      });
    }

    const result = RewardsService.claimReward(userId, period);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Reward claim error:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

// GET /api/rewards/redemptions - Get available redemption options
router.get('/redemptions', (req, res) => {
  try {
    const options = RewardsService.getRedemptionOptions();
    res.json({ options });
  } catch (error) {
    console.error('Redemptions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

// POST /api/rewards/redeem - Redeem a reward option
router.post('/redeem', (req, res) => {
  try {
    const { userId, optionId } = req.body;
    
    if (!userId || !optionId) {
      return res.status(400).json({ 
        error: 'userId and optionId required' 
      });
    }

    const result = RewardsService.redeem(userId, optionId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem' });
  }
});

module.exports = router;
