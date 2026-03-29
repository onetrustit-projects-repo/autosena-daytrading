const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/schema');
const SentimentAnalysisService = require('./sentimentAnalysisService');

class DataIngestionService {
  // Data source configurations
  static SOURCES = {
    TWITTER: 'twitter',
    REDDIT: 'reddit',
    NEWS: 'news',
    STOCKTWITS: 'stocktwits'
  };

  /**
   * Ingest data from Twitter (mock - would use real API)
   */
  static async fetchTwitterData(symbol, options = {}) {
    // In production, this would use Twitter API v2
    // For now, generate mock data
    const mockTweets = this.generateMockTweets(symbol, options.limit || 50);
    
    const results = [];
    for (const tweet of mockTweets) {
      const stored = SentimentAnalysisService.storeSentiment(
        symbol,
        this.SOURCES.TWITTER,
        tweet.content,
        tweet.engagement,
        tweet.author,
        tweet.id
      );
      results.push(stored);
    }
    
    return results;
  }

  /**
   * Ingest data from Reddit (mock - would use Reddit API)
   */
  static async fetchRedditData(symbol, options = {}) {
    // In production, this would use Reddit API
    const mockPosts = this.generateMockRedditPosts(symbol, options.limit || 30);
    
    const results = [];
    for (const post of mockPosts) {
      const stored = SentimentAnalysisService.storeSentiment(
        symbol,
        this.SOURCES.REDDIT,
        post.content,
        post.engagement + post.comments * 5, // Comments add engagement
        post.author,
        post.id
      );
      results.push(stored);
    }
    
    return results;
  }

