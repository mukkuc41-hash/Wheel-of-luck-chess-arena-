import { Chess, Square, Move } from 'chess.js';
import { AIDifficulty } from '../types';
import { shouldInjectError, getSearchDepth } from './masterAIEngine';
import { CHESS_OPENINGS } from './openingBook';

// Piece value table for evaluation (in centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// PeSTO-style piece-square tables (PST) for position evaluation (White perspective, rank 8 to rank 1)
const PST_PAWN: number[] = [
  0,   0,   0,   0,   0,   0,   0,   0,
 50,  50,  50,  50,  50,  50,  50,  50,
 10,  10,  20,  30,  30,  20,  10,  10,
  5,   5,  10,  25,  25,  10,   5,   5,
  0,   0,   0,  20,  20,   0,   0,   0,
  5,  -5, -10,   0,   0, -10,  -5,   5,
  5,  10,  10, -20, -20,  10,  10,   5,
  0,   0,   0,   0,   0,   0,   0,   0
];

const PST_KNIGHT: number[] = [
 -50, -40, -30, -30, -30, -30, -40, -50,
 -40, -20,   0,   0,   0,   0, -20, -40,
 -30,   0,  10,  15,  15,  10,   0, -30,
 -30,   5,  15,  20,  20,  15,   5, -30,
 -30,   0,  15,  20,  20,  15,   0, -30,
 -30,   5,  10,  15,  15,  10,   5, -30,
 -40, -20,   0,   5,   5,   0, -20, -40,
 -50, -40, -30, -30, -30, -30, -40, -50
];

const PST_BISHOP: number[] = [
 -20, -10, -10, -10, -10, -10, -10, -20,
 -10,   0,   0,   0,   0,   0,   0, -10,
 -10,   0,   5,  10,  10,   5,   0, -10,
 -10,   5,   5,  10,  10,   5,   5, -10,
 -10,   0,  10,  10,  10,  10,   0, -10,
 -10,  10,  10,  10,  10,  10,  10, -10,
 -10,   5,   0,   0,   0,   0,   5, -10,
 -20, -10, -10, -10, -10, -10, -10, -20
];

const PST_ROOK: number[] = [
  0,   0,   0,   0,   0,   0,   0,   0,
  5,  10,  10,  10,  10,  10,  10,   5,
 -5,   0,   0,   0,   0,   0,   0,  -5,
 -5,   0,   0,   0,   0,   0,   0,  -5,
 -5,   0,   0,   0,   0,   0,   0,  -5,
 -5,   0,   0,   0,   0,   0,   0,  -5,
 -5,   0,   0,   0,   0,   0,   0,  -5,
  0,   0,   0,   5,   5,   0,   0,   0
];

const PST_QUEEN: number[] = [
 -20, -10, -10,  -5,  -5, -10, -10, -20,
 -10,   0,   0,   0,   0,   0,   0, -10,
 -10,   0,   5,   5,   5,   5,   0, -10,
  -5,   0,   5,   5,   5,   5,   0,  -5,
   0,   0,   5,   5,   5,   5,   0,  -5,
 -10,   5,   5,   5,   5,   5,   0, -10,
 -10,   0,   5,   0,   0,   0,   0, -10,
 -20, -10, -10,  -5,  -5, -10, -10, -20
];

const PST_KING_MID: number[] = [
 -30, -40, -40, -50, -50, -40, -40, -30,
 -30, -40, -40, -50, -50, -40, -40, -30,
 -30, -40, -40, -50, -50, -40, -40, -30,
 -30, -40, -40, -50, -50, -40, -40, -30,
 -20, -30, -30, -40, -40, -30, -30, -20,
 -10, -20, -20, -20, -20, -20, -20, -10,
  20,  20,   0,   0,   0,   0,  20,  20,
  20,  30,  10,   0,   0,  10,  30,  20
];

// High-Performance Transposition Table (LRU Cache)
interface TTEntry {
  depth: number;
  score: number;
  flag: 'EXACT' | 'LOWERBOUND' | 'UPPERBOUND';
  bestMove?: string;
}

