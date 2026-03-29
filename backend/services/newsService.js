/**
 * News Service
 * Captures news context around trade times
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

class NewsService {
  constructor() {
    this.newsDatabase = this.initializeNewsDatabase();
  }

  initializeNewsDatabase() {
    // Simulated news database
    // In production, would integrate with news APIs (Alpha Vantage, Finnhub, etc.)
    return [
      { id: 1, title: 'Colombian peso weakens against USD', impact: 0.7, sector: 'fx' },
      { id: 2, title: 'SENA reports quarterly earnings beat', impact: 0.9, sector: 'equity' },
      { id: 3, title: 'Central Bank maintains interest rates', impact: 0.6, sector: 'macro' },
      { id: 4, title: 'Commodities prices surge on supply concerns', impact: 0.8, sector: 'commodity' },
      { id: 5, title: 'Local markets see increased volatility', impact: 0.5, sector: 'market' }
    ];
  }

  /**
   * Get news around a specific time
   */
  async getNewsAroundTime(timestamp) {
    // Simulated - would query news API for actual news around timestamp
    const relevantNews = this.newsDatabase.filter(() => Math.random() > 0.6);
    return relevantNews.map(n => ({
      ...n,
      timestamp: timestamp,
      title: n.title
    }));
  }

  /**
   * Get news for a specific symbol
   */
  async getNewsForSymbol(symbol, limit = 10) {
    // Simulated - would query news API
    const news = [];
    for (let i = 0; i < limit; i++) {
      const article = this.newsDatabase[Math.floor(Math.random() * this.newsDatabase.length)];
      news.push({
        ...article,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
        title: `${symbol}: ${article.title}`
      });
    }
    return news;
  }

  /**
   * Calculate news impact score
   */
  calculateNewsImpact(newsItems) {
    return newsItems.reduce((sum, news) => sum + news.impact, 0);
  }
}

module.exports = new NewsService();
