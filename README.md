# Leaderboard and Gamification System

## Overview
Competition leaderboards with daily, weekly, monthly rankings for day traders. Achievement badges, streak tracking, and social proof features. Rewards for top performers.

## Architecture

### Backend (Express.js + SQLite)
- **Leaderboard Engine**: Risk-adjusted ranking calculation (Sharpe ratio, Sortino ratio, max drawdown, win rate)
- **Achievement System**: Badge definitions, unlock logic, progress tracking
- **Streak Tracking**: Consecutive profitable days, weekly/monthly streaks
- **Rewards Engine**: Platform credits, featured placement, achievement unlocks
- **Social Proof**: Follower counts, copy trading signals, performance history

### Frontend (React + TypeScript)
- **Leaderboard Page**: Tabbed daily/weekly/monthly views, risk metrics display
- **Achievements Page**: Badge gallery, progress bars, unlock animations
- **Profile Page**: Stats dashboard, streak calendar, share achievements
- **Rewards Page**: Credit balance, redemption options, leaderboard rewards

## Risk-Adjusted Metrics

### Sharpe Ratio
```
(Return - Risk-Free Rate) / Standard Deviation of Returns
```
Benchmark: 1.5+ is good, 2.0+ is excellent

### Sortino Ratio
```
(Return - Target Return) / Downside Deviation
```
Only considers negative volatility

### Max Drawdown
```
(Max Peak - Trough) / Max Peak
```
Largest peak-to-trough decline

### Win Rate
```
Profitable Trades / Total Trades
```

## Achievement Categories

1. **Profit Milestones**: $100, $500, $1K, $5K, $10K profit
2. **Streak Achievements**: 3, 5, 10, 25 consecutive profitable days
3. **Risk Management**: Maintain <5% drawdown for 30 days
4. **Consistency**: Execute 100, 500, 1000 trades
5. **Social**: Get 10, 50, 100 followers

## API Endpoints

- `GET /api/leaderboard?period=daily|weekly|monthly` - Get rankings
- `GET /api/leaderboard/user/:userId` - Get user rank + stats
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/user/:userId` - User's earned badges
- `POST /api/achievements/progress` - Update progress
- `GET /api/streaks/user/:userId` - Get streak data
- `GET /api/rewards/user/:userId` - Get rewards/credits
- `POST /api/rewards/claim` - Claim leaderboard reward

## Social Sharing

- Share achievement badges (OG images)
- Share rank changes
- Follow/unfollow traders
