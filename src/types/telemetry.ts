import { ActiveBoardGame } from '../types';

export type UserOnlineStatus = 'In Match' | 'In Lobby' | 'Spectating' | 'Idle' | 'Offline';

export interface CountryInfo {
  code: string; // ISO 2-letter e.g. "IN", "US", "GB"
  name: string; // "India", "United States", "United Kingdom"
  flagEmoji: string; // "🇮🇳", "🇺🇸", "🇬🇧"
  region: 'Asia-Pacific' | 'North America' | 'Europe' | 'South America' | 'Middle East' | 'Africa';
}

export interface TelemetryBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  unlockedAt: string;
  category: 'Chess' | 'Cards' | 'Board' | 'Strategy' | 'Global';
}

export interface MatchOutcomeLedger {
  wins: number;
  losses: number;
  draws: number;
  resignations: number;
  totalGames: number;
  winRate: number; // percentage
}

export interface NetworkLatencyData {
  pingMs: number;
  edgeNode: string;
  packetLossPercent: number;
  jitterMs: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface EloHistoryPoint {
  date: string;
  elo: number;
}

export interface TelemetryUser {
  userId: string;
  username: string;
  country: CountryInfo;
  globalRank: number;
  regionalRank: number;
  eloRating: number;
  eloTier: 'Grandmaster' | 'Master' | 'Veteran' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  cumulativePlayTimeSeconds: number;
  currentSessionSeconds: number;
  onlineStatus: UserOnlineStatus;
  currentRoom: string;
  activeGame: ActiveBoardGame;
  matchLedger: MatchOutcomeLedger;
  badges: TelemetryBadge[];
  lastActiveTimestamp: number;
  avatarSeed?: string;
  network?: NetworkLatencyData;
  eloHistory?: EloHistoryPoint[];
}

export interface MoveTickerEvent {
  id: string;
  timestamp: number;
  username: string;
  userCountry: CountryInfo;
  game: ActiveBoardGame;
  roomName: string;
  moveDescription: string;
  moveNotation: string;
  turnNumber: number;
}

export interface TelemetryAlert {
  id: string;
  timestamp: number;
  username: string;
  userCountry: CountryInfo;
  type: 'elo_milestone' | 'badge_unlocked' | 'win_streak' | 'rank_up';
  title: string;
  message: string;
  icon: string;
}

export interface CountryTelemetryMetrics {
  country: CountryInfo;
  activePlayerCount: number;
  totalPlayers: number;
  totalPlayTimeSeconds: number;
  avgWinRate: number;
  topRankedUser: string;
  topRankedElo: number;
  avgPingMs: number;
  serverLocation: string;
}

export interface ConcurrencyDataPoint {
  time: string;
  totalActive: number;
  chessActive: number;
  cardGamesActive: number;
  boardGamesActive: number;
}

export interface OutcomeRatioDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface PlaytimeVelocityDataPoint {
  hour: string;
  engagementIndex: number;
  activeMatches: number;
}
