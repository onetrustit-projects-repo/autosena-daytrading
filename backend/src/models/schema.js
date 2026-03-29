const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/leaderboard.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    total_profit REAL DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    profit_loss REAL,
    opened_at DATETIME NOT NULL,
    closed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    profit_loss REAL NOT NULL,
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    portfolio_value REAL NOT NULL,
    peak_value REAL NOT NULL,
    trough_value REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    threshold REAL NOT NULL,
    reward_credits INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common'
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    progress REAL DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
  );

  CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_profitable_date TEXT,
    streak_start_date TEXT,
    weekly_streak INTEGER DEFAULT 0,
    monthly_streak INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    period TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    rank INTEGER NOT NULL,
    profit_loss REAL NOT NULL,
    sharpe_ratio REAL,
    sortino_ratio REAL,
    max_drawdown REAL,
    win_rate REAL,
    score REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    claimed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS followers (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, opened_at);
  CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard_snapshots(period, rank);
  CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
`);

// Seed default achievements
const seedAchievements = db.prepare(`
  INSERT OR IGNORE INTO achievements (id, code, name, description, category, icon, threshold, reward_credits, rarity) VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const achievements = [
  // Profit milestones
  ['ach_profit_100', 'PROFIT_100', 'First Hundred', 'Earn $100 in total profit', 'profit', '💵', 100, 10, 'common'],
  ['ach_profit_500', 'PROFIT_500', 'Half K', 'Earn $500 in total profit', 'profit', '💰', 500, 25, 'common'],
  ['ach_profit_1k', 'PROFIT_1K', 'Grand Profit', 'Earn $1,000 in total profit', 'profit', '💎', 1000, 50, 'rare'],
  ['ach_profit_5k', 'PROFIT_5K', 'Big Player', 'Earn $5,000 in total profit', 'profit', '🏆', 5000, 150, 'epic'],
  ['ach_profit_10k', 'PROFIT_10K', 'Diamond Hands', 'Earn $10,000 in total profit', 'profit', '👑', 10000, 500, 'legendary'],
  
  // Streak achievements
  ['ach_streak_3', 'STREAK_3', 'Hot Streak', '3 consecutive profitable days', 'streak', '🔥', 3, 15, 'common'],
  ['ach_streak_5', 'STREAK_5', 'On Fire', '5 consecutive profitable days', 'streak', '🔥', 5, 40, 'rare'],
  ['ach_streak_10', 'STREAK_10', 'Unstoppable', '10 consecutive profitable days', 'streak', '⚡', 10, 100, 'epic'],
  ['ach_streak_25', 'STREAK_25', 'Legend', '25 consecutive profitable days', 'streak', '🌟', 25, 300, 'legendary'],
  
  // Trade count achievements
  ['ach_trades_100', 'TRADES_100', 'Active Trader', 'Complete 100 trades', 'consistency', '📊', 100, 30, 'common'],
  ['ach_trades_500', 'TRADES_500', 'Trading Machine', 'Complete 500 trades', 'consistency', '🤖', 500, 100, 'rare'],
  ['ach_trades_1k', 'TRADES_1K', 'Market Veteran', 'Complete 1,000 trades', 'consistency', '🎖️', 1000, 250, 'epic'],
  
  // Win rate achievements
  ['ach_winrate_60', 'WINRATE_60', 'Winning Edge', 'Maintain 60% win rate', 'skill', '🎯', 60, 50, 'rare'],
  ['ach_winrate_70', 'WINRATE_70', 'Sharp Shooter', 'Maintain 70% win rate', 'skill', '🏅', 70, 150, 'epic'],
  ['ach_winrate_80', 'WINRATE_80', 'Master Trader', 'Maintain 80% win rate', 'skill', '🏆', 80, 400, 'legendary'],
  
  // Social achievements
  ['ach_followers_10', 'FOLLOWERS_10', 'Rising Star', 'Get 10 followers', 'social', '👥', 10, 20, 'common'],
  ['ach_followers_50', 'FOLLOWERS_50', 'Popular', 'Get 50 followers', 'social', '⭐', 50, 75, 'rare'],
  ['ach_followers_100', 'FOLLOWERS_100', 'Influencer', 'Get 100 followers', 'social', '🌟', 100, 200, 'epic'],
  
  // Risk management
  ['ach_drawdown_5', 'DRAWDOWN_5', 'Risk Averse', 'Maintain <5% drawdown for 30 days', 'risk', '🛡️', 5, 100, 'rare'],
];

achievements.forEach(a => seedAchievements.run(...a));

module.exports = db;
