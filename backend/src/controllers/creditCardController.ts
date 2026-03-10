import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getCreditCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const cards = await pool.query('SELECT * FROM credit_cards WHERE user_id = $1 ORDER BY id', [userId]);

    const cardsWithCharges = await Promise.all(cards.rows.map(async (card) => {
      const charges = await pool.query(
        'SELECT * FROM credit_charges WHERE card_id = $1 AND user_id = $2 ORDER BY charge_date DESC',
        [card.id, userId]
      );
      return { ...card, charges: charges.rows };
    }));

    res.json(cardsWithCharges);
  } catch (error) {
    console.error('Get credit cards error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { last4digits } = req.body;
    if (!last4digits || last4digits.length !== 4) { res.status(400).json({ error: 'Last 4 digits are required and must be exactly 4 characters.' }); return; }

    const result = await pool.query('INSERT INTO credit_cards (user_id, last4digits) VALUES ($1,$2) RETURNING *', [userId, last4digits]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create credit card error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await pool.query('DELETE FROM credit_charges WHERE card_id = $1 AND user_id = $2', [id, userId]);
    const result = await pool.query('DELETE FROM credit_cards WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Credit card not found.' }); return; }
    res.json({ message: 'Credit card deleted successfully.' });
  } catch (error) {
    console.error('Delete credit card error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const addCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { cardId } = req.params;
    const { amount, charge_date, description } = req.body;
    if (!amount || !charge_date) { res.status(400).json({ error: 'Amount and charge_date are required.' }); return; }

    const card = await pool.query('SELECT id FROM credit_cards WHERE id=$1 AND user_id=$2', [cardId, userId]);
    if (card.rows.length === 0) { res.status(404).json({ error: 'Credit card not found.' }); return; }

    const result = await pool.query(
      'INSERT INTO credit_charges (card_id, user_id, amount, charge_date, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [cardId, userId, amount, charge_date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add charge error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { amount, charge_date, description } = req.body;

    const existing = await pool.query('SELECT * FROM credit_charges WHERE id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Charge not found.' }); return; }
    const old = existing.rows[0];

    const result = await pool.query(
      'UPDATE credit_charges SET amount=$1, charge_date=$2, description=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [amount || old.amount, charge_date || old.charge_date, description !== undefined ? description : old.description, id, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update charge error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM credit_charges WHERE id=$1 AND user_id=$2', [id, userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: 'Charge not found.' }); return; }
    res.json({ message: 'Charge deleted successfully.' });
  } catch (error) {
    console.error('Delete charge error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getUpcomingCharges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `SELECT cc.*, cr.last4digits FROM credit_charges cc JOIN credit_cards cr ON cc.card_id = cr.id WHERE cc.user_id = $1 AND cc.charge_date >= CURRENT_DATE ORDER BY cc.charge_date ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get upcoming charges error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
