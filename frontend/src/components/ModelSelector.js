// frontend/src/components/ModelSelector.js
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './ModelSelector.css';

// Model categories for better organization
const MODEL_CATEGORIES = {
  'openai': {
    name: 'OpenAI',
    icon: '🤖',
    color: '#10B981',
    description: 'GPT models for versatile text generation'
  },
  'anthropic': {
    name: 'Anthropic',
    icon: '🧠',
    color: '#8B5CF6',
    description: 'Claude models for thoughtful analysis'
  },
  'google': {
    name: 'Google',
    icon: '🔍',
    color: '#3B82F6',
    description: 'Gemini models for multimodal tasks'
  }
};

// Model performance indicators
const getPerformanceLevel = (model) => {
  const modelId = model.id.toLowerCase();
  
  if (modelId.includes('gpt-4') || modelId.includes('opus')) {
    return { level: 'premium', label: '⭐ Premium', color: '#F59E0B' };
  } else if (modelId.includes('gpt-3.5') || modelId.includes('sonnet')) {
    return { level: 'standard', label: '💡 Standard', color: '#10B981' };
  } else if (modelId.includes('haiku') || modelId.includes('turbo')) {
    return { level: 'fast', label: '⚡ Fast', color: '#3B82F6' };
  }
  
  return { level: 'standard', label: '💡 Standard', color: '#6B7280' };
};

