import React, { useState } from 'react';

/**
 * Journal Settings
 * Configure trade capture and AI insights
 * Task: 9573d7bc-f0f7-41d5-b400-9f6f8569e8aa
 */

const JournalSettings = () => {
  const [settings, setSettings] = useState({
    autoCapture: true,
    captureNews: true,
    captureSentiment: true,
    aiInsightsLevel: 'detailed',
    notifications: {
      weeklyReport: true,
      tradeAlerts: false,
      patternAlerts: true
    },
    riskLimits: {
      maxDailyLoss: 500,
      maxPositionSize: 10000,
      maxTradesPerDay: 10
    }
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNestedToggle = (parent, key) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: !prev[parent][key]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Journal Settings</h1>

        {/* Auto-Capture Settings */}
        <section className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Auto-Capture</h2>
          <p className="text-gray-400 text-sm mb-4">
            Configure which data is automatically captured with each trade
          </p>
          
          <div className="space-y-4">
            <ToggleSetting 
              label="Auto-capture all trades"
              description="Automatically capture trades from execution logs"
              value={settings.autoCapture}
              onChange={() => handleToggle('autoCapture')}
            />
            
            <ToggleSetting 
              label="Capture news context"
              description="Attach relevant news headlines around trade time"
              value={settings.captureNews}
              onChange={() => handleToggle('captureNews')}
            />
            
            <ToggleSetting 
              label="Capture sentiment data"
              description="Record market sentiment at time of trade"
              value={settings.captureSentiment}
              onChange={() => handleToggle('captureSentiment')}
            />
          </div>
        </section>

        {/* AI Insights Settings */}
        <section className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">AI Insights</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Analysis Depth</label>
            <select 
              value={settings.aiInsightsLevel}
              onChange={(e) => setSettings(prev => ({ ...prev, aiInsightsLevel: e.target.value }))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
            >
              <option value="basic">Basic (Entry/Exit Analysis)</option>
              <option value="detailed">Detailed (Full Behavioral Analysis)</option>
              <option value="comprehensive">Comprehensive (Deep Learning Insights)</option>
            </select>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <ToggleSetting 
              label="Weekly performance report"
              description="Receive AI-generated weekly trading summary"
              value={settings.notifications.weeklyReport}
              onChange={() => handleNestedToggle('notifications', 'weeklyReport')}
            />
            
            <ToggleSetting 
              label="Trade alerts"
              description="Get notified of significant trades"
              value={settings.notifications.tradeAlerts}
              onChange={() => handleNestedToggle('notifications', 'tradeAlerts')}
            />
            
            <ToggleSetting 
              label="Pattern alerts"
              description="Alert when behavioral patterns are detected"
              value={settings.notifications.patternAlerts}
              onChange={() => handleNestedToggle('notifications', 'patternAlerts')}
            />
          </div>
        </section>

        {/* Risk Limits */}
        <section className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Risk Limits</h2>
          <p className="text-gray-400 text-sm mb-4">
            Set limits for self-protection (triggers journal analysis review)
          </p>
          
          <div className="space-y-4">
            <NumberSetting 
              label="Max daily loss"
              value={settings.riskLimits.maxDailyLoss}
              onChange={(val) => setSettings(prev => ({
                ...prev,
                riskLimits: { ...prev.riskLimits, maxDailyLoss: val }
              }))}
              prefix="$"
            />
            
            <NumberSetting 
              label="Max position size"
              value={settings.riskLimits.maxPositionSize}
              onChange={(val) => setSettings(prev => ({
                ...prev,
                riskLimits: { ...prev.riskLimits, maxPositionSize: val }
              }))}
              prefix="$"
            />
            
            <NumberSetting 
              label="Max trades per day"
              value={settings.riskLimits.maxTradesPerDay}
              onChange={(val) => setSettings(prev => ({
                ...prev,
                riskLimits: { ...prev.riskLimits, maxTradesPerDay: val }
              }))}
            />
          </div>
        </section>

        {/* Save Button */}
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
          onClick={() => alert('Settings saved!')}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

/**
 * Toggle Setting Component
 */
const ToggleSetting = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
        value ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  </div>
);

/**
 * Number Setting Component
 */
const NumberSetting = ({ label, value, onChange, prefix = '' }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
    <p className="font-medium">{label}</p>
    <div className="flex items-center gap-2">
      {prefix && <span className="text-gray-400">{prefix}</span>}
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 bg-gray-600 text-white px-3 py-1 rounded-lg text-right"
      />
    </div>
  </div>
);

export default JournalSettings;
