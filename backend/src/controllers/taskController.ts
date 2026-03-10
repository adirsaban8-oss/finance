import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC, created_at DESC', [userId]);
    const pending = result.rows.filter(t => !t.completed);
    const completed = result.rows.filter(t => t.completed);
    res.json({ pending, completed });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, description, due_date } = req.body;
    if (!title) { res.status(400).json({ error: 'Title is required.' }); return; }

    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, due_date) VALUES ($1,$2,$3,$4) RETURNING *',
      [userId, title, description || null, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, due_date, completed } = req.body;

    const existing = await pool.query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Task not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE tasks SET title=$1, description=$2, due_date=$3, completed=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [title || old.title, description !== undefined ? description : old.description, due_date !== undefined ? due_date : old.due_date, completed !== undefined ? completed : old.completed, id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const toggleTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Task not found.' }); return; }

    const result = await pool.query(
      'UPDATE tasks SET completed = NOT completed WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Task not found.' }); return; }
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
