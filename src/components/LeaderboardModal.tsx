import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, UserCheck } from 'lucide-react';
import { ActiveBoardGame } from '../types';
import { socketService } from '../utils/socket';
import { UserProfileModal } from './UserProfileModal';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

export interface LeaderboardUser {
  username: string;
  score?: number;
  times_played?: number;
  wins: number;
  losses: number;
  draws: number;
  resigns?: number;
  total_time_seconds?: number;
  totalGames: number;
  winRate: number;
  global_rank?: number;
  lastActive: number;
}

interface LeaderboardModalProps {
  activeBoardGame?: ActiveBoardGame;
  isOpen: boolean;
  onClose: () => void;
  currentUserHandle?: string;
}

const GAME_NAMES: Record<ActiveBoardGame, string> = {
  chess: 'Chess Pro',
  checkers: 'Draughts Arena',
  backgammon: 'Backgammon Club',
  snakes: 'Snakes & Ladders',
  ludo: 'Ludo Master',
  gomoku: 'Gomoku Arena',
  reversi: 'Reversi Othello',
  connect4: 'Connect Four',
  ultimatetictactoe: 'Ultimate TTT',
  dotsandboxes: 'Dots & Boxes',
  battleship: 'Battleship Fleet',
  sim: 'Sim Triangle',
  uno: 'Uno Card Hub',
  hearts: 'Hearts Club',
  ginrummy: 'Gin Rummy',
  speed: 'Speed Spit',
};

const GAME_ICONS: Record<ActiveBoardGame, string> = {
  chess: '♔',
  checkers: '👑',
  backgammon: '🎲',
  snakes: '🐍',
  ludo: '🎯',
  gomoku: '⚫',
  reversi: '⚪',
  connect4: '🟡',
  ultimatetictactoe: '❌',
  dotsandboxes: '⏹️',
  battleship: '🚢',
  sim: '🔺',
  uno: '🃏',
  hearts: '♥',
  ginrummy: '🎴',
  speed: '⚡',
};

const ALL_GAMES: ActiveBoardGame[] = [
  'chess', 'checkers', 'backgammon', 'snakes', 'ludo', 'gomoku',
  'reversi', 'connect4', 'ultimatetictactoe', 'dotsandboxes',
  'battleship', 'sim', 'uno', 'hearts', 'ginrummy', 'speed'
];

