import { Pool } from 'pg';

// สร้าง Connection Pool เพื่อเชื่อมต่อ Database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost', // ใน Docker จะใช้ชื่อ Service (mtoken-db-v2)
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
});

// ดักจับ Error เผื่อเชื่อมต่อไม่ได้
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;