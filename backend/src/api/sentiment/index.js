const express = require('express');
const router = express.Router();
const SentimentAnalysisService = require('../../services/sentimentAnalysisService');
const DataIngestionService = require('../../services/dataIngestionService');

// GET /api/sentiment/:symbol - Get aggregated sentiment
router.get('/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1h' } = req.query;
    
    const sentiment = SentimentAnalysisService.getAggregatedSentiment(symbol.toUpperCase(), period);
    const breakdown = SentimentAnalysisService.getSourceBreakdown(symbol.toUpperCase(), period);
    
    res.json({ sentiment, breakdown });
  } catch (error) {
    console.error('Sentiment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment' });
  }
});

// GET /api/sentiment/:symbol/shift - Detect sentiment shift
router.get('/:symbol/shift', (req, res) => {
  try {
    const { symbol } = req.params;
    const { threshold = 0.3 } = req.query;
    
    const shift = SentimentAnalysisService.detectSentimentShift(symbol.toUpperCase(), parseFloat(threshold));
    
    if (!shift) {
      return res.json({ message: 'No data available for shift detection' });
    }

    res.json({ shift });
  } catch (error) {
    console.error('Sentiment shift error:', error);
    res.status(500).json({ error: 'Failed to detect shift' });
  }
});

// GET /api/sentiment/market - Get overall market sentiment
router.get('/market/overview', (req, res) => {
  try {
    const marketSentiment = SentimentAnalysisService.getMarketSentiment();
    res.json({ market: marketSentiment });
  } catch (error) {
    console.error('Market sentiment error:', error);
    res.status(500).json({ error: 'Failed to fetch market sentiment' });
  }
});

// POST /api/sentiment/:symbol/fetch - Fetch fresh data from sources
router.post('/:symbol/fetch', (req, res) => {
  try {
    const { symbol } = req.params;
    const { sources } = req.body;
    
    DataIngestionService.fetchAllSources(symbol.toUpperCase(), { sources })
      .then(data => {
        const sentiment = SentimentAnalysisService.getAggregatedSentiment(symbol.toUpperCase(), '15m');
        res.json({ success: true, sentiment, data });
      })
      .catch(error => {
        res.status(500).json({ error: 'Failed to fetch data: ' + error.message });
      });
  } catch (error) {
    console.error('Sentiment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment' });
  }
});

// POST /api/sentiment/analyze - Analyze text directly
router.post('/analyze', (req, res) => {
  try {
    const { text, symbol, marketPhase } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'text required' });
    }

    const analysis = SentimentAnalysisService.analyzeWithContext(
      text,
      symbol || 'UNKNOWN',
      marketPhase || 'NORMAL'
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// GET /api/sentiment/:symbol/history - Get sentiment history
router.get('/:symbol/history', (req, res) => {
  try {
    const { symbol } = req.params;
    const db = require('../../models/schema');
    
    const history = db.prepare(`
      SELECT * FROM aggregated_sentiment
      WHERE symbol = ?
      ORDER BY calculated_at DESC
      LIMIT 100
    `).all(symbol.toUpperCase());

    res.json({ history });
  } catch (error) {
    console.error('Sentiment history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
