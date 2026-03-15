'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import BudgetProgress from '@/components/BudgetProgress';
import ExpenseChart from '@/components/charts/ExpenseChart';
import CategoryChart from '@/components/charts/CategoryChart';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiTarget } from 'react-icons/fi';

const CATEGORIES = ['אוכל', 'תחבורה', 'קניות', 'בילויים', 'חשבונות', 'אחר'];

interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  description: string;
}

interface BudgetItem {
  category: string;
  spent: number;
  budget: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');

  // Budget form state
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  // Budget status
  const [budgetStatus, setBudgetStatus] = useState<{
    monthly_budget: number;
    total_spent: number;
    monthly_remaining: number;
    monthly_percentage: number;
    categories: BudgetItem[];
  } | null>(null);

  // Filter state
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchBudgetStatus();
  }, [filterMonth, filterCategory]);

  const fetchExpenses = async () => {
    try {
      const params: any = { month: filterMonth };
      if (filterCategory) params.category = filterCategory;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses || res.data);
      if (res.data.budgets) setBudgets(res.data.budgets);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetStatus = async () => {
    try {
      const res = await api.get('/budgets/status', { params: { month: filterMonth } });
      setBudgetStatus(res.data);
    } catch {
      setBudgetStatus(null);
    }
  };

  const openBudgetModal = async () => {
    try {
      const res = await api.get('/budgets', { params: { month: filterMonth } });
      const budgetData = res.data as any[];
      const monthly = budgetData.find((b: any) => !b.category);
      setMonthlyBudget(monthly ? String(monthly.monthly_budget || '') : '');
      const catBudgets: Record<string, string> = {};
      budgetData.forEach((b: any) => {
        if (b.category) catBudgets[b.category] = String(b.category_budget || '');
      });
      setCategoryBudgets(catBudgets);
    } catch {
      setMonthlyBudget('');
      setCategoryBudgets({});
    }
    setBudgetModalOpen(true);
  };

  const handleSaveBudget = async () => {
    try {
      // Save monthly budget
      if (monthlyBudget) {
        await api.post('/budgets', {
          month: filterMonth,
          monthly_budget: parseFloat(monthlyBudget) || 0,
        });
      }
      // Save category budgets
      for (const cat of CATEGORIES) {
        if (categoryBudgets[cat]) {
          await api.post('/budgets', {
            month: filterMonth,
            category: cat,
            category_budget: parseFloat(categoryBudgets[cat]) || 0,
          });
        }
      }
      toast.success('התקציב עודכן בהצלחה');
      setBudgetModalOpen(false);
      fetchBudgetStatus();
    } catch {
      toast.error('שגיאה בעדכון התקציב');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    try {
      const payload = {
        date,
        amount: parseFloat(amount),
        category,
        description,
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
        toast.success('ההוצאה עודכנה בהצלחה');
      } else {
        await api.post('/expenses', payload);
        toast.success('ההוצאה נוספה בהצלחה');
      }

      resetForm();
      setModalOpen(false);
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בשמירת ההוצאה');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההוצאה?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('ההוצאה נמחקה');
      fetchExpenses();
    } catch {
      toast.error('שגיאה במחיקת ההוצאה');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDate(expense.date.split('T')[0]);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDescription(expense.description);
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingExpense(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setCategory(CATEGORIES[0]);
    setDescription('');
  };

  // Monthly total
  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Chart data
  const categoryTotals = CATEGORIES.map((cat) => ({
    label: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.total > 0);

  const dailyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString('he-IL');
    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              הוצאות יומיות
            </h1>
            <div className="flex gap-2">
              <button
                onClick={openBudgetModal}
                className="btn-secondary flex items-center gap-2"
              >
                <FiTarget />
                הגדר תקציב
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus />
                הוסף הוצאה
              </button>
            </div>
          </div>

          {/* Monthly Budget Status */}
          {budgetStatus && budgetStatus.monthly_budget > 0 && (
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">מצב תקציב חודשי</h3>
                <span className="text-sm text-gray-500">
                  ₪{budgetStatus.total_spent.toLocaleString()} / ₪{budgetStatus.monthly_budget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className={`h-4 rounded-full transition-all ${
                    budgetStatus.monthly_percentage > 100
                      ? 'bg-red-500'
                      : budgetStatus.monthly_percentage > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetStatus.monthly_percentage, 100)}%` }}
                />
              </div>
              <p className={`text-sm ${budgetStatus.monthly_remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {budgetStatus.monthly_remaining >= 0
                  ? `נותרו ₪${budgetStatus.monthly_remaining.toLocaleString()}`
                  : `חריגה של ₪${Math.abs(budgetStatus.monthly_remaining).toLocaleString()}`}
              </p>
              {/* Category budgets */}
              {budgetStatus.categories.length > 0 && (
                <div className="mt-4 space-y-2">
                  {budgetStatus.categories.map((cat) => (
                    <BudgetProgress key={cat.category} category={cat.category} spent={cat.spent} budget={cat.budget} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Monthly Total */}
          <div className="card p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              סה&quot;כ הוצאות החודש
            </p>
            <p className="text-3xl font-bold text-red-500">
              ₪{monthlyTotal.toLocaleString()}
            </p>
          </div>

          {/* Filters */}
          <div className="card p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-sm"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm"
            >
              <option value="">כל הקטגוריות</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Expenses Table */}
              <div className="card overflow-x-auto">
                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    לא נמצאו הוצאות
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>תאריך</th>
                        <th>קטגוריה</th>
                        <th>תיאור</th>
                        <th>סכום</th>
                        <th>פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="animate-fadeIn">
                          <td>
                            {new Date(expense.date).toLocaleDateString('he-IL')}
                          </td>
                          <td>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {expense.category}
                            </span>
                          </td>
                          <td>{expense.description}</td>
                          <td className="font-medium text-red-500">
                            ₪{expense.amount.toLocaleString()}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(expense)}
                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryTotals.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      הוצאות לפי קטגוריה
                    </h3>
                    <CategoryChart
                      labels={categoryTotals.map((c) => c.label)}
                      data={categoryTotals.map((c) => c.total)}
                      title=""
                    />
                  </div>
                )}

                {Object.keys(dailyTotals).length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      הוצאות לפי יום
                    </h3>
                    <ExpenseChart
                      labels={Object.keys(dailyTotals)}
                      data={Object.values(dailyTotals)}
                      title=""
                    />
                  </div>
                )}
              </div>

              {/* Budget Progress */}
              {budgets.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    תקציב מול הוצאות בפועל
                  </h3>
                  {budgets.map((b) => (
                    <BudgetProgress
                      key={b.category}
                      category={b.category}
                      spent={b.spent}
                      budget={b.budget}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Budget Modal */}
          <Modal
            isOpen={budgetModalOpen}
            onClose={() => setBudgetModalOpen(false)}
            title={`הגדרת תקציב - ${filterMonth}`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תקציב חודשי כולל (₪)
                </label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">תקציב לפי קטגוריה (₪)</p>
                <div className="space-y-3">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 dark:text-gray-400 w-24">{cat}</label>
                      <input
                        type="number"
                        value={categoryBudgets[cat] || ''}
                        onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat]: e.target.value })}
                        className="flex-1"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveBudget} className="btn-primary flex-1">שמור</button>
                <button onClick={() => setBudgetModalOpen(false)} className="btn-secondary flex-1">ביטול</button>
              </div>
            </div>
          </Modal>

          {/* Add/Edit Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              resetForm();
            }}
            title={editingExpense ? 'עריכת הוצאה' : 'הוספת הוצאה'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תאריך
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  סכום
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  קטגוריה
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תיאור
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                  placeholder="תיאור ההוצאה"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingExpense ? 'עדכן' : 'הוסף'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
