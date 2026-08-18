import React, { useState } from 'react';
import { Bot, Sparkles, Brain, Lightbulb, ShieldAlert, Award, ChevronRight, Zap } from 'lucide-react';
import { ActiveBoardGame } from '../types';

interface CoachPanelProps {
  activeGame: ActiveBoardGame;
  gameTitle: string;
  moveHistory?: string[];
  isAIActive?: boolean;
}

interface CoachPersonality {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  description: string;
}

const COACHES: CoachPersonality[] = [
  {
    id: 'grandmaster',
    name: 'GM Mikhail',
    role: 'Tactical Grandmaster',
    avatarBg: 'from-amber-500 to-red-600',
    description: 'Focuses on sharp tactical blunders, calculated sacrifices, and aggressive spatial control.',
  },
  {
    id: 'mentor',
    name: 'Coach Sarah',
    role: 'Patient Mentor',
    avatarBg: 'from-emerald-500 to-teal-600',
    description: 'Explains foundational principles, piece safety, defensive structure, and endgame patience.',
  },
  {
    id: 'analyst',
    name: 'Deep Engine V4',
    role: 'Deep Neural Engine',
    avatarBg: 'from-indigo-500 to-purple-600',
    description: 'Provides exact numerical evaluation shifts, win probabilities, and deep search trees.',
  },
];

export const CoachPanel: React.FC<CoachPanelProps> = ({
  activeGame,
  gameTitle,
  moveHistory = [],
}) => {
  const [selectedCoach, setSelectedCoach] = useState<CoachPersonality>(COACHES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastHint, setLastHint] = useState<string | null>(null);
  const [evalScore, setEvalScore] = useState<string>('+0.4');

  const generateHint = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const hints = [
        `[${selectedCoach.name}]: Control the center squares and maintain pawn structure stability before starting a wing attack.`,
        `[${selectedCoach.name}]: Look out for tactical forks! Ensure your major pieces are protected on adjacent files.`,
        `[${selectedCoach.name}]: Solid position (+0.6 advantage). Consider developing your remaining knight to increase pressure.`,
        `[${selectedCoach.name}]: Watch out for back-rank vulnerability. Consider making luft or moving your king closer to safety.`,
      ];
      const random = hints[Math.floor(Math.random() * hints.length)];
      setLastHint(random);
      setEvalScore((Math.random() * 2 - 0.5).toFixed(1));
    }, 1000);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-400/40">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Strategy Coach &amp; Analyzer</h3>
            <p className="text-[11px] text-indigo-200/60">Live position feedback &amp; tactical advice</p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-300 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400 fill-current" />
          <span>Eval: {evalScore}</span>
        </div>
      </div>

      {/* Select Coach Personality */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/70 block">
          Select AI Coach Persona
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COACHES.map((coach) => {
            const isSelected = selectedCoach.id === coach.id;
            return (
              <button
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                className={`p-2 rounded-xl border text-left transition flex flex-col items-center text-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${coach.avatarBg} flex items-center justify-center font-bold text-[11px] text-white shadow-md`}
                >
                  {coach.name[0]}
                </div>
                <div>
                  <div className="text-[10px] font-bold truncate max-w-[80px]">{coach.name}</div>
                  <div className="text-[9px] text-indigo-200/60 truncate max-w-[80px]">{coach.role}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint Output Box */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs min-h-[64px] flex items-center justify-center relative">
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-indigo-300 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>Evaluating board position with {selectedCoach.name}...</span>
          </div>
        ) : lastHint ? (
          <div className="text-indigo-100 font-medium leading-relaxed flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{lastHint}</span>
          </div>
        ) : (
          <span className="text-white/40 italic">
            Click "Get Tactical Hint" for immediate advice on the current board state.
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={generateHint}
        disabled={isAnalyzing}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 border border-indigo-400/40 disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Request Tactical Hint</span>
      </button>
    </div>
  );
};
