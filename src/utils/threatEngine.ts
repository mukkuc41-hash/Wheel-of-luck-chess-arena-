import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { PieceElementCode } from './cinematicVfx';

export interface AttackerInfo {
  piece: PieceSymbol;
  square: Square;
  color: Color;
}

export interface SquareThreatData {
  square: Square;
  pieceType: PieceSymbol;
  pieceColor: Color;
  pieceCode: PieceElementCode;
  attackerCount: number;
  attackers: AttackerInfo[];
  isHighStress: boolean; // 3 or more attackers
  isExtremeStress: boolean; // 4+ attackers
  threatRatio: number; // attackers vs defenders
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function sqToCoords(sq: Square): { r: number; f: number } {
  const f = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = 8 - parseInt(sq[1], 10);
  return { r, f };
}

function coordsToSq(r: number, f: number): Square | null {
  if (r < 0 || r > 7 || f < 0 || f > 7) return null;
  return `${FILES[f]}${8 - r}` as Square;
}

/**
 * Accurately calculate all enemy attackers targeting a given square on the chess board.
 */
export function calculateSquareThreats(chess: Chess, targetSquare: Square): SquareThreatData | null {
  const targetPiece = chess.get(targetSquare);
  if (!targetPiece) return null;

  const targetColor = targetPiece.color;
  const enemyColor: Color = targetColor === 'w' ? 'b' : 'w';
  const { r: tr, f: tf } = sqToCoords(targetSquare);
  const attackers: AttackerInfo[] = [];

  const board = chess.board();

  // 1. Knights (8 L-offsets)
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, df] of knightOffsets) {
    const nr = tr + dr;
    const nf = tf + df;
    if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
      const p = board[nr][nf];
      if (p && p.color === enemyColor && p.type === 'n') {
        const sq = coordsToSq(nr, nf);
        if (sq) attackers.push({ piece: 'n', square: sq, color: enemyColor });
      }
    }
  }

  // 2. Pawns
  // If target is White ('w'), attacker is Black ('b') attacking diagonally down (from r - 1 to r)
  // If target is Black ('b'), attacker is White ('w') attacking diagonally up (from r + 1 to r)
  const pawnRankOffset = targetColor === 'w' ? -1 : 1;
  const pawnAttackRank = tr + pawnRankOffset;
  if (pawnAttackRank >= 0 && pawnAttackRank < 8) {
    for (const pawnFileOffset of [-1, 1]) {
      const pawnFile = tf + pawnFileOffset;
      if (pawnFile >= 0 && pawnFile < 8) {
        const p = board[pawnAttackRank][pawnFile];
        if (p && p.color === enemyColor && p.type === 'p') {
          const sq = coordsToSq(pawnAttackRank, pawnFile);
          if (sq) attackers.push({ piece: 'p', square: sq, color: enemyColor });
        }
      }
    }
  }

  // 3. Orthogonal Rays (Rooks & Queens)
  const orthogonalDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, df] of orthogonalDirs) {
    let step = 1;
    while (true) {
      const nr = tr + dr * step;
      const nf = tf + df * step;
      if (nr < 0 || nr > 7 || nf < 0 || nf > 7) break;
      const p = board[nr][nf];
      if (p) {
        if (p.color === enemyColor && (p.type === 'r' || p.type === 'q')) {
          const sq = coordsToSq(nr, nf);
          if (sq) attackers.push({ piece: p.type, square: sq, color: enemyColor });
        }
        break; // Hit a piece, ray stops
      }
      step++;
    }
  }

  // 4. Diagonal Rays (Bishops & Queens)
  const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, df] of diagonalDirs) {
    let step = 1;
    while (true) {
      const nr = tr + dr * step;
      const nf = tf + df * step;
      if (nr < 0 || nr > 7 || nf < 0 || nf > 7) break;
      const p = board[nr][nf];
      if (p) {
        if (p.color === enemyColor && (p.type === 'b' || p.type === 'q')) {
          const sq = coordsToSq(nr, nf);
          if (sq) attackers.push({ piece: p.type, square: sq, color: enemyColor });
        }
        break; // Hit a piece, ray stops
      }
      step++;
    }
  }

  // 5. King (Adjacent 8 squares)
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  for (const [dr, df] of kingOffsets) {
    const nr = tr + dr;
    const nf = tf + df;
    if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
      const p = board[nr][nf];
      if (p && p.color === enemyColor && p.type === 'k') {
        const sq = coordsToSq(nr, nf);
        if (sq) attackers.push({ piece: 'k', square: sq, color: enemyColor });
      }
    }
  }

  const pieceCode = targetPiece.type.toUpperCase() as PieceElementCode;
  const isHighStress = attackers.length >= 3;
  const isExtremeStress = attackers.length >= 4;

  return {
    square: targetSquare,
    pieceType: targetPiece.type,
    pieceColor: targetColor,
    pieceCode,
    attackerCount: attackers.length,
    attackers,
    isHighStress,
    isExtremeStress,
    threatRatio: attackers.length,
  };
}

/**
 * Scan all 64 squares on the board and return all pieces currently under high-stress conditions (>= 3 attackers).
 */
export function scanBoardForHighStressThreats(chess: Chess): SquareThreatData[] {
  const highStressPieces: SquareThreatData[] = [];
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const sq = coordsToSq(r, c);
        if (sq) {
          const threat = calculateSquareThreats(chess, sq);
          if (threat && threat.isHighStress) {
            highStressPieces.push(threat);
          }
        }
      }
    }
  }

  return highStressPieces;
}
