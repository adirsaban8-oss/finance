'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';


interface Shift {
  id: number;
  date: string;
  shift_type: string;
  hours: number;
  hourly_wage?: number;
  shift_hours?: string;
  description?: string;
  shift_amount?: number;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [description, setDescription] = useState('');
  const [shiftAmount, setShiftAmount] = useState('');

  // Filter
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchShifts();
  }, [filterMonth]);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts', { params: { month: filterMonth } });
      setShifts(res.data.shifts || res.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || !date) return;

    try {
      const payload: any = {
        date,
        shift_type: shiftType,
        hours: parseFloat(hours),
        shift_hours: shiftHours || null,
        description: description || null,
        shift_amount: shiftAmount ? parseFloat(shiftAmount) : null,
      };
      if (hourlyWage) payload.hourly_wage = parseFloat(hourlyWage);

      if (editingShift) {
        await api.put(`/shifts/${editingShift.id}`, payload);
        toast.success('המשמרת עודכנה בהצלחה');
      } else {
        await api.post('/shifts', payload);
        toast.success('המשמרת נוספה בהצלחה');
      }

      resetForm();
      setModalOpen(false);
      fetchShifts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בשמירת המשמרת');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשמרת?')) return;
    try {
      await api.delete(`/shifts/${id}`);
      toast.success('המשמרת נמחקה');
      fetchShifts();
    } catch {
      toast.error('שגיאה במחיקת המשמרת');
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setDate(shift.date.split('T')[0]);
    setShiftType(shift.shift_type);
    setHours(String(shift.hours));
    setHourlyWage(shift.hourly_wage ? String(shift.hourly_wage) : '');
    setShiftHours(shift.shift_hours || '');
    setDescription(shift.description || '');
    setShiftAmount(shift.shift_amount ? String(shift.shift_amount) : '');
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingShift(null);
    setDate(new Date().toISOString().split('T')[0]);
    setShiftType('');
    setHours('');
    setHourlyWage('');
    setShiftHours('');
    setDescription('');
    setShiftAmount('');
  };

  // Summary
  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
  const totalAmount = shifts.reduce((sum, s) => sum + (Number(s.shift_amount) || 0), 0);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              משמרות עבודה
            </h1>
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus />
              הוסף משמרת
            </button>
          </div>

          {/* Month Filter */}
          <div className="card p-4">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                סה&quot;כ משמרות
              </p>
              <p className="text-3xl font-bold text-primary">{totalShifts}</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                סה&quot;כ הכנסות החודש
              </p>
              <p className="text-3xl font-bold text-green-500">₪{totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              {shifts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  לא נמצאו משמרות
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג משמרת</th>
                      <th>שעות משמרת</th>
                      <th>שעות עבודה</th>
                      <th>סכום משמרת</th>
                      <th>תיאור</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="animate-fadeIn">
                        <td>
                          {new Date(shift.date).toLocaleDateString('he-IL')}
                        </td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {shift.shift_type}
                          </span>
                        </td>
                        <td className="font-mono text-sm">
                          {shift.shift_hours || '-'}
                        </td>
                        <td>{shift.hours}</td>
                        <td className="font-medium text-green-500">
                          {shift.shift_amount ? `₪${Number(shift.shift_amount).toLocaleString()}` : '-'}
                        </td>
                        <td className="text-sm text-gray-600 dark:text-gray-400">
                          {shift.description || '-'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(shift)}
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(shift.id)}
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
          )}

          {/* Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              resetForm();
            }}
            title={editingShift ? 'עריכת משמרת' : 'הוספת משמרת'}
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
                  סוג משמרת
                </label>
                <input
                  type="text"
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full"
                  placeholder="לדוגמה: בוקר, ערב, לילה..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  שעות משמרת
                </label>
                <input
                  type="text"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full"
                  placeholder="לדוגמה: 07:00-15:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  שעות עבודה
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  סכום משמרת (₪)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shiftAmount}
                  onChange={(e) => setShiftAmount(e.target.value)}
                  className="w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תיאור משמרת
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                  placeholder="תיאור אופציונלי..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingShift ? 'עדכן' : 'הוסף'}
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
