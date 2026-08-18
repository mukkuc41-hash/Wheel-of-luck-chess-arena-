import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { PieceElementCode } from './cinematicVfx';

export interface AttackerInfo {
  piece: PieceSymbol;
  square: Square;
  color: Color;
}

export interface CryMatrixEvaluation {
  shouldCry: boolean;
  behaviorTitle: string;
  threatDescription: string;
  triggerPiece?: PieceSymbol;
}

export interface SquareThreatData {
  square: Square;
  pieceType: PieceSymbol;
  pieceColor: Color;
  pieceCode: PieceElementCode;
  attackerCount: number;
  attackers: AttackerInfo[];
  defenderCount: number;
  defenders: AttackerInfo[];
  isHighStress: boolean; // meets cry matrix or 3+ attackers
  isExtremeStress: boolean; // 4+ attackers
  threatRatio: number; // attackers vs defenders
  cryEvaluation: CryMatrixEvaluation;
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

function getPieceFullName(p?: PieceSymbol): string {
  switch (p) {
    case 'p': return 'Pawn';
    case 'n': return 'Knight';
    case 'b': return 'Bishop';
    case 'r': return 'Rook';
    case 'q': return 'Queen';
    case 'k': return 'King';
    default: return 'Piece';
  }
}

/**
 * Evaluates threat vectors against the 6 chess elements based on the exact Element Cry Matrix rules.
 */
export function evaluateElementCryMatrix(
  pieceType: PieceSymbol,
  attackers: AttackerInfo[],
  defenderCount: number
): CryMatrixEvaluation {
  if (attackers.length === 0) {
    return { shouldCry: false, behaviorTitle: '', threatDescription: '' };
  }

  const pType = pieceType.toLowerCase() as PieceSymbol;

  // 1. King Cry Rules: Cries when attacked by Queen, Rook, Bishop, Knight, Pawn
  if (pType === 'k') {
    const validAttacker = attackers.find((a) => ['q', 'r', 'b', 'n', 'p'].includes(a.piece));
    if (validAttacker || attackers.length > 0) {
      const attackerName = getPieceFullName(validAttacker?.piece || attackers[0].piece);
      return {
        shouldCry: true,
        behaviorTitle: 'Imperial Decree',
        threatDescription: `King is under direct attack by ${attackerName}! Anchoring authority with platinum-gold shield dome.`,
        triggerPiece: validAttacker?.piece || attackers[0].piece,
      };
    }
  }

  // 2. Queen Cry Rules: Cries when attacked by Bishop, Rook, Knight
  if (pType === 'q') {
    const validAttacker = attackers.find((a) => ['b', 'r', 'n'].includes(a.piece));
    if (validAttacker) {
      return {
        shouldCry: true,
        behaviorTitle: 'Sovereign Command',
        threatDescription: `Queen is targeted by enemy ${getPieceFullName(validAttacker.piece)}! Levitating with white-gold solar flare shockwaves.`,
        triggerPiece: validAttacker.piece,
      };
    }
  }

  // 3. Rook Cry Rules: Cries when attacked by Bishop, Knight, Queen, King
  if (pType === 'r') {
    const validAttacker = attackers.find((a) => ['b', 'n', 'q', 'k'].includes(a.piece));
    if (validAttacker) {
      return {
        shouldCry: true,
        behaviorTitle: 'Siege Siren',
        threatDescription: `Rook fortress breached by enemy ${getPieceFullName(validAttacker.piece)}! Battlement horn sirens flaring over molten magma fissure.`,
        triggerPiece: validAttacker.piece,
      };
    }
  }

  // 4. Knight Cry Rules: Cries when attacked by Bishop, Queen, Rook, King, Pawn
  if (pType === 'n') {
    const validAttacker = attackers.find((a) => ['b', 'q', 'r', 'k', 'p'].includes(a.piece));
    if (validAttacker) {
      return {
        shouldCry: true,
        behaviorTitle: 'War Roar',
        threatDescription: `Knight stallion engaged by enemy ${getPieceFullName(validAttacker.piece)}! Rearing backward with crackling electric blue voltage lines.`,
        triggerPiece: validAttacker.piece,
      };
    }
  }

  // 5. Bishop Cry Rules: Cries when attacked by universal threat triggers (any enemy piece)
  if (pType === 'b') {
    return {
      shouldCry: true,
      behaviorTitle: 'Chant Echo',
      threatDescription: `Bishop is threatened by enemy ${getPieceFullName(attackers[0].piece)}! Tilting in sacred pendulum resonance with golden-violet light shaft.`,
      triggerPiece: attackers[0].piece,
    };
  }

  // 6. Pawn Cry Rules: Cries when attacked by another Pawn (strictly when NO self-defense/support), Rook, Knight, Queen, King, Bishop
  if (pType === 'p') {
    const majorMinorAttacker = attackers.find((a) => ['r', 'n', 'q', 'k', 'b'].includes(a.piece));
    if (majorMinorAttacker) {
      return {
        shouldCry: true,
        behaviorTitle: 'Despair Wail',
        threatDescription: `Pawn is overwhelmed by major piece (${getPieceFullName(majorMinorAttacker.piece)})! Hunching forward with micro-jitter and amber tears.`,
        triggerPiece: majorMinorAttacker.piece,
      };
    }

    const pawnAttacker = attackers.find((a) => a.piece === 'p');
    if (pawnAttacker && defenderCount === 0) {
      return {
        shouldCry: true,
        behaviorTitle: 'Despair Wail',
        threatDescription: `Hanging Pawn is ambushed without friendly defense! Despair wail triggered with amber droplet shadow.`,
        triggerPiece: 'p',
      };
    }
  }

  // Fallback for extreme stress (3+ attackers)
  if (attackers.length >= 3) {
    return {
      shouldCry: true,
      behaviorTitle: 'High-Stress Multi-Threat',
      threatDescription: `Piece is under siege by ${attackers.length} simultaneous enemy attackers!`,
      triggerPiece: attackers[0].piece,
    };
  }

  return { shouldCry: false, behaviorTitle: '', threatDescription: '' };
}

/**
 * Accurately calculate all enemy attackers & friendly defenders targeting a given square on the chess board.
 */
export function calculateSquareThreats(chess: Chess, targetSquare: Square): SquareThreatData | null {
  const targetPiece = chess.get(targetSquare);
  if (!targetPiece) return null;

  const targetColor = targetPiece.color;
  const enemyColor: Color = targetColor === 'w' ? 'b' : 'w';
  const { r: tr, f: tf } = sqToCoords(targetSquare);
  const attackers: AttackerInfo[] = [];
  const defenders: AttackerInfo[] = [];

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
      if (p && p.type === 'n') {
        const sq = coordsToSq(nr, nf);
        if (sq) {
          if (p.color === enemyColor) {
            attackers.push({ piece: 'n', square: sq, color: enemyColor });
          } else if (p.color === targetColor) {
            defenders.push({ piece: 'n', square: sq, color: targetColor });
          }
        }
      }
    }
  }

  // 2. Pawns
  // Enemy pawn attack rank:
  // If target is White ('w'), enemy black pawn attacks from (tr - 1)
  // If target is Black ('b'), enemy white pawn attacks from (tr + 1)
  const enemyPawnRankOffset = targetColor === 'w' ? -1 : 1;
  const enemyPawnAttackRank = tr + enemyPawnRankOffset;
  if (enemyPawnAttackRank >= 0 && enemyPawnAttackRank < 8) {
    for (const pawnFileOffset of [-1, 1]) {
      const pawnFile = tf + pawnFileOffset;
      if (pawnFile >= 0 && pawnFile < 8) {
        const p = board[enemyPawnAttackRank][pawnFile];
        if (p && p.color === enemyColor && p.type === 'p') {
          const sq = coordsToSq(enemyPawnAttackRank, pawnFile);
          if (sq) attackers.push({ piece: 'p', square: sq, color: enemyColor });
        }
      }
    }
  }

  // Friendly pawn defense rank:
  // If target is White ('w'), friendly white pawn supports from (tr + 1)
  // If target is Black ('b'), friendly black pawn supports from (tr - 1)
  const friendlyPawnRankOffset = targetColor === 'w' ? 1 : -1;
  const friendlyPawnAttackRank = tr + friendlyPawnRankOffset;
  if (friendlyPawnAttackRank >= 0 && friendlyPawnAttackRank < 8) {
    for (const pawnFileOffset of [-1, 1]) {
      const pawnFile = tf + pawnFileOffset;
      if (pawnFile >= 0 && pawnFile < 8) {
        const p = board[friendlyPawnAttackRank][pawnFile];
        if (p && p.color === targetColor && p.type === 'p') {
          const sq = coordsToSq(friendlyPawnAttackRank, pawnFile);
          if (sq) defenders.push({ piece: 'p', square: sq, color: targetColor });
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
        const sq = coordsToSq(nr, nf);
        if (sq) {
          if (p.color === enemyColor && (p.type === 'r' || p.type === 'q')) {
            attackers.push({ piece: p.type, square: sq, color: enemyColor });
          } else if (p.color === targetColor && (p.type === 'r' || p.type === 'q')) {
            defenders.push({ piece: p.type, square: sq, color: targetColor });
          }
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
        const sq = coordsToSq(nr, nf);
        if (sq) {
          if (p.color === enemyColor && (p.type === 'b' || p.type === 'q')) {
            attackers.push({ piece: p.type, square: sq, color: enemyColor });
          } else if (p.color === targetColor && (p.type === 'b' || p.type === 'q')) {
            defenders.push({ piece: p.type, square: sq, color: targetColor });
          }
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
      if (p && p.type === 'k') {
        const sq = coordsToSq(nr, nf);
        if (sq) {
          if (p.color === enemyColor) {
            attackers.push({ piece: 'k', square: sq, color: enemyColor });
          } else if (p.color === targetColor) {
            defenders.push({ piece: 'k', square: sq, color: targetColor });
          }
        }
      }
    }
  }

  const pieceCode = targetPiece.type.toUpperCase() as PieceElementCode;
  const cryEvaluation = evaluateElementCryMatrix(targetPiece.type, attackers, defenders.length);
  const isHighStress = cryEvaluation.shouldCry || attackers.length >= 3;
  const isExtremeStress = attackers.length >= 4;

  return {
    square: targetSquare,
    pieceType: targetPiece.type,
    pieceColor: targetColor,
    pieceCode,
    attackerCount: attackers.length,
    attackers,
    defenderCount: defenders.length,
    defenders,
    isHighStress,
    isExtremeStress,
    threatRatio: defenders.length > 0 ? attackers.length / defenders.length : attackers.length,
    cryEvaluation,
  };
}

/**
 * Scan all 64 squares on the board and return all pieces currently under cry matrix attack or high-stress conditions.
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
          if (threat && (threat.isHighStress || threat.cryEvaluation.shouldCry)) {
            highStressPieces.push(threat);
          }
        }
      }
    }
  }

  return highStressPieces;
}

