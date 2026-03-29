const db = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

class SentimentAnalysisService {
  // Financial sentiment lexicons
  static FINANCIAL_POSITIVE = {
    'bullish': 0.8, 'buy': 0.7, 'long': 0.6, 'call': 0.6, 'moon': 0.9,
    'squeeze': 0.7, 'breakout': 0.7, ' momentum': 0.5, 'rally': 0.6,
    'surge': 0.7, 'soar': 0.8, 'gain': 0.5, 'profit': 0.5, 'up': 0.4,
    'growth': 0.5, 'beat': 0.6, 'exceed': 0.6, 'upgrade': 0.7,
    'strong': 0.5, 'recovery': 0.6, 'optimistic': 0.6, 'boom': 0.7,
    'breakout': 0.7, 'accumulate': 0.5, 'outperform': 0.6, 'overweight': 0.5
  };

  static FINANCIAL_NEGATIVE = {
    'bearish': -0.8, 'sell': -0.7, 'short': -0.6, 'put': -0.6, 'crash': -0.9,
    'plunge': -0.8, 'drop': -0.5, 'fall': -0.5, 'loss': -0.6, 'down': -0.4,
    'miss': -0.6, 'downgrade': -0.7, 'weak': -0.5, 'recession': -0.7,
    'concern': -0.4, 'risk': -0.3, 'volatile': -0.3, 'bubble': -0.6,
    'overvalued': -0.5, 'dump': -0.7, 'fear': -0.5, 'panic': -0.7,
    'collapse': -0.9, 'cut': -0.5, 'warning': -0.4, 'lawsuit': -0.6
  };

