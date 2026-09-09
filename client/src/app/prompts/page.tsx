'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Sparkles, Copy, Check, Edit3, RotateCcw, Save, BookOpen, ArrowRight, ExternalLink } from 'lucide-react';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [topicInput, setTopicInput] = useState('राजस्थान के प्रमुख दुर्ग एवं महल');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prompts');
      if (res.data && res.data.success) {
        setPrompts(res.data.data);
        const def = res.data.data.find((p: any) => p.isDefault) || res.data.data[0];
        setSelectedPrompt(def);
        setEditedContent(def?.content || '');
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const getCustomizedPrompt = () => {
    if (!selectedPrompt) return '';
    let content = isEditing ? editedContent : selectedPrompt.content;
    if (topicInput.trim()) {
      content = content.replace(/\[TOPIC_NAME_HERE\]/g, topicInput.trim());
    }
    return content;
  };

  const handleCopy = async () => {
    const textToCopy = getCustomizedPrompt();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older mobile webviews
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    try {
      setSaving(true);
      const res = await api.put(`/prompts/${selectedPrompt._id}`, {
        content: editedContent,
      });
      if (res.data && res.data.success) {
        setMessage('Prompt updated successfully!');
        setSelectedPrompt(res.data.data);
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const res = await api.post('/prompts/reset-default');
      if (res.data && res.data.success) {
        setSelectedPrompt(res.data.data);
        setEditedContent(res.data.data.content);
        setIsEditing(false);
        setMessage('Prompt reset to factory default template.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Title Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Claude Prompt Assistant</h1>
            <p className="text-xs text-dark-muted">1-Tap Prompt Generator for Rajasthan GK Quizzes</p>
          </div>
        </div>

        <a
          href="https://claude.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-xl border border-primary-500/20 transition-all"
        >
          <span>Open Claude</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {message && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-center justify-between">
          <span>{message}</span>
        </div>
      )}

      {/* Topic Customizer Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card space-y-3">
        <label className="block text-xs font-semibold text-gray-300">
          Target Quiz Topic (Auto-replaces in prompt):
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="e.g. राजस्थान का इतिहास जानने के स्त्रोत / 1857 की क्रांति"
            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 font-hindi"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-glow transition-all touch-press flex-shrink-0 ${
              copied
                ? 'bg-brand-600'
                : 'bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-500 hover:to-brand-500'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>1-Tap Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt Editor & Display */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Prompt Content</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1 rounded-lg transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-dark-surface px-2.5 py-1 rounded-lg border border-dark-border transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-300 bg-dark-surface px-2.5 py-1 rounded-lg border border-dark-border transition-all"
                  title="Reset to Factory Prompt"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={12}
            className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
          />
        ) : (
          <div className="bg-dark-bg border border-dark-border/70 rounded-xl p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all">
            {getCustomizedPrompt()}
          </div>
        )}
      </div>

      {/* 4-Step Quick Instructions */}
      <div className="bg-dark-surface/40 border border-dark-border rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">How to use on Mobile:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-dark-muted">
          <div className="bg-dark-card/60 p-2.5 rounded-xl border border-dark-border/40">
            <span className="font-bold text-primary-400">1.</span> Tap <b>1-Tap Copy</b> above
          </div>
          <div className="bg-dark-card/60 p-2.5 rounded-xl border border-dark-border/40">
            <span className="font-bold text-primary-400">2.</span> Open Claude and paste
          </div>
          <div className="bg-dark-card/60 p-2.5 rounded-xl border border-dark-border/40">
            <span className="font-bold text-primary-400">3.</span> Copy Claude JSON output
          </div>
          <div className="bg-dark-card/60 p-2.5 rounded-xl border border-dark-border/40">
            <span className="font-bold text-primary-400">4.</span> Go to <b>Import</b> & paste
          </div>
        </div>
      </div>
    </div>
  );
}
