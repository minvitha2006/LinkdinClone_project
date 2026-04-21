const { Pool } = require('pg');
require('dotenv').config();

// 1. Create the Pool configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Max connections to prevent resource exhaustion attacks
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 2. Database Connection Test (Runs once on startup)
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ DATABASE CONNECTION ERROR:', err.stack);
    }
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
    release(); // Important: release the client back to the pool
});

// 3. Global Error Listener
// Prevents the Node.js process from exiting if a connection is lost
pool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle database client', err);
    process.exit(-1);
});

module.exports = pool;