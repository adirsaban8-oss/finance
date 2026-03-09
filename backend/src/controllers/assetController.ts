import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

// Get all asset items grouped by section
export const getAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const items = db.prepare(
      'SELECT * FROM asset_items WHERE user_id = ? ORDER BY section, created_at'
    ).all(userId) as any[];

    const mine = items.filter(i => i.section === 'mine');
    const debts = items.filter(i => i.section === 'debt');

    const totalMine = mine.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const totalDebts = debts.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    // Include bank balance from user_settings
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
    const bankBalance = settings ? Number(settings.bank_balance) : 0;

    const netWorth = totalMine + bankBalance - totalDebts;

    res.json({
      mine,
      debts,
      totalMine,
      totalDebts,
      bankBalance,
      netWorth,
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Add a new asset item
export const addAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, amount, section } = req.body;

    if (!name || !section) {
      res.status(400).json({ error: 'Name and section are required.' });
      return;
    }

    if (section !== 'mine' && section !== 'debt') {
      res.status(400).json({ error: 'Section must be "mine" or "debt".' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO asset_items (user_id, name, amount, section) VALUES (?, ?, ?, ?)'
    ).run(userId, name, amount || 0, section);

    const row = db.prepare('SELECT * FROM asset_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    console.error('Add asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Update an asset item
export const updateAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, amount } = req.body;

    const existing = db.prepare('SELECT * FROM asset_items WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Asset item not found.' });
      return;
    }

    db.prepare(
      'UPDATE asset_items SET name = ?, amount = ? WHERE id = ? AND user_id = ?'
    ).run(name || existing.name, amount !== undefined ? amount : existing.amount, id, userId);

    const row = db.prepare('SELECT * FROM asset_items WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    console.error('Update asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Delete an asset item
export const deleteAssetItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM asset_items WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Asset item not found.' });
      return;
    }

    res.json({ message: 'Asset item deleted successfully.' });
  } catch (error) {
    console.error('Delete asset item error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Keep backward compat - upsertAssets not needed anymore but keeping route
export const upsertAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ error: 'Use individual asset item endpoints instead.' });
};
