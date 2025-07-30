const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { initializeDatabase, closeDatabase } = require('./config/database');

// Import AI services
const openaiService = require('./services/openai');
const anthropicService = require('./services/anthropic');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check routes
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Prompt Optimizer Platform API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Prompt Optimizer Backend',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test route with enhanced response
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '✅ Backend is working perfectly!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        features: {
            cors: 'enabled',
            jsonParsing: 'enabled',
            logging: 'enabled'
        }
    });
});

// Models endpoint - real model data from services
app.get('/api/models', (req, res) => {
    try {
        // Get models from both services
        const openaiModels = openaiService.getAvailableModels();
        const anthropicModels = anthropicService.getAvailableModels();
        const allModels = [...openaiModels, ...anthropicModels];

        res.json({
            success: true,
            models: allModels,
            count: allModels.length,
            providers: {
                openai: openaiModels.length,
                anthropic: anthropicModels.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching models:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available models',
            message: error.message
        });
    }
});

// Prompt testing endpoint with real AI integration - FIXED VERSION
app.post('/api/prompts/test', async (req, res) => {
    try {
        const { prompt, models, iterations = 1, temperature = 0.7, maxTokens = 500 } = req.body;

        // Basic validation
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required and cannot be empty'
            });
        }

        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one model must be selected'
            });
        }

        console.log(`🚀 Starting prompt test with ${models.length} models`);
        
        const results = [];
        const options = { temperature, maxTokens };

        // Test each model
        for (const modelId of models) {
            console.log(`Testing model: ${modelId}`);
            
            let result;
            
            // Route to appropriate service based on model
            if (modelId.startsWith('gpt-') || modelId.includes('gpt')) {
                result = await openaiService.testPrompt(prompt, modelId, options);
            } else if (modelId.startsWith('claude-')) {
                result = await anthropicService.testPrompt(prompt, modelId, options);
            } else {
                // Unknown model, return error
                result = {
                    success: false,
                    model: modelId,
                    provider: 'Unknown',
                    prompt: prompt,
                    error: `Unsupported model: ${modelId}`,
                    errorCode: 'UNSUPPORTED_MODEL',
                    metadata: {
                        responseTime: 0,
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            results.push(result);
        }

        // Calculate summary statistics - FIXED VERSION
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);
        
        // Safe calculation of totals
        const totalTokens = successfulResults.reduce((sum, r) => {
            const tokens = r.metadata?.tokens?.total || 0;
            return sum + tokens;
        }, 0);
        
        const totalCostRaw = successfulResults.reduce((sum, r) => {
            const cost = r.metadata?.cost?.total || 0;
            return sum + parseFloat(cost);
        }, 0);
        
        const avgResponseTime = successfulResults.length > 0 
            ? Math.round(successfulResults.reduce((sum, r) => sum + (r.metadata?.responseTime || 0), 0) / successfulResults.length)
            : 0;
        
        const summary = {
            totalModels: models.length,
            successfulModels: successfulResults.length,
            failedModels: failedResults.length,
            totalTokens: totalTokens,
            totalCost: parseFloat(totalCostRaw.toFixed(6)),
            avgResponseTime: avgResponseTime
        };

        res.json({
            success: true,
            testId: `test_${Date.now()}`,
            prompt: prompt,
            models: models,
            iterations: iterations,
            results: results,
            summary: summary,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in prompt testing:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during prompt testing',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get test history (placeholder)
app.get('/api/prompts/history', (req, res) => {
    res.json({
        success: true,
        tests: [],
        message: 'Test history feature coming soon!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET /',
            'GET /api/health', 
            'GET /api/test',
            'GET /api/models',
            'POST /api/prompts/test',
            'GET /api/prompts/history'
        ]
    });
});

// Start server with database initialization
async function startServer() {
    try {
        // Initialize database first
        console.log('🗄️  Initializing database...');
        await initializeDatabase();
        
        // Start HTTP server
        app.listen(PORT, () => {
            console.log('🚀 ===============================================');
            console.log(`🚀 Prompt Optimizer Backend Server Started`);
            console.log('🚀 ===============================================');
            console.log(`📍 Server URL: http://localhost:${PORT}`);
            console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test`);
            console.log(`🤖 Models endpoint: http://localhost:${PORT}/api/models`);
            console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🚀 ===============================================');
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('💡 Development Tips:');
                console.log('   - Visit http://localhost:8000/api/test to verify setup');
                console.log('   - Visit http://localhost:8000/api/models to see available models');
                console.log('   - API documentation will be at /api/docs (coming soon)');
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
startServer();

// Graceful shutdown with database cleanup
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    await closeDatabase();
    process.exit(0);
});