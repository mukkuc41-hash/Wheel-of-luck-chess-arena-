import { ActiveBoardGame } from '../types';
import {
  TelemetryUser,
  CountryInfo,
  TelemetryBadge,
  CountryTelemetryMetrics,
  ConcurrencyDataPoint,
  OutcomeRatioDataPoint,
  PlaytimeVelocityDataPoint,
  MoveTickerEvent,
  TelemetryAlert,
  NetworkLatencyData,
  EloHistoryPoint,
} from '../types/telemetry';

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'IN', name: 'India', flagEmoji: '🇮🇳', region: 'Asia-Pacific' },
  { code: 'US', name: 'United States', flagEmoji: '🇺🇸', region: 'North America' },
  { code: 'GB', name: 'United Kingdom', flagEmoji: '🇬🇧', region: 'Europe' },
  { code: 'JP', name: 'Japan', flagEmoji: '🇯🇵', region: 'Asia-Pacific' },
  { code: 'DE', name: 'Germany', flagEmoji: '🇩🇪', region: 'Europe' },
  { code: 'BR', name: 'Brazil', flagEmoji: '🇧🇷', region: 'South America' },
  { code: 'FR', name: 'France', flagEmoji: '🇫🇷', region: 'Europe' },
  { code: 'CA', name: 'Canada', flagEmoji: '🇨🇦', region: 'North America' },
  { code: 'AU', name: 'Australia', flagEmoji: '🇦🇺', region: 'Asia-Pacific' },
  { code: 'KR', name: 'South Korea', flagEmoji: '🇰🇷', region: 'Asia-Pacific' },
  { code: 'ES', name: 'Spain', flagEmoji: '🇪🇸', region: 'Europe' },
  { code: 'IT', name: 'Italy', flagEmoji: '🇮🇹', region: 'Europe' },
  { code: 'AE', name: 'United Arab Emirates', flagEmoji: '🇦🇪', region: 'Middle East' },
  { code: 'KE', name: 'Kenya', flagEmoji: '🇰🇪', region: 'Africa' },
];

export const REGIONAL_EDGE_NODES: Record<string, { node: string; location: string; basePing: number }> = {
  IN: { node: 'IN-BOM-01', location: 'Mumbai, India', basePing: 18 },
  US: { node: 'US-IAD-02', location: 'Virginia, USA', basePing: 24 },
  GB: { node: 'EU-LHR-01', location: 'London, UK', basePing: 28 },
  JP: { node: 'AP-NRT-01', location: 'Tokyo, Japan', basePing: 32 },
  DE: { node: 'EU-FRA-01', location: 'Frankfurt, Germany', basePing: 22 },
  BR: { node: 'SA-GRU-01', location: 'São Paulo, Brazil', basePing: 64 },
  FR: { node: 'EU-CDG-01', location: 'Paris, France', basePing: 25 },
  CA: { node: 'NA-YYZ-01', location: 'Toronto, Canada', basePing: 30 },
  AU: { node: 'AP-SYD-01', location: 'Sydney, Australia', basePing: 78 },
  KR: { node: 'AP-ICN-01', location: 'Seoul, S. Korea', basePing: 35 },
  ES: { node: 'EU-MAD-01', location: 'Madrid, Spain', basePing: 38 },
  IT: { node: 'EU-MXP-01', location: 'Milan, Italy', basePing: 34 },
  AE: { node: 'ME-DXB-01', location: 'Dubai, UAE', basePing: 45 },
  KE: { node: 'AF-NBO-01', location: 'Nairobi, Kenya', basePing: 92 },
};

