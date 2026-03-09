'use client';

import React from 'react';

interface BudgetProgressProps {
  category: string;
  spent: number;
  budget: number;
}

export default function BudgetProgress({ category, spent, budget }: BudgetProgressProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isOver = percentage >= 100;

  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-primary';

  const statusText = isOver
    ? 'חריגה מהתקציב!'
    : isWarning
    ? 'מתקרב למגבלת התקציב'
    : '';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {category}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {spent.toLocaleString()} / {budget.toLocaleString()} ₪
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span
          className={`text-xs font-medium ${
            isOver
              ? 'text-red-500'
              : isWarning
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-400'
          }`}
        >
          {statusText}
        </span>
        <span className="text-xs text-gray-400">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}
