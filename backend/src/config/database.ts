import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'finance.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const initDB = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        shift_type VARCHAR(20) NOT NULL,
        hours DECIMAL(4,1) NOT NULL,
        hourly_wage DECIMAL(8,2)
      );

      CREATE TABLE IF NOT EXISTS credit_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        last4digits VARCHAR(4) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credit_charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER REFERENCES credit_cards(id),
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        charge_date DATE NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS asset_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        section VARCHAR(20) NOT NULL DEFAULT 'mine',
        created_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE REFERENCES users(id),
        bank_balance DECIMAL(12,2) DEFAULT 0,
        monthly_income DECIMAL(12,2) DEFAULT 0,
        updated_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        month VARCHAR(7) NOT NULL,
        monthly_budget DECIMAL(10,2),
        category VARCHAR(50),
        category_budget DECIMAL(10,2),
        UNIQUE(user_id, month, category)
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default db;
