import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const toNumber = (value: unknown): number => {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
};

const isValidMonth = (month: unknown): boolean => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month));

export const getSalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { year } = req.query;

    let query = 'SELECT * FROM salaries WHERE user_id = $1';
    const params: any[] = [userId];
    if (year && /^\d{4}$/.test(String(year))) {
      query += ' AND month LIKE $2';
      params.push(`${year}-%`);
    }
    query += ' ORDER BY month DESC, created_at DESC';

    const result = await pool.query(query, params);
    const salaries = result.rows.map((s) => ({
      ...s,
      gross: toNumber(s.gross),
      net: toNumber(s.net),
      deductions: toNumber(s.gross) - toNumber(s.net),
    }));

    const totalGross = salaries.reduce((sum, s) => sum + s.gross, 0);
    const totalNet = salaries.reduce((sum, s) => sum + s.net, 0);
    const months = new Set(salaries.map((s) => s.month)).size;

    res.json({
      salaries,
      totalGross,
      totalNet,
      totalDeductions: totalGross - totalNet,
      averageNet: months > 0 ? totalNet / months : 0,
      averageGross: months > 0 ? totalGross / months : 0,
      months,
    });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month, employer, gross, net, notes } = req.body;
    if (!isValidMonth(month)) { res.status(400).json({ error: 'Month must be in YYYY-MM format.' }); return; }

    const grossNum = toNumber(gross);
    const netNum = toNumber(net);
    if (grossNum < 0 || netNum < 0) { res.status(400).json({ error: 'Amounts must be positive.' }); return; }

    const result = await pool.query(
      'INSERT INTO salaries (user_id, month, employer, gross, net, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, month, employer || null, grossNum, netNum, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { month, employer, gross, net, notes } = req.body;

    const existing = await pool.query('SELECT * FROM salaries WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Salary not found.' }); return; }
    const old = existing.rows[0];

    if (month !== undefined && !isValidMonth(month)) {
      res.status(400).json({ error: 'Month must be in YYYY-MM format.' });
      return;
    }

    const result = await pool.query(
      'UPDATE salaries SET month=$1, employer=$2, gross=$3, net=$4, notes=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
      [
        month !== undefined ? month : old.month,
        employer !== undefined ? (employer || null) : old.employer,
        gross !== undefined ? toNumber(gross) : old.gross,
        net !== undefined ? toNumber(net) : old.net,
        notes !== undefined ? (notes || null) : old.notes,
        id,
        userId,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM salaries WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Salary not found.' }); return; }
    res.json({ message: 'Salary deleted successfully.' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
