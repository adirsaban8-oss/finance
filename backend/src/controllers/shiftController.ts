import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;
    let query = 'SELECT * FROM shifts WHERE user_id = $1';
    const params: any[] = [userId];
    if (month) {
      query += ` AND TO_CHAR(date, 'YYYY-MM') = $2`;
      params.push(month);
    }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date, shift_type, hours, hourly_wage, shift_hours, description } = req.body;
    if (!date || !shift_type || hours === undefined) { res.status(400).json({ error: 'Date, shift_type, and hours are required.' }); return; }

    const result = await pool.query(
      'INSERT INTO shifts (user_id, date, shift_type, hours, hourly_wage, shift_hours, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [userId, date, shift_type, hours, hourly_wage || null, shift_hours || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { date, shift_type, hours, hourly_wage, shift_hours, description } = req.body;

    const existing = await pool.query('SELECT * FROM shifts WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Shift not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE shifts SET date=$1, shift_type=$2, hours=$3, hourly_wage=$4, shift_hours=$5, description=$6 WHERE id=$7 AND user_id=$8 RETURNING *',
      [date || old.date, shift_type || old.shift_type, hours !== undefined ? hours : old.hours, hourly_wage !== undefined ? hourly_wage : old.hourly_wage, shift_hours !== undefined ? shift_hours : old.shift_hours, description !== undefined ? description : old.description, id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shifts WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Shift not found.' }); return; }
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
    let query = `SELECT COALESCE(SUM(hours),0) as total_hours, COALESCE(SUM(hours * COALESCE(hourly_wage,0)),0) as total_income, COUNT(*) as shift_count FROM shifts WHERE user_id = $1`;
    const params: any[] = [userId];
    if (month) {
      query += ` AND TO_CHAR(date, 'YYYY-MM') = $2`;
      params.push(month);
    }
    const result = await pool.query(query, params);
    const row = result.rows[0];
    res.json({ total_hours: Number(row.total_hours), total_income: Number(row.total_income), shift_count: Number(row.shift_count) });
  } catch (error) {
    console.error('Get shift summary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
