const OpenAI = require('openai');

// Initialize OpenAI client (only if API key exists)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock_key_for_development') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// Model pricing (per 1K tokens)
const MODEL_PRICING = {
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    'gpt-4': { input: 0.01, output: 0.03 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 }
};

/**
 * Test a prompt with OpenAI models
 */
async function testPrompt(prompt, model = 'gpt-3.5-turbo', options = {}) {
    const startTime = Date.now();
    
    try {
        // Return mock response if no API key
        if (!openai) {
            const responseTime = 1000 + Math.random() * 1500;
            await new Promise(resolve => setTimeout(resolve, responseTime));
            
            return {
                success: true,
                model: model,
                provider: 'OpenAI',
                prompt: prompt,
                response: `Mock response from ${model}: This would be a real AI response if you had configured your OpenAI API key. Your prompt was: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
                metadata: {
                    responseTime: Math.round(responseTime),
                    tokens: { total: Math.floor(Math.random() * 200) + 50 },
                    cost: { total: (Math.random() * 0.01).toFixed(6) },
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Real OpenAI API call
        const response = await openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500
        });
        
        const endTime = Date.now();
        const responseText = response.choices[0]?.message?.content || 'No response generated';
        const usage = response.usage || {};
        
        // Calculate cost
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
        const inputCost = (usage.prompt_tokens || 0) * pricing.input / 1000;
        const outputCost = (usage.completion_tokens || 0) * pricing.output / 1000;
        const totalCost = inputCost + outputCost;

        return {
            success: true,
            model: model,
            provider: 'OpenAI',
            prompt: prompt,
            response: responseText,
            metadata: {
                responseTime: endTime - startTime,
                tokens: {
                    prompt: usage.prompt_tokens || 0,
                    completion: usage.completion_tokens || 0,
                    total: usage.total_tokens || 0
                },
                cost: {
                    input: parseFloat(inputCost.toFixed(6)),
                    output: parseFloat(outputCost.toFixed(6)),
                    total: parseFloat(totalCost.toFixed(6))
                },
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        return {
            success: false,
            model: model,
            provider: 'OpenAI',
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
 * Get available OpenAI models
 */
function getAvailableModels() {
    return [
        {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            description: 'Fast and efficient for most tasks',
            maxTokens: 4096,
            costPer1kTokens: MODEL_PRICING['gpt-3.5-turbo'].output,
            capabilities: ['chat', 'completion'],
            status: 'available'
        },
        {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'OpenAI',
            description: 'Most capable model for complex tasks',
            maxTokens: 8192,
            costPer1kTokens: MODEL_PRICING['gpt-4'].output,
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