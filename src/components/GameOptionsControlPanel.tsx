import React, { useState } from 'react';
import { Users, Palette, User, Bot, Swords, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIDifficulty } from '../types';
import { AIDifficultySelector } from './AIDifficultySelector';

export interface PlayerSlot {
  id: string;
  name: string;
  colorHex: string;
  isAi: boolean;
  isUser?: boolean;
  onToggleAi?: () => void;
}

export interface GameOptionsControlPanelProps {
  playerCountOptions?: number[]; // e.g. [2] or [2, 3, 4]
  playerCount?: number;
  onPlayerCountChange?: (count: number) => void;

  userColorId?: string;
  onUserColorChange?: (id: string) => void;

  playerSlots: PlayerSlot[];
  
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameModeChange?: (mode: 'pvp' | 'ai' | 'local') => void;

  aiDifficulty?: AIDifficulty;
  onAiDifficultyChange?: (difficulty: AIDifficulty) => void;

  onResetGame?: () => void;
  title?: string;
  allowColorSelection?: boolean;
  onOpenCustomSandbox?: () => void;
}

export const GameOptionsControlPanel: React.FC<GameOptionsControlPanelProps> = ({
  playerCountOptions = [2],
  playerCount = 2,
  onPlayerCountChange,
  userColorId,
  onUserColorChange,
  playerSlots,
  gameMode,
  onGameModeChange,
  aiDifficulty = 'medium',
  onAiDifficultyChange,
  onResetGame,
  title,
  allowColorSelection = true,
  onOpenCustomSandbox,
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(true);

  const hasAiPlayer = gameMode === 'ai' || playerSlots.some((s) => s.isAi);

  return (
    <div className="w-full max-w-[850px] bg-slate-950/85 border border-[#f3ce6b]/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Player Count Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Players:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1">
            {playerCountOptions.map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (onPlayerCountChange) onPlayerCountChange(num);
                  if (onResetGame) onResetGame();
                }}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1 ${
                  playerCount === num
                    ? 'bg-[#f3ce6b] text-slate-950 shadow-[0_0_12px_rgba(243,206,107,0.5)] scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Game Mode Selector (PVP / AI / Local) if present */}
        {gameMode && onGameModeChange && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => {
                onGameModeChange('pvp');
                if (onResetGame) onResetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                gameMode === 'pvp'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
            <button
              onClick={() => {
                onGameModeChange('ai');
                if (onResetGame) onResetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                gameMode === 'ai'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI</span>
            </button>
          </div>
        )}

        {/* Right Side: Sandbox & Toggle Options Expansion Buttons */}
        <div className="flex items-center gap-2">
          {onOpenCustomSandbox && (
            <button
              onClick={onOpenCustomSandbox}
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/35 px-2.5 py-1.5 rounded-xl transition shadow-sm hover:bg-emerald-500/25 active:scale-95"
              title="Open Custom Chess Variant Sandbox"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Variant Sandbox</span>
            </button>
          )}

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl transition shadow-sm hover:bg-amber-400/20 active:scale-95"
          >
            <Palette className="w-4 h-4" />
            <span>{showOptions ? 'Hide Options' : 'Show Options'}</span>
            {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Options Panel */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-800/80 pt-3 flex flex-col gap-3"
          >
            {/* AI Level Difficulty Selector */}
            {hasAiPlayer && (
              <AIDifficultySelector
                currentLevel={aiDifficulty}
                onSelectLevel={(level) => {
                  if (onAiDifficultyChange) onAiDifficultyChange(level as AIDifficulty);
                }}
              />
            )}

            {/* Color / Side Selection for Player 1 */}
            {allowColorSelection && userColorId && onUserColorChange && (
              <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-white/10 rounded-xl p-2.5 gap-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Your Color (Player 1):</span>
                </span>
                <div className="flex items-center gap-2">
                  {playerSlots.map((slot) => {
                    const isSelected = userColorId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          onUserColorChange(slot.id);
                          if (onResetGame) onResetGame();
                        }}
                        style={{ backgroundColor: slot.colorHex }}
                        className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${
                          isSelected
                            ? 'border-white ring-2 ring-amber-400 scale-110 shadow-lg'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        title={`Select ${slot.name}`}
                      >
                        {isSelected && <User className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Slots Human / AI Toggles */}
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Toggle Human / AI for Active Board Colors:</span>
              </div>

              <div className={`grid gap-2.5 ${playerSlots.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                {playerSlots.map((slot) => {
                  const isUser = slot.isUser || userColorId === slot.id;
                  const isAi = slot.isAi;

                  return (
                    <div
                      key={slot.id}
                      className={`border rounded-xl p-2.5 flex flex-col gap-2 transition ${
                        isUser
                          ? 'bg-amber-500/10 border-amber-400/40 shadow-md'
                          : isAi
                          ? 'bg-purple-950/40 border-purple-500/30'
                          : 'bg-slate-900/90 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/80 shadow-sm"
                            style={{ backgroundColor: slot.colorHex }}
                          />
                          <span className="text-xs font-black text-white capitalize">{slot.name}</span>
                        </div>
                        {isUser && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30">
                            YOU
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isUser}
                        onClick={() => {
                          if (slot.onToggleAi) slot.onToggleAi();
                          if (onResetGame) onResetGame();
                        }}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                          isUser
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-default'
                            : isAi
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50'
                            : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50'
                        }`}
                      >
                        {isUser ? (
                          <>
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span>Player 1 (You)</span>
                          </>
                        ) : isAi ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI Opponent</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Human Player</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
