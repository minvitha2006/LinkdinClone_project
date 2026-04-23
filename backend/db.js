const { Pool } = require('pg');
require('dotenv').config();

// 1. Create the Pool configuration
// Added logic to handle SSL requirements for production (Render/Railway/AWS)
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    
    // Connection Pool Settings
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased slightly for slower cloud startups

    // SSL is required for most managed cloud databases (like Supabase, Render, etc.)
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// 2. Database Connection Test
// Refactored to use a cleaner log message
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ DATABASE CONNECTION ERROR:', err.stack);
    }
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
    release(); 
});

// 3. Global Error Listener
pool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle database client:', err.message);
    // In many cloud environments, we don't want to kill the process 
    // immediately unless it's a critical startup failure.
});

// 4. Helper for cleaner queries (Optional but Recommended)
// This allows you to use `const result = await pool.query(text, params)` directly
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool // Exporting the pool itself just in case
};
