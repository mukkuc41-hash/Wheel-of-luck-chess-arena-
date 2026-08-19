import React, { useState } from 'react';
import { Sparkles, Bot, X, Send, Target, ShieldAlert, Award, Loader2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ActiveBoardGame } from '../types';

interface AskGeminiModalProps {
  activeBoardGame?: ActiveBoardGame;
  isOpen: boolean;
  onClose: () => void;
  fen?: string;
  pgn?: string;
  turn?: 'w' | 'b' | string;
  legalMoves?: string[];
}

const GAME_AI_CONFIGS: Record<
  ActiveBoardGame,
  {
    title: string;
    badge: string;
    presets: { label: string; query: string; icon: React.ReactNode }[];
  }
> = {
  chess: {
    title: 'Chess Pro AI',
    badge: 'Chess Grandmaster',
    presets: [
      { label: 'Best Move?', query: 'What is the best move in this position and why?', icon: <Target className="w-3.5 h-3.5 text-indigo-400" /> },
      { label: 'Position Evaluation', query: 'Provide an evaluation of who is winning and why.', icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
      { label: 'Tactical Threats', query: 'Are there any tactical threats or traps to watch out for?', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  checkers: {
    title: 'Draughts Arena AI',
    badge: 'Draughts Master',
    presets: [
      { label: 'Forced Jump Paths', query: 'Analyze forced capture sequences and double-jump opportunities.', icon: <Target className="w-3.5 h-3.5 text-red-400" /> },
      { label: 'King Infiltration', query: 'How can I push checkers to the back rank to crown a King?', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
      { label: 'Defense & Traps', query: 'What traps or openings exist in this Draughts layout?', icon: <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> },
    ],
  },
  backgammon: {
    title: 'Backgammon Club AI',
    badge: 'Backgammon Strategist',
    presets: [
      { label: 'Pip Count & Bearing Off', query: 'Calculate pip count and advise on bearing off vs building points.', icon: <Target className="w-3.5 h-3.5 text-purple-400" /> },
      { label: 'Prime Wall Building', query: 'How do I construct a 6-point prime to block opponent checkers?', icon: <Award className="w-3.5 h-3.5 text-emerald-400" /> },
      { label: 'Hit & Run Tactics', query: 'Should I hit opponent single checkers on the bar now?', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  snakes: {
    title: 'Snakes & Ladders AI',
    badge: 'Probability Engine',
    presets: [
      { label: 'Ladder Rush Odds', query: 'What is the probability of hitting upcoming ladders in 2 rolls?', icon: <Target className="w-3.5 h-3.5 text-emerald-400" /> },
      { label: 'Snake Risk Analysis', query: 'Identify dangerous tile clusters with high snake slide risks.', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> },
      { label: 'Winning Strategy', query: 'What is the mathematical expectation to reach tile 100 first?', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  ludo: {
    title: 'Ludo Master AI',
    badge: 'Ludo Tactician',
    presets: [
      { label: 'Yard Release Timing', query: 'Should I release new tokens from Yard or advance active ones?', icon: <Target className="w-3.5 h-3.5 text-blue-400" /> },
      { label: 'Blockade & Safe Squares', query: 'How can I create double token blockades on safe star squares?', icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
      { label: 'Capture & Home Stretch', query: 'How do I capture opponent tokens while guarding my Home corridor?', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  gomoku: {
    title: 'Gomoku AI Advisor',
    badge: 'Five-in-a-Row Master',
    presets: [
      { label: 'Open Four Threat', query: 'Where is the best move to create an unstoppable Open Four?', icon: <Target className="w-3.5 h-3.5 text-amber-400" /> },
      { label: 'Defense Check', query: 'Are there any opponent three-in-a-row lines that require immediate block?', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> },
    ],
  },
  reversi: {
    title: 'Reversi AI Strategist',
    badge: 'Othello Master',
    presets: [
      { label: 'Corner Capture', query: 'How can I secure corners and stable discs on the perimeter?', icon: <Award className="w-3.5 h-3.5 text-emerald-400" /> },
      { label: 'Mobility Control', query: 'What move minimizes my opponent options for next turns?', icon: <Target className="w-3.5 h-3.5 text-indigo-400" /> },
    ],
  },
  connect4: {
    title: 'Connect Four AI',
    badge: 'Gravity Tactician',
    presets: [
      { label: '7-Column Trap', query: 'Which column gives the highest probability of creating a double threat?', icon: <Target className="w-3.5 h-3.5 text-blue-400" /> },
      { label: 'Block Opponent Line', query: 'How do I block opponent 3-in-a-row connections?', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  ultimatetictactoe: {
    title: 'Ultimate TTT AI',
    badge: 'Grid Analyst',
    presets: [
      { label: 'Mini-Board Routing', query: 'Which mini-board cell choice forces my opponent into a weak board?', icon: <Target className="w-3.5 h-3.5 text-indigo-400" /> },
      { label: 'Main Board Win', query: 'What sequence claims 3 mini-boards in a row fastest?', icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
    ],
  },
  dotsandboxes: {
    title: 'Dots & Boxes AI',
    badge: 'Territory Master',
    presets: [
      { label: 'Long Chain Sacrifice', query: 'How do I manage double-cross sacrifices to win long chains?', icon: <Target className="w-3.5 h-3.5 text-emerald-400" /> },
      { label: 'Safe Line Choice', query: 'Which line can I draw without giving my opponent a 3-sided box?', icon: <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> },
    ],
  },
  battleship: {
    title: 'Battleship Radar AI',
    badge: 'Naval Commander',
    presets: [
      { label: 'Targeting Probability', query: 'Where is the highest probability coordinate to hit remaining ships?', icon: <Target className="w-3.5 h-3.5 text-cyan-400" /> },
      { label: 'Sinking Strategy', query: 'How should I follow up on recent hits to sink the ship completely?', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  sim: {
    title: 'Sim Game AI',
    badge: 'Graph Theory Expert',
    presets: [
      { label: 'Safe Edge Draw', query: 'Which edge can I draw without completing a same-color triangle?', icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> },
      { label: 'Misère Trap', query: 'How can I force my opponent to complete a triangle on their turn?', icon: <Target className="w-3.5 h-3.5 text-pink-400" /> },
    ],
  },
  uno: {
    title: 'Uno Card AI',
    badge: 'Deck Master',
    presets: [
      { label: 'Wild Card Timing', query: 'When is the best moment to play Wild and +4 Action cards?', icon: <Target className="w-3.5 h-3.5 text-red-400" /> },
      { label: 'Hand Clearing', query: 'What color choice maximizes my chance of emptying my hand first?', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
    ],
  },
  hearts: {
    title: 'Hearts Trick AI',
    badge: 'Trick Specialist',
    presets: [
      { label: 'Avoid Penalty Trick', query: 'How can I unload high hearts or Queen of Spades safely?', icon: <ShieldAlert className="w-3.5 h-3.5 text-pink-400" /> },
      { label: 'Shoot the Moon', query: 'Is there a viable path to take ALL 13 hearts and QS this hand?', icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
    ],
  },
  ginrummy: {
    title: 'Gin Rummy AI',
    badge: 'Meld Strategist',
    presets: [
      { label: 'Knock vs GIN', query: 'Should I knock now with deadwood <= 10 or hold out for GIN?', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
      { label: 'Discard Safety', query: 'Which card in my hand is safest to discard without feeding AI melds?', icon: <Target className="w-3.5 h-3.5 text-cyan-400" /> },
    ],
  },
  speed: {
    title: 'Speed Spit AI',
    badge: 'Reflex Analyst',
    presets: [
      { label: 'Fast Matching', query: 'What cards in my hand connect ±1 to active center piles?', icon: <Target className="w-3.5 h-3.5 text-yellow-400" /> },
      { label: 'Stuck Pile Reset', query: 'When should we trigger a dual FLIP reset?', icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> },
    ],
  },
  findthenumber: {
    title: 'Find Number AI',
    badge: 'Scan & Speed Coach',
    presets: [
      { label: 'Scan Technique', query: 'What is the fastest optical strategy to find numbers on the hand?', icon: <Target className="w-3.5 h-3.5 text-cyan-400" /> },
      { label: 'Grid Burst', query: 'How can I sprint-tap all 25 cross grid cells in sub-3 seconds?', icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
    ],
  },
  carrom: {
    title: 'Carrom Physics AI',
    badge: 'Striker Master',
    presets: [
      { label: 'Bank Shot Angles', query: 'How do I calculate cushion bank shots into corner pockets?', icon: <Target className="w-3.5 h-3.5 text-amber-400" /> },
      { label: 'Queen Cover Strategy', query: 'What is the highest percentage method to pocket and cover the Red Queen?', icon: <Sparkles className="w-3.5 h-3.5 text-red-400" /> },
    ],
  },
};

export const AskGeminiModal: React.FC<AskGeminiModalProps> = ({
  activeBoardGame = 'chess',
  isOpen,
  onClose,
  fen,
  pgn,
  turn = 'w',
  legalMoves = [],
}) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const config = GAME_AI_CONFIGS[activeBoardGame] || GAME_AI_CONFIGS.chess;

  const handleAskGemini = async (customPrompt?: string) => {
    const queryText = customPrompt || question;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeGame: activeBoardGame,
          fen,
          pgn,
          question: queryText,
          legalMoves,
          turn,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to get analysis');
      }
    } catch {
      setError('Network error connecting to Gemini API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900/50 via-slate-900 to-purple-900/50 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{config.title}</span>
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono">
                  {config.badge}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Active Game Mode: <span className="text-indigo-300 font-bold capitalize">{activeBoardGame}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Preset Prompts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Game-Tailored AI Queries
            </p>
            <div className="flex flex-wrap gap-2">
              {config.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskGemini(preset.query)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 transition flex items-center gap-1.5"
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Result Output */}
          <div className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-5 min-h-[220px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-indigo-200">
                  Gemini is analyzing {activeBoardGame} board state & tactical strategies...
                </p>
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                {error}
              </div>
            ) : analysis ? (
              <div className="text-sm text-slate-200 space-y-3 leading-relaxed markdown-body">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Bot className="w-10 h-10 text-indigo-400/50" />
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Ready for Gemini {config.title}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click a quick query above or type a custom question below to receive expert insight.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Custom Question Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && question.trim() && handleAskGemini()}
              placeholder={`Ask Gemini anything about ${activeBoardGame}...`}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              disabled={loading}
            />
            <button
              onClick={() => handleAskGemini()}
              disabled={loading || !question.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-bold text-sm transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