// Seeded mock stats per game if backend data array is empty
const SEEDED_LEADERBOARDS: Record<ActiveBoardGame, LeaderboardUser[]> = {
  chess: [
    { username: 'ADITYA-OWNER', score: 2650, times_played: 128, wins: 120, losses: 4, draws: 4, resigns: 0, total_time_seconds: 54000, totalGames: 128, winRate: 94, global_rank: 1, lastActive: Date.now() },
    { username: 'Grandmaster_Alex', score: 2150, times_played: 50, wins: 42, losses: 5, draws: 3, resigns: 1, total_time_seconds: 14400, totalGames: 50, winRate: 84, global_rank: 2, lastActive: Date.now() - 3600000 },
    { username: 'ChessKing_99', score: 1980, times_played: 51, wins: 38, losses: 9, draws: 4, resigns: 2, total_time_seconds: 12200, totalGames: 51, winRate: 75, global_rank: 3, lastActive: Date.now() - 7200000 },
    { username: 'TacticsQueen', score: 1820, times_played: 45, wins: 31, losses: 12, draws: 2, resigns: 3, total_time_seconds: 9800, totalGames: 45, winRate: 69, global_rank: 4, lastActive: Date.now() - 10800000 },
  ],
  checkers: [
    { username: 'ADITYA-OWNER', score: 2420, times_played: 95, wins: 88, losses: 4, draws: 3, resigns: 0, total_time_seconds: 28000, totalGames: 95, winRate: 93, global_rank: 1, lastActive: Date.now() },
    { username: 'CrownMaster_Sam', score: 2040, times_played: 44, wins: 39, losses: 4, draws: 1, resigns: 0, total_time_seconds: 8800, totalGames: 44, winRate: 88, global_rank: 2, lastActive: Date.now() },
    { username: 'DoubleJump_Pro', score: 1890, times_played: 43, wins: 33, losses: 8, draws: 2, resigns: 1, total_time_seconds: 7600, totalGames: 43, winRate: 76, global_rank: 3, lastActive: Date.now() },
  ],
  backgammon: [
    { username: 'PipMaster_Elena', score: 1920, times_played: 42, wins: 36, losses: 6, draws: 0, resigns: 1, total_time_seconds: 9200, totalGames: 42, winRate: 85, global_rank: 1, lastActive: Date.now() },
    { username: 'BearingOff_King', score: 1750, times_played: 40, wins: 30, losses: 10, draws: 0, resigns: 2, total_time_seconds: 8100, totalGames: 40, winRate: 75, global_rank: 2, lastActive: Date.now() },
  ],
  snakes: [
    { username: 'LadderRunner_Max', score: 1850, times_played: 48, wins: 40, losses: 8, draws: 0, resigns: 0, total_time_seconds: 6500, totalGames: 48, winRate: 83, global_rank: 1, lastActive: Date.now() },
    { username: 'SnakeCharmer', score: 1680, times_played: 44, wins: 32, losses: 12, draws: 0, resigns: 1, total_time_seconds: 5900, totalGames: 44, winRate: 72, global_rank: 2, lastActive: Date.now() },
  ],
  ludo: [
    { username: 'LudoEmperor', score: 2110, times_played: 50, wins: 45, losses: 5, draws: 0, resigns: 0, total_time_seconds: 11000, totalGames: 50, winRate: 90, global_rank: 1, lastActive: Date.now() },
    { username: 'TokenCapturer', score: 1840, times_played: 45, wins: 35, losses: 10, draws: 0, resigns: 1, total_time_seconds: 9500, totalGames: 45, winRate: 77, global_rank: 2, lastActive: Date.now() },
  ],
  gomoku: [
    { username: 'FiveStone_Master', score: 1990, times_played: 45, wins: 38, losses: 6, draws: 1, resigns: 0, total_time_seconds: 7200, totalGames: 45, winRate: 84, global_rank: 1, lastActive: Date.now() },
  ],
  reversi: [
    { username: 'CornerFlipper', score: 1910, times_played: 44, wins: 35, losses: 7, draws: 2, resigns: 1, total_time_seconds: 8300, totalGames: 44, winRate: 79, global_rank: 1, lastActive: Date.now() },
  ],
  connect4: [
    { username: 'GravityAligner', score: 2020, times_played: 46, wins: 40, losses: 5, draws: 1, resigns: 0, total_time_seconds: 6100, totalGames: 46, winRate: 87, global_rank: 1, lastActive: Date.now() },
  ],
  ultimatetictactoe: [
    { username: 'SuperGrid_Ninja', score: 1880, times_played: 46, wins: 36, losses: 8, draws: 2, resigns: 1, total_time_seconds: 7900, totalGames: 46, winRate: 78, global_rank: 1, lastActive: Date.now() },
  ],
  dotsandboxes: [
    { username: 'ChainMaster_Dan', score: 2010, times_played: 44, wins: 39, losses: 5, draws: 0, resigns: 0, total_time_seconds: 6800, totalGames: 44, winRate: 88, global_rank: 1, lastActive: Date.now() },
  ],
  battleship: [
    { username: 'Admiral_Nelson', score: 2180, times_played: 45, wins: 41, losses: 4, draws: 0, resigns: 0, total_time_seconds: 9400, totalGames: 45, winRate: 91, global_rank: 1, lastActive: Date.now() },
  ],
  sim: [
    { username: 'GraphTheory_Ace', score: 1830, times_played: 40, wins: 33, losses: 7, draws: 0, resigns: 0, total_time_seconds: 5200, totalGames: 40, winRate: 82, global_rank: 1, lastActive: Date.now() },
  ],
  uno: [
    { username: 'WildCard_Champion', score: 2140, times_played: 54, wins: 48, losses: 6, draws: 0, resigns: 0, total_time_seconds: 12500, totalGames: 54, winRate: 88, global_rank: 1, lastActive: Date.now() },
  ],
  hearts: [
    { username: 'MoonShooter_007', score: 1950, times_played: 46, wins: 37, losses: 9, draws: 0, resigns: 1, total_time_seconds: 10200, totalGames: 46, winRate: 80, global_rank: 1, lastActive: Date.now() },
  ],
  ginrummy: [
    { username: 'MeldMaster_Gin', score: 2080, times_played: 47, wins: 42, losses: 5, draws: 0, resigns: 0, total_time_seconds: 9900, totalGames: 47, winRate: 89, global_rank: 1, lastActive: Date.now() },
  ],
  speed: [
    { username: 'SpitSpeed_Demon', score: 2220, times_played: 54, wins: 50, losses: 4, draws: 0, resigns: 0, total_time_seconds: 7100, totalGames: 54, winRate: 92, global_rank: 1, lastActive: Date.now() },
  ],
};

