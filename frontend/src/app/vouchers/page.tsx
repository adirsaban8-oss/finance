'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiGift,
  FiMinusCircle,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
} from 'react-icons/fi';

interface Voucher {
  id: number;
  name: string;
  initial_amount: number;
  balance: number;
  expiry_date?: string | null;
  notes?: string | null;
  created_at: string;
}

interface Usage {
  id: number;
  amount: number;
  description?: string | null;
  used_at: string;
}

const formatCurrency = (amount: number) =>
  `₪${Number(amount).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [totals, setTotals] = useState({ totalBalance: 0, totalInitial: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);

  // Add / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Use modal
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [usingVoucher, setUsingVoucher] = useState<Voucher | null>(null);
  const [useAmount, setUseAmount] = useState('');
  const [useDescription, setUseDescription] = useState('');

  // Usage history
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [usages, setUsages] = useState<Record<number, Usage[]>>({});

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/vouchers');
      setVouchers(res.data.vouchers || []);
      setTotals({
        totalBalance: res.data.totalBalance || 0,
        totalInitial: res.data.totalInitial || 0,
        totalUsed: res.data.totalUsed || 0,
      });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsages = async (id: number) => {
    try {
      const res = await api.get(`/vouchers/${id}/usages`);
      setUsages((prev) => ({ ...prev, [id]: res.data || [] }));
    } catch {
      setUsages((prev) => ({ ...prev, [id]: [] }));
    }
  };

  const toggleHistory = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    fetchUsages(id);
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setName('');
    setInitialAmount('');
    setBalance('');
    setExpiryDate('');
    setNotes('');
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setName(voucher.name);
    setInitialAmount(String(voucher.initial_amount));
    setBalance(String(voucher.balance));
    setExpiryDate(voucher.expiry_date ? voucher.expiry_date.split('T')[0] : '');
    setNotes(voucher.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: any = {
      name: name.trim(),
      initial_amount: parseFloat(initialAmount) || 0,
      expiry_date: expiryDate || null,
      notes: notes.trim() || null,
    };
    if (balance !== '') payload.balance = parseFloat(balance) || 0;

    try {
      if (editingVoucher) {
        await api.put(`/vouchers/${editingVoucher.id}`, payload);
        toast.success('השובר עודכן בהצלחה');
      } else {
        await api.post('/vouchers', payload);
        toast.success('השובר נוסף בהצלחה');
      }
      setModalOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בשמירת השובר');
    }
  };

  const openUse = (voucher: Voucher) => {
    setUsingVoucher(voucher);
    setUseAmount('');
    setUseDescription('');
    setUseModalOpen(true);
  };

  const handleUse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingVoucher) return;
    const amount = parseFloat(useAmount);
    if (!amount || amount <= 0) {
      toast.error('יש להזין סכום');
      return;
    }
    if (amount > usingVoucher.balance) {
      toast.error('הסכום גדול מהיתרה בשובר');
      return;
    }

    try {
      await api.post(`/vouchers/${usingVoucher.id}/use`, {
        amount,
        description: useDescription.trim() || null,
      });
      toast.success('השימוש נרשם');
      setUseModalOpen(false);
      fetchVouchers();
      if (expandedId === usingVoucher.id) fetchUsages(usingVoucher.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה ברישום השימוש');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את השובר?')) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('השובר נמחק');
      fetchVouchers();
    } catch {
      toast.error('שגיאה במחיקת השובר');
    }
  };

  const activeVouchers = vouchers.filter((v) => v.balance > 0);
  const emptyVouchers = vouchers.filter((v) => v.balance <= 0);

  const isExpired = (voucher: Voucher) =>
    !!voucher.expiry_date && new Date(voucher.expiry_date) < new Date(new Date().toDateString());

  const renderVoucher = (voucher: Voucher, faded = false) => {
    const usedPercent =
      voucher.initial_amount > 0
        ? Math.min(100, Math.max(0, ((voucher.initial_amount - voucher.balance) / voucher.initial_amount) * 100))
        : 0;
    const expired = isExpired(voucher);
    const history = usages[voucher.id];

    return (
      <div key={voucher.id} className={`card p-4 sm:p-5 animate-fadeIn ${faded ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl shrink-0 ${faded ? 'bg-gray-400' : 'bg-pink-500'}`}>
              <FiGift size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white truncate">{voucher.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                מתוך {formatCurrency(voucher.initial_amount)}
              </p>
              {voucher.expiry_date && (
                <p className={`flex items-center gap-1 text-xs mt-1 ${expired ? 'text-red-500' : 'text-gray-400'}`}>
                  <FiCalendar size={12} />
                  {expired ? 'פג תוקף ב-' : 'בתוקף עד '}
                  {new Date(voucher.expiry_date).toLocaleDateString('he-IL')}
                </p>
              )}
            </div>
          </div>
          <div className="text-left shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">יתרה</p>
            <p className={`text-xl sm:text-2xl font-bold ${voucher.balance > 0 ? 'text-green-500' : 'text-gray-400'}`}>
              {formatCurrency(voucher.balance)}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="progress-bar">
            <div
              className={`progress-fill ${usedPercent >= 100 ? 'bg-gray-400' : 'bg-pink-500'}`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            נוצל {formatCurrency(voucher.initial_amount - voucher.balance)} ({Math.round(usedPercent)}%)
          </p>
        </div>

        {voucher.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{voucher.notes}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => openUse(voucher)}
            disabled={voucher.balance <= 0}
            className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiMinusCircle size={16} />
            רישום שימוש
          </button>
          <button
            onClick={() => toggleHistory(voucher.id)}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
          >
            {expandedId === voucher.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            היסטוריה
          </button>
          <div className="flex items-center gap-1 mr-auto">
            <button
              onClick={() => openEdit(voucher)}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
              aria-label="עריכה"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(voucher.id)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              aria-label="מחיקה"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>

        {expandedId === voucher.id && (
          <div className="mt-3 space-y-1.5 animate-fadeIn">
            {!history ? (
              <p className="text-sm text-gray-400 text-center py-2">טוען...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">עדיין לא נרשמו שימושים</p>
            ) : (
              history.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="min-w-0">
                    <span className="text-gray-700 dark:text-gray-300">{u.description || 'שימוש'}</span>
                    <span className="text-xs text-gray-400 mr-2">
                      {new Date(u.used_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <span className="font-medium text-red-500 shrink-0">-{formatCurrency(u.amount)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-24 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">שוברים</h1>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <FiPlus />
              שובר חדש
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="card p-3 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">יתרה כוללת</p>
              <p className="text-lg sm:text-3xl font-bold text-green-500 truncate">{formatCurrency(totals.totalBalance)}</p>
            </div>
            <div className="card p-3 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">נוצל</p>
              <p className="text-lg sm:text-3xl font-bold text-red-500 truncate">{formatCurrency(totals.totalUsed)}</p>
            </div>
            <div className="card p-3 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">שוברים פעילים</p>
              <p className="text-lg sm:text-3xl font-bold text-primary">{activeVouchers.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeVouchers.length === 0 ? (
                <div className="card p-12 text-center">
                  <FiGift size={48} className="mx-auto text-pink-300 mb-4" />
                  <p className="text-gray-500">אין שוברים פעילים</p>
                  <p className="text-sm text-gray-400 mt-1">הוסף שובר כדי להתחיל לעקוב אחרי היתרה</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeVouchers.map((v) => renderVoucher(v))}
                </div>
              )}

              {emptyVouchers.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowEmpty(!showEmpty)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-3"
                  >
                    {showEmpty ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    <span className="font-medium">שוברים שנוצלו במלואם ({emptyVouchers.length})</span>
                  </button>
                  {showEmpty && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {emptyVouchers.map((v) => renderVoucher(v, true))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Add / Edit Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              resetForm();
            }}
            title={editingVoucher ? 'עריכת שובר' : 'הוספת שובר'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם השובר</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  placeholder="לדוגמה: תו הזהב, BUYME, סופר-פארם..."
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סכום מקורי (₪)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={initialAmount}
                    onChange={(e) => {
                      setInitialAmount(e.target.value);
                      if (!editingVoucher) setBalance('');
                    }}
                    className="w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">יתרה נוכחית (₪)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full"
                    placeholder={initialAmount || 'כמו הסכום המקורי'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">תוקף (אופציונלי)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full"
                  placeholder="קוד שובר, איפה אפשר לממש..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingVoucher ? 'עדכן' : 'הוסף'}
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

          {/* Use Modal */}
          <Modal
            isOpen={useModalOpen}
            onClose={() => setUseModalOpen(false)}
            title={usingVoucher ? `שימוש בשובר: ${usingVoucher.name}` : 'רישום שימוש'}
          >
            <form onSubmit={handleUse} className="space-y-4">
              {usingVoucher && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  יתרה נוכחית: <span className="font-bold text-green-500">{formatCurrency(usingVoucher.balance)}</span>
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סכום שנוצל (₪)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max={usingVoucher?.balance}
                  value={useAmount}
                  onChange={(e) => setUseAmount(e.target.value)}
                  className="w-full"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">על מה? (אופציונלי)</label>
                <input
                  type="text"
                  value={useDescription}
                  onChange={(e) => setUseDescription(e.target.value)}
                  className="w-full"
                  placeholder="לדוגמה: קניות בסופר"
                />
              </div>
              {usingVoucher && useAmount && parseFloat(useAmount) > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  יתרה לאחר השימוש:{' '}
                  <span className="font-bold">
                    {formatCurrency(Math.max(0, usingVoucher.balance - parseFloat(useAmount)))}
                  </span>
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">רשום שימוש</button>
                <button type="button" onClick={() => setUseModalOpen(false)} className="btn-secondary flex-1">
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
