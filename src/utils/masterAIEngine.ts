// Master AI Difficulty Progression Architecture v3.0.0

export interface DifficultyTierInfo {
  level: number;
  name: string;
  targetWinProbHuman: number;
}

export interface GameEngineProfile {
  gameId: string;
  name: string;
  searchDepthPlies: Record<number, number>;
  errorInjectionRate: Record<number, number>;
  level8Parameters: {
    winVector: string;
    winProbability: number;
    tablebase: string;
  };
}

export const DIFFICULTY_TIERS: DifficultyTierInfo[] = [
  { level: 1, name: 'Novice / Casual', targetWinProbHuman: 0.850 },
  { level: 2, name: 'Easy / Learner', targetWinProbHuman: 0.700 },
  { level: 3, name: 'Medium / Intermediate', targetWinProbHuman: 0.500 },
  { level: 4, name: 'Challenging / Advanced', targetWinProbHuman: 0.350 },
  { level: 5, name: 'Expert / Veteran', targetWinProbHuman: 0.200 },
  { level: 6, name: 'Master / Elite', targetWinProbHuman: 0.080 },
  { level: 7, name: 'Grandmaster / Tactical Genius', targetWinProbHuman: 0.020 },
  { level: 8, name: 'Quantum God / Impossible', targetWinProbHuman: 0.001 },
];

