/**
 * AI Insights Engine
 * NLP-based analysis of trading patterns and behaviors
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

class AIInsightsEngine {
  constructor() {
    this.insightsCache = new Map();
  }

  /**
   * Analyze a single trade and generate insights
   */
  async analyzeTrade(trade) {
    const insights = {
      goodEntry: false,
      lateEntry: false,
      emotionalTrade: false,
      followsPlan: false,
      sizingIssue: null,
      timingIssue: null,
      recommendations: [],
      confidence: 0.7
    };

    // Analyze entry timing
    insights.goodEntry = this.analyzeEntryTiming(trade);
    insights.lateEntry = !insights.goodEntry && trade.metadata?.tradingSession !== 'after-hours';

    // Analyze for emotional trading patterns
    insights.emotionalTrade = this.detectEmotionalTrading(trade);

    // Analyze position sizing
    insights.sizingIssue = this.analyzePositionSizing(trade);

    // Analyze timing
    insights.timingIssue = this.analyzeTiming(trade);

    // Check if trade follows a plan
    insights.followsPlan = this.checkPlanFollowing(trade);

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(trade, insights);

    // Calculate confidence
    insights.confidence = this.calculateConfidence(trade, insights);

    return insights;
  }

  /**
   * Analyze entry timing quality
   */
  analyzeEntryTiming(trade) {
    if (!trade.metadata?.supportResistance) return false;
    
    const { supportResistance } = trade.metadata;
    const entryPrice = trade.entryPrice;
    
    // Good entry near support for longs
    if (trade.side === 'long') {
      const nearSupport = supportResistance.support && 
        Math.abs(entryPrice - supportResistance.support) / entryPrice < 0.01;
      return nearSupport && trade.metadata.marketPhase !== 'volatile';
    }
    
    // Good entry near resistance for shorts
    if (trade.side === 'short') {
      const nearResistance = supportResistance.resistance && 
        Math.abs(entryPrice - supportResistance.resistance) / entryPrice < 0.01;
      return nearResistance && trade.metadata.marketPhase !== 'volatile';
    }

    return false;
  }

  /**
   * Detect emotional trading patterns
   */
  detectEmotionalTrading(trade) {
    // Check for revenge trading pattern (large loss followed quickly by trade)
    if (trade.pnl?.net < 0 && Math.abs(trade.pnl?.pnlPercent) > 5) {
      return true;
    }

    // Check for FOMO (trading at extreme sentiment)
    if (trade.metadata?.sentiment?.label === 'extremely_bullish' && trade.side === 'long') {
      return true;
    }
    if (trade.metadata?.sentiment?.label === 'extremely_bearish' && trade.side === 'short') {
      return true;
    }

    // Check for news trading without confirmation
    if (trade.metadata?.newsContext?.count > 3 && !trade.aiInsights?.goodEntry) {
      return true;
    }

    return false;
  }

  /**
   * Analyze position sizing
   */
  analyzePositionSizing(trade) {
    // This would typically reference account size and risk parameters
    // For now, flag unusual sizes
    const unusualSize = trade.quantity > 10000 || trade.quantity < 100;
    
    if (unusualSize) {
      return 'Position size outside typical range - verify risk management';
    }

    // Check if position is too large relative to account
    // (would need account balance in real implementation)
    
    return null;
  }

  /**
   * Analyze timing issues
   */
  analyzeTiming(trade) {
    const session = trade.metadata?.tradingSession;
    
    if (session === 'close' && trade.pnl?.net < 0) {
      return 'End-of-day trades may have reduced liquidity';
    }

    if (session === 'after-hours' && !trade.metadata?.newsContext) {
      return 'Trading after hours without news catalyst';
    }

    return null;
  }

  /**
   * Check if trade follows the plan
   */
  checkPlanFollowing(trade) {
    // Check if trade has defined strategy
    if (!trade.strategy || trade.strategy === 'unknown') {
      return false;
    }

    // Check for proper stop loss (would be in trade metadata)
    // This is a simplified check
    
    return true;
  }

  /**
   * Generate recommendations based on trade analysis
   */
  generateRecommendations(trade, insights) {
    const recommendations = [];

    if (insights.emotionalTrade) {
      recommendations.push({
        type: 'behavioral',
        priority: 'high',
        text: 'Consider taking a break after losses to avoid emotional trading'
      });
    }

    if (insights.lateEntry) {
      recommendations.push({
        type: 'execution',
        priority: 'medium',
        text: 'Work on faster order execution to capture planned entries'
      });
    }

    if (insights.sizingIssue) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        text: insights.sizingIssue
      });
    }

    if (!insights.followsPlan) {
      recommendations.push({
        type: 'discipline',
        priority: 'high',
        text: 'Define and document a trading plan before entering trades'
      });
    }

    // Add general recommendations based on trade characteristics
    if (trade.metadata?.marketPhase === 'volatile') {
      recommendations.push({
        type: 'risk',
        priority: 'medium',
        text: 'Consider reducing position size during volatile market phases'
      });
    }

    return recommendations;
  }

  /**
   * Calculate confidence score for insights
   */
  calculateConfidence(trade, insights) {
    let confidence = 0.5;

    // More metadata = higher confidence
    if (trade.metadata?.volatility) confidence += 0.1;
    if (trade.metadata?.sentiment) confidence += 0.1;
    if (trade.metadata?.newsContext?.count > 0) confidence += 0.1;

    // Complete trades = higher confidence
    if (trade.status === 'closed') confidence += 0.1;

    // Cap at 0.95
    return Math.min(confidence, 0.95);
  }

  /**
   * Analyze behavioral patterns across multiple trades
   */
  async analyzeBehaviorPatterns(trades) {
    const patterns = {
      sessions: {},
      daysOfWeek: {},
      emotions: [],
      discipline: []
    };

    trades.forEach(trade => {
      const session = trade.metadata?.tradingSession || 'unknown';
      const day = new Date(trade.entryTime).getDay();

      patterns.sessions[session] = patterns.sessions[session] || { trades: 0, losses: 0 };
      patterns.sessions[session].trades++;
      if (trade.pnl?.net < 0) patterns.sessions[session].losses++;

      patterns.daysOfWeek[day] = patterns.daysOfWeek[day] || { trades: 0, pnl: 0 };
      patterns.daysOfWeek[day].trades++;
      patterns.daysOfWeek[day].pnl += trade.pnl?.net || 0;

      if (trade.aiInsights?.emotionalTrade) {
        patterns.emotions.push(trade.id);
      }
      if (!trade.aiInsights?.followsPlan) {
        patterns.discipline.push(trade.id);
      }
    });

    return {
      sessionPerformance: this.analyzeSessionPerformance(patterns.sessions),
      dayPerformance: this.analyzeDayPerformance(patterns.daysOfWeek),
      emotionalTradingFrequency: patterns.emotions.length / trades.length,
      planFollowingRate: 1 - (patterns.discipline.length / trades.length),
      recommendations: this.generateBehavioralRecommendations(patterns)
    };
  }

  /**
   * Analyze session performance
   */
  analyzeSessionPerformance(sessions) {
    return Object.entries(sessions).map(([session, data]) => ({
      session,
      trades: data.trades,
      lossRate: data.losses / data.trades,
      recommendation: data.losses / data.trades > 0.6 
        ? `Avoid trading during ${session} session` 
        : `${session} session performing well`
    }));
  }

  /**
   * Analyze day of week performance
   */
  analyzeDayPerformance(days) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Object.entries(days).map(([day, data]) => ({
      day: dayNames[parseInt(day)],
      trades: data.trades,
      avgPnL: data.pnl / data.trades
    }));
  }

  /**
   * Generate behavioral recommendations
   */
  generateBehavioralRecommendations(patterns) {
    const recommendations = [];

    // Check for emotional trading frequency
    if (patterns.emotionalTradingFrequency > 0.2) {
      recommendations.push({
        type: 'behavioral',
        text: 'High frequency of potentially emotional trades detected. Consider implementing a cooling-off period after losses.'
      });
    }

    // Check for plan following
    if (patterns.planFollowingRate < 0.7) {
      recommendations.push({
        type: 'discipline',
        text: 'Low plan adherence rate. Focus on defining and following a written trading plan.'
      });
    }

    return recommendations;
  }
}

module.exports = new AIInsightsEngine();
