import React from 'react';
import { Bot, Users, Sparkles, User, Zap } from 'lucide-react';

export type StandardAIDifficulty = 'easy' | 'medium' | 'hard';
export type StandardOpponentType = 'pvp' | 'ai' | 'solo' | 'wall' | 'local';

export interface BotAISettingsBarProps {
  opponentType: StandardOpponentType;
  onOpponentTypeChange: (type: 'pvp' | 'ai' | 'solo') => void;
  aiDifficulty?: StandardAIDifficulty | string | number;
  onAiDifficultyChange?: (difficulty: StandardAIDifficulty) => void;
  statusMessage?: string;
  hasSoloMode?: boolean;
  soloLabel?: string;
  className?: string;
  accentColor?: 'blue' | 'amber' | 'emerald' | 'purple' | 'red';
}

export const BotAISettingsBar: React.FC<BotAISettingsBarProps> = ({
  opponentType,
  onOpponentTypeChange,
  aiDifficulty = 'medium',
  onAiDifficultyChange,
  statusMessage = 'Play 2-Player local or challenge the AI Bot!',
  hasSoloMode = false,
  soloLabel = 'Solo / Wall',
  className = '',
  accentColor = 'amber',
}) => {
  const isAi = opponentType === 'ai';
  const isPvp = opponentType === 'pvp' || opponentType === 'local';
  const isSolo = opponentType === 'solo' || opponentType === 'wall';

  // Normalize aiDifficulty to 'easy' | 'medium' | 'hard'
  const normalizedDifficulty: StandardAIDifficulty =
    typeof aiDifficulty === 'number'
      ? aiDifficulty <= 3
        ? 'easy'
        : aiDifficulty <= 6
        ? 'medium'
        : 'hard'
      : aiDifficulty === 'master' || aiDifficulty === 'hard'
      ? 'hard'
      : aiDifficulty === 'easy'
      ? 'easy'
      : 'medium';

  return (
    <div
      id="bot-ai-settings-bar"
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/75 border border-slate-800 p-3 rounded-2xl shadow-lg backdrop-blur-md transition-all ${className}`}
    >
      {/* Left side: Status with icon */}
      <div className="text-xs text-slate-300 text-center sm:text-left flex items-center gap-1.5 flex-1 min-w-0">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="truncate">{statusMessage}</span>
      </div>

      {/* Right side: 2P Local / AI Bot / Solo Switcher + Difficulty Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex bg-slate-800/90 rounded-xl p-0.5 border border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => onOpponentTypeChange('pvp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isPvp
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Two players on the same screen"
          >
            <Users className="w-3.5 h-3.5" />
            <span>2P Local</span>
          </button>

          <button
            type="button"
            onClick={() => onOpponentTypeChange('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isAi
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Play against AI Bot"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Bot</span>
          </button>

          {hasSoloMode && (
            <button
              type="button"
              onClick={() => onOpponentTypeChange('solo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSolo
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Practice solo"
            >
              <User className="w-3.5 h-3.5" />
              <span>{soloLabel}</span>
            </button>
          )}
        </div>

        {/* AI Difficulty Selector (Visible when AI Bot is selected) */}
        {isAi && onAiDifficultyChange && (
          <select
            value={normalizedDifficulty}
            onChange={(e) => onAiDifficultyChange(e.target.value as StandardAIDifficulty)}
            className="bg-slate-800/90 border border-slate-700/80 text-amber-300 text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold cursor-pointer shadow-md hover:border-amber-400/50 transition-colors"
            title="Select AI Bot Difficulty"
          >
            <option value="easy">Easy Bot</option>
            <option value="medium">Medium Bot</option>
            <option value="hard">Pro Bot</option>
          </select>
        )}
      </div>
    </div>
  );
};
