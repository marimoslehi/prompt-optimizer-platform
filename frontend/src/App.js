// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  // State Management
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['gpt-3.5-turbo']);
  const [availableModels, setAvailableModels] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgCost: 0,
    successRate: 0,
    bestModel: '-'
  });

  // Fetch available models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // API Functions
  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableModels(data.models);
      } else {
        setError('Failed to load models');
      }
    } catch (err) {
      setError('Unable to connect to backend');
      console.error('Error fetching models:', err);
    }
  };

  const runPromptTest = async () => {
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
      const response = await fetch(`${API_BASE_URL}/api/prompts/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          models: selectedModels,
          temperature: 0.7,
          maxTokens: 500
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.results);
        updateStats(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError('Failed to run test');
      console.error('Error running test:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  const clearResults = () => {
    setTestResults([]);
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

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          <div className="main-grid">
            
            {/* Left Column - Input & Controls */}
            <div className="input-section">
              <div className="card">
                <h2>📝 Prompt Configuration</h2>
                
                {/* Prompt Input */}
                <div className="form-group">
                  <label htmlFor="prompt">Enter your prompt:</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Write your prompt here... e.g., 'Explain quantum computing in simple terms'"
                    rows={6}
                    className="prompt-textarea"
                  />
                  <div className="input-info">
                    <span className="char-count">{prompt.length} characters</span>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="form-group">
                  <label>Select Models to Test:</label>
                  <div className="model-grid">
                    {availableModels.map((model) => (
                      <div key={model.id} className="model-checkbox">
                        <input
                          type="checkbox"
                          id={model.id}
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleModelToggle(model.id)}
                        />
                        <label htmlFor={model.id} className="model-label">
                          <span className="model-name">{model.name}</span>
                          <span className="model-provider">{model.provider}</span>
                          <span className="model-cost">
                            ${model.costPer1kTokens}/1K tokens
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="button-group">
                  <button
                    onClick={runPromptTest}
                    disabled={loading || !prompt.trim() || selectedModels.length === 0}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Testing...
                      </>
                    ) : (
                      <>
                        🚀 Run Test
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={clearResults}
                    className="btn btn-secondary"
                    disabled={testResults.length === 0}
                  >
                    🗑️ Clear Results
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="error-message">
                    ❌ {error}
                  </div>
                )}
              </div>
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
                  <li>Start with simple prompts to test the system</li>
                  <li>Compare at least 2 models for best insights</li>
                  <li>GPT-3.5 is faster and cheaper for simple tasks</li>
                  <li>Claude excels at detailed analysis</li>
                  <li>Check response quality vs cost trade-offs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {testResults.length > 0 && (
            <div className="results-section">
              <div className="card">
                <h2>🎯 Test Results</h2>
                <div className="results-grid">
                  {testResults.map((result, index) => (
                    <div key={index} className={`result-card ${result.success ? 'success' : 'error'}`}>
                      <div className="result-header">
                        <h3>{result.model}</h3>
                        <span className="provider-badge">{result.provider}</span>
                      </div>
                      
                      {result.success ? (
                        <>
                          <div className="result-response">
                            {result.response}
                          </div>
                          <div className="result-meta">
                            <span>⏱️ {result.metadata?.responseTime || 0}ms</span>
                            <span>🔢 {result.metadata?.tokens?.total || 0} tokens</span>
                            <span>💰 ${result.metadata?.cost?.total || 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="result-error">
                          ❌ {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;