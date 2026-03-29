/**
 * Seed script to populate demo data
 * Run: node src/seed.js
 */

const db = require('./models/schema');
const { v4: uuidv4 } = require('uuid');

// Clear existing data
db.exec(`
  DELETE FROM followers;
  DELETE FROM rewards;
  DELETE FROM leaderboard_snapshots;
  DELETE FROM user_achievements;
  DELETE FROM streaks;
  DELETE FROM achievements;
  DELETE FROM daily_stats;
  DELETE FROM trades;
  DELETE FROM users;
`);

console.log('Cleared existing data...');

// Create demo users
const users = [
  { id: 'user_demo_123', username: 'DemoTrader', displayName: 'Demo Trader', avatarUrl: null },
  { id: 'user_1', username: 'TraderJoe', displayName: 'Trader Joe', avatarUrl: null },
  { id: 'user_2', username: 'DiamondHands', displayName: 'Diamond Hands', avatarUrl: null },
  { id: 'user_3', username: 'CryptoQueen', displayName: 'Crypto Queen', avatarUrl: null },
  { id: 'user_4', username: 'MoonWalker', displayName: 'Moon Walker', avatarUrl: null },
  { id: 'user_5', username: 'BullRunner', displayName: 'Bull Runner', avatarUrl: null },
  { id: 'user_6', username: 'TradeMaster', displayName: 'Trade Master', avatarUrl: null },
  { id: 'user_7', username: 'WallStWiz', displayName: 'Wall St Wizard', avatarUrl: null },
  { id: 'user_8', username: 'PipHunter', displayName: 'Pip Hunter', avatarUrl: null },
  { id: 'user_9', username: 'ScalpKing', displayName: 'Scalp King', avatarUrl: null },
  { id: 'user_10', username: 'DayTraderPro', displayName: 'Day Trader Pro', avatarUrl: null },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, username, display_name, avatar_url, total_profit, total_trades, winning_trades, losing_trades, followers_count, credits)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertStreak = db.prepare(`
  INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_profitable_date)
  VALUES (?, ?, ?, ?, ?)
`);

// User stats
const userStats = [
  { profit: 547.32, trades: 100, wins: 63, losses: 37, followers: 10, credits: 1250 },
  { profit: 4520.50, trades: 156, wins: 122, losses: 34, followers: 89 },
  { profit: 3890.25, trades: 203, wins: 150, losses: 53, followers: 67 },
  { profit: 3150.75, trades: 89, wins: 63, losses: 26, followers: 45 },
  { profit: 2890.00, trades: 134, wins: 92, losses: 42, followers: 34 },
  { profit: 2340.50, trades: 178, wins: 117, losses: 61, followers: 28 },
  { profit: 1980.25, trades: 211, wins: 135, losses: 76, followers: 22 },
  { profit: 1650.75, trades: 95, wins: 59, losses: 36, followers: 19 },
  { profit: 1420.00, trades: 167, wins: 100, losses: 67, followers: 15 },
  { profit: 1180.50, trades: 289, wins: 168, losses: 121, followers: 12 },
  { profit: 890.25, trades: 312, wins: 175, losses: 137, followers: 8 },
];

users.forEach((user, idx) => {
  const stats = userStats[idx];
  insertUser.run(
    user.id, 
    user.username, 
    user.displayName, 
    user.avatarUrl,
    stats.profit,
    stats.trades,
    stats.wins,
    stats.losses,
    stats.followers,
    stats.credits || 0
  );
  
  // Create streak
  const streakDays = Math.floor(Math.random() * 10);
  insertStreak.run(
    uuidv4(),
    user.id,
    streakDays,
    Math.max(streakDays, Math.floor(Math.random() * 15)),
    streakDays > 0 ? new Date().toISOString().split('T')[0] : null
  );
});

console.log(`Created ${users.length} users with streaks`);

