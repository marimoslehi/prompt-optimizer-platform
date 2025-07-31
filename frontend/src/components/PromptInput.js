// frontend/src/components/PromptInput.js
import React, { useState } from 'react';
import './PromptInput.css';

// Pre-defined prompt templates
const PROMPT_TEMPLATES = [
  {
    id: 'summarization',
    name: '📄 Summarization',
    description: 'Summarize long content effectively',
    template: 'Please summarize the following text in 2-3 sentences, highlighting the key points:\n\n[Your content here]',
    category: 'Content'
  },
  {
    id: 'creative-writing',
    name: '✨ Creative Writing',
    description: 'Generate creative content',
    template: 'Write a creative story about [your topic]. Make it engaging and imaginative with vivid descriptions.',
    category: 'Creative'
  },
  {
    id: 'analysis',
    name: '🔍 Analysis',
    description: 'Analyze and evaluate content',
    template: 'Analyze the following topic and provide insights on its implications, benefits, and potential challenges:\n\n[Your topic here]',
    category: 'Analysis'
  },
  {
    id: 'explanation',
    name: '🎓 Explanation',
    description: 'Explain complex topics simply',
    template: 'Explain [complex topic] in simple terms that a beginner could understand. Use analogies and examples.',
    category: 'Education'
  },
  {
    id: 'coding-help',
    name: '💻 Code Generation',
    description: 'Generate and debug code',
    template: 'Write a [programming language] function that [describe functionality]. Include comments and error handling.',
    category: 'Programming'
  },
  {
    id: 'business-email',
    name: '📧 Business Email',
    description: 'Professional email writing',
    template: 'Write a professional email to [recipient] about [subject]. Keep it concise and polite.',
    category: 'Business'
  },
  {
    id: 'translation',
    name: '🌍 Translation',
    description: 'Translate text between languages',
    template: 'Translate the following text from [source language] to [target language]:\n\n[Your text here]',
    category: 'Language'
  },
  {
    id: 'pros-cons',
    name: '⚖️ Pros & Cons',
    description: 'Compare advantages and disadvantages',
    template: 'List the pros and cons of [topic/decision]. Provide at least 3 points for each side with explanations.',
    category: 'Analysis'
  }
];

function PromptInput({ 
  prompt, 
  setPrompt, 
  onTest, 
  loading, 
  disabled 
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateSearch, setTemplateSearch] = useState('');

  // Character limits and warnings
  const maxChars = 4000;
  const warnChars = 3500;
  const charCount = prompt.length;
  const isNearLimit = charCount > warnChars;
  const isOverLimit = charCount > maxChars;

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setPrompt(template.template);
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  // Clear prompt
  const handleClear = () => {
    setPrompt('');
    setSelectedTemplate(null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !loading && !disabled && !isOverLimit) {
      onTest();
    }
  };

  // Filter templates based on search
  const filteredTemplates = PROMPT_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.category.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  return (
    <div className="prompt-input-container">
      <div className="prompt-input-header">
        <h2>📝 Prompt Configuration</h2>
        <div className="prompt-actions">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn btn-secondary btn-sm"
          >
            📚 Templates
          </button>
          {prompt && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-outline btn-sm"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <div className="template-selector">
          <div className="template-search">
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="template-search-input"
            />
          </div>
          
          <div className="template-grid">
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} className="template-category">
                <h4 className="template-category-title">{category}</h4>
                <div className="template-list">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    >
                      <div className="template-name">{template.name}</div>
                      <div className="template-description">{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Template Info */}
      {selectedTemplate && (
        <div className="selected-template-info">
          <span className="template-badge">{selectedTemplate.name}</span>
          <span className="template-description">{selectedTemplate.description}</span>
        </div>
      )}

      {/* Main Prompt Form */}
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="prompt-input-group">
          <label htmlFor="prompt-textarea" className="prompt-label">
            Enter your prompt:
          </label>
          
          <textarea
            id="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write your prompt here... or select a template above to get started quickly"
            rows={6}
            className={`prompt-textarea ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}
            disabled={loading || disabled}
          />
          
          <div className="prompt-input-footer">
            <div className="char-count">
              <span className={`char-count-text ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
              </span>
              {isOverLimit && (
                <span className="char-limit-warning">
                  ⚠️ Exceeds character limit
                </span>
              )}
            </div>
            
            <div className="prompt-controls">
              <button
                type="submit"
                disabled={!prompt.trim() || loading || disabled || isOverLimit}
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
            </div>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="prompt-tips">
          <h4>💡 Tips for better prompts:</h4>
          <ul>
            <li><strong>Be specific:</strong> Include context and desired output format</li>
            <li><strong>Use examples:</strong> Show the AI what you want with sample inputs/outputs</li>
            <li><strong>Set constraints:</strong> Specify length, tone, or style requirements</li>
            <li><strong>Test variations:</strong> Try different phrasings to see what works best</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default PromptInput;