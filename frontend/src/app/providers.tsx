'use client';

import React, { ReactNode } from 'react';
import '@/lib/chartSetup';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              direction: 'rtl',
            },
          }}
        />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
