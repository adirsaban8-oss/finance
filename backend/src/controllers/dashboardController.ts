import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import ExcelJS from 'exceljs';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const totalExpensesRow = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2`, [userId, month]
    );
    const totalExpensesThisMonth = Number(totalExpensesRow.rows[0].total);

    const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_id=$1', [userId]);
    const settings = settingsResult.rows[0];
    const bankBalance = settings ? Number(settings.bank_balance) : 0;
    const baseMonthlyIncome = settings ? Number(settings.monthly_income) : 0;

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(hours * COALESCE(hourly_wage,0)),0) as total_income FROM shifts WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2`, [userId, month]
    );
    const shiftIncome = Number(incomeResult.rows[0].total_income);
    const monthlyIncome = baseMonthlyIncome + shiftIncome;
    const monthlyBalance = monthlyIncome - totalExpensesThisMonth;

    const mineResult = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM asset_items WHERE user_id=$1 AND section='mine'`, [userId]);
    const debtResult = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM asset_items WHERE user_id=$1 AND section='debt'`, [userId]);
    const netWorth = Number(mineResult.rows[0].total) + bankBalance - Number(debtResult.rows[0].total);

    const upcomingResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM credit_charges WHERE user_id=$1 AND charge_date >= CURRENT_DATE`, [userId]
    );
    const upcomingCreditCharges = Number(upcomingResult.rows[0].total);

    const categoryResult = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 GROUP BY category ORDER BY total DESC`, [userId, month]
    );
    const expensesByCategory = categoryResult.rows.map((r: any) => ({ category: r.category, total: Number(r.total) }));

    const dailyResult = await pool.query(
      `SELECT TO_CHAR(date,'YYYY-MM-DD') as day, COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 GROUP BY day ORDER BY day`, [userId, month]
    );
    const dailyExpenses = dailyResult.rows.map((r: any) => ({ day: r.day, total: Number(r.total) }));

    const trendResult = await pool.query(
      `SELECT TO_CHAR(date,'YYYY-MM') as month, COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=$1 AND date >= (($2 || '-01')::date - interval '5 months') AND date < (($2 || '-01')::date + interval '1 month') GROUP BY TO_CHAR(date,'YYYY-MM') ORDER BY month`, [userId, month]
    );
    const monthlyTrend = trendResult.rows.map((r: any) => ({ month: r.month, total: Number(r.total) }));

    const recentResult = await pool.query('SELECT * FROM expenses WHERE user_id=$1 ORDER BY date DESC, created_at DESC LIMIT 5', [userId]);
    const recentExpenses = recentResult.rows;

    const budgetsResult = await pool.query('SELECT * FROM budgets WHERE user_id=$1 AND month=$2', [userId, month]);
    const budgetStatus = budgetsResult.rows.map((budget: any) => {
      const catExpense = expensesByCategory.find((e: any) => e.category === budget.category);
      const spent = catExpense ? catExpense.total : 0;
      const budgetAmount = Number(budget.category_budget) || 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      return { category: budget.category, budget: budgetAmount, spent, percentage: Math.round(percentage * 100) / 100 };
    });

    // Insights
    const insights: string[] = [];
    const prevMonth = getPreviousMonth(month);
    const prevCatResult = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 GROUP BY category`, [userId, prevMonth]
    );
    const prevCategoryMap: Record<string, number> = {};
    prevCatResult.rows.forEach((r: any) => { prevCategoryMap[r.category] = Number(r.total); });

    for (const cat of expensesByCategory) {
      const prevTotal = prevCategoryMap[cat.category] || 0;
      if (prevTotal > 0) {
        const changePercent = ((cat.total - prevTotal) / prevTotal) * 100;
        if (changePercent > 20) insights.push(`ההוצאות בקטגוריית ${cat.category} עלו ב-${Math.round(changePercent)}% לעומת החודש הקודם`);
        else if (changePercent < -20) insights.push(`ההוצאות בקטגוריית ${cat.category} ירדו ב-${Math.round(Math.abs(changePercent))}% לעומת החודש הקודם`);
      }
    }
    for (const bs of budgetStatus) {
      if (bs.percentage >= 100) insights.push(`חרגת מהתקציב בקטגוריית ${bs.category}! הוצאת ${bs.spent} מתוך ${bs.budget}`);
      else if (bs.percentage >= 80) insights.push(`שים לב: הגעת ל-${Math.round(bs.percentage)}% מהתקציב בקטגוריית ${bs.category}`);
    }
    const overallBudget = budgetsResult.rows.length > 0 ? Number(budgetsResult.rows[0].monthly_budget) || 0 : 0;
    if (overallBudget > 0) {
      const overallPercent = (totalExpensesThisMonth / overallBudget) * 100;
      if (overallPercent >= 100) insights.push(`חרגת מהתקציב החודשי! הוצאת ${totalExpensesThisMonth} מתוך ${overallBudget}`);
      else if (overallPercent >= 80) insights.push(`שים לב: הגעת ל-${Math.round(overallPercent)}% מהתקציב החודשי הכולל`);
    }
    if (monthlyBalance < 0) insights.push(`המאזן החודשי שלילי: ההוצאות עולות על ההכנסות ב-${Math.abs(monthlyBalance).toFixed(2)} ש"ח`);

    res.json({
      currentDate: new Date().toISOString().split('T')[0],
      totalExpensesThisMonth, bankBalance, monthlyIncome, monthlyBalance,
      upcomingCreditCharges, netWorth, expensesByCategory, dailyExpenses,
      monthlyTrend, recentExpenses, budgetStatus, insights,
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

    const result = await pool.query(
      `SELECT date, amount, category, description FROM expenses WHERE user_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 ORDER BY date`, [userId, month]
    );
    const rows = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    rows.forEach((row: any) => {
      worksheet.addRow({ date: row.date, amount: Number(row.amount), category: row.category, description: row.description || '' });
    });
    const totalRow = worksheet.addRow({ date: 'Total', amount: rows.reduce((sum: number, r: any) => sum + Number(r.amount), 0), category: '', description: '' });
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
