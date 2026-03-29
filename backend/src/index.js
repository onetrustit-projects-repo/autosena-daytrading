const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database
require('./models/schema');

// Routes
const signalsRoutes = require('./api/signals');
const sentimentRoutes = require('./api/sentiment');
const alertsRoutes = require('./api/alerts');

app.use('/api/signals', signalsRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/alerts', alertsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sentiment-signals-api' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Sentiment Signals API running on port ${PORT}`);
});

module.exports = app;
