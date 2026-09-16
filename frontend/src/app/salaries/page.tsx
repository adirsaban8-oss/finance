'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';

interface Salary {
  id: number;
  month: string;
  employer?: string | null;
  gross: number;
  net: number;
  deductions: number;
  notes?: string | null;
}

interface SalarySummary {
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  averageNet: number;
  averageGross: number;
  months: number;
}

const emptySummary: SalarySummary = {
  totalGross: 0,
  totalNet: 0,
  totalDeductions: 0,
  averageNet: 0,
  averageGross: 0,
  months: 0,
};

const formatCurrency = (amount: number) =>
  `₪${Number(amount).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;

const formatMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
};

const currentYear = new Date().getFullYear();

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<SalarySummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>(String(currentYear));
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employer, setEmployer] = useState('');
  const [gross, setGross] = useState('');
  const [net, setNet] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [year]);

  // Pull every record once to know which years exist for the filter.
  const fetchYears = async () => {
    try {
      const res = await api.get('/salaries');
      const years = new Set<number>([currentYear]);
      (res.data.salaries || []).forEach((s: Salary) => years.add(Number(s.month.slice(0, 4))));
      setAvailableYears(Array.from(years).sort((a, b) => b - a));
    } catch {
      /* keep default */
    }
  };

  const fetchSalaries = async () => {
    try {
      const res = await api.get('/salaries', { params: year === 'all' ? {} : { year } });
      setSalaries(res.data.salaries || []);
      setSummary({
        totalGross: res.data.totalGross || 0,
        totalNet: res.data.totalNet || 0,
        totalDeductions: res.data.totalDeductions || 0,
        averageNet: res.data.averageNet || 0,
        averageGross: res.data.averageGross || 0,
        months: res.data.months || 0,
      });
    } catch (error) {
      console.error('Error fetching salaries:', error);
      setSalaries([]);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setMonth(new Date().toISOString().slice(0, 7));
    setEmployer('');
    setGross('');
    setNet('');
    setNotes('');
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (salary: Salary) => {
    setEditing(salary);
    setMonth(salary.month);
    setEmployer(salary.employer || '');
    setGross(String(salary.gross));
    setNet(String(salary.net));
    setNotes(salary.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;

    const grossNum = parseFloat(gross) || 0;
    const netNum = parseFloat(net) || 0;
    if (netNum > grossNum && grossNum > 0) {
      toast.error('הנטו לא יכול להיות גדול מהברוטו');
      return;
    }

    const payload = {
      month,
      employer: employer.trim() || null,
      gross: grossNum,
      net: netNum,
      notes: notes.trim() || null,
    };

    try {
      if (editing) {
        await api.put(`/salaries/${editing.id}`, payload);
        toast.success('המשכורת עודכנה');
      } else {
        await api.post('/salaries', payload);
        toast.success('המשכורת נוספה');
      }
      setModalOpen(false);
      resetForm();
      fetchSalaries();
      fetchYears();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בשמירת המשכורת');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשכורת?')) return;
    try {
      await api.delete(`/salaries/${id}`);
      toast.success('המשכורת נמחקה');
      fetchSalaries();
      fetchYears();
    } catch {
      toast.error('שגיאה במחיקת המשכורת');
    }
  };

  const previewDeductions = (parseFloat(gross) || 0) - (parseFloat(net) || 0);
  const previewPercent = parseFloat(gross) > 0 ? (previewDeductions / parseFloat(gross)) * 100 : 0;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-24 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">מאזן משכורות</h1>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <FiPlus />
              הוסף משכורת
            </button>
          </div>

          {/* Year filter */}
          <div className="card p-3 sm:p-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">שנה</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="text-sm flex-1 sm:flex-none">
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
              <option value="all">כל השנים</option>
            </select>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="card p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">סה&quot;כ נטו</p>
              <p className="text-xl sm:text-3xl font-bold text-green-500 truncate">{formatCurrency(summary.totalNet)}</p>
            </div>
            <div className="card p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">סה&quot;כ ברוטו</p>
              <p className="text-xl sm:text-3xl font-bold text-primary truncate">{formatCurrency(summary.totalGross)}</p>
            </div>
            <div className="card p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">סה&quot;כ ניכויים</p>
              <p className="text-xl sm:text-3xl font-bold text-red-500 truncate">{formatCurrency(summary.totalDeductions)}</p>
              {summary.totalGross > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {((summary.totalDeductions / summary.totalGross) * 100).toFixed(1)}% מהברוטו
                </p>
              )}
            </div>
            <div className="card p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">ממוצע נטו לחודש</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-500 truncate">{formatCurrency(summary.averageNet)}</p>
              {summary.months > 0 && (
                <p className="text-xs text-gray-400 mt-1">{summary.months} חודשים</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : salaries.length === 0 ? (
            <div className="card p-12 text-center">
              <FiDollarSign size={48} className="mx-auto text-green-300 mb-4" />
              <p className="text-gray-500">לא נמצאו משכורות</p>
              <p className="text-sm text-gray-400 mt-1">הוסף משכורת כדי להתחיל לעקוב אחרי הברוטו והנטו</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>חודש</th>
                    <th className="hidden sm:table-cell">מעסיק</th>
                    <th>ברוטו</th>
                    <th>נטו</th>
                    <th className="hidden md:table-cell">ניכויים</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((salary) => {
                    const percent = salary.gross > 0 ? (salary.deductions / salary.gross) * 100 : 0;
                    return (
                      <tr key={salary.id} className="animate-fadeIn">
                        <td>
                          <div className="font-medium whitespace-nowrap">{formatMonth(salary.month)}</div>
                          {salary.employer && (
                            <div className="sm:hidden text-xs text-gray-400">{salary.employer}</div>
                          )}
                          {salary.notes && (
                            <div className="text-xs text-gray-400 max-w-[160px] truncate">{salary.notes}</div>
                          )}
                        </td>
                        <td className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">
                          {salary.employer || '-'}
                        </td>
                        <td className="font-medium text-primary whitespace-nowrap">{formatCurrency(salary.gross)}</td>
                        <td className="font-bold text-green-500 whitespace-nowrap">{formatCurrency(salary.net)}</td>
                        <td className="hidden md:table-cell whitespace-nowrap">
                          <span className="text-red-500 font-medium">{formatCurrency(salary.deductions)}</span>
                          {salary.gross > 0 && (
                            <span className="text-xs text-gray-400 mr-1">({percent.toFixed(1)}%)</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(salary)}
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                              aria-label="עריכה"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(salary.id)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                              aria-label="מחיקה"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              resetForm();
            }}
            title={editing ? 'עריכת משכורת' : 'הוספת משכורת'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">חודש</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">מעסיק (אופציונלי)</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="w-full"
                  placeholder="שם מקום העבודה"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ברוטו (₪)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={gross}
                    onChange={(e) => setGross(e.target.value)}
                    className="w-full"
                    placeholder="0"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">נטו (₪)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={net}
                    onChange={(e) => setNet(e.target.value)}
                    className="w-full"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              {parseFloat(gross) > 0 && net !== '' && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">ניכויים</span>
                  <span className={`font-bold ${previewDeductions < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(previewDeductions)} ({previewPercent.toFixed(1)}%)
                  </span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full"
                  placeholder="בונוס, שעות נוספות, החזר הוצאות..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'עדכן' : 'הוסף'}
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
