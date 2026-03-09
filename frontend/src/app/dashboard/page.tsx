'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import BudgetProgress from '@/components/BudgetProgress';
import ExpenseChart from '@/components/charts/ExpenseChart';
import CategoryChart from '@/components/charts/CategoryChart';
import TrendChart from '@/components/charts/TrendChart';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiFileText,
  FiTrendingUp,
  FiCreditCard,
  FiPieChart,
  FiArrowUp,
  FiArrowDown,
  FiEdit2,
} from 'react-icons/fi';

interface DashboardData {
  totalExpensesThisMonth: number;
  bankBalance: number;
  monthlyIncome: number;
  monthlyBalance: number;
  upcomingCreditCharges: number;
  netWorth: number;
  expensesByCategory: { category: string; total: number }[];
  dailyExpenses: { day: string; total: number }[];
  monthlyTrend: { month: string; total: number }[];
  recentExpenses: {
    id: number;
    date: string;
    amount: number;
    category: string;
    description: string;
  }[];
  budgetStatus: { category: string; budget: number; spent: number; percentage: number }[];
  insights: string[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable settings
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editBankBalance, setEditBankBalance] = useState('');
  const [editMonthlyIncome, setEditMonthlyIncome] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setData({
        totalExpensesThisMonth: 0, bankBalance: 0, monthlyIncome: 0,
        monthlyBalance: 0, upcomingCreditCharges: 0, netWorth: 0,
        expensesByCategory: [], dailyExpenses: [], monthlyTrend: [],
        recentExpenses: [], budgetStatus: [], insights: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const openSettingsModal = async () => {
    try {
      const res = await api.get('/settings');
      setEditBankBalance(String(res.data.bank_balance || 0));
      setEditMonthlyIncome(String(res.data.monthly_income || 0));
    } catch {
      setEditBankBalance('0');
      setEditMonthlyIncome('0');
    }
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/settings', {
        bank_balance: parseFloat(editBankBalance) || 0,
        monthly_income: parseFloat(editMonthlyIncome) || 0,
      });
      toast.success('הנתונים עודכנו בהצלחה');
      setSettingsModalOpen(false);
      fetchDashboard();
    } catch {
      toast.error('שגיאה בעדכון הנתונים');
    }
  };

  const formatCurrency = (amount: number) => `₪${amount.toLocaleString()}`;

  const getHebrewDate = () => {
    return new Date().toLocaleDateString('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Greeting */}
          <div className="card p-4 sm:p-6 bg-gradient-to-l from-primary to-secondary text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">שלום, {user}!</h2>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">{getHebrewDate()}</p>
              </div>
              <button
                onClick={openSettingsModal}
                className="p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                title="עדכון נתוני בסיס"
              >
                <FiEdit2 size={20} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : data ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="סך הוצאות החודש"
                  value={formatCurrency(data.totalExpensesThisMonth)}
                  icon={FiFileText}
                  color="bg-red-500"
                />
                <StatCard
                  title="יתרה בבנק"
                  value={formatCurrency(data.bankBalance)}
                  icon={FiPieChart}
                  color="bg-blue-500"
                  onEdit={openSettingsModal}
                />
                <StatCard
                  title="הכנסה החודש"
                  value={formatCurrency(data.monthlyIncome)}
                  icon={FiArrowUp}
                  color="bg-green-500"
                  onEdit={openSettingsModal}
                />
                <StatCard
                  title="מאזן חודשי"
                  value={formatCurrency(data.monthlyBalance)}
                  icon={data.monthlyBalance >= 0 ? FiArrowUp : FiArrowDown}
                  color={data.monthlyBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}
                />
                <StatCard
                  title="חיובי אשראי צפויים"
                  value={formatCurrency(data.upcomingCreditCharges)}
                  icon={FiCreditCard}
                  color="bg-yellow-500"
                />
                <StatCard
                  title="שווי נקי"
                  value={formatCurrency(data.netWorth)}
                  icon={FiTrendingUp}
                  color="bg-purple-500"
                />
              </div>

              {/* Budget Progress */}
              {data.budgetStatus.length > 0 && (
                <div className="card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">מצב תקציב</h3>
                  {data.budgetStatus.map((budget) => (
                    <BudgetProgress key={budget.category} category={budget.category} spent={budget.spent} budget={budget.budget} />
                  ))}
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {data.dailyExpenses.length > 0 && (
                  <div className="card p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">הוצאות יומיות</h3>
                    <ExpenseChart labels={data.dailyExpenses.map(d => d.day)} data={data.dailyExpenses.map(d => d.total)} title="" />
                  </div>
                )}
                {data.expensesByCategory.length > 0 && (
                  <div className="card p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">הוצאות לפי קטגוריה</h3>
                    <CategoryChart labels={data.expensesByCategory.map(c => c.category)} data={data.expensesByCategory.map(c => c.total)} title="" />
                  </div>
                )}
              </div>

              {data.monthlyTrend.length > 0 && (
                <div className="card p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">מגמת הוצאות לאורך חודשים</h3>
                  <TrendChart labels={data.monthlyTrend.map(t => t.month)} data={data.monthlyTrend.map(t => t.total)} title="" />
                </div>
              )}

              {/* Recent Expenses */}
              {data.recentExpenses.length > 0 && (
                <div className="card p-4 sm:p-6 overflow-x-auto">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">הוצאות אחרונות</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>תאריך</th>
                        <th>קטגוריה</th>
                        <th className="hidden sm:table-cell">תיאור</th>
                        <th>סכום</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentExpenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="text-xs sm:text-sm">{new Date(expense.date).toLocaleDateString('he-IL')}</td>
                          <td className="text-xs sm:text-sm">{expense.category}</td>
                          <td className="hidden sm:table-cell text-sm">{expense.description}</td>
                          <td className="font-medium text-red-500 text-xs sm:text-sm">₪{expense.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Insights */}
              {data.insights.length > 0 && (
                <div className="card p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">תובנות</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.insights.map((insight, idx) => (
                      <div key={idx} className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Settings Modal */}
          <Modal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            title="עדכון נתוני בסיס"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">יתרה בבנק (₪)</label>
                <input
                  type="number"
                  value={editBankBalance}
                  onChange={(e) => setEditBankBalance(e.target.value)}
                  className="w-full"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">הכנסה חודשית בסיסית (₪)</label>
                <input
                  type="number"
                  value={editMonthlyIncome}
                  onChange={(e) => setEditMonthlyIncome(e.target.value)}
                  className="w-full"
                  step="0.01"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">הכנסה ממשמרות תתווסף אוטומטית</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveSettings} className="btn-primary flex-1">שמור</button>
                <button onClick={() => setSettingsModalOpen(false)} className="btn-secondary flex-1">ביטול</button>
              </div>
            </div>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
