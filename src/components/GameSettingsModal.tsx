import React, { useState } from 'react';
import { GameSettings, BoardTheme, TimeControlPreset } from '../types';
import { Settings, X, Palette, Clock, User, Volume2, VolumeX, Check, Bot } from 'lucide-react';

interface GameSettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (newSettings: GameSettings) => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  const [formState, setFormState] = useState<GameSettings>(settings);

  if (!isOpen) return null;

  const boardThemes: { id: BoardTheme; name: string; preview: string }[] = [
    { id: 'cyber', name: 'Cyber Neon (Cinematic Image Match)', preview: 'bg-[#121c2a] border border-cyan-400' },
    { id: 'terracotta', name: 'Terracotta Sienna', preview: 'bg-[#be5b3c]' },
    { id: 'emerald', name: 'Emerald Tournament', preview: 'bg-emerald-700' },
    { id: 'wood', name: 'Walnut & Maple Wood', preview: 'bg-amber-800' },
    { id: 'slate', name: 'Midnight Slate', preview: 'bg-slate-700' },
    { id: 'stone', name: 'Minimal Stone', preview: 'bg-stone-600' },
    { id: 'neon', name: 'Cyberpunk Purple Neon', preview: 'bg-indigo-900' },
    { id: 'ocean', name: 'Pacific Azure', preview: 'bg-sky-700' },
    { id: 'crimson', name: 'Royal Velvet', preview: 'bg-rose-900' },
    { id: 'glass', name: 'Nordic Crystal', preview: 'bg-slate-500' },
  ];

  const timePresets: { id: TimeControlPreset; label: string; desc: string }[] = [
    { id: 'untimed', label: 'Untimed', desc: 'Casual no clock' },
    { id: '3+2', label: 'Blitz 3+2', desc: '3 mins + 2s inc' },
    { id: '5+3', label: 'Blitz 5+3', desc: '5 mins + 3s inc' },
    { id: '10+0', label: 'Rapid 10+0', desc: '10 minutes' },
    { id: '15+10', label: 'Classical 15+10', desc: '15 mins + 10s inc' },
  ];

  const handlePresetSelect = (preset: TimeControlPreset) => {
    let initial = 0;
    let inc = 0;
    switch (preset) {
      case '3+2':
        initial = 180;
        inc = 2;
        break;
      case '5+3':
        initial = 300;
        inc = 3;
        break;
      case '10+0':
        initial = 600;
        inc = 0;
        break;
      case '15+10':
        initial = 900;
        inc = 10;
        break;
      case 'untimed':
      default:
        initial = 0;
        inc = 0;
        break;
    }

    setFormState({
      ...formState,
      timeControl: {
        preset,
        initialSeconds: initial,
        incrementSeconds: inc,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/80 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Game Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {/* Player Profiles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Player Profiles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-indigo-200/70 font-medium mb-1 block">White Player</label>
                <input
                  type="text"
                  value={formState.whitePlayer.name}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      whitePlayer: { ...formState.whitePlayer, name: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/80 transition"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-indigo-200/70 font-medium mb-1 block">Black Player</label>
                <input
                  type="text"
                  value={formState.blackPlayer.name}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      blackPlayer: { ...formState.blackPlayer, name: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-400/80 transition"
                  maxLength={20}
                  required
                />
              </div>
            </div>
          </div>

          {/* Time Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Time Control</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timePresets.map((pt) => {
                const isSelected = formState.timeControl.preset === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => handlePresetSelect(pt.id)}
                    className={`p-3 rounded-xl text-left border transition backdrop-blur-md ${
                      isSelected
                        ? 'bg-indigo-500/25 border-indigo-400/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/60'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{pt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-indigo-200/60 mt-0.5">{pt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Difficulty Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Engine Difficulty (8 Levels)</span>
              </span>
              <span className="text-[11px] text-amber-300/80 font-mono">
                {typeof formState.aiDifficulty === 'number'
                  ? `Level ${formState.aiDifficulty}`
                  : formState.aiDifficulty.toUpperCase()}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 1, label: 'Lvl 1 - Beginner', desc: 'High Error / Shallow' },
                { id: 2, label: 'Lvl 2 - Novice', desc: 'Basic Tactics' },
                { id: 3, label: 'Lvl 3 - Casual', desc: 'Material Focus' },
                { id: 4, label: 'Lvl 4 - Intermediate', desc: 'Standard Balanced' },
                { id: 5, label: 'Lvl 5 - Advanced', desc: 'Strong Principles' },
                { id: 6, label: 'Lvl 6 - Expert', desc: 'Alpha-Beta Search' },
                { id: 7, label: 'Lvl 7 - Master', desc: 'Deep Calculation' },
                { id: 8, label: 'Lvl 8 - Grandmaster', desc: 'Zero Flaws / Max Depth' },
              ].map((lvl) => {
                const currentNum = typeof formState.aiDifficulty === 'number' 
                  ? formState.aiDifficulty 
                  : formState.aiDifficulty === 'easy' ? 2 
                  : formState.aiDifficulty === 'medium' ? 4 
                  : formState.aiDifficulty === 'hard' ? 6 
                  : formState.aiDifficulty === 'master' ? 8 : 4;
                const isSelected = currentNum === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, aiDifficulty: lvl.id as any })}
                    className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition backdrop-blur-md text-left ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/60'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-white flex items-center justify-between w-full">
                      <span>{lvl.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-purple-200/60 font-medium">{lvl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Board Themes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Board Theme</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {boardThemes.map((bt) => {
                const isSelected = formState.boardTheme === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, boardTheme: bt.id })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition backdrop-blur-md ${
                      isSelected
                        ? 'bg-indigo-500/25 border-indigo-400/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg ${bt.preview} border border-white/20 shadow-sm`} />
                    <span className="text-xs font-semibold">{bt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white block">Auto-Flip Board</span>
                <span className="text-xs text-white/50">Rotate board after each move for local pass & play</span>
              </div>
              <input
                type="checkbox"
                checked={formState.autoFlipBoard}
                onChange={(e) => setFormState({ ...formState, autoFlipBoard: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 text-indigo-500 focus:ring-indigo-500 bg-white/10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white block">Sound Effects</span>
                <span className="text-xs text-white/50">Play audio on move, capture, and check</span>
              </div>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, soundEnabled: !formState.soundEnabled })}
                className={`p-2 rounded-xl border transition ${
                  formState.soundEnabled
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {formState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
