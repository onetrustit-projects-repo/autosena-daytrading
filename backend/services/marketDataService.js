/**
 * Market Data Service
 * Provides market context data for trade enrichment
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Get volatility data for a symbol
   */
  async getVolatility(symbol) {
    const cacheKey = `volatility_${symbol}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Simulated volatility data
    // In production, would integrate with real market data API
    const volatility = {
      symbol,
      current: Math.random() * 30 + 10, // 10-40% implied volatility
      historical: Math.random() * 25 + 5,
      high: Math.random() * 50 + 20,
      low: Math.random() * 15 + 5,
      rising: Math.random() > 0.5,
      high: Math.random() > 0.7,
      low: Math.random() < 0.3
    };

    this.setCached(cacheKey, volatility);
    return volatility;
  }

  /**
   * Get volume profile for a symbol
   */
  async getVolumeProfile(symbol) {
    const cacheKey = `volume_${symbol}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const avgVolume = Math.random() * 1000000 + 500000;
    const volume = {
      symbol,
      today: Math.random() * avgVolume * 1.5,
      average: avgVolume,
      aboveAverage: Math.random() > 0.5,
      bidVolume: Math.random() * avgVolume * 0.6,
      askVolume: Math.random() * avgVolume * 0.6
    };

    this.setCached(cacheKey, volume);
    return volume;
  }

  /**
   * Get support and resistance levels
   */
  async getSupportResistance(symbol) {
    const cacheKey = `sr_${symbol}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const currentPrice = Math.random() * 200 + 50;
    const levels = {
      symbol,
      support: currentPrice * (1 - Math.random() * 0.05),
      resistance: currentPrice * (1 + Math.random() * 0.05),
      support2: currentPrice * (1 - Math.random() * 0.10),
      resistance2: currentPrice * (1 + Math.random() * 0.10),
      pivot: currentPrice
    };

    this.setCached(cacheKey, levels);
    return levels;
  }

  /**
   * Get market phase classification
   */
  async getMarketPhase(symbol) {
    const [volatility, volume] = await Promise.all([
      this.getVolatility(symbol),
      this.getVolumeProfile(symbol)
    ]);

    if (volatility.high && volume.aboveAverage) return 'volatile';
    if (volatility.low && !volume.aboveAverage) return 'quiet';
    if (volatility.rising) return 'trending_up';
    if (volatility.falling) return 'trending_down';
    
    return 'ranging';
  }

  /**
   * Cache management
   */
  getCached(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

module.exports = new MarketDataService();
