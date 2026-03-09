'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';

interface AssetChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
];

export default function AssetChart({ labels, data, title = 'התפלגות נכסים' }: AssetChartProps) {
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
            return `${context.label}: ₪${context.raw.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-72">
      <Pie data={chartData} options={options} />
    </div>
  );
}
