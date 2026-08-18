import React, { useState, useEffect } from 'react';
import { UserStats, MatchRecord } from '../types';
import { fetchUserStats, fetchMatchHistory } from '../utils/auth';
import { X, Trophy, Swords, Bot, Flame, PlayCircle, Clock, Timer, XCircle, AlertCircle, Share2 } from 'lucide-react';
import { ShareProgressModal } from './ShareProgressModal';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayMatch: (match: MatchRecord) => void;
}

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
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchUserStats(), fetchMatchHistory()])
        .then(([s, h]) => {
          setStats(s);
          setHistory(h);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Performance & Telemetry Statistics</h2>
              <p className="text-xs text-indigo-200/60">Real-time match telemetry, timings, and career archives</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Share Career Progress</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="text-center py-12 text-white/50 animate-pulse text-sm">
              Loading match data & statistics...
            </div>
          ) : (
            <>
              {/* Match Outcome Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/70">
                    Total Played
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats?.totalGames || 0}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                    <Swords className="w-3 h-3 text-indigo-400" />
                    <span>{stats?.pvpGames || 0} PvP / {stats?.aiGames || 0} AI</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Win Rate
                  </div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">
                    {stats?.winRate || 0}%
                  </div>
                  <div className="text-[10px] text-emerald-200/60 mt-1">
                    {stats?.wins || 0} Total Wins
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center justify-between">
                    <span>Loss Rate</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-300 mt-1">
                    {stats?.lossRate || 0}%
                  </div>
                  <div className="text-[10px] text-rose-200/60 mt-1">
                    {stats?.losses || 0} Total Losses
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Draw Rate
                  </div>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {stats?.drawRate || 0}%
                  </div>
                  <div className="text-[10px] text-amber-200/60 mt-1">
                    {stats?.draws || 0} Total Draws
                  </div>
                </div>
              </div>

              {/* Time Telemetry & Secondary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-500/10 border border-blue-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
                    <span>Total Game Time</span>
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-blue-200 mt-1">
                    {formatDuration(stats?.totalTimeSeconds)}
                  </div>
                  <div className="text-[10px] text-blue-200/60 mt-1">
                    Cumulative session play time
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
                    <span>Avg Match Time</span>
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-black text-cyan-200 mt-1">
                    {formatDuration(stats?.avgMatchTimeSeconds)}
                  </div>
                  <div className="text-[10px] text-cyan-200/60 mt-1">
                    Average time per game
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                    <span>Resignations</span>
                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-200 mt-1">
                    {stats?.resigns || 0}
                  </div>
                  <div className="text-[10px] text-purple-200/60 mt-1">
                    {stats?.resignRate || 0}% Resign Rate
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-400/30 p-3.5 rounded-2xl backdrop-blur-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-300 flex items-center justify-between">
                    <span>Daily Streak</span>
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {stats?.dailyStreak || 1} Day{(stats?.dailyStreak || 1) > 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-orange-200/60 mt-1">
                    Active login streak
                  </div>
                </div>
              </div>

              {/* Progress Distribution Bar */}
              {(stats?.totalGames || 0) > 0 && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-white/80">
                    <span>Real-time Outcome Distribution</span>
                    <span>{stats?.totalGames} Total Games Played</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
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
                  <div className="flex items-center gap-4 text-[10px] text-white/60 pt-1">
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

              {/* Match Archive Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center justify-between">
                  <span>Past Match Logs</span>
                  <span className="text-[10px] text-white/40">{history.length} Matches Saved</span>
                </h3>

                {history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/10 italic">
                    No completed games found in your history yet. Play a PvP or AI match to save archives!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
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
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-indigo-200">
                                {m.mode}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/50 mt-0.5 flex items-center gap-2">
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
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold transition flex items-center gap-1.5"
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