  /**
   * Analyze sentiment of a text
   */
  static analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { score: 0, label: 'NEUTRAL', confidence: 0 };
    }

    const words = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let matches = 0;
    let positiveMatches = [];
    let negativeMatches = [];

    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      
      if (this.FINANCIAL_POSITIVE[cleanWord]) {
        totalScore += this.FINANCIAL_POSITIVE[cleanWord];
        positiveMatches.push(cleanWord);
        matches++;
      }
      
      if (this.FINANCIAL_NEGATIVE[cleanWord]) {
        totalScore += this.FINANCIAL_NEGATIVE[cleanWord];
        negativeMatches.push(cleanWord);
        matches++;
      }
    }

    // Normalize score to -1 to 1 range
    let normalizedScore = matches > 0 ? totalScore / matches : 0;
    normalizedScore = Math.max(-1, Math.min(1, normalizedScore));

    // Calculate confidence based on matches
    const confidence = Math.min(1, matches / 10);

    // Determine label
    let label;
    if (normalizedScore >= 0.3) label = 'BULLISH';
    else if (normalizedScore <= -0.3) label = 'BEARISH';
    else label = 'NEUTRAL';

    return {
      score: normalizedScore,
      label,
      confidence,
      positiveMatches,
      negativeMatches,
      wordCount: words.length,
      matchCount: matches
    };
  }

  /**
   * Analyze sentiment with market context
   */
  static analyzeWithContext(text, symbol, marketPhase = 'NORMAL') {
    const baseAnalysis = this.analyzeText(text);
    
    // Adjust for market phase
    let adjustedScore = baseAnalysis.score;
    
    if (marketPhase === 'HIGH_VOLATILITY' || marketPhase === 'EXTREME_VOLATILITY') {
      // Amplify sentiment during high volatility
      adjustedScore *= 1.2;
    }
    
    // Cap at +/- 1
    adjustedScore = Math.max(-1, Math.min(1, adjustedScore));

    return {
      ...baseAnalysis,
      adjustedScore,
      marketPhase,
      symbol
    };
  }

  /**
   * Calculate engagement-weighted sentiment
   */
  static calculateEngagementScore(sentimentScore, engagement, engagementThreshold = 10000) {
    // Higher engagement amplifies sentiment signal
    const engagementMultiplier = Math.min(2, Math.log10(engagement + 1) / Math.log10(engagementThreshold + 1));
    return sentimentScore * engagementMultiplier;
  }

  /**
   * Store sentiment data point
   */
  static storeSentiment(symbol, source, content, engagement = 0, author = null, sourceId = null) {
    const analysis = this.analyzeWithContext(content, symbol);
    const engagementScore = this.calculateEngagementScore(analysis.score, engagement);
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO sentiment_data (id, symbol, source, source_id, author, content, sentiment_score, sentiment_label, engagement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, symbol, source, sourceId, author, content, analysis.score, analysis.label, engagement);

    return {
      id,
      ...analysis,
      engagementScore,
      stored: true
    };
  }

  /**
   * Get aggregated sentiment for a symbol over a period
   */
  static getAggregatedSentiment(symbol, period = '1h') {
    let interval;
    switch (period) {
      case '5m': interval = '5 minutes'; break;
      case '15m': interval = '15 minutes'; break;
      case '1h': interval = '1 hour'; break;
      case '4h': interval = '4 hours'; break;
      case '1d': interval = '1 day'; break;
      default: interval = '1 hour';
    }

    const data = db.prepare(`
      SELECT 
        AVG(sentiment_score) as avg_sentiment,
        SUM(CASE WHEN sentiment_label = 'BULLISH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as positive_pct,
        SUM(CASE WHEN sentiment_label = 'BEARISH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as negative_pct,
        SUM(CASE WHEN sentiment_label = 'NEUTRAL' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as neutral_pct,
        COUNT(*) as volume,
        SUM(sentiment_score * (1 + LOG10(engagement + 1))) as weighted_sum,
        SUM(1 + LOG10(engagement + 1)) as weight_total
      FROM sentiment_data
      WHERE symbol = ? AND collected_at >= datetime('now', '-' || ?)
    `).get(symbol, interval);

    if (!data || data.volume === 0) {
      return {
        symbol,
        period,
        avg_sentiment: 0,
        positive_pct: 33.3,
        negative_pct: 33.3,
        neutral_pct: 33.4,
        volume: 0,
        weighted_score: 0,
        label: 'NO_DATA'
      };
    }

    const weightedScore = data.weighted_sum / data.weight_total;
    const label = weightedScore >= 0.3 ? 'BULLISH' : weightedScore <= -0.3 ? 'BEARISH' : 'NEUTRAL';

    return {
      symbol,
      period,
      avg_sentiment: data.avg_sentiment,
      positive_pct: data.positive_pct,
      negative_pct: data.negative_pct,
      neutral_pct: data.neutral_pct,
      volume: data.volume,
      weighted_score: weightedScore,
      label
    };
  }

  /**
   * Detect sentiment shift
   */
  static detectSentimentShift(symbol, threshold = 0.3) {
    const current = this.getAggregatedSentiment(symbol, '15m');
    const previous = this.getAggregatedSentiment(symbol, '1h');

    if (!current || current.volume === 0) return null;

    const shift = current.avg_sentiment - previous.avg_sentiment;
    const isSignificant = Math.abs(shift) >= threshold;

    return {
      symbol,
      current,
      previous,
      shift,
      isSignificant,
      direction: shift > 0 ? 'POSITIVE_SHIFT' : shift < 0 ? 'NEGATIVE_SHIFT' : 'STABLE',
      alertLevel: Math.abs(shift) >= threshold * 2 ? 'HIGH' : Math.abs(shift) >= threshold ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Get sentiment sources breakdown
   */
  static getSourceBreakdown(symbol, period = '1h') {
    let interval;
    switch (period) {
      case '1h': interval = '1 hour'; break;
      case '4h': interval = '4 hours'; break;
      case '1d': interval = '1 day'; break;
      default: interval = '1 hour';
    }

    const breakdown = db.prepare(`
      SELECT 
        source,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_sentiment,
        SUM(engagement) as total_engagement
      FROM sentiment_data
      WHERE symbol = ? AND collected_at >= datetime('now', '-' || ?)
      GROUP BY source
      ORDER BY total_engagement DESC
    `).all(symbol, interval);

    return breakdown;
  }

  /**
   * Generate overall market sentiment
   */
  static getMarketSentiment() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META'];
    const sentiments = {};

    for (const symbol of symbols) {
      sentiments[symbol] = this.getAggregatedSentiment(symbol, '1h');
    }

    // Calculate market average
    const validSymbols = Object.values(sentiments).filter(s => s.volume > 0);
    const marketAvg = validSymbols.length > 0
      ? validSymbols.reduce((sum, s) => sum + s.weighted_score, 0) / validSymbols.length
      : 0;

    const bullPct = validSymbols.filter(s => s.label === 'BULLISH').length;
    const bearPct = validSymbols.filter(s => s.label === 'BEARISH').length;

    return {
      timestamp: new Date().toISOString(),
      overallScore: marketAvg,
      overallLabel: marketAvg >= 0.2 ? 'BULLISH' : marketAvg <= -0.2 ? 'BEARISH' : 'NEUTRAL',
      bullishCount: bullPct,
      bearishCount: bearPct,
      neutralCount: validSymbols.length - bullPct - bearPct,
      symbols: sentiments
    };
  }
}

module.exports = SentimentAnalysisService;
