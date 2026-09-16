import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const toNumber = (value: unknown): number => {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
};

export const getVouchers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM vouchers WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const vouchers = result.rows.map((v) => ({
      ...v,
      initial_amount: toNumber(v.initial_amount),
      balance: toNumber(v.balance),
    }));
    const totalBalance = vouchers.reduce((sum, v) => sum + v.balance, 0);
    const totalInitial = vouchers.reduce((sum, v) => sum + v.initial_amount, 0);
    res.json({ vouchers, totalBalance, totalInitial, totalUsed: totalInitial - totalBalance });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getVoucherUsages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM voucher_usages WHERE voucher_id = $1 AND user_id = $2 ORDER BY used_at DESC',
      [id, userId]
    );
    res.json(result.rows.map((u) => ({ ...u, amount: toNumber(u.amount) })));
  } catch (error) {
    console.error('Get voucher usages error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, initial_amount, balance, expiry_date, notes } = req.body;
    if (!name || !String(name).trim()) { res.status(400).json({ error: 'Name is required.' }); return; }

    const initial = toNumber(initial_amount);
    const bal = balance !== undefined && balance !== null && balance !== '' ? toNumber(balance) : initial;
    if (initial < 0 || bal < 0) { res.status(400).json({ error: 'Amounts must be positive.' }); return; }

    const result = await pool.query(
      'INSERT INTO vouchers (user_id, name, initial_amount, balance, expiry_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, String(name).trim(), initial, bal, expiry_date || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, initial_amount, balance, expiry_date, notes } = req.body;

    const existing = await pool.query('SELECT * FROM vouchers WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Voucher not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE vouchers SET name=$1, initial_amount=$2, balance=$3, expiry_date=$4, notes=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
      [
        name !== undefined && String(name).trim() ? String(name).trim() : old.name,
        initial_amount !== undefined ? toNumber(initial_amount) : old.initial_amount,
        balance !== undefined ? toNumber(balance) : old.balance,
        expiry_date !== undefined ? (expiry_date || null) : old.expiry_date,
        notes !== undefined ? (notes || null) : old.notes,
        id,
        userId,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Record a usage: deducts amount from the voucher balance.
export const useVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { id } = req.params;
    const amount = toNumber(req.body.amount);
    const description = req.body.description || null;
    if (amount <= 0) { res.status(400).json({ error: 'Amount must be greater than zero.' }); return; }

    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM vouchers WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Voucher not found.' });
      return;
    }
    const currentBalance = toNumber(existing.rows[0].balance);
    if (amount > currentBalance) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Amount exceeds voucher balance.' });
      return;
    }

    await client.query(
      'INSERT INTO voucher_usages (voucher_id, user_id, amount, description) VALUES ($1,$2,$3,$4)',
      [id, userId, amount, description]
    );
    const updated = await client.query(
      'UPDATE vouchers SET balance = balance - $1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [amount, id, userId]
    );
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Use voucher error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

export const deleteVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vouchers WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Voucher not found.' }); return; }
    res.json({ message: 'Voucher deleted successfully.' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
