'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Lock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError('');
    setLoading(true);
    const success = await login(password.trim());
    if (!success) {
      setError('Invalid admin password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-primary-500 flex items-center justify-center text-white mx-auto shadow-glow mb-3">
            <Send className="w-7 h-7 -rotate-12" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Rajasthan Exam Twister</h1>
          <p className="text-xs text-dark-muted mt-1">Admin Portal • Telegram Quiz Manager</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                autoFocus
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-dark-muted">
          Single-Admin Secure Authentication • Mobile First
        </div>
      </div>
    </div>
  );
}