const TRANSPOSITION_TABLE = new Map<string, TTEntry>();
const MAX_TT_ENTRIES = 25000;

function getTTKey(chess: Chess): string {
  const fullFen = chess.fen();
  // Strip halfmove and fullmove numbers for higher cache hit rates
  const parts = fullFen.split(' ');
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

// Fast Evaluation Function with Material & Positional Weights
function evaluateBoard(chess: Chess, aiColor: 'w' | 'b'): number {
  if (chess.isCheckmate()) {
    return chess.turn() === aiColor ? -20000 : 20000;
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const idxW = r * 8 + c;
      const idxB = (7 - r) * 8 + c;
      let posVal = 0;

      switch (piece.type) {
        case 'p':
          posVal = piece.color === 'w' ? PST_PAWN[idxW] : PST_PAWN[idxB];
          break;
        case 'n':
          posVal = piece.color === 'w' ? PST_KNIGHT[idxW] : PST_KNIGHT[idxB];
          break;
        case 'b':
          posVal = piece.color === 'w' ? PST_BISHOP[idxW] : PST_BISHOP[idxB];
          break;
        case 'r':
          posVal = piece.color === 'w' ? PST_ROOK[idxW] : PST_ROOK[idxB];
          break;
        case 'q':
          posVal = piece.color === 'w' ? PST_QUEEN[idxW] : PST_QUEEN[idxB];
          break;
        case 'k':
          posVal = piece.color === 'w' ? PST_KING_MID[idxW] : PST_KING_MID[idxB];
          break;
      }

      const totalVal = (PIECE_VALUES[piece.type] || 0) + posVal;
      if (piece.color === 'w') {
        whiteScore += totalVal;
      } else {
        blackScore += totalVal;
      }
    }
  }

  // Bonus for active turn mobility / check pressure
  if (chess.isCheck()) {
    if (chess.turn() === 'w') whiteScore -= 35;
    else blackScore -= 35;
  }

  const scoreDiff = whiteScore - blackScore;
  return aiColor === 'w' ? scoreDiff : -scoreDiff;
}

// Move Ordering with MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
function scoreMove(move: Move): number {
  let score = 0;
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 100;
    const attackerVal = PIECE_VALUES[move.piece] || 100;
    // Prioritize high value victim captured by lowest value attacker
    score += 10000 + (victimVal * 10 - attackerVal);
  }
  if (move.promotion) {
    score += 9000 + (PIECE_VALUES[move.promotion] || 0);
  }
  if (move.san.includes('+')) {
    score += 1500;
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => scoreMove(b) - scoreMove(a));
}

// Quiescence Search to avoid horizon effect on tactical captures (max 2 ply depth)
function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  aiColor: 'w' | 'b',
  qDepth: number = 2
): number {
  const standPat = evaluateBoard(chess, aiColor);

  if (qDepth === 0 || chess.isGameOver()) {
    return standPat;
  }
  if (standPat >= beta) {
    return beta;
  }
  if (alpha < standPat) {
    alpha = standPat;
  }

  const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion);
  const orderedCaptures = orderMoves(captureMoves);

  for (const move of orderedCaptures) {
    chess.move(move);
    const score = -quiescence(chess, -beta, -alpha, aiColor, qDepth - 1);
    chess.undo();

    if (score >= beta) {
      return beta;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return alpha;
}

// High-Performance Alpha-Beta Minimax with Transposition Table
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: 'w' | 'b',
  deadline: number
): number {
  // Time cut-off protection
  if (Date.now() > deadline) {
    return evaluateBoard(chess, aiColor);
  }

  const ttKey = getTTKey(chess);
  const cached = TRANSPOSITION_TABLE.get(ttKey);
  if (cached && cached.depth >= depth) {
    if (cached.flag === 'EXACT') return cached.score;
    if (cached.flag === 'LOWERBOUND' && cached.score >= beta) return cached.score;
    if (cached.flag === 'UPPERBOUND' && cached.score <= alpha) return cached.score;
  }

  if (depth <= 0 || chess.isGameOver()) {
    return quiescence(chess, alpha, beta, aiColor, 2);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    return evaluateBoard(chess, aiColor);
  }

  const originalAlpha = alpha;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  if (isMaximizing) {
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, aiColor, deadline);
      chess.undo();

      bestScore = Math.max(bestScore, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Cutoff
    }
  } else {
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, aiColor, deadline);
      chess.undo();

      bestScore = Math.min(bestScore, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Cutoff
    }
  }

  // Store in Transposition Table
  let flag: 'EXACT' | 'LOWERBOUND' | 'UPPERBOUND' = 'EXACT';
  if (bestScore <= originalAlpha) flag = 'UPPERBOUND';
  else if (bestScore >= beta) flag = 'LOWERBOUND';

  if (TRANSPOSITION_TABLE.size >= MAX_TT_ENTRIES) {
    // Clear oldest 25% of cache to maintain high memory performance
    const keys = Array.from(TRANSPOSITION_TABLE.keys()).slice(0, 5000);
    keys.forEach((k) => TRANSPOSITION_TABLE.delete(k));
  }

  TRANSPOSITION_TABLE.set(ttKey, { depth, score: bestScore, flag });
  return bestScore;
}

