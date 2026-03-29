const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class LeaderboardEngine {
  /**
   * Calculate risk-adjusted score combining multiple metrics
   * Higher is better - combines profitability with risk management
   */
  static calculateScore(stats) {
    const {
      profitLoss = 0,
      sharpeRatio = 0,
      sortinoRatio = 0,
      maxDrawdown = 0,
      winRate = 0,
      totalTrades = 0
    } = stats;

    // Base score from profit
    const profitScore = Math.sign(profitLoss) * Math.log1p(Math.abs(profitLoss)) * 10;

    // Risk-adjusted metrics (higher is better, capped)
    const riskScore = (Math.min(sharpeRatio, 3) * 20) + 
                      (Math.min(sortinoRatio, 3) * 15) +
                      ((100 - Math.min(maxDrawdown, 50)) * 0.5);

    // Consistency bonus (more trades with good performance)
    const consistencyBonus = totalTrades > 50 ? Math.min(totalTrades / 10, 50) : 0;

    // Win rate contribution
    const winRateScore = (winRate - 50) * 0.8;

    return profitScore + riskScore + consistencyBonus + winRateScore;
  }

  /**
   * Calculate Sharpe Ratio
   * (Mean Return - Risk Free Rate) / Std Dev of Returns
   */
  static calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (!returns || returns.length < 2) return 0;
    
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    return (meanReturn - riskFreeRate / 365) / stdDev;
  }

  /**
   * Calculate Sortino Ratio
   * (Mean Return - Target) / Downside Deviation
   */
  static calculateSortinoRatio(returns, targetReturn = 0) {
    if (!returns || returns.length < 2) return 0;
    
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < targetReturn);
    
    if (downsideReturns.length === 0) return meanReturn > 0 ? 100 : 0;
    
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / returns.length;
    const downsideDev = Math.sqrt(downsideVariance);
    
    if (downsideDev === 0) return meanReturn > 0 ? 100 : 0;
    return (meanReturn - targetReturn) / downsideDev;
  }

  /**
   * Calculate Maximum Drawdown as percentage
   */
  static calculateMaxDrawdown(values) {
    if (!values || values.length < 2) return 0;
    
    let peak = values[0];
    let maxDD = 0;
    
    for (const value of values) {
      if (value > peak) peak = value;
      const dd = ((peak - value) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    
    return maxDD;
  }

  /**
   * Get period dates
   */
  static getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Calculate user stats for a period
   */
  static calculateUserStats(userId, period) {
    const { start, end } = this.getPeriodDates(period);
    
    // Get daily stats for the period
    const dailyStats = db.prepare(`
      SELECT * FROM daily_stats 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).all(userId, start, end);

    if (dailyStats.length === 0) {
      return {
        profitLoss: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        values: []
      };
    }

    const returns = dailyStats.map(d => d.profit_loss);
    const values = dailyStats.map(d => d.portfolio_value);
    
    const totalTrades = dailyStats.reduce((sum, d) => sum + d.trades_count, 0);
    const winningTrades = dailyStats.reduce((sum, d) => sum + d.winning_trades, 0);
    const losingTrades = dailyStats.reduce((sum, d) => sum + d.losing_trades, 0);
    const profitLoss = dailyStats.reduce((sum, d) => sum + d.profit_loss, 0);
    
    return {
      profitLoss,
      sharpeRatio: this.calculateSharpeRatio(returns),
      sortinoRatio: this.calculateSortinoRatio(returns),
      maxDrawdown: this.calculateMaxDrawdown(values),
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      totalTrades,
      winningTrades,
      losingTrades,
      values
    };
  }

  /**
   * Get leaderboard for a period
   */
  static getLeaderboard(period = 'daily', limit = 100) {
    const { start, end } = this.getPeriodDates(period);
    
    // Get all users with their stats
    const users = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.credits,
             u.total_profit, u.total_trades, u.winning_trades, u.losing_trades, u.followers_count
      FROM users u
      WHERE u.total_trades > 0
    `).all();

    const leaderboard = users.map(user => {
      const stats = this.calculateUserStats(user.id, period);
      const score = this.calculateScore({
        profitLoss: stats.profitLoss,
        sharpeRatio: stats.sharpeRatio,
        sortinoRatio: stats.sortinoRatio,
        maxDrawdown: stats.maxDrawdown,
        winRate: stats.winRate,
        totalTrades: stats.totalTrades
      });

      return {
        rank: 0, // Will be set after sorting
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        profitLoss: stats.profitLoss,
        sharpeRatio: stats.sharpeRatio,
        sortinoRatio: stats.sortinoRatio,
        maxDrawdown: stats.maxDrawdown,
        winRate: stats.winRate,
        totalTrades: stats.totalTrades,
        score
      };
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard.slice(0, limit);
  }

  /**
   * Get user rank and detailed stats
   */
  static getUserRank(userId, period = 'daily') {
    const leaderboard = this.getLeaderboard(period);
    const userEntry = leaderboard.find(e => e.userId === userId);
    
    if (!userEntry) {
      // User not in leaderboard yet
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) return null;
      
      return {
        rank: null,
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        profitLoss: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: user.total_trades,
        score: 0,
        isNew: true
      };
    }

    return userEntry;
  }

  /**
   * Save leaderboard snapshot for historical records
   */
  static saveSnapshot(period = 'daily') {
    const leaderboard = this.getLeaderboard(period);
    const { start, end } = this.getPeriodDates(period);
    
    const insert = db.prepare(`
      INSERT INTO leaderboard_snapshots 
      (id, user_id, period, period_start, period_end, rank, profit_loss, sharpe_ratio, sortino_ratio, max_drawdown, win_rate, score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const saveAll = db.transaction(() => {
      // Clear old snapshots for this period
      db.prepare('DELETE FROM leaderboard_snapshots WHERE period = ? AND period_start = ? AND period_end = ?')
        .run(period, start, end);
      
      // Insert new snapshots
      for (const entry of leaderboard) {
        insert.run(
          uuidv4(),
          entry.userId,
          period,
          start,
          end,
          entry.rank,
          entry.profitLoss,
          entry.sharpeRatio,
          entry.sortinoRatio,
          entry.maxDrawdown,
          entry.winRate,
          entry.score
        );
      }
    });

    saveAll();
    return { period, start, end, entries: leaderboard.length };
  }
}

module.exports = LeaderboardEngine;