export const MASTER_BADGES_CATALOG: TelemetryBadge[] = [
  {
    id: 'badge_god_mode',
    title: 'Quantum God Conqueror',
    description: 'Defeated Level 8 AI across 3 separate board games against 0.001 win odds.',
    icon: '⚡',
    rarity: 'Legendary',
    unlockedAt: '2026-08-10',
    category: 'Chess',
  },
  {
    id: 'badge_speedrun',
    title: 'Speedrun Master',
    description: 'Executed a checkmate or win under 45 seconds in Speed Spit or Chess.',
    icon: '⏱️',
    rarity: 'Epic',
    unlockedAt: '2026-08-05',
    category: 'Strategy',
  },
  {
    id: 'badge_uno_survivor',
    title: '10-Player Uno Survivor',
    description: 'Survived a 10-player Wild Card multiplayer deck cascade without drawing 4.',
    icon: '🃏',
    rarity: 'Legendary',
    unlockedAt: '2026-08-01',
    category: 'Cards',
  },
  {
    id: 'badge_checkers_solved',
    title: 'Draughts Solved Master',
    description: 'Outmaneuvered Draughts AI in a 120-move corner zugzwang sequence.',
    icon: '👑',
    rarity: 'Epic',
    unlockedAt: '2026-07-28',
    category: 'Board',
  },
  {
    id: 'badge_battleship_admiral',
    title: 'Fleet Admiral',
    description: 'Sunk all 5 enemy ships in Battleship without missing 3 consecutive shots.',
    icon: '🚢',
    rarity: 'Rare',
    unlockedAt: '2026-07-20',
    category: 'Strategy',
  },
  {
    id: 'badge_grandmaster_tactician',
    title: 'Grandmaster Tactician',
    description: 'Achieved an Elo rating above 2200 in PvP Global Leaderboard.',
    icon: '🏆',
    rarity: 'Legendary',
    unlockedAt: '2026-07-15',
    category: 'Global',
  },
  {
    id: 'badge_ludo_emperor',
    title: 'Ludo Emperor',
    description: 'Captured 4 enemy tokens in a single Ludo match and won with 4 stars.',
    icon: '🎯',
    rarity: 'Rare',
    unlockedAt: '2026-07-12',
    category: 'Board',
  },
  {
    id: 'badge_hearts_moon',
    title: 'Moon Shooter',
    description: 'Shot the Moon in Hearts by collecting all 13 hearts and the Queen of Spades.',
    icon: '♥',
    rarity: 'Epic',
    unlockedAt: '2026-07-08',
    category: 'Cards',
  },
  {
    id: 'badge_gomoku_5',
    title: 'Five Stone Architect',
    description: 'Created an unbroken 5-in-a-row diagonal line in Gomoku without double-three fouls.',
    icon: '⚫',
    rarity: 'Rare',
    unlockedAt: '2026-07-02',
    category: 'Board',
  },
  {
    id: 'badge_gin_rummy_knock',
    title: 'Miracle Gin Knock',
    description: 'Knocked with 0 deadwood points in Gin Rummy on turn 3.',
    icon: '🎴',
    rarity: 'Rare',
    unlockedAt: '2026-06-25',
    category: 'Cards',
  },
];

// Pure real user state only - no fake/virtual/seeded users
const INITIAL_TELEMETRY_USERS: TelemetryUser[] = [];

class TelemetryEngine {
  private users: TelemetryUser[] = [...INITIAL_TELEMETRY_USERS];
  private moveTickerEvents: MoveTickerEvent[] = [];
  private telemetryAlerts: TelemetryAlert[] = [];
  private listeners: Array<() => void> = [];
  private alertListeners: Array<(alert: TelemetryAlert) => void> = [];
  private timer: any = null;

  constructor() {
    this.startLiveTicking();
  }

