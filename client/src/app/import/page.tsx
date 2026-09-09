'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState('Rajasthan GK');
  const [exam, setExam] = useState('General');
  const [difficulty, setDifficulty] = useState('Medium');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [previewData, setPreviewData] = useState<any>(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      setErrorMsg('');
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste JSON/text or upload a file first.');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg('');
      setSuccessMsg('');
      setPreviewData(null);

      const res = await api.post('/questions/import/preview', {
        text: rawText,
        defaultCategory: category,
        defaultExam: exam,
        defaultDifficulty: difficulty,
      });

      if (res.data && res.data.success) {
        setPreviewData(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to parse and validate input.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.questions) return;

    try {
      setConfirming(true);
      setErrorMsg('');

      const res = await api.post('/questions/import/confirm', {
        questions: previewData.questions,
        skipDuplicates,
      });

      if (res.data && res.data.success) {
        setSuccessMsg(`🎉 Successfully imported ${res.data.importedCount} questions into Question Pool!`);
        setPreviewData(null);
        setRawText('');
        setTimeout(() => {
          router.push('/questions');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to confirm import.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Title Card */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Import Questions</h1>
            <p className="text-xs text-dark-muted">Ingest Claude JSON or Legacy TXT into Question Pool</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/questions')}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium"
        >
          View Pool →
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Ingestion Box */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
        {/* Method Switcher Tabs */}
        <div className="flex bg-dark-bg p-1 rounded-xl border border-dark-border max-w-xs">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-brand-600 text-white shadow'
                : 'text-dark-muted hover:text-gray-200'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste Output</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-brand-600 text-white shadow'
                : 'text-dark-muted hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {activeTab === 'paste' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Paste Claude Response (JSON, Markdown Block, or Legacy Format):
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste generated questions here..."
              rows={8}
              className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-dark-border hover:border-brand-500/60 rounded-2xl p-8 text-center bg-dark-bg/40 transition-colors">
            <Upload className="w-8 h-8 text-brand-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-white">Upload Question File</div>
            <p className="text-[11px] text-dark-muted mt-0.5">Supports .json and .txt files</p>
            <label className="inline-block mt-3 bg-dark-surface hover:bg-dark-border text-xs text-brand-300 font-semibold px-4 py-2 rounded-xl border border-dark-border cursor-pointer transition-all touch-press">
              <span>Choose File</span>
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {rawText && (
              <div className="mt-3 text-xs text-brand-400 font-mono">
                ✓ File loaded ({rawText.length} characters)
              </div>
            )}
          </div>
        )}

        {/* Subject / Topic & Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dark-border/60">
          <div>
            <label className="block text-xs font-semibold text-brand-300 mb-1">
              Subject / Topic (विषय / टॉपिक)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="उदा: History - राजस्थान का इतिहास"
              className="w-full bg-dark-bg border border-brand-500/40 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-hindi"
            />
            <p className="text-[10px] text-dark-muted mt-0.5">Yeh topic imported questions me assign hoga</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Exam Name (परीक्षा)
            </label>
            <input
              type="text"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              placeholder="e.g. CET 2024 / RAS / Patwar"
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <p className="text-[10px] text-dark-muted mt-0.5">Target exam source</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Difficulty (कठिनाई स्तर)
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="Easy">Easy (सरल)</option>
              <option value="Medium">Medium (मध्यम)</option>
              <option value="Hard">Hard (कठिन)</option>
            </select>
          </div>
        </div>

        {/* Preview Action Button */}
        <button
          onClick={handlePreview}
          disabled={parsing || !rawText.trim()}
          className="w-full bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50"
        >
          {parsing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validating Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Parse & Validate Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Validation & Preview Section */}
      {previewData && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
          {/* Summary Stats Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-bg p-3.5 rounded-xl border border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="font-bold">Total:</span> {previewData.totalParsed}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{previewData.validCount} Valid</span>
              </div>
              {previewData.duplicateCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{previewData.duplicateCount} Duplicates</span>
                </div>
              )}
              {previewData.invalidCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{previewData.invalidCount} Invalid</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-dark-border text-brand-600 focus:ring-brand-500"
                />
                <span>Skip Duplicates</span>
              </label>
            </div>
          </div>

          {/* Question List Preview Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {previewData.questions.map((q: any, idx: number) => {
              const isDupe = q.isDuplicate;
              const isInvalid = !q.isValid;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isInvalid
                      ? 'bg-red-950/20 border-red-500/40'
                      : isDupe
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-dark-bg/60 border-dark-border/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dark-surface text-gray-300 font-mono">
                        #{idx + 1}
                      </span>
                      {isInvalid && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Invalid</span>
                        </span>
                      )}
                      {isDupe && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Duplicate ({q.duplicateQuestionId})</span>
                        </span>
                      )}
                      {!isInvalid && !isDupe && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready to Import</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-dark-muted">
                      {q.category} • {q.difficulty}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white font-hindi mb-2">
                    {q.questionText}
                  </p>

                  {/* Options List */}
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
                              : 'bg-dark-surface/40 text-gray-300 border-dark-border/40'
                          }`}
                        >
                          <span className="font-bold text-[10px] opacity-75">{letter})</span>
                          <span className="truncate">{opt || '(Empty option)'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-dark-muted font-hindi italic border-t border-dark-border/40 pt-1.5">
                      💡 {q.explanation}
                    </p>
                  )}

                  {/* Error List if invalid */}
                  {isInvalid && q.validationErrors && (
                    <div className="mt-2 text-[11px] text-red-400 space-y-0.5">
                      {q.validationErrors.map((err: string, eIdx: number) => (
                        <div key={eIdx}>• {err}</div>
                      ))}
                    </div>
                  )}

                  {/* Duplicate info */}
                  {isDupe && q.duplicateQuizTitles && q.duplicateQuizTitles.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-amber-300/80">
                      Already used in: {q.duplicateQuizTitles.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmImport}
            disabled={confirming || previewData.validCount === 0}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow transition-all touch-press disabled:opacity-50"
          >
            {confirming ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Import to Question Pool ({previewData.validCount} Items)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
