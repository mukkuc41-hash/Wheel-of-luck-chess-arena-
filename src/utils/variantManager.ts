import { ChessVariantRecord, BoardTheme } from '../types';

export const DEFAULT_PRESET_VARIANTS: ChessVariantRecord[] = [
  {
    id: 'preset-spider-3v3',
    name: '3 Pawns vs 3 Pawns Endgame (Spider Chess Meme)',
    description: 'The iconic viral puzzle: White King & 4 pawns vs Black King & 3 pawns in an intense geometric dash.',
    boardSize: 8,
    timeLimit: 300,
    layout: {
      '0,7': 'bK', // h8
      '1,6': 'bP', // g7
      '2,5': 'bP', // f6
      '3,4': 'bP', // e5
      '4,3': 'wP', // d4
      '5,2': 'wP', // c3
      '6,0': 'wP', // a2
      '6,1': 'wP', // b2
      '7,0': 'wK', // a1
    },
    theme: 'terracotta',
    fen: '7k/6p1/5p2/4p3/3P4/2P5/PP6/K7 w - - 0 1',
    createdAt: '2026-08-14T00:00:00.000Z',
    isPreset: true,
    totalPieces: 9,
    whiteCount: 5,
    blackCount: 4,
    upvotes: 48,
    downvotes: 3,
    score: 45,
  },
  {
    id: 'preset-pawn-storm',
    name: 'Pawn Avalanche / Battle of Infantry',
    description: 'Each side starts with 16 pawns and 1 king. Pure tactical promotion warfare.',
    boardSize: 8,
    timeLimit: 180,
    layout: {
      '0,4': 'bK',
      '1,0': 'bP', '1,1': 'bP', '1,2': 'bP', '1,3': 'bP', '1,4': 'bP', '1,5': 'bP', '1,6': 'bP', '1,7': 'bP',
      '2,0': 'bP', '2,1': 'bP', '2,2': 'bP', '2,3': 'bP', '2,4': 'bP', '2,5': 'bP', '2,6': 'bP', '2,7': 'bP',
      '5,0': 'wP', '5,1': 'wP', '5,2': 'wP', '5,3': 'wP', '5,4': 'wP', '5,5': 'wP', '5,6': 'wP', '5,7': 'wP',
      '6,0': 'wP', '6,1': 'wP', '6,2': 'wP', '6,3': 'wP', '6,4': 'wP', '6,5': 'wP', '6,6': 'wP', '6,7': 'wP',
      '7,4': 'wK',
    },
    theme: 'wood',
    fen: '4k3/pppppppp/pppppppp/8/8/PPPPPPPP/PPPPPPPP/4K3 w - - 0 1',
    createdAt: '2026-08-14T00:00:00.000Z',
    isPreset: true,
    totalPieces: 34,
    whiteCount: 17,
    blackCount: 17,
    upvotes: 32,
    downvotes: 4,
    score: 28,
  },
  {
    id: 'preset-knight-vs-bishop',
    name: 'Knights Brigade vs Bishops Academy',
    description: 'Four galloping knights vs Four snipers on open diagonals.',
    boardSize: 8,
    timeLimit: 300,
    layout: {
      '0,4': 'bK', '0,1': 'bB', '0,2': 'bB', '0,5': 'bB', '0,6': 'bB',
      '1,0': 'bP', '1,1': 'bP', '1,2': 'bP', '1,3': 'bP', '1,4': 'bP', '1,5': 'bP', '1,6': 'bP', '1,7': 'bP',
      '6,0': 'wP', '6,1': 'wP', '6,2': 'wP', '6,3': 'wP', '6,4': 'wP', '6,5': 'wP', '6,6': 'wP', '6,7': 'wP',
      '7,4': 'wK', '7,1': 'wN', '7,2': 'wN', '7,5': 'wN', '7,6': 'wN',
    },
    theme: 'emerald',
    fen: '1bb1kbb1/pppppppp/8/8/8/8/PPPPPPPP/1NN1KNN1 w - - 0 1',
    createdAt: '2026-08-14T00:00:00.000Z',
    isPreset: true,
    totalPieces: 26,
    whiteCount: 13,
    blackCount: 13,
    upvotes: 24,
    downvotes: 1,
    score: 23,
  },
  {
    id: 'preset-heavy-artillery',
    name: 'Rook Siege & Queens Endgame',
    description: 'Kings protected by dual Queen batteries and double Rooks.',
    boardSize: 8,
    timeLimit: 300,
    layout: {
      '0,0': 'bR', '0,3': 'bQ', '0,4': 'bK', '0,7': 'bR',
      '1,2': 'bP', '1,3': 'bP', '1,4': 'bP', '1,5': 'bP',
      '6,2': 'wP', '6,3': 'wP', '6,4': 'wP', '6,5': 'wP',
      '7,0': 'wR', '7,3': 'wQ', '7,4': 'wK', '7,7': 'wR',
    },
    theme: 'slate',
    fen: 'r2qkr2/2pppp2/8/8/8/8/2PPPP2/R2QKR2 w - - 0 1',
    createdAt: '2026-08-14T00:00:00.000Z',
    isPreset: true,
    totalPieces: 16,
    whiteCount: 8,
    blackCount: 8,
    upvotes: 19,
    downvotes: 2,
    score: 17,
  },
];

