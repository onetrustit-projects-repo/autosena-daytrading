const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class TradeCaptureService {
  /**
   * Capture a new trade from execution log
   */
  static captureTrade(tradeData) {
    const {
      userId,
      symbol,
      type,
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
      strategy,
      notes,
      sessionId,
      openedAt
    } = tradeData;

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO trades (id, user_id, symbol, type, quantity, entry_price, stop_loss, take_profit, strategy, notes, session_id, opened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, symbol, type.toUpperCase(), quantity, entryPrice, stopLoss || null, takeProfit || null, strategy || null, notes || null, sessionId || null, openedAt || new Date().toISOString());

    // Log the capture
    this.logExecution(userId, id, 'TRADE_CAPTURED', { symbol, type, quantity, entryPrice });

    return this.getTrade(id);
  }

  /**
   * Close a trade with exit data
   */
  static closeTrade(tradeId, exitData) {
    const { exitPrice, commission, notes } = exitData;
    
    const trade = this.getTrade(tradeId);
    if (!trade) return null;

    const quantity = trade.quantity;
    const entryPrice = trade.entry_price;
    const type = trade.type;
    
    // Calculate P/L
    let profitLoss;
    if (type === 'LONG') {
      profitLoss = (exitPrice - entryPrice) * quantity - (commission || 0);
    } else {
      profitLoss = (entryPrice - exitPrice) * quantity - (commission || 0);
    }

    db.prepare(`
      UPDATE trades 
      SET exit_price = ?, profit_loss = ?, commission = ?, closed_at = ?, notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(exitPrice, profitLoss, commission || 0, new Date().toISOString(), notes, tradeId);

    // Log the close
    this.logExecution(trade.user_id, tradeId, 'TRADE_CLOSED', { exitPrice, profitLoss });

    // Trigger AI insights generation
    const { AIBrainService } = require('./aiBrainService');
    AIBrainService.generateTradeInsights(trade.user_id, tradeId);

    return this.getTrade(tradeId);
  }

  /**
   * Get trade by ID
   */
  static getTrade(tradeId) {
    return db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
  }

  /**
   * Get user's trades with optional filters
   */
  static getUserTrades(userId, options = {}) {
    const { symbol, type, startDate, endDate, limit = 100, offset = 0 } = options;
    
    let query = 'SELECT * FROM trades WHERE user_id = ?';
    const params = [userId];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type.toUpperCase());
    }
    if (startDate) {
      query += ' AND opened_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND opened_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY opened_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  /**
   * Get trade statistics for a user
   */
  static getTradeStats(userId, startDate = null, endDate = null) {
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (startDate) {
      whereClause += ' AND opened_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND opened_at <= ?';
      params.push(endDate);
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as gross_loss,
        SUM(profit_loss) as net_profit,
        AVG(profit_loss) as avg_profit,
        AVG(CASE WHEN profit_loss > 0 THEN profit_loss END) as avg_win,
        AVG(CASE WHEN profit_loss < 0 THEN profit_loss END) as avg_loss,
        MAX(profit_loss) as max_win,
        MIN(profit_loss) as max_loss,
        SUM(commission) as total_commission
      FROM trades ${whereClause} AND closed_at IS NOT NULL
    `).get(...params);

    const winRate = stats.total_trades > 0 
      ? (stats.winning_trades / stats.total_trades) * 100 
      : 0;

    const profitFactor = stats.gross_loss !== 0 
      ? Math.abs(stats.gross_profit / stats.gross_loss) 
      : stats.gross_profit > 0 ? Infinity : 0;

    return {
      ...stats,
      winRate,
      profitFactor,
      expectancy: stats.total_trades > 0 
        ? stats.net_profit / stats.total_trades 
        : 0
    };
  }

  /**
   * Get trades by symbol for a user
   */
  static getSymbolTrades(userId, symbol) {
    return db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND symbol = ? 
      ORDER BY opened_at DESC
    `).all(userId, symbol);
  }

  /**
   * Get strategy performance
   */
  static getStrategyPerformance(userId) {
    return db.prepare(`
      SELECT 
        strategy,
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as wins,
        AVG(profit_loss) as avg_profit,
        SUM(profit_loss) as net_profit
      FROM trades 
      WHERE user_id = ? AND strategy IS NOT NULL AND closed_at IS NOT NULL
      GROUP BY strategy
      ORDER BY net_profit DESC
    `).all(userId);
  }

  /**
   * Log execution action
   */
  static logExecution(userId, tradeId, action, details) {
    db.prepare(`
      INSERT INTO execution_logs (id, user_id, trade_id, action, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, tradeId, action, JSON.stringify(details));
  }

  /**
   * Parse execution log entry and auto-capture trade
   * This would typically be called by a webhook or scheduled job
   */
  static parseExecutionLog(logEntry) {
    // Expected format: { user_id, symbol, type, quantity, price, timestamp, ... }
    return this.captureTrade({
      userId: logEntry.user_id,
      symbol: logEntry.symbol,
      type: logEntry.side || logEntry.type, // 'buy'/'sell' or 'long'/'short'
      quantity: logEntry.quantity,
      entryPrice: logEntry.price,
      stopLoss: logEntry.stop_loss,
      takeProfit: logEntry.take_profit,
      strategy: logEntry.strategy,
      openedAt: logEntry.timestamp
    });
  }

  /**
   * Import bulk trades from CSV-like data
   */
  static importTrades(userId, tradesData) {
    const insert = db.prepare(`
      INSERT INTO trades (id, user_id, symbol, type, quantity, entry_price, exit_price, profit_loss, stop_loss, take_profit, strategy, opened_at, closed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importAll = db.transaction((trades) => {
      const results = [];
      for (const t of trades) {
        try {
          insert.run(
            uuidv4(),
            userId,
            t.symbol,
            t.type.toUpperCase(),
            t.quantity,
            t.entry_price,
            t.exit_price || null,
            t.profit_loss || null,
            t.stop_loss || null,
            t.take_profit || null,
            t.strategy || null,
            t.opened_at,
            t.closed_at || null
          );
          results.push({ success: true, symbol: t.symbol });
        } catch (err) {
          results.push({ success: false, symbol: t.symbol, error: err.message });
        }
      }
      return results;
    });

    return importAll(tradesData);
  }
}

module.exports = TradeCaptureService;
