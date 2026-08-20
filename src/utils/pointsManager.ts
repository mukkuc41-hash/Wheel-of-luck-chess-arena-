// Centralized Points, Daily Wheel, Hatrick & Random Quest Progression Engine

export interface RandomQuest {
  id: string;
  title: string;
  description: string;
  category: 'capture' | 'check' | 'castle' | 'promote' | 'win' | 'puzzle' | 'moves';
  target: number;
  current: number;
  rewardPts: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface HatrickState {
  currentCaptureStreak: number;
  targetStreak: number;
  hatricksCompletedInSession: number;
  lastHatrickTimestamp: number | null;
  recentHistory: string[];
}

const STORAGE_KEYS = {
  POINTS: 'chess_master_hub_points',
  LAST_WHEEL_SPIN: 'daily_wheel_last_spin_ts',
  RANDOM_QUESTS: 'chess_active_random_quests',
  QUESTS_DATE: 'chess_random_quests_date',
  HATRICK_STATE: 'chess_hatrick_session_state',
  RESET_FLAG: 'chess_master_hub_v4_reset_done',
};

const QUEST_POOL: Omit<RandomQuest, 'id' | 'current' | 'completed' | 'claimed'>[] = [
  {
    title: 'Knight Tactician',
    description: 'Capture 2 enemy pieces using your Knights in live play',
    category: 'capture',
    target: 2,
    rewardPts: 1200,
    iconName: 'Swords',
    difficulty: 'Medium',
  },
  {
    title: 'Castling Citadel',
    description: 'Successfully execute Kingside or Queenside Castling',
    category: 'castle',
    target: 1,
    rewardPts: 800,
    iconName: 'Shield',
    difficulty: 'Easy',
  },
  {
    title: 'Royal Inquisitor',
    description: 'Deliver 3 tactical checks to the opponent king',
    category: 'check',
    target: 3,
    rewardPts: 1500,
    iconName: 'Zap',
    difficulty: 'Medium',
  },
  {
    title: 'Grandmaster Checkmate',
    description: 'Win a match by delivering checkmate against AI or player',
    category: 'win',
    target: 1,
    rewardPts: 2500,
    iconName: 'Crown',
    difficulty: 'Hard',
  },
  {
    title: 'Pawn Transformation',
    description: 'Advance and promote a pawn to Queen or Knight',
    category: 'promote',
    target: 1,
    rewardPts: 2000,
    iconName: 'Sparkles',
    difficulty: 'Hard',
  },
  {
    title: 'Endurance Tactician',
    description: 'Play 15 solid chess moves in a single match session',
    category: 'moves',
    target: 15,
    rewardPts: 1000,
    iconName: 'Flame',
    difficulty: 'Easy',
  },
  {
    title: 'Tactical Puzzle Solver',
    description: 'Complete 2 daily chess puzzles or study positions',
    category: 'puzzle',
    target: 2,
    rewardPts: 1400,
    iconName: 'BookOpen',
    difficulty: 'Medium',
  },
  {
    title: 'Rook Vanguard',
    description: 'Capture 2 pieces with your Rooks across files',
    category: 'capture',
    target: 2,
    rewardPts: 1300,
    iconName: 'Layers',
    difficulty: 'Medium',
  },
];

// Event Dispatcher for Live UI Synchronization
export function notifyPointsUpdated(newPoints: number, reason?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_points_updated', {
        detail: { points: newPoints, reason },
      })
    );
  }
}

export function notifyHatrickAchieved(rewardPts: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_hatrick_achieved', {
        detail: { rewardPts, timestamp: Date.now() },
      })
    );
  }
}

export function notifyQuestUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chess_quests_updated'));
  }
}

// Auto Reset Execution on Startup (Ensures all players start fresh with 5,000 points & 0 unlocked purchases)
function ensureInitialReset() {
  if (typeof window === 'undefined') return;
  try {
    const isReset = localStorage.getItem(STORAGE_KEYS.RESET_FLAG);
    if (!isReset) {
      localStorage.setItem(STORAGE_KEYS.POINTS, '5000');
      localStorage.setItem('chess_master_hub_inventory', '{}');
      localStorage.setItem('chess_master_hub_equipped', '{}');
      localStorage.setItem(STORAGE_KEYS.RESET_FLAG, 'true');
    }
  } catch {
    // Ignore storage issues
  }
}
ensureInitialReset();

