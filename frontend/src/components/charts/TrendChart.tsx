'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';

interface TrendChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

export default function TrendChart({ labels, data, title = 'גרף מגמת הוצאות' }: TrendChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'הוצאות (₪)',
        data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
