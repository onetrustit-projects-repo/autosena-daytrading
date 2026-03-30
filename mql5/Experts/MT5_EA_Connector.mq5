//+------------------------------------------------------------------+
//|                                      MT5_EA_Connector.mq5         |
//|                                          AutoSena Trading Platform |
//+------------------------------------------------------------------+
#property copyright "AutoSena Trading Platform"
#property link      "https://autosena.com"
#property version   "1.20"
#property strict

#include <MQL5_REST_Client.mqh>

// EA Configuration - Update these before compiling
string CONFIG_URL = "http://localhost:3000/api";
string CONFIG_SECRET = "ea-secret-key";
string CONFIG_EA_ID = "";

// Global state
datetime g_lastHeartbeat = 0;
datetime g_lastPerformanceReport = 0;
datetime g_lastSignalReport = 0;
const int HEARTBEAT_INTERVAL = 60;       // 1 minute
const int PERFORMANCE_INTERVAL = 300;    // 5 minutes
const int SIGNAL_REPORT_INTERVAL = 30;   // 30 seconds (report new trades)

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("MT5 EA Connector v1.20 initializing...");
    
    if(CONFIG_EA_ID == "")
    {
        CONFIG_EA_ID = GenerateEAId();
        Print("Generated EA ID: ", CONFIG_EA_ID);
    }
    
    if(!RegisterEA())
    {
        Print("ERROR: Failed to register EA with backend");
        return INIT_FAILED;
    }
    
    SendHeartbeat();
    SendPerformanceReport();
    
    Print("MT5 EA Connector initialized successfully");
    Print("EA ID: ", CONFIG_EA_ID);
    Print("Backend URL: ", CONFIG_URL);
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    Print("MT5 EA Connector shutting down...");
    SendPerformanceReport();
    DeregisterEA();
}

//+------------------------------------------------------------------+
void OnTick()
{
    datetime now = TimeCurrent();
    
    // Heartbeat every minute
    if(now - g_lastHeartbeat >= HEARTBEAT_INTERVAL)
    {
        SendHeartbeat();
    }
    
    // Performance report every 5 minutes
    if(now - g_lastPerformanceReport >= PERFORMANCE_INTERVAL)
    {
        SendPerformanceReport();
    }
    
    // Check for new trades and report signals every 30 seconds
    if(now - g_lastSignalReport >= SIGNAL_REPORT_INTERVAL)
    {
        CheckAndReportNewTrades();
        g_lastSignalReport = now;
    }
}

//+------------------------------------------------------------------+
string GenerateEAId()
{
    string accountId = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    string symbol = _Symbol;
    string timeframe = EnumToString(_Period);
    string timestamp = IntegerToString(GetTickCount());
    return accountId + "_" + symbol + "_" + timeframe + "_" + timestamp;
}

//+------------------------------------------------------------------+
bool RegisterEA()
{
    C_RESTClient client;
    
    string headers[] = {
        "Content-Type: application/json",
        "X-Connector-Secret: " + CONFIG_SECRET,
        "X-EA-ID: " + CONFIG_EA_ID
    };
    
    string postData = "{"
        "\"ea_id\":\"" + CONFIG_EA_ID + "\","
        "\"account_id\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\","
        "\"broker\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\","
        "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\","
        "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
        "\"platform\":\"MT5\","
        "\"version\":\"1.20\","
        "\"symbols\":[\"" + _Symbol + "\"]"
        "}";
    
    string response;
    int responseCode = client.Post(CONFIG_URL + "/ea/register", postData, headers, response);
    
    if(responseCode == 200 || responseCode == 201)
    {
        Print("EA registered successfully with backend");
        return true;
    }
    else
    {
        Print("EA registration failed. Response code: ", responseCode);
        Print("Response: ", response);
        return false;
    }
}

//+------------------------------------------------------------------+
void DeregisterEA()
{
    C_RESTClient client;
    string headers[] = {
        "X-Connector-Secret: " + CONFIG_SECRET,
        "X-EA-ID: " + CONFIG_EA_ID
    };
    string response;
    int res = client.Delete(CONFIG_URL + "/ea/" + CONFIG_EA_ID, headers, response);
    Print("Deregister response: ", res);
}

//+------------------------------------------------------------------+
void SendHeartbeat()
{
    C_RESTClient client;
    
    string headers[] = {
        "Content-Type: application/json",
        "X-Connector-Secret: " + CONFIG_SECRET,
        "X-EA-ID: " + CONFIG_EA_ID
    };
    
    string postData = "{"
        "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\","
        "\"account_balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
        "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ","
        "\"margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ","
        "\"free_margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_SO), 2) + ","
        "\"open_positions\":" + IntegerToString(PositionsTotal()) + ","
        "\"pending_orders\":" + IntegerToString(OrdersTotal())
        "}";
    
    string response;
    int responseCode = client.Post(CONFIG_URL + "/ea/" + CONFIG_EA_ID + "/heartbeat", postData, headers, response);
    
    if(responseCode == 200)
    {
        g_lastHeartbeat = TimeCurrent();
    }
    else
    {
        Print("Heartbeat failed. Code: ", responseCode);
    }
}

