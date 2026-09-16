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
  FiKey,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiSearch,
  FiUser,
} from 'react-icons/fi';

interface PasswordEntry {
  id: number;
  name: string;
  username?: string | null;
  password: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export default function PasswordsPage() {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordEntry | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.get('/passwords');
      setEntries(res.data || []);
    } catch (error) {
      console.error('Error fetching passwords:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setName('');
    setUsername('');
    setPassword('');
    setNotes('');
    setShowFormPassword(false);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditing(entry);
    setName(entry.name);
    setUsername(entry.username || '');
    setPassword(entry.password);
    setNotes(entry.notes || '');
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) return;

    const payload = {
      name: name.trim(),
      username: username.trim() || null,
      password,
      notes: notes.trim() || null,
    };

    try {
      if (editing) {
        await api.put(`/passwords/${editing.id}`, payload);
        toast.success('הסיסמה עודכנה');
      } else {
        await api.post('/passwords', payload);
        toast.success('הסיסמה נשמרה');
      }
      setModalOpen(false);
      resetForm();
      fetchEntries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בשמירת הסיסמה');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הסיסמה?')) return;
    try {
      await api.delete(`/passwords/${id}`);
      toast.success('הסיסמה נמחקה');
      fetchEntries();
    } catch {
      toast.error('שגיאה במחיקת הסיסמה');
    }
  };

  const toggleVisible = (id: number) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} הועתק`);
    } catch {
      toast.error('לא ניתן להעתיק במכשיר זה');
    }
  };

  const filtered = entries.filter((entry) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      (entry.username || '').toLowerCase().includes(q) ||
      (entry.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-24 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">סיסמאות</h1>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <FiPlus />
              סיסמה חדשה
            </button>
          </div>

          {/* Search */}
          <div className="card p-3 sm:p-4">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10"
                placeholder="חיפוש לפי שם, משתמש או הערה..."
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <FiKey size={48} className="mx-auto text-yellow-300 mb-4" />
              <p className="text-gray-500">{search ? 'לא נמצאו תוצאות' : 'אין סיסמאות שמורות'}</p>
              {!search && <p className="text-sm text-gray-400 mt-1">הוסף סיסמה כדי לזכור אותה כאן</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((entry) => {
                const visible = visibleIds.has(entry.id);
                return (
                  <div key={entry.id} className="card p-4 sm:p-5 animate-fadeIn">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-yellow-500 shrink-0">
                          <FiKey size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{entry.name}</p>
                          {entry.username && (
                            <button
                              onClick={() => copyToClipboard(entry.username!, 'שם המשתמש')}
                              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary mt-0.5 max-w-full"
                              title="העתק שם משתמש"
                            >
                              <FiUser size={12} className="shrink-0" />
                              <span className="truncate" dir="ltr">{entry.username}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                          aria-label="עריכה"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                          aria-label="מחיקה"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Password row */}
                    <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <span
                        dir="ltr"
                        className="flex-1 min-w-0 font-mono text-sm text-left text-gray-800 dark:text-gray-200 break-all select-all"
                      >
                        {visible ? entry.password : '•'.repeat(Math.min(12, Math.max(8, entry.password.length)))}
                      </span>
                      <button
                        onClick={() => toggleVisible(entry.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                        aria-label={visible ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      >
                        {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(entry.password, 'הסיסמה')}
                        className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                        aria-label="העתק סיסמה"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              resetForm();
            }}
            title={editing ? 'עריכת סיסמה' : 'הוספת סיסמה'}
          >
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  placeholder="לדוגמה: בנק, Gmail, Netflix..."
                  required
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם משתמש / אימייל (אופציונלי)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                  dir="ltr"
                  placeholder="user@example.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיסמה</label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11"
                    dir="ltr"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                    aria-label={showFormPassword ? 'הסתר' : 'הצג'}
                  >
                    {showFormPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full"
                  placeholder="שאלת אבטחה, קוד PIN..."
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'עדכן' : 'שמור'}
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
