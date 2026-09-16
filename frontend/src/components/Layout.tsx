'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  FiHome,
  FiFileText,
  FiClock,
  FiCreditCard,
  FiPieChart,
  FiCheckSquare,
  FiGift,
  FiKey,
  FiDollarSign,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiMoreHorizontal,
} from 'react-icons/fi';

const navItems = [
  { href: '/dashboard', label: 'דף הבית', icon: FiHome },
  { href: '/expenses', label: 'הוצאות', icon: FiFileText },
  { href: '/shifts', label: 'משמרות', icon: FiClock },
  { href: '/salaries', label: 'משכורות', icon: FiDollarSign },
  { href: '/credit-cards', label: 'חיובי אשראי', icon: FiCreditCard },
  { href: '/assets', label: 'איפה הכסף שלי', icon: FiPieChart },
  { href: '/vouchers', label: 'שוברים', icon: FiGift },
  { href: '/passwords', label: 'סיסמאות', icon: FiKey },
  { href: '/tasks', label: 'משימות', icon: FiCheckSquare },
];

// Items shown directly in the mobile bottom bar; the rest live behind "עוד".
const mobileBarHrefs = ['/dashboard', '/expenses', '/shifts', '/tasks'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mobileBarItems = navItems.filter((item) => mobileBarHrefs.includes(item.href));
  const moreIsActive = !mobileBarHrefs.includes(pathname);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-72 max-w-[85vw] lg:w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } flex flex-col safe-top`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary">ניהול פיננסי</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                שלום, {user}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -m-2 text-gray-500 hover:text-gray-700"
              aria-label="סגור תפריט"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 safe-bottom">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            <span className="font-medium">
              {darkMode ? 'מצב בהיר' : 'מצב כהה'}
            </span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <FiLogOut size={20} />
            <span className="font-medium">התנתק</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30 safe-top">
          <h1 className="text-lg font-bold text-primary">ניהול פיננסי</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -m-2 text-gray-600 dark:text-gray-300"
            aria-label="פתח תפריט"
          >
            <FiMenu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-stretch pt-1 z-30 safe-bottom">
          {mobileBarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg ${
              moreIsActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <FiMoreHorizontal size={20} />
            <span className="text-[11px] font-medium leading-none">עוד</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