export const GAME_ENGINE_PROFILES: Record<string, GameEngineProfile> = {
  chess: {
    gameId: 'chess',
    name: 'Chess',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 16, 8: 30 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.08, 5: 0.03, 6: 0.01, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Flawless theoretical draw or micro-second search horizon truncation capitalization.',
      winProbability: 0.001,
      tablebase: '7-piece endgame tablebase enabled',
    },
  },
  draughts: {
    gameId: 'draughts',
    name: 'Draughts (Checkers)',
    searchDepthPlies: { 1: 1, 2: 2, 3: 4, 4: 6, 5: 8, 6: 12, 7: 20, 8: 32 },
    errorInjectionRate: { 1: 0.40, 2: 0.25, 3: 0.12, 4: 0.06, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Unorthodox corner zugzwang across a 150+ move sequence without sub-optimal steps.',
      winProbability: 0.001,
      tablebase: 'Fully solved state space lockdown',
    },
  },
  backgammon: {
    gameId: 'backgammon',
    name: 'Backgammon',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 6, 8: 8 },
    errorInjectionRate: { 1: 0.50, 2: 0.35, 3: 0.20, 4: 0.10, 5: 0.04, 6: 0.01, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Improbable consecutive high double rolls with worst-case AI cube efficiency.',
      winProbability: 0.001,
      tablebase: 'Neural net probability distribution & equity evaluator',
    },
  },
  ludo: {
    gameId: 'ludo',
    name: 'Ludo',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.18, 4: 0.09, 5: 0.03, 6: 0.01, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Unbroken string of high doubles bypassing blocked home-column defenses.',
      winProbability: 0.001,
      tablebase: 'Probability-weighted 4-dice trajectory matrix',
    },
  },
  snakes_and_ladders: {
    gameId: 'snakes_and_ladders',
    name: 'Snakes & Ladders',
    searchDepthPlies: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
    errorInjectionRate: { 1: 0.00, 2: 0.00, 3: 0.00, 4: 0.00, 5: 0.00, 6: 0.00, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Pure statistical outlier landing exclusively on ladders and missing every snake head.',
      winProbability: 0.001,
      tablebase: 'Predictive statistical dice modeling',
    },
  },
  gomoku: {
    gameId: 'gomoku',
    name: 'Gomoku (Five in a Row)',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 12, 8: 20 },
    errorInjectionRate: { 1: 0.50, 2: 0.30, 3: 0.15, 4: 0.07, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Dual-threat matrix forcing split defense before AI closes attacking line.',
      winProbability: 0.001,
      tablebase: 'Intersecting geometric threat evaluator',
    },
  },
  reversi: {
    gameId: 'reversi',
    name: 'Reversi (Othello)',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 10, 7: 16, 8: 60 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.07, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Seizing absolute corner control on turn 4 with a 1-disc endgame advantage.',
      winProbability: 0.001,
      tablebase: 'Complete endgame parity solver',
    },
  },
  connect_four: {
    gameId: 'connect_four',
    name: 'Connect Four',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 14, 8: 42 },
    errorInjectionRate: { 1: 0.40, 2: 0.25, 3: 0.12, 4: 0.05, 5: 0.01, 6: 0.00, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Executing the single known perfect opening trap as player two against optimal play.',
      winProbability: 0.001,
      tablebase: 'Solved-state algorithmic matrix',
    },
  },
  ultimate_tictactoe: {
    gameId: 'ultimate_tictactoe',
    name: 'Ultimate Tic-Tac-Toe',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 9, 7: 12, 8: 18 },
    errorInjectionRate: { 1: 0.45, 2: 0.28, 3: 0.14, 4: 0.06, 5: 0.02, 6: 0.00, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Capitalizing on a simulated human-error handicap window (Strict mathematical ceiling).',
      winProbability: 0.000,
      tablebase: 'Simultaneous 9 sub-grid minimax evaluation tree',
    },
  },
  dots_and_boxes: {
    gameId: 'dots_and_boxes',
    name: 'Dots and Boxes',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 6, 7: 10, 8: 16 },
    errorInjectionRate: { 1: 0.50, 2: 0.35, 3: 0.18, 4: 0.08, 5: 0.03, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Flawless chain-splitting sacrifice strategy exploiting AI parity miscalculation.',
      winProbability: 0.001,
      tablebase: 'Mathematical graph-theory chain evaluation',
    },
  },
  battleship: {
    gameId: 'battleship',
    name: 'Battleship',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 },
    errorInjectionRate: { 1: 0.55, 2: 0.40, 3: 0.20, 4: 0.10, 5: 0.03, 6: 0.01, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Pure random guessing allocation victory on final remaining 50/50 grid coordinate tile.',
      winProbability: 0.001,
      tablebase: 'Advanced probabilistic Bayesian hunting algorithm',
    },
  },
  sim_triangle: {
    gameId: 'sim_triangle',
    name: 'Sim (Triangle Game)',
    searchDepthPlies: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 15 },
    errorInjectionRate: { 1: 0.40, 2: 0.25, 3: 0.12, 4: 0.05, 5: 0.01, 6: 0.00, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Triggering an intentional symmetry trap built into the graph\'s opening line.',
      winProbability: 0.001,
      tablebase: 'Ramsey theory combinatorial graph evaluation',
    },
  },
  uno: {
    gameId: 'uno',
    name: 'Uno (Crazy Eights)',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.07, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Multi-player alliance coordination forcing AI through a depleted deck cascade.',
      winProbability: 0.001,
      tablebase: 'Multi-agent 10-player probabilistic hand tracking',
    },
  },
  hearts: {
    gameId: 'hearts',
    name: 'Hearts',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.07, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Stealthy high-risk \'Shoot the Moon\' maneuver bypassing defensive suit-blocking.',
      winProbability: 0.001,
      tablebase: 'Full probabilistic 52-card tracking matrix',
    },
  },
  gin_rummy: {
    gameId: 'gin_rummy',
    name: 'Gin Rummy',
    searchDepthPlies: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 8 },
    errorInjectionRate: { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.07, 5: 0.02, 6: 0.005, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Miracle gin or low-count knock beating AI deadwood margin by 1 point.',
      winProbability: 0.001,
      tablebase: 'Combinatorial meld matrix & real-time opponent reconstruction',
    },
  },
  speed_spit: {
    gameId: 'speed_spit',
    name: 'Speed (Spit)',
    searchDepthPlies: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 4, 8: 5 },
    errorInjectionRate: { 1: 0.50, 2: 0.35, 3: 0.20, 4: 0.10, 5: 0.04, 6: 0.01, 7: 0.00, 8: 0.00 },
    level8Parameters: {
      winVector: 'Inputting card moves faster than AI reaction thread window during transitions.',
      winProbability: 0.001,
      tablebase: 'Sub-millisecond optical recognition & hardware-frame execution',
    },
  },
};

export function getEngineProfile(gameId: string): GameEngineProfile {
  return GAME_ENGINE_PROFILES[gameId] || GAME_ENGINE_PROFILES.chess;
}

export function shouldInjectError(gameId: string, level: number): boolean {
  const profile = getEngineProfile(gameId);
  const errorRate = profile.errorInjectionRate[level] ?? 0;
  return Math.random() < errorRate;
}

export function getSearchDepth(gameId: string, level: number): number {
  const profile = getEngineProfile(gameId);
  return profile.searchDepthPlies[level] ?? 1;
}