// Generate daily stats for last 30 days
const insertDailyStats = db.prepare(`
  INSERT INTO daily_stats (id, user_id, date, profit_loss, trades_count, winning_trades, losing_trades, portfolio_value, peak_value, trough_value)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date();
users.forEach((user, userIdx) => {
  let portfolioValue = 10000 + Math.random() * 5000;
  let peakValue = portfolioValue;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dailyReturn = (Math.random() - 0.45) * 0.05; // Slight positive bias
    const profitLoss = portfolioValue * dailyReturn;
    
    const tradesCount = Math.floor(Math.random() * 10) + 3;
    const winRate = 0.5 + Math.random() * 0.3;
    const winningTrades = Math.floor(tradesCount * winRate);
    const losingTrades = tradesCount - winningTrades;
    
    portfolioValue += profitLoss;
    if (portfolioValue > peakValue) peakValue = portfolioValue;
    
    insertDailyStats.run(
      uuidv4(),
      user.id,
      dateStr,
      profitLoss,
      tradesCount,
      winningTrades,
      losingTrades,
      portfolioValue,
      peakValue,
      Math.min(portfolioValue, peakValue * 0.95)
    );
  }
});

console.log('Generated 30 days of daily stats for all users');

// Seed achievements
const seedAchievements = db.prepare(`
  INSERT OR IGNORE INTO achievements (id, code, name, description, category, icon, threshold, reward_credits, rarity) VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const achievements = [
  ['ach_profit_100', 'PROFIT_100', 'First Hundred', 'Earn $100 in total profit', 'profit', '💵', 100, 10, 'common'],
  ['ach_profit_500', 'PROFIT_500', 'Half K', 'Earn $500 in total profit', 'profit', '💰', 500, 25, 'common'],
  ['ach_profit_1k', 'PROFIT_1K', 'Grand Profit', 'Earn $1,000 in total profit', 'profit', '💎', 1000, 50, 'rare'],
  ['ach_profit_5k', 'PROFIT_5K', 'Big Player', 'Earn $5,000 in total profit', 'profit', '🏆', 5000, 150, 'epic'],
  ['ach_profit_10k', 'PROFIT_10K', 'Diamond Hands', 'Earn $10,000 in total profit', 'profit', '👑', 10000, 500, 'legendary'],
  ['ach_streak_3', 'STREAK_3', 'Hot Streak', '3 consecutive profitable days', 'streak', '🔥', 3, 15, 'common'],
  ['ach_streak_5', 'STREAK_5', 'On Fire', '5 consecutive profitable days', 'streak', '🔥', 5, 40, 'rare'],
  ['ach_streak_10', 'STREAK_10', 'Unstoppable', '10 consecutive profitable days', 'streak', '⚡', 10, 100, 'epic'],
  ['ach_streak_25', 'STREAK_25', 'Legend', '25 consecutive profitable days', 'streak', '🌟', 25, 300, 'legendary'],
  ['ach_trades_100', 'TRADES_100', 'Active Trader', 'Complete 100 trades', 'consistency', '📊', 100, 30, 'common'],
  ['ach_trades_500', 'TRADES_500', 'Trading Machine', 'Complete 500 trades', 'consistency', '🤖', 500, 100, 'rare'],
  ['ach_trades_1k', 'TRADES_1K', 'Market Veteran', 'Complete 1,000 trades', 'consistency', '🎖️', 1000, 250, 'epic'],
  ['ach_winrate_60', 'WINRATE_60', 'Winning Edge', 'Maintain 60% win rate', 'skill', '🎯', 60, 50, 'rare'],
  ['ach_winrate_70', 'WINRATE_70', 'Sharp Shooter', 'Maintain 70% win rate', 'skill', '🏅', 70, 150, 'epic'],
  ['ach_winrate_80', 'WINRATE_80', 'Master Trader', 'Maintain 80% win rate', 'skill', '🏆', 80, 400, 'legendary'],
  ['ach_followers_10', 'FOLLOWERS_10', 'Rising Star', 'Get 10 followers', 'social', '👥', 10, 20, 'common'],
  ['ach_followers_50', 'FOLLOWERS_50', 'Popular', 'Get 50 followers', 'social', '⭐', 50, 75, 'rare'],
  ['ach_followers_100', 'FOLLOWERS_100', 'Influencer', 'Get 100 followers', 'social', '🌟', 100, 200, 'epic'],
  ['ach_drawdown_5', 'DRAWDOWN_5', 'Risk Averse', 'Maintain <5% drawdown for 30 days', 'risk', '🛡️', 5, 100, 'rare'],
];

achievements.forEach(a => seedAchievements.run(...a));
console.log('Seeded achievements');

// Give demo user some achievements
const demoAchievements = ['ach_profit_100', 'ach_streak_3', 'ach_trades_100', 'ach_profit_500', 'ach_followers_10'];
const insertUserAchievement = db.prepare(`
  INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed, completed_at)
  VALUES (?, ?, ?, 1, 1, ?)
`);

const completedDate = new Date().toISOString();
demoAchievements.forEach(achId => {
  insertUserAchievement.run(uuidv4(), 'user_demo_123', achId, completedDate);
});

console.log('Added achievements to demo user');
console.log('\n✅ Seed complete!');
console.log('Demo user: user_demo_123 with 1,250 credits');
