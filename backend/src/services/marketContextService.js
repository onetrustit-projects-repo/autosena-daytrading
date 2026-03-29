const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class MarketContextService {
  /**
   * Add market context to a trade
   */
  static addMarketContext(tradeId, contextData) {
    const {
      symbol,
      date,
      volatilityIndex,
      marketPhase,
      newsEvents,
      sectorPerformance,
      correlationIndex
    } = contextData;

    const id = uuidv4();

    db.prepare(`
      INSERT INTO market_context (id, trade_id, symbol, date, volatility_index, market_phase, news_events, sector_performance, correlation_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tradeId,
      symbol,
      date || new Date().toISOString().split('T')[0],
      volatilityIndex || null,
      marketPhase || null,
      JSON.stringify(newsEvents || []),
      sectorPerformance || null,
      correlationIndex || null
    );

    return this.getMarketContext(id);
  }

  /**
   * Get market context by ID
   */
  static getMarketContext(id) {
    return db.prepare('SELECT * FROM market_context WHERE id = ?').get(id);
  }

  /**
   * Get market context for a trade
   */
  static getTradeMarketContext(tradeId) {
    const context = db.prepare('SELECT * FROM market_context WHERE trade_id = ?').get(tradeId);
    if (context && context.news_events) {
      context.news_events = JSON.parse(context.news_events);
    }
    return context;
  }

  /**
   * Get market context for user's trades
   */
  static getUserMarketContext(userId, startDate = null, endDate = null) {
    let query = `
      SELECT mc.*, t.symbol, t.type, t.profit_loss, t.opened_at
      FROM market_context mc
      JOIN trades t ON mc.trade_id = t.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (startDate) {
      query += ' AND t.opened_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.opened_at <= ?';
      params.push(endDate);
    }

    const results = db.prepare(query).all(...params);
    return results.map(r => ({
      ...r,
      news_events: r.news_events ? JSON.parse(r.news_events) : []
    }));
  }

  /**
   * Analyze market conditions for a symbol
   */
  static analyzeMarketConditions(symbol, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get historical trades for context
    const recentTrades = db.prepare(`
      SELECT * FROM trades 
      WHERE symbol = ? AND DATE(opened_at) <= ?
      ORDER BY opened_at DESC LIMIT 20
    `).all(symbol, targetDate);

    // Calculate average volatility based on price ranges
    let avgVolatility = 0;
    if (recentTrades.length > 1) {
      const priceRanges = recentTrades.map(t => {
        if (t.exit_price && t.entry_price) {
          return Math.abs(t.exit_price - t.entry_price) / t.entry_price;
        }
        return 0;
      });
      avgVolatility = (priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length) * 100;
    }

    // Determine market phase
    const marketPhase = this.determineMarketPhase(avgVolatility);

    // Get sector performance (mock for now - would integrate with real data)
    const sectorPerformance = this.getSectorPerformance(symbol);

    return {
      symbol,
      date: targetDate,
      volatilityIndex: avgVolatility,
      marketPhase,
      sectorPerformance,
      recentTradeCount: recentTrades.length,
      avgTradeSize: recentTrades.length > 0 
        ? recentTrades.reduce((sum, t) => sum + t.quantity, 0) / recentTrades.length 
        : 0
    };
  }

  /**
   * Determine market phase based on volatility
   */
  static determineMarketPhase(volatility) {
    if (volatility < 0.5) return 'LOW_VOLATILITY';
    if (volatility < 1.5) return 'NORMAL';
    if (volatility < 3.0) return 'HIGH_VOLATILITY';
    return 'EXTREME_VOLATILITY';
  }

  /**
   * Get sector performance (mock implementation)
   */
  static getSectorPerformance(symbol) {
    // In production, this would integrate with market data API
    // For now, return random performance based on symbol
    const sectorMap = {
      'AAPL': 1.2, 'GOOGL': -0.8, 'MSFT': 0.5, 'TSLA': 2.3, 'AMZN': -1.1
    };
    return sectorMap[symbol] || (Math.random() * 4 - 2); // -2% to +2%
  }

  /**
   * Get correlation with major indices
   */
  static calculateCorrelation(symbol, majorIndex = 'SPY') {
    // In production, this would calculate real correlation
    // For now, return a mock correlation coefficient
    return Math.random() * 0.6 + 0.2; // 0.2 to 0.8
  }

  /**
   * Get market context summary
   */
  static getContextSummary(userId, period = '7d') {
    let startDate;
    const now = new Date();

    switch (period) {
      case '1d': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    const context = this.getUserMarketContext(
      userId,
      startDate.toISOString(),
      now.toISOString()
    );

    if (context.length === 0) {
      return {
        period,
        totalTrades: 0,
        dominantPhase: 'NORMAL',
        avgVolatility: 0,
        dominantSentiment: 'NEUTRAL'
      };
    }

    // Aggregate by phase
    const phaseCounts = context.reduce((acc, c) => {
      acc[c.market_phase] = (acc[c.market_phase] || 0) + 1;
      return acc;
    }, {});

    const dominantPhase = Object.entries(phaseCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'NORMAL';

    const avgVolatility = context.reduce((sum, c) => sum + (c.volatility_index || 0), 0) / context.length;

    // Calculate avg sentiment from news events
    const allNews = context.flatMap(c => c.news_events || []);
    const dominantSentiment = allNews.length > 0 ? 'NEUTRAL' : 'NO_DATA';

    return {
      period,
      totalTrades: context.length,
      dominantPhase,
      avgVolatility: avgVolatility.toFixed(2),
      dominantSentiment,
      phaseDistribution: phaseCounts
    };
  }
}

module.exports = MarketContextService;
