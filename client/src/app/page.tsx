'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import {
  Layers,
  FileCheck,
  Send,
  Sparkles,
  PlusCircle,
  History,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLegacyMigrate = async () => {
    try {
      setMigrating(true);
      setMigrationMessage('');
      const previewRes = await api.post('/questions/import/legacy-file');
      if (previewRes.data && previewRes.data.success) {
        const questionsToConfirm = previewRes.data.data.questions;
        const confirmRes = await api.post('/questions/import/confirm', {
          questions: questionsToConfirm,
          skipDuplicates: true,
        });
        if (confirmRes.data && confirmRes.data.success) {
          setMigrationMessage(`✅ Imported ${confirmRes.data.importedCount} questions from legacy questions.txt!`);
          fetchStats();
        }
      }
    } catch (err: any) {
      setMigrationMessage(`❌ Migration note: ${err.response?.data?.error || err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-dark-card to-dark-surface border border-dark-border p-4 sm:p-5 rounded-2xl shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Rajasthan Exam Twister</h1>
            <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dark-muted mt-1">
            Mobile-First Telegram Quiz Platform • RAS • CET • Patwar • REET
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs bg-dark-bg hover:bg-dark-border border border-dark-border text-gray-300 px-3 py-1.5 rounded-xl transition-all touch-press"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Migration Notice if 0 Questions */}
      {stats?.questions?.total === 0 && (
        <div className="bg-primary-950/40 border border-primary-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Import Existing questions.txt</h4>
              <p className="text-xs text-primary-300/80">
                Found your legacy questions file. Migrate all 20 questions into the Question Pool with 1 tap.
              </p>
            </div>
          </div>
          <button
            onClick={handleLegacyMigrate}
            disabled={migrating}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-all flex items-center justify-center gap-1.5 touch-press"
          >
            {migrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            <span>{migrating ? 'Importing...' : 'Migrate questions.txt'}</span>
          </button>
        </div>
      )}

      {migrationMessage && (
        <div className="p-3 bg-dark-card border border-brand-500/40 rounded-xl text-xs text-brand-300">
          {migrationMessage}
        </div>
      )}

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Total Questions */}
        <div
          onClick={() => router.push('/questions')}
          className="bg-dark-card border border-dark-border hover:border-brand-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Questions</span>
            <Layers className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {stats?.questions?.total ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Total in pool</div>
        </div>

        {/* Unused Questions */}
        <div
          onClick={() => router.push('/questions?status=unused')}
          className="bg-dark-card border border-dark-border hover:border-emerald-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Unused</span>
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
            {stats?.questions?.unused ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Ready for quiz</div>
        </div>

        {/* Used Questions */}
        <div
          onClick={() => router.push('/questions?status=used')}
          className="bg-dark-card border border-dark-border hover:border-indigo-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Used</span>
            <FileCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400 tracking-tight">
            {stats?.questions?.used ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Published once+</div>
        </div>

        {/* Total Quizzes */}
        <div
          onClick={() => router.push('/history')}
          className="bg-dark-card border border-dark-border hover:border-purple-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Quizzes</span>
            <Send className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {stats?.quizzes?.total ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Total created</div>
        </div>

        {/* Published Quizzes */}
        <div
          onClick={() => router.push('/history?status=published')}
          className="bg-dark-card border border-dark-border hover:border-green-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Published</span>
            <CheckCircle2 className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-400 tracking-tight">
            {stats?.quizzes?.published ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Live on Telegram</div>
        </div>

        {/* Draft Quizzes */}
        <div
          onClick={() => router.push('/history?status=draft')}
          className="bg-dark-card border border-dark-border hover:border-amber-500/40 p-3.5 rounded-xl shadow-card cursor-pointer transition-all touch-press group"
        >
          <div className="flex items-center justify-between text-dark-muted mb-1">
            <span className="text-[11px] font-medium">Drafts</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight">
            {stats?.quizzes?.draft ?? 0}
          </div>
          <div className="text-[10px] text-dark-muted mt-0.5">Ready to publish</div>
        </div>
      </div>

      {/* Primary Action Buttons (Mobile-first large cards) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted px-1">
          Quick Workflows
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Claude Prompt */}
          <button
            onClick={() => router.push('/prompts')}
            className="flex items-center gap-3.5 bg-gradient-to-tr from-dark-card to-dark-surface hover:from-dark-surface hover:to-dark-card border border-dark-border hover:border-primary-500/50 p-4 rounded-2xl text-left shadow-card transition-all touch-press group"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Claude Prompt</div>
              <p className="text-[11px] text-dark-muted truncate">1-Tap copy prompt for AI questions</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Import Questions */}
          <button
            onClick={() => router.push('/import')}
            className="flex items-center gap-3.5 bg-gradient-to-tr from-dark-card to-dark-surface hover:from-dark-surface hover:to-dark-card border border-dark-border hover:border-brand-500/50 p-4 rounded-2xl text-left shadow-card transition-all touch-press group"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Import Questions</div>
              <p className="text-[11px] text-dark-muted truncate">Paste Claude JSON / Upload TXT</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Question Pool */}
          <button
            onClick={() => router.push('/questions')}
            className="flex items-center gap-3.5 bg-gradient-to-tr from-dark-card to-dark-surface hover:from-dark-surface hover:to-dark-card border border-dark-border hover:border-emerald-500/50 p-4 rounded-2xl text-left shadow-card transition-all touch-press group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Question Pool</div>
              <p className="text-[11px] text-dark-muted truncate">Search, filter & manage MCQs</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Create Quiz */}
          <button
            onClick={() => router.push('/quizzes/new')}
            className="flex items-center gap-3.5 bg-gradient-to-tr from-brand-950/40 to-dark-card hover:from-brand-900/40 hover:to-dark-surface border border-brand-500/40 hover:border-brand-500 p-4 rounded-2xl text-left shadow-glow transition-all touch-press group"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-glow">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">Create New Quiz</div>
              <p className="text-[11px] text-brand-300 truncate">Pick questions & publish to TG</p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-400 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Quizzes & Recent Pool Additions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Quizzes */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary-400" />
              <h3 className="text-sm font-bold text-white">Recent Quizzes</h3>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {stats?.recentQuizzes?.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-muted">
                No quizzes created yet. Tap "Create New Quiz" to start!
              </div>
            ) : (
              stats?.recentQuizzes?.map((qz: any) => (
                <div
                  key={qz._id}
                  onClick={() => router.push(qz.status === 'draft' ? `/quizzes/${qz._id}/publish` : `/history`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-surface/60 border border-dark-border/50 cursor-pointer transition-all touch-press"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{qz.title}</span>
                      <span className="text-[10px] text-dark-muted font-mono">{qz.customId}</span>
                    </div>
                    <div className="text-[11px] text-dark-muted truncate mt-0.5">
                      {qz.subject} • {qz.questionCount} Questions
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        qz.status === 'published'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : qz.status === 'publishing'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {qz.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-dark-muted" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Questions */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Recent Question Pool</h3>
            </div>
            <button
              onClick={() => router.push('/questions')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              View Pool
            </button>
          </div>

          <div className="space-y-2">
            {stats?.recentQuestions?.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-muted">
                Question pool is empty. Tap "Import Questions" to add MCQs.
              </div>
            ) : (
              stats?.recentQuestions?.map((q: any) => (
                <div
                  key={q._id}
                  onClick={() => router.push('/questions')}
                  className="p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-surface/60 border border-dark-border/50 cursor-pointer transition-all touch-press"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                      {q.customId}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        q.status === 'used'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 line-clamp-1 font-hindi">{q.questionText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
