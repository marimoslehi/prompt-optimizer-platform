const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client (only if API key exists)
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'mock_key_for_development') {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}

// Model pricing (per 1K tokens)
const MODEL_PRICING = {
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
};

/**
 * Test a prompt with Anthropic models
 */
async function testPrompt(prompt, model = 'claude-3-sonnet-20240229', options = {}) {
    const startTime = Date.now();
    
    try {
        // Return mock response if no API key
        if (!anthropic) {
            const responseTime = 1200 + Math.random() * 1800;
            await new Promise(resolve => setTimeout(resolve, responseTime));
            
            return {
                success: true,
                model: model,
                provider: 'Anthropic',
                prompt: prompt,
                response: `Mock response from ${model}: This would be a real Claude response if you had configured your Anthropic API key. Your prompt was: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
                metadata: {
                    responseTime: Math.round(responseTime),
                    tokens: { total: Math.floor(Math.random() * 250) + 60 },
                    cost: { total: (Math.random() * 0.02).toFixed(6) },
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Real Anthropic API call would go here
        // For now, return mock response
        const responseTime = 1200 + Math.random() * 1800;
        await new Promise(resolve => setTimeout(resolve, responseTime));
        
        return {
            success: true,
            model: model,
            provider: 'Anthropic',
            prompt: prompt,
            response: `Mock Claude response: I understand you want me to respond to "${prompt.substring(0, 30)}..." - this would be a real Claude response with proper API integration.`,
            metadata: {
                responseTime: Math.round(responseTime),
                tokens: { total: Math.floor(Math.random() * 250) + 60 },
                cost: { total: (Math.random() * 0.02).toFixed(6) },
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        return {
            success: false,
            model: model,
            provider: 'Anthropic',
            prompt: prompt,
            error: error.message,
            metadata: {
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Get available Anthropic models
 */
function getAvailableModels() {
    return [
        {
            id: 'claude-3-sonnet-20240229',
            name: 'Claude 3 Sonnet',
            provider: 'Anthropic',
            description: 'Balanced performance and speed',
            maxTokens: 200000,
            costPer1kTokens: MODEL_PRICING['claude-3-sonnet-20240229'].output,
            capabilities: ['chat', 'completion'],
            status: 'available'
        },
        {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            provider: 'Anthropic',
            description: 'Most capable Claude model',
            maxTokens: 200000,
            costPer1kTokens: MODEL_PRICING['claude-3-opus-20240229'].output,
            capabilities: ['chat', 'completion'],
            status: 'available'
        }
    ];
}

function isModelSupported(model) {
    return Object.keys(MODEL_PRICING).includes(model);
}

module.exports = {
    testPrompt,
    getAvailableModels,
    isModelSupported
};