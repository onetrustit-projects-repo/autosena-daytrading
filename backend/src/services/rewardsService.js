const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class RewardsService {
  // Leaderboard rewards configuration
  static LEADERBOARD_REWARDS = {
    daily: [
      { rank: 1, credits: 500, badge: 'Daily Champion' },
      { rank: 2, credits: 250, badge: 'Daily Runner-Up' },
      { rank: 3, credits: 100, badge: 'Daily Bronze' },
      { rank: 4, credits: 50, badge: null },
      { rank: 5, credits: 25, badge: null },
      { rank: 6, credits: 20, badge: null },
      { rank: 7, credits: 15, badge: null },
      { rank: 8, credits: 10, badge: null },
      { rank: 9, credits: 8, badge: null },
      { rank: 10, credits: 5, badge: null }
    ],
    weekly: [
      { rank: 1, credits: 2000, badge: 'Weekly Legend' },
      { rank: 2, credits: 1000, badge: 'Weekly Champion' },
      { rank: 3, credits: 500, badge: 'Weekly Bronze' },
      { rank: 4, credits: 250, badge: null },
      { rank: 5, credits: 100, badge: null },
      { rank: 6, credits: 75, badge: null },
      { rank: 7, credits: 50, badge: null },
      { rank: 8, credits: 40, badge: null },
      { rank: 9, credits: 30, badge: null },
      { rank: 10, credits: 20, badge: null }
    ],
    monthly: [
      { rank: 1, credits: 10000, badge: 'Monthly Master' },
      { rank: 2, credits: 5000, badge: 'Monthly Champion' },
      { rank: 3, credits: 2500, badge: 'Monthly Bronze' },
      { rank: 4, credits: 1000, badge: null },
      { rank: 5, credits: 500, badge: null },
      { rank: 6, credits: 400, badge: null },
      { rank: 7, credits: 300, badge: null },
      { rank: 8, credits: 200, badge: null },
      { rank: 9, credits: 100, badge: null },
      { rank: 10, credits: 50, badge: null }
    ]
  };

  /**
   * Get user's rewards/credits balance
   */
  static getUserRewards(userId) {
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    const recentRewards = db.prepare(`
      SELECT * FROM rewards 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(userId);

    const totalEarned = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM rewards 
      WHERE user_id = ? AND amount > 0
    `).get(userId);

    const totalClaimed = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM rewards 
      WHERE user_id = ? AND amount < 0 AND claimed = 1
    `).get(userId);

    return {
      balance: user.credits,
      totalEarned: totalEarned.total,
      totalClaimed: Math.abs(totalClaimed.total),
      recentRewards,
      availableRewards: this.getAvailableLeaderboardRewards(userId)
    };
  }

  /**
   * Get available leaderboard rewards to claim
   */
  static getAvailableLeaderboardRewards(userId) {
    const { getLeaderboard } = require('./leaderboardEngine');
    const available = [];

    for (const [period, rewards] of Object.entries(this.LEADERBOARD_REWARDS)) {
      const leaderboard = getLeaderboard(period, 10);
      const userEntry = leaderboard.find(e => e.userId === userId);
      
      if (userEntry && userEntry.rank <= 10) {
        const reward = rewards.find(r => r.rank === userEntry.rank);
        if (reward) {
          // Check if already claimed
          const existing = db.prepare(`
            SELECT * FROM rewards 
            WHERE user_id = ? AND reason LIKE ? AND claimed = 1
          `).get(userId, `%${period}%`);

          available.push({
            period,
            rank: userEntry.rank,
            reward: reward.credits,
            badge: reward.badge,
            alreadyClaimed: !!existing,
            canClaim: !existing
          });
        }
      }
    }

    return available;
  }

  /**
   * Claim a leaderboard reward
   */
  static claimReward(userId, period) {
    const { getLeaderboard } = require('./leaderboardEngine');
    const leaderboard = getLeaderboard(period, 10);
    const userEntry = leaderboard.find(e => e.userId === userId);
    
    if (!userEntry || userEntry.rank > 10) {
      return { success: false, error: 'Not eligible for reward' };
    }

    const rewards = this.LEADERBOARD_REWARDS[period];
    const reward = rewards.find(r => r.rank === userEntry.rank);
    
    if (!reward) {
      return { success: false, error: 'No reward configured for this rank' };
    }

    // Check if already claimed
    const existing = db.prepare(`
      SELECT * FROM rewards 
      WHERE user_id = ? AND reason = ?
    `).get(userId, `Leaderboard ${period} rank #${userEntry.rank}`);

    if (existing) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Create reward record
    db.prepare(`
      INSERT INTO rewards (id, user_id, type, amount, reason, claimed)
      VALUES (?, ?, 'leaderboard', ?, ?, 1)
    `).run(uuidv4(), userId, reward.credits, `Leaderboard ${period} rank #${userEntry.rank}`);

    // Update user credits
    db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(reward.credits, userId);

    return {
      success: true,
      reward: {
        period,
        rank: userEntry.rank,
        credits: reward.credits,
        badge: reward.badge
      }
    };
  }

  /**
   * Award credits for achievement
   */
  static awardAchievementCredits(userId, achievementId) {
    const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achievementId);
    if (!achievement || achievement.reward_credits <= 0) {
      return { success: false };
    }

    db.prepare(`
      INSERT INTO rewards (id, user_id, type, amount, reason, claimed)
      VALUES (?, ?, 'achievement', ?, ?, 1)
    `).run(uuidv4(), userId, achievement.reward_credits, `Achievement: ${achievement.name}`);

    db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
      .run(achievement.reward_credits, userId);

    return { success: true, credits: achievement.reward_credits };
  }

  /**
   * Get redemption options
   */
  static getRedemptionOptions() {
    return [
      { id: 'feature_profile', name: 'Feature My Profile', description: 'Get featured on the leaderboard for 24 hours', credits: 500 },
      { id: 'highlight_trade', name: 'Highlight Trade', description: 'Highlight a winning trade for all to see', credits: 100 },
      { id: 'extra_analytics', name: 'Premium Analytics', description: 'Access advanced analytics for 7 days', credits: 200 },
      { id: 'copy_badge', name: 'Copy Trading Badge', description: 'Display "Top Copied Trader" badge', credits: 300 },
      { id: 'mentor_badge', name: 'Mentor Badge', description: 'Show "Verified Mentor" on profile', credits: 400 }
    ];
  }

  /**
   * Redeem a reward option
   */
  static redeem(userId, optionId) {
    const options = this.getRedemptionOptions();
    const option = options.find(o => o.id === optionId);
    
    if (!option) {
      return { success: false, error: 'Invalid redemption option' };
    }

    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
    if (!user || user.credits < option.credits) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Deduct credits
    db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(option.credits, userId);

    // Create reward record (negative for redemption)
    db.prepare(`
      INSERT INTO rewards (id, user_id, type, amount, reason, claimed)
      VALUES (?, ?, 'redemption', ?, ?, 1)
    `).run(uuidv4(), userId, -option.credits, `Redeemed: ${option.name}`);

    return {
      success: true,
      redemption: {
        option: option.name,
        creditsSpent: option.credits
      }
    };
  }
}

module.exports = RewardsService;
