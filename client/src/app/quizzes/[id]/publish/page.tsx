'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Edit3,
  Check,
  X,
  Tag,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function PublishQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Inline Subject & Title Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${quizId}`);
      if (res.data && res.data.success) {
        const qData = res.data.data;
        setQuiz(qData);
        setEditTitle(qData.title || '');
        setEditSubject(qData.subject === '.' ? '' : qData.subject || '');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) fetchQuiz();
  }, [quizId]);

  const handleSaveDetails = async () => {
    try {
      setSavingEdit(true);
      setErrorMsg('');
      const cleanSubject = editSubject.trim();
      const res = await api.put(`/quizzes/${quizId}`, {
        title: editTitle.trim() || quiz.title,
        subject: cleanSubject,
      });

      if (res.data && res.data.success) {
        setQuiz((prev: any) => ({
          ...prev,
          title: editTitle.trim() || prev.title,
          subject: cleanSubject,
        }));
        setIsEditing(false);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update quiz details');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePublishClick = () => {
    // Open confirmation modal
    setShowConfirmModal(true);
  };

  const executePublish = async () => {
    setShowConfirmModal(false);
    try {
      setPublishing(true);
      setErrorMsg('');
      setPublishResult(null);

      const res = await api.post(`/quizzes/${quizId}/publish`);
      if (res.data) {
        setPublishResult(res.data);
        fetchQuiz();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Quiz publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-dark-muted space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
        <span className="text-xs">Loading Quiz Details...</span>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">Quiz Not Found</h3>
        <button
          onClick={() => router.push('/')}
          className="text-xs text-primary-400 hover:text-primary-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPublished = quiz.status === 'published';
  const isPublishing = quiz.status === 'publishing' || publishing;
  const rawSubject = (quiz.subject || '').trim();
  const hasSubject = rawSubject !== '' && rawSubject !== '.';

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Top Navigation Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
            {quiz.customId}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
              isPublished
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isPublishing
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {quiz.status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quiz Overview & Subject Edit Box */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-card space-y-4">
        {!isEditing ? (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{quiz.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-dark-muted mt-2 font-hindi">
                  {hasSubject ? (
                    <span className="text-brand-300 font-semibold bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-400" />
                      <span>[{quiz.subject}]</span>
                    </span>
                  ) : (
                    <span className="text-amber-300/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>No Subject Header (Direct Question Mode)</span>
                    </span>
                  )}
                  <span>• {quiz.questionCount} Questions</span>
                  <span>• Delay: {quiz.publishDelaySeconds}s</span>
                </div>
              </div>

              {!isPublishing && (
                <button
                  onClick={() => {
                    setEditTitle(quiz.title || '');
                    setEditSubject(quiz.subject === '.' ? '' : quiz.subject || '');
                    setIsEditing(true);
                  }}
                  className="shrink-0 flex items-center gap-1.5 text-xs bg-dark-bg hover:bg-dark-border text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-dark-border transition-colors shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Subject</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Inline Editing Form */
          <div className="bg-dark-bg/80 p-4 rounded-xl border border-brand-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Quiz Title & Subject</span>
              </span>
              <button
                onClick={() => setIsEditing(false)}
                className="text-dark-muted hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Rajasthan GK Daily Quiz — 09 Sept"
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-300">
                    Subject / Topic Header (Optional)
                  </label>
                  {editSubject && (
                    <button
                      onClick={() => setEditSubject('')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                    >
                      Clear Subject (Send Direct)
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. History - राजस्थान का इतिहास (or leave blank to send without header)"
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 font-hindi"
                />
                <p className="text-[10px] text-dark-muted mt-1">
                  💡 Leave blank if you don&apos;t want any <code className="text-brand-300 font-mono">[Subject]</code> prefix added to the Telegram questions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-dark-muted hover:text-white bg-dark-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors shadow-glow disabled:opacity-50"
              >
                {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Safety Mode Badge */}
        <div className="bg-dark-bg p-3 rounded-xl border border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <div>
              <div className="text-xs font-semibold text-white">Telegram Publish Safety</div>
              <p className="text-[10px] text-dark-muted">Rate-limiting and auto-retry enabled</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-md border border-brand-500/30">
            SendPoll API
          </span>
        </div>

        {/* Publishing Result / Progress */}
        {publishResult && (
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              publishResult.success
                ? 'bg-green-950/30 border-green-500/40 text-green-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{publishResult.message}</span>
            </div>

            {publishResult.isDryRun && (
              <div className="text-[11px] text-emerald-400/90 font-mono bg-dark-bg/60 p-2 rounded-lg border border-emerald-500/20">
                🛡️ DRY RUN ACTIVE: Simulated dispatch completed. (Set TELEGRAM_DRY_RUN=false in settings to send live).
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-dark-bg/50 p-2 rounded-lg">
                <span className="text-dark-muted">Sent:</span> {publishResult.sent} / {publishResult.total}
              </div>
              <div className="bg-dark-bg/50 p-2 rounded-lg">
                <span className="text-dark-muted">Failed:</span> {publishResult.failed}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isPublished ? (
          <button
            onClick={handlePublishClick}
            disabled={isPublishing}
            className="w-full bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing to Telegram ({quiz.questionCount} Polls)...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Now to Telegram Channel</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/history')}
              className="flex-1 bg-dark-surface hover:bg-dark-border text-white text-xs font-semibold py-3 rounded-xl border border-dark-border transition-all"
            >
              View in Quiz History
            </button>
            <button
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="px-4 bg-dark-surface hover:bg-dark-border text-amber-300 text-xs font-semibold py-3 rounded-xl border border-dark-border transition-all"
              title="Re-publish"
            >
              Re-Publish
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              {hasSubject ? (
                <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-brand-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white">
                  {hasSubject ? 'Confirm Telegram Publish' : 'Publish Without Subject Header?'}
                </h3>
                <p className="text-xs text-dark-muted">
                  {hasSubject
                    ? 'Quiz is ready to broadcast to your Telegram channel.'
                    : 'No subject prefix set for this quiz.'}
                </p>
              </div>
            </div>

            <div className="bg-dark-bg p-3.5 rounded-xl border border-dark-border/80 space-y-2 text-xs">
              <div className="flex justify-between text-dark-muted">
                <span>Total Questions:</span>
                <span className="font-bold text-white">{quiz.questionCount} Polls</span>
              </div>
              <div className="flex justify-between text-dark-muted">
                <span>Subject Prefix:</span>
                <span className="font-bold text-white font-hindi">
                  {hasSubject ? `[${quiz.subject}]` : '⚪ None (Direct Question)'}
                </span>
              </div>
              <div className="flex justify-between text-dark-muted">
                <span>Delay Interval:</span>
                <span className="font-bold text-white">{quiz.publishDelaySeconds || 2} seconds</span>
              </div>

              {!hasSubject && (
                <div className="mt-2 pt-2 border-t border-dark-border/50 text-[11px] text-amber-300">
                  ⚠️ Questions will be sent cleanly without any <code className="text-white">[Subject]</code> prefix.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="order-2 sm:order-1 flex-1 py-2.5 px-3 rounded-xl border border-dark-border bg-dark-surface text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              {!hasSubject && (
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setIsEditing(true);
                  }}
                  className="order-3 sm:order-2 py-2.5 px-3 rounded-xl border border-brand-500/30 bg-brand-500/10 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors"
                >
                  Edit Subject
                </button>
              )}

              <button
                onClick={executePublish}
                className="order-1 sm:order-3 flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-xs font-bold text-white shadow-glow transition-all"
              >
                {hasSubject ? 'Confirm & Publish' : 'Yes, Publish Directly'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Items in this Quiz */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          Quiz Questions ({quiz.questions?.length || 0})
        </h3>

        <div className="space-y-2.5">
          {quiz.questions?.map((item: any) => {
            const q = item.question;
            if (!q) return null;

            return (
              <div
                key={item.quizQuestionId}
                className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      #{item.order}
                    </span>
                    <span className="text-xs font-mono text-dark-muted">{q.customId}</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      item.status === 'sent'
                        ? 'bg-green-500/20 text-green-400'
                        : item.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-dark-surface text-dark-muted'
                    }`}
                  >
                    {item.status === 'sent'
                      ? `Sent (ID: ${item.telegramMessageId || 'OK'})`
                      : item.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white font-hindi">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-2 gap-1 text-[11px] font-hindi">
                  {q.options?.map((opt: string, optIdx: number) => {
                    const isCorrect = optIdx === q.correctOption;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        className={`px-2 py-1 rounded border truncate ${
                          isCorrect
                            ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                            : 'bg-dark-card/60 text-gray-300 border-dark-border/40'
                        }`}
                      >
                        {letter}) {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
