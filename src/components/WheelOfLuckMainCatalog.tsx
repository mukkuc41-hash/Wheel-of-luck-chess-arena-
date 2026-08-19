import React, { useState } from 'react';
import {
  X,
  Trophy,
  BarChart2,
  Users,
  Dices,
  Grid,
  Edit3,
  Flame,
  Sparkles,
  Play,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { ActiveBoardGame } from '../types';

export interface GameCatalogItem {
  id: ActiveBoardGame;
  num: number;
  name: string;
  category: 'board_dice' | 'classic_grid' | 'pen_paper' | 'card_games';
  categoryLabel: string;
  maxPlayers: number;
  subtitle: string;
  description: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  buttonGradient: string;
  cardBorder: string;
}

export const GAME_CATALOG_DATA: GameCatalogItem[] = [
  {
    id: 'chess',
    num: 1,
    name: 'Chess',
    category: 'board_dice',
    categoryLabel: 'BOARD & DICE 👑',
    maxPlayers: 2,
    subtitle: '8x8 Strategic Battle',
    description: 'Standard 8x8 strategic battle with kings, queens, knights, and live engine evaluation.',
    icon: '♟️',
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    buttonGradient: 'from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black',
    cardBorder: 'hover:border-amber-400/50 hover:shadow-amber-950/40',
  },
  {
    id: 'checkers',
    num: 2,
    name: 'Draughts (Checkers)',
    category: 'board_dice',
    categoryLabel: 'BOARD & DICE 🔴',
    maxPlayers: 2,
    subtitle: 'Diagonal Jump Strategy',
    description: 'Diagonal movement, mandatory captures, multi-jumps, and King promotions.',
    icon: '⚪',
    badgeBg: 'bg-red-500/20 border-red-400/40',
    badgeText: 'text-red-300',
    buttonGradient: 'from-red-600 via-rose-600 to-red-700 text-white font-bold',
    cardBorder: 'hover:border-red-400/50 hover:shadow-red-950/40',
  },
  {
    id: 'backgammon',
    num: 3,
    name: 'Backgammon',
    category: 'board_dice',
    categoryLabel: 'BOARD & DICE 🎲',
    maxPlayers: 2,
    subtitle: '24-Point Board Race',
    description: 'Race your checkers across 24 points, hit blots to the bar, and bear off to win.',
    icon: '🎲',
    badgeBg: 'bg-indigo-500/20 border-indigo-400/40',
    badgeText: 'text-indigo-300',
    buttonGradient: 'from-indigo-600 via-purple-600 to-indigo-700 text-white font-bold',
    cardBorder: 'hover:border-indigo-400/50 hover:shadow-indigo-950/40',
  },
  {
    id: 'ludo',
    num: 4,
    name: 'Ludo',
    category: 'board_dice',
    categoryLabel: 'BOARD & DICE 🎯',
    maxPlayers: 4,
    subtitle: '4-Token Track Race',
    description: 'Roll 6 to exit yard, circle clockwise, capture tokens, and enter central Home.',
    icon: '🎲',
    badgeBg: 'bg-blue-500/20 border-blue-400/40',
    badgeText: 'text-blue-300',
    buttonGradient: 'from-blue-600 via-cyan-600 to-blue-700 text-white font-bold',
    cardBorder: 'hover:border-blue-400/50 hover:shadow-blue-950/40',
  },
  {
    id: 'snakes',
    num: 5,
    name: 'Snakes & Ladders',
    category: 'board_dice',
    categoryLabel: 'BOARD & DICE 🪜',
    maxPlayers: 4,
    subtitle: '100-Square Board',
    description: 'Climb ladders, slide down snakes, and land exact rolls to reach square 100.',
    icon: '🐍',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40',
    badgeText: 'text-emerald-300',
    buttonGradient: 'from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold',
    cardBorder: 'hover:border-emerald-400/50 hover:shadow-emerald-950/40',
  },
  {
    id: 'gomoku',
    num: 6,
    name: 'Gomoku (Five in a Row)',
    category: 'classic_grid',
    categoryLabel: 'CLASSIC GRID 🟠',
    maxPlayers: 2,
    subtitle: '15x15 Intersection Grid',
    description: 'Place black & white stones on intersections. Align 5 unbroken stones to win.',
    icon: '⚫',
    badgeBg: 'bg-orange-500/20 border-orange-400/40',
    badgeText: 'text-orange-300',
    buttonGradient: 'from-orange-500 via-amber-600 to-orange-700 text-white font-bold',
    cardBorder: 'hover:border-orange-400/50 hover:shadow-orange-950/40',
  },
  {
    id: 'reversi',
    num: 7,
    name: 'Reversi (Othello)',
    category: 'classic_grid',
    categoryLabel: 'CLASSIC GRID ☯️',
    maxPlayers: 2,
    subtitle: '8x8 Outflank & Flip',
    description: 'Outflank opponent pieces in straight lines to flip them. Player with most pieces wins!',
    icon: '☯️',
    badgeBg: 'bg-teal-500/20 border-teal-400/40',
    badgeText: 'text-teal-300',
    buttonGradient: 'from-teal-600 via-emerald-600 to-teal-700 text-white font-bold',
    cardBorder: 'hover:border-teal-400/50 hover:shadow-teal-950/40',
  },
  {
    id: 'connect4',
    num: 8,
    name: 'Connect Four',
    category: 'classic_grid',
    categoryLabel: 'CLASSIC GRID 🟡',
    maxPlayers: 2,
    subtitle: '7x6 Vertical Gravity Grid',
    description: 'Drop discs into columns. Align 4 discs horizontally, vertically, or diagonally.',
    icon: '🟡',
    badgeBg: 'bg-blue-500/20 border-blue-400/40',
    badgeText: 'text-blue-300',
    buttonGradient: 'from-blue-600 via-indigo-600 to-blue-700 text-white font-bold',
    cardBorder: 'hover:border-blue-400/50 hover:shadow-blue-950/40',
  },
  {
    id: 'ultimatetictactoe',
    num: 9,
    name: 'Ultimate Tic-Tac-Toe',
    category: 'pen_paper',
    categoryLabel: 'PEN & PAPER ❌',
    maxPlayers: 2,
    subtitle: '3x3 Grid of 3x3 Boards',
    description: 'Cell choice dictates opponent board location. Claim 3 mini-boards in a row to win!',
    icon: '❌',
    badgeBg: 'bg-purple-500/20 border-purple-400/40',
    badgeText: 'text-purple-300',
    buttonGradient: 'from-purple-600 via-indigo-600 to-purple-700 text-white font-bold',
    cardBorder: 'hover:border-purple-400/50 hover:shadow-purple-950/40',
  },
  {
    id: 'dotsandboxes',
    num: 10,
    name: 'Dots and Boxes',
    category: 'pen_paper',
    categoryLabel: 'PEN & PAPER 📦',
    maxPlayers: 2,
    subtitle: 'Dot Grid Territory Control',
    description: 'Draw lines between dots. Complete 4th side to claim boxes and score extra turns!',
    icon: '📦',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40',
    badgeText: 'text-emerald-300',
    buttonGradient: 'from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold',
    cardBorder: 'hover:border-emerald-400/50 hover:shadow-emerald-950/40',
  },
  {
    id: 'battleship',
    num: 11,
    name: 'Battleship',
    category: 'pen_paper',
    categoryLabel: 'PEN & PAPER 🚢',
    maxPlayers: 2,
    subtitle: '10x10 Naval Grid Warfare',
    description: 'Place 5 ships, call coordinate shots, mark Hits/Misses, and sink enemy fleet.',
    icon: '🚢',
    badgeBg: 'bg-cyan-500/20 border-cyan-400/40',
    badgeText: 'text-cyan-300',
    buttonGradient: 'from-cyan-600 via-blue-600 to-cyan-700 text-white font-bold',
    cardBorder: 'hover:border-cyan-400/50 hover:shadow-cyan-950/40',
  },
  {
    id: 'sim',
    num: 12,
    name: 'Sim (Triangle Game)',
    category: 'pen_paper',
    categoryLabel: 'PEN & PAPER 🔺',
    maxPlayers: 2,
    subtitle: '6-Vertex Graph Theory',
    description: 'Draw colored edges between 6 vertices. Misère rule: AVOID forming a same-color triangle!',
    icon: '🔺',
    badgeBg: 'bg-fuchsia-500/20 border-fuchsia-400/40',
    badgeText: 'text-fuchsia-300',
    buttonGradient: 'from-fuchsia-600 via-purple-600 to-fuchsia-700 text-white font-bold',
    cardBorder: 'hover:border-fuchsia-400/50 hover:shadow-fuchsia-950/40',
  },
  {
    id: 'uno',
    num: 13,
    name: 'Uno (Crazy Eights)',
    category: 'card_games',
    categoryLabel: 'CARD GAMES 🔥',
    maxPlayers: 10,
    subtitle: 'Color & Rank Card Matching',
    description: 'Match color or number, play Action Cards (+2, +4, Skip), and call UNO to clear hand!',
    icon: '🃏',
    badgeBg: 'bg-red-500/20 border-red-400/40',
    badgeText: 'text-red-300',
    buttonGradient: 'from-red-600 via-rose-600 to-red-700 text-white font-bold',
    cardBorder: 'hover:border-red-400/50 hover:shadow-red-950/40',
  },
  {
    id: 'hearts',
    num: 14,
    name: 'Hearts',
    category: 'card_games',
    categoryLabel: 'CARD GAMES ♥️',
    maxPlayers: 4,
    subtitle: '4-Player Trick Taking',
    description: 'Follow suit, avoid penalty points (Hearts = 1, Queen of Spades = 13). Shoot the Moon to win!',
    icon: '♥️',
    badgeBg: 'bg-pink-500/20 border-pink-400/40',
    badgeText: 'text-pink-300',
    buttonGradient: 'from-pink-600 via-rose-600 to-pink-700 text-white font-bold',
    cardBorder: 'hover:border-pink-400/50 hover:shadow-pink-950/40',
  },
  {
    id: 'ginrummy',
    num: 15,
    name: 'Gin Rummy',
    category: 'card_games',
    categoryLabel: 'CARD GAMES 🎴',
    maxPlayers: 2,
    subtitle: 'Meld Building Strategy',
    description: 'Draw, form Sets & Runs, reduce deadwood, and Knock or call GIN for 25-point bonuses!',
    icon: '🎴',
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    buttonGradient: 'from-amber-600 via-yellow-600 to-amber-700 text-white font-bold',
    cardBorder: 'hover:border-amber-400/50 hover:shadow-amber-950/40',
  },
  {
    id: 'speed',
    num: 16,
    name: 'Speed (Spit)',
    category: 'card_games',
    categoryLabel: 'CARD GAMES ⚡',
    maxPlayers: 2,
    subtitle: 'Simultaneous Fast Matching',
    description: 'Play cards ±1 rank away on dual active piles simultaneously. First to empty hand wins!',
    icon: '⚡',
    badgeBg: 'bg-yellow-500/20 border-yellow-400/40',
    badgeText: 'text-yellow-300',
    buttonGradient: 'from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black',
    cardBorder: 'hover:border-yellow-400/50 hover:shadow-yellow-950/40',
  },
  {
    id: 'findthenumber',
    num: 17,
    name: 'Find the Number',
    category: 'pen_paper',
    categoryLabel: 'SPEED CHALLENGE 🖐️',
    maxPlayers: 2,
    subtitle: 'Hand Speed & Cross Grid',
    description: 'Locate scattered numbers across the hand diagram, circle the target, and sprint-tap the 25-cell cross grid!',
    icon: '🖐️',
    badgeBg: 'bg-cyan-500/20 border-cyan-400/40',
    badgeText: 'text-cyan-300',
    buttonGradient: 'from-cyan-500 via-sky-500 to-cyan-600 text-slate-950 font-black',
    cardBorder: 'hover:border-cyan-400/50 hover:shadow-cyan-950/40',
  },
  {
    id: 'carrom',
    num: 18,
    name: 'Carrom Board Arena',
    category: 'board_dice',
    categoryLabel: 'BOARD & PHYSICS 🥏',
    maxPlayers: 2,
    subtitle: 'Striker Physics & Pocketing',
    description: 'Classic Points, Freestyle & Disc Pool modes. Slide striker on baseline, pull to aim, and pocket the White, Black & Red Queen pieces!',
    icon: '🥏',
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    buttonGradient: 'from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black',
    cardBorder: 'hover:border-amber-400/50 hover:shadow-amber-950/40',
  },
];

interface WheelOfLuckMainCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGameToLobby: (game: GameCatalogItem) => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
}

