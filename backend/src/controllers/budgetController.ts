import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month } = req.query;
    let query = 'SELECT * FROM budgets WHERE user_id = $1';
    const params: any[] = [userId];
    if (month) {
      query += ' AND month = $2';
      params.push(month);
    }
    query += ' ORDER BY category ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createOrUpdateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { month, monthly_budget, category, category_budget } = req.body;
    if (!month) { res.status(400).json({ error: 'Month is required.' }); return; }

    const existing = await pool.query(
      'SELECT id FROM budgets WHERE user_id = $1 AND month = $2 AND category IS NOT DISTINCT FROM $3',
      [userId, month, category || null]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE budgets SET monthly_budget=$1, category_budget=$2 WHERE id=$3 RETURNING *',
        [monthly_budget || null, category_budget || null, existing.rows[0].id]
      );
      res.status(200).json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO budgets (user_id, month, monthly_budget, category, category_budget) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [userId, month, monthly_budget || null, category || null, category_budget || null]
      );
      res.status(201).json(result.rows[0]);
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
    if (!month) { res.status(400).json({ error: 'Month query parameter is required.' }); return; }

    const budgets = await pool.query('SELECT * FROM budgets WHERE user_id=$1 AND month=$2', [userId, month]);

    const expenses = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) as total_spent FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 GROUP BY category`,
      [userId, month]
    );
    const expenseMap: Record<string, number> = {};
    expenses.rows.forEach((row: any) => { expenseMap[row.category] = Number(row.total_spent); });

    const totalSpentResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total_spent FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2`,
      [userId, month]
    );
    const totalSpent = Number(totalSpentResult.rows[0].total_spent);

    const categoryStatus = budgets.rows.map((budget: any) => {
      const spent = expenseMap[budget.category] || 0;
      const budgetAmount = Number(budget.category_budget) || 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      return { category: budget.category, budget: budgetAmount, spent, remaining: budgetAmount - spent, percentage: Math.round(percentage * 100) / 100 };
    });

    const monthlyBudget = budgets.rows.length > 0 ? Number(budgets.rows[0].monthly_budget) || 0 : 0;
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
