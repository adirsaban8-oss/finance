'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiUserPlus, FiUser, FiLock } from 'react-icons/fi';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (password !== confirmPassword) {
      const toast = (await import('react-hot-toast')).default;
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
    setIsLoading(true);
    try {
      await signup(username, password);
      router.push('/dashboard');
    } catch {
      // error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">ניהול פיננסי</h1>
          <p className="text-gray-500 dark:text-gray-400">צור חשבון חדש</p>
        </div>

        <div className="card p-8 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            הרשמה
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                שם משתמש
              </label>
              <div className="relative">
                <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-10"
                  placeholder="בחר שם משתמש"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                סיסמה
              </label>
              <div className="relative">
                <FiLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  placeholder="בחר סיסמה"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                אימות סיסמה
              </label>
              <div className="relative">
                <FiLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10"
                  placeholder="הכנס סיסמה שוב"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
              ) : (
                <>
                  <FiUserPlus />
                  צור חשבון
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 dark:text-gray-400">
            יש לך חשבון?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-secondary font-medium transition-colors"
            >
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
