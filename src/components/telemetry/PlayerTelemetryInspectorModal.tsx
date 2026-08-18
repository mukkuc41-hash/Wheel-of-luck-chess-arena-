import React, { useState, useEffect } from 'react';
import { X, Trophy, ShieldCheck, Flame, Radio, Clock, Award, CheckCircle2, Globe, BarChart2 } from 'lucide-react';
import { TelemetryUser } from '../../types/telemetry';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { isSiteOwner } from '../../utils/owner';
import { OwnerBadge } from '../OwnerBadge';

interface PlayerTelemetryInspectorModalProps {
  userOrId: TelemetryUser | string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatHHMMSS(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export const PlayerTelemetryInspectorModal: React.FC<PlayerTelemetryInspectorModalProps> = ({
  userOrId,
  isOpen,
  onClose,
}) => {
  const [user, setUser] = useState<TelemetryUser | null>(null);

  useEffect(() => {
    if (!isOpen || !userOrId) return;

    const resolveUser = () => {
      if (typeof userOrId === 'string') {
        const found = telemetryEngine.getUserById(userOrId);
        if (found) setUser(found);
      } else {
        setUser(userOrId);
      }
    };

    resolveUser();
    const unsubscribe = telemetryEngine.subscribe(resolveUser);
    return () => unsubscribe();
  }, [userOrId, isOpen]);

  if (!isOpen || !user) return null;

  const { wins, losses, draws, resignations, totalGames, winRate } = user.matchLedger;
  const winBarPct = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const lossBarPct = totalGames > 0 ? (losses / totalGames) * 100 : 0;
  const drawBarPct = totalGames > 0 ? (draws / totalGames) * 100 : 0;
  const resignBarPct = totalGames > 0 ? (resignations / totalGames) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#090d16] border border-sky-500/30 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-[0_0_60px_rgba(14,165,233,0.15)] flex flex-col gap-5 my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-sky-300 uppercase tracking-wider font-mono">
                Player Telemetry Inspector
              </h3>
              <p className="text-[11px] text-slate-400">Sub-second live streaming metrics & user identity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. User Identity & Country Banner */}
        <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-5 flex flex-wrap sm:flex-nowrap items-center gap-5 shadow-inner">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-sky-500/20">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 text-2xl" title={user.country.name}>
              {user.country.flagEmoji}
            </span>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white tracking-wide">{user.username}</h2>
              {isSiteOwner(user.username) && (
                <OwnerBadge username={user.username} size="sm" label="SITE OWNER" showSparkle={true} />
              )}
              <span className="bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400" /> {user.onlineStatus}
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Globe className="w-3.5 h-3.5 text-sky-400 inline" /> {user.country.name} ({user.country.code})
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">ID: {user.userId}</span>
            </p>

            <div className="mt-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-block">
              {user.currentRoom}
            </div>
          </div>

          {/* Elo & Tier Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-xl text-right shrink-0">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Elo Rating
            </span>
            <span className="text-2xl font-black text-sky-400 font-mono">
              {user.eloRating}
            </span>
            <span className="block text-[11px] font-extrabold text-amber-400 uppercase">
              {user.eloTier} Tier
            </span>
          </div>
        </div>

        {/* 2. Standings & Engagement Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Global Rank</span>
            <span className="text-lg font-black text-amber-400 font-mono">#{user.globalRank}</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Regional Rank</span>
            <span className="text-lg font-black text-emerald-400 font-mono">#{user.regionalRank} ({user.country.code})</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Session Time</span>
            <span className="text-lg font-black text-sky-300 font-mono flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              {formatHHMMSS(user.currentSessionSeconds)}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Play Time</span>
            <span className="text-lg font-black text-purple-300 font-mono">
              {formatHHMMSS(user.cumulativePlayTimeSeconds)}
            </span>
          </div>
        </div>

        {/* 3. Match Outcome Ledger */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Match Outcome Ledger ({totalGames} Games)
            </h4>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Win Rate: {winRate}%
            </span>
          </div>

          {/* Outcome Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden bg-slate-800 flex">
            <div style={{ width: `${winBarPct}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`Wins: ${wins}`} />
            <div style={{ width: `${drawBarPct}%` }} className="bg-amber-400 h-full transition-all duration-300" title={`Draws: ${draws}`} />
            <div style={{ width: `${lossBarPct}%` }} className="bg-rose-500 h-full transition-all duration-300" title={`Losses: ${losses}`} />
            <div style={{ width: `${resignBarPct}%` }} className="bg-slate-500 h-full transition-all duration-300" title={`Resignations: ${resignations}`} />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <span className="block text-[10px] text-emerald-400 font-bold">Wins</span>
              <span className="text-sm font-black text-white">{wins}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
              <span className="block text-[10px] text-amber-400 font-bold">Draws</span>
              <span className="text-sm font-black text-white">{draws}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
              <span className="block text-[10px] text-rose-400 font-bold">Losses</span>
              <span className="text-sm font-black text-white">{losses}</span>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 p-2 rounded-lg">
              <span className="block text-[10px] text-slate-400 font-bold">Resigns</span>
              <span className="text-sm font-black text-white">{resignations}</span>
            </div>
          </div>
        </div>

        {/* 4. Badges & Milestones Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" /> Unlocked Milestones & Badges ({user.badges.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {user.badges.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 p-2.5 rounded-xl flex items-start gap-3 transition"
              >
                <div className="text-2xl bg-purple-500/10 border border-purple-500/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-white truncate">{b.title}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        b.rarity === 'Legendary'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : b.rarity === 'Epic'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                      }`}
                    >
                      {b.rarity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