  private startLiveTicking() {
    if (typeof window === 'undefined') return;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (this.users.length === 0) return;

      let changed = false;
      this.users = this.users.map((u) => {
        if (u.onlineStatus === 'In Match' || u.onlineStatus === 'In Lobby' || u.onlineStatus === 'Spectating') {
          changed = true;
          // Dynamically compute network jitter
          const edge = REGIONAL_EDGE_NODES[u.country.code] || REGIONAL_EDGE_NODES.IN;
          const currentPing = Math.max(12, edge.basePing + Math.floor(Math.sin(Date.now() / 1000) * 6));
          const net: NetworkLatencyData = {
            pingMs: currentPing,
            edgeNode: edge.node,
            packetLossPercent: currentPing > 80 ? 0.4 : 0.0,
            jitterMs: Math.floor(Math.random() * 4) + 1,
            quality: currentPing < 30 ? 'Excellent' : currentPing < 60 ? 'Good' : currentPing < 100 ? 'Fair' : 'Poor',
          };

          return {
            ...u,
            cumulativePlayTimeSeconds: u.cumulativePlayTimeSeconds + 1,
            currentSessionSeconds: u.currentSessionSeconds + 1,
            lastActiveTimestamp: Date.now(),
            network: net,
          };
        }
        return u;
      });

      if (changed) {
        this.notifyListeners();
      }
    }, 1000);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeAlerts(listener: (alert: TelemetryAlert) => void): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  private notifyAlert(alert: TelemetryAlert) {
    this.alertListeners.forEach((l) => l(alert));
  }

  public getAllUsers(): TelemetryUser[] {
    return this.users;
  }

  public getUserById(id: string): TelemetryUser | undefined {
    return this.users.find((u) => u.userId === id || u.username.toLowerCase() === id.toLowerCase());
  }

  public getUsersByCountry(countryCode: string): TelemetryUser[] {
    if (!countryCode || countryCode === 'ALL') return this.users;
    return this.users.filter((u) => u.country.code === countryCode);
  }

  public recordMoveEvent(
    username: string,
    game: ActiveBoardGame,
    roomName: string,
    moveDescription: string,
    moveNotation: string
  ) {
    const user = this.getUserById(username) || this.users[0];
    const country = user ? user.country : SUPPORTED_COUNTRIES[0];

    const newEvent: MoveTickerEvent = {
      id: `mve_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      username,
      userCountry: country,
      game,
      roomName,
      moveDescription,
      moveNotation,
      turnNumber: Math.floor(Math.random() * 20) + 1,
    };

    this.moveTickerEvents.unshift(newEvent);
    if (this.moveTickerEvents.length > 30) {
      this.moveTickerEvents = this.moveTickerEvents.slice(0, 30);
    }
    this.notifyListeners();
  }

  public getMoveTickerEvents(): MoveTickerEvent[] {
    return this.moveTickerEvents;
  }

  public triggerAlert(alert: Omit<TelemetryAlert, 'id' | 'timestamp'>) {
    const fullAlert: TelemetryAlert = {
      ...alert,
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    this.telemetryAlerts.unshift(fullAlert);
    if (this.telemetryAlerts.length > 20) {
      this.telemetryAlerts = this.telemetryAlerts.slice(0, 20);
    }
    this.notifyAlert(fullAlert);
    this.notifyListeners();
  }

  public getTelemetryAlerts(): TelemetryAlert[] {
    return this.telemetryAlerts;
  }

  private generate30DayEloHistory(currentElo: number): EloHistoryPoint[] {
    const points: EloHistoryPoint[] = [];
    const today = new Date();
    let runningElo = Math.max(800, currentElo - 180);

    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

      if (i === 0) {
        runningElo = currentElo;
      } else {
        const delta = Math.floor(Math.sin(i * 0.8) * 25 + (Math.random() * 20 - 8));
        runningElo = Math.max(800, runningElo + delta);
      }
      points.push({ date: dateStr, elo: runningElo });
    }
    return points;
  }

  public updateLocalUserSession(
    username: string,
    stats?: any,
    isGuest: boolean = false,
    activeGame: ActiveBoardGame = 'chess',
    currentRoom: string = 'Active Game Room',
    countryCode: string = 'IN'
  ) {
    if (!username) return;

    const matchedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRIES[0];
    const existingIndex = this.users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());

    const totalTime = stats?.totalTimeSeconds || 60;
    const wins = stats?.wins || 0;
    const losses = stats?.losses || 0;
    const draws = stats?.draws || 0;
    const resigns = stats?.resigns || 0;
    const totalGames = stats?.totalGames || wins + losses + draws + resigns;
    const winRate = totalGames > 0 ? parseFloat(((wins / totalGames) * 100).toFixed(1)) : 0;
    const computedElo = 1200 + wins * 15 - losses * 10;

    const edge = REGIONAL_EDGE_NODES[matchedCountry.code] || REGIONAL_EDGE_NODES.IN;
    const net: NetworkLatencyData = {
      pingMs: edge.basePing + Math.floor(Math.random() * 5),
      edgeNode: edge.node,
      packetLossPercent: 0.0,
      jitterMs: 2,
      quality: 'Excellent',
    };

    const userObj: TelemetryUser = {
      userId: `usr_real_${username.replace(/\s+/g, '_')}`,
      username: username + (isGuest ? ' (Guest)' : ''),
      country: matchedCountry,
      globalRank: existingIndex >= 0 ? this.users[existingIndex].globalRank : 1,
      regionalRank: existingIndex >= 0 ? this.users[existingIndex].regionalRank : 1,
      eloRating: computedElo,
      eloTier: computedElo >= 2000 ? 'Grandmaster' : computedElo >= 1600 ? 'Master' : computedElo >= 1400 ? 'Veteran' : computedElo >= 1200 ? 'Diamond' : 'Gold',
      cumulativePlayTimeSeconds: existingIndex >= 0 ? Math.max(this.users[existingIndex].cumulativePlayTimeSeconds, totalTime) : totalTime,
      currentSessionSeconds: existingIndex >= 0 ? this.users[existingIndex].currentSessionSeconds : 60,
      onlineStatus: 'In Match',
      currentRoom: currentRoom,
      activeGame: activeGame,
      matchLedger: {
        wins,
        losses,
        draws,
        resignations: resigns,
        totalGames,
        winRate,
      },
      badges: wins > 0 ? [MASTER_BADGES_CATALOG[1]] : [],
      lastActiveTimestamp: Date.now(),
      network: net,
      eloHistory: existingIndex >= 0 && this.users[existingIndex].eloHistory ? this.users[existingIndex].eloHistory : this.generate30DayEloHistory(computedElo),
    };

    if (existingIndex >= 0) {
      this.users[existingIndex] = {
        ...this.users[existingIndex],
        ...userObj,
      };
    } else {
      this.users.unshift(userObj);

      // Trigger new user alert
      this.triggerAlert({
        username: userObj.username,
        userCountry: userObj.country,
        type: 'rank_up',
        title: 'New Player Connected',
        message: `${userObj.username} joined from ${userObj.country.flagEmoji} ${userObj.country.name}`,
        icon: '🚀',
      });
    }

    // Recalculate ranks dynamically based on Elo among all real users
    this.users.sort((a, b) => b.eloRating - a.eloRating);
    this.users.forEach((u, idx) => {
      u.globalRank = idx + 1;
    });

    this.notifyListeners();
  }

  public getCountryMetrics(): CountryTelemetryMetrics[] {
    return SUPPORTED_COUNTRIES.map((c) => {
      const countryUsers = this.users.filter((u) => u.country.code === c.code);
      const activeCount = countryUsers.filter((u) => u.onlineStatus !== 'Offline').length;
      const totalTime = countryUsers.reduce((acc, u) => acc + u.cumulativePlayTimeSeconds, 0);
      const totalWins = countryUsers.reduce((acc, u) => acc + u.matchLedger.wins, 0);
      const totalGames = countryUsers.reduce((acc, u) => acc + u.matchLedger.totalGames, 0);
      const avgWinRate = totalGames > 0 ? parseFloat(((totalWins / totalGames) * 100).toFixed(1)) : 0;

      const edge = REGIONAL_EDGE_NODES[c.code] || REGIONAL_EDGE_NODES.IN;
      const topUser = [...countryUsers].sort((a, b) => b.eloRating - a.eloRating)[0];

      return {
        country: c,
        activePlayerCount: activeCount,
        totalPlayers: countryUsers.length,
        totalPlayTimeSeconds: totalTime,
        avgWinRate: avgWinRate,
        topRankedUser: topUser ? topUser.username : 'None',
        topRankedElo: topUser ? topUser.eloRating : 0,
        avgPingMs: edge.basePing,
        serverLocation: edge.location,
      };
    }).sort((a, b) => b.activePlayerCount - a.activePlayerCount || b.totalPlayers - a.totalPlayers);
  }

  public get24hConcurrencyData(): ConcurrencyDataPoint[] {
    const times = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', 'NOW'];
    const totalActiveReal = this.users.filter((u) => u.onlineStatus === 'In Match' || u.onlineStatus === 'In Lobby').length;
    const chessActiveReal = this.users.filter((u) => u.activeGame === 'chess').length;
    const cardActiveReal = this.users.filter((u) => ['uno', 'speed', 'hearts', 'ginrummy'].includes(u.activeGame)).length;
    const boardActiveReal = this.users.filter((u) => ['ludo', 'checkers', 'battleship', 'connect4', 'backgammon', 'gomoku', 'reversi', 'dotsandboxes', 'sim'].includes(u.activeGame)).length;

    return times.map((t, i) => {
      const isNow = i === times.length - 1;
      return {
        time: t,
        totalActive: isNow ? totalActiveReal : 0,
        chessActive: isNow ? chessActiveReal : 0,
        cardGamesActive: isNow ? cardActiveReal : 0,
        boardGamesActive: isNow ? boardActiveReal : 0,
      };
    });
  }

  public getOutcomeRatioData(): OutcomeRatioDataPoint[] {
    const totalWins = this.users.reduce((acc, u) => acc + u.matchLedger.wins, 0);
    const totalLosses = this.users.reduce((acc, u) => acc + u.matchLedger.losses, 0);
    const totalDraws = this.users.reduce((acc, u) => acc + u.matchLedger.draws, 0);
    const totalResigns = this.users.reduce((acc, u) => acc + u.matchLedger.resignations, 0);

    return [
      { name: 'Wins', value: totalWins, color: '#22c55e' },
      { name: 'Losses', value: totalLosses, color: '#ef4444' },
      { name: 'Draws', value: totalDraws, color: '#eab308' },
      { name: 'Resignations', value: totalResigns, color: '#94a3b8' },
    ];
  }

  public getPlaytimeVelocityData(): PlaytimeVelocityDataPoint[] {
    const hours = ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'];
    const activeCount = this.users.filter((u) => u.onlineStatus === 'In Match').length;
    return hours.map((h) => ({
      hour: h,
      engagementIndex: activeCount * 10,
      activeMatches: activeCount,
    }));
  }

  // Export helpers
  public exportTelemetryJSON(): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `telemetry_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public exportTelemetryCSV(): void {
    const headers = ['Username', 'Country', 'Region', 'Elo', 'Tier', 'GlobalRank', 'Wins', 'Losses', 'WinRate%', 'CumulativePlayTimeSec'];
    const rows = this.users.map((u) => [
      `"${u.username}"`,
      `"${u.country.name}"`,
      `"${u.country.region}"`,
      u.eloRating,
      `"${u.eloTier}"`,
      u.globalRank,
      u.matchLedger.wins,
      u.matchLedger.losses,
      `${u.matchLedger.winRate}%`,
      u.cumulativePlayTimeSeconds,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `telemetry_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

export const telemetryEngine = new TelemetryEngine();
