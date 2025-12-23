import { Pool } from 'pg';
import { DEFAULTS } from './constants';

/**
 * PostgreSQL Connection Pool
 * Manages database connections for the MToken application
 */
const pool = new Pool({
  user: process.env.DB_USER || DEFAULTS.USER,
  password: process.env.DB_PASSWORD || DEFAULTS.PASSWORD,
  host: process.env.DB_HOST || DEFAULTS.HOST,
  port: parseInt(process.env.DB_PORT || String(DEFAULTS.PORT)),
  database: process.env.DB_NAME || DEFAULTS.DB,
});

/**
 * Handle unexpected errors on idle connections
 */
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;