'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';

interface CategoryChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

const COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

export default function CategoryChart({ labels, data, title = 'גרף קטגוריות' }: CategoryChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16 },
        color: '#6B7280',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = ((value / total) * 100).toFixed(1);
            return `${context.label}: ₪${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-72">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
