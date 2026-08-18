import React, { useState, useEffect } from 'react';
import { Eye, Radio, Play, Activity, Tv, Shield, Award, Users, X } from 'lucide-react';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { MoveTickerEvent, TelemetryUser } from '../../types/telemetry';
import { isSiteOwner } from '../../utils/owner';
import { OwnerBadge } from '../OwnerBadge';

export const LiveMatchSpectatorTicker: React.FC = () => {
  const [events, setEvents] = useState<MoveTickerEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MoveTickerEvent | null>(null);
  const [users, setUsers] = useState<TelemetryUser[]>([]);

  useEffect(() => {
    const updateData = () => {
      setEvents(telemetryEngine.getMoveTickerEvents());
      setUsers(telemetryEngine.getAllUsers());
    };

    updateData();
    const unsubscribe = telemetryEngine.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  const activePlayers = users.filter((u) => u.onlineStatus === 'In Match' || u.onlineStatus === 'In Lobby');

  return (
    <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Sub-Second Live Match Move Stream & Spectator
              </h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time move notation ticker & 1-click spectator room entry
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-sky-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          {activePlayers.length} Active Games Streaming
        </span>
      </div>

      {/* Active Matches Spectator Quick Cards */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Featured Active Arena Matches
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activePlayers.length === 0 ? (
            <div className="col-span-full p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 italic">
              No live spectator matches active at this moment. Join a game to stream live moves!
            </div>
          ) : (
            activePlayers.map((u) => {
              const isOwner = isSiteOwner(u.username);
              return (
                <div
                  key={u.userId}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                    isOwner
                      ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-950 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{u.country.flagEmoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-extrabold truncate transition ${
                          isOwner ? 'text-amber-200 group-hover:text-amber-100 font-black' : 'text-white group-hover:text-sky-300'
                        }`}>
                          {u.username}
                        </span>
                        {isOwner && (
                          <OwnerBadge username={u.username} size="xs" label="OWNER" />
                        )}
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {u.eloRating} Elo
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{u.currentRoom}</p>
                    </div>
                  </div>

                <button
                  onClick={() =>
                    setSelectedEvent({
                      id: `spec_${u.userId}`,
                      timestamp: Date.now(),
                      username: u.username,
                      userCountry: u.country,
                      game: u.activeGame,
                      roomName: u.currentRoom,
                      moveDescription: `Streaming live match in ${u.activeGame.toUpperCase()} Arena`,
                      moveNotation: `Turn ${Math.floor(Math.random() * 15) + 1} - Live Feed`,
                      turnNumber: 12,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 font-extrabold text-[11px] border border-sky-400/40 transition flex items-center gap-1.5 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" /> Spectate
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* Live Move Stream Ticker Log */}
    <div className="space-y-2 pt-2 border-t border-slate-800/80">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
        Sub-Second Move Stream Log
      </h4>
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 max-h-48 overflow-y-auto scrollbar-thin space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            Waiting for turn moves from live players...
          </p>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 text-xs font-mono p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:bg-slate-800/60 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{e.userCountry.flagEmoji}</span>
                <span className="font-extrabold text-sky-300">{e.username}</span>
                <span className="text-slate-400">({e.game.toUpperCase()})</span>
                <span className="text-slate-300 truncate">{e.moveDescription}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                  {e.moveNotation}
                </span>
                <button
                  onClick={() => setSelectedEvent(e)}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Spectate Room"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Spectator Room Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-fadeIn">
          <div className="bg-[#070b14] border border-sky-500/50 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEvent.userCountry.flagEmoji}</span>
                <div>
                  <h3 className="text-base font-extrabold text-white font-mono">
                    SPECTATING: {selectedEvent.username}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedEvent.roomName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Live Spectator Screen Canvas */}
            <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3 h-3 text-red-400" /> LIVE STREAM SPECTATOR MODE
              </div>

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-3xl font-black shadow-lg">
                🎮
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-sky-300 uppercase tracking-wider font-mono">
                  {selectedEvent.game.toUpperCase()} MATCH STREAM
                </h4>
                <p className="text-xs text-slate-400 mt-1">{selectedEvent.moveDescription}</p>
              </div>

              <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400">
                Latest Turn Notation: {selectedEvent.moveNotation}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Latency</span>
                  <span className="text-emerald-400 font-bold">18ms (Direct Stream)</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Spectators</span>
                  <span className="text-sky-400 font-bold">14 Live Viewers</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-3 rounded-2xl bg-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-sky-400 transition"
            >
              Exit Spectator Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
