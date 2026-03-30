//+------------------------------------------------------------------+
//|                                                Config.mqh         |
//|                                          AutoSena Trading Platform |
//+------------------------------------------------------------------+
#property copyright "AutoSena Trading Platform"
#property link      "https://autosena.com"
#property version   "1.20"
#property strict

#ifndef CONFIG_MQH
#define CONFIG_MQH

//====================================================================
// EA CONFIGURATION - UPDATE THESE VALUES
//====================================================================

// Backend API URL (include /api suffix)
#define CONNECTOR_URL "http://localhost:3000/api"

// Secret key (must match backend MT_CONNECTOR_SECRET)
#define CONNECTOR_SECRET "ea-secret-key"

// EA Instance ID (leave empty for auto-generate on init)
#define EA_ID ""

// Trading comment for signal tracking
#define TRADE_COMMENT "AutoSena_EA"

//====================================================================
// INTERVALS (in seconds)
//====================================================================

// Heartbeat interval (60 = 1 minute)
#define HEARTBEAT_INTERVAL 60

// Performance report interval (300 = 5 minutes)
#define PERFORMANCE_INTERVAL 300

// Signal check interval (30 = 30 seconds)
#define SIGNAL_CHECK_INTERVAL 30

//====================================================================
// ADVANCED SETTINGS
//====================================================================

// WebRequest timeout (milliseconds)
#define REST_TIMEOUT 5000

// Max signals to store locally
#define MAX_SIGNALS 10000

// Max performance records to store
#define MAX_PERFORMANCE 10000

#endif
