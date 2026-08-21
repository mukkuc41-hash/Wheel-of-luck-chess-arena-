import React, { useState } from 'react';
import {
  Gamepad2,
  Dices,
  Swords,
  Bot,
  Users,
  Brain,
  Sparkles,
  Trophy,
  Play,
  X,
  Flame,
  Zap,
  ChevronRight,
  BarChart3,
  Grid,
  Layers,
  Heart,
  Target,
} from 'lucide-react';
import { GameMode, ActiveBoardGame } from '../types';

interface MultiGameHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectGame?: (game: ActiveBoardGame) => void;
  onOpenWheelLobby?: () => void;
  onOpenMatchmaking: () => void;
  onOpenPuzzles: () => void;
  onOpenAskGemini: () => void;
  onOpenPositionEditor: () => void;
  onOpenCustomSandbox?: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  activeLobbyCount?: number;
}

export const MultiGameHubModal: React.FC<MultiGameHubModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onSelectGame,
  onOpenWheelLobby,
  onOpenMatchmaking,
  onOpenPuzzles,
  onOpenAskGemini,
  onOpenPositionEditor,
  onOpenCustomSandbox,
  onOpenLeaderboard,
  onOpenStats,
  activeLobbyCount = 8,
}) => {
  const [filter, setFilter] = useState<'all' | 'board' | 'grid' | 'penpaper' | 'cards'>('all');

  if (!isOpen) return null;

  const games: {
    id: string;
    category: 'board' | 'grid' | 'penpaper' | 'cards';
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    badgeColor: string;
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
    actionText: string;
    actionIcon: React.ReactNode;
    actionBg: string;
    gameId?: ActiveBoardGame;
    onClick: () => void;
  }[] = [
    // CATEGORY 1: BOARD & DICE GAMES
    {
      id: 'chess-main',
      category: 'board',
      title: '1. Chess',
      subtitle: '8x8 Strategic Battle',
      description: 'Standard 8x8 strategic battle with kings, queens, knights, and live engine evaluation.',
      badge: 'Board & Dice ♔',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: <span className="text-2xl">♚</span>,
      gradient: 'from-amber-900/40 via-yellow-900/20 to-amber-950/50',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      actionText: 'Play Chess',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-yellow-400',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('chess');
      },
    },
    {
      id: 'checkers-draughts',
      category: 'board',
      title: '2. Draughts (Checkers)',
      subtitle: 'Diagonal Jump Strategy',
      description: 'Diagonal movement, mandatory captures, multi-jumps, and King promotions.',
      badge: 'Board & Dice ⚪',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-400/30',
      icon: <span className="text-2xl">⚪</span>,
      gradient: 'from-red-900/40 via-slate-900/20 to-red-950/50',
      borderColor: 'border-red-500/40 hover:border-red-400',
      actionText: 'Play Draughts',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-red-600 hover:bg-red-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('checkers');
      },
    },
    {
      id: 'backgammon-game',
      category: 'board',
      title: '3. Backgammon',
      subtitle: '24-Point Board Race',
      description: 'Race your checkers across 24 points, hit blots to the bar, and bear off to win.',
      badge: 'Board & Dice 🎲',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      icon: <Dices className="w-6 h-6 text-indigo-400" />,
      gradient: 'from-indigo-900/40 via-purple-900/20 to-indigo-950/50',
      borderColor: 'border-indigo-500/40 hover:border-indigo-400',
      actionText: 'Play Backgammon',
      actionIcon: <Dices className="w-4 h-4" />,
      actionBg: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('backgammon');
      },
    },
    {
      id: 'ludo-classic',
      category: 'board',
      title: '4. Ludo',
      subtitle: '4-Token Track Race',
      description: 'Roll 6 to exit yard, circle clockwise, capture tokens, and enter central Home.',
      badge: 'Board & Dice 🎲',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      icon: <span className="text-2xl">🎲</span>,
      gradient: 'from-blue-900/40 via-purple-900/20 to-blue-950/50',
      borderColor: 'border-blue-500/40 hover:border-blue-400',
      actionText: 'Play Ludo',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-blue-600 hover:bg-blue-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('ludo');
      },
    },
    {
      id: 'snakes-ladders',
      category: 'board',
      title: '5. Snakes & Ladders',
      subtitle: '100-Square Board',
      description: 'Climb ladders, slide down snakes, and land exact rolls to reach square 100.',
      badge: 'Board & Dice 🪜',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: <span className="text-2xl">🐍</span>,
      gradient: 'from-emerald-900/40 via-slate-900/20 to-emerald-950/50',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      actionText: 'Play Snakes & Ladders',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('snakes');
      },
    },

    // CATEGORY 2: CLASSIC GRID GAMES
    {
      id: 'gomoku-game',
      category: 'grid',
      title: '6. Gomoku (Five in a Row)',
      subtitle: '15x15 Intersection Grid',
      description: 'Place black & white stones on intersections. Align 5 unbroken stones to win.',
      badge: 'Classic Grid ⚫',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: <span className="text-2xl">⚫</span>,
      gradient: 'from-amber-900/40 via-slate-900/20 to-amber-950/50',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      actionText: 'Play Gomoku',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('gomoku');
      },
    },
    {
      id: 'reversi-game',
      category: 'grid',
      title: '7. Reversi (Othello)',
      subtitle: '8x8 Outflank & Flip',
      description: 'Outflank opponent pieces in straight lines to flip them. Player with most pieces wins!',
      badge: 'Classic Grid ☯️',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: <span className="text-2xl">☯️</span>,
      gradient: 'from-emerald-900/40 via-slate-900/20 to-emerald-950/50',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      actionText: 'Play Reversi',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('reversi');
      },
    },
    {
      id: 'connect4-game',
      category: 'grid',
      title: '8. Connect Four',
      subtitle: '7x6 Vertical Gravity Grid',
      description: 'Drop discs into columns. Align 4 discs horizontally, vertically, or diagonally.',
      badge: 'Classic Grid 🟡',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      icon: <span className="text-2xl">🟡</span>,
      gradient: 'from-blue-900/40 via-slate-900/20 to-blue-950/50',
      borderColor: 'border-blue-500/40 hover:border-blue-400',
      actionText: 'Play Connect Four',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-blue-600 hover:bg-blue-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('connect4');
      },
    },

    // CATEGORY 3: PEN & PAPER GAMES
    {
      id: 'ultimatetictactoe-game',
      category: 'penpaper',
      title: '9. Ultimate Tic-Tac-Toe',
      subtitle: '3x3 Grid of 3x3 Boards',
      description: 'Cell choice dictates opponent board location. Claim 3 mini-boards in a row to win!',
      badge: 'Pen & Paper ❌',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      icon: <Grid className="w-6 h-6 text-indigo-400" />,
      gradient: 'from-indigo-900/40 via-purple-900/20 to-indigo-950/50',
      borderColor: 'border-indigo-500/40 hover:border-indigo-400',
      actionText: 'Play Ultimate TTT',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('ultimatetictactoe');
      },
    },
    {
      id: 'dotsandboxes-game',
      category: 'penpaper',
      title: '10. Dots and Boxes',
      subtitle: 'Dot Grid Territory Control',
      description: 'Draw lines between dots. Complete 4th side to claim boxes and score extra turns!',
      badge: 'Pen & Paper 📦',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: <span className="text-2xl">📦</span>,
      gradient: 'from-emerald-900/40 via-slate-900/20 to-emerald-950/50',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      actionText: 'Play Dots & Boxes',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('dotsandboxes');
      },
    },
    {
      id: 'battleship-game',
      category: 'penpaper',
      title: '11. Battleship',
      subtitle: '10x10 Naval Grid Warfare',
      description: 'Place 5 ships, call coordinate shots, mark Hits/Misses, and sink enemy fleet.',
      badge: 'Pen & Paper 🚢',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      icon: <span className="text-2xl">🚢</span>,
      gradient: 'from-cyan-900/40 via-slate-900/20 to-cyan-950/50',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      actionText: 'Play Battleship',
      actionIcon: <Target className="w-4 h-4" />,
      actionBg: 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('battleship');
      },
    },
    {
      id: 'sim-game',
      category: 'penpaper',
      title: '12. Sim (Triangle Game)',
      subtitle: '6-Vertex Graph Theory',
      description: 'Draw colored edges between 6 vertices. Misère rule: AVOID forming a same-color triangle!',
      badge: 'Pen & Paper 🔺',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      icon: <span className="text-2xl">🔺</span>,
      gradient: 'from-purple-900/40 via-slate-900/20 to-purple-950/50',
      borderColor: 'border-purple-500/40 hover:border-purple-400',
      actionText: 'Play Sim Game',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-purple-600 hover:bg-purple-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('sim');
      },
    },

    // CATEGORY 4: CARD GAMES
    {
      id: 'uno-game',
      category: 'cards',
      title: '13. Uno (Crazy Eights)',
      subtitle: 'Color & Rank Card Matching',
      description: 'Match color or number, play Action Cards (+2, +4, Skip), and call UNO to clear hand!',
      badge: 'Card Games 🔥',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-400/30',
      icon: <span className="text-2xl">🔥</span>,
      gradient: 'from-red-900/40 via-amber-900/20 to-red-950/50',
      borderColor: 'border-red-500/40 hover:border-red-400',
      actionText: 'Play Uno',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-red-600 hover:bg-red-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('uno');
      },
    },
    {
      id: 'hearts-game',
      category: 'cards',
      title: '14. Hearts',
      subtitle: '4-Player Trick Taking',
      description: 'Follow suit, avoid penalty points (Hearts = 1, Queen of Spades = 13). Shoot the Moon to win!',
      badge: 'Card Games ♥',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
      icon: <Heart className="w-6 h-6 text-pink-400" />,
      gradient: 'from-pink-900/40 via-slate-900/20 to-pink-950/50',
      borderColor: 'border-pink-500/40 hover:border-pink-400',
      actionText: 'Play Hearts',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-pink-600 hover:bg-pink-500 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('hearts');
      },
    },
    {
      id: 'ginrummy-game',
      category: 'cards',
      title: '15. Gin Rummy',
      subtitle: 'Meld Building Strategy',
      description: 'Draw, form Sets & Runs, reduce deadwood, and Knock or call GIN for 25-point bonuses!',
      badge: 'Card Games 🃏',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: <span className="text-2xl">🃏</span>,
      gradient: 'from-amber-900/40 via-yellow-900/20 to-amber-950/50',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      actionText: 'Play Gin Rummy',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('ginrummy');
      },
    },
    {
      id: 'speed-game',
      category: 'cards',
      title: '16. Speed (Spit)',
      subtitle: 'Simultaneous Fast Matching',
      description: 'Play cards ±1 rank away on dual active piles simultaneously. First to empty hand wins!',
      badge: 'Card Games ⚡',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      icon: <span className="text-2xl">⚡</span>,
      gradient: 'from-yellow-900/40 via-amber-900/20 to-yellow-950/50',
      borderColor: 'border-yellow-500/40 hover:border-yellow-400',
      actionText: 'Play Speed',
      actionIcon: <Zap className="w-4 h-4 fill-current" />,
      actionBg: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('speed');
      },
    },
    {
      id: 'carrom-board',
      category: 'board',
      title: '17. Carrom Board Arena',
      subtitle: 'Striker Physics & Pocketing Arena',
      description: 'Classic Points, Freestyle & Disc Pool modes. Slide the striker, pull to aim, and pocket the White, Black & Red Queen pieces!',
      badge: 'Board & Physics 🥏',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: <span className="text-2xl">🥏</span>,
      gradient: 'from-amber-950/50 via-yellow-950/30 to-slate-950/60',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      actionText: 'Play Carrom Board',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('carrom');
      },
    },
    {
      id: 'darts-champ',
      category: 'board',
      title: '18. Darts Championship',
      subtitle: 'Official London Board & 501',
      description: 'Precision target aiming and scoring rings. 501 / 301 Countdown, Around the Clock & High Score Blitz with breathing sway physics, triple/double multipliers and AI bot!',
      badge: 'Sports & Precision 🎯',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-400/30',
      icon: <span className="text-2xl">🎯</span>,
      gradient: 'from-red-950/50 via-amber-950/30 to-slate-950/60',
      borderColor: 'border-red-500/40 hover:border-red-400',
      actionText: 'Play Darts',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('darts');
      },
    },
    {
      id: 'pingpong-classic',
      category: 'board',
      title: '19. Ping Pong Classic',
      subtitle: 'Fast-Paced Paddle Rally Arena',
      description: 'Fast-paced table tennis rally with ball physics, paddle slice curves, smash power mechanics, rally streak tracking, and AI opponent!',
      badge: 'Sports & Precision 🏓',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: <span className="text-2xl">🏓</span>,
      gradient: 'from-emerald-950/50 via-cyan-950/30 to-slate-950/60',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      actionText: 'Play Ping Pong',
      actionIcon: <Play className="w-4 h-4 fill-current" />,
      actionBg: 'bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold',
      onClick: () => {
        onClose();
        if (onSelectGame) onSelectGame('pingpong');
      },
    },
  ];

  const filteredGames = games.filter((game) => {
    if (filter === 'all') return true;
    return game.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0e0c12] border border-[#f3ce6b]/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-white">
        
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/50">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black font-serif tracking-wide text-[#ffe89e]">
                  Full 15-Game Catalog
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {activeLobbyCount} Players Online
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Organized into Board &amp; Dice, Classic Grid, Pen &amp; Paper, and Card Games.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition border border-white/10"
            title="Close Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-6 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'all'
                  ? 'bg-[#f3ce6b] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(243,206,107,0.4)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              All 15 Games
            </button>
            <button
              onClick={() => setFilter('board')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'board'
                  ? 'bg-[#f3ce6b] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(243,206,107,0.4)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              1. Board &amp; Dice
            </button>
            <button
              onClick={() => setFilter('grid')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'grid'
                  ? 'bg-[#f3ce6b] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(243,206,107,0.4)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              2. Classic Grid
            </button>
            <button
              onClick={() => setFilter('penpaper')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'penpaper'
                  ? 'bg-[#f3ce6b] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(243,206,107,0.4)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              3. Pen &amp; Paper
            </button>
            <button
              onClick={() => setFilter('cards')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === 'cards'
                  ? 'bg-[#f3ce6b] text-slate-950 font-extrabold shadow-[0_0_12px_rgba(243,206,107,0.4)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              4. Card Games
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCustomSandbox && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomSandbox();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold transition"
                title="Open Custom Chess Variant Sandbox"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chess Sandbox</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenStats();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stats</span>
            </button>
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b ${game.gradient} border ${game.borderColor} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl backdrop-blur-md`}
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 group-hover:scale-105 transition">
                    {game.icon}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${game.badgeColor}`}
                  >
                    {game.badge}
                  </span>
                </div>

                {/* Card Title & Description */}
                <h3 className="text-lg font-bold text-white font-serif tracking-wide group-hover:text-[#ffe89e] transition">
                  {game.title}
                </h3>
                <p className="text-xs text-amber-300/80 font-semibold mb-2">
                  {game.subtitle}
                </p>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={game.onClick}
                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 ${game.actionBg}`}
              >
                {game.actionIcon}
                <span>{game.actionText}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Banner */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              <strong>Wheel of Luck Catalog &amp; Matchmaking</strong> randomly spins among connected players for all 16 games!
            </span>
          </div>
          {onOpenWheelLobby ? (
            <button
              onClick={() => {
                onClose();
                onOpenWheelLobby();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-yellow-400 transition"
            >
              <span>🎰 Open Wheel Lobby</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenMatchmaking();
              }}
              className="flex items-center gap-1 text-[#f3ce6b] hover:underline font-bold"
            >
              <span>Play Online PvP Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