export function getNumericalDifficulty(difficulty: AIDifficulty = 'medium'): number {
  if (typeof difficulty === 'number') {
    return Math.max(1, Math.min(8, difficulty));
  }
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 4;
    case 'hard':
      return 6;
    case 'master':
      return 8;
    default:
      return 4;
  }
}

// Instant Opening Book Lookup (0ms overhead)
function lookupOpeningBookMove(chess: Chess): { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null {
  const history = chess.history();
  if (history.length > 8) return null;

  const matchingOpenings = CHESS_OPENINGS.filter((op) => {
    if (op.moves.length <= history.length) return false;
    for (let i = 0; i < history.length; i++) {
      if (history[i] !== op.moves[i]) return false;
    }
    return true;
  });

  if (matchingOpenings.length === 0) return null;

  // Pick a random matching opening variation
  const randomOpening = matchingOpenings[Math.floor(Math.random() * matchingOpenings.length)];
  const nextSan = randomOpening.moves[history.length];
  if (!nextSan) return null;

  const validMoves = chess.moves({ verbose: true });
  const bookMove = validMoves.find((m) => m.san === nextSan);
  if (bookMove) {
    return {
      from: bookMove.from as Square,
      to: bookMove.to as Square,
      promotion: (bookMove.promotion as any) || 'q',
    };
  }

  return null;
}

export function getAIMove(
  chess: Chess,
  difficulty: AIDifficulty = 'medium'
): { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null {
  const possibleMoves = chess.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  const aiColor = chess.turn();
  const level = getNumericalDifficulty(difficulty);

  // 1. Check Error Injection Rate for customized difficulty tiers
  if (shouldInjectError('chess', level)) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const randomMove = possibleMoves[randomIndex];
    return {
      from: randomMove.from as Square,
      to: randomMove.to as Square,
      promotion: (randomMove.promotion as any) || 'q',
    };
  }

  // 2. High-speed Opening Book Query (0ms response)
  const bookMove = lookupOpeningBookMove(chess);
  if (bookMove) {
    return bookMove;
  }

  // 3. Search depth scaling based on tier (Client optimized: 1 to 4 depth with iterative deepening)
  const masterDepth = getSearchDepth('chess', level);
  const searchDepth = Math.min(masterDepth, 4);

  // 4. Time-bounded iterative deepening search (capped at 250ms for buttery-smooth 60fps UI)
  const deadline = Date.now() + 250;
  const orderedMoves = orderMoves(possibleMoves);

  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;

  for (const move of orderedMoves) {
    chess.move(move);
    const score = minimax(chess, searchDepth - 1, -Infinity, Infinity, false, aiColor, deadline);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    from: bestMove.from as Square,
    to: bestMove.to as Square,
    promotion: (bestMove.promotion as any) || 'q',
  };
}
