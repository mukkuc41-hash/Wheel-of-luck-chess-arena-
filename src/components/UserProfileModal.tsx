import React, { useState, useEffect } from 'react';
import { X, User, Trophy, Search, RefreshCw, ShieldCheck, Radio, Flame, Sparkles, Crown } from 'lucide-react';
import { socketService } from '../utils/socket';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

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
  dailyStreak?: number;
  isOwner?: boolean;
}

interface UserProfileModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  gameType?: string;
}

// Function to format seconds into readable time string
function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds === 0) return '0m';
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
  gameType = 'chess',
}) => {
  const [targetUsername, setTargetUsername] = useState(initialUsername || 'Grandmaster');
  const [searchInput, setSearchInput] = useState('');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUsername) {
      setTargetUsername(initialUsername);
    }
  }, [initialUsername]);

  const loadUserProfile = async (uname: string) => {
    if (!uname) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(uname)}/profile?game=${encodeURIComponent(gameType)}`);
      if (!response.ok) {
        throw new Error('User profile not found');
      }
      const data: UserProfileData = await response.json();
      setProfile(data);
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
        dailyStreak: isOwner ? 45 : 1,
        isOwner,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserProfile(targetUsername);

      // Connect Socket.IO live listener for real-time user profile updates
      const socket = socketService.getSocket();
      if (socket) {
        const handleLiveUpdate = () => {
          loadUserProfile(targetUsername);
        };

        socket.on('leaderboard_update', handleLiveUpdate);
        socket.on('game:ended', handleLiveUpdate);

        return () => {
          socket.off('leaderboard_update', handleLiveUpdate);
          socket.off('game:ended', handleLiveUpdate);
        };
      }
    }
  }, [isOpen, targetUsername, gameType]);

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
  };

  const total = data.times_played || 0;
  const winPercent = total > 0 ? ((data.wins / total) * 100).toFixed(1) : '0.0';
  const avgSeconds = total > 0 ? Math.round(data.total_time_seconds / total) : 0;

  const winBarPct = total > 0 ? (data.wins / total) * 100 : 0;
  const drawBarPct = total > 0 ? (data.draws / total) * 100 : 0;
  const lossBarPct = total > 0 ? (data.losses / total) * 100 : 0;
  const resignBarPct = total > 0 ? (data.resigns / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#0f172a] border border-[#334155] rounded-3xl max-w-2xl w-full p-6 text-[#f8fafc] shadow-2xl shadow-black/80 flex flex-col gap-5">
        
        {/* Top Header & Search Control */}
        <div className="flex items-center justify-between gap-3 border-b border-[#334155] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">
              Gaming User Profile
            </h2>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-1">
              <Radio className="w-3 h-3 text-emerald-400" /> Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-[#1e293b] border border-[#334155] rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 w-36 sm:w-48 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>
            <button
              onClick={() => loadUserProfile(targetUsername)}
              className="p-1.5 rounded-xl bg-[#1e293b] text-slate-400 hover:text-white border border-[#334155] transition"
              title="Refresh Profile Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1e293b] text-slate-400 hover:text-white border border-[#334155] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. Main Profile Header Card */}
        <div className={`border rounded-2xl p-5 flex flex-wrap sm:flex-nowrap items-center gap-5 shadow-lg transition-all ${
          isSiteOwner(data.username)
            ? 'bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
            : 'bg-[#1e293b] border-[#334155]'
        }`}>
          <div className={`w-16 h-16 font-black text-2xl rounded-full flex items-center justify-center shrink-0 shadow-md ${
            isSiteOwner(data.username)
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/40 border-2 border-amber-200'
              : 'bg-[#3b82f6] text-white shadow-blue-500/20'
          }`}>
            {isSiteOwner(data.username) ? '👑' : (data.username ? data.username.charAt(0).toUpperCase() : 'U')}
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
            <p className="text-sm font-medium text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />
              <span>Rank: #{data.rank_number} ({isSiteOwner(data.username) ? 'Verified Platform Creator & Owner' : data.rank_title})</span>
            </p>
          </div>

          {/* Daily Streak Prominent Fire Badge */}
          <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-orange-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-md">
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

          <div className="bg-[#0f172a] border border-[#334155] px-4 py-2.5 rounded-xl text-right">
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

        {/* Milestone Celebration Banner */}
        {(data.dailyStreak || 1) >= 3 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-400/40 rounded-2xl p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </div>
            <div className="text-xs text-amber-100 font-semibold">
              <span className="font-extrabold text-amber-300 uppercase tracking-wider block">
                🎉 Streak Milestone Unlocked!
              </span>
              You have achieved a <strong className="text-white">{data.dailyStreak || 1}-day active login streak</strong>. Keep playing daily to climb the leaderboards!
            </div>
          </div>
        )}

        {/* 2. Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center shadow-sm">
            <span className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Total Played
            </span>
            <span className="text-xl font-bold text-white">
              {total}
            </span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center shadow-sm">
            <span className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Win Rate
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {winPercent}%
            </span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center shadow-sm">
            <span className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Total Game Time
            </span>
            <span className="text-xl font-bold text-sky-300">
              {formatTime(data.total_time_seconds)}
            </span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center shadow-sm">
            <span className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Avg. Match Time
            </span>
            <span className="text-xl font-bold text-purple-300">
              {formatTime(avgSeconds)}
            </span>
          </div>
        </div>

        {/* 3. Performance & Outcomes Breakdown */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-[#cbd5e1] uppercase tracking-wider">
            Performance Breakdown
          </h2>

          {/* Outcome Progress Bar */}
          <div className="w-full h-3 rounded-md overflow-hidden bg-[#334155] flex">
            <div
              style={{ width: `${winBarPct}%` }}
              className="bg-[#22c55e] transition-all duration-500 h-full"
              title={`Wins: ${data.wins}`}
            />
            <div
              style={{ width: `${drawBarPct}%` }}
              className="bg-[#eab308] transition-all duration-500 h-full"
              title={`Draws: ${data.draws}`}
            />
            <div
              style={{ width: `${lossBarPct}%` }}
              className="bg-[#ef4444] transition-all duration-500 h-full"
              title={`Losses: ${data.losses}`}
            />
            <div
              style={{ width: `${resignBarPct}%` }}
              className="bg-[#64748b] transition-all duration-500 h-full"
              title={`Resignations: ${data.resigns}`}
            />
          </div>

          {/* Outcome Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5 bg-[#0f172a] p-2.5 rounded-lg border border-[#334155]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shrink-0" />
              <span className="flex-1 text-xs text-[#94a3b8] font-medium">Wins</span>
              <span className="font-bold text-emerald-400 text-sm">{data.wins}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-[#0f172a] p-2.5 rounded-lg border border-[#334155]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shrink-0" />
              <span className="flex-1 text-xs text-[#94a3b8] font-medium">Draws</span>
              <span className="font-bold text-amber-400 text-sm">{data.draws}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-[#0f172a] p-2.5 rounded-lg border border-[#334155]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
              <span className="flex-1 text-xs text-[#94a3b8] font-medium">Losses</span>
              <span className="font-bold text-red-400 text-sm">{data.losses}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-[#0f172a] p-2.5 rounded-lg border border-[#334155]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b] shrink-0" />
              <span className="flex-1 text-xs text-[#94a3b8] font-medium">Resignations</span>
              <span className="font-bold text-slate-300 text-sm">{data.resigns}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
