# Expert Advisor Integration for MetaTrader Strategies

Integration layer for importing and executing MetaTrader 4/5 Expert Advisors within the AutoSena trading platform. Provides unified execution monitoring and performance reporting across MT and native strategies.

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

## Components

### 1. MQL5 EA Connector (`/mql5`)
- WebRequest-based communication with backend API
- Trade signal generation and reporting
- Performance metrics telemetry
- Supports MT4/MT5 terminals

### 2. Backend API (`/backend`)
- REST API for EA registration and management
- Performance data ingestion endpoints
- Signal normalization layer
- Historical performance storage

### 3. Frontend Dashboard (`/frontend`)
- Real-time EA performance monitoring
- Multi-EA portfolio view
- Performance metrics and charts
- Signal execution history

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ea/register` | Register new EA instance |
| POST | `/api/ea/:id/heartbeat` | EA heartbeat/keepalive |
| POST | `/api/ea/:id/signals` | Submit trade signals |
| POST | `/api/ea/:id/performance` | Submit performance metrics |
| GET | `/api/ea` | List all registered EAs |
| GET | `/api/ea/:id` | Get EA details |
| GET | `/api/ea/:id/performance` | Get EA performance history |
| GET | `/api/ea/:id/signals` | Get EA signal history |

## Configuration

### Backend Environment
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/autosena
MT_CONNECTOR_SECRET=your-secret-key
```

### EA Configuration (mql5/Config.mqh)
```mql5
#property connector_url "http://your-server:3000/api"
#property connector_secret "your-secret-key"
#property ea_id "unique-ea-instance-id"
```

## Installation

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### MetaTrader EA
1. Copy files from `/mql5` to your MT5 `MQL5/Experts/` folder
2. Compile in MetaEditor
3. Attach to chart with proper configuration

## Security

- All API requests require `X-Connector-Secret` header
- EA instances must be registered before sending data
- Rate limiting: 100 requests/minute per EA
- WebRequest requires explicit URL allowance in MT terminal

## References

- [MetaTrader 5 WebRequest](https://www.mql5.com/en/docs/webrequest)
- [MQL5 REST Client](https://www.mql5.com/en/docs/network/restclient)
- [MT5 Trading Signals](https://www.mql5.com/en/docs/trading/signals)

---

Task: 12e9415f-8820-4704-984b-384c0d0487b2
