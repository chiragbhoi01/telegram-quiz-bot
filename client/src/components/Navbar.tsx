'use client';

import React from 'react';
import Link from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, Send, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-card/90 backdrop-blur-md border-b border-dark-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 touch-press">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-primary-500 flex items-center justify-center text-white shadow-glow">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">Rajasthan Exam Twister</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-dark-muted hidden sm:block">Telegram Quiz Management Platform</p>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Active</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all touch-press"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