// Points Core
export function getUserPoints(): number {
  if (typeof window === 'undefined') return 5000;
  ensureInitialReset();
  const val = localStorage.getItem(STORAGE_KEYS.POINTS);
  if (!val) {
    localStorage.setItem(STORAGE_KEYS.POINTS, '5000');
    return 5000;
  }
  return parseInt(val, 10) || 0;
}

export function setUserPoints(pts: number, reason = 'Direct update'): void {
  if (typeof window === 'undefined') return;
  const sanitized = Math.max(0, pts);
  localStorage.setItem(STORAGE_KEYS.POINTS, sanitized.toString());
  notifyPointsUpdated(sanitized, reason);
}

export function resetAllPurchasesAndPoints(startingPoints = 5000): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.POINTS, startingPoints.toString());
  localStorage.setItem('chess_master_hub_inventory', '{}');
  localStorage.setItem('chess_master_hub_equipped', '{}');
  localStorage.setItem(STORAGE_KEYS.RESET_FLAG, 'true');
  notifyPointsUpdated(startingPoints, 'Purchases and points reset');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chess_equipped_effects_updated'));
  }
}

export function addPoints(amount: number, reason: string): number {
  const current = getUserPoints();
  const updated = current + amount;
  setUserPoints(updated, reason);
  return updated;
}

export function spendPoints(amount: number, reason: string): boolean {
  const current = getUserPoints();
  if (current < amount) return false;
  const updated = current - amount;
  setUserPoints(updated, reason);
  return true;
}

export function applyMatchLossPenalty(gameNameOrId: string = 'Match', penaltyAmount: number = 10000): {
  deducted: number;
  newBalance: number;
} {
  const current = getUserPoints();
  const newBalance = Math.max(0, current - penaltyAmount);
  setUserPoints(newBalance, `Loss penalty applied in ${gameNameOrId} (-${penaltyAmount.toLocaleString()} PTS)`);
  return {
    deducted: penaltyAmount,
    newBalance,
  };
}

// Daily Wheel Logic (Once every 24h, or cooldown countdown)
const DAILY_WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WheelSegmentConfig {
  segmentNumber: number; // 1 to 25
  label: string;
  shortLabel: string;
  points: number;
  weight: number; // For segments 1-24; Segment 25 is global trigger
  probabilityPercent: number;
  color: string;
  textColor: string;
  isJackpot?: boolean;
}

