// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

// Import our new components
import PromptInput from './components/PromptInput';
import ModelSelector from './components/ModelSelector';
import TestResults from './components/TestResults';
import apiService from './services/api';

function App() {
  // State Management
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['gpt-3.5-turbo']);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgCost: 0,
    successRate: 0,
    bestModel: '-'
  });
  const [summary, setSummary] = useState({});

  // Check backend connectivity on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Check if backend is accessible
  const checkBackendConnection = async () => {
    try {
      const isAccessible = await apiService.isBackendAccessible();
      if (!isAccessible) {
        setError('Unable to connect to backend. Please ensure the server is running on port 8000.');
      }
    } catch (err) {
      setError('Backend connection check failed');
    }
  };

  // Handle prompt testing
  const handlePromptTest = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.testPrompt({
        prompt: prompt,
        models: selectedModels,
        temperature: 0.7,
        maxTokens: 500
      });

      if (response.success) {
        setTestResults(response.results);
        setSummary(response.summary);
        updateStats(response);
      } else {
        setError(response.error || 'Test failed');
      }
    } catch (err) {
      setError(apiService.formatError(err));
      console.error('Error running test:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update statistics after successful test
  const updateStats = (data) => {
    const successful = data.results.filter(r => r.success);
    const successRate = Math.round((successful.length / data.results.length) * 100);
    const avgCost = data.summary?.totalCost || 0;
    const bestModel = successful.length > 0 ? successful[0].model : '-';

    setStats(prevStats => ({
      totalTests: prevStats.totalTests + 1,
      avgCost: parseFloat(avgCost),
      successRate: successRate,
      bestModel: bestModel
    }));
  };

  // Handle model selection toggle
  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  // Clear results and reset state
  const handleClearResults = () => {
    setTestResults([]);
    setSummary({});
    setError(null);
  };

  // Clear error messages
  const clearError = () => {
    setError(null);
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">
            🤖 Prompt Optimizer Platform
          </h1>
          <p className="app-subtitle">
            Compare and optimize AI prompts across multiple models
          </p>
        </div>
      </header>

      {/* Global Error Display */}
      {error && (
        <div className="global-error">
          <div className="container">
            <div className="error-message">
              <span>❌ {error}</span>
              <button onClick={clearError} className="error-close">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          <div className="main-grid">
            
            {/* Left Column - Input & Model Selection */}
            <div className="input-section">
              {/* Prompt Input Component */}
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onTest={handlePromptTest}
                loading={loading}
                disabled={false}
              />

              {/* Model Selection Component */}
              <ModelSelector
                selectedModels={selectedModels}
                onModelToggle={handleModelToggle}
                disabled={loading}
              />
            </div>

            {/* Right Column - Stats & Info */}
            <div className="stats-section">
              <div className="card">
                <h2>📊 Quick Stats</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{stats.totalTests}</div>
                    <div className="stat-label">Total Tests</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">${stats.avgCost.toFixed(4)}</div>
                    <div className="stat-label">Avg Cost</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.successRate}%</div>
                    <div className="stat-label">Success Rate</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.bestModel}</div>
                    <div className="stat-label">Recent Model</div>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="card">
                <h3>💡 Tips</h3>
                <ul className="tips-list">
                  <li>Use prompt templates for quick testing</li>
                  <li>Compare at least 2 models for best insights</li>
                  <li>GPT-3.5 is faster and cheaper for simple tasks</li>
                  <li>Claude excels at detailed analysis</li>
                  <li>Check response quality vs cost trade-offs</li>
                  <li>Export results for future reference</li>
                </ul>
              </div>

              {/* Backend Status */}
              <div className="card">
                <h3>🔧 System Status</h3>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-label">Backend:</span>
                    <span className={`status-indicator ${error ? 'error' : 'success'}`}>
                      {error ? '🔴 Disconnected' : '🟢 Connected'}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Models:</span>
                    <span className="status-indicator success">
                      🟢 Available
                    </span>
                  </div>
                </div>
                {error && (
                  <button 
                    onClick={checkBackendConnection}
                    className="btn btn-outline btn-sm"
                  >
                    🔄 Retry Connection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Test Results Component */}
          <TestResults
            results={testResults}
            loading={loading}
            onClear={handleClearResults}
            testPrompt={prompt}
            summary={summary}
          />
        </div>
      </main>
    </div>
  );
}

export default App;