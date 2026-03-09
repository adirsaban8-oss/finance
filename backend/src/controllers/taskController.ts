import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC, created_at DESC'
    ).all(userId) as any[];

    const tasks = rows.map(t => ({ ...t, completed: !!t.completed }));

    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);

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

    if (!title) {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)'
    ).run(userId, title, description || null, due_date || null);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as any;
    res.status(201).json({ ...row, completed: !!row.completed });
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

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    db.prepare(
      'UPDATE tasks SET title = ?, description = ?, due_date = ?, completed = ? WHERE id = ? AND user_id = ?'
    ).run(
      title || existing.title,
      description !== undefined ? description : existing.description,
      due_date !== undefined ? due_date : existing.due_date,
      completed !== undefined ? (completed ? 1 : 0) : existing.completed,
      id, userId
    );

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    res.json({ ...row, completed: !!row.completed });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const toggleTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?')
      .run(existing.completed ? 0 : 1, id, userId);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    res.json({ ...row, completed: !!row.completed });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
