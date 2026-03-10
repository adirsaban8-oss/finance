import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const items = await pool.query('SELECT * FROM asset_items WHERE user_id = $1 ORDER BY section, created_at', [userId]);

    const mine = items.rows.filter(i => i.section === 'mine');
    const debts = items.rows.filter(i => i.section === 'debt');
    const totalMine = mine.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const totalDebts = debts.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    const settings = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    const bankBalance = settings.rows.length > 0 ? Number(settings.rows[0].bank_balance) : 0;
    const netWorth = totalMine + bankBalance - totalDebts;

    res.json({ mine, debts, totalMine, totalDebts, bankBalance, netWorth });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const addAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, amount, section } = req.body;
    if (!name || !section) { res.status(400).json({ error: 'Name and section are required.' }); return; }
    if (section !== 'mine' && section !== 'debt') { res.status(400).json({ error: 'Section must be "mine" or "debt".' }); return; }

    const result = await pool.query(
      'INSERT INTO asset_items (user_id, name, amount, section) VALUES ($1,$2,$3,$4) RETURNING *',
      [userId, name, amount || 0, section]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, amount } = req.body;

    const existing = await pool.query('SELECT * FROM asset_items WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Asset item not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE asset_items SET name=$1, amount=$2 WHERE id=$3 AND user_id=$4 RETURNING *',
      [name || old.name, amount !== undefined ? amount : old.amount, id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM asset_items WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Asset item not found.' }); return; }
    res.json({ message: 'Asset item deleted successfully.' });
  } catch (error) {
    console.error('Delete asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const upsertAssets = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ error: 'Use individual asset item endpoints instead.' });
};
