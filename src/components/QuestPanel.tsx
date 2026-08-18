import React, { useState, useEffect } from 'react';
import {
  Award,
  Flame,
  CheckCircle2,
  Sparkles,
  Gift,
  Coins,
  Swords,
  Shield,
  Zap,
  Crown,
  RefreshCw,
  Clock,
  RotateCw,
  X,
  Target,
} from 'lucide-react';
import {
  getActiveRandomQuests,
  claimQuestReward,
  generateRandomQuests,
  getUserPoints,
  getHatrickState,
  checkDailyWheelStatus,
  RandomQuest,
  HatrickState,
} from '../utils/pointsManager';
import { playCinematicSound } from '../utils/cinematicVfx';
import { soundFx } from '../utils/audio';

interface QuestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyWheel?: () => void;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  isOpen,
  onClose,
  onOpenDailyWheel,
}) => {
  const [quests, setQuests] = useState<RandomQuest[]>([]);
  const [points, setPoints] = useState<number>(getUserPoints());
  const [hatrickState, setHatrickState] = useState<HatrickState>(getHatrickState());
  const [wheelStatus, setWheelStatus] = useState(() => checkDailyWheelStatus());
  const [activeTab, setActiveTab] = useState<'quests' | 'hatrick' | 'wheel'>('quests');
  const [claimToast, setClaimToast] = useState<string | null>(null);

  // Sync state on open and on custom events
  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      setQuests(getActiveRandomQuests());
      setPoints(getUserPoints());
      setHatrickState(getHatrickState());
      setWheelStatus(checkDailyWheelStatus());
    };

    refreshData();

    const handlePointsUpdate = () => refreshData();
    const handleQuestsUpdate = () => refreshData();
    const handleHatrickUpdate = () => refreshData();

    window.addEventListener('chess_points_updated', handlePointsUpdate);
    window.addEventListener('chess_quests_updated', handleQuestsUpdate);
    window.addEventListener('chess_hatrick_achieved', handleHatrickUpdate);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdate);
      window.removeEventListener('chess_quests_updated', handleQuestsUpdate);
      window.removeEventListener('chess_hatrick_achieved', handleHatrickUpdate);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = (quest: RandomQuest) => {
    const reward = claimQuestReward(quest.id);
    if (reward > 0) {
      playCinematicSound('checkmate');
      soundFx.playGameOver(true);
      setClaimToast(`Claimed +${(reward ?? 0).toLocaleString()} PTS for "${quest.title}"!`);
      setTimeout(() => setClaimToast(null), 3500);
      setQuests(getActiveRandomQuests());
      setPoints(getUserPoints());
    }
  };

  const handleReroll = () => {
    generateRandomQuests();
    setQuests(getActiveRandomQuests());
    playCinematicSound('whoosh');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#12141c] border border-amber-500/30 backdrop-blur-2xl rounded-3xl max-w-2xl w-full flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Task &amp; Points Reward Center</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                  Points Rules Active
                </span>
              </h2>
              <p className="text-xs text-amber-200/70">
                Points are earned strictly through Daily Wheel, Simultaneous Hatricks &amp; Random Quests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Points Wallet & Navigation Bar */}
        <div className="p-3 sm:px-5 bg-[#0e1017] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Wallet</div>
              <div className="text-base font-extrabold text-amber-300 font-mono leading-none">
                {(points ?? 0).toLocaleString()} PTS
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('quests')}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 ${
                activeTab === 'quests'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Random Quests ({quests.filter((q) => q.completed && !q.claimed).length ? 'Ready!' : quests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hatrick')}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 ${
                activeTab === 'hatrick'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hatrick ({hatrickState.currentCaptureStreak}/3)</span>
            </button>

            <button
              onClick={() => {
                if (onOpenDailyWheel) {
                  onClose();
                  onOpenDailyWheel();
                } else {
                  setActiveTab('wheel');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 ${
                activeTab === 'wheel'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Daily Wheel</span>
            </button>
          </div>
        </div>

        {/* Claim Notification Banner */}
        {claimToast && (
          <div className="bg-emerald-500/20 border-b border-emerald-400/40 px-4 py-2 text-center text-xs font-black text-emerald-300 animate-fadeIn">
            🎉 {claimToast}
          </div>
        )}

        {/* TAB 1: RANDOM QUESTS */}
        {activeTab === 'quests' && (
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[55vh]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Random Quests (Updated Daily)</span>
              </span>
              <button
                onClick={handleReroll}
                className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                title="Generate new set of random quests"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reroll Quests</span>
              </button>
            </div>

            {quests.map((quest) => {
              const progressPct = Math.min(100, (quest.current / quest.target) * 100);

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    quest.claimed
                      ? 'bg-slate-900/40 border-white/5 opacity-75'
                      : quest.completed
                      ? 'bg-emerald-950/30 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{quest.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          quest.difficulty === 'Hard'
                            ? 'bg-red-500/20 text-red-300 border-red-400/30'
                            : quest.difficulty === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                        }`}
                      >
                        {quest.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black font-mono">
                        +{((quest?.rewardPts) ?? 0).toLocaleString()} PTS
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{quest.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Progress</span>
                        <span>
                          {quest.current} / {quest.target} ({Math.round(progressPct)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            quest.completed
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="shrink-0">
                    {quest.claimed ? (
                      <span className="px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Claimed</span>
                      </span>
                    ) : quest.completed ? (
                      <button
                        onClick={() => handleClaim(quest)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(46,204,113,0.4)] animate-bounce"
                      >
                        <Gift className="w-4 h-4" />
                        <span>CLAIM +{quest.rewardPts} PTS</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold block text-center">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: HATRICK IN-GAME TRACKER */}
        {activeTab === 'hatrick' && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[55vh]">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Simultaneous Hatrick Challenge</h3>
                    <p className="text-xs text-emerald-300/80">
                      Deliver 3 consecutive captures in a match without reply to trigger an instant +2,000 PTS award!
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black font-mono">
                  +2,000 PTS
                </span>
              </div>

              {/* Progress Steps (1, 2, 3) */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {[1, 2, 3].map((step) => {
                  const isDone = hatrickState.currentCaptureStreak >= step;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-black/30 border-white/10 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase">Capture #{step}</span>
                      <span className="text-base font-black font-mono">
                        {isDone ? '✓ DONE' : 'WAITING'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                <span>Hatricks achieved this session:</span>
                <span className="font-extrabold text-emerald-400 font-mono">
                  {hatrickState?.hatricksCompletedInSession ?? 0} Completed (Total: +{(((hatrickState?.hatricksCompletedInSession ?? 0) * 2000)).toLocaleString()} PTS)
                </span>
              </div>
            </div>

            {/* How it works info */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hatrick Reward Rules:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Make 3 piece captures during active gameplay in a single match.</li>
                <li>Points (+2,000 PTS) are credited immediately with sound and notification.</li>
                <li>Streak resets upon completing each Hatrick, allowing unlimited successive earning in new encounters.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY WHEEL ACCESS */}
        {activeTab === 'wheel' && (
          <div className="p-5 flex flex-col items-center justify-center text-center space-y-4 max-h-[55vh]">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Gift className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Daily Lucky Spin Wheel</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Spin once every 24 hours to win 250 to 5,000 PTS. Free for all active players!
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onOpenDailyWheel) onOpenDailyWheel();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] transition active:scale-95 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Launch Daily Wheel Now</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-[#0d0f14] border-t border-white/10 text-center text-[11px] text-slate-400">
          Earned Points can be spent in the 96-Item Master Customization Hub for exclusive capture &amp; occupying styles.
        </div>
      </div>
    </div>
  );
};
