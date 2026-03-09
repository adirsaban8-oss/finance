'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiCircle,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
} from 'react-icons/fi';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      const allTasks = [...(res.data.pending || []), ...(res.data.completed || [])];
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const payload: any = { title: title.trim() };
      if (description.trim()) payload.description = description.trim();
      if (dueDate) payload.due_date = dueDate;

      await api.post('/tasks', payload);
      toast.success('המשימה נוספה בהצלחה');
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowForm(false);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בהוספת משימה');
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await api.put(`/tasks/${task.id}/toggle`, {});
      toast.success(task.completed ? 'המשימה סומנה כלא הושלמה' : 'המשימה הושלמה!');
      fetchTasks();
    } catch {
      toast.error('שגיאה בעדכון המשימה');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('המשימה נמחקה');
      fetchTasks();
    } catch {
      toast.error('שגיאה במחיקת המשימה');
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              משימות
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus />
              משימה חדשה
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="card p-6 animate-fadeIn">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    כותרת
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                    placeholder="מה צריך לעשות?"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    תיאור (אופציונלי)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-none"
                    rows={2}
                    placeholder="פרטים נוספים..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    תאריך יעד (אופציונלי)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">
                    הוסף משימה
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Pending Tasks */}
              <div className="space-y-2">
                {pendingTasks.length === 0 && !showForm ? (
                  <div className="card p-12 text-center">
                    <FiCheckCircle
                      size={48}
                      className="mx-auto text-green-300 mb-4"
                    />
                    <p className="text-gray-500">אין משימות ממתינות</p>
                    <p className="text-sm text-gray-400 mt-1">
                      כל הכבוד! סיימת הכל
                    </p>
                  </div>
                ) : (
                  pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="card p-4 flex items-start gap-4 animate-slideIn"
                    >
                      <button
                        onClick={() => handleToggle(task)}
                        className="mt-1 text-gray-300 hover:text-green-500 transition-colors"
                      >
                        <FiCircle size={22} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <FiCalendar size={12} />
                            <span>
                              {new Date(task.due_date).toLocaleDateString(
                                'he-IL'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-3"
                  >
                    {showCompleted ? (
                      <FiChevronUp size={18} />
                    ) : (
                      <FiChevronDown size={18} />
                    )}
                    <span className="font-medium">
                      משימות שהושלמו ({completedTasks.length})
                    </span>
                  </button>

                  {showCompleted && (
                    <div className="space-y-2">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="card p-4 flex items-start gap-4 opacity-60 animate-fadeIn"
                        >
                          <button
                            onClick={() => handleToggle(task)}
                            className="mt-1 text-green-500 hover:text-gray-300 transition-colors"
                          >
                            <FiCheckCircle size={22} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white line-through">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1 line-through">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