const STORAGE_KEY = 'chess_variant_history_v2';
const USER_VOTES_KEY = 'chess_variant_user_votes_v1';

/**
 * Gets user's active votes mapping from local storage
 */
export function getUserVariantVotes(): Record<string, 1 | -1> {
  try {
    const raw = localStorage.getItem(USER_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Sets user vote for a specific variant
 */
export function saveUserVariantVotes(votes: Record<string, 1 | -1>): void {
  try {
    localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
  } catch (err) {
    console.error('Failed to save user variant votes', err);
  }
}

/**
 * Converts piece layout mapping to a standard FEN string for 8x8 boards
 */
export function layoutToFen(layout: Record<string, string>, boardSize = 8, turn = 'w'): string {
  if (boardSize !== 8) {
    // Return custom placeholder FEN
    return `custom-${boardSize}x${boardSize}`;
  }

  const fenRows: string[] = [];
  let whiteKingExists = false;
  let blackKingExists = false;

  for (let r = 0; r < 8; r++) {
    let empty = 0;
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
      const piece = layout[`${r},${c}`];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          rowStr += empty;
          empty = 0;
        }
        const color = piece.charAt(0);
        const type = piece.charAt(1);
        if (color === 'w' && type.toLowerCase() === 'k') whiteKingExists = true;
        if (color === 'b' && type.toLowerCase() === 'k') blackKingExists = true;
        rowStr += color === 'w' ? type.toUpperCase() : type.toLowerCase();
      }
    }
    if (empty > 0) rowStr += empty;
    fenRows.push(rowStr);
  }

  // Ensure kings exist if valid FEN is needed
  return `${fenRows.join('/')} ${turn} - - 0 1`;
}

/**
 * Validates layout for chess.js compatibility
 */
export function validateChessLayout(layout: Record<string, string>, boardSize = 8): {
  isValid: boolean;
  message?: string;
  hasWhiteKing: boolean;
  hasBlackKing: boolean;
} {
  if (boardSize !== 8) {
    return {
      isValid: true,
      hasWhiteKing: true,
      hasBlackKing: true,
    };
  }

  let hasWhiteKing = false;
  let hasBlackKing = false;
  let pawnsOnBackranks = false;

  Object.entries(layout).forEach(([coord, piece]) => {
    const [rStr] = coord.split(',');
    const r = parseInt(rStr, 10);
    const color = piece.charAt(0);
    const type = piece.charAt(1).toLowerCase();

    if (color === 'w' && type === 'k') hasWhiteKing = true;
    if (color === 'b' && type === 'k') hasBlackKing = true;
    if (type === 'p' && (r === 0 || r === 7)) {
      pawnsOnBackranks = true;
    }
  });

  if (!hasWhiteKing || !hasBlackKing) {
    return {
      isValid: false,
      message: 'Both a White King (♔) and a Black King (♚) are required to load into standard chess rules.',
      hasWhiteKing,
      hasBlackKing,
    };
  }

  if (pawnsOnBackranks) {
    return {
      isValid: false,
      message: 'Pawns cannot be placed on the 1st or 8th rank in standard chess rules.',
      hasWhiteKing,
      hasBlackKing,
    };
  }

  return {
    isValid: true,
    hasWhiteKing,
    hasBlackKing,
  };
}

/**
 * Gets all saved variant history (presets + user-created) with up-to-date votes
 */