//+------------------------------------------------------------------+
void SendPerformanceReport()
{
    C_RESTClient client;
    
    string headers[] = {
        "Content-Type: application/json",
        "X-Connector-Secret: " + CONFIG_SECRET,
        "X-EA-ID: " + CONFIG_EA_ID
    };
    
    double totalProfit = CalculateTotalProfit();
    double totalLoss = CalculateTotalLoss();
    int winningTrades = CountWinningTrades();
    int losingTrades = CountLosingTrades();
    double winRate = (winningTrades + losingTrades > 0) ? 
        (double)winningTrades / (winningTrades + losingTrades) * 100 : 0;
    
    string postData = "{"
        "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\","
        "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
        "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ","
        "\"total_profit\":" + DoubleToString(totalProfit, 2) + ","
        "\"total_loss\":" + DoubleToString(totalLoss, 2) + ","
        "\"net_profit\":" + DoubleToString(totalProfit - totalLoss, 2) + ","
        "\"winning_trades\":" + IntegerToString(winningTrades) + ","
        "\"losing_trades\":" + IntegerToString(losingTrades) + ","
        "\"win_rate\":" + DoubleToString(winRate, 2) + ","
        "\"max_drawdown\":" + DoubleToString(CalculateMaxDrawdown(), 2) + ","
        "\"sharpe_ratio\":" + DoubleToString(CalculateSharpeRatio(), 2)
        "}";
    
    string response;
    int responseCode = client.Post(CONFIG_URL + "/ea/" + CONFIG_EA_ID + "/performance", postData, headers, response);
    
    if(responseCode == 200 || responseCode == 201)
    {
        g_lastPerformanceReport = TimeCurrent();
        Print("Performance report sent. Equity: ", AccountInfoDouble(ACCOUNT_EQUITY));
    }
    else
    {
        Print("Performance report failed. Code: ", responseCode);
    }
}

//+------------------------------------------------------------------+
//| Report new trades as signals                                      |
//+------------------------------------------------------------------+
void CheckAndReportNewTrades()
{
    // Track last known position tickets to detect new ones
    static int lastKnownTickets[];
    int currentTickets[];
    
    // Collect current position tickets
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(PositionGetSymbol(i) == _Symbol && PositionGetString(POSITION_COMMENT) == "AutoSena_EA")
        {
            ArrayResize(currentTickets, ArraySize(currentTickets) + 1);
            currentTickets[ArraySize(currentTickets) - 1] = (int)PositionGetInteger(POSITION_TICKET);
        }
    }
    
    // Find new positions (tickets not in lastKnownTickets)
    for(int i = 0; i < ArraySize(currentTickets); i++)
    {
        bool isNew = true;
        for(int j = 0; j < ArraySize(lastKnownTickets); j++)
        {
            if(currentTickets[i] == lastKnownTickets[j])
            {
                isNew = false;
                break;
            }
        }
        
        if(isNew)
        {
            ReportSignal(currentTickets[i]);
        }
    }
    
    // Update last known tickets
    ArrayCopy(lastKnownTickets, currentTickets);
}

//+------------------------------------------------------------------+
void ReportSignal(int ticket)
{
    if(!PositionSelectByTicket(ticket)) return;
    
    C_RESTClient client;
    
    string headers[] = {
        "Content-Type: application/json",
        "X-Connector-Secret: " + CONFIG_SECRET,
        "X-EA-ID: " + CONFIG_EA_ID
    };
    
    string type = "";
    switch((int)PositionGetInteger(POSITION_TYPE))
    {
        case POSITION_TYPE_BUY: type = "BUY"; break;
        case POSITION_TYPE_SELL: type = "SELL"; break;
    }
    
    string postData = "{"
        "\"symbol\":\"" + PositionGetSymbol(ticket) + "\","
        "\"type\":\"" + type + "\","
        "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ","
        "\"price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ","
        "\"ticket\":" + IntegerToString(ticket) + ","
        "\"reason\":\"ea_signal\","
        "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\""
        "}";
    
    string response;
    int responseCode = client.Post(CONFIG_URL + "/ea/" + CONFIG_EA_ID + "/signals", postData, headers, response);
    
    if(responseCode == 200 || responseCode == 201)
    {
        Print("Signal reported: ", type, " ", PositionGetSymbol(ticket), " volume: ", PositionGetDouble(POSITION_VOLUME));
    }
    else
    {
        Print("Signal report failed. Code: ", responseCode);
    }
}

//+------------------------------------------------------------------+
double CalculateTotalProfit()
{
    double total = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(PositionGetSymbol(i) == _Symbol)
        {
            total += PositionGetDouble(POSITION_PROFIT);
        }
    }
    return total;
}

//+------------------------------------------------------------------+
double CalculateTotalLoss()
{
    double total = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(PositionGetSymbol(i) == _Symbol)
        {
            double profit = PositionGetDouble(POSITION_PROFIT);
            if(profit < 0) total += MathAbs(profit);
        }
    }
    return total;
}

//+------------------------------------------------------------------+
int CountWinningTrades()
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(PositionGetSymbol(i) == _Symbol && PositionGetDouble(POSITION_PROFIT) > 0)
            count++;
    }
    return count;
}

//+------------------------------------------------------------------+
int CountLosingTrades()
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(PositionGetSymbol(i) == _Symbol && PositionGetDouble(POSITION_PROFIT) < 0)
            count++;
    }
    return count;
}

//+------------------------------------------------------------------+
double CalculateMaxDrawdown()
{
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity = AccountInfoDouble(ACCOUNT_EQUITY);
    if(balance <= 0) return 0;
    return ((balance - equity) / balance) * 100;
}

//+------------------------------------------------------------------+
double CalculateSharpeRatio()
{
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    if(balance <= 0) return 0;
    // Simplified Sharpe: return / balance as proxy
    return (AccountInfoDouble(ACCOUNT_EQUITY) - balance) / balance;
}

//+------------------------------------------------------------------+
//| Position select by ticket helper                                  |
//+------------------------------------------------------------------+
bool PositionSelectByTicket(ulong ticket)
{
    return PositionSelectByTicket((ulong)ticket);
}
//+------------------------------------------------------------------+
