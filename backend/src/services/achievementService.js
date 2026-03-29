const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class AchievementService {
  /**
   * Get all achievements
   */
  static getAllAchievements() {
    return db.prepare('SELECT * FROM achievements ORDER BY category, threshold').all();
  }

  /**
   * Get achievement by code
   */
  static getAchievementByCode(code) {
    return db.prepare('SELECT * FROM achievements WHERE code = ?').get(code);
  }

  /**
   * Get user's achievements (earned + progress)
   */
  static getUserAchievements(userId) {
    const earned = db.prepare(`
      SELECT a.*, ua.progress, ua.completed, ua.completed_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.completed_at DESC
    `).all(userId);

    const allAchievements = this.getAllAchievements();
    
    // Get user's current stats
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    
    if (!user) return { earned: [], available: [] };

    // Calculate progress for all achievements
    const available = allAchievements
      .filter(a => !earned.find(e => e.id === a.id))
      .map(a => {
        const progress = this.calculateProgress(user, streak, a);
        return {
          ...a,
          progress: Math.min(progress, a.threshold),
          percentComplete: Math.min((progress / a.threshold) * 100, 100)
        };
      });

    return {
      earned: earned.map(e => ({
        ...e,
        progress: e.threshold,
        percentComplete: 100
      })),
      available
    };
  }

  /**
   * Calculate progress toward an achievement
   */
  static calculateProgress(user, streak, achievement) {
    switch (achievement.category) {
      case 'profit':
        return user.total_profit || 0;
      
      case 'streak':
        return streak?.current_streak || 0;
      
      case 'consistency':
        return user.total_trades || 0;
      
      case 'skill':
        // Win rate based
        const totalTrades = user.total_trades || 0;
        const winningTrades = user.winning_trades || 0;
        return totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      case 'social':
        return user.followers_count || 0;
      
      case 'risk':
        // This would need historical drawdown data
        return 0;
      
      default:
        return 0;
    }
  }

  /**
   * Update user's achievement progress and check for completions
   */
  static updateProgress(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return { newAchievements: [] };

    let streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    if (!streak) {
      // Create streak record
      const { v4: uuidv4 } = require('uuid');
      db.prepare(`
        INSERT INTO streaks (id, user_id, current_streak, longest_streak)
        VALUES (?, ?, 0, 0)
      `).run(uuidv4(), userId);
      streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    }

    const allAchievements = this.getAllAchievements();
    const userAchievements = db.prepare('SELECT * FROM user_achievements WHERE user_id = ?').all(userId);
    const earnedIds = new Set(userAchievements.filter(ua => ua.completed).map(ua => ua.achievement_id));

    const newAchievements = [];
    const upsertProgress = db.prepare(`
      INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, achievement_id) DO UPDATE SET progress = excluded.progress
    `);

    const updateUserCredits = db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?');

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      const progress = this.calculateProgress(user, streak, achievement);
      const isCompleted = progress >= achievement.threshold;

      // Update progress
      const existing = userAchievements.find(ua => ua.achievement_id === achievement.id);
      if (!existing) {
        upsertProgress.run(uuidv4(), userId, achievement.id, progress, isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null);
      } else if (!existing.completed && isCompleted) {
        // Mark as completed and award credits
        db.prepare('UPDATE user_achievements SET completed = 1, completed_at = ?, progress = ? WHERE id = ?')
          .run(new Date().toISOString(), achievement.threshold, existing.id);
        
        if (achievement.reward_credits > 0) {
          updateUserCredits.run(achievement.reward_credits, userId);
        }

        newAchievements.push({
          ...achievement,
          creditsAwarded: achievement.reward_credits
        });
      } else {
        db.prepare('UPDATE user_achievements SET progress = ? WHERE id = ?').run(progress, existing.id);
      }
    }

    return { newAchievements };
  }

  /**
   * Get achievement stats summary
   */
  static getStats(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    const earned = db.prepare(`
      SELECT COUNT(*) as count FROM user_achievements 
      WHERE user_id = ? AND completed = 1
    `).get(userId);

    const totalAchievements = db.prepare('SELECT COUNT(*) as count FROM achievements').get();

    return {
      totalEarned: earned.count,
      totalAvailable: totalAchievements.count,
      credits: user.credits,
      rarities: {
        common: this.countByRarity(userId, 'common'),
        rare: this.countByRarity(userId, 'rare'),
        epic: this.countByRarity(userId, 'epic'),
        legendary: this.countByRarity(userId, 'legendary')
      }
    };
  }

  static countByRarity(userId, rarity) {
    return db.prepare(`
      SELECT COUNT(*) as count FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ? AND ua.completed = 1 AND a.rarity = ?
    `).get(userId, rarity).count;
  }
}

module.exports = AchievementService;