  /**
   * Ingest news data (mock - would use news API)
   */
  static async fetchNewsData(symbol, options = {}) {
    // In production, this would use news API (NewsAPI, Alpha Vantage, etc.)
    const mockNews = this.generateMockNews(symbol, options.limit || 10);
    
    const results = [];
    for (const article of mockNews) {
      const stored = SentimentAnalysisService.storeSentiment(
        symbol,
        this.SOURCES.NEWS,
        article.headline + ' ' + article.summary,
        article.engagement || 1000,
        article.source,
        article.id
      );

      // Also store in news_events table
      if (stored.stored) {
        db.prepare(`
          INSERT INTO news_events (id, symbol, headline, source, url, sentiment_score, importance)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), symbol, article.headline, article.source, article.url, stored.score, article.importance);
      }

      results.push(stored);
    }
    
    return results;
  }

  /**
   * Fetch all sources for a symbol
   */
  static async fetchAllSources(symbol, options = {}) {
    const results = {
      symbol,
      timestamp: new Date().toISOString(),
      sources: {}
    };

    try {
      if (options.sources === undefined || options.sources.includes('twitter')) {
        results.sources.twitter = await this.fetchTwitterData(symbol, options);
      }
    } catch (e) {
      results.sources.twitter = { error: e.message };
    }

    try {
      if (options.sources === undefined || options.sources.includes('reddit')) {
        results.sources.reddit = await this.fetchRedditData(symbol, options);
      }
    } catch (e) {
      results.sources.reddit = { error: e.message };
    }

    try {
      if (options.sources === undefined || options.sources.includes('news')) {
        results.sources.news = await this.fetchNewsData(symbol, options);
      }
    } catch (e) {
      results.sources.news = { error: e.message };
    }

    return results;
  }

  /**
   * Generate mock Twitter data
   */
  static generateMockTweets(symbol, count) {
    const tweets = [];
    const sentiments = ['bullish', 'bearish', 'neutral'];
    const authors = ['@TraderJoe', '@DiamondHands', '@WallStWiz', '@PipHunter', '@DayTraderPro'];
    
    const templates = {
      bullish: [
        `$${symbol} looking strong! This breakout could go to the moon! 🚀`,
        `Just bought more $$ {symbol}. The fundamentals are solid.`,
        `$${symbol} breaking out! My ${Math.floor(Math.random() * 20) + 5} call is printing!`,
        `Can't stop thinking about $$ {symbol}. This company is going to change the game.`,
        `$${symbol} momentum is building. Stay long!`,
      ],
      bearish: [
        `$${symbol} concerns me. The charts are looking ugly.`,
        `Sold my $$ {symbol} position. Risk management first!`,
        `$${symbol} might drop more. Not my kind of trade.`,
        `Watching $$ {symbol} carefully. Could be a trap.`,
        `$${symbol} losing steam. Time to take profits.`,
      ],
      neutral: [
        `$${symbol} holding steady. Waiting for direction.`,
        `Any thoughts on $$ {symbol}? Mixed signals here.`,
        `$${symbol} consolidating. patience is key.`,
        `Watching $$ {symbol} closely. Not making any moves yet.`,
        `$${symbol} in a range. Could go either way.`,
      ]
    };

    for (let i = 0; i < count; i++) {
      const sentiment = sentiments[Math.floor(Math.random() * 3)];
      const template = templates[sentiment][Math.floor(Math.random() * templates[sentiment].length)];
      
      tweets.push({
        id: `tw_${uuidv4().slice(0, 8)}`,
        author: authors[Math.floor(Math.random() * authors.length)],
        content: template,
        engagement: Math.floor(Math.random() * 50000),
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }

    return tweets;
  }

  /**
   * Generate mock Reddit data
   */
  static generateMockRedditPosts(symbol, count) {
    const posts = [];
    const authors = ['user123', 'investor_xyz', 'wallstreetbets_fan', 'value_investor', 'day_trader99'];
    
    const templates = {
      bullish: [
        `DD on $$ {symbol} - Here's why I think we're going higher`,
        `$${symbol} YOLO update - up ${Math.floor(Math.random() * 50) + 10}% today!`,
        `Why $$ {symbol} is the best play right now`,
        `Just increased my position in $$ {symbol}. Here's why`,
      ],
      bearish: [
        `Warning: $$ {symbol} might be overvalued`,
        `Closed my $$ {symbol} position. Here's my analysis`,
        `Is $$ {symbol} a trap? Let's discuss`,
      ],
      neutral: [
        `What do you think about $$ {symbol}?`,
        `Neutral on $$ {symbol} for now`,
        `$${symbol} discussion thread`,
      ]
    };

    for (let i = 0; i < count; i++) {
      const sentiment = Math.random() > 0.6 ? 'bullish' : Math.random() > 0.5 ? 'bearish' : 'neutral';
      const template = templates[sentiment][Math.floor(Math.random() * templates[sentiment].length)];
      
      posts.push({
        id: `rd_${uuidv4().slice(0, 8)}`,
        author: authors[Math.floor(Math.random() * authors.length)],
        title: template,
        content: template + ' - Full analysis in comments.',
        engagement: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString()
      });
    }

    return posts;
  }

  /**
   * Generate mock news data
   */
  static generateMockNews(symbol, count) {
    const news = [];
    const sources = ['Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'Yahoo Finance'];
    const importances = ['high', 'medium', 'low'];
    
    const headlines = {
      positive: [
        `${symbol} Reports Strong Quarterly Earnings, Beats Expectations`,
        `${symbol} Announces Strategic Partnership, Stock Surges`,
        `Analysts Upgrade ${symbol} to Strong Buy`,
        `${symbol} Expands Into New Markets, Eyes Growth`,
      ],
      negative: [
        `${symbol} Faces Regulatory Scrutiny Over Practices`,
        `${symbol} Misses Revenue Targets, Shares Dip`,
        `Concerns Rise Over ${symbol}'s Competitive Position`,
        `${symbol} Announces Layoffs Amid Restructuring`,
      ],
      neutral: [
        `${symbol} to Host Investor Day Next Month`,
        `${symbol} Stock Trades Sideways Ahead of Announcement`,
        `What to Expect From ${symbol}'s Upcoming Earnings`,
        `${symbol} Maintains Guidance Despite Market Volatility`,
      ]
    };

    for (let i = 0; i < count; i++) {
      const sentiment = Math.random() > 0.5 ? 'positive' : Math.random() > 0.4 ? 'negative' : 'neutral';
      const headline = headlines[sentiment][Math.floor(Math.random() * headlines[sentiment].length)];
      
      news.push({
        id: `news_${uuidv4().slice(0, 8)}`,
        headline,
        summary: headline + ' More details to follow as the story develops.',
        source: sources[Math.floor(Math.random() * sources.length)],
        url: `https://example.com/news/${uuidv4().slice(0, 8)}`,
        importance: importances[Math.floor(Math.random() * importances.length)],
        engagement: Math.floor(Math.random() * 50000),
        publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      });
    }

    return news;
  }

  /**
   * Start streaming data (mock implementation)
   */
  static startStreaming(symbols, callback, intervalMs = 60000) {
    const stream = {
      symbols,
      interval: intervalMs,
      running: false,
      intervalId: null
    };

    stream.running = true;
    stream.intervalId = setInterval(async () => {
      if (!stream.running) return;

      for (const symbol of symbols) {
        try {
          const data = await this.fetchAllSources(symbol, { limit: 10 });
          callback(symbol, data);
        } catch (e) {
          console.error(`Stream error for ${symbol}:`, e.message);
        }
      }
    }, intervalMs);

    return stream;
  }

  /**
   * Stop streaming
   */
  static stopStreaming(stream) {
    if (stream && stream.intervalId) {
      stream.running = false;
      clearInterval(stream.intervalId);
    }
  }
}

module.exports = DataIngestionService;