export const WheelOfLuckMainCatalog: React.FC<WheelOfLuckMainCatalogProps> = ({
  isOpen,
  onClose,
  onSelectGameToLobby,
  onOpenLeaderboard,
  onOpenStats,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'board_dice' | 'classic_grid' | 'pen_paper' | 'card_games'>('all');

  if (!isOpen) return null;

  const filteredGames = GAME_CATALOG_DATA.filter((game) => {
    if (activeCategoryFilter === 'all') return true;
    return game.category === activeCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl w-full max-w-5xl shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-purple-950/70 border-b border-amber-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shadow-inner">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-tight font-serif uppercase">
                  Full 16-Game Catalog
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  12 PLAYERS ONLINE
                </span>
              </div>
              <p className="text-xs text-amber-100/70">
                Organized into Board &amp; Dice, Classic Grid, Pen &amp; Paper, and Card Games.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenStats();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Stats</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-4 py-3 bg-slate-900/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <span>All 16 Games</span>
          </button>
          <button
            onClick={() => setActiveCategoryFilter('board_dice')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'board_dice'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>1. Board &amp; Dice</span>
          </button>
          <button
            onClick={() => setActiveCategoryFilter('classic_grid')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'classic_grid'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2. Classic Grid</span>
          </button>
          <button
            onClick={() => setActiveCategoryFilter('pen_paper')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'pen_paper'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>3. Pen &amp; Paper</span>
          </button>
          <button
            onClick={() => setActiveCategoryFilter('card_games')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'card_games'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>4. Card Games</span>
          </button>
        </div>

        {/* 16 Games Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${game.cardBorder}`}
            >
              <div>
                {/* Top Header Row in Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition duration-300">
                      {game.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition">
                          {game.num}. {game.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-amber-200/80 font-mono">{game.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-extrabold ${game.badgeBg} ${game.badgeText}`}>
                      {game.categoryLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[10px] font-mono font-bold text-gray-300 flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400" />
                      {game.maxPlayers} Players
                    </span>
                  </div>
                </div>

                {/* Core Description */}
                <p className="text-xs text-gray-300/90 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              {/* Action Play Button */}
              <button
                onClick={() => {
                  onClose();
                  onSelectGameToLobby(game);
                }}
                className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r ${game.buttonGradient} shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider group/btn active:scale-98`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play {game.name} &gt;</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer Ticker Bar */}
        <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-purple-950/80 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-200/90 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              <strong>Wheel of Luck Game Teleportation</strong> spins between queued players and instantly teleports you into selected match rooms!
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Randomized Pair Matchmaking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
