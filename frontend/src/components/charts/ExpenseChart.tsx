'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';

interface ExpenseChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

export default function ExpenseChart({ labels, data, title = 'גרף הוצאות' }: ExpenseChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'הוצאות (₪)',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16 },
        color: '#6B7280',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₪${value.toLocaleString()}`,
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-72">
      <Bar data={chartData} options={options} />
    </div>
  );
}
