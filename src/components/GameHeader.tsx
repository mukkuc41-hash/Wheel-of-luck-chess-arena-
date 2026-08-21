import React from 'react';
import {
  Settings,
  RotateCw,
  RotateCcw,
  Flag,
  Handshake,
  Volume2,
  VolumeX,
  RefreshCw,
  Swords,
  Bot,
  User,
  Trophy,
  UserCheck,
  Sparkles,
  Play,
  Lightbulb,
  Gamepad2,
  Users,
  Eye,
  Flame,
  BarChart2,
  Cloud,
} from 'lucide-react';
import { GameMode, UserSession, ActiveBoardGame } from '../types';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface GameHeaderProps {
  activeBoardGame: ActiveBoardGame;
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onOpenTelemetry?: () => void;
  onOpenGoogleAuth?: () => void;
  onOpenWheelLobby?: () => void;
  onOpenMatchmaking: () => void;
  onOpenTournament?: () => void;
  onOpenQuests?: () => void;
  onOpenCustomization?: () => void;
  onOpenGameHub?: () => void;
  onOpenSocialHub?: () => void;
  onOpenAskGemini: () => void;
  onOpenCinematicVfx?: () => void;
  onOpenAnimationHub?: () => void;
  onOpenDailyWheel?: () => void;
  onOpenPuzzles?: () => void;
  onOpenPositionEditor?: () => void;
  onOpenCustomSandbox?: () => void;
  onUndoMove?: () => void;
  canUndo?: boolean;
  onResetGame: () => void;
  onFlipBoard: () => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isGameActive: boolean;
  isSpectator?: boolean;
}

const GAME_BRANDING: Record<
  ActiveBoardGame,
  {
    title: string;
    subtitle: string;
    icon: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    accentGlow: string;
    playerSlots: string;
  }
> = {
  chess: {
    title: 'Chess',
    subtitle: 'Pro',
    icon: '♔',
    bgGradient: 'bg-indigo-600',
    borderColor: 'border-indigo-400/30',
    textColor: 'text-indigo-400',
    accentGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]',
    playerSlots: '2 Players',
  },
  checkers: {
    title: 'Draughts',
    subtitle: 'Arena',
    icon: '👑',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-400',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '2 Players',
  },
  backgammon: {
    title: 'Backgammon',
    subtitle: 'Club',
    icon: '🎲',
    bgGradient: 'bg-purple-600',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-400',
    accentGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    playerSlots: '2 Players',
  },
  snakes: {
    title: 'Snakes & Ladders',
    subtitle: 'Classic',
    icon: '🐍',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2-4 Players',
  },
  ludo: {
    title: 'Ludo',
    subtitle: 'Master',
    icon: '🎯',
    bgGradient: 'bg-blue-600',
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-400',
    accentGlow: 'shadow-[0_0_15px_rgba(37,99,235,0.4)]',
    playerSlots: '2-4 Players',
  },
  gomoku: {
    title: 'Gomoku',
    subtitle: '5 in a Row',
    icon: '⚫',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-400',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '2 Players',
  },
  reversi: {
    title: 'Reversi',
    subtitle: 'Othello',
    icon: '☯️',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2 Players',
  },
  connect4: {
    title: 'Connect Four',
    subtitle: 'Grid Match',
    icon: '🟡',
    bgGradient: 'bg-blue-600',
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-400',
    accentGlow: 'shadow-[0_0_15px_rgba(37,99,235,0.4)]',
    playerSlots: '2 Players',
  },
  ultimatetictactoe: {
    title: 'Ultimate TTT',
    subtitle: 'Super Grid',
    icon: '❌',
    bgGradient: 'bg-indigo-600',
    borderColor: 'border-indigo-400/30',
    textColor: 'text-indigo-400',
    accentGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]',
    playerSlots: '2 Players',
  },
  dotsandboxes: {
    title: 'Dots & Boxes',
    subtitle: 'Territory',
    icon: '📦',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2 Players',
  },
  battleship: {
    title: 'Battleship',
    subtitle: 'Naval Grid',
    icon: '🚢',
    bgGradient: 'bg-cyan-600',
    borderColor: 'border-cyan-400/30',
    textColor: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    playerSlots: '2 Players',
  },
  sim: {
    title: 'Sim Game',
    subtitle: 'Triangle Hex',
    icon: '🔺',
    bgGradient: 'bg-purple-600',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-400',
    accentGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    playerSlots: '2 Players',
  },
  uno: {
    title: 'Uno',
    subtitle: 'Card Arena',
    icon: '🔥',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-400',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '2-4 Players',
  },
  hearts: {
    title: 'Hearts',
    subtitle: 'Trick Taking',
    icon: '♥',
    bgGradient: 'bg-pink-600',
    borderColor: 'border-pink-400/30',
    textColor: 'text-pink-400',
    accentGlow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]',
    playerSlots: '4 Players',
  },
  ginrummy: {
    title: 'Gin Rummy',
    subtitle: 'Meld Master',
    icon: '🃏',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-400',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '2 Players',
  },
  speed: {
    title: 'Speed',
    subtitle: 'Spit Cards',
    icon: '⚡',
    bgGradient: 'bg-yellow-500',
    borderColor: 'border-yellow-400/30',
    textColor: 'text-yellow-400',
    accentGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    playerSlots: '2 Players',
  },
  carrom: {
    title: 'Carrom Board',
    subtitle: 'Striker Arena',
    icon: '🥏',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-300',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '1-2 Players',
  },
  darts: {
    title: 'Darts Championship',
    subtitle: 'London 501 Arena',
    icon: '🎯',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-300',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '1-2 Players',
  },
  pingpong: {
    title: 'Ping Pong Classic',
    subtitle: 'Paddle Rally Arena',
    icon: '🏓',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-300',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '1-2 Players',
  },
};

