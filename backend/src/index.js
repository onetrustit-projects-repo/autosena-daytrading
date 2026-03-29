const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database
require('./models/schema');

// Routes
const leaderboardRoutes = require('./api/leaderboard');
const achievementsRoutes = require('./api/achievements');
const streaksRoutes = require('./api/streaks');
const rewardsRoutes = require('./api/rewards');
const usersRoutes = require('./api/users');

app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'leaderboard-api' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Leaderboard API running on port ${PORT}`);
});

module.exports = app;
