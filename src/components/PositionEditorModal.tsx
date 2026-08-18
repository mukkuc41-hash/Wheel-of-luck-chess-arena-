import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { FileCode, Upload, X, Check, AlertCircle } from 'lucide-react';

interface PositionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadFen: (fen: string) => void;
  onLoadPgn: (pgn: string) => void;
}

export const PositionEditorModal: React.FC<PositionEditorModalProps> = ({
  isOpen,
  onClose,
  onLoadFen,
  onLoadPgn,
}) => {
  const [fenInput, setFenInput] = useState<string>('');
  const [pgnInput, setPgnInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'fen' | 'pgn'>('fen');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadFen = () => {
    setError(null);
    try {
      const c = new Chess();
      c.load(fenInput.trim());
      onLoadFen(fenInput.trim());
      onClose();
    } catch {
      setError('Invalid FEN string format. Please verify and try again.');
    }
  };

  const handleLoadPgn = () => {
    setError(null);
    try {
      const c = new Chess();
      c.loadPgn(pgnInput.trim());
      onLoadPgn(pgnInput.trim());
      onClose();
    } catch {
      setError('Invalid PGN string format. Please verify move syntax.');
    }
  };

  const PRESET_FENS = [
    {
      name: "Standard Starting Board",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    {
      name: "Rook Endgame Challenge",
      fen: "8/8/8/4k3/8/8/4R3/4K3 w - - 0 1",
    },
    {
      name: "Pawn Majority Endgame",
      fen: "8/2p5/1p6/1P6/8/2P5/1P6/8 w - - 0 1",
    },
    {
      name: "Queen vs Knight Endgame",
      fen: "8/8/3q4/8/4n3/8/3K4/8 w - - 0 1",
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-purple-900/40 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <FileCode className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import FEN / PGN Position</h2>
              <p className="text-xs text-slate-400">Load custom positions or master game records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950 p-2 border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('fen')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === 'fen'
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FEN Position String
          </button>
          <button
            onClick={() => setActiveTab('pgn')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === 'pgn'
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PGN Game History Log
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'fen' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste FEN Notation
                </label>
                <textarea
                  value={fenInput}
                  onChange={(e) => setFenInput(e.target.value)}
                  placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Quick FEN Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_FENS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFenInput(preset.fen)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition text-xs"
                    >
                      <p className="font-bold text-indigo-300">{preset.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{preset.fen}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLoadFen}
                disabled={!fenInput.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                <Upload className="w-4 h-4" /> Load FEN Board
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste PGN Notation
                </label>
                <textarea
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  placeholder={`[Event "Casual Game"]
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...`}
                  rows={6}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                onClick={handleLoadPgn}
                disabled={!pgnInput.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                <Upload className="w-4 h-4" /> Load PGN History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
