// frontend/src/components/TestResults.js
import React, { useState } from 'react';
import './TestResults.css';

// Utility function to copy text to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// Quality scoring function
const calculateQualityScore = (result) => {
  if (!result.success || !result.response) return 0;
  
  const response = result.response;
  const responseTime = result.metadata?.responseTime || 0;
  const tokens = result.metadata?.tokens?.total || 0;
  
  let score = 70; // Base score
  
  // Response length (optimal range: 50-500 characters)
  if (response.length >= 50 && response.length <= 500) {
    score += 15;
  } else if (response.length > 20) {
    score += 10;
  }
  
  // Response time (faster is better, but not too fast)
  if (responseTime > 500 && responseTime < 3000) {
    score += 10;
  } else if (responseTime >= 3000) {
    score -= 5;
  }
  
  // Token efficiency
  if (tokens > 0 && tokens < 200) {
    score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
};

// Format response time for display
const formatResponseTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Format cost for display
const formatCost = (cost) => {
  if (typeof cost === 'number') {
    return `${cost.toFixed(6)}`;
  }
  if (typeof cost === 'string') {
    return `${parseFloat(cost).toFixed(6)}`;
  }
  return '$0.000000';
};

function TestResults({ 
  results = [], 
  loading = false, 
  onClear,
  testPrompt = '',
  summary = {}
}) {
  const [copiedStates, setCopiedStates] = useState({});
  const [expandedResults, setExpandedResults] = useState({});
  const [sortBy, setSortBy] = useState('model'); // model, cost, time, quality
  const [filterBy, setFilterBy] = useState('all'); // all, success, error

  // Handle copy to clipboard
  const handleCopy = async (text, resultId, type = 'response') => {
    try {
      await copyToClipboard(text);
      const key = `${resultId}-${type}`;
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Toggle expanded state for a result
  const toggleExpanded = (resultId) => {
    setExpandedResults(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  // Filter and sort results
  const getFilteredAndSortedResults = () => {
    let filtered = [...results];
    
    // Apply filters
    if (filterBy === 'success') {
      filtered = filtered.filter(result => result.success);
    } else if (filterBy === 'error') {
      filtered = filtered.filter(result => !result.success);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          const aCost = a.metadata?.cost?.total || 0;
          const bCost = b.metadata?.cost?.total || 0;
          return parseFloat(bCost) - parseFloat(aCost); // Highest cost first
        case 'time':
          const aTime = a.metadata?.responseTime || 0;
          const bTime = b.metadata?.responseTime || 0;
          return aTime - bTime; // Fastest first
        case 'quality':
          return calculateQualityScore(b) - calculateQualityScore(a); // Highest quality first
        case 'model':
        default:
          return a.model.localeCompare(b.model);
      }
    });
    
    return filtered;
  };

  // Export results to JSON
  const exportResults = () => {
    const exportData = {
      prompt: testPrompt,
      timestamp: new Date().toISOString(),
      summary: summary,
      results: results.map(result => ({
        model: result.model,
        provider: result.provider,
        success: result.success,
        response: result.response,
        error: result.error,
        metadata: result.metadata
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="test-results-container">
        <div className="results-loading">
          <div className="loading-spinner-large"></div>
          <h3>Testing your prompt...</h3>
          <p>Running across {results.length || 'multiple'} models</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="test-results-container">
        <div className="no-results">
          <h3>🎯 Ready for Testing</h3>
          <p>Enter a prompt and select models to see results here.</p>
        </div>
      </div>
    );
  }

  const filteredResults = getFilteredAndSortedResults();
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <div className="test-results-container">
      {/* Results Header */}
      <div className="results-header">
        <div className="results-title">
          <h2>🎯 Test Results</h2>
          <div className="results-summary">
            <span className="success-count">{successCount} successful</span>
            {errorCount > 0 && (
              <span className="error-count">{errorCount} failed</span>
            )}
          </div>
        </div>
        
        <div className="results-actions">
          <button
            onClick={exportResults}
            className="btn btn-secondary btn-sm"
            title="Export results to JSON"
          >
            📄 Export
          </button>
          <button
            onClick={onClear}
            className="btn btn-outline btn-sm"
            title="Clear all results"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Test Summary */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="test-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{summary.totalModels || results.length}</span>
              <span className="summary-label">Models Tested</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{formatCost(summary.totalCost || 0)}</span>
              <span className="summary-label">Total Cost</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{formatResponseTime(summary.avgResponseTime || 0)}</span>
              <span className="summary-label">Avg Response Time</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{summary.totalTokens || 0}</span>
              <span className="summary-label">Total Tokens</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="results-controls">
        <div className="results-filters">
          <label htmlFor="filter-select">Filter:</label>
          <select
            id="filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Results ({results.length})</option>
            <option value="success">Successful ({successCount})</option>
            <option value="error">Failed ({errorCount})</option>
          </select>
        </div>

        <div className="results-sorting">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="model">Model Name</option>
            <option value="cost">Cost (High to Low)</option>
            <option value="time">Response Time (Fast to Slow)</option>
            <option value="quality">Quality Score</option>
          </select>
        </div>
      </div>

      {/* Original Prompt Display */}
      {testPrompt && (
        <div className="original-prompt">
          <h4>📝 Original Prompt:</h4>
          <div className="prompt-display">
            {testPrompt}
            <button
              onClick={() => handleCopy(testPrompt, 'prompt', 'prompt')}
              className="copy-btn"
              title="Copy prompt"
            >
              {copiedStates['prompt-prompt'] ? '✅' : '📋'}
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="results-grid">
        {filteredResults.map((result, index) => {
          const resultId = `${result.model}-${index}`;
          const isExpanded = expandedResults[resultId];
          const qualityScore = calculateQualityScore(result);
          
          return (
            <div
              key={resultId}
              className={`result-card ${result.success ? 'success' : 'error'}`}
            >
              {/* Result Header */}
              <div className="result-header">
                <div className="result-model-info">
                  <h3 className="model-name">{result.model}</h3>
                  <span className="provider-badge">{result.provider}</span>
                  {result.success && (
                    <span className="quality-score">
                      {qualityScore}% quality
                    </span>
                  )}
                </div>
                
                <div className="result-actions">
                  {result.success && (
                    <button
                      onClick={() => handleCopy(result.response, resultId, 'response')}
                      className="action-btn copy-btn"
                      title="Copy response"
                    >
                      {copiedStates[`${resultId}-response`] ? '✅' : '📋'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(resultId)}
                    className="action-btn expand-btn"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Result Content */}
              {result.success ? (
                <div className="result-response">
                  <div className={`response-text ${isExpanded ? 'expanded' : ''}`}>
                    {result.response}
                  </div>
                </div>
              ) : (
                <div className="result-error">
                  <strong>❌ Error:</strong>
                  <p>{result.error}</p>
                </div>
              )}

              {/* Result Metadata */}
              {result.success && result.metadata && (
                <div className="result-metadata">
                  <div className="metadata-item">
                    <span className="metadata-icon">⏱️</span>
                    <span className="metadata-value">
                      {formatResponseTime(result.metadata.responseTime || 0)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-icon">🔢</span>
                    <span className="metadata-value">
                      {result.metadata.tokens?.total || 0} tokens
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-icon">💰</span>
                    <span className="metadata-value">
                      {formatCost(result.metadata.cost?.total || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && result.success && result.metadata && (
                <div className="result-details">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h5>Token Usage</h5>
                      <div className="detail-items">
                        <div className="detail-item">
                          <span>Input:</span>
                          <span>{result.metadata.tokens?.prompt || 0}</span>
                        </div>
                        <div className="detail-item">
                          <span>Output:</span>
                          <span>{result.metadata.tokens?.completion || 0}</span>
                        </div>
                        <div className="detail-item">
                          <span>Total:</span>
                          <span>{result.metadata.tokens?.total || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="detail-section">
                      <h5>Cost Breakdown</h5>
                      <div className="detail-items">
                        <div className="detail-item">
                          <span>Input:</span>
                          <span>{formatCost(result.metadata.cost?.input || 0)}</span>
                        </div>
                        <div className="detail-item">
                          <span>Output:</span>
                          <span>{formatCost(result.metadata.cost?.output || 0)}</span>
                        </div>
                        <div className="detail-item">
                          <span>Total:</span>
                          <span>{formatCost(result.metadata.cost?.total || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {result.metadata.timestamp && (
                    <div className="result-timestamp">
                      <small>Generated: {new Date(result.metadata.timestamp).toLocaleString()}</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results After Filtering */}
      {filteredResults.length === 0 && results.length > 0 && (
        <div className="no-filtered-results">
          <p>No results match the current filter. Try changing the filter options.</p>
        </div>
      )}
    </div>
  );
}

export default TestResults;