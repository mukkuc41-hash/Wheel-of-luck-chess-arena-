import React, { useState, useEffect } from 'react';
import { Globe, Users, Trophy, Clock, Flag, Search, Filter } from 'lucide-react';
import { CountryTelemetryMetrics, TelemetryUser } from '../../types/telemetry';
import { telemetryEngine, SUPPORTED_COUNTRIES } from '../../utils/telemetryEngine';
import { PlayerTelemetryInspectorModal } from './PlayerTelemetryInspectorModal';
import { MiniWorldMapHeatmap } from './MiniWorldMapHeatmap';

export const RegionalFilteringHub: React.FC = () => {
  const [metrics, setMetrics] = useState<CountryTelemetryMetrics[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IN'); // Default India 🇮🇳
  const [search, setSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<TelemetryUser | null>(null);

  const refreshData = () => {
    setMetrics(telemetryEngine.getCountryMetrics());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = telemetryEngine.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  const regions = ['ALL', 'Asia-Pacific', 'North America', 'Europe', 'South America', 'Middle East', 'Africa'];

  const filteredMetrics = metrics.filter((m) => {
    const matchesRegion = selectedRegion === 'ALL' || m.country.region === selectedRegion;
    const matchesSearch =
      m.country.name.toLowerCase().includes(search.toLowerCase()) ||
      m.country.code.toLowerCase().includes(search.toLowerCase()) ||
      m.topRankedUser.toLowerCase().includes(search.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const activeCountryUsers = telemetryEngine.getUsersByCountry(selectedCountryCode);
  const currentCountryObj = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* 0. Live Interactive World Map Heatmap */}
      <MiniWorldMapHeatmap
        selectedCountryCode={selectedCountryCode}
        onSelectCountry={(code) => {
          if (code === 'ALL') {
            setSelectedRegion('ALL');
          } else {
            setSelectedCountryCode(code);
            const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === code);
            if (countryObj) {
              setSelectedRegion(countryObj.region);
            }
          }
        }}
        onSelectUser={(u) => setSelectedUser(u)}
      />

      {/* 1. Regional Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Regions */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedRegion === r
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? '🌐 All Regions' : r}
            </button>
          ))}
        </div>

        {/* Search Country */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search country or top user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 2. Country Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMetrics.map((m) => {
          const isSelected = m.country.code === selectedCountryCode;
          return (
            <div
              key={m.country.code}
              onClick={() => setSelectedCountryCode(m.country.code)}
              className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-gradient-to-br from-sky-950/60 to-slate-900 border-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.25)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{m.country.flagEmoji}</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {m.country.name}
                      <span className="text-[10px] text-slate-400 font-mono">({m.country.code})</span>
                    </h3>
                    <span className="text-[10px] text-sky-400 font-semibold">{m.country.region}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-black bg-sky-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SELECTED
                  </span>
                )}
              </div>

              {/* Stats Bar inside Country Card */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Active Now</span>
                  <span className="text-xs font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {m.activePlayerCount}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Avg Win Rate</span>
                  <span className="text-xs font-black text-amber-400 font-mono">{m.avgWinRate}%</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Top Elo</span>
                  <span className="text-xs font-black text-sky-300 font-mono">{m.topRankedElo}</span>
                </div>
              </div>

              {/* Regional Champion */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 text-[10px]">Regional Champion:</span>
                <span className="font-extrabold text-amber-300 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400 inline" /> {m.topRankedUser}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Country Active Users List */}
      <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentCountryObj.flagEmoji}</span>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Active Users in {currentCountryObj.name} ({activeCountryUsers.length} Online)
              </h3>
              <p className="text-xs text-slate-400">Live telemetry stream for selected country</p>
            </div>
          </div>
        </div>

        {activeCountryUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active players registered in {currentCountryObj.name} currently online.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeCountryUsers.map((u) => (
              <div
                key={u.userId}
                onClick={() => setSelectedUser(u)}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shrink-0">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-white group-hover:text-sky-300 transition">
                        {u.username}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">
                        Global #{u.globalRank}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{u.currentRoom}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-sky-400 font-mono block">{u.eloRating} Elo</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{u.matchLedger.winRate}% Win Rate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Inspector Modal */}
      {selectedUser && (
        <PlayerTelemetryInspectorModal
          userOrId={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};
