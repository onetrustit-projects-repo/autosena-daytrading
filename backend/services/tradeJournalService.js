/**
 * Trade Journal Service
 * Automatic trade capture with AI-powered insights
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

const marketDataService = require('./marketDataService');
const newsService = require('./newsService');
const sentimentService = require('./sentimentService');
const aiInsightsEngine = require('./aiInsightsEngine');

class TradeJournalService {
  constructor() {
    this.trades = new Map();
    this.journalEntries = [];
  }

  /**
   * Automatically capture a trade from execution logs
   */
  async captureTrade(tradeData) {
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const trade = {
      id: tradeId,
      symbol: tradeData.symbol,
      side: tradeData.side,
      quantity: tradeData.quantity,
      entryPrice: tradeData.entryPrice,
      exitPrice: tradeData.exitPrice,
      entryTime: tradeData.entryTime || new Date(),
      exitTime: tradeData.exitTime,
      pnl: this.calculatePnL(tradeData),
      commission: tradeData.commission || 0,
      slippage: tradeData.slippage || 0,
      strategy: tradeData.strategy || 'unknown',
      timeframe: tradeData.timeframe || 'intraday',
      status: tradeData.exitPrice ? 'closed' : 'open',
      metadata: {}
    };

    // Enrich with market context
    trade.metadata = await this.enrichWithMarketContext(trade);
    
    // Capture news context at time of trade
    trade.metadata.newsContext = await this.captureNewsContext(trade.entryTime);
    
    // Capture sentiment context
    trade.metadata.sentiment = await this.captureSentimentContext(trade.symbol, trade.entryTime);
    
    // Generate AI insights for this trade
    trade.aiInsights = await this.generateTradeInsights(trade);

    this.trades.set(tradeId, trade);
    
    // Create journal entry
    const journalEntry = await this.createJournalEntry(trade);
    this.journalEntries.push(journalEntry);

    return { trade, journalEntry };
  }

  /**
   * Calculate profit/loss for a trade
   */
  calculatePnL(tradeData) {
    const { side, quantity, entryPrice, exitPrice, commission = 0, slippage = 0 } = tradeData;
    if (!exitPrice) return null;
    
    const multiplier = side === 'long' ? 1 : -1;
    const grossPnL = (exitPrice - entryPrice) * quantity * multiplier;
    const netPnL = grossPnL - commission - slippage;
    
    return {
      gross: grossPnL,
      net: netPnL,
      commission,
      slippage,
      pnlPercent: ((exitPrice - entryPrice) / entryPrice) * 100 * multiplier
    };
  }

  /**
   * Enrich trade with market context data
   */
  async enrichWithMarketContext(trade) {
    try {
      const [volatility, volumeProfile, supportResistance] = await Promise.all([
        marketDataService.getVolatility(trade.symbol),
        marketDataService.getVolumeProfile(trade.symbol),
        marketDataService.getSupportResistance(trade.symbol)
      ]);

      return {
        volatility,
        volumeProfile,
        supportResistance,
        marketPhase: this.identifyMarketPhase(volatility, volumeProfile),
        tradingSession: this.identifyTradingSession(trade.entryTime)
      };
    } catch (error) {
      console.error('Failed to enrich trade with market context:', error);
      return {};
    }
  }

  /**
   * Capture news events around trade time
   */
  async captureNewsContext(timestamp) {
    try {
      const news = await newsService.getNewsAroundTime(timestamp);
      return {
        headlines: news.map(n => n.title),
        impact: news.reduce((sum, n) => sum + (n.impact || 0), 0),
        count: news.length
      };
    } catch (error) {
      return { headlines: [], impact: 0, count: 0 };
    }
  }

  /**
   * Capture sentiment at time of trade
   */
  async captureSentimentContext(symbol, timestamp) {
    try {
      const sentiment = await sentimentService.getSentiment(symbol, timestamp);
      return sentiment;
    } catch (error) {
      return { score: 0, label: 'neutral' };
    }
  }

  /**
   * Generate AI insights for a trade
   */
  async generateTradeInsights(trade) {
    return await aiInsightsEngine.analyzeTrade(trade);
  }

  /**
   * Create a journal entry for a trade
   */
  async createJournalEntry(trade) {
    const entry = {
      id: `journal_${Date.now()}`,
      tradeId: trade.id,
      timestamp: new Date(),
      summary: this.generateTradeSummary(trade),
      tags: this.generateTradeTags(trade),
      lessons: await this.extractLessons(trade),
      improvementAreas: await this.identifyImprovements(trade),
      aiRecommendations: trade.aiInsights.recommendations || []
    };

    return entry;
  }

  /**
   * Generate human-readable trade summary
   */
  generateTradeSummary(trade) {
    const pnlEmoji = trade.pnl?.net >= 0 ? '✅' : '❌';
    const side = trade.side.toUpperCase();
    const pnlStr = trade.pnl ? `$${trade.pnl.net.toFixed(2)}` : 'Open';
    
    return `${pnlEmoji} ${side} ${trade.quantity} ${trade.symbol} @ ${trade.entryPrice}${trade.exitPrice ? ` → ${trade.exitPrice}` : ''} | P&L: ${pnlStr}`;
  }

  /**
   * Generate tags for categorizing trades
   */
  generateTradeTags(trade) {
    const tags = [];
    
    // Strategy tags
    if (trade.strategy) tags.push(trade.strategy);
    
    // Outcome tags
    if (trade.pnl?.net > 0) tags.push('profitable');
    else if (trade.pnl?.net < 0) tags.push('losing');
    
    // Setup tags
    if (trade.metadata?.marketPhase) tags.push(trade.metadata.marketPhase);
    if (trade.metadata?.tradingSession) tags.push(trade.metadata.tradingSession);
    
    // Risk tags
    if (trade.pnl?.pnlPercent > 5) tags.push('high-return');
    if (trade.pnl?.pnlPercent < -3) tags.push('high-loss');
    
    return [...new Set(tags)];
  }

  /**
   * Extract lessons from trade
   */
  async extractLessons(trade) {
    const lessons = [];
    
    if (trade.pnl?.net > 0) {
      if (trade.aiInsights?.goodEntry) {
        lessons.push('Good entry timing based on identified setup');
      }
      if (trade.aiInsights?.followsPlan) {
        lessons.push('Successfully followed trading plan');
      }
    } else if (trade.pnl?.net < 0) {
      if (trade.aiInsights?.lateEntry) {
        lessons.push('Entry was delayed - consider faster execution');
      }
      if (trade.aiInsights?.emotionalTrade) {
        lessons.push('Trade may have been influenced by emotional decisions');
      }
    }

    return lessons;
  }

  /**
   * Identify areas for improvement
   */
  async identifyImprovements(trade) {
    const improvements = [];
    
    if (trade.slippage > 0.05) {
      improvements.push('High slippage detected - consider order type adjustment');
    }
    
    if (trade.aiInsights?.sizingIssue) {
      improvements.push(`Position sizing: ${trade.aiInsights.sizingIssue}`);
    }
    
    if (trade.aiInsights?.timingIssue) {
      improvements.push(`Timing: ${trade.aiInsights.timingIssue}`);
    }

    return improvements;
  }

  /**
   * Identify current market phase
   */
  identifyMarketPhase(volatility, volumeProfile) {
    if (!volatility || !volumeProfile) return 'unknown';
    
    if (volatility.high && volumeProfile.aboveAverage) return 'volatile';
    if (volatility.low && volumeProfile.belowAverage) return 'quiet';
    if (volatility.rising) return 'trending';
    
    return 'ranging';
  }

  /**
   * Identify trading session
   */
  identifyTradingSession(timestamp) {
    const hour = new Date(timestamp).getHours();
    const bogotaHour = (hour - 5 + 24) % 24; // EST to Colombia time
    
    if (bogotaHour >= 9 && bogotaHour < 11) return 'open';
    if (bogotaHour >= 11 && bogotaHour < 15) return 'midday';
    if (bogotaHour >= 15 && bogotaHour < 16) return 'close';
    
    return 'after-hours';
  }

  /**
   * Get journal entries for a date range
   */
  getJournalEntries(startDate, endDate) {
    return this.journalEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get all trades
   */
  getAllTrades() {
    return Array.from(this.trades.values());
  }

  /**
   * Generate overall trading insights
   */
  async generateOverallInsights() {
    const trades = this.getAllTrades();
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    const insights = {
      totalTrades: closedTrades.length,
      winRate: this.calculateWinRate(closedTrades),
      avgPnL: this.calculateAvgPnL(closedTrades),
      bestTrade: this.findBestTrade(closedTrades),
      worstTrade: this.findWorstTrade(closedTrades),
      commonMistakes: await this.identifyCommonMistakes(closedTrades),
      improvements: await this.suggestImprovements(closedTrades),
      patternInsights: await this.identifyPatterns(closedTrades)
    };

    return insights;
  }

  calculateWinRate(trades) {
    if (trades.length === 0) return 0;
    const winners = trades.filter(t => t.pnl?.net > 0).length;
    return (winners / trades.length) * 100;
  }

  calculateAvgPnL(trades) {
    if (trades.length === 0) return 0;
    const total = trades.reduce((sum, t) => sum + (t.pnl?.net || 0), 0);
    return total / trades.length;
  }

  findBestTrade(trades) {
    return trades.reduce((best, t) => 
      (!best || t.pnl?.net > best.pnl?.net) ? t : best, null);
  }

  findWorstTrade(trades) {
    return trades.reduce((worst, t) => 
      (!worst || t.pnl?.net < worst.pnl?.net) ? t : worst, null);
  }

  async identifyCommonMistakes(trades) {
    const mistakes = [];
    const losingTrades = trades.filter(t => t.pnl?.net < 0);

    losingTrades.forEach(trade => {
      if (trade.aiInsights?.emotionalTrade) {
        mistakes.push({ type: 'emotional', count: 1, trade: trade.id });
      }
      if (trade.aiInsights?.lateEntry) {
        mistakes.push({ type: 'late_entry', count: 1, trade: trade.id });
      }
    });

    return mistakes;
  }

  async suggestImprovements(trades) {
    const suggestions = [];
    const winRate = this.calculateWinRate(trades);
    
    if (winRate < 40) {
      suggestions.push('Consider focusing on higher probability setups');
    }
    
    const avgLoss = trades
      .filter(t => t.pnl?.net < 0)
      .reduce((sum, t) => sum + Math.abs(t.pnl?.net || 0), 0) / 
      (trades.filter(t => t.pnl?.net < 0).length || 1);
    
    const avgWin = trades
      .filter(t => t.pnl?.net > 0)
      .reduce((sum, t) => sum + (t.pnl?.net || 0), 0) / 
      (trades.filter(t => t.pnl?.net > 0).length || 1);
    
    if (avgWin < avgLoss * 1.5) {
      suggestions.push('Win/Average loss ratio is below 1.5 - consider wider targets');
    }

    return suggestions;
  }

  async identifyPatterns(trades) {
    const patterns = {
      bySession: {},
      byDayOfWeek: {},
      byStrategy: {}
    };

    trades.forEach(trade => {
      const session = trade.metadata?.tradingSession || 'unknown';
      const dayOfWeek = new Date(trade.entryTime).getDay();
      const strategy = trade.strategy || 'unknown';

      patterns.bySession[session] = patterns.bySession[session] || [];
      patterns.bySession[session].push(trade);

      patterns.byDayOfWeek[dayOfWeek] = patterns.byDayOfWeek[dayOfWeek] || [];
      patterns.byDayOfWeek[dayOfWeek].push(trade);

      patterns.byStrategy[strategy] = patterns.byStrategy[strategy] || [];
      patterns.byStrategy[strategy].push(trade);
    });

    // Find best performing patterns
    const bestSession = this.findBestPerformers(patterns.bySession);
    const bestDay = this.findBestPerformers(patterns.byDayOfWeek);
    const bestStrategy = this.findBestPerformers(patterns.byStrategy);

    return { bestSession, bestDay, bestStrategy };
  }

  findBestPerformers(groups) {
    const results = Object.entries(groups).map(([key, trades]) => ({
      group: key,
      trades: trades.length,
      winRate: this.calculateWinRate(trades),
      avgPnL: this.calculateAvgPnL(trades)
    }));

    return results.sort((a, b) => b.avgPnL - a.avgPnL);
  }
}

module.exports = new TradeJournalService();
