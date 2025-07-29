// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_CONFIG = {
    filename: process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite'),
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    verbose: process.env.NODE_ENV === 'development'
};

// Database instance
let db = null;

/**
 * Initialize database connection and create tables
 * @returns {Promise<sqlite3.Database>} Database instance
 */
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(DB_CONFIG.filename);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        console.log(`📁 Database path: ${DB_CONFIG.filename}`);
        
        // Create database connection
        db = new sqlite3.Database(DB_CONFIG.filename, DB_CONFIG.mode, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ Connected to SQLite database');
            
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('❌ Error enabling foreign keys:', err.message);
                    reject(err);
                    return;
                }
                
                // Create tables
                createTables()
                    .then(() => {
                        console.log('✅ Database initialized successfully');
                        resolve(db);
                    })
                    .catch(reject);
            });
        });

        // Handle database errors
        db.on('error', (err) => {
            console.error('❌ Database error:', err.message);
        });
    });
}

/**
 * Create database tables
 * @returns {Promise<void>}
 */
async function createTables() {
    return new Promise((resolve, reject) => {
        // SQL statements for creating tables
        const createTablesSQL = `
            -- Tests table: stores prompt test configurations
            CREATE TABLE IF NOT EXISTS tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_id VARCHAR(50) UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                models TEXT NOT NULL,
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
                tokens_prompt INTEGER DEFAULT 0,
                tokens_completion INTEGER DEFAULT 0,
                tokens_total INTEGER DEFAULT 0,
                cost_input REAL DEFAULT 0.0,
                cost_output REAL DEFAULT 0.0,
                cost_total REAL DEFAULT 0.0,
                response_time INTEGER NOT NULL,
                temperature REAL,
                max_tokens INTEGER,
                finish_reason VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);
            CREATE INDEX IF NOT EXISTS idx_results_test_id ON results(test_id);
            CREATE INDEX IF NOT EXISTS idx_results_model_id ON results(model_id);
        `;

        // Execute table creation
        db.exec(createTablesSQL, (err) => {
            if (err) {
                console.error('❌ Error creating tables:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ Database tables created successfully');
            resolve();
        });
    });
}

/**
 * Get database instance
 * @returns {sqlite3.Database|null} Database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ Database connection closed');
            db = null;
            resolve();
        });
    });
}

module.exports = {
    initializeDatabase,
    getDatabase,
    closeDatabase
};