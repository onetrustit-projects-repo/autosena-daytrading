# Expert Advisor Integration for MetaTrader Strategies

Integration layer for importing and executing MetaTrader 4/5 Expert Advisors within the AutoSena trading platform. Provides unified execution monitoring and performance reporting across MT and native strategies.

## Overview

This integration enables:
- **EA Registration & Heartbeat**: Auto-connect MetaTrader EAs to the platform
- **Trade Signal Capture**: Capture and store trade signals from EAs in real-time
- **Performance Metrics**: Track equity, balance, drawdown, win rate, and more
- **Unified Dashboard**: Monitor all connected EAs from a single interface

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MetaTrader    │────▶│   EA Connector  │────▶│   Backend API   │
│   4/5 Terminal  │     │   (MQL5)        │     │   (Express)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                        │
                        ┌─────────────────┐              │
                        │   Frontend      │◀─────────────┘
                        │   Dashboard     │
                        └─────────────────┘
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. MetaTrader EA Setup

1. Copy files from `/mql5` to your MT5 `MQL5/` directory:
   ```
   MQL5/
   ├── Experts/
   │   └── MT5_EA_Connector.mq5
   └── Include/
       └── MQL5_REST_Client.mqh
   ```

2. Open MetaEditor and compile `MT5_EA_Connector.mq5`

3. Attach to a chart and configure:
   ```mql5
   // Input parameters
   CONFIG_URL = "http://localhost:3000/api";  // Your backend URL
   CONFIG_SECRET = "ea-secret-key";           // Must match backend
   CONFIG_EA_ID = "";                          // Auto-generated if empty
   ```

4. Enable WebRequest in MT5:
   - Tools → Options → Expert Advisors
   - Check "Allow WebRequest for listed URL"
   - Add your backend URL

## API Endpoints

All endpoints require `X-Connector-Secret` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ea/register` | Register new EA instance |
| GET | `/api/ea` | List all registered EAs |
| GET | `/api/ea/:id` | Get EA details |
| POST | `/api/ea/:id/heartbeat` | EA heartbeat/keepalive |
| POST | `/api/ea/:id/signals` | Submit trade signals |
| GET | `/api/ea/:id/signals` | Get EA signal history |
| GET | `/api/ea/:id/signals/stats` | Get signal statistics |
| POST | `/api/ea/:id/performance` | Submit performance metrics |
| GET | `/api/ea/:id/performance` | Get performance history |
| GET | `/api/ea/:id/performance/summary` | Get performance summary |
| DELETE | `/api/ea/:id` | Deregister EA |

### Example: Register EA

```bash
curl -X POST http://localhost:3000/api/ea/register \
  -H "Content-Type: application/json" \
  -H "X-Connector-Secret: ea-secret-key" \
  -d '{
    "ea_id": "EA001_EURUSD_H1_12345",
    "account_id": "12345",
    "broker": "BrokerName",
    "currency": "USD",
    "balance": 10000.00,
    "platform": "MT5",
    "version": "1.20",
    "symbols": ["EURUSD", "GBPUSD"]
  }'
```

### Example: Submit Signal

```bash
curl -X POST http://localhost:3000/api/ea/EA001_EURUSD_H1_12345/signals \
  -H "Content-Type: application/json" \
  -H "X-Connector-Secret: ea-secret-key" \
  -d '{
    "symbol": "EURUSD",
    "type": "BUY",
    "volume": 0.1,
    "price": 1.0850,
    "ticket": 123456,
    "reason": "ea_signal",
    "timestamp": "2024-01-15T10:30:00"
  }'
```

### Example: Submit Performance

```bash
curl -X POST http://localhost:3000/api/ea/EA001_EURUSD_H1_12345/performance \
  -H "Content-Type: application/json" \
  -H "X-Connector-Secret: ea-secret-key" \
  -d '{
    "balance": 10500.00,
    "equity": 10450.00,
    "total_profit": 600.00,
    "total_loss": 150.00,
    "net_profit": 450.00,
    "winning_trades": 12,
    "losing_trades": 5,
    "win_rate": 70.5,
    "max_drawdown": 3.2,
    "sharpe_ratio": 1.45
  }'
```

## Configuration

### Backend (.env)

```env
PORT=3000
MT_CONNECTOR_SECRET=your-secret-key
NODE_ENV=development
```

### MQL5 EA (MT5_EA_Connector.mq5)

```mql5
// EA Configuration
string CONFIG_URL = "http://localhost:3000/api";
string CONFIG_SECRET = "ea-secret-key";
string CONFIG_EA_ID = "";
```

## Dashboard Features

- **EA List**: View all connected Expert Advisors with status
- **Overview Tab**: Quick stats, signal distribution, recent signals
- **Signals Tab**: Full trade signal history with filtering
- **Performance Tab**: Trading summary, P/L analysis, risk metrics

## Security

- All API requests require `X-Connector-Secret` header matching `MT_CONNECTOR_SECRET`
- Rate limiting: 100 requests/minute per IP
- EA instances must be registered before sending data
- WebRequest requires explicit URL allowance in MT terminal

## Data Flow

1. **EA Registration**: On init, EA calls `/api/ea/register` with account info
2. **Heartbeat**: Every 60 seconds, EA sends account state
3. **Signal Capture**: Every 30 seconds, EA checks for new trades and reports
4. **Performance**: Every 5 minutes, EA sends performance metrics
5. **Deregistration**: On deinit, EA calls DELETE endpoint

## Development

### Run Backend
```bash
cd backend
npm run dev
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Test API
```bash
# Health check
curl http://localhost:3000/health

# List EAs
curl http://localhost:3000/api/ea \
  -H "X-Connector-Secret: ea-secret-key"
```

## Troubleshooting

### EA not connecting?
1. Check backend is running on correct port
2. Verify `CONFIG_URL` matches your backend
3. Ensure WebRequest is enabled in MT5 options
4. Check terminal allows the URL in Expert Advisors settings

### Signals not appearing?
1. Verify EA is registered (`/api/ea` shows your EA)
2. Check EA comment includes "AutoSena_EA" for signal tracking
3. Look at backend console for signal reception logs

### Performance metrics empty?
1. EA sends performance every 5 minutes
2. Wait for the first PERFORMANCE_INTERVAL cycle
3. Check backend logs for "Performance received"

## References

- [MetaTrader 5 WebRequest](https://www.mql5.com/en/docs/webrequest)
- [MQL5 REST Client](https://www.mql5.com/en/docs/network/restclient)
- [MT5 Trading Signals](https://www.mql5.com/en/docs/trading/signals)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)

---

**Task ID**: 12e9415f-8820-4704-984b-384c0d0487b2  
**Version**: 1.20
