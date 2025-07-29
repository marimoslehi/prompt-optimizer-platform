-- Prompt Optimizer Platform Database Schema
-- SQLite Database for storing test results and model information

-- Tests table: stores prompt test configurations
CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    prompt TEXT NOT NULL,
    models TEXT NOT NULL, -- JSON array of model IDs
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    iterations INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Results table: stores individual model responses
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    success BOOLEAN NOT NULL DEFAULT 0,
    error_message TEXT,
    error_code VARCHAR(50),
    -- Token usage
    tokens_prompt INTEGER DEFAULT 0,
    tokens_completion INTEGER DEFAULT 0,
    tokens_total INTEGER DEFAULT 0,
    -- Cost information
    cost_input REAL DEFAULT 0.0,
    cost_output REAL DEFAULT 0.0,
    cost_total REAL DEFAULT 0.0,
    -- Performance metrics
    response_time INTEGER NOT NULL, -- milliseconds
    -- Request parameters
    temperature REAL,
    max_tokens INTEGER,
    -- Metadata
    finish_reason VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
);

-- Test summaries table: aggregated statistics per test
CREATE TABLE IF NOT EXISTS test_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    total_models INTEGER NOT NULL,
    successful_models INTEGER NOT NULL,
    failed_models INTEGER NOT NULL,
    total_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0.0,
    avg_response_time INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
);

-- Models table: store model information and pricing
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(200) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    max_tokens INTEGER,
    cost_per_1k_input REAL,
    cost_per_1k_output REAL,
    capabilities TEXT, -- JSON array
    status VARCHAR(20) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON results(test_id);
CREATE INDEX IF NOT EXISTS idx_results_model_id ON results(model_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_summaries_test_id ON test_summaries(test_id);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);

-- Sample queries for reference:

-- Get all tests with their results
-- SELECT t.*, GROUP_CONCAT(r.model_id) as models_tested
-- FROM tests t
-- LEFT JOIN results r ON t.test_id = r.test_id
-- GROUP BY t.test_id
-- ORDER BY t.created_at DESC;

-- Get cost analysis by provider
-- SELECT 
--     provider,
--     COUNT(*) as total_requests,
--     SUM(cost_total) as total_cost,
--     AVG(cost_total) as avg_cost_per_request,
--     AVG(response_time) as avg_response_time
-- FROM results 
-- WHERE success = 1
-- GROUP BY provider;

-- Get model performance comparison
-- SELECT 
--     model_id,
--     provider,
--     COUNT(*) as usage_count,
--     AVG(response_time) as avg_response_time,
--     SUM(cost_total) as total_cost,
--     AVG(tokens_total) as avg_tokens,
--     (COUNT(CASE WHEN success = 1 THEN 1 END) * 100.0 / COUNT(*)) as success_rate
-- FROM results
-- GROUP BY model_id, provider
-- ORDER BY usage_count DESC;