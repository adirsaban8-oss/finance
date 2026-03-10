import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month, category, search } = req.query;

    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    const params: any[] = [userId];
    let p = 2;

    if (month) {
      query += ` AND TO_CHAR(date, 'YYYY-MM') = $${p++}`;
      params.push(month);
    }
    if (category) {
      query += ` AND category = $${p++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (description ILIKE $${p} OR category ILIKE $${p + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      p += 2;
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date, amount, category, description } = req.body;
    if (!date || !amount || !category) { res.status(400).json({ error: 'Date, amount, and category are required.' }); return; }

    const result = await pool.query(
      'INSERT INTO expenses (user_id, date, amount, category, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, date, amount, category, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { date, amount, category, description } = req.body;

    const existing = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Expense not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE expenses SET date=$1, amount=$2, category=$3, description=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [date || old.date, amount || old.amount, category || old.category, description !== undefined ? description : old.description, id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Expense not found.' }); return; }
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