export const SEGMENTS_25_CONFIG: WheelSegmentConfig[] = [
  { segmentNumber: 1, label: '100 PTS', shortLabel: '100', points: 100, weight: 86.74, probabilityPercent: 8.324, color: '#0ea5e9', textColor: '#ffffff' },
  { segmentNumber: 2, label: '500 PTS', shortLabel: '500', points: 500, weight: 82.97, probabilityPercent: 7.962, color: '#8b5cf6', textColor: '#ffffff' },
  { segmentNumber: 3, label: '1,000 PTS', shortLabel: '1.0K', points: 1000, weight: 79.21, probabilityPercent: 7.600, color: '#10b981', textColor: '#ffffff' },
  { segmentNumber: 4, label: '1,500 PTS', shortLabel: '1.5K', points: 1500, weight: 75.44, probabilityPercent: 7.238, color: '#f59e0b', textColor: '#1a1a1a' },
  { segmentNumber: 5, label: '2,000 PTS', shortLabel: '2.0K', points: 2000, weight: 71.67, probabilityPercent: 6.876, color: '#ec4899', textColor: '#ffffff' },
  { segmentNumber: 6, label: '2,500 PTS', shortLabel: '2.5K', points: 2500, weight: 67.91, probabilityPercent: 6.515, color: '#6366f1', textColor: '#ffffff' },
  { segmentNumber: 7, label: '3,000 PTS', shortLabel: '3.0K', points: 3000, weight: 64.14, probabilityPercent: 6.153, color: '#14b8a6', textColor: '#ffffff' },
  { segmentNumber: 8, label: '3,500 PTS', shortLabel: '3.5K', points: 3500, weight: 60.37, probabilityPercent: 5.791, color: '#f97316', textColor: '#ffffff' },
  { segmentNumber: 9, label: '4,000 PTS', shortLabel: '4.0K', points: 4000, weight: 56.60, probabilityPercent: 5.429, color: '#a855f7', textColor: '#ffffff' },
  { segmentNumber: 10, label: '4,500 PTS', shortLabel: '4.5K', points: 4500, weight: 52.84, probabilityPercent: 5.067, color: '#06b6d4', textColor: '#1a1a1a' },
  { segmentNumber: 11, label: '5,000 PTS', shortLabel: '5.0K', points: 5000, weight: 49.07, probabilityPercent: 4.705, color: '#84cc16', textColor: '#1a1a1a' },
  { segmentNumber: 12, label: '5,500 PTS', shortLabel: '5.5K', points: 5500, weight: 45.30, probabilityPercent: 4.344, color: '#ef4444', textColor: '#ffffff' },
  { segmentNumber: 13, label: '6,000 PTS', shortLabel: '6.0K', points: 6000, weight: 41.54, probabilityPercent: 3.982, color: '#3b82f6', textColor: '#ffffff' },
  { segmentNumber: 14, label: '6,500 PTS', shortLabel: '6.5K', points: 6500, weight: 37.77, probabilityPercent: 3.620, color: '#d946ef', textColor: '#ffffff' },
  { segmentNumber: 15, label: '7,000 PTS', shortLabel: '7.0K', points: 7000, weight: 34.00, probabilityPercent: 3.258, color: '#10b981', textColor: '#ffffff' },
  { segmentNumber: 16, label: '7,500 PTS', shortLabel: '7.5K', points: 7500, weight: 30.24, probabilityPercent: 2.896, color: '#f59e0b', textColor: '#1a1a1a' },
  { segmentNumber: 17, label: '8,000 PTS', shortLabel: '8.0K', points: 8000, weight: 26.47, probabilityPercent: 2.534, color: '#ec4899', textColor: '#ffffff' },
  { segmentNumber: 18, label: '8,500 PTS', shortLabel: '8.5K', points: 8500, weight: 22.70, probabilityPercent: 2.173, color: '#6366f1', textColor: '#ffffff' },
  { segmentNumber: 19, label: '9,000 PTS', shortLabel: '9.0K', points: 9000, weight: 18.93, probabilityPercent: 1.811, color: '#0ea5e9', textColor: '#ffffff' },
  { segmentNumber: 20, label: '9,500 PTS', shortLabel: '9.5K', points: 9500, weight: 15.17, probabilityPercent: 1.449, color: '#f97316', textColor: '#ffffff' },
  { segmentNumber: 21, label: '10,000 PTS', shortLabel: '10K', points: 10000, weight: 11.40, probabilityPercent: 1.093, color: '#a855f7', textColor: '#ffffff' },
  { segmentNumber: 22, label: '10,500 PTS', shortLabel: '10.5K', points: 10500, weight: 7.63, probabilityPercent: 0.732, color: '#14b8a6', textColor: '#ffffff' },
  { segmentNumber: 23, label: '11,000 PTS', shortLabel: '11K', points: 11000, weight: 3.87, probabilityPercent: 0.371, color: '#d946ef', textColor: '#ffffff' },
  { segmentNumber: 24, label: '11,500 PTS', shortLabel: '11.5K', points: 11500, weight: 0.10, probabilityPercent: 0.010, color: '#ef4444', textColor: '#ffffff' },
  { segmentNumber: 25, label: '1,000,000 JACKPOT', shortLabel: '1M ★', points: 1000000, weight: 0, probabilityPercent: 0, color: '#ffd700', textColor: '#1a1003', isJackpot: true },
];

export interface GlobalJackpotAnnualState {
  currentYear: number;
  totalPlatformSpinsThisYear: number;
  jackpotWonThisYear: boolean;
  winningTicketNumber: number;
  winnerInfo?: {
    claimedTimestamp: number;
    pointsAwarded: number;
    yearCycle: number;
  };
}

const GLOBAL_JACKPOT_STORAGE_KEY = 'chess_global_annual_jackpot_state_v1';

