'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Settings,
  ShieldCheck,
  Send,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [telegramStatus, setTelegramStatus] = useState<any>(null);

  const [defaultSubject, setDefaultSubject] = useState('');
  const [defaultDelay, setDefaultDelay] = useState(2);
  const [dryRun, setDryRun] = useState(true);
  const [targetChatId, setTargetChatId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data && res.data.success) {
        const s = res.data.data.settings;
        const tg = res.data.data.telegram;
        setSettingsData(s);
        setTelegramStatus(tg);

        setDefaultSubject(s?.defaultSubject || '');
        setDefaultDelay(s?.defaultPublishDelaySeconds || 2);
        setDryRun(s?.telegramDryRun !== false);
        setTargetChatId(s?.targetChatId || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const res = await api.put('/settings', {
        defaultSubject: defaultSubject.trim(),
        defaultPublishDelaySeconds: defaultDelay,
        telegramDryRun: dryRun,
        targetChatId: targetChatId.trim(),
      });

      if (res.data && res.data.success) {
        setMessage('✅ Settings updated successfully!');
        fetchSettings();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-dark-muted space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
        <span className="text-xs">Loading Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Top Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Platform Settings</h1>
            <p className="text-xs text-dark-muted">Manage Telegram defaults, safety modes, and configurations</p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2 rounded-xl bg-dark-surface hover:bg-dark-border text-gray-300 transition-all"
          title="Refresh Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {message && (
        <div className="p-3 bg-dark-card border border-brand-500/40 rounded-xl text-xs text-brand-300">
          {message}
        </div>
      )}

      {/* Telegram Connection Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Telegram Bot Status
            </h3>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              telegramStatus?.configured
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {telegramStatus?.configured ? 'Configured' : 'Needs Config'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-bg p-3 rounded-xl border border-dark-border space-y-1">
            <div className="text-dark-muted text-[11px]">Bot Token (Masked)</div>
            <div className="font-mono text-white font-semibold">
              {telegramStatus?.tokenMasked || 'Not set in .env'}
            </div>
          </div>

          <div className="bg-dark-bg p-3 rounded-xl border border-dark-border space-y-1">
            <div className="text-dark-muted text-[11px]">Dry Run Safety Mode</div>
            <div className="font-semibold text-brand-400">
              {dryRun ? '🛡️ Enabled (Simulated Dispatches)' : '🔴 Live (Real Telegram Polls)'}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          Quiz & Publishing Defaults
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Default Subject Prefix
          </label>
          <input
            type="text"
            value={defaultSubject}
            onChange={(e) => setDefaultSubject(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-hindi"
            required
          />
          <p className="text-[11px] text-dark-muted mt-1">
            Prefixed to question text sent to Telegram (e.g. <code>[Subject] Question</code>)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Default Publish Delay (Seconds)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={defaultDelay}
              onChange={(e) => setDefaultDelay(Number(e.target.value))}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              required
            />
            <p className="text-[11px] text-dark-muted mt-1">
              Delay between consecutive polls sent to Telegram (Default: 2s)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Telegram Dry Run Toggle
            </label>
            <div className="bg-dark-bg border border-dark-border rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-xs text-white font-medium">
                {dryRun ? 'Dry Run (Safe)' : 'Live Mode'}
              </span>
              <button
                type="button"
                onClick={() => setDryRun(!dryRun)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  dryRun ? 'bg-brand-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    dryRun ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-dark-muted mt-1">
              When ON, polls will NOT be sent to real channel.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
}