export function getSavedVariantHistory(): ChessVariantRecord[] {
  try {
    const userVotes = getUserVariantVotes();
    let records: ChessVariantRecord[] = [];

    const savedJson = localStorage.getItem(STORAGE_KEY);
    if (!savedJson) {
      records = DEFAULT_PRESET_VARIANTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESET_VARIANTS));
    } else {
      const parsed = JSON.parse(savedJson);
      records = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESET_VARIANTS;
    }

    // Hydrate each record with default votes and active user vote
    return records.map((record) => {
      const defaultPreset = DEFAULT_PRESET_VARIANTS.find((p) => p.id === record.id);
      const upvotes = record.upvotes ?? defaultPreset?.upvotes ?? 5;
      const downvotes = record.downvotes ?? defaultPreset?.downvotes ?? 0;
      const score = record.score ?? upvotes - downvotes;
      const userVote = userVotes[record.id] ?? 0;

      return {
        ...record,
        upvotes,
        downvotes,
        score,
        userVote,
      };
    });
  } catch (err) {
    console.error('Failed to load variant history from localStorage', err);
    return DEFAULT_PRESET_VARIANTS;
  }
}

/**
 * Votes (+1 or -1) on a saved variant record
 */
export function voteOnVariant(variantId: string, direction: 1 | -1): ChessVariantRecord[] {
  const currentList = getSavedVariantHistory();
  const userVotes = getUserVariantVotes();
  const currentVote = userVotes[variantId] || 0;

  let newVote: 1 | -1 | 0 = 0;
  if (currentVote === direction) {
    // Toggle off if clicked same button
    newVote = 0;
    delete userVotes[variantId];
  } else {
    // Set new vote
    newVote = direction;
    userVotes[variantId] = direction;
  }

  saveUserVariantVotes(userVotes);

  const updatedList = currentList.map((item) => {
    if (item.id !== variantId) return item;

    let up = item.upvotes || 0;
    let down = item.downvotes || 0;

    // Remove previous vote if any
    if (currentVote === 1) up = Math.max(0, up - 1);
    if (currentVote === -1) down = Math.max(0, down - 1);

    // Apply new vote
    if (newVote === 1) up += 1;
    if (newVote === -1) down += 1;

    return {
      ...item,
      upvotes: up,
      downvotes: down,
      score: up - down,
      userVote: newVote,
    };
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to update variant votes in localStorage', err);
  }

  return updatedList;
}

/**
 * Saves a new or updated variant to the history list
 */
export function saveVariantToHistory(variant: Omit<ChessVariantRecord, 'id' | 'createdAt' | 'totalPieces' | 'whiteCount' | 'blackCount'> & { id?: string }): ChessVariantRecord {
  const currentList = getSavedVariantHistory();
  const activePieces = Object.values(variant.layout);
  const totalPieces = activePieces.length;
  const whiteCount = activePieces.filter((p) => p.startsWith('w')).length;
  const blackCount = activePieces.filter((p) => p.startsWith('b')).length;

  const fen = variant.fen || (variant.boardSize === 8 ? layoutToFen(variant.layout, 8) : undefined);

  const existingIdx = variant.id ? currentList.findIndex((item) => item.id === variant.id) : -1;

  let newRecord: ChessVariantRecord;

  if (existingIdx >= 0) {
    newRecord = {
      ...currentList[existingIdx],
      ...variant,
      fen,
      totalPieces,
      whiteCount,
      blackCount,
      createdAt: new Date().toISOString(),
    };
    currentList[existingIdx] = newRecord;
  } else {
    newRecord = {
      id: variant.id || `variant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: variant.name.trim() || `Custom Variant (${new Date().toLocaleDateString()})`,
      description: variant.description || 'User-created custom chess position and time control.',
      boardSize: variant.boardSize,
      timeLimit: variant.timeLimit,
      layout: variant.layout,
      theme: variant.theme || 'terracotta',
      fen,
      createdAt: new Date().toISOString(),
      isPreset: false,
      totalPieces,
      whiteCount,
      blackCount,
      upvotes: 1,
      downvotes: 0,
      score: 1,
      userVote: 1,
    };
    // If author created it, record their own +1 vote
    const userVotes = getUserVariantVotes();
    userVotes[newRecord.id] = 1;
    saveUserVariantVotes(userVotes);
    currentList.unshift(newRecord);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
  } catch (err) {
    console.error('Failed to save variant to localStorage', err);
  }

  return newRecord;
}

/**
 * Deletes a variant from history
 */
export function deleteVariantFromHistory(variantId: string): ChessVariantRecord[] {
  const currentList = getSavedVariantHistory();
  const updated = currentList.filter((item) => item.id !== variantId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const userVotes = getUserVariantVotes();
    delete userVotes[variantId];
    saveUserVariantVotes(userVotes);
  } catch (err) {
    console.error('Failed to delete variant from localStorage', err);
  }
  return updated;
}
