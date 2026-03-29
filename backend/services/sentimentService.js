/**
 * Sentiment Service
 * NLP-based market sentiment analysis
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

class SentimentService {
  constructor() {
    this.sentimentCache = new Map();
  }

  /**
   * Get sentiment for a symbol at a specific time
   */
  async getSentiment(symbol, timestamp) {
    const cacheKey = `${symbol}_${Math.floor(timestamp / 300000)}`; // 5-min buckets
    const cached = this.sentimentCache.get(cacheKey);
    if (cached) return cached;

    // Simulated sentiment analysis
    // In production, would use BERT/transformer models for financial sentiment
    const sentiment = {
      symbol,
      score: (Math.random() * 2 - 1), // -1 to 1
      label: this.scoreToLabel(Math.random() * 2 - 1),
      confidence: Math.random() * 0.3 + 0.7,
      components: {
        bullish: Math.random(),
        bearish: Math.random(),
        neutral: Math.random()
      }
    };

    this.sentimentCache.set(cacheKey, sentiment);
    return sentiment;
  }

  /**
   * Convert numerical score to label
   */
  scoreToLabel(score) {
    if (score > 0.7) return 'extremely_bullish';
    if (score > 0.3) return 'bullish';
    if (score > -0.3) return 'neutral';
    if (score > -0.7) return 'bearish';
    return 'extremely_bearish';
  }

  /**
   * Get sentiment history for a symbol
   */
  async getSentimentHistory(symbol, days = 7) {
    const history = [];
    const now = Date.now();
    
    for (let i = 0; i < days * 24; i++) {
      const timestamp = now - i * 3600000;
      const sentiment = await this.getSentiment(symbol, timestamp);
      history.push({
        timestamp,
        ...sentiment
      });
    }
    
    return history.reverse();
  }
}

module.exports = new SentimentService();
