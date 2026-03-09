import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;

    if (!settings) {
      res.json({ bank_balance: 0, monthly_income: 0 });
      return;
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { bank_balance, monthly_income } = req.body;

    const existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(userId);

    if (existing) {
      db.prepare(
        `UPDATE user_settings SET bank_balance = ?, monthly_income = ?, updated_at = datetime('now') WHERE user_id = ?`
      ).run(bank_balance ?? 0, monthly_income ?? 0, userId);
    } else {
      db.prepare(
        'INSERT INTO user_settings (user_id, bank_balance, monthly_income) VALUES (?, ?, ?)'
      ).run(userId, bank_balance ?? 0, monthly_income ?? 0);
    }

    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
