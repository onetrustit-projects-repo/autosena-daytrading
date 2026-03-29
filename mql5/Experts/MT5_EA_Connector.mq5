//+------------------------------------------------------------------+
//|                                      MT5_EA_Connector.mq5         |
//|                                          AutoSena Trading Platform |
//+------------------------------------------------------------------+
#property copyright "AutoSena Trading Platform"
#property link      "https://autosena.com"
#property version   "1.00"
#property strict

#include <MQL5_REST_Client.mqh>

// EA Configuration
string CONFIG_URL = "http://localhost:3000/api";
string CONFIG_SECRET = "ea-secret-key";
string CONFIG_EA_ID = "";

// Global state
datetime g_lastHeartbeat = 0;
datetime g_lastPerformanceReport = 0;
const int HEARTBEAT_INTERVAL = 60;
const int PERFORMANCE_INTERVAL = 300;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("MT5 EA Connector initializing...");
    
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
    Print("MT5 EA Connector initialized successfully");
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
    
    if(now - g_lastHeartbeat >= HEARTBEAT_INTERVAL)
    {
        SendHeartbeat();
    }
    
    if(now - g_lastPerformanceReport >= PERFORMANCE_INTERVAL)
    {
        SendPerformanceReport();
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
        "\"version\":\"1.00\","
        "\"symbols\":[\"" + _Symbol + "\"]"
        "}";
    
    string response;
    int responseCode = client.Post(CONFIG_URL + "/ea/register", postData, headers, response);
    return (responseCode == 200 || responseCode == 201);
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
    client.Delete(CONFIG_URL + "/ea/" + CONFIG_EA_ID, headers, response);
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
    
    if(responseCode == 200)
    {
        g_lastPerformanceReport = TimeCurrent();
    }
    else
    {
        Print("Performance report failed. Code: ", responseCode);
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
    return ((balance - equity) / balance) * 100;
}

//+------------------------------------------------------------------+
double CalculateSharpeRatio()
{
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    return (balance > 0) ? (AccountInfoDouble(ACCOUNT_EQUITY) - balance) / balance : 0;
}
//+------------------------------------------------------------------+
