const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');
const SentimentAnalysisService = require('./sentimentAnalysisService');

class AlertService {
  // Alert types
  static ALERT_TYPES = {
    SENTIMENT_THRESHOLD: 'SENTIMENT_THRESHOLD',
    SENTIMENT_SHIFT: 'SENTIMENT_SHIFT',
    VOLUME_SPIKE: 'VOLUME_SPIKE',
    NEWS_EVENT: 'NEWS_EVENT',
    SIGNAL_GENERATED: 'SIGNAL_GENERATED'
  };

  /**
   * Create an alert
   */
  static createAlert(userId, symbol, alertType, condition, threshold) {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO alerts (id, user_id, symbol, alert_type, condition, threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, symbol, alertType, condition, threshold);

    return this.getAlert(id);
  }

  /**
   * Get alert by ID
   */
  static getAlert(alertId) {
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
  }

  /**
   * Get user's alerts
   */
  static getUserAlerts(userId, symbol = null, enabledOnly = true) {
    let query = 'SELECT * FROM alerts WHERE user_id = ?';
    const params = [userId];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }
    if (enabledOnly) {
      query += ' AND enabled = 1';
    }

    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params);
  }

  /**
   * Update alert
   */
  static updateAlert(alertId, updates) {
    const { threshold, condition, enabled } = updates;

    if (threshold !== undefined) {
      db.prepare('UPDATE alerts SET threshold = ? WHERE id = ?').run(threshold, alertId);
    }
    if (condition !== undefined) {
      db.prepare('UPDATE alerts SET condition = ? WHERE id = ?').run(condition, alertId);
    }
    if (enabled !== undefined) {
      db.prepare('UPDATE alerts SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, alertId);
    }

    return this.getAlert(alertId);
  }

  /**
   * Delete alert
   */
  static deleteAlert(alertId) {
    db.prepare('DELETE FROM alerts WHERE id = ?').run(alertId);
    db.prepare('DELETE FROM alert_history WHERE alert_id = ?').run(alertId);
    return { deleted: true };
  }

  /**
   * Check alerts for a symbol
   */
  static checkAlerts(symbol, userId = null) {
    const triggeredAlerts = [];

    // Get all enabled alerts for this symbol
    let query = `
      SELECT a.*, st.bullish_threshold, st.bearish_threshold 
      FROM alerts a
      LEFT JOIN sentiment_thresholds st ON st.symbol = a.symbol
      WHERE a.symbol = ? AND a.triggered = 0
    `;
    const params = [symbol];

    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
    }

    const alerts = db.prepare(query).all(...params);

    // Get current sentiment
    const sentiment = SentimentAnalysisService.getAggregatedSentiment(symbol, '15m');
    if (!sentiment) return triggeredAlerts;

    for (const alert of alerts) {
      let triggered = false;
      let currentValue = 0;

      switch (alert.alert_type) {
        case this.ALERT_TYPES.SENTIMENT_THRESHOLD:
          if (alert.condition === 'ABOVE') {
            triggered = sentiment.weighted_score >= alert.threshold;
          } else if (alert.condition === 'BELOW') {
            triggered = sentiment.weighted_score <= alert.threshold;
          }
          currentValue = sentiment.weighted_score;
          break;

        case this.ALERT_TYPES.SENTIMENT_SHIFT:
          const shift = SentimentAnalysisService.detectSentimentShift(symbol);
          if (shift && shift.isSignificant) {
            triggered = true;
            currentValue = shift.shift;
          }
          break;

        case this.ALERT_TYPES.VOLUME_SPIKE:
          // Would need real volume data
          break;

        default:
          break;
      }

      if (triggered) {
        this.triggerAlert(alert, currentValue);
        triggeredAlerts.push({ ...alert, current_value: currentValue });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Trigger an alert
   */
  static triggerAlert(alert, currentValue) {
    // Update alert
    db.prepare(`
      UPDATE alerts 
      SET triggered = 1, triggered_at = ?, current_value = ?
      WHERE id = ?
    `).run(new Date().toISOString(), currentValue, alert.id);

    // Create history entry
    const historyId = uuidv4();
    db.prepare(`
      INSERT INTO alert_history (id, alert_id, symbol, condition, threshold, value_at_trigger)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(historyId, alert.id, alert.symbol, alert.condition, alert.threshold, currentValue);

    return this.getAlert(alert.id);
  }

  /**
   * Acknowledge alert
   */
  static acknowledgeAlert(alertId) {
    db.prepare(`
      UPDATE alert_history 
      SET acknowledged = 1, acknowledged_at = ?
      WHERE alert_id = ?
    `).run(new Date().toISOString(), alertId);

    db.prepare(`
      UPDATE alerts 
      SET triggered = 0
      WHERE id = ?
    `).run(alertId);

    return this.getAlert(alertId);
  }

  /**
   * Get alert history
   */
  static getAlertHistory(userId, symbol = null, limit = 50) {
    let query = `
      SELECT ah.*, a.alert_type, a.symbol
      FROM alert_history ah
      JOIN alerts a ON ah.alert_id = a.id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    if (symbol) {
      query += ' AND ah.symbol = ?';
      params.push(symbol);
    }

    query += ' ORDER BY ah.triggered_at DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
  }

  /**
   * Create sentiment threshold alert
   */
  static createSentimentThreshold(userId, symbol, bullishThreshold = 0.6, bearishThreshold = -0.6) {
    // Check if threshold record exists
    let threshold = db.prepare('SELECT * FROM sentiment_thresholds WHERE symbol = ? AND (user_id = ? OR user_id IS NULL)').get(symbol, userId);

    if (!threshold) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO sentiment_thresholds (id, user_id, symbol, alert_type, bullish_threshold, bearish_threshold)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, userId, symbol, 'SENTIMENT_THRESHOLD', bullishThreshold, bearishThreshold);
      threshold = db.prepare('SELECT * FROM sentiment_thresholds WHERE id = ?').get(id);
    }

    // Create alerts for both thresholds
    const alerts = [];
    
    if (bullishThreshold) {
      const alert = this.createAlert(userId, symbol, this.ALERT_TYPES.SENTIMENT_THRESHOLD, 'ABOVE', bullishThreshold);
      alerts.push(alert);
    }
    
    if (bearishThreshold) {
      const alert = this.createAlert(userId, symbol, this.ALERT_TYPES.SENTIMENT_THRESHOLD, 'BELOW', bearishThreshold);
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Get alert statistics
   */
  static getAlertStats(userId, days = 30) {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN triggered = 1 THEN 1 ELSE 0 END) as triggered_count,
        SUM(CASE WHEN acknowledged = 1 THEN 1 ELSE 0 END) as acknowledged_count
      FROM alert_history ah
      JOIN alerts a ON ah.alert_id = a.id
      WHERE a.user_id = ? AND ah.triggered_at >= datetime('now', '-${days} days')
    `).get(userId);

    return {
      ...stats,
      acknowledgmentRate: stats.triggered_count > 0 
        ? (stats.acknowledged_count / stats.triggered_count) * 100 
        : 0
    };
  }
}

module.exports = AlertService;
