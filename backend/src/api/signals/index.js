const express = require('express');
const router = express.Router();
const SignalGenerationService = require('../../services/signalGenerationService');
const SentimentAnalysisService = require('../../services/sentimentAnalysisService');

// GET /api/signals - Get active signals
router.get('/', (req, res) => {
  try {
    const { symbol, limit = 20 } = req.query;
    const signals = SignalGenerationService.getActiveSignals(symbol, parseInt(limit));
    res.json({ signals });
  } catch (error) {
    console.error('Signals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// GET /api/signals/history - Get signals history
router.get('/history', (req, res) => {
  try {
    const { symbol, startDate, endDate, limit = 100 } = req.query;
    const signals = SignalGenerationService.getSignalsHistory(symbol, startDate, endDate, parseInt(limit));
    res.json({ signals });
  } catch (error) {
    console.error('Signals history error:', error);
    res.status(500).json({ error: 'Failed to fetch signals history' });
  }
});

// GET /api/signals/performance - Get signal performance stats
router.get('/performance', (req, res) => {
  try {
    const { symbol, days = 30 } = req.query;
    const stats = SignalGenerationService.getSignalPerformance(symbol, parseInt(days));
    res.json({ stats });
  } catch (error) {
    console.error('Signal performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

// POST /api/signals/generate - Generate a new signal
router.post('/generate', (req, res) => {
  try {
    const { symbol, sources, price } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }

    // Get sentiment data
    const sentiment = SentimentAnalysisService.getAggregatedSentiment(symbol, '15m');
    
    if (!sentiment || sentiment.volume === 0) {
      return res.status(400).json({ error: 'Insufficient data to generate signal' });
    }

    let signal;
    if (sources && sources.length > 1) {
      signal = SignalGenerationService.generateCompositeSignal(symbol, sources, price || 100);
    } else {
      signal = SignalGenerationService.generateSignal(symbol, sentiment, price || 100);
    }

    if (!signal) {
      return res.status(400).json({ error: 'No signal generated (neutral sentiment)' });
    }

    res.json({ signal });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

// POST /api/signals/scan - Scan for new signals
router.post('/scan', (req, res) => {
  try {
    const { priceData } = req.body;
    const signals = SignalGenerationService.scanForSignals(priceData || {});
    res.json({ signals, count: signals.length });
  } catch (error) {
    console.error('Signal scan error:', error);
    res.status(500).json({ error: 'Failed to scan for signals' });
  }
});

// POST /api/signals/:signalId/execute - Mark signal as executed
router.post('/:signalId/execute', (req, res) => {
  try {
    const { signalId } = req.params;
    const { profitLoss } = req.body;
    
    const signal = SignalGenerationService.executeSignal(signalId, profitLoss);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json({ success: true, signal });
  } catch (error) {
    console.error('Signal execute error:', error);
    res.status(500).json({ error: 'Failed to execute signal' });
  }
});

// GET /api/signals/:signalId - Get specific signal
router.get('/:signalId', (req, res) => {
  try {
    const { signalId } = req.params;
    const signal = SignalGenerationService.getSignal(signalId);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json({ signal });
  } catch (error) {
    console.error('Signal fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
});

module.exports = router;
