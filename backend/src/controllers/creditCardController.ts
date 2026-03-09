import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getCreditCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const cards = db.prepare('SELECT * FROM credit_cards WHERE user_id = ? ORDER BY id').all(userId) as any[];

    const cardsWithCharges = cards.map((card) => {
      const charges = db.prepare(
        'SELECT * FROM credit_charges WHERE card_id = ? AND user_id = ? ORDER BY charge_date DESC'
      ).all(card.id, userId);
      return { ...card, charges };
    });

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

    if (!last4digits || last4digits.length !== 4) {
      res.status(400).json({ error: 'Last 4 digits are required and must be exactly 4 characters.' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO credit_cards (user_id, last4digits) VALUES (?, ?)'
    ).run(userId, last4digits);

    const row = db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    console.error('Create credit card error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    db.prepare('DELETE FROM credit_charges WHERE card_id = ? AND user_id = ?').run(id, userId);
    const result = db.prepare('DELETE FROM credit_cards WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Credit card not found.' });
      return;
    }

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

    if (!amount || !charge_date) {
      res.status(400).json({ error: 'Amount and charge_date are required.' });
      return;
    }

    const card = db.prepare('SELECT id FROM credit_cards WHERE id = ? AND user_id = ?').get(cardId, userId);
    if (!card) {
      res.status(404).json({ error: 'Credit card not found.' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO credit_charges (card_id, user_id, amount, charge_date, description) VALUES (?, ?, ?, ?, ?)'
    ).run(cardId, userId, amount, charge_date, description);

    const row = db.prepare('SELECT * FROM credit_charges WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
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

    const existing = db.prepare('SELECT * FROM credit_charges WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Charge not found.' });
      return;
    }

    db.prepare(
      'UPDATE credit_charges SET amount = ?, charge_date = ?, description = ? WHERE id = ? AND user_id = ?'
    ).run(
      amount || existing.amount,
      charge_date || existing.charge_date,
      description !== undefined ? description : existing.description,
      id, userId
    );

    const row = db.prepare('SELECT * FROM credit_charges WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    console.error('Update charge error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM credit_charges WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Charge not found.' });
      return;
    }

    res.json({ message: 'Charge deleted successfully.' });
  } catch (error) {
    console.error('Delete charge error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getUpcomingCharges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const rows = db.prepare(
      `SELECT cc.*, cr.last4digits
       FROM credit_charges cc
       JOIN credit_cards cr ON cc.card_id = cr.id
       WHERE cc.user_id = ? AND cc.charge_date >= date('now')
       ORDER BY cc.charge_date ASC`
    ).all(userId);

    res.json(rows);
  } catch (error) {
    console.error('Get upcoming charges error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
