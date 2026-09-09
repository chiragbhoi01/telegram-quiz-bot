'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  PlusCircle,
  Check,
  Search,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Send,
  Sparkles,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function NewQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [publishDelay, setPublishDelay] = useState(2);
  const [notes, setNotes] = useState('');

  const [poolQuestions, setPoolQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPool, setLoadingPool] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPool = async () => {
    try {
      setLoadingPool(true);
      const res = await api.get('/questions?limit=100&status=all');
      if (res.data && res.data.success) {
        setPoolQuestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pool:', err);
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    fetchPool();
    // Default title with today's date
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    setTitle(`Rajasthan GK Daily Quiz — ${dateStr}`);
  }, []);

  const toggleSelect = (qId: string) => {
    if (selectedIds.includes(qId)) {
      setSelectedIds(selectedIds.filter((id) => id !== qId));
    } else {
      setSelectedIds([...selectedIds, qId]);
    }
  };

  const selectAllUnused = () => {
    const unusedIds = poolQuestions
      .filter((q) => q.status === 'unused')
      .map((q) => q._id);
    setSelectedIds(Array.from(new Set([...selectedIds, ...unusedIds])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const newSelected = [...selectedIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSelected.length) return;

    const temp = newSelected[index];
    newSelected[index] = newSelected[targetIdx];
    newSelected[targetIdx] = temp;
    setSelectedIds(newSelected);
  };

  const handleCreateDraft = async () => {
    if (!title.trim()) {
      setErrorMsg('Please provide a quiz title.');
      return;
    }
    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least 1 question for the quiz.');
      return;
    }

    try {
      setCreating(true);
      setErrorMsg('');
      const res = await api.post('/quizzes', {
        title: title.trim(),
        subject: subject.trim(),
        questionIds: selectedIds,
        publishDelaySeconds: publishDelay,
        notes,
      });

      if (res.data && res.data.success) {
        const quizId = res.data.data._id;
        router.push(`/quizzes/${quizId}/publish`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create quiz draft.');
    } finally {
      setCreating(false);
    }
  };

  const filteredPool = poolQuestions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const qText = q.questionText.toLowerCase();
    const cId = q.customId.toLowerCase();
    const s = searchQuery.toLowerCase();
    return qText.includes(s) || cId.includes(s);
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Quiz Builder</h1>
            <p className="text-xs text-dark-muted">Assemble questions from pool & prepare Telegram draft</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            {selectedIds.length} Selected
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Quiz Metadata Config */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">1. Quiz Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-dark-muted mb-1">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rajasthan History Mock Quiz"
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-dark-muted mb-1">
              Subject Prefix (Optional — leave blank to send direct)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. History - राजस्थान का इतिहास (or leave empty)"
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-hindi"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <label className="text-[11px] font-semibold text-dark-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary-400" />
            <span>Publish Delay:</span>
          </label>
          <select
            value={publishDelay}
            onChange={(e) => setPublishDelay(Number(e.target.value))}
            className="bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value={1}>1 Second</option>
            <option value={2}>2 Seconds (Standard)</option>
            <option value={3}>3 Seconds</option>
            <option value={5}>5 Seconds</option>
          </select>
          <span className="text-[10px] text-dark-muted hidden sm:inline">Interval between polls sent to Telegram</span>
        </div>
      </div>

      {/* Question Selector from Pool */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            2. Select Questions from Pool ({selectedIds.length} Selected)
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllUnused}
              className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all"
            >
              + Select All Unused
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter questions in pool..."
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-dark-muted absolute left-3 top-2.5" />
        </div>

        {/* Pool List */}
        {loadingPool ? (
          <div className="py-8 text-center text-xs text-dark-muted">Loading questions...</div>
        ) : filteredPool.length === 0 ? (
          <div className="py-8 text-center text-xs text-dark-muted">No questions available in pool.</div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredPool.map((q) => {
              const isSelected = selectedIds.includes(q._id);
              const orderIndex = selectedIds.indexOf(q._id);

              return (
                <div
                  key={q._id}
                  onClick={() => toggleSelect(q._id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 touch-press ${
                    isSelected
                      ? 'bg-brand-950/20 border-brand-500/60'
                      : 'bg-dark-bg/60 border-dark-border/50 hover:bg-dark-surface/40'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-glow'
                        : 'border border-dark-border bg-dark-card'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                        {q.customId}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full capitalize ${
                          q.status === 'used'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {q.status === 'used' ? `Used (${q.usageCount}x)` : 'Unused'}
                      </span>
                      <span className="text-[10px] text-dark-muted">{q.category}</span>
                    </div>
                    <p className="text-xs text-white font-hindi line-clamp-2">{q.questionText}</p>
                  </div>

                  {isSelected && (
                    <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/20 px-2 py-0.5 rounded">
                      #{orderIndex + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Order & Reorder Box */}
      {selectedIds.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card space-y-2">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            3. Question Order ({selectedIds.length} items)
          </h3>
          <p className="text-[11px] text-dark-muted">
            These questions will be sent to Telegram in this exact sequence:
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {selectedIds.map((sId, idx) => {
              const qObj = poolQuestions.find((q) => q._id === sId);
              if (!qObj) return null;

              return (
                <div
                  key={sId}
                  className="flex items-center justify-between p-2 rounded-xl bg-dark-bg border border-dark-border/60 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-mono font-bold text-brand-400 text-xs w-6">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-dark-muted text-[10px]">{qObj.customId}</span>
                    <span className="text-white font-hindi truncate text-xs">{qObj.questionText}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveOrder(idx, 'up')}
                      className="p-1 rounded bg-dark-surface hover:bg-dark-border text-gray-300 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedIds.length - 1}
                      onClick={() => moveOrder(idx, 'down')}
                      className="p-1 rounded bg-dark-surface hover:bg-dark-border text-gray-300 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelect(sId)}
                      className="p-1 rounded bg-dark-surface hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <button
        onClick={handleCreateDraft}
        disabled={creating || selectedIds.length === 0}
        className="w-full bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50"
      >
        {creating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Creating Draft...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Create Draft & Proceed to Publish ({selectedIds.length} Questions)</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
