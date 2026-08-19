import React, { useState, useEffect } from 'react';
import { UserStats, MatchRecord } from '../types';
import { fetchUserStats, fetchMatchHistory } from '../utils/auth';
import {
  X,
  Trophy,
  Swords,
  Bot,
  Flame,
  PlayCircle,
  Clock,
  Timer,
  XCircle,
  AlertCircle,
  Share2,
  Gamepad2,
  Grid,
  Sparkles,
} from 'lucide-react';
import { ShareProgressModal } from './ShareProgressModal';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayMatch: (match: MatchRecord) => void;
}

export const SIXTEEN_GAMES = [
  { id: 'all', num: 0, name: 'All Games (Combined)', icon: '🏆', category: 'All' },
  { id: 'chess', num: 1, name: 'Chess', icon: '♟️', category: 'Board' },
  { id: 'checkers', num: 2, name: 'Draughts (Checkers)', icon: '⚪', category: 'Board' },
  { id: 'backgammon', num: 3, name: 'Backgammon', icon: '🎲', category: 'Dice' },
  { id: 'ludo', num: 4, name: 'Ludo', icon: '🎯', category: 'Dice' },
  { id: 'snakes', num: 5, name: 'Snakes & Ladders', icon: '🐍', category: 'Dice' },
  { id: 'gomoku', num: 6, name: 'Gomoku (Five in a Row)', icon: '⚫', category: 'Grid' },
  { id: 'reversi', num: 7, name: 'Reversi (Othello)', icon: '☯️', category: 'Grid' },
  { id: 'connect4', num: 8, name: 'Connect Four', icon: '🟡', category: 'Grid' },
  { id: 'ultimatetictactoe', num: 9, name: 'Ultimate Tic-Tac-Toe', icon: '❌', category: 'Paper' },
  { id: 'dotsandboxes', num: 10, name: 'Dots and Boxes', icon: '📦', category: 'Paper' },
  { id: 'battleship', num: 11, name: 'Battleship', icon: '🚢', category: 'Paper' },
  { id: 'sim', num: 12, name: 'Sim (Triangle Game)', icon: '🔺', category: 'Paper' },
  { id: 'uno', num: 13, name: 'Uno (Crazy Eights)', icon: '🃏', category: 'Cards' },
  { id: 'hearts', num: 14, name: 'Hearts', icon: '♥️', category: 'Cards' },
  { id: 'ginrummy', num: 15, name: 'Gin Rummy', icon: '🎴', category: 'Cards' },
  { id: 'speed', num: 16, name: 'Speed (Spit)', icon: '⚡', category: 'Cards' },
  { id: 'findthenumber', num: 17, name: 'Find the Number', icon: '🖐️', category: 'Speed' },
  { id: 'carrom', num: 18, name: 'Carrom Board Arena', icon: '🥏', category: 'Board' },
];

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '0m 0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${secs}s`;
};

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  onReplayMatch,
}) => {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchUserStats(selectedGame), fetchMatchHistory(selectedGame)])
        .then(([s, h]) => {
          setStats(s);
          setHistory(h);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedGame]);

  if (!isOpen) return null;

  const currentGameMeta = SIXTEEN_GAMES.find((g) => g.id === selectedGame) || SIXTEEN_GAMES[0];

  return (
    <div id="stats-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 backdrop-blur-2xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/90 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Telemetry &amp; Performance Statistics
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                  16 Games Arena
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed metrics for all 16 games, match telemetry, durations, and career archives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="stats-share-career-btn"
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-400/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Share Career Progress</span>
              <span className="sm:hidden">Share</span>
            </button>
            <button
              id="stats-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16 Games Horizontal Filter Scrollbar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
            <Gamepad2 className="w-3 h-3 text-indigo-400" /> Game:
          </span>
          {SIXTEEN_GAMES.map((game) => {
            const isSelected = selectedGame === game.id;
            return (
              <button
                key={game.id}
                id={`stats-filter-${game.id}`}
                onClick={() => setSelectedGame(game.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-indigo-400 shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <span>{game.icon}</span>
                <span>{game.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-gradient-to-b from-slate-950 to-slate-900/60">
          {loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
              Loading {currentGameMeta.name} statistics &amp; match history...
            </div>
          ) : (
            <>
              {/* Selected Game Banner */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3.5 px-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{currentGameMeta.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Telemetry View
                    </span>
                    <h3 className="text-sm font-black text-white">{currentGameMeta.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Category
                    </span>
                    <span className="text-xs font-extrabold text-indigo-300">
                      {currentGameMeta.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Primary Metrics Grid (8 Core Requirements) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Played */}
                <div id="stat-total-played" className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total Played
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats?.totalGames || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                    The all games played by user each time a game is open to be counted
                  </div>
                </div>

                {/* Win Rate */}
                <div id="stat-win-rate" className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Win Rate
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {stats?.winRate || 0}%
                  </div>
                  <div className="text-[10px] text-emerald-300/70 mt-1 leading-tight">
                    The percentage of match win of all games ({stats?.wins || 0} wins)
                  </div>
                </div>

                {/* Loss Rate */}
                <div id="stat-loss-rate" className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center justify-between">
                    <span>Loss Rate</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {stats?.lossRate || 0}%
                  </div>
                  <div className="text-[10px] text-rose-300/70 mt-1 leading-tight">
                    The percentage of match losses of all games ({stats?.losses || 0} losses)
                  </div>
                </div>

                {/* Draw Rate */}
                <div id="stat-draw-rate" className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    Draw Rate
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {stats?.drawRate || 0}%
                  </div>
                  <div className="text-[10px] text-amber-300/70 mt-1 leading-tight">
                    The percentage of match draw by user ({stats?.draws || 0} draws)
                  </div>
                </div>

                {/* Total Game Time */}
                <div id="stat-total-game-time" className="bg-sky-950/20 border border-sky-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center justify-between">
                    <span>Total Game Time</span>
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-sky-200 mt-1">
                    {formatDuration(stats?.totalTimeSeconds)}
                  </div>
                  <div className="text-[10px] text-sky-300/70 mt-1 leading-tight">
                    Start when user agreement privacy and policy page and start it's first game
                  </div>
                </div>

                {/* Avg Match Time */}
                <div id="stat-avg-match-time" className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                    <span>Avg Match Time</span>
                    <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-xl font-black text-indigo-200 mt-1">
                    {formatDuration(stats?.avgMatchTimeSeconds)}
                  </div>
                  <div className="text-[10px] text-indigo-300/70 mt-1 leading-tight">
                    The average time spent by user
                  </div>
                </div>

                {/* Resignations */}
                <div id="stat-resignations" className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                    <span>Resignations</span>
                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-200 mt-1">
                    {stats?.resignRate || 0}%
                  </div>
                  <div className="text-[10px] text-purple-300/70 mt-1 leading-tight">
                    The percentage of resignation by user in every game sum ({stats?.resigns || 0} resignations)
                  </div>
                </div>

                {/* Daily Streak */}
                <div id="stat-daily-streak" className="bg-orange-950/20 border border-orange-500/40 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-orange-300 flex items-center justify-between">
                    <span>Daily Streak</span>
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {stats?.dailyStreak || 1} Day{(stats?.dailyStreak || 1) === 1 ? '' : 's'}
                  </div>
                  <div className="text-[10px] text-orange-300/70 mt-1 leading-tight">
                    The days played consecutively if any day will not comes losses streak and reset streak to 0
                  </div>
                </div>
              </div>

              {/* Progress Distribution Bar */}
              {(stats?.totalGames || 0) > 0 && (
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Real-time Outcome Breakdown ({currentGameMeta.name})</span>
                    <span>{stats?.totalGames} Total Matches &amp; Launches</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${stats?.winRate}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Wins: ${stats?.wins}`}
                    />
                    <div
                      style={{ width: `${stats?.drawRate}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Draws: ${stats?.draws}`}
                    />
                    <div
                      style={{ width: `${stats?.lossRate}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Losses: ${stats?.losses}`}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Wins ({stats?.wins})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Draws ({stats?.draws})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Losses ({stats?.losses})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> Resigns ({stats?.resigns || 0})
                    </span>
                  </div>
                </div>
              )}

              {/* 2. All 16 Games Career Telemetry Matrix */}
              {stats?.perGameStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-indigo-400" />
                      <span>All 16 Games Career Breakdown</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Click any game to filter</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs text-slate-300 min-w-[640px]">
                      <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Game</th>
                          <th className="py-2.5 px-3 text-center">Total Played</th>
                          <th className="py-2.5 px-3 text-center">Win Rate</th>
                          <th className="py-2.5 px-3 text-center">Loss Rate</th>
                          <th className="py-2.5 px-3 text-center">Draw Rate</th>
                          <th className="py-2.5 px-3 text-center">Resigns</th>
                          <th className="py-2.5 px-3 text-right">Game Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {SIXTEEN_GAMES.filter((g) => g.id !== 'all').map((game) => {
                          const gStats = stats.perGameStats?.[game.id] || {
                            totalGames: 0,
                            winRate: 0,
                            lossRate: 0,
                            drawRate: 0,
                            resignRate: 0,
                            totalTimeSeconds: 0,
                          };
                          const isCurrent = selectedGame === game.id;
                          return (
                            <tr
                              key={game.id}
                              onClick={() => setSelectedGame(game.id)}
                              className={`cursor-pointer transition hover:bg-indigo-600/10 ${
                                isCurrent ? 'bg-indigo-900/25 font-bold text-white' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-slate-400">{game.num}</td>
                              <td className="py-2.5 px-3 flex items-center gap-2">
                                <span>{game.icon}</span>
                                <span>{game.name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-white">
                                {gStats.totalGames}
                              </td>
                              <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                                {gStats.winRate}%
                              </td>
                              <td className="py-2.5 px-3 text-center text-rose-400">
                                {gStats.lossRate}%
                              </td>
                              <td className="py-2.5 px-3 text-center text-amber-400">
                                {gStats.drawRate}%
                              </td>
                              <td className="py-2.5 px-3 text-center text-purple-300">
                                {gStats.resignRate}%
                              </td>
                              <td className="py-2.5 px-3 text-right text-sky-300 font-mono text-[11px]">
                                {formatDuration(gStats.totalTimeSeconds)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Past Match Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-indigo-400" />
                    <span>Past Match Logs ({currentGameMeta.name})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{history.length} Matches Saved</span>
                </h3>

                {history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/80 rounded-2xl border border-slate-800 italic font-medium">
                    No completed games found in your history yet. Play a PvP or AI match to save archives
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {m.mode === 'pvp' ? (
                              <Swords className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Bot className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>
                                {m.whiteUsername} vs {m.blackUsername}
                              </span>
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-extrabold">
                                {m.mode}
                              </span>
                              {m.gameType && (
                                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-200 border border-indigo-700/40 font-bold">
                                  {m.gameType}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{m.moveCount} moves</span>
                              <span>•</span>
                              <span className="capitalize">{m.reason}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              m.winner === 'draw'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            }`}
                          >
                            {m.winner === 'draw' ? 'Draw' : `${m.winner === 'w' ? 'White' : 'Black'} Won`}
                          </span>

                          <button
                            onClick={() => {
                              onReplayMatch(m);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Replay</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ShareProgressModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        stats={stats || undefined}
      />
    </div>
  );
};