export function getGlobalJackpotAnnualState(): GlobalJackpotAnnualState {
  const currentYear = new Date().getFullYear();
  const defaultState: GlobalJackpotAnnualState = {
    currentYear,
    totalPlatformSpinsThisYear: 0,
    jackpotWonThisYear: false,
    winningTicketNumber: ((currentYear * 2654435761) % 50000) + 1234, // Deterministic ticket seed for the 365-day cycle
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(GLOBAL_JACKPOT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GLOBAL_JACKPOT_STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    const parsed: GlobalJackpotAnnualState = JSON.parse(raw);
    if (parsed.currentYear !== currentYear) {
      // New 365-day annual cycle rollover
      const newState: GlobalJackpotAnnualState = {
        currentYear,
        totalPlatformSpinsThisYear: 0,
        jackpotWonThisYear: false,
        winningTicketNumber: ((currentYear * 2654435761) % 50000) + 1234,
      };
      localStorage.setItem(GLOBAL_JACKPOT_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    }
    return parsed;
  } catch {
    return defaultState;
  }
}

export function saveGlobalJackpotAnnualState(state: GlobalJackpotAnnualState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GLOBAL_JACKPOT_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('chess_global_jackpot_state_updated', { detail: state }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Determine the winning slice using the strict 25-segment specification:
 * 1. Global annual trigger check for Segment 25 (guarantees exactly 1 winner per 365-day cycle).
 * 2. If not the jackpot trigger, select from Segments 1 to 24 using exact inversely scaled weights (86.74 down to 0.10, total 1042.06).
 */
export function determineWinningWheelSlice(): { slice: WheelSegmentConfig; sliceIndex: number; isGlobalJackpotHit: boolean } {
  const annualState = getGlobalJackpotAnnualState();
  const nextSpinCount = annualState.totalPlatformSpinsThisYear + 1;
  annualState.totalPlatformSpinsThisYear = nextSpinCount;

  // Check Global Jackpot Trigger (Exactly 1 winner per year)
  if (!annualState.jackpotWonThisYear && nextSpinCount === annualState.winningTicketNumber) {
    annualState.jackpotWonThisYear = true;
    annualState.winnerInfo = {
      claimedTimestamp: Date.now(),
      pointsAwarded: 1000000,
      yearCycle: annualState.currentYear,
    };
    saveGlobalJackpotAnnualState(annualState);
    return {
      slice: SEGMENTS_25_CONFIG[24], // Segment 25 (1,000,000 JACKPOT)
      sliceIndex: 24,
      isGlobalJackpotHit: true,
    };
  }

  saveGlobalJackpotAnnualState(annualState);

  // Non-Jackpot Probability Distribution (Segments 1 to 24)
  const nonJackpotSegments = SEGMENTS_25_CONFIG.slice(0, 24);
  const totalWeight = nonJackpotSegments.reduce((acc, seg) => acc + seg.weight, 0); // 1042.06
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < nonJackpotSegments.length; i++) {
    cumulative += nonJackpotSegments[i].weight;
    if (rand <= cumulative || i === nonJackpotSegments.length - 1) {
      return {
        slice: nonJackpotSegments[i],
        sliceIndex: i,
        isGlobalJackpotHit: false,
      };
    }
  }

  return {
    slice: nonJackpotSegments[0],
    sliceIndex: 0,
    isGlobalJackpotHit: false,
  };
}

export function checkDailyWheelStatus(): {
  canSpin: boolean;
  remainingSeconds: number;
  lastSpinTimestamp: number | null;
} {
  if (typeof window === 'undefined') return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: null };
  const raw = localStorage.getItem(STORAGE_KEYS.LAST_WHEEL_SPIN);
  if (!raw) return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: null };

  const lastSpin = parseInt(raw, 10);
  const now = Date.now();
  const elapsed = now - lastSpin;

  if (elapsed >= DAILY_WHEEL_COOLDOWN_MS) {
    return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: lastSpin };
  }

  const remainingMs = DAILY_WHEEL_COOLDOWN_MS - elapsed;
  return {
    canSpin: false,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    lastSpinTimestamp: lastSpin,
  };
}

export function recordDailyWheelSpin(rewardAmount: number): number {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_WHEEL_SPIN, Date.now().toString());
  }
  return addPoints(rewardAmount, `Daily Wheel Spin (+${rewardAmount} PTS)`);
}

