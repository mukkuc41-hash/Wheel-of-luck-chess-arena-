import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, MicOff, CheckCircle2, FileText, Send, Lock } from 'lucide-react';
import { VoiceReportRequest } from '../types';

interface VoiceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: string;
  roomId?: string;
  transcriptSnapshot?: string;
  onReportSubmitted: (reportedUser: string) => void;
}

const REPORT_REASONS = [
  {
    id: 'harassment',
    label: 'Verbal Harassment & Bullying',
    desc: 'Targeted personal attacks, insults, or abusive speech.',
  },
  {
    id: 'hate_speech',
    label: 'Hateful / Discriminatory Language',
    desc: 'Slurs, hate speech, or discriminatory harassment.',
  },
  {
    id: 'threat',
    label: 'Threatening / Aggressive Speech',
    desc: 'Intimidation, violence threats, or severe hostility.',
  },
  {
    id: 'explicit',
    label: 'Inappropriate / NSFW Audio',
    desc: 'Explicit audio content, inappropriate noise, or vulgarity.',
  },
  {
    id: 'spam_noise',
    label: 'Noise Spam & Mic Abuse',
    desc: 'Loud screeching, ear-rape noise, or non-stop disruptive sounds.',
  },
  {
    id: 'other',
    label: 'Other Misconduct Allegation',
    desc: 'Any other violation of voice chat community standards.',
  },
] as const;

export const VoiceReportModal: React.FC<VoiceReportModalProps> = ({
  isOpen,
  onClose,
  reportedUser,
  roomId,
  transcriptSnapshot,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<VoiceReportRequest['reason']>('harassment');
  const [details, setDetails] = useState('');
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedUser) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload: VoiceReportRequest = {
        reportedUser,
        reason: selectedReason,
        details,
        roomId: roomId || undefined,
        transcriptSnapshot: includeTranscript ? transcriptSnapshot : undefined,
      };

      const res = await fetch('/api/moderation/voice-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit voice report.');
      }

      setSubmitted(true);
      onReportSubmitted(reportedUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred submitting the report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-red-500/30 backdrop-blur-2xl rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-red-950/50 flex flex-col relative">
        {/* Top Danger Line */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Report Voice Misconduct</span>
              </h2>
              <p className="text-xs text-red-200/70">
                Reporting player: <span className="font-bold text-white font-mono">{reportedUser}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Voice Misconduct Report Received</h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                Thank you for helping keep our gaming community safe. The report has been logged for moderation review.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-center gap-2 text-left">
              <MicOff className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Protection Active:</strong> {reportedUser}'s voice audio stream has been <strong>automatically muted and blocked</strong> on your device.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
            >
              Return to Match
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Allegation Reason Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                Select Allegation Category
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id as VoiceReportRequest['reason'])}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                      selectedReason === r.id
                        ? 'bg-red-500/20 border-red-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        selectedReason === r.id
                          ? 'border-red-400 bg-red-500'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      {selectedReason === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{r.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>Allegation Details / Incident Description</span>
                <span className="text-[10px] text-gray-500 font-normal">Optional</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide specific context or quotes regarding the voice harassment..."
                rows={3}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-red-400 transition"
              />
            </div>

            {/* Transcript Snapshot Toggle */}
            {transcriptSnapshot && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Attach Voice Transcript Log</div>
                    <div className="text-[10px] text-gray-400">Includes recent speech-to-text audio context</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeTranscript}
                  onChange={(e) => setIncludeTranscript(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                />
              </div>
            )}

            {/* Auto Mute Notice */}
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-red-200/90 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Submitting will automatically <strong>mute and block all voice audio</strong> from <strong className="text-white">{reportedUser}</strong> instantly.
              </span>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Allegation...' : 'Submit Report & Mute'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
