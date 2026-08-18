export type BoardTheme = 'terracotta' | 'wood' | 'emerald' | 'slate' | 'stone' | 'neon' | 'ocean' | 'crimson' | 'glass' | 'cyber';

export type PieceTheme = 'classic' | 'modern' | 'alpha';

export type GameMode = 'pvp' | 'ai' | 'local';

export type ActiveBoardGame =
  | 'chess'
  | 'checkers'
  | 'backgammon'
  | 'snakes'
  | 'ludo'
  | 'gomoku'
  | 'reversi'
  | 'connect4'
  | 'ultimatetictactoe'
  | 'dotsandboxes'
  | 'battleship'
  | 'sim'
  | 'uno'
  | 'hearts'
  | 'ginrummy'
  | 'speed';

export type TimeControlPreset = 'untimed' | '3+2' | '5+3' | '10+0' | '15+10' | 'custom';

export interface PlayerInfo {
  name: string;
  avatar: string;
  rating?: number;
  isOwner?: boolean;
}

export interface GuestSecurityDetails {
  displayHandle: string;
  maskedToken: string;
  tokenEntropy: string;
  cookieSecurity: string;
  expiresAt: number;
  rotationHistoryCount: number;
}

export interface UserSession {
  token: string;
  accessToken?: string;
  username: string;
  email?: string;
  isGuest: boolean;
  isOwner?: boolean;
  dailyStreak?: number;
  guestDisplayHandle?: string;
  maskedHighEntropyToken?: string;
  guestExpiresAt?: number;
  stats?: UserStats;
}

export interface TimeControl {
  preset: TimeControlPreset;
  initialSeconds: number; // in seconds
  incrementSeconds: number; // in seconds
}

declare global {
  interface Window {
    hideChessProPreloader?: () => void;
  }
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  promotion?: string;
  color: 'w' | 'b';
  fen: string;
  moveNumber: number;
  timeSpent?: number;
  timeRemaining?: {
    white: number;
    black: number;
  };
}

export interface ChessVariantRecord {
  id: string;
  name: string;
  description?: string;
  boardSize: number;
  timeLimit: number;
  layout: Record<string, string>;
  theme?: BoardTheme;
  fen?: string;
  createdAt: string;
  isPreset?: boolean;
  totalPieces: number;
  whiteCount: number;
  blackCount: number;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  userVote?: 1 | -1 | 0;
}

export type GameResult = {
  winner: 'w' | 'b' | 'draw' | null;
  reason: 'checkmate' | 'timeout' | 'resignation' | 'stalemate' | 'threefold' | 'insufficient' | 'agreement' | null;
};

export type AIDifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'master' | AIDifficultyLevel;

export interface GameSettings {
  boardTheme: BoardTheme;
  pieceTheme: PieceTheme;
  autoFlipBoard: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  soundEnabled: boolean;
  timeControl: TimeControl;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  aiDifficulty: AIDifficulty;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MatchRecord {
  id: string;
  gameType?: string;
  mode: GameMode;
  whiteUsername: string;
  blackUsername: string;
  winner: 'w' | 'b' | 'draw';
  reason: string;
  moveCount: number;
  durationSeconds?: number;
  pgn: string;
  moves: MoveRecord[];
  createdAt: number;
  timeControlPreset: string;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  resigns: number;
  winRate: number; // percentage 0 - 100
  lossRate: number; // percentage 0 - 100
  drawRate: number; // percentage 0 - 100
  resignRate: number; // percentage 0 - 100
  pvpGames: number;
  aiGames: number;
  totalTimeSeconds?: number;
  avgMatchTimeSeconds?: number;
  dailyStreak?: number;
}

export interface VoiceReportRequest {
  reportedUser: string;
  reason: 'harassment' | 'hate_speech' | 'threat' | 'explicit' | 'spam_noise' | 'other';
  details: string;
  roomId?: string;
  transcriptSnapshot?: string;
}

export interface ShareProgressData {
  title: string;
  text: string;
  url?: string;
  gameType?: ActiveBoardGame;
  stats?: UserStats;
}

export interface RoomRules {
  minimumRating: number;
  allowChat: boolean;
  maxPlayers: number;
}

export interface PvPRoomState {
  roomId: string;
  whiteUsername: string;
  blackUsername: string;
  myColor: 'w' | 'b' | 'spectator';
  status: 'waiting' | 'active' | 'finished';
  turn: 'w' | 'b';
  fen: string;
  whiteTime: number;
  blackTime: number;
  drawOfferFrom?: string;
  communityNotice?: string;
  roomRules?: RoomRules;
  ownerId?: string;
}

export interface LobbyUser {
  id: string;
  username: string;
  joinedAt: number;
}