function formatTime(totalSeconds?: number): string {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  activeBoardGame = 'chess',
  isOpen,
  onClose,
}) => {
  const [selectedGame, setSelectedGame] = useState<ActiveBoardGame>(activeBoardGame);
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGame(activeBoardGame);
  }, [activeBoardGame]);

  const fetchLeaderboard = (gameToFetch: ActiveBoardGame = selectedGame) => {
    fetch(`/api/leaderboard?game=${gameToFetch}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(data);
        } else if (data && Array.isArray(data[gameToFetch])) {
          setLeaders(data[gameToFetch]);
        } else {
          setLeaders(SEEDED_LEADERBOARDS[gameToFetch] || SEEDED_LEADERBOARDS.chess);
        }
      })
      .catch(() => {
        setLeaders(SEEDED_LEADERBOARDS[gameToFetch] || SEEDED_LEADERBOARDS.chess);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard(selectedGame);

      // Connect Socket.IO live listener for real-time rank updates
      const socket = socketService.getSocket();
      if (socket) {
        const handleLiveUpdate = (updatedData: any) => {
          if (Array.isArray(updatedData) && updatedData.length > 0) {
            setLeaders(updatedData);
          } else if (updatedData && Array.isArray(updatedData[selectedGame])) {
            setLeaders(updatedData[selectedGame]);
          }
        };

        socket.on('leaderboard_update', handleLiveUpdate);
        return () => {
          socket.off('leaderboard_update', handleLiveUpdate);
        };
      }
    }
  }, [isOpen, selectedGame]);

  if (!isOpen) return null;

  const currentLeaders = leaders.length > 0 ? leaders : (SEEDED_LEADERBOARDS[selectedGame] || SEEDED_LEADERBOARDS.chess);
  const totalMatches = currentLeaders.reduce((acc, curr) => acc + (curr.times_played || curr.totalGames || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#0a0806] border border-[#f3ce6b]/40 backdrop-blur-2xl rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(243,206,107,0.15)] flex flex-col text-[#e0e0e0]">
        {/* Header */}
        <div className="p-5 border-b border-[#f3ce6b]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 bg-[#0a0806]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ffe89e] to-[#b8973b] p-0.5 shadow-lg shadow-[#f3ce6b]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0806] rounded-[14px] flex items-center justify-center text-[#ffe89e]">
                <Trophy className="w-5 h-5 text-[#f3ce6b]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-[#ffe89e] tracking-wider uppercase font-serif">
                  {GAME_NAMES[selectedGame]} Global Leaderboard
                </h2>
                <span className="bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-full text-[11px] font-bold text-sky-400 flex items-center gap-1.5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                  LIVE UPDATES
                </span>
              </div>
              <p className="text-xs text-[#f3ce6b]/70">
                Real-time player rankings, scores, match statistics & win rates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeaderboard()}
              className="p-2 rounded-xl text-amber-300/60 hover:text-amber-200 hover:bg-white/10 transition"
              title="Refresh Leaderboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-amber-300/60 hover:text-amber-200 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Tabs Bar across all 16 board & card games */}
        <div className="px-5 py-2.5 bg-black/60 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {ALL_GAMES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGame(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                selectedGame === g
                  ? 'bg-[#f3ce6b] text-slate-950 shadow-[0_0_12px_rgba(243,206,107,0.4)] font-black'
                  : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              <span>{GAME_ICONS[g]}</span>
              <span>{GAME_NAMES[g]}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard Summary Stats Bar */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Ranked Matches</span>
              <span className="text-xl font-black text-amber-300">{totalMatches} Matches</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Top Ranked Competitor</span>
              <span className="text-xl font-black text-emerald-400">{currentLeaders[0]?.username || 'N/A'}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Peak Score / Win Rate</span>
              <span className="text-xl font-black text-purple-300">
                {(currentLeaders[0]?.score || 1200).toLocaleString()} pts ({currentLeaders[0]?.winRate || 0}%)
              </span>
            </div>
          </div>

          {/* Full Real-Time Table */}
          <div className="bg-black/50 border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-sky-400">Score</th>
                  <th className="p-3">Played</th>
                  <th className="p-3 text-emerald-400">Wins</th>
                  <th className="p-3 text-red-400">Losses</th>
                  <th className="p-3 text-yellow-400">Draws</th>
                  <th className="p-3 text-gray-400">Resigns</th>
                  <th className="p-3 text-purple-300">Total Time</th>
                  <th className="p-3 text-indigo-300">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-200">
                {currentLeaders.map((u, index) => {
                  const rank = u.global_rank || (index + 1);
                  let rankStyle = 'text-amber-400 font-bold';
                  let crown = '👤';
                  if (rank === 1) {
                    rankStyle = 'text-[#f59e0b] font-black text-sm';
                    crown = '👑';
                  } else if (rank === 2) {
                    rankStyle = 'text-[#94a3b8] font-black text-sm';
                    crown = '🥈';
                  } else if (rank === 3) {
                    rankStyle = 'text-[#d97706] font-black text-sm';
                    crown = '🥉';
                  }

                  const score = u.score || 1200;
                  const played = u.times_played ?? u.totalGames ?? 0;
                  const resigns = u.resigns ?? 0;
                  const timeStr = formatTime(u.total_time_seconds);

                  const isOwner = isSiteOwner(u.username);

                  return (
                    <tr
                      key={index}
                      className={`cursor-pointer transition animate-fadeIn ${
                        isOwner
                          ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 hover:bg-amber-500/25 border-y border-amber-400/40'
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => setProfileUsername(u.username)}
                      title={`Click to view ${u.username}'s Profile`}
                    >
                      <td className={`p-3 font-mono ${isOwner ? 'text-amber-300 font-black text-sm' : rankStyle}`}>
                        #{rank}
                      </td>
                      <td className="p-3 font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>{isOwner ? '👑' : crown}</span>
                        <span className={`hover:underline ${isOwner ? 'text-amber-200 font-black' : 'hover:text-amber-300'}`}>
                          {u.username}
                        </span>
                        {isOwner && (
                          <OwnerBadge username={u.username} size="xs" label="OWNER" />
                        )}
                      </td>
                      <td className={`p-3 font-bold font-mono ${isOwner ? 'text-amber-300 font-black' : 'text-sky-400'}`}>
                        {score.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono">{played}</td>
                      <td className="p-3 text-emerald-400 font-bold">{u.wins}</td>
                      <td className="p-3 text-red-400">{u.losses}</td>
                      <td className="p-3 text-yellow-400">{u.draws}</td>
                      <td className="p-3 text-gray-400">{resigns}</td>
                      <td className="p-3 font-mono text-purple-300">{timeStr}</td>
                      <td className={`p-3 font-bold ${isOwner ? 'text-amber-300 font-black' : 'text-indigo-300'}`}>
                        {u.winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Profile Modal popup when player clicked */}
        {profileUsername && (
          <UserProfileModal
            username={profileUsername}
            isOpen={!!profileUsername}
            onClose={() => setProfileUsername(null)}
            gameType={selectedGame}
          />
        )}
      </div>
    </div>
  );
};
