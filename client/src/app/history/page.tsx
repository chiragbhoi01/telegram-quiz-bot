'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import {
  History,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [expandedQuizData, setExpandedQuizData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes?status=${statusFilter}`);
      if (res.data && res.data.success) {
        setQuizzes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [statusFilter]);

  const toggleExpand = async (qId: string) => {
    if (expandedQuizId === qId) {
      setExpandedQuizId(null);
      setExpandedQuizData(null);
      return;
    }

    try {
      setExpandedQuizId(qId);
      setLoadingDetail(true);
      const res = await api.get(`/quizzes/${qId}`);
      if (res.data && res.data.success) {
        setExpandedQuizData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quiz detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Quiz History</h1>
            <p className="text-xs text-dark-muted">Complete log of published Telegram quizzes and questions</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/quizzes/new')}
          className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white font-bold px-3.5 py-2 rounded-xl shadow-glow transition-all touch-press"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Quiz</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-dark-card border border-dark-border p-1 rounded-xl max-w-xs">
        {['all', 'published', 'draft', 'failed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-purple-600 text-white shadow'
                : 'text-dark-muted hover:text-gray-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-dark-muted space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
          <span className="text-xs">Loading Quiz History...</span>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center space-y-3">
          <History className="w-10 h-10 text-dark-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Quizzes Found</h3>
          <p className="text-xs text-dark-muted">
            You haven't created any quizzes in this status yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((qz) => {
            const isExpanded = expandedQuizId === qz._id;

            return (
              <div
                key={qz._id}
                className="bg-dark-card border border-dark-border hover:border-dark-border/80 rounded-2xl p-4 shadow-card transition-all"
              >
                <div
                  onClick={() => toggleExpand(qz._id)}
                  className="flex items-center justify-between cursor-pointer touch-press"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {qz.customId}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{qz.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-dark-muted font-hindi">
                      <span className="text-brand-300">[{qz.subject}]</span>
                      <span>• {qz.questionCount} Questions</span>
                      <span>• {new Date(qz.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        qz.status === 'published'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : qz.status === 'publishing'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {qz.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-dark-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-dark-border/60 space-y-3">
                    {loadingDetail ? (
                      <div className="py-4 text-center text-xs text-dark-muted">
                        Loading questions breakdown...
                      </div>
                    ) : expandedQuizData ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-300">
                            Questions Breakdown ({expandedQuizData.questions?.length})
                          </span>
                          <button
                            onClick={() => router.push(`/quizzes/${qz._id}/publish`)}
                            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                          >
                            <span>Open Publisher</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {expandedQuizData.questions?.map((item: any) => (
                            <div
                              key={item.quizQuestionId}
                              className="p-2.5 rounded-xl bg-dark-bg/80 border border-dark-border/50 text-xs flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-purple-400 text-[10px]">
                                    #{item.order}
                                  </span>
                                  <span className="font-mono text-[10px] text-dark-muted">
                                    {item.question?.customId}
                                  </span>
                                </div>
                                <p className="text-white font-hindi truncate mt-0.5">
                                  {item.question?.questionText}
                                </p>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="text-[10px] text-green-400 font-mono">
                                  {item.telegramMessageId ? `Msg ID: ${item.telegramMessageId}` : 'Status: ' + item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
