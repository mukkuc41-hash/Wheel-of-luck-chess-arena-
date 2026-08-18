import React from 'react';
import { ActiveBoardGame, GameMode, UserSession } from '../types';
import { Bot, User, Pause, Play, Flag, Handshake, Dices, Crown, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface PlayerStatusCardDeckProps {
  activeBoardGame: ActiveBoardGame;
  gameMode: GameMode;
  currentUser: UserSession | null;
  // Clock & Strategy controls
  whiteTime?: number;
  blackTime?: number;
  activeTurn?: string;
  isGameActive?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  // Game-specific custom stats
  checkersRedCaptured?: number;
  checkersBlackCaptured?: number;
  backgammonWhitePip?: number;
  backgammonRedPip?: number;
  // Dice & Turn handlers for Ludo / Snakes & Ladders
  snakesPlayers?: { id: number; name: string; pos: number; color: string; isAi: boolean }[];
  ludoPlayers?: { color: string; name: string; isAi: boolean; activeTokens: number; homeTokens: number }[];
  diceValue?: number | null;
  isRollingDice?: boolean;
  onRollDice?: () => void;
  onPassTurn?: () => void;
}

const formatClockTime = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const PlayerStatusCardDeck: React.FC<PlayerStatusCardDeckProps> = ({
  activeBoardGame,
  gameMode,
  currentUser,
  whiteTime = 600,
  blackTime = 600,
  activeTurn = 'w',
  isGameActive = true,
  isPaused = false,
  onTogglePause,
  onResign,
  onOfferDraw,
  checkersRedCaptured = 0,
  checkersBlackCaptured = 0,
  backgammonWhitePip = 167,
  backgammonRedPip = 167,
  snakesPlayers = [],
  ludoPlayers = [],
  diceValue = null,
  isRollingDice = false,
  onRollDice,
  onPassTurn,
}) => {
  const isStrategyGame = activeBoardGame === 'chess' || activeBoardGame === 'checkers' || activeBoardGame === 'backgammon';

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4 text-white">
      {/* 1. Dynamic Player Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {activeBoardGame === 'chess' && (
          <>
            {/* Player 1 Card (White) */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'w'
                  ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
                  ♔
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black">{currentUser?.username || 'Player 1'}</span>
                    {isSiteOwner(currentUser?.username) && (
                      <OwnerBadge username={currentUser?.username} size="xs" label="OWNER" />
                    )}
                    <span className="text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded font-semibold border border-amber-400/30">
                      WHITE PIECES
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Rating: {isSiteOwner(currentUser?.username) ? '2650 GM' : '1500 MMR'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-amber-300">{formatClockTime(whiteTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Time Clock</div>
              </div>
            </div>

            {/* Player 2 Card (Black) */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'b'
                  ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  ♚
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">
                      {gameMode === 'ai' ? 'Computer (AI)' : 'Player 2'}
                    </span>
                    <span className="text-[10px] text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-semibold border border-slate-700">
                      BLACK PIECES
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Rating: 1500 MMR</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-slate-300">{formatClockTime(blackTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Time Clock</div>
              </div>
            </div>
          </>
        )}

        {activeBoardGame === 'checkers' && (
          <>
            {/* Red Pieces Card */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'r'
                  ? 'bg-red-500/10 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-amber-300 flex items-center justify-center text-white shadow-md">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black">{currentUser?.username || 'Player 1'}</span>
                    {isSiteOwner(currentUser?.username) && (
                      <OwnerBadge username={currentUser?.username} size="xs" label="OWNER" />
                    )}
                    <span className="text-[10px] text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded font-semibold border border-red-400/30">
                      RED PIECES
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Captured: {checkersBlackCaptured}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-red-300">{formatClockTime(whiteTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Clock Timer</div>
              </div>
            </div>

            {/* Black Pieces Card */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'b'
                  ? 'bg-red-500/10 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-white shadow-md">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">
                      {gameMode === 'ai' ? 'Computer (AI)' : 'Player 2'}
                    </span>
                    <span className="text-[10px] text-gray-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-semibold border border-slate-700">
                      BLACK PIECES
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Captured: {checkersRedCaptured}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-slate-300">{formatClockTime(blackTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Clock Timer</div>
              </div>
            </div>
          </>
        )}

        {activeBoardGame === 'backgammon' && (
          <>
            {/* White Checkers Card */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'w'
                  ? 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                  ⚪
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black">{currentUser?.username || 'Player 1'}</span>
                    {isSiteOwner(currentUser?.username) && (
                      <OwnerBadge username={currentUser?.username} size="xs" label="OWNER" />
                    )}
                    <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded font-semibold border border-purple-400/30">
                      WHITE CHECKERS
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-300 font-extrabold">
                    Pip Count: {backgammonWhitePip}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-purple-200">{formatClockTime(whiteTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Timer</div>
              </div>
            </div>

            {/* Red Checkers Card */}
            <div
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                activeTurn === 'b'
                  ? 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-red-300 text-white font-black flex items-center justify-center text-sm shadow-md">
                  🔴
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">
                      {gameMode === 'ai' ? 'Computer (AI)' : 'Player 2'}
                    </span>
                    <span className="text-[10px] text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded font-semibold border border-red-400/30">
                      RED CHECKERS
                    </span>
                  </div>
                  <span className="text-[11px] text-red-300 font-extrabold">
                    Pip Count: {backgammonRedPip}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-slate-300">{formatClockTime(blackTime)}</div>
                <div className="text-[9px] uppercase font-bold text-gray-400">Timer</div>
              </div>
            </div>
          </>
        )}

        {activeBoardGame === 'snakes' &&
          (snakesPlayers.length > 0 ? snakesPlayers : [
            { id: 1, name: 'Player 1', pos: 42, color: '#ef4444', isAi: false },
            { id: 2, name: 'Player 2 (AI)', pos: 28, color: '#06b6d4', isAi: true },
          ]).map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white shadow"
                  style={{ backgroundColor: p.color }}
                >
                  P{p.id}
                </div>
                <div>
                  <span className="text-xs font-black block">{p.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Position: Tile {p.pos}
                  </span>
                </div>
              </div>
            </div>
          ))}

        {activeBoardGame === 'ludo' &&
          (ludoPlayers.length > 0 ? ludoPlayers : [
            { color: 'red', name: 'Player 1 (Red)', isAi: false, activeTokens: 2, homeTokens: 1 },
            { color: 'green', name: 'Green (AI)', isAi: true, activeTokens: 3, homeTokens: 0 },
            { color: 'yellow', name: 'Yellow (AI)', isAi: true, activeTokens: 1, homeTokens: 0 },
            { color: 'blue', name: 'Blue (AI)', isAi: true, activeTokens: 4, homeTokens: 0 },
          ]).map((p, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white capitalize shadow"
                  style={{
                    backgroundColor:
                      p.color === 'red'
                        ? '#e60000'
                        : p.color === 'green'
                        ? '#1da80e'
                        : p.color === 'yellow'
                        ? '#ffcc00'
                        : '#0080ff',
                  }}
                >
                  {p.color[0]}
                </div>
                <div>
                  <span className="text-xs font-black block capitalize">{p.name}</span>
                  <span className="text-[10px] text-blue-300 font-bold">
                    Home: {p.homeTokens} | Active: {p.activeTokens}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* 2. Adaptive Control Deck */}
      <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-3">
        {isStrategyGame ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold">Active Turn:</span>
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {activeTurn === 'w' || activeTurn === 'r' ? 'Player 1' : 'Player 2'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onTogglePause && (
                <button
                  onClick={onTogglePause}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume Clocks' : 'Pause Clocks'}</span>
                </button>
              )}

              {onOfferDraw && (
                <button
                  onClick={onOfferDraw}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Handshake className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Offer Draw</span>
                </button>
              )}

              {onResign && (
                <button
                  onClick={onResign}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-400/30 transition flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                  <span>Resign</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {/* Interactive 3D Roll Dice Button */}
              {onRollDice && (
                <button
                  onClick={onRollDice}
                  disabled={isRollingDice}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/60 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Dices className={`w-4 h-4 ${isRollingDice ? 'animate-spin' : ''}`} />
                  <span>{isRollingDice ? 'Rolling...' : 'Roll 3D Dice'}</span>
                </button>
              )}

              {/* Viewport showing active dice result */}
              {diceValue !== null && diceValue !== undefined && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-gray-400 font-bold">Dice Outcome:</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    🎲 {diceValue}
                  </span>
                </div>
              )}
            </div>

            {onPassTurn && (
              <button
                onClick={onPassTurn}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 text-gray-300"
              >
                <span>Pass Turn</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
