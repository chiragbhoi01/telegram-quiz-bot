'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Layers, PlusCircle, Sparkles, History, Settings, FileSpreadsheet } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  if (!user || pathname === '/login') return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Pool', path: '/questions', icon: Layers },
    { label: 'Import', path: '/import', icon: FileSpreadsheet },
    { label: 'New Quiz', path: '/quizzes/new', icon: PlusCircle, isPrimary: true },
    { label: 'History', path: '/history', icon: History },
    { label: 'Prompt', path: '/prompts', icon: Sparkles },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-card/95 backdrop-blur-lg border-t border-dark-border px-2 py-1.5 sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center -mt-5 touch-press"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-500 to-primary-600 text-white flex items-center justify-center shadow-glow border-2 border-dark-card">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-brand-400 mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors touch-press ${
                isActive ? 'text-primary-400' : 'text-dark-muted hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
