const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');
const SentimentAnalysisService = require('./sentimentAnalysisService');

class SignalGenerationService {
  /**
   * Generate trading signal based on sentiment
   */
  static generateSignal(symbol, sentimentData, priceAtSignal) {
    const { weighted_score, label, volume } = sentimentData;
    
    // Determine signal type and direction
    let signalType = 'SENTIMENT';
    let direction = null;
    let strength = 0;
    let description = '';

    if (label === 'BULLISH' && weighted_score >= 0.3) {
      direction = 'BUY';
      strength = this.calculateStrength(weighted_score, volume);
      description = `Bullish sentiment detected with ${(weighted_score * 100).toFixed(0)}% score`;
    } else if (label === 'BEARISH' && weighted_score <= -0.3) {
      direction = 'SELL';
      strength = this.calculateStrength(Math.abs(weighted_score), volume);
      description = `Bearish sentiment detected with ${(Math.abs(weighted_score) * 100).toFixed(0)}% score`;
    } else {
      return null; // No signal in neutral zone
    }

    // Calculate signal expiry (sentiment signals decay over time)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + Math.max(15, Math.round(60 * (1 - strength))));

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO trading_signals (id, symbol, signal_type, direction, strength, sources, description, price_at_signal, sentiment_snapshot, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      symbol,
      signalType,
      direction,
      strength,
      JSON.stringify(['sentiment']),
      description,
      priceAtSignal,
      weighted_score,
      expiresAt.toISOString()
    );

    return this.getSignal(id);
  }

  /**
   * Calculate signal strength (0-1) based on sentiment and volume
   */
  static calculateStrength(sentimentScore, volume) {
    // Base strength from sentiment (0.5-1.0)
    const baseStrength = 0.5 + (Math.abs(sentimentScore) * 0.5);
    
    // Volume multiplier (0.8-1.2 based on volume thresholds)
    const volumeMultiplier = Math.min(1.2, Math.max(0.8, Math.log10(volume + 1) / 5));
    
    return Math.min(1, baseStrength * volumeMultiplier);
  }

  /**
   * Generate signal from sentiment shift
   */
  static generateShiftSignal(shiftData, priceAtSignal) {
    if (!shiftData.isSignificant) return null;

    const { symbol, current, shift, direction } = shiftData;
    
    const strength = Math.min(1, Math.abs(shift) * 2);
    const directionMap = {
      'POSITIVE_SHIFT': 'BUY',
      'NEGATIVE_SHIFT': 'SELL'
    };

    const id = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    db.prepare(`
      INSERT INTO trading_signals (id, symbol, signal_type, direction, strength, sources, description, price_at_signal, sentiment_snapshot, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      symbol,
      'SENTIMENT_SHIFT',
      directionMap[direction] || 'BUY',
      strength,
      JSON.stringify(['sentiment']),
      `Sentiment ${direction.toLowerCase().replace('_', ' ')} detected: ${(Math.abs(shift) * 100).toFixed(0)}% change`,
      priceAtSignal,
      current.avg_sentiment,
      expiresAt.toISOString()
    );

    return this.getSignal(id);
  }

  /**
   * Get signal by ID
   */
  static getSignal(signalId) {
    const signal = db.prepare('SELECT * FROM trading_signals WHERE id = ?').get(signalId);
    if (signal) {
      signal.sources = JSON.parse(signal.sources);
    }
    return signal;
  }

  /**
   * Get active signals for a symbol
   */
  static getActiveSignals(symbol = null, limit = 20) {
    let query = `
      SELECT * FROM trading_signals 
      WHERE executed = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
    `;
    const params = [];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const signals = db.prepare(query).all(...params);
    return signals.map(s => ({ ...s, sources: JSON.parse(s.sources) }));
  }

  /**
   * Get signals history
   */
  static getSignalsHistory(symbol = null, startDate = null, endDate = null, limit = 100) {
    let query = 'SELECT * FROM trading_signals WHERE 1=1';
    const params = [];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const signals = db.prepare(query).all(...params);
    return signals.map(s => ({ ...s, sources: JSON.parse(s.sources) }));
  }

  /**
   * Mark signal as executed
   */
  static executeSignal(signalId, profitLoss = null) {
    db.prepare(`
      UPDATE trading_signals 
      SET executed = 1, executed_at = ?, profit_loss = ?
      WHERE id = ?
    `).run(new Date().toISOString(), profitLoss, signalId);

    return this.getSignal(signalId);
  }

  /**
   * Get signal performance stats
   */
  static getSignalPerformance(symbol = null, days = 30) {
    let whereClause = "WHERE executed = 1 AND created_at >= datetime('now', '-" + days + " days')";
    const params = [];

    if (symbol) {
      whereClause += ' AND symbol = ?';
      params.push(symbol);
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_signals,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_signals,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_signals,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as gross_loss,
        AVG(profit_loss) as avg_profit_loss,
        SUM(profit_loss) as net_profit
      FROM trading_signals ${whereClause}
    `).get(...params);

    const winRate = stats.total_signals > 0 
      ? (stats.winning_signals / stats.total_signals) * 100 
      : 0;

    return {
      ...stats,
      winRate,
      profitFactor: stats.gross_loss > 0 ? stats.gross_profit / stats.gross_loss : 0
    };
  }

  /**
   * Scan for new signals
   */
  static scanForSignals(priceData = {}) {
    const symbols = db.prepare('SELECT symbol FROM symbols WHERE watchlist = 1').all();
    const newSignals = [];

    for (const { symbol } of symbols) {
      // Get current sentiment
      const sentiment = SentimentAnalysisService.getAggregatedSentiment(symbol, '15m');
      
      if (sentiment && sentiment.volume > 5) {
        const price = priceData[symbol] || 100;
        const signal = this.generateSignal(symbol, sentiment, price);
        if (signal) {
          newSignals.push(signal);
        }
      }

      // Check for shifts
      const shift = SentimentAnalysisService.detectSentimentShift(symbol);
      if (shift && shift.isSignificant) {
        const price = priceData[symbol] || 100;
        const signal = this.generateShiftSignal(shift, price);
        if (signal) {
          newSignals.push(signal);
        }
      }
    }

    return newSignals;
  }

  /**
   * Generate composite signal from multiple sources
   */
  static generateCompositeSignal(symbol, sources, priceAtSignal) {
    if (sources.length < 2) return null;

    // Weight sources
    const weights = { sentiment: 0.6, news: 0.3, social: 0.1 };
    let weightedScore = 0;
    let totalWeight = 0;

    for (const source of sources) {
      const weight = weights[source.type] || 0.33;
      weightedScore += (source.score || 0) * weight;
      totalWeight += weight;
    }

    weightedScore /= totalWeight;

    const direction = weightedScore >= 0.25 ? 'BUY' : weightedScore <= -0.25 ? 'SELL' : 'HOLD';
    const strength = this.calculateStrength(Math.abs(weightedScore), sources.reduce((sum, s) => sum + (s.volume || 10), 0));

    if (direction === 'HOLD') return null;

    const id = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    db.prepare(`
      INSERT INTO trading_signals (id, symbol, signal_type, direction, strength, sources, description, price_at_signal, sentiment_snapshot, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      symbol,
      'COMPOSITE',
      direction,
      strength,
      JSON.stringify(sources.map(s => s.type)),
      `Composite signal from ${sources.length} sources`,
      priceAtSignal,
      weightedScore,
      expiresAt.toISOString()
    );

    return this.getSignal(id);
  }
}

module.exports = SignalGenerationService;
