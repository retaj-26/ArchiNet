const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Database Connection Pool
 * Manages connections to the database with error handling and logging
 */

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'archinet_db',
  user: process.env.DB_USER || 'archinet_user',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client sits idle in the pool
  connectionTimeoutMillis: 2000, // How long to try to connect
});

/**
 * Error handling for idle clients
 */
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', {
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Connection event logging
 */
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✓ New database connection established');
  }
});

/**
 * Query logging for debugging
 */
pool.on('query', (query) => {
  if (process.env.DEBUG === 'true') {
    console.log('📝 Query:', query.text);
  }
});

/**
 * Test the connection on startup
 */
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection test failed:', {
      error: err.message,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
  } else {
    console.log('✅ Database connection successful:', {
      timestamp: result.rows[0].now,
      environment: process.env.NODE_ENV,
    });
  }
});

module.exports = pool;
