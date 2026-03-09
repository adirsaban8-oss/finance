import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month, category, search } = req.query;

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params: any[] = [userId];

    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(month);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (description LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { date, amount, category, description } = req.body;

    if (!date || !amount || !category) {
      res.status(400).json({ error: 'Date, amount, and category are required.' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO expenses (user_id, date, amount, category, description) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, date, amount, category, description);

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
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

    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    db.prepare(
      'UPDATE expenses SET date = ?, amount = ?, category = ?, description = ? WHERE id = ? AND user_id = ?'
    ).run(
      date || existing.date,
      amount || existing.amount,
      category || existing.category,
      description !== undefined ? description : existing.description,
      id, userId
    );

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