function ModelSelector({ 
  selectedModels, 
  onModelToggle, 
  disabled 
}) {
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [filterProvider, setFilterProvider] = useState('all');
  const [sortBy, setSortBy] = useState('provider'); // provider, cost, performance

  // Load available models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getModels();
      
      if (response.success) {
        setAvailableModels(response.models);
      } else {
        setError(response.error || 'Failed to load models');
      }
    } catch (err) {
      setError('Unable to connect to backend');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle model selection
  const handleModelToggle = (modelId) => {
    if (!disabled) {
      onModelToggle(modelId);
    }
  };

  // Handle select all models from a provider
  const handleSelectAllProvider = (provider) => {
    const providerModels = availableModels
      .filter(model => model.provider.toLowerCase() === provider.toLowerCase())
      .map(model => model.id);
    
    providerModels.forEach(modelId => {
      if (!selectedModels.includes(modelId)) {
        onModelToggle(modelId);
      }
    });
  };

  // Handle deselect all models
  const handleDeselectAll = () => {
    selectedModels.forEach(modelId => {
      onModelToggle(modelId);
    });
  };

  // Toggle model details
  const toggleDetails = (modelId) => {
    setShowDetails(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  // Filter and sort models
  const getFilteredAndSortedModels = () => {
    let filtered = availableModels;
    
    // Filter by provider
    if (filterProvider !== 'all') {
      filtered = filtered.filter(model => 
        model.provider.toLowerCase() === filterProvider.toLowerCase()
      );
    }
    
    // Sort models
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return (a.costPer1kTokens || 0) - (b.costPer1kTokens || 0);
        case 'performance':
          const levelOrder = { 'premium': 3, 'standard': 2, 'fast': 1 };
          const aLevel = getPerformanceLevel(a).level;
          const bLevel = getPerformanceLevel(b).level;
          return (levelOrder[bLevel] || 0) - (levelOrder[aLevel] || 0);
        case 'provider':
        default:
          return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  };

  // Group models by provider
  const getModelsByProvider = () => {
    const filtered = getFilteredAndSortedModels();
    
    return filtered.reduce((acc, model) => {
      const provider = model.provider.toLowerCase();
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    }, {});
  };

  // Calculate selection stats
  const selectionStats = {
    total: selectedModels.length,
    totalCost: selectedModels.reduce((sum, modelId) => {
      const model = availableModels.find(m => m.id === modelId);
      return sum + (model?.costPer1kTokens || 0);
    }, 0),
    providers: [...new Set(selectedModels.map(modelId => {
      const model = availableModels.find(m => m.id === modelId);
      return model?.provider;
    }).filter(Boolean))]
  };

  if (loading) {
    return (
      <div className="model-selector-container">
        <div className="model-selector-loading">
          <div className="spinner-large"></div>
          <p>Loading available models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="model-selector-container">
        <div className="model-selector-error">
          <h3>❌ Error Loading Models</h3>
          <p>{error}</p>
          <button onClick={loadModels} className="btn btn-primary">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const modelsByProvider = getModelsByProvider();

  return (
    <div className="model-selector-container">
      {/* Header */}
      <div className="model-selector-header">
        <h2>🤖 Model Selection</h2>
        <div className="model-actions">
          <button
            onClick={handleDeselectAll}
            disabled={selectedModels.length === 0 || disabled}
            className="btn btn-outline btn-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Selection Stats */}
      {selectedModels.length > 0 && (
        <div className="selection-stats">
          <div className="stat-item">
            <span className="stat-value">{selectionStats.total}</span>
            <span className="stat-label">models selected</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">${selectionStats.totalCost.toFixed(4)}</span>
            <span className="stat-label">cost per 1K tokens</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{selectionStats.providers.length}</span>
            <span className="stat-label">providers</span>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="model-controls">
        <div className="model-filters">
          <label htmlFor="provider-filter">Filter by provider:</label>
          <select
            id="provider-filter"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Providers</option>
            {Object.keys(MODEL_CATEGORIES).map(provider => (
              <option key={provider} value={provider}>
                {MODEL_CATEGORIES[provider].name}
              </option>
            ))}
          </select>
        </div>

        <div className="model-sorting">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="provider">Provider</option>
            <option value="cost">Cost (Low to High)</option>
            <option value="performance">Performance</option>
          </select>
        </div>
      </div>

      {/* Model List by Provider */}
      <div className="model-providers">
        {Object.entries(modelsByProvider).map(([provider, models]) => {
          const categoryInfo = MODEL_CATEGORIES[provider] || {
            name: provider,
            icon: '🔧',
            color: '#6B7280',
            description: 'AI models'
          };

          const selectedInProvider = models.filter(model => 
            selectedModels.includes(model.id)
          ).length;

          return (
            <div key={provider} className="provider-section">
              <div className="provider-header">
                <div className="provider-info">
                  <span className="provider-icon">{categoryInfo.icon}</span>
                  <div className="provider-details">
                    <h3 className="provider-name">{categoryInfo.name}</h3>
                    <p className="provider-description">{categoryInfo.description}</p>
                  </div>
                </div>
                <div className="provider-actions">
                  <span className="provider-selection">
                    {selectedInProvider}/{models.length} selected
                  </span>
                  <button
                    onClick={() => handleSelectAllProvider(provider)}
                    disabled={disabled}
                    className="btn btn-outline btn-sm"
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div className="provider-models">
                {models.map((model) => {
                  const isSelected = selectedModels.includes(model.id);
                  const performance = getPerformanceLevel(model);
                  const isDetailed = showDetails[model.id];

                  return (
                    <div
                      key={model.id}
                      className={`model-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    >
                      <div className="model-main" onClick={() => handleModelToggle(model.id)}>
                        <div className="model-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleModelToggle(model.id)}
                            disabled={disabled}
                          />
                        </div>
                        
                        <div className="model-info">
                          <div className="model-header-row">
                            <h4 className="model-name">{model.name}</h4>
                            <span 
                              className="performance-badge"
                              style={{ backgroundColor: performance.color }}
                            >
                              {performance.label}
                            </span>
                          </div>
                          
                          <div className="model-meta">
                            <span className="model-cost">
                              ${model.costPer1kTokens}/1K tokens
                            </span>
                            <span className="model-tokens">
                              {model.maxTokens?.toLocaleString()} max tokens
                            </span>
                          </div>
                          
                          {model.description && (
                            <p className="model-description">{model.description}</p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDetails(model.id);
                          }}
                          className="model-details-toggle"
                        >
                          {isDetailed ? '▼' : '▶'}
                        </button>
                      </div>

                      {/* Detailed Model Information */}
                      {isDetailed && (
                        <div className="model-details">
                          <div className="model-capabilities">
                            <h5>Capabilities:</h5>
                            <div className="capability-tags">
                              {(model.capabilities || ['chat', 'completion']).map(cap => (
                                <span key={cap} className="capability-tag">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="model-specs">
                            <div className="spec-item">
                              <strong>Model ID:</strong> {model.id}
                            </div>
                            <div className="spec-item">
                              <strong>Max Tokens:</strong> {model.maxTokens?.toLocaleString() || 'N/A'}
                            </div>
                            <div className="spec-item">
                              <strong>Status:</strong> 
                              <span className={`status-badge ${model.status}`}>
                                {model.status || 'available'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Models Message */}
      {availableModels.length === 0 && (
        <div className="no-models">
          <p>No models available. Please check your backend connection.</p>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;