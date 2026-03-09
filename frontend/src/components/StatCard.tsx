'use client';

import React from 'react';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string;
  icon: IconType;
  color: string;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  onEdit?: () => void;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendValue,
  onEdit,
}: StatCardProps) {
  return (
    <div className="card card-hover p-4 sm:p-6 animate-fadeIn relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {value}
          </p>
          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend === 'up' ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {trend === 'up' ? (
                <FiTrendingUp size={14} />
              ) : (
                <FiTrendingDown size={14} />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className={`p-2 sm:p-3 rounded-xl ${color}`}
          >
            <Icon size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-primary hover:underline mt-1"
            >
              עריכה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
