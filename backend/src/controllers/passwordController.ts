import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';

const serialize = (row: any) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  password: decrypt(row.password_encrypted),
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const getPasswords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM passwords WHERE user_id = $1 ORDER BY LOWER(name) ASC',
      [userId]
    );
    res.json(result.rows.map(serialize));
  } catch (error) {
    console.error('Get passwords error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, username, password, notes } = req.body;
    if (!name || !String(name).trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
    if (password === undefined || password === null || String(password) === '') {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO passwords (user_id, name, username, password_encrypted, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, String(name).trim(), username || null, encrypt(String(password)), notes || null]
    );
    res.status(201).json(serialize(result.rows[0]));
  } catch (error) {
    console.error('Create password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, username, password, notes } = req.body;

    const existing = await pool.query('SELECT * FROM passwords WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Password not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE passwords SET name=$1, username=$2, password_encrypted=$3, notes=$4, updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *',
      [
        name !== undefined && String(name).trim() ? String(name).trim() : old.name,
        username !== undefined ? (username || null) : old.username,
        password !== undefined && String(password) !== '' ? encrypt(String(password)) : old.password_encrypted,
        notes !== undefined ? (notes || null) : old.notes,
        id,
        userId,
      ]
    );
    res.json(serialize(result.rows[0]));
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deletePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM passwords WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Password not found.' }); return; }
    res.json({ message: 'Password deleted successfully.' });
  } catch (error) {
    console.error('Delete password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
