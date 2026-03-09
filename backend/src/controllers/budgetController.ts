import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    const params: any[] = [userId];

    if (month) {
      query += ' AND month = ?';
      params.push(month);
    }

    query += ' ORDER BY category ASC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createOrUpdateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month, monthly_budget, category, category_budget } = req.body;

    if (!month) {
      res.status(400).json({ error: 'Month is required.' });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM budgets WHERE user_id = ? AND month = ? AND category IS ?'
    ).get(userId, month, category || null) as any;

    if (existing) {
      db.prepare(
        'UPDATE budgets SET monthly_budget = ?, category_budget = ? WHERE id = ?'
      ).run(monthly_budget || null, category_budget || null, existing.id);

      const row = db.prepare('SELECT * FROM budgets WHERE id = ?').get(existing.id);
      res.status(200).json(row);
    } else {
      const result = db.prepare(
        'INSERT INTO budgets (user_id, month, monthly_budget, category, category_budget) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, month, monthly_budget || null, category || null, category_budget || null);

      const row = db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(row);
    }
  } catch (error) {
    console.error('Create/update budget error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getBudgetStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    if (!month) {
      res.status(400).json({ error: 'Month query parameter is required.' });
      return;
    }

    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ?').all(userId, month) as any[];

    const expenses = db.prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total_spent
       FROM expenses
       WHERE user_id = ? AND strftime('%Y-%m', date) = ?
       GROUP BY category`
    ).all(userId, month) as any[];

    const expenseMap: Record<string, number> = {};
    expenses.forEach((row: any) => {
      expenseMap[row.category] = Number(row.total_spent);
    });

    const totalSpentRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total_spent
       FROM expenses
       WHERE user_id = ? AND strftime('%Y-%m', date) = ?`
    ).get(userId, month) as any;
    const totalSpent = Number(totalSpentRow.total_spent);

    const categoryStatus = budgets.map((budget: any) => {
      const spent = expenseMap[budget.category] || 0;
      const budgetAmount = Number(budget.category_budget) || 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        category: budget.category,
        budget: budgetAmount,
        spent,
        remaining: budgetAmount - spent,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    const monthlyBudget = budgets.length > 0 ? Number(budgets[0].monthly_budget) || 0 : 0;
    const monthlyPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    res.json({
      monthly_budget: monthlyBudget,
      total_spent: totalSpent,
      monthly_remaining: monthlyBudget - totalSpent,
      monthly_percentage: Math.round(monthlyPercentage * 100) / 100,
      categories: categoryStatus,
    });
  } catch (error) {
    console.error('Get budget status error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