export const GameHeader: React.FC<GameHeaderProps> = ({
  activeBoardGame,
  gameMode,
  onChangeGameMode,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenStats,
  onOpenLeaderboard,
  onOpenTelemetry,
  onOpenGoogleAuth,
  onOpenWheelLobby,
  onOpenMatchmaking,
  onOpenTournament,
  onOpenQuests,
  onOpenCustomization,
  onOpenGameHub,
  onOpenSocialHub,
  onOpenAskGemini,
  onOpenCinematicVfx,
  onOpenAnimationHub,
  onOpenDailyWheel,
  onOpenPuzzles,
  onOpenPositionEditor,
  onOpenCustomSandbox,
  onUndoMove,
  canUndo = false,
  onResetGame,
  onFlipBoard,
  onOfferDraw,
  onResign,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  isGameActive,
  isSpectator = false,
}) => {
  const brand = GAME_BRANDING[activeBoardGame] || GAME_BRANDING.chess;

  return (
    <header className="w-full bg-slate-950/80 border-b border-white/10 px-4 md:px-6 py-3 sticky top-0 z-30 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: Dynamic Brand, User Identity & Gold Play Now */}
        <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 ${brand.bgGradient} rounded-xl flex items-center justify-center text-white font-bold text-lg ${brand.accentGlow} border ${brand.borderColor}`}
            >
              {brand.icon}
            </div>
            <div>
              <h1 className="text-base md:text-lg font-extrabold tracking-tight text-white flex items-center gap-1 leading-tight">
                <span>{brand.title}</span>
                <span className={`${brand.textColor} font-light`}>{brand.subtitle}</span>
              </h1>
              <span className="text-[10px] text-gray-400 font-medium">{brand.playerSlots}</span>
            </div>
          </div>

          {/* User Handle Badge */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition backdrop-blur-md ${
              isSiteOwner(currentUser?.username)
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
            title="User Account & Authentication"
          >
            <UserCheck className={`w-3.5 h-3.5 ${isSiteOwner(currentUser?.username) ? 'text-amber-400' : 'text-indigo-400'}`} />
            <span className={`text-xs font-bold ${isSiteOwner(currentUser?.username) ? 'text-amber-200 font-extrabold' : 'text-white'}`}>
              {currentUser?.username || 'Guest'}
            </span>
            {isSiteOwner(currentUser?.username) ? (
              <OwnerBadge username={currentUser?.username} size="xs" label="OWNER" />
            ) : currentUser?.isGuest ? (
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded-full">
                Guest
              </span>
            ) : null}
          </button>

          {/* Spectator Mode Indicator */}
          {isSpectator && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>SPECTATING LIVE</span>
            </div>
          )}

          {/* Gold Play Now Button */}
          <button
            onClick={onOpenMatchmaking}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/60 transition active:scale-95"
            title={`Start Online PvP Matchmaking for ${brand.title}`}
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Play Now</span>
          </button>

          {/* Tournament Arena Button */}
          {onOpenTournament && (
            <button
              onClick={onOpenTournament}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 font-extrabold text-xs border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition active:scale-95 backdrop-blur-md"
              title="Open Tournaments & Live Brackets"
            >
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Tournaments</span>
            </button>
          )}

          {/* Daily Quests Button */}
          {onOpenQuests && (
            <button
              onClick={onOpenQuests}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-200 font-extrabold text-xs border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition active:scale-95 backdrop-blur-md"
              title="Open Daily Quests & Rank Progression"
            >
              <Flame className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Quests</span>
            </button>
          )}

          {/* Audio & Visual Customization Button */}
          {onOpenCustomization && (
            <button
              onClick={onOpenCustomization}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-200 font-extrabold text-xs border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.25)] transition active:scale-95 backdrop-blur-md"
              title="Customize Board Skins & Soundpacks"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="hidden sm:inline">Themes</span>
            </button>
          )}

          {/* Social & Community Hub Button */}
          {onOpenSocialHub && (
            <button
              onClick={onOpenSocialHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 hover:from-indigo-500/40 hover:to-purple-500/40 text-indigo-200 font-extrabold text-xs border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition active:scale-95 backdrop-blur-md"
              title="Open Social, Quests, Badges & Activity Feed Hub"
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Social Hub</span>
            </button>
          )}

          {/* Integrated Game Hub Button */}
          {onOpenGameHub && (
            <button
              onClick={onOpenGameHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f3ce6b]/20 hover:bg-[#f3ce6b]/30 text-[#ffe89e] font-extrabold text-xs border border-[#f3ce6b]/40 shadow-[0_0_15px_rgba(243,206,107,0.3)] transition active:scale-95 backdrop-blur-md"
              title="Open Multi-Game Hub Arena"
            >
              <Gamepad2 className="w-4 h-4 text-[#f3ce6b]" />
              <span className="hidden sm:inline">Game Hub</span>
            </button>
          )}
        </div>

        {/* Center: Persistent Mode Selector */}
        <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              onChangeGameMode('pvp');
              onOpenMatchmaking();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              gameMode === 'pvp'
                ? `${brand.bgGradient} text-white ${brand.accentGlow}`
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>PvP Online</span>
          </button>

          <button
            onClick={() => onChangeGameMode('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              gameMode === 'ai'
                ? `${brand.bgGradient} text-white ${brand.accentGlow}`
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>VS Computer</span>
          </button>

          <button
            onClick={() => onChangeGameMode('local')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              gameMode === 'local'
                ? `${brand.bgGradient} text-white ${brand.accentGlow}`
                : 'text-white/60 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Right: Tools, Gemini AI, Puzzles, Wheel Lobby, Leaderboard */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Daily Lucky Spin Wheel Button */}
          {onOpenDailyWheel && (
            <button
              onClick={onOpenDailyWheel}
              className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/30 via-yellow-500/25 to-amber-500/30 hover:from-amber-500/45 hover:to-yellow-500/40 text-amber-200 border border-amber-400/60 transition shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md active:scale-95 animate-pulse"
              title="Spin Daily Lucky Wheel (Free 250 - 5,000 PTS every 24 hours)"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>Daily Wheel</span>
            </button>
          )}

          {/* 96-Item Master Customization Hub Menu */}
          {onOpenAnimationHub && (
            <button
              onClick={onOpenAnimationHub}
              className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/40 hover:to-cyan-500/30 text-emerald-200 border border-emerald-400/50 transition shadow-[0_0_20px_rgba(46,204,113,0.35)] backdrop-blur-md active:scale-95"
              title="Open 96-Item Master Customization Hub (Shop, Inventory, Sandbox)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>96 FX Hub</span>
            </button>
          )}

          {/* Cinematic VFX & Animation Engine Button */}
          {onOpenCinematicVfx && (
            <button
              onClick={onOpenCinematicVfx}
              className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-amber-500/20 hover:from-cyan-500/40 hover:to-amber-500/30 text-cyan-200 border border-cyan-400/50 transition shadow-[0_0_20px_rgba(0,242,254,0.35)] backdrop-blur-md active:scale-95"
              title="Open Cinematic VFX Animation Engine & Broadcast Physics Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Cinematic VFX</span>
            </button>
          )}

          {/* Ask Gemini Button */}
          <button
            onClick={onOpenAskGemini}
            className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-500/40 hover:to-indigo-500/40 text-purple-200 border border-purple-400/40 transition shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md"
            title={`Ask Gemini AI for ${brand.title} Strategy & Analysis`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>Ask Gemini</span>
          </button>

          {/* Daily Puzzles Button */}
          {onOpenPuzzles && (
            <button
              onClick={onOpenPuzzles}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition shadow-[0_0_15px_rgba(245,158,11,0.25)] backdrop-blur-md"
              title={`${brand.title} Tactical Puzzles & Daily Quests`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Puzzles</span>
            </button>
          )}

          {/* Import Position Button (Chess specific) */}
          {activeBoardGame === 'chess' && onOpenPositionEditor && (
            <button
              onClick={onOpenPositionEditor}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition backdrop-blur-md"
              title="Import FEN / PGN Position"
            >
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}

          {/* Custom Chess Variant Sandbox Submenu Button (Chess specific) */}
          {activeBoardGame === 'chess' && onOpenCustomSandbox && (
            <button
              onClick={onOpenCustomSandbox}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/50 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md"
              title="Open Custom Chess Variant Sandbox & Saved Variants History"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Sandbox &amp; Variants</span>
            </button>
          )}

          {/* Wheel of Luck Catalog & Lobby Button */}
          {onOpenWheelLobby && (
            <button
              onClick={onOpenWheelLobby}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/60 transition active:scale-95"
              title="Open Wheel of Luck 16-Game Catalog & Matchmaking Lobby"
            >
              <span className="text-sm">🎰</span>
              <span>Wheel of Luck</span>
            </button>
          )}

          {/* Global Telemetry & Analytics Button */}
          {onOpenTelemetry && (
            <button
              onClick={onOpenTelemetry}
              className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 border border-sky-400/50 transition shadow-[0_0_18px_rgba(56,189,248,0.3)] backdrop-blur-md"
              title="Real-Time Global Telemetry, Concurrency Charts & Regional Analytics"
            >
              <BarChart2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span className="hidden sm:inline">Telemetry & Analytics</span>
            </button>
          )}

          {/* Google Account Suite Button */}
          {onOpenGoogleAuth && (
            <button
              onClick={onOpenGoogleAuth}
              className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 text-blue-200 border border-blue-400/50 transition shadow-[0_0_18px_rgba(59,130,246,0.3)] backdrop-blur-md"
              title="Google Account Profile, Cloud Saves, Controllers, Play Badges & OAuth"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="hidden sm:inline">Google Suite</span>
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition shadow-[0_0_15px_rgba(245,158,11,0.25)] backdrop-blur-md"
            title={`${brand.title} Live Leaderboards & Standings`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* User Profile Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 transition shadow-[0_0_12px_rgba(56,189,248,0.2)] backdrop-blur-md"
              title="View User Profile & Stats Breakdown"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentUser?.username && !currentUser.isGuest ? currentUser.username : 'Profile'}</span>
            </button>
          )}

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition backdrop-blur-md"
            title="Statistics & Match History"
          >
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Undo Move Button (when supported) */}
          {onUndoMove && (
            <button
              onClick={onUndoMove}
              disabled={!canUndo}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition border border-white/10 backdrop-blur-md"
              title="Undo Move"
            >
              <RotateCcw className="w-4 h-4 text-indigo-300" />
            </button>
          )}

          {/* Flip Board View */}
          <button
            onClick={onFlipBoard}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/10 backdrop-blur-md"
            title="Flip Board View"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition backdrop-blur-md ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Active Game Draw/Resign Controls */}
          {isGameActive && (
            <>
              <button
                onClick={onOfferDraw}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition backdrop-blur-md"
                title="Offer Draw"
              >
                <Handshake className="w-3.5 h-3.5 text-indigo-300" />
                <span>Draw</span>
              </button>

              <button
                onClick={onResign}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-red-200 border border-white/10 hover:border-red-400/40 transition backdrop-blur-md"
                title="Resign Game"
              >
                <Flag className="w-3.5 h-3.5 text-red-400" />
                <span>Resign</span>
              </button>
            </>
          )}

          {/* Restart / Reset Game */}
          <button
            onClick={onResetGame}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/10 backdrop-blur-md"
            title="Restart / New Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl ${brand.bgGradient} hover:opacity-90 text-white font-bold transition ${brand.accentGlow} border ${brand.borderColor}`}
            title="Game Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

