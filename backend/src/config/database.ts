import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

export const initDB = async (): Promise<void> => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        shift_type VARCHAR(50) NOT NULL,
        hours DECIMAL(4,1) NOT NULL,
        hourly_wage DECIMAL(8,2),
        shift_hours VARCHAR(20),
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS credit_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        last4digits VARCHAR(4) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credit_charges (
        id SERIAL PRIMARY KEY,
        card_id INTEGER REFERENCES credit_cards(id),
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        charge_date DATE NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS asset_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        section VARCHAR(20) NOT NULL DEFAULT 'mine',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id),
        bank_balance DECIMAL(12,2) DEFAULT 0,
        monthly_income DECIMAL(12,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        month VARCHAR(7) NOT NULL,
        monthly_budget DECIMAL(10,2),
        category VARCHAR(50),
        category_budget DECIMAL(10,2),
        UNIQUE(user_id, month, category)
      );
    `);
    // Add new columns if they don't exist
    await pool.query(`
      ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_hours VARCHAR(20);
      ALTER TABLE shifts ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_amount DECIMAL(10,2);
    `);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
