//+------------------------------------------------------------------+
//|                                              MQL5_REST_Client.mqh|
//|                                          AutoSena Trading Platform |
//+------------------------------------------------------------------+
#property copyright "AutoSena Trading Platform"
#property link      "https://autosena.com"
#property version   "1.00"
#property strict

#define REST_CLIENT_TIMEOUT 5000

class C_RESTClient
{
private:
    string m_lastError;

public:
    C_RESTClient() {};
    ~C_RESTClient() {};

    int Get(string url, string &headers[], string &response);
    int Post(string url, const string postData, string &headers[], string &response);
    int Put(string url, const string putData, string &headers[], string &response);
    int Delete(string url, string &headers[], string &response);

    string GetLastError() { return m_lastError; }
};

//+------------------------------------------------------------------+
int C_RESTClient::Get(string url, string &headers[], string &response)
{
    char post[];
    char result[];
    string resultHeaders;

    int res = WebRequest("GET", url, headers, REST_CLIENT_TIMEOUT, post, result, resultHeaders);
    
    if(res == -1)
    {
        m_lastError = "WebRequest failed. Check terminal settings.";
        return -1;
    }
    
    response = CharArrayToString(result);
    return res;
}

//+------------------------------------------------------------------+
int C_RESTClient::Post(string url, const string postData, string &headers[], string &response)
{
    char post[];
    StringToCharArray(postData, post, 0, StringLen(postData));
    char result[];
    string resultHeaders;

    int res = WebRequest("POST", url, headers, REST_CLIENT_TIMEOUT, post, result, resultHeaders);
    
    if(res == -1)
    {
        m_lastError = "WebRequest failed. Check terminal settings.";
        return -1;
    }
    
    response = CharArrayToString(result);
    return res;
}

//+------------------------------------------------------------------+
int C_RESTClient::Put(string url, const string putData, string &headers[], string &response)
{
    char post[];
    StringToCharArray(putData, post, 0, StringLen(putData));
    char result[];
    string resultHeaders;

    int res = WebRequest("PUT", url, headers, REST_CLIENT_TIMEOUT, post, result, resultHeaders);
    
    if(res == -1)
    {
        m_lastError = "WebRequest failed. Check terminal settings.";
        return -1;
    }
    
    response = CharArrayToString(result);
    return res;
}

//+------------------------------------------------------------------+
int C_RESTClient::Delete(string url, string &headers[], string &response)
{
    char post[];
    char result[];
    string resultHeaders;

    int res = WebRequest("DELETE", url, headers, REST_CLIENT_TIMEOUT, post, result, resultHeaders);
    
    if(res == -1)
    {
        m_lastError = "WebRequest failed. Check terminal settings.";
        return -1;
    }
    
    response = CharArrayToString(result);
    return res;
}

//+------------------------------------------------------------------+
