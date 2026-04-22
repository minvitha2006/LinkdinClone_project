const { Pool } = require('pg');
require('dotenv').config();

// 1. Create the Pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, 
    idleTimeoutMillis: 30000,
    // INCREASED: 10 seconds instead of 2 to allow for network lag
    connectionTimeoutMillis: 10000, 
});

// 2. Database Connection Test
pool.connect((err, client, release) => {
    if (err) {
        // Detailed error for debugging
        console.error('❌ DATABASE CONNECTION ERROR:', err.message);
        return;
    }
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY TO SUPABASE');
    release(); 
});

pool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle database client', err);
});

module.exports = pool;