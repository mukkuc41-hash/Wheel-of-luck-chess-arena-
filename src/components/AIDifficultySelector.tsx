import React from 'react';
import { Bot, Zap, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { AIDifficulty } from '../types';

interface AIDifficultySelectorProps {
  currentLevel?: AIDifficulty | number;
  onSelectLevel: (level: number) => void;
  className?: string;
}

export const AIDifficultySelector: React.FC<AIDifficultySelectorProps> = ({
  currentLevel = 4,
  onSelectLevel,
  className = '',
}) => {
  // Convert any string preset to numerical 1-8
  const activeNumericalLevel: number = typeof currentLevel === 'number'
    ? currentLevel
    : currentLevel === 'easy'
    ? 2
    : currentLevel === 'medium'
    ? 4
    : currentLevel === 'hard'
    ? 6
    : currentLevel === 'master'
    ? 8
    : 4;

  const levels = [
    { level: 1, label: 'Lvl 1', Icon: Zap },
    { level: 2, label: 'Lvl 2', Icon: Zap },
    { level: 3, label: 'Lvl 3', Icon: Flame },
    { level: 4, label: 'Lvl 4', Icon: Flame },
    { level: 5, label: 'Lvl 5', Icon: ShieldAlert },
    { level: 6, label: 'Lvl 6', Icon: ShieldAlert },
    { level: 7, label: 'Lvl 7', Icon: Cpu },
    { level: 8, label: 'Lvl 8', Icon: Cpu },
  ];

  return (
    <div
      className={`w-full bg-[#0d071a]/95 border-2 border-[#3b1261] rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 text-white ${className}`}
    >
      {/* Header Label matching image */}
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-[#c084fc]" />
        <span className="text-xs sm:text-sm font-black tracking-widest text-[#d8b4fe] uppercase font-sans">
          AI DIFFICULTY LEVEL:
        </span>
      </div>

      {/* 8 Level Selector Buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {levels.map(({ level, label, Icon }) => {
          const isSelected = activeNumericalLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-1.5 border active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-b from-[#2e1d08] via-[#1c1103] to-[#0d0701] border-2 border-[#f59e0b] text-[#fde047] shadow-[0_0_18px_rgba(245,158,11,0.5)] scale-[1.03] z-10'
                  : 'bg-[#120d29]/90 border-[#2b2052] text-slate-300 hover:text-white hover:bg-[#1a1438] hover:border-[#4d388f]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  isSelected ? 'text-[#f59e0b]' : 'text-slate-400'
                }`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
