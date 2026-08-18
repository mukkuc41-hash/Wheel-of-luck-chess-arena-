import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Trophy,
  Flame,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Swords,
  Shield,
  Activity,
  Crown,
  Gift,
  Target,
  Lock,
  RefreshCw,
  AlertTriangle,
  Key,
  Laptop,
  LogOut,
} from 'lucide-react';
import { fetchActiveSessions, fetchSecurityLogs, logoutAllDevices } from '../utils/auth';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface ActivityItem {
  id: string;
  username: string;
  game: string;
  type: string;
  text: string;
  timestamp: number;
}

interface QuestItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  claimed: boolean;
}

interface BadgeItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
  unlocked: boolean;
}

interface TournamentItem {
  id: string;
  title: string;
  game: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  status: string;
  round: string;
}

interface ClanItem {
  id: string;
  name: string;
  tag?: string;
  members: number;
  totalXp: number;
  rank: number;
  icon: string;
}

interface CommunitySocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpectateMatch?: (roomId: string) => void;
}

interface ProgressionData {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

export const CommunitySocialModal: React.FC<CommunitySocialModalProps> = ({
  isOpen,
  onClose,
  onSpectateMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'quests' | 'badges' | 'tournaments' | 'clans' | 'security'>('feed');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityStatus, setSecurityStatus] = useState<any>({
    tokenRotationEngine: 'ACTIVE_HMAC_SHA256',
    breachDetectionTrap: 'ENGAGED_AUTOMATED_REVOCATION',
    cookieSecurity: 'HttpOnly_Secure_SameSiteStrict',
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [clans, setClans] = useState<ClanItem[]>([]);
  const [userXp, setUserXp] = useState<number>(1450);
  const [progression, setProgression] = useState<ProgressionData>({
    level: 3,
    totalXp: 1450,
    currentLevelXp: 200,
    xpNeededForNextLevel: 750,
    progressPercent: 26,
  });
  const [badgeCategory, setBadgeCategory] = useState<string>('All');
  const [badgeSearch, setBadgeSearch] = useState<string>('');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const filteredBadges = badges.filter((b) => {
    const matchesCat = badgeCategory === 'All' || b.category === badgeCategory;
    const matchesQuery =
      !badgeSearch.trim() ||
      b.name.toLowerCase().includes(badgeSearch.toLowerCase()) ||
      b.description.toLowerCase().includes(badgeSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/progression/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.progression) {
          setProgression(data.progression);
          setUserXp(data.progression.totalXp);
        }
        if (data.quests) setQuests(data.quests);
        if (data.badges) setBadges(data.badges);
      })
      .catch(() => {});

    fetch('/api/activity-feed')
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []))
      .catch(() => {});

    fetch('/api/quests')
      .then((res) => res.json())
      .then((data) => setQuests(data.quests || []))
      .catch(() => {});

    fetch('/api/badges')
      .then((res) => res.json())
      .then((data) => setBadges(data.badges || []))
      .catch(() => {});

    fetch('/api/tournaments')
      .then((res) => res.json())
      .then((data) => setTournaments(data.tournaments || []))
      .catch(() => {});

    fetch('/api/clans')
      .then((res) => res.json())
      .then((data) => setClans(data.clans || []))
      .catch(() => {});

    fetchActiveSessions().then((res) => {
      if (res.sessions) setActiveSessions(res.sessions);
    });

    fetchSecurityLogs().then((res) => {
      if (res.logs) setSecurityLogs(res.logs);
      if (res.tokenRotationEngine) setSecurityStatus(res);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimQuest = (questId: string) => {
    fetch('/api/quests/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuests((prev) =>
            prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
          );
          if (data.progression) {
            setProgression(data.progression);
            setUserXp(data.progression.totalXp);
          } else {
            setUserXp((prev) => prev + (data.quest?.xpReward || 100));
          }
          setClaimedNotice(data.message || 'Reward claimed!');
          setTimeout(() => setClaimedNotice(null), 3000);
        }
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-black text-sm">
              L{progression.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Progression & Rewards Engine</h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {userXp} XP
                </span>
              </div>
              <p className="text-xs text-indigo-200/60">Level {progression.level} • Dynamic XP Engine • Daily Quests & Badge Milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* XP & Leveling Engine Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-950 border-b border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 flex items-center gap-1">
                <Crown className="w-4 h-4" /> Level {progression.level}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-indigo-200">{progression.currentLevelXp} / {progression.xpNeededForNextLevel} XP to Level {progression.level + 1}</span>
            </div>
            <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              Formula: Base XP × (1 + (AI Level × 0.15))
            </span>
          </div>

          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              style={{ width: `${Math.max(5, progression.progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 text-xs font-bold uppercase tracking-wider overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'feed'
                ? 'border-indigo-400 text-indigo-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quests'
                ? 'border-amber-400 text-amber-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Quests</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-emerald-400 text-emerald-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tournaments'
                ? 'border-purple-400 text-purple-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Tournaments</span>
          </button>

          <button
            onClick={() => setActiveTab('clans')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clans'
                ? 'border-cyan-400 text-cyan-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clans</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 px-4 transition border-b-2 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-400 text-emerald-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security & Shield</span>
          </button>
        </div>

        {/* Claim Notice Banner */}
        {claimedNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-400/30 p-2.5 text-center text-xs font-bold text-emerald-200 animate-fadeIn flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{claimedNotice}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 custom-scrollbar">
          {/* TAB 1: ACTIVITY FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Platform Accomplishments
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real-time Updates
                </span>
              </div>

              {activities.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white/5 border border-white/10 hover:border-indigo-400/40 rounded-xl flex items-center gap-3.5 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                    {item.type === 'level8_defeat' ? (
                      <Crown className="w-4 h-4 text-amber-400" />
                    ) : item.type === 'badge_unlocked' ? (
                      <Award className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Swords className="w-4 h-4 text-indigo-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                      <span className={isSiteOwner(item.username) ? 'text-amber-300 font-extrabold' : ''}>{item.username}</span>
                      {isSiteOwner(item.username) && (
                        <OwnerBadge username={item.username} size="xs" label="OWNER" />
                      )}
                      <span className="text-[10px] font-normal text-indigo-200/60 bg-white/5 px-2 py-0.5 rounded-full">
                        {item.game}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200/80">{item.text}</p>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round((Date.now() - item.timestamp) / (1000 * 60))}m ago</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DAILY QUESTS */}
          {activeTab === 'quests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  24-Hour Rotating Challenges
                </span>
                <span className="text-[10px] text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Resets in 14h 22m
                </span>
              </div>

              {quests.map((q) => (
                <div
                  key={q.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{q.title}</h4>
                      <p className="text-[11px] text-indigo-200/70 mt-0.5">{q.description}</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                      <Gift className="w-3 h-3" /> +{q.xpReward} XP
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/60">
                      <span>Progress</span>
                      <span>
                        {q.progress} / {q.target}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="pt-1 flex justify-end">
                    {q.claimed ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimQuest(q.id)}
                        disabled={q.progress < q.target}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                          q.progress >= q.target
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer'
                            : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                        }`}
                      >
                        <span>Claim Reward</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                      75 Unique Mastery Badges
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold px-2 py-0.5 rounded-full">
                      5 Categories
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-200/60 mt-0.5">
                    Completionist progression engine across AI trials, miracles, 16 games & social goals.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-400/30">
                    Unlocked: {badges.filter((b) => b.unlocked).length} / {badges.length || 75}
                  </span>
                </div>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-bold">
                  {[
                    'All',
                    'AI Domination',
                    'Miracles & Edges',
                    'Platform Mastery',
                    'Dedication & Grind',
                    'Social & Secrets',
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBadgeCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition border ${
                        badgeCategory === cat
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                          : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={badgeSearch}
                    onChange={(e) => setBadgeSearch(e.target.value)}
                    placeholder="Search 75 badges by title or condition..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                  />
                  {badgeSearch && (
                    <button
                      onClick={() => setBadgeSearch('')}
                      className="absolute right-3 top-2 text-xs text-white/50 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredBadges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                      b.unlocked
                        ? 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/60 border-emerald-400/40 shadow-sm shadow-emerald-500/10'
                        : 'bg-white/5 border-white/10 opacity-55 hover:opacity-80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {b.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{b.name}</h4>
                        {b.unlocked ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-400/30 flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded border border-white/10 shrink-0 font-mono">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-200/70 mt-1 leading-snug">
                        {b.description}
                      </p>
                      {b.category && (
                        <span className="inline-block mt-1.5 text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          {b.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Competitive Bracket Arenas
                </span>
              </div>

              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-white/5 border border-white/10 hover:border-purple-400/40 rounded-2xl space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{t.title}</h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                            t.status === 'live'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200/60 mt-0.5">
                        Game: {t.game} • Round: {t.round}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" /> {t.prizePool}
                      </div>
                      <div className="text-[10px] text-white/50 mt-0.5">
                        {t.participants}/{t.maxParticipants} Players
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => alert(`Registered for ${t.title}!`)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition shadow-sm"
                    >
                      Join Bracket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: CLANS */}
          {activeTab === 'clans' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Top Platform Clans & Guilds
                </span>
              </div>

              {clans.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-white/5 border border-white/10 hover:border-cyan-400/40 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xl shrink-0">
                      {c.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{c.name}</h4>
                        <span className="text-[10px] text-cyan-300 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          [{c.tag || 'CLAN'}]
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-200/60 mt-0.5">
                        {c.members} Members • {((c.totalXp) ?? 0).toLocaleString()} Total XP
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Requested to join ${c.name}!`)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition"
                  >
                    Join Clan
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: SECURITY & TOKEN SHIELD */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Architecture Overview Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Cryptographic Session Vault & Anti-Theft Shield</span>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-100/70 mt-0.5">
                      Short-lived 15m Access Tokens + HttpOnly SameSite=Strict Refresh Cookies + Automated Reuse Traps.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-4">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Key className="w-3.5 h-3.5" />
                      <span>HMAC-SHA256 Signing</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">
                      Tokens are signed with server vault secrets. Any payload tampering breaks signature verification.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Token Rotation</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">
                      Refresh tokens rotate every 15m. Each rotation increments token sequence numbers.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Breach Trap Shield</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">
                      Reuse of a stolen refresh token triggers automated global session revocation for the account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Device Sessions & Revocation Control */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Device Sessions ({activeSessions.length})
                    </h4>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to log out of all active devices? All active tokens will be revoked.')) {
                        const res = await logoutAllDevices();
                        alert(res.message || 'Logged out of all devices.');
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of All Devices</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {activeSessions.length === 0 ? (
                    <div className="text-xs text-white/50 py-3 text-center">
                      No additional active session families tracked.
                    </div>
                  ) : (
                    activeSessions.map((s, idx) => (
                      <div
                        key={s.familyId || idx}
                        className="p-3 bg-slate-900/60 border border-white/10 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">IP: {s.ip || '127.0.0.1'}</span>
                              {s.isCurrentSession && (
                                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/50 truncate max-w-xs mt-0.5">
                              {s.userAgent || 'Web Browser'} • Sequence #{s.currentSeq}
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-white/40">
                          <div>Created: {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div>Rotated: {new Date(s.lastRotatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Security Audit Log */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Security & Auth Audit Logs
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-300/70 font-mono">Real-Time Event Stream</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                  {securityLogs.length === 0 ? (
                    <div className="p-3 text-center text-xs text-white/40">
                      No security audit events recorded yet.
                    </div>
                  ) : (
                    securityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-900/80 border border-white/5 rounded-xl flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          {log.severity === 'CRITICAL' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-white">{log.event}</span>
                            <span className="text-white/60 ml-2">{log.details}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
