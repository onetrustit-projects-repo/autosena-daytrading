# Real-Time Social Sentiment Trading Signals

## Overview
Aggregate sentiment from Twitter/X, Reddit, and financial news into actionable trading signals. Visual sentiment dashboard, automated alerts for sentiment shifts, and integration with trade execution.

## Architecture

### Backend (Node.js + Express + SQLite)
- **Sentiment Analysis Engine**: NLP-based financial sentiment analysis
- **Signal Generation Service**: Generate BUY/SELL signals from sentiment
- **Alert Service**: Threshold-based alerts for sentiment changes
- **Data Ingestion Service**: Pipeline for Twitter, Reddit, news data

### Frontend (React + Tailwind)
- **Sentiment Dashboard**: Real-time sentiment visualization with gauges
- **Signals Feed**: Trading signals with confidence scores
- **Alerts Management**: Create, view, acknowledge alerts

## Key Features

### Sentiment Analysis
- Financial lexicon-based sentiment scoring
- Engagement-weighted sentiment calculation
- Source breakdown (Twitter, Reddit, News)
- Market-wide sentiment aggregation

### Signal Generation
- BUY/SELL signals from sentiment thresholds
- Sentiment shift detection
- Composite signals from multiple sources
- Confidence scoring based on volume

### Alerting System
- Threshold alerts (above/below sentiment values)
- Sentiment shift alerts
- Real-time notifications
- Alert acknowledgment workflow

## API Endpoints

### Sentiment
- `GET /api/sentiment/:symbol` - Get aggregated sentiment
- `GET /api/sentiment/:symbol/shift` - Detect sentiment shift
- `GET /api/sentiment/market/overview` - Market-wide sentiment
- `POST /api/sentiment/analyze` - Analyze text directly

### Signals
- `GET /api/signals` - Get active signals
- `GET /api/signals/history` - Signals history
- `POST /api/signals/generate` - Generate new signal
- `POST /api/signals/scan` - Scan for new signals

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert
- `POST /api/alerts/check` - Check alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert

## Research Backing
- Real-time sentiment analysis from social media identified as emerging tech
- Retail trader power demonstrated by social media-driven market movements
- Automation reduces friction in manual analysis workflows
