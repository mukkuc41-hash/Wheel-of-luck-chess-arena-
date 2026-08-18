import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Swords, Users, Shield, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { TelemetryUser } from '../../types/telemetry';
import { isSiteOwner } from '../../utils/owner';
import { OwnerBadge } from '../OwnerBadge';

export const RivalryAndEloAnalytics: React.FC = () => {
  const [users, setUsers] = useState<TelemetryUser[]>([]);
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');

  useEffect(() => {
    const updateData = () => {
      const all = telemetryEngine.getAllUsers();
      setUsers(all);
      if (all.length > 0 && !p1Id) setP1Id(all[0].userId);
      if (all.length > 1 && !p2Id) setP2Id(all[1].userId);
      else if (all.length === 1 && !p2Id) setP2Id(all[0].userId);
    };

    updateData();
    const unsubscribe = telemetryEngine.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  const player1 = users.find((u) => u.userId === p1Id) || users[0];
  const player2 = users.find((u) => u.userId === p2Id) || users[1] || users[0];

  const p1History = player1?.eloHistory || [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. 30-Day Elo Growth Trajectory Line Chart */}
      <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                30-Day Elo Rating Growth Trajectory
              </h3>
              <p className="text-xs text-slate-400">
                Individual skill rating evolution over time for selected player
              </p>
            </div>
          </div>

          {/* Select Player for Elo Chart */}
          {users.length > 0 && (
            <select
              value={p1Id}
              onChange={(e) => setP1Id(e.target.value)}
              className="bg-slate-950 text-sky-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-sky-500/40 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.country.flagEmoji} {u.username} ({u.eloRating} Elo)
                </option>
              ))}
            </select>
          )}
        </div>

        {player1 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={p1History}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#38bdf8', borderRadius: '12px' }}
                  itemStyle={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="elo"
                  name="Elo Rating"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            No player session registered yet. Play a game to view your 30-day Elo curve!
          </div>
        )}
      </div>

      {/* 2. Head-to-Head Rivalry Comparison Matrix */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Head-to-Head Rivalry Comparison Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side player skill ratings, win rates & match records
            </p>
          </div>
        </div>

        {users.length >= 1 ? (
          <div className="space-y-4">
            {/* Player Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                  Player 1 Corner (Blue)
                </label>
                <select
                  value={p1Id}
                  onChange={(e) => setP1Id(e.target.value)}
                  className="w-full bg-slate-900 text-sky-300 font-extrabold text-xs p-2 rounded-xl border border-sky-500/40"
                >
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.country.flagEmoji} {u.username} ({u.eloRating} Elo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                  Player 2 Corner (Purple)
                </label>
                <select
                  value={p2Id}
                  onChange={(e) => setP2Id(e.target.value)}
                  className="w-full bg-slate-900 text-purple-300 font-extrabold text-xs p-2 rounded-xl border border-purple-500/40"
                >
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.country.flagEmoji} {u.username} ({u.eloRating} Elo)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matrix comparison table */}
            {player1 && player2 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                {/* Headers */}
                <div className="grid grid-cols-3 text-center border-b border-slate-800 pb-2 font-bold items-center">
                  <div className="text-sky-300 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{player1.country.flagEmoji}</span>
                    <span className={isSiteOwner(player1.username) ? 'text-amber-300 font-black' : ''}>{player1.username}</span>
                    {isSiteOwner(player1.username) && (
                      <OwnerBadge username={player1.username} size="xs" label="OWNER" />
                    )}
                  </div>
                  <div className="text-slate-500 font-black uppercase text-[10px]">METRIC</div>
                  <div className="text-purple-300 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{player2.country.flagEmoji}</span>
                    <span className={isSiteOwner(player2.username) ? 'text-amber-300 font-black' : ''}>{player2.username}</span>
                    {isSiteOwner(player2.username) && (
                      <OwnerBadge username={player2.username} size="xs" label="OWNER" />
                    )}
                  </div>
                </div>

                {/* Rows */}
                <div className="grid grid-cols-3 text-center py-1 border-b border-slate-800/60">
                  <div className="font-extrabold text-sky-400">{player1.eloRating} ({player1.eloTier})</div>
                  <div className="text-slate-400 text-[10px]">ELO RATING</div>
                  <div className="font-extrabold text-purple-400">{player2.eloRating} ({player2.eloTier})</div>
                </div>

                <div className="grid grid-cols-3 text-center py-1 border-b border-slate-800/60">
                  <div className="font-bold text-emerald-400">{player1.matchLedger.winRate}%</div>
                  <div className="text-slate-400 text-[10px]">WIN RATE</div>
                  <div className="font-bold text-emerald-400">{player2.matchLedger.winRate}%</div>
                </div>

                <div className="grid grid-cols-3 text-center py-1 border-b border-slate-800/60">
                  <div className="font-bold text-slate-200">#{player1.globalRank}</div>
                  <div className="text-slate-400 text-[10px]">GLOBAL RANK</div>
                  <div className="font-bold text-slate-200">#{player2.globalRank}</div>
                </div>

                <div className="grid grid-cols-3 text-center py-1 border-b border-slate-800/60">
                  <div className="font-bold text-amber-400">{player1.matchLedger.wins} W / {player1.matchLedger.losses} L</div>
                  <div className="text-slate-400 text-[10px]">MATCH RECORD</div>
                  <div className="font-bold text-amber-400">{player2.matchLedger.wins} W / {player2.matchLedger.losses} L</div>
                </div>

                <div className="grid grid-cols-3 text-center py-1">
                  <div className="font-bold text-sky-300">{player1.activeGame.toUpperCase()}</div>
                  <div className="text-slate-400 text-[10px]">CURRENT GAME</div>
                  <div className="font-bold text-purple-300">{player2.activeGame.toUpperCase()}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            At least two active users required for head-to-head matrix.
          </div>
        )}
      </div>
    </div>
  );
};
