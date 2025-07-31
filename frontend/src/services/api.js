// frontend/src/services/api.js
// Centralized API service for all backend communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ API Success: ${endpoint}`, data);
      return data;
      
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw new Error(error.message || 'Network request failed');
    }
  }

  // Health check endpoint
  async checkHealth() {
    return this.request('/api/health');
  }

  // Test backend connectivity
  async testConnection() {
    return this.request('/api/test');
  }

  // Fetch available AI models
  async getModels() {
    try {
      const response = await this.request('/api/models');
      
      if (response.success && response.models) {
        return {
          success: true,
          models: response.models,
          count: response.count || response.models.length,
          providers: response.providers || {},
        };
      }
      
      throw new Error('Invalid models response format');
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        models: [],
        count: 0,
      };
    }
  }

  // Run prompt test across multiple models
  async testPrompt(promptData) {
    try {
      const { prompt, models, ...options } = promptData;
      
      // Validation
      if (!prompt || !prompt.trim()) {
        throw new Error('Prompt is required');
      }
      
      if (!models || !Array.isArray(models) || models.length === 0) {
        throw new Error('At least one model must be selected');
      }

      const requestBody = {
        prompt: prompt.trim(),
        models,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 500,
        iterations: options.iterations || 1,
      };

      const response = await this.request('/api/prompts/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (response.success) {
        return {
          success: true,
          testId: response.testId,
          results: response.results || [],
          summary: response.summary || {},
          timestamp: response.timestamp,
        };
      }

      throw new Error(response.error || 'Test failed');

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
        summary: {},
      };
    }
  }

  // Get test history (when implemented)
  async getTestHistory(limit = 10) {
    try {
      const response = await this.request(`/api/prompts/history?limit=${limit}`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests: [],
      };
    }
  }

  // Save a prompt template (future feature)
  async savePromptTemplate(template) {
    try {
      const response = await this.request('/api/prompts/templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get prompt templates (future feature)
  async getPromptTemplates() {
    try {
      const response = await this.request('/api/prompts/templates');
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        templates: [],
      };
    }
  }

  // Utility method to format API errors for user display
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Utility method to check if backend is accessible
  async isBackendAccessible() {
    try {
      await this.testConnection();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;

// Named exports for specific methods (optional - for tree shaking)
export const {
  getModels,
  testPrompt,
  getTestHistory,
  checkHealth,
  testConnection,
} = apiService;