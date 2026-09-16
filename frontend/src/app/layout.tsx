import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'ניהול פיננסי אישי',
  description: 'אפליקציה לניהול כספים אישיים',
  appleWebApp: {
    capable: true,
    title: 'ניהול פיננסי',
    statusBarStyle: 'default',
  },
};

// Explicit viewport so iPhone renders at device width and respects the notch safe areas.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
