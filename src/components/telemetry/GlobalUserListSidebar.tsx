import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, ChevronLeft, Radio, Globe, Shield, RefreshCw } from 'lucide-react';
import { TelemetryUser, UserOnlineStatus } from '../../types/telemetry';
import { telemetryEngine, SUPPORTED_COUNTRIES } from '../../utils/telemetryEngine';
import { PlayerTelemetryInspectorModal } from './PlayerTelemetryInspectorModal';
import { isSiteOwner } from '../../utils/owner';
import { OwnerBadge } from '../OwnerBadge';

interface GlobalUserListSidebarProps {
  isExpandedByDefault?: boolean;
}

export const GlobalUserListSidebar: React.FC<GlobalUserListSidebarProps> = ({
  isExpandedByDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(isExpandedByDefault);
  const [users, setUsers] = useState<TelemetryUser[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [selectedUserForInspector, setSelectedUserForInspector] = useState<TelemetryUser | null>(null);

  const refreshUsers = () => {
    setUsers([...telemetryEngine.getAllUsers()]);
  };

  useEffect(() => {
    refreshUsers();
    const unsubscribe = telemetryEngine.subscribe(refreshUsers);
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.currentRoom.toLowerCase().includes(search.toLowerCase()) ||
      u.country.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || u.onlineStatus === statusFilter;
    const matchesCountry = countryFilter === 'ALL' || u.country.code === countryFilter;

    return matchesSearch && matchesStatus && matchesCountry;
  });

  const activeMatchCount = users.filter((u) => u.onlineStatus === 'In Match').length;

  return (
    <>
      {/* Floating Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-slate-900/95 hover:bg-slate-800 text-sky-400 border-y border-r border-sky-500/40 rounded-r-2xl p-2.5 shadow-[0_0_20px_rgba(14,165,233,0.3)] transition flex items-center gap-2 group cursor-pointer backdrop-blur-md"
          title="Open Global Active Users Roster (All Menus)"
        >
          <div className="relative">
            <Users className="w-5 h-5 text-sky-400 group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="hidden md:flex flex-col text-left pr-1">
            <span className="text-[10px] font-black uppercase text-sky-300 tracking-wider">Live Users</span>
            <span className="text-[11px] font-extrabold text-white font-mono">{users.length} Online</span>
          </div>
          <ChevronRight className="w-4 h-4 text-sky-400" />
        </button>
      )}

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="fixed left-0 top-0 bottom-0 z-40 w-80 sm:w-96 bg-[#080d1a]/95 border-r border-sky-500/30 backdrop-blur-2xl shadow-[10px_0_40px_rgba(0,0,0,0.8)] flex flex-col text-slate-100 animate-slideRight">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-sky-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  All Menu Active Users
                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.2 rounded-full text-emerald-400 font-bold animate-pulse">
                    LIVE
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {users.length} Players Online • {activeMatchCount} In Matches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={refreshUsers}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Refresh user list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-950/60">
            <div className="relative">
              <input
                type="text"
                placeholder="Search players, room or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px]">
              {/* Status Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                {['ALL', 'In Match', 'In Lobby', 'Spectating'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Country Dropdown */}
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-[10px] py-1 px-1.5 focus:outline-none focus:border-sky-400 shrink-0"
              >
                <option value="ALL">🌐 All Countries</option>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active players matched your search filter.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isOwner = isSiteOwner(u.username);
                let statusColor = 'bg-emerald-500 text-emerald-300 border-emerald-500/30';
                if (u.onlineStatus === 'In Lobby') statusColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (u.onlineStatus === 'Spectating') statusColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                return (
                  <div
                    key={u.userId}
                    onClick={() => setSelectedUserForInspector(u)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 group ${
                      isOwner
                        ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border-amber-500/50 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs group-hover:scale-105 transition ${
                          isOwner
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 border-amber-300 font-extrabold shadow-md'
                            : 'bg-slate-800 border-slate-700 text-sky-400'
                        }`}>
                          {isOwner ? '👑' : u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-sm">{u.country.flagEmoji}</span>
                      </div>

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
                            #{u.globalRank}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{u.currentRoom}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border block ${statusColor}`}>
                        {u.onlineStatus}
                      </span>
                      <span className="text-[10px] text-sky-400 font-mono font-bold block mt-0.5">
                        {u.eloRating} Elo
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[10px] text-slate-400">
            Click any player to inspect real-time telemetry & badges
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      {selectedUserForInspector && (
        <PlayerTelemetryInspectorModal
          userOrId={selectedUserForInspector}
          isOpen={!!selectedUserForInspector}
          onClose={() => setSelectedUserForInspector(null)}
        />
      )}
    </>
  );
};
