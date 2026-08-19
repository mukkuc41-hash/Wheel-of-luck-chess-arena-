import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Search,
  RefreshCw,
  ShieldCheck,
  Radio,
  Flame,
  Sparkles,
  Crown,
  Gamepad2,
  Clock,
  Timer,
  XCircle,
  AlertCircle,
  Grid,
  Swords,
} from 'lucide-react';
import { socketService } from '../utils/socket';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';
import { SingleGameStats, MatchRecord } from '../types';
import { SIXTEEN_GAMES } from './StatsModal';

interface UserProfileData {
  username: string;
  rank_title: string;
  rank_number: number;
  score: number;
  total_time_seconds: number;
  times_played: number;
  wins: number;
  losses: number;
  draws: number;
  resigns: number;
  winRate?: number;
  lossRate?: number;
  drawRate?: number;
  resignRate?: number;
  avg_match_time_seconds?: number;
  dailyStreak?: number;
  isOwner?: boolean;
  gameType?: string;
  perGameStats?: Record<string, SingleGameStats>;
}

interface UserProfileModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  gameType?: string;
}

// Function to format seconds into readable time string
function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds === 0) return '0m 0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  username: initialUsername,
  isOpen,
  onClose,
  gameType: defaultGame = 'all',
}) => {
  const [targetUsername, setTargetUsername] = useState(initialUsername || 'Grandmaster');
  const [selectedGame, setSelectedGame] = useState(defaultGame || 'all');
  const [searchInput, setSearchInput] = useState('');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialUsername) {
      setTargetUsername(initialUsername);
    }
  }, [initialUsername]);

  const loadUserProfile = async (uname: string, gType: string) => {
    if (!uname) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(uname)}/profile?game=${encodeURIComponent(gType)}`
      );
      if (!response.ok) {
        throw new Error('User profile not found');
      }
      const data: UserProfileData = await response.json();
      setProfile(data);

      // Also fetch match history for this user
      const histRes = await fetch(
        `/api/games/history?game=${encodeURIComponent(gType)}`
      );
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.filter((m: MatchRecord) => 
          m.whiteUsername?.toLowerCase() === uname.toLowerCase() ||
          m.blackUsername?.toLowerCase() === uname.toLowerCase()
        ));
      }
    } catch (err: any) {
      const isOwner = isSiteOwner(uname);
      // Fallback display for new or custom users
      setProfile({
        username: uname,
        rank_title: isOwner ? 'Site Owner & Grandmaster' : 'Competitor',
        rank_number: isOwner ? 1 : 99,
        score: isOwner ? 2650 : 1200,
        total_time_seconds: isOwner ? 54000 : 0,
        times_played: isOwner ? 128 : 0,
        wins: isOwner ? 120 : 0,
        losses: isOwner ? 4 : 0,
        draws: isOwner ? 4 : 0,
        resigns: 0,
        winRate: isOwner ? 94 : 0,
        lossRate: isOwner ? 3 : 0,
        drawRate: isOwner ? 3 : 0,
        resignRate: 0,
        avg_match_time_seconds: isOwner ? 420 : 0,
        dailyStreak: isOwner ? 45 : 1,
        isOwner,
      });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserProfile(targetUsername, selectedGame);

      // Connect Socket.IO live listener for real-time user profile updates
      const socket = socketService.getSocket();
      if (socket) {
        const handleLiveUpdate = () => {
          loadUserProfile(targetUsername, selectedGame);
        };

        socket.on('leaderboard_update', handleLiveUpdate);
        socket.on('game:ended', handleLiveUpdate);

        return () => {
          socket.off('leaderboard_update', handleLiveUpdate);
          socket.off('game:ended', handleLiveUpdate);
        };
      }
    }
  }, [isOpen, targetUsername, selectedGame]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTargetUsername(searchInput.trim());
      setSearchInput('');
    }
  };

  if (!isOpen) return null;

  const data = profile || {
    username: targetUsername,
    rank_title: 'Unranked',
    rank_number: 0,
    score: 1000,
    total_time_seconds: 0,
    times_played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    resigns: 0,
    winRate: 0,
    lossRate: 0,
    drawRate: 0,
    resignRate: 0,
    avg_match_time_seconds: 0,
    dailyStreak: 1,
  };

  const total = data.times_played || 0;
  const winRateVal = data.winRate ?? (total > 0 ? Math.round((data.wins / total) * 100) : 0);
  const lossRateVal = data.lossRate ?? (total > 0 ? Math.round((data.losses / total) * 100) : 0);
  const drawRateVal = data.drawRate ?? (total > 0 ? Math.round((data.draws / total) * 100) : 0);
  const resignRateVal = data.resignRate ?? (total > 0 ? Math.round((data.resigns / total) * 100) : 0);
  const avgSeconds = data.avg_match_time_seconds ?? (total > 0 ? Math.round(data.total_time_seconds / total) : 0);

  const currentGameMeta = SIXTEEN_GAMES.find((g) => g.id === selectedGame) || SIXTEEN_GAMES[0];

  return (
    <div id="user-profile-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#0f172a] border border-[#334155] rounded-3xl max-w-4xl w-full max-h-[92vh] text-[#f8fafc] shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
        
        {/* Top Header & Search Control */}
        <div className="p-4 sm:p-5 border-b border-[#334155] flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/95 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black text-slate-200 uppercase tracking-wider">
              16 Games User Profile
            </h2>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-1">
              <Radio className="w-3 h-3 text-emerald-400" /> Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                id="profile-search-input"
                type="text"
                placeholder="Search username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-[#1e293b] border border-[#334155] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 w-36 sm:w-48 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>
            <button
              id="profile-refresh-btn"
              onClick={() => loadUserProfile(targetUsername, selectedGame)}
              className="p-1.5 rounded-xl bg-[#1e293b] text-slate-400 hover:text-white border border-[#334155] transition"
              title="Refresh Profile Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="profile-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1e293b] text-slate-400 hover:text-white border border-[#334155] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16 Games Horizontal Filter Scrollbar */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
            <Gamepad2 className="w-3 h-3 text-indigo-400" /> Game:
          </span>
          {SIXTEEN_GAMES.map((game) => {
            const isSelected = selectedGame === game.id;
            return (
              <button
                key={game.id}
                id={`profile-filter-${game.id}`}
                onClick={() => setSelectedGame(game.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400 shadow-md shadow-sky-950'
                    : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <span>{game.icon}</span>
                <span>{game.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-gradient-to-b from-[#0f172a] to-slate-950">
          {loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
              Loading profile for {targetUsername} in {currentGameMeta.name}...
            </div>
          ) : (
            <>
              {/* 1. Main Profile Header Card */}
              <div
                className={`border rounded-2xl p-5 flex flex-wrap sm:flex-nowrap items-center gap-5 shadow-lg transition-all ${
                  isSiteOwner(data.username)
                    ? 'bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'bg-[#1e293b] border-[#334155]'
                }`}
              >
                <div
                  className={`w-16 h-16 font-black text-2xl rounded-full flex items-center justify-center shrink-0 shadow-md ${
                    isSiteOwner(data.username)
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/40 border-2 border-amber-200'
                      : 'bg-[#3b82f6] text-white shadow-blue-500/20'
                  }`}
                >
                  {isSiteOwner(data.username) ? '👑' : data.username ? data.username.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-extrabold text-white tracking-wide">
                      {data.username}
                    </h1>
                    {isSiteOwner(data.username) && (
                      <OwnerBadge username={data.username} size="sm" label="SITE OWNER" showSparkle={true} />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span>
                      Rank: #{data.rank_number} (
                      {isSiteOwner(data.username) ? 'Verified Platform Creator & Owner' : data.rank_title}
                      ) • {currentGameMeta.name}
                    </span>
                  </p>
                </div>

                {/* Daily Streak Prominent Fire Badge */}
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-orange-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-md shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0">
                    <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-orange-300 font-extrabold uppercase tracking-wider">
                      Daily Streak
                    </span>
                    <span className="text-lg font-black text-amber-300">
                      {data.dailyStreak || 1} Day{(data.dailyStreak || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-[#334155] px-4 py-2.5 rounded-xl text-right shrink-0">
                  <span className="block text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">
                    Score
                  </span>
                  <span className="text-xl font-black text-[#38bdf8]">
                    {(data?.score ?? 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Verified Owner Showcase Banner */}
              {isSiteOwner(data.username) && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 border border-amber-400/60 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/30 border border-amber-300/60 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                    <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <div className="text-xs text-amber-100 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-300 uppercase tracking-widest text-xs">
                        👑 Platform Founder &amp; Site Owner
                      </span>
                      <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                        Verified
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-200">
                      <strong>ADITYA-OWNER</strong> has full administrative ownership of the site, gaming servers, live telemetry, and multiplayer engine.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Primary 8 Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Played */}
                <div className="bg-[#1e293b] border border-[#334155] p-3.5 rounded-2xl shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Total Played
                  </span>
                  <div className="text-xl font-black text-white mt-1">{total}</div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    The all games played by user each time a game is open to be counted
                  </p>
                </div>

                {/* Win Rate */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl shadow-sm">
                  <span className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                    Win Rate
                  </span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{winRateVal}%</div>
                  <p className="text-[10px] text-emerald-300/70 mt-1 leading-tight">
                    The percentage of match win of all games ({data.wins} wins)
                  </p>
                </div>

                {/* Loss Rate */}
                <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">
                      Loss Rate
                    </span>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-xl font-black text-rose-400 mt-1">{lossRateVal}%</div>
                  <p className="text-[10px] text-rose-300/70 mt-1 leading-tight">
                    The percentage of match losses of all games ({data.losses} losses)
                  </p>
                </div>

                {/* Draw Rate */}
                <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-2xl shadow-sm">
                  <span className="block text-[10px] font-black text-amber-300 uppercase tracking-wider">
                    Draw Rate
                  </span>
                  <div className="text-xl font-black text-amber-400 mt-1">{drawRateVal}%</div>
                  <p className="text-[10px] text-amber-300/70 mt-1 leading-tight">
                    The percentage of match draw by user ({data.draws} draws)
                  </p>
                </div>

                {/* Total Game Time */}
                <div className="bg-sky-950/20 border border-sky-500/30 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider">
                      Total Game Time
                    </span>
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-lg font-black text-sky-200 mt-1">
                    {formatTime(data.total_time_seconds)}
                  </div>
                  <p className="text-[10px] text-sky-300/70 mt-1 leading-tight">
                    Start when user agreement privacy and policy page and start it's first game
                  </p>
                </div>

                {/* Avg Match Time */}
                <div className="bg-indigo-950/20 border border-indigo-500/30 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                      Avg Match Time
                    </span>
                    <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-lg font-black text-indigo-200 mt-1">
                    {formatTime(avgSeconds)}
                  </div>
                  <p className="text-[10px] text-indigo-300/70 mt-1 leading-tight">
                    The average time spent by user
                  </p>
                </div>

                {/* Resignations */}
                <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">
                      Resignations
                    </span>
                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-lg font-black text-purple-200 mt-1">{resignRateVal}%</div>
                  <p className="text-[10px] text-purple-300/70 mt-1 leading-tight">
                    The percentage of resignation by user in every game sum ({data.resigns || 0} resignations)
                  </p>
                </div>

                {/* Daily Streak */}
                <div className="bg-orange-950/20 border border-orange-500/40 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-orange-300 uppercase tracking-wider">
                      Daily Streak
                    </span>
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    {data.dailyStreak || 1} Day{(data.dailyStreak || 1) === 1 ? '' : 's'}
                  </div>
                  <p className="text-[10px] text-orange-300/70 mt-1 leading-tight">
                    The days played consecutively if any day will not comes losses streak and reset streak to 0
                  </p>
                </div>
              </div>

              {/* 3. All 16 Games Career Telemetry Matrix */}
              {data.perGameStats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-sky-300 flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-sky-400" />
                      <span>All 16 Games Career Profile Breakdown</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Click row to filter</span>
                  </div>

                  <div className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs text-slate-300 min-w-[640px]">
                      <thead className="bg-[#0f172a] text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-[#334155]">
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
                          const gStats = data.perGameStats?.[game.id] || {
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
                              id={`profile-row-${game.id}`}
                              onClick={() => setSelectedGame(game.id)}
                              className={`cursor-pointer transition hover:bg-sky-600/10 ${
                                isCurrent ? 'bg-sky-900/25 font-bold text-white' : ''
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
                                {formatTime(gStats.totalTimeSeconds)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Past Match Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-sky-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-sky-400" />
                    <span>Past Match Logs ({currentGameMeta.name})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{history.length} Matches Found</span>
                </h3>

                {history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-[#1e293b] rounded-2xl border border-[#334155] italic font-medium">
                    No completed games found in your history yet. Play a PvP or AI match to save archives
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((m) => (
                      <div
                        key={m.id}
                        className="bg-[#1e293b] border border-[#334155] p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>
                                {m.whiteUsername} vs {m.blackUsername}
                              </span>
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 font-extrabold">
                                {m.mode}
                              </span>
                              {m.gameType && (
                                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-sky-900/30 text-sky-200 border border-sky-700/40 font-bold">
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

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              m.winner === 'draw'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            }`}
                          >
                            {m.winner === 'draw' ? 'Draw' : `${m.winner === 'w' ? 'White' : 'Black'} Won`}
                          </span>
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
    </div>
  );
};
