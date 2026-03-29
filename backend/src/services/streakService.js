const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class StreakService {
  /**
   * Get user's streak data
   */
  static getUserStreak(userId) {
    let streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    
    if (!streak) {
      // Create new streak record
      db.prepare(`
        INSERT INTO streaks (id, user_id, current_streak, longest_streak)
        VALUES (?, ?, 0, 0)
      `).run(uuidv4(), userId);
      
      streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    }

    // Get recent daily stats for streak validation
    const today = new Date().toISOString().split('T')[0];
    const last30Days = db.prepare(`
      SELECT date, profit_loss FROM daily_stats
      WHERE user_id = ? AND date >= date(?, '-30 days')
      ORDER BY date DESC
    `).all(userId, today);

    // Calculate if streak is still active (last profitable day was yesterday or today)
    let isActive = false;
    if (streak.last_profitable_date) {
      const lastProfitable = new Date(streak.last_profitable_date);
      const now = new Date();
      const diffDays = Math.floor((now - lastProfitable) / (1000 * 60 * 60 * 24));
      isActive = diffDays <= 1;
    }

    // If streak is inactive, reset current streak
    if (!isActive && streak.current_streak > 0) {
      streak.current_streak = 0;
      db.prepare('UPDATE streaks SET current_streak = 0 WHERE user_id = ?').run(userId);
    }

    // Build calendar data (last 30 days)
    const calendar = last30Days.map(day => ({
      date: day.date,
      profitable: day.profit_loss > 0
    }));

    return {
      ...streak,
      isActive,
      calendar,
      recentProfitDays: last30Days.filter(d => d.profit_loss > 0).length
    };
  }

  /**
   * Update streak based on daily performance
   */
  static updateStreak(userId, date, profitLoss) {
    let streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    
    if (!streak) {
      db.prepare(`
        INSERT INTO streaks (id, user_id, current_streak, longest_streak)
        VALUES (?, ?, 0, 0)
      `).run(uuidv4(), userId);
      streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    }

    const isProfitable = profitLoss > 0;
    const today = date || new Date().toISOString().split('T')[0];

    // Check if we already processed today
    if (streak.last_profitable_date === today) {
      return streak; // Already updated today
    }

    if (isProfitable) {
      // Increment streak
      const newStreak = streak.current_streak + 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak);
      
      db.prepare(`
        UPDATE streaks 
        SET current_streak = ?,
            longest_streak = ?,
            last_profitable_date = ?,
            streak_start_date = COALESCE(?, ?)
        WHERE user_id = ?
      `).run(
        newStreak,
        longestStreak,
        today,
        streak.streak_start_date || today,
        today,
        userId
      );
    } else {
      // Reset streak (consecutive loss)
      db.prepare(`
        UPDATE streaks 
        SET current_streak = 0
        WHERE user_id = ?
      `).run(userId);
    }

    return this.getUserStreak(userId);
  }

  /**
   * Get streak milestones
   */
  static getMilestones() {
    return [
      { days: 3, name: 'Hot Streak', icon: '🔥', reward: 15 },
      { days: 5, name: 'On Fire', icon: '🔥', reward: 40 },
      { days: 10, name: 'Unstoppable', icon: '⚡', reward: 100 },
      { days: 25, name: 'Legend', icon: '🌟', reward: 300 },
      { days: 50, name: 'Immortal', icon: '👑', reward: 500 },
      { days: 100, name: 'God of Trading', icon: '🎭', reward: 1000 }
    ];
  }

  /**
   * Check if user hit a new milestone
   */
  static checkMilestone(streak) {
    const milestones = this.getMilestones();
    return milestones.filter(m => streak.current_streak >= m.days);
  }
}

module.exports = StreakService;
