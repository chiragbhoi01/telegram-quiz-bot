import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';

export const metadata: Metadata = {
  title: 'Rajasthan Exam Twister — Telegram Quiz Management',
  description: 'Mobile-first Telegram quiz management and question pool platform for Rajasthan Competitive Exams.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-dark-bg text-dark-text antialiased min-h-screen flex flex-col selection:bg-brand-500/30 selection:text-brand-300"
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-8">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
