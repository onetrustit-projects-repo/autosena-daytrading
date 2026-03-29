const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/journal.db'));

// Enable WAL mode
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    stop_loss REAL,
    take_profit REAL,
    profit_loss REAL,
    commission REAL DEFAULT 0,
    strategy TEXT,
    notes TEXT,
    session_id TEXT,
    opened_at DATETIME NOT NULL,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS market_context (
    id TEXT PRIMARY KEY,
    trade_id TEXT,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    volatility_index REAL,
    market_phase TEXT,
    news_events TEXT,
    sector_performance REAL,
    correlation_index REAL,
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );

  CREATE TABLE IF NOT EXISTS sentiment_data (
    id TEXT PRIMARY KEY,
    trade_id TEXT,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    news_headlines TEXT,
    social_sentiment REAL,
    analyst_rating TEXT,
    institutional_activity TEXT,
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );

  CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trade_id TEXT,
    insight_type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence REAL,
    recommendations TEXT,
    severity TEXT DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );

  CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    description TEXT NOT NULL,
    occurrences INTEGER DEFAULT 1,
    avg_profit REAL,
    win_rate REAL,
    last_occurred TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trading_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    total_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    net_profit REAL DEFAULT 0,
    pre_session_mood TEXT,
    post_session_mood TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS execution_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trade_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
  CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
  CREATE INDEX IF NOT EXISTS idx_trades_opened ON trades(opened_at);
  CREATE INDEX IF NOT EXISTS idx_insights_user ON ai_insights(user_id);
  CREATE INDEX IF NOT EXISTS idx_patterns_user ON patterns(user_id);
`);

module.exports = db;
