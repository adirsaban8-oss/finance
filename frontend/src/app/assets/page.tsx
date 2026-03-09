'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import AssetChart from '@/components/charts/AssetChart';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

interface AssetItem {
  id: number;
  name: string;
  amount: number;
  section: 'mine' | 'debt';
}

export default function AssetsPage() {
  const [mineItems, setMineItems] = useState<AssetItem[]>([]);
  const [debtItems, setDebtItems] = useState<AssetItem[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newMineName, setNewMineName] = useState('');
  const [newMineAmount, setNewMineAmount] = useState('');
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setMineItems(res.data.mine || []);
      setDebtItems(res.data.debts || []);
      setBankBalance(res.data.bankBalance || 0);
      setNetWorth(res.data.netWorth || 0);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (section: 'mine' | 'debt') => {
    const name = section === 'mine' ? newMineName : newDebtName;
    const amount = section === 'mine' ? newMineAmount : newDebtAmount;

    if (!name.trim()) {
      toast.error('יש להזין שם');
      return;
    }

    try {
      await api.post('/assets/items', {
        name: name.trim(),
        amount: parseFloat(amount) || 0,
        section,
      });
      toast.success('נוסף בהצלחה');
      if (section === 'mine') {
        setNewMineName('');
        setNewMineAmount('');
      } else {
        setNewDebtName('');
        setNewDebtAmount('');
      }
      fetchAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בהוספה');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/assets/items/${id}`);
      toast.success('נמחק בהצלחה');
      fetchAssets();
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  const startEdit = (item: AssetItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.put(`/assets/items/${id}`, {
        name: editName,
        amount: parseFloat(editAmount) || 0,
      });
      setEditingId(null);
      toast.success('עודכן בהצלחה');
      fetchAssets();
    } catch {
      toast.error('שגיאה בעדכון');
    }
  };

  const totalMine = mineItems.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalDebts = debtItems.reduce((sum, i) => sum + Number(i.amount), 0);

  const mineChartLabels = mineItems.filter(i => i.amount > 0).map(i => i.name);
  const mineChartData = mineItems.filter(i => i.amount > 0).map(i => Number(i.amount));
  if (bankBalance > 0) {
    mineChartLabels.push('יתרה בבנק');
    mineChartData.push(bankBalance);
  }

  const renderItem = (item: AssetItem) => {
    if (editingId === item.id) {
      return (
        <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 min-w-0 text-sm" />
          <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-24 sm:w-32 text-sm" step="0.01" />
          <button onClick={() => handleUpdate(item.id)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><FiCheck size={16} /></button>
          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX size={16} /></button>
        </div>
      );
    }
    return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">{item.name}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">₪{Number(item.amount).toLocaleString()}</span>
          <button onClick={() => startEdit(item)} className="p-1.5 text-blue-400 hover:text-blue-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"><FiEdit2 size={14} /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"><FiTrash2 size={14} /></button>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">איפה הכסף שלי</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Net Worth */}
              <div className={`card p-6 sm:p-8 text-center ${netWorth >= 0 ? 'bg-gradient-to-l from-green-500 to-emerald-600' : 'bg-gradient-to-l from-red-500 to-rose-600'} text-white`}>
                <p className="text-base sm:text-lg opacity-90 mb-2">שווי נקי</p>
                <p className="text-3xl sm:text-5xl font-bold">₪{netWorth.toLocaleString()}</p>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4 text-sm opacity-80">
                  <span>נכסים: ₪{(totalMine + bankBalance).toLocaleString()}</span>
                  <span>חובות: ₪{totalDebts.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Money */}
                <div className="card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">הכסף שלי ומי חייב לי</h3>
                  <div className="space-y-2 mb-4">
                    {mineItems.map(renderItem)}
                    {mineItems.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">אין פריטים עדיין</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <input type="text" value={newMineName} onChange={(e) => setNewMineName(e.target.value)} className="flex-1 text-sm" placeholder="שם (השקעות, מזומן, חוב של...)" onKeyDown={(e) => e.key === 'Enter' && handleAdd('mine')} />
                    <input type="number" value={newMineAmount} onChange={(e) => setNewMineAmount(e.target.value)} className="w-full sm:w-32 text-sm" placeholder="סכום" step="0.01" onKeyDown={(e) => e.key === 'Enter' && handleAdd('mine')} />
                    <button onClick={() => handleAdd('mine')} className="btn-primary flex items-center justify-center gap-1 text-sm whitespace-nowrap"><FiPlus size={16} />הוסף</button>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm font-bold text-green-600">
                    <span>סה״כ</span><span>₪{totalMine.toLocaleString()}</span>
                  </div>
                </div>

                {/* My Debts */}
                <div className="card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">למי אני חייב</h3>
                  <div className="space-y-2 mb-4">
                    {debtItems.map(renderItem)}
                    {debtItems.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">אין חובות</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <input type="text" value={newDebtName} onChange={(e) => setNewDebtName(e.target.value)} className="flex-1 text-sm" placeholder="שם (הלוואה, חוב ל...)" onKeyDown={(e) => e.key === 'Enter' && handleAdd('debt')} />
                    <input type="number" value={newDebtAmount} onChange={(e) => setNewDebtAmount(e.target.value)} className="w-full sm:w-32 text-sm" placeholder="סכום" step="0.01" onKeyDown={(e) => e.key === 'Enter' && handleAdd('debt')} />
                    <button onClick={() => handleAdd('debt')} className="btn-primary flex items-center justify-center gap-1 text-sm bg-red-500 hover:bg-red-600 whitespace-nowrap"><FiPlus size={16} />הוסף</button>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm font-bold text-red-500">
                    <span>סה״כ חובות</span><span>₪{totalDebts.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {mineChartLabels.length > 0 && (
                <div className="card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">התפלגות נכסים</h3>
                  <div className="max-w-md mx-auto"><AssetChart labels={mineChartLabels} data={mineChartData} title="" /></div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
