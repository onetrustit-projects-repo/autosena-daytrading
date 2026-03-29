const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/sentiment.db'));

// Enable WAL mode
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT,
    sector TEXT,
    watchlist BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sentiment_data (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    author TEXT,
    content TEXT NOT NULL,
    sentiment_score REAL,
    sentiment_label TEXT,
    engagement INTEGER DEFAULT 0,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (symbol) REFERENCES symbols(symbol)
  );

  CREATE TABLE IF NOT EXISTS aggregated_sentiment (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    period TEXT NOT NULL,
    avg_sentiment REAL,
    positive_pct REAL,
    negative_pct REAL,
    neutral_pct REAL,
    volume INTEGER,
    weighted_score REAL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, period)
  );

  CREATE TABLE IF NOT EXISTS trading_signals (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    strength REAL NOT NULL,
    sources TEXT NOT NULL,
    description TEXT,
    price_at_signal REAL,
    sentiment_snapshot REAL,
    expires_at DATETIME,
    executed BOOLEAN DEFAULT 0,
    executed_at DATETIME,
    profit_loss REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (symbol) REFERENCES symbols(symbol)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    condition TEXT NOT NULL,
    threshold REAL NOT NULL,
    current_value REAL,
    triggered BOOLEAN DEFAULT 0,
    triggered_at DATETIME,
    notification_sent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS alert_history (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL,
    threshold REAL,
    value_at_trigger REAL,
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS news_events (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    headline TEXT NOT NULL,
    source TEXT,
    url TEXT,
    sentiment_score REAL,
    importance TEXT DEFAULT 'medium',
    published_at DATETIME,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sentiment_thresholds (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    bullish_threshold REAL DEFAULT 0.6,
    bearish_threshold REAL DEFAULT -0.6,
    volume_multiplier REAL DEFAULT 2.0,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_sentiment_symbol ON sentiment_data(symbol);
  CREATE INDEX IF NOT EXISTS idx_sentiment_collected ON sentiment_data(collected_at);
  CREATE INDEX IF NOT EXISTS idx_signals_symbol ON trading_signals(symbol);
  CREATE INDEX IF NOT EXISTS idx_signals_created ON trading_signals(created_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
`);

// Seed default symbols
const seedSymbols = db.prepare(`
  INSERT OR IGNORE INTO symbols (id, symbol, name, sector) VALUES (?, ?, ?, ?)
`);
const symbols = [
  ['sym_aapl', 'AAPL', 'Apple Inc.', 'Technology'],
  ['sym_googl', 'GOOGL', 'Alphabet Inc.', 'Technology'],
  ['sym_msft', 'MSFT', 'Microsoft Corp.', 'Technology'],
  ['sym_tsla', 'TSLA', 'Tesla Inc.', 'Automotive'],
  ['sym_amzn', 'AMZN', 'Amazon.com Inc.', 'Consumer'],
  ['sym_nvda', 'NVDA', 'NVIDIA Corp.', 'Technology'],
  ['sym_meta', 'META', 'Meta Platforms', 'Technology'],
  ['sym_sppy', 'SPY', 'S&P 500 ETF', 'Index'],
];

symbols.forEach(s => seedSymbols.run(...s));

module.exports = db;
