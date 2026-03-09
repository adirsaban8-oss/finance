import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';
import ExcelJS from 'exceljs';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    // Total expenses this month
    const totalExpensesRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`
    ).get(userId, month) as any;
    const totalExpensesThisMonth = Number(totalExpensesRow.total);

    // Bank balance and monthly income from user_settings
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
    const bankBalance = settings ? Number(settings.bank_balance) : 0;
    const baseMonthlyIncome = settings ? Number(settings.monthly_income) : 0;

    // Additional income from shifts
    const incomeRow = db.prepare(
      `SELECT COALESCE(SUM(hours * COALESCE(hourly_wage, 0)), 0) as total_income
       FROM shifts WHERE user_id = ? AND strftime('%Y-%m', date) = ?`
    ).get(userId, month) as any;
    const shiftIncome = Number(incomeRow.total_income);
    const monthlyIncome = baseMonthlyIncome + shiftIncome;

    const monthlyBalance = monthlyIncome - totalExpensesThisMonth;

    // Net worth from asset_items
    const mineRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM asset_items WHERE user_id = ? AND section = 'mine'`
    ).get(userId) as any;
    const debtRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM asset_items WHERE user_id = ? AND section = 'debt'`
    ).get(userId) as any;
    const netWorth = Number(mineRow.total) + bankBalance - Number(debtRow.total);

    // Upcoming credit charges
    const upcomingRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM credit_charges WHERE user_id = ? AND charge_date >= date('now')`
    ).get(userId) as any;
    const upcomingCreditCharges = Number(upcomingRow.total);

    // Expenses by category
    const categoryRows = db.prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?
       GROUP BY category ORDER BY total DESC`
    ).all(userId, month) as any[];
    const expensesByCategory = categoryRows.map((row: any) => ({
      category: row.category,
      total: Number(row.total),
    }));

    // Daily expenses
    const dailyRows = db.prepare(
      `SELECT strftime('%Y-%m-%d', date) as day, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?
       GROUP BY day ORDER BY day`
    ).all(userId, month) as any[];
    const dailyExpenses = dailyRows.map((row: any) => ({
      day: row.day,
      total: Number(row.total),
    }));

    // Monthly trend (last 6 months)
    const trendRows = db.prepare(
      `SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = ?
       AND date >= date(? || '-01', '-5 months')
       AND date < date(? || '-01', '+1 month')
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month`
    ).all(userId, month, month) as any[];
    const monthlyTrend = trendRows.map((row: any) => ({
      month: row.month,
      total: Number(row.total),
    }));

    // Recent expenses
    const recentExpenses = db.prepare(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 5'
    ).all(userId);

    // Budget status
    const budgets = db.prepare(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?'
    ).all(userId, month) as any[];

    const budgetStatus = budgets.map((budget: any) => {
      const catExpense = expensesByCategory.find((e: any) => e.category === budget.category);
      const spent = catExpense ? catExpense.total : 0;
      const budgetAmount = Number(budget.category_budget) || 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        category: budget.category,
        budget: budgetAmount,
        spent,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    // Insights
    const insights: string[] = [];

    const prevMonth = getPreviousMonth(month);
    const prevCategoryRows = db.prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?
       GROUP BY category`
    ).all(userId, prevMonth) as any[];

    const prevCategoryMap: Record<string, number> = {};
    prevCategoryRows.forEach((row: any) => {
      prevCategoryMap[row.category] = Number(row.total);
    });

    for (const cat of expensesByCategory) {
      const prevTotal = prevCategoryMap[cat.category] || 0;
      if (prevTotal > 0) {
        const changePercent = ((cat.total - prevTotal) / prevTotal) * 100;
        if (changePercent > 20) {
          insights.push(`ההוצאות בקטגוריית ${cat.category} עלו ב-${Math.round(changePercent)}% לעומת החודש הקודם`);
        } else if (changePercent < -20) {
          insights.push(`ההוצאות בקטגוריית ${cat.category} ירדו ב-${Math.round(Math.abs(changePercent))}% לעומת החודש הקודם`);
        }
      }
    }

    for (const bs of budgetStatus) {
      if (bs.percentage >= 100) {
        insights.push(`חרגת מהתקציב בקטגוריית ${bs.category}! הוצאת ${bs.spent} מתוך ${bs.budget}`);
      } else if (bs.percentage >= 80) {
        insights.push(`שים לב: הגעת ל-${Math.round(bs.percentage)}% מהתקציב בקטגוריית ${bs.category}`);
      }
    }

    const overallBudget = budgets.length > 0 ? Number(budgets[0].monthly_budget) || 0 : 0;
    if (overallBudget > 0) {
      const overallPercent = (totalExpensesThisMonth / overallBudget) * 100;
      if (overallPercent >= 100) {
        insights.push(`חרגת מהתקציב החודשי! הוצאת ${totalExpensesThisMonth} מתוך ${overallBudget}`);
      } else if (overallPercent >= 80) {
        insights.push(`שים לב: הגעת ל-${Math.round(overallPercent)}% מהתקציב החודשי הכולל`);
      }
    }

    if (monthlyBalance < 0) {
      insights.push(`המאזן החודשי שלילי: ההוצאות עולות על ההכנסות ב-${Math.abs(monthlyBalance).toFixed(2)} ש"ח`);
    }

    res.json({
      currentDate: new Date().toISOString().split('T')[0],
      totalExpensesThisMonth,
      bankBalance,
      monthlyIncome,
      monthlyBalance,
      upcomingCreditCharges,
      netWorth,
      expensesByCategory,
      dailyExpenses,
      monthlyTrend,
      recentExpenses,
      budgetStatus,
      insights,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const exportExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const rows = db.prepare(
      `SELECT date, amount, category, description
       FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?
       ORDER BY date`
    ).all(userId, month) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((row: any) => {
      worksheet.addRow({
        date: row.date,
        amount: Number(row.amount),
        category: row.category,
        description: row.description || '',
      });
    });

    const totalRow = worksheet.addRow({
      date: 'Total',
      amount: rows.reduce((sum: number, row: any) => sum + Number(row.amount), 0),
      category: '',
      description: '',
    });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${month}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

function getPreviousMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
