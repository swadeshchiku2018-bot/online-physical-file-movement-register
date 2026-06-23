import { Pool } from 'pg';

const connectionString = 
  process.env.STORAGE02_POSTGRES_URL || 
  process.env.STORAGE02_DATABASE_URL;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

export async function initTables(): Promise<void> {
  const p = getPool();
  
  // 1. Create recipients table
  await p.query(`
    CREATE TABLE IF NOT EXISTS recipients (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255) NOT NULL,
      is_registered BOOLEAN NOT NULL DEFAULT TRUE,
      login_id VARCHAR(100),
      password VARCHAR(255)
    );
  `);

  // 2. Create files table
  await p.query(`
    CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(50) PRIMARY KEY,
      subject TEXT NOT NULL,
      department VARCHAR(255) NOT NULL,
      current_holder_id VARCHAR(50) REFERENCES recipients(id) ON DELETE SET NULL,
      status VARCHAR(50) NOT NULL,
      created_date VARCHAR(100) NOT NULL,
      last_moved_date VARCHAR(100) NOT NULL,
      reason TEXT,
      anticipated_return_date VARCHAR(100)
    );
  `);

  // 3. Create movements table
  await p.query(`
    CREATE TABLE IF NOT EXISTS movements (
      id VARCHAR(50) PRIMARY KEY,
      file_id VARCHAR(50) NOT NULL,
      file_subject TEXT NOT NULL,
      sender_id VARCHAR(50) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      receiver_id VARCHAR(50) NOT NULL,
      receiver_name VARCHAR(255) NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      remarks TEXT,
      type VARCHAR(50) NOT NULL,
      reason TEXT,
      anticipated_return_date VARCHAR(100)
    );
  `);
}
