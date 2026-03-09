import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    let query = 'SELECT * FROM shifts WHERE user_id = ?';
    const params: any[] = [userId];

    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(month);
    }

    query += ' ORDER BY date DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date, shift_type, hours, hourly_wage } = req.body;

    if (!date || !shift_type || hours === undefined) {
      res.status(400).json({ error: 'Date, shift_type, and hours are required.' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO shifts (user_id, date, shift_type, hours, hourly_wage) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, date, shift_type, hours, hourly_wage || null);

    const row = db.prepare('SELECT * FROM shifts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { date, shift_type, hours, hourly_wage } = req.body;

    const existing = db.prepare('SELECT * FROM shifts WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }

    db.prepare(
      'UPDATE shifts SET date = ?, shift_type = ?, hours = ?, hourly_wage = ? WHERE id = ? AND user_id = ?'
    ).run(
      date || existing.date,
      shift_type || existing.shift_type,
      hours !== undefined ? hours : existing.hours,
      hourly_wage !== undefined ? hourly_wage : existing.hourly_wage,
      id, userId
    );

    const row = db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM shifts WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }

    res.json({ message: 'Shift deleted successfully.' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getShiftSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    let query = `
      SELECT
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(hours * COALESCE(hourly_wage, 0)), 0) as total_income,
        COUNT(*) as shift_count
      FROM shifts WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(month);
    }

    const summary = db.prepare(query).get(...params) as any;

    res.json({
      total_hours: summary.total_hours,
      total_income: summary.total_income,
      shift_count: summary.shift_count,
    });
  } catch (error) {
    console.error('Get shift summary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
