import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) { res.json({ bank_balance: 0, monthly_income: 0 }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { bank_balance, monthly_income } = req.body;

    const existing = await pool.query('SELECT id FROM user_settings WHERE user_id = $1', [userId]);

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE user_settings SET bank_balance=$1, monthly_income=$2, updated_at=NOW() WHERE user_id=$3',
        [bank_balance ?? 0, monthly_income ?? 0, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_settings (user_id, bank_balance, monthly_income) VALUES ($1,$2,$3)',
        [userId, bank_balance ?? 0, monthly_income ?? 0]
      );
    }

    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
