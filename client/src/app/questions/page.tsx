'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import {
  Layers,
  Search,
  Filter,
  PlusCircle,
  Archive,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  X,
  History,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modals
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        category: categoryFilter,
        difficulty: difficultyFilter,
      });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data && res.data.success) {
        setQuestions(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(1);
  }, [statusFilter, categoryFilter, difficultyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions(1);
  };

  const openDetailModal = async (qId: string) => {
    try {
      const res = await api.get(`/questions/${qId}`);
      if (res.data && res.data.success) {
        setSelectedQuestion(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch question detail:', err);
    }
  };

  const handleArchive = async (qId: string) => {
    try {
      const res = await api.post(`/questions/${qId}/archive`);
      if (res.data && res.data.success) {
        setToastMessage(`Question ${res.data.data.status === 'archived' ? 'archived' : 'restored'}`);
        fetchQuestions(meta.page);
        if (selectedQuestion) setSelectedQuestion(null);
        setTimeout(() => setToastMessage(''), 2500);
      }
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm('Are you sure you want to permanently delete this question?')) return;
    try {
      const res = await api.delete(`/questions/${qId}`);
      if (res.data && res.data.success) {
        setToastMessage('Question deleted successfully');
        fetchQuestions(meta.page);
        if (selectedQuestion) setSelectedQuestion(null);
        setTimeout(() => setToastMessage(''), 2500);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      setIsSubmitting(true);
      const res = await api.put(`/questions/${editingQuestion._id}`, editingQuestion);
      if (res.data && res.data.success) {
        setToastMessage('Question updated successfully!');
        setEditingQuestion(null);
        fetchQuestions(meta.page);
        setTimeout(() => setToastMessage(''), 2500);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">Question Pool</h1>
              <span className="text-xs bg-dark-bg text-dark-muted px-2 py-0.5 rounded-full border border-dark-border font-mono font-bold">
                {meta.total} Questions
              </span>
            </div>
            <p className="text-xs text-dark-muted">Search, filter & manage all Rajasthan GK MCQs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/import')}
            className="flex items-center gap-1.5 text-xs bg-dark-surface hover:bg-dark-border border border-dark-border text-gray-200 px-3 py-2 rounded-xl transition-all touch-press"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-400" />
            <span>Import</span>
          </button>
          <button
            onClick={() => router.push('/quizzes/new')}
            className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white font-bold px-3.5 py-2 rounded-xl shadow-glow transition-all touch-press"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Build Quiz</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300">
          {toastMessage}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-3 sm:p-4 shadow-card space-y-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question text, ID (Q-0001), category..."
              className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 text-dark-muted absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="bg-dark-surface hover:bg-dark-border text-xs text-white px-4 py-2 rounded-xl border border-dark-border transition-all"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dark-border/40">
          {/* Status Filter */}
          <div className="flex items-center bg-dark-bg p-0.5 rounded-lg border border-dark-border text-[11px]">
            {['all', 'unused', 'used', 'archived'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-dark-muted hover:text-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-dark-bg border border-dark-border text-[11px] text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-dark-muted space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
          <span className="text-xs">Loading Question Pool...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center space-y-3">
          <Layers className="w-10 h-10 text-dark-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Questions Found</h3>
          <p className="text-xs text-dark-muted max-w-sm mx-auto">
            No questions match your current filters. Try changing filters or import new questions from Claude.
          </p>
          <button
            onClick={() => router.push('/import')}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-glow transition-all"
          >
            Import Questions Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q._id}
              className="bg-dark-card border border-dark-border hover:border-dark-border/80 rounded-2xl p-4 shadow-card transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                    {q.customId}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      q.status === 'used'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : q.status === 'archived'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {q.status === 'used' ? `Used (${q.usageCount}x)` : q.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-dark-muted hidden sm:inline">
                    {q.category} • {q.difficulty}
                  </span>

                  <button
                    onClick={() => openDetailModal(q._id)}
                    className="p-1.5 rounded-lg bg-dark-bg hover:bg-dark-surface text-gray-300 hover:text-white border border-dark-border transition-all"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="p-1.5 rounded-lg bg-dark-bg hover:bg-dark-surface text-gray-300 hover:text-white border border-dark-border transition-all"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(q._id)}
                    className="p-1.5 rounded-lg bg-dark-bg hover:bg-dark-surface text-gray-400 hover:text-amber-300 border border-dark-border transition-all"
                    title={q.status === 'archived' ? 'Restore' : 'Archive'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-xs sm:text-sm font-semibold text-white font-hindi leading-relaxed mb-3">
                {q.questionText}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                {q.options.map((opt: string, optIdx: number) => {
                  const isCorrect = optIdx === q.correctOption;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <div
                      key={optIdx}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-hindi flex items-center gap-1.5 ${
                        isCorrect
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                          : 'bg-dark-bg/60 text-gray-300 border-dark-border/40'
                      }`}
                    >
                      <span className="font-bold text-[10px] opacity-75">{letter})</span>
                      <span className="truncate">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="text-[11px] text-dark-muted font-hindi italic border-t border-dark-border/40 pt-2 line-clamp-1">
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-dark-card border border-dark-border p-3 rounded-xl">
              <span className="text-xs text-dark-muted">
                Page {meta.page} of {meta.totalPages} ({meta.total} questions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchQuestions(meta.page - 1)}
                  className="p-1.5 rounded-lg bg-dark-bg border border-dark-border text-gray-300 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchQuestions(meta.page + 1)}
                  className="p-1.5 rounded-lg bg-dark-bg border border-dark-border text-gray-300 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Details Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-dark-card border border-dark-border w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-card max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                  {selectedQuestion.customId}
                </span>
                <span className="text-xs text-dark-muted">Question Details</span>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="p-1.5 rounded-lg text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-white font-hindi leading-relaxed">
              {selectedQuestion.questionText}
            </p>

            {/* Options */}
            <div className="space-y-1.5">
              {selectedQuestion.options.map((opt: string, idx: number) => {
                const isCorrect = idx === selectedQuestion.correctOption;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs font-hindi flex items-center gap-2 ${
                      isCorrect
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                        : 'bg-dark-bg text-gray-300 border-dark-border'
                    }`}
                  >
                    <span className="font-bold text-xs">{letter})</span>
                    <span>{opt}</span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-brand-400 ml-auto" />}
                  </div>
                );
              })}
            </div>

            {selectedQuestion.explanation && (
              <div className="bg-dark-bg p-3 rounded-xl border border-dark-border text-xs text-gray-300 font-hindi">
                <span className="font-bold text-brand-400">व्याख्या / Explanation:</span>{' '}
                {selectedQuestion.explanation}
              </div>
            )}

            {/* Usage History in Quizzes */}
            <div className="bg-dark-surface/40 p-3.5 rounded-xl border border-dark-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Used in Quizzes ({selectedQuestion.usedInQuizzes?.length || 0})</span>
              </div>

              {selectedQuestion.usedInQuizzes?.length === 0 ? (
                <p className="text-xs text-dark-muted">This question has not been published in any quiz yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedQuestion.usedInQuizzes?.map((qz: any, qzIdx: number) => (
                    <div
                      key={qzIdx}
                      className="p-2 rounded-lg bg-dark-bg border border-dark-border/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{qz.title}</div>
                        <div className="text-[10px] text-dark-muted">
                          {qz.subject} • Msg ID: {qz.telegramMessageId || 'N/A'}
                        </div>
                      </div>
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded capitalize">
                        {qz.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setEditingQuestion(selectedQuestion);
                  setSelectedQuestion(null);
                }}
                className="flex-1 bg-dark-surface hover:bg-dark-border text-white text-xs font-semibold py-2.5 rounded-xl border border-dark-border transition-all"
              >
                Edit Question
              </button>
              <button
                onClick={() => handleArchive(selectedQuestion._id)}
                className="px-4 bg-dark-surface hover:bg-dark-border text-amber-300 text-xs font-semibold py-2.5 rounded-xl border border-dark-border transition-all"
              >
                {selectedQuestion.status === 'archived' ? 'Restore' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-dark-card border border-dark-border w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-card max-h-[90vh] overflow-y-auto space-y-3 animate-in slide-in-from-bottom"
          >
            <div className="flex items-center justify-between border-b border-dark-border pb-2.5">
              <h3 className="text-sm font-bold text-white">Edit Question ({editingQuestion.customId})</h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-lg text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-dark-muted mb-1">Question Text</label>
              <textarea
                value={editingQuestion.questionText}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, questionText: e.target.value })
                }
                rows={3}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-xs text-white font-hindi focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-dark-muted">
                Options & Correct Answer Selection:
              </label>
              {editingQuestion.options.map((opt: string, optIdx: number) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = editingQuestion.correctOption === optIdx;
                return (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingQuestion({ ...editingQuestion, correctOption: optIdx })
                      }
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-glow'
                          : 'bg-dark-surface text-gray-400 border border-dark-border'
                      }`}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[optIdx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white font-hindi focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-dark-muted mb-1">
                Explanation (व्याख्या)
              </label>
              <input
                type="text"
                value={editingQuestion.explanation || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                }
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white font-hindi focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-dark-muted mb-1">Category</label>
                <input
                  type="text"
                  value={editingQuestion.category || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, category: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-dark-muted mb-1">Difficulty</label>
                <select
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })
                  }
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="flex-1 bg-dark-surface text-gray-300 text-xs font-semibold py-2.5 rounded-xl border border-dark-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-glow transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-dark-muted space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
          <span className="text-xs">Loading Question Pool...</span>
        </div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