// Hatrick System (3 consecutive captures/tactics in a match)
export function getHatrickState(): HatrickState {
  if (typeof window === 'undefined') {
    return {
      currentCaptureStreak: 0,
      targetStreak: 3,
      hatricksCompletedInSession: 0,
      lastHatrickTimestamp: null,
      recentHistory: [],
    };
  }

  const raw = localStorage.getItem(STORAGE_KEYS.HATRICK_STATE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const defaultState: HatrickState = {
    currentCaptureStreak: 0,
    targetStreak: 3,
    hatricksCompletedInSession: 0,
    lastHatrickTimestamp: null,
    recentHistory: [],
  };
  return defaultState;
}

export function saveHatrickState(state: HatrickState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HATRICK_STATE, JSON.stringify(state));
  }
}

export function resetHatrickStreak() {
  const current = getHatrickState();
  current.currentCaptureStreak = 0;
  saveHatrickState(current);
  notifyQuestUpdated();
}

export function recordPlayerCaptureForHatrick(pieceName: string): {
  hatrickAchieved: boolean;
  currentStreak: number;
  rewardPts: number;
} {
  const state = getHatrickState();
  state.currentCaptureStreak += 1;
  state.recentHistory.push(`${pieceName} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);

  if (state.recentHistory.length > 10) state.recentHistory.shift();

  let hatrickAchieved = false;
  const rewardPts = 2000;

  if (state.currentCaptureStreak >= state.targetStreak) {
    hatrickAchieved = true;
    state.currentCaptureStreak = 0; // reset for next hatrick
    state.hatricksCompletedInSession += 1;
    state.lastHatrickTimestamp = Date.now();
    saveHatrickState(state);

    // Award +2,000 PTS
    addPoints(rewardPts, 'Simultaneous Hatrick in Match (+2,000 PTS)');
    notifyHatrickAchieved(rewardPts);
    return { hatrickAchieved: true, currentStreak: 3, rewardPts };
  }

  saveHatrickState(state);
  notifyQuestUpdated();
  return { hatrickAchieved: false, currentStreak: state.currentCaptureStreak, rewardPts: 0 };
}

// Random Quests Generator & Manager
export function getActiveRandomQuests(): RandomQuest[] {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(STORAGE_KEYS.RANDOM_QUESTS);
  const todayStr = new Date().toISOString().split('T')[0];
  const storedDate = localStorage.getItem(STORAGE_KEYS.QUESTS_DATE);

  if (raw && storedDate === todayStr) {
    try {
      return JSON.parse(raw);
    } catch {
      // re-generate
    }
  }

  // Generate 3 fresh random quests
  return generateRandomQuests();
}

export function generateRandomQuests(): RandomQuest[] {
  // Pick 3 unique random quests from the pool
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map((template, idx) => ({
    ...template,
    id: `quest_${Date.now()}_${idx}`,
    current: 0,
    completed: false,
    claimed: false,
  }));

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(selected));
    localStorage.setItem(STORAGE_KEYS.QUESTS_DATE, new Date().toISOString().split('T')[0]);
  }

  notifyQuestUpdated();
  return selected;
}

export function updateQuestProgress(
  category: RandomQuest['category'],
  amount = 1
): { questCompleted: boolean; completedQuestTitle?: string } {
  const quests = getActiveRandomQuests();
  let anyCompleted = false;
  let completedTitle = '';

  const updated = quests.map((q) => {
    if (q.category === category && !q.completed) {
      const nextVal = Math.min(q.target, q.current + amount);
      const isNowDone = nextVal >= q.target;
      if (isNowDone) {
        anyCompleted = true;
        completedTitle = q.title;
      }
      return {
        ...q,
        current: nextVal,
        completed: isNowDone,
      };
    }
    return q;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(updated));
  }

  notifyQuestUpdated();
  return { questCompleted: anyCompleted, completedQuestTitle: completedTitle };
}

export function claimQuestReward(questId: string): number {
  const quests = getActiveRandomQuests();
  let reward = 0;

  const updated = quests.map((q) => {
    if (q.id === questId && q.completed && !q.claimed) {
      reward = q.rewardPts;
      return { ...q, claimed: true };
    }
    return q;
  });

  if (reward > 0) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(updated));
    }
    addPoints(reward, `Completed Quest Reward (+${reward} PTS)`);
    notifyQuestUpdated();
  }

  return reward;
}
