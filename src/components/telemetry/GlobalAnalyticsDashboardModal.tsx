import React, { useState } from 'react';
import { X, Activity, Users, Globe, BarChart2, Award, Radio, Tv, Wifi, Swords, Bell } from 'lucide-react';
import { RegionalFilteringHub } from './RegionalFilteringHub';
import { RealTimeDataCharts } from './RealTimeDataCharts';
import { LiveMatchSpectatorTicker } from './LiveMatchSpectatorTicker';
import { NetworkLatencyHeatmap } from './NetworkLatencyHeatmap';
import { RivalryAndEloAnalytics } from './RivalryAndEloAnalytics';
import { TelemetryAlertsAndExport } from './TelemetryAlertsAndExport';
import { MASTER_BADGES_CATALOG } from '../../utils/telemetryEngine';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { PlayerTelemetryInspectorModal } from './PlayerTelemetryInspectorModal';
import { TelemetryUser } from '../../types/telemetry';

type TabType = 'charts' | 'spectator' | 'network' | 'rivalry' | 'alerts' | 'roster' | 'regional' | 'badges';

interface GlobalAnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

export const GlobalAnalyticsDashboardModal: React.FC<GlobalAnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'charts',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedUser, setSelectedUser] = useState<TelemetryUser | null>(null);

  if (!isOpen) return null;

  const users = telemetryEngine.getAllUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#070b14] border border-sky-500/40 backdrop-blur-3xl rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-[0_0_80px_rgba(14,165,233,0.2)] flex flex-col text-slate-100 my-auto">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#070b14] rounded-[14px] flex items-center justify-center text-sky-400">
                <BarChart2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-sky-300 uppercase tracking-wider font-mono">
                  Global Real-Time Telemetry & Analytics
                </h2>
                <span className="bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3 h-3 text-emerald-400" /> LIVE WEBSOCKET ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live move streams, spectator rooms, ping heatmaps, Elo analytics & export suite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'charts'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Data Charts
          </button>

          <button
            onClick={() => setActiveTab('spectator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'spectator'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Tv className="w-4 h-4 text-emerald-400" /> Live Spectator & Move Stream
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'network'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wifi className="w-4 h-4" /> Edge Ping & Network
          </button>

          <button
            onClick={() => setActiveTab('rivalry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rivalry'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Swords className="w-4 h-4 text-purple-400" /> Elo Curves & Rivalry Matrix
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" /> Milestone Alerts & Export
          </button>

          <button
            onClick={() => setActiveTab('regional')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'regional'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" /> Regional Map & Hub
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Online Roster ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Achievements Index
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin space-y-6">
          
          {/* CHARTS TAB */}
          {activeTab === 'charts' && <RealTimeDataCharts />}

          {/* SPECTATOR TAB */}
          {activeTab === 'spectator' && <LiveMatchSpectatorTicker />}

          {/* NETWORK TAB */}
          {activeTab === 'network' && <NetworkLatencyHeatmap />}

          {/* RIVALRY TAB */}
          {activeTab === 'rivalry' && <RivalryAndEloAnalytics />}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && <TelemetryAlertsAndExport />}

          {/* REGIONAL TAB */}
          {activeTab === 'regional' && <RegionalFilteringHub />}

          {/* ROSTER TAB */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  All Menus Active Online Users
                </h3>
                <span className="text-xs text-sky-400 font-bold font-mono">
                  {users.length} Active Players Streaming
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u.userId}
                    onClick={() => setSelectedUser(u)}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-base">{u.country.flagEmoji}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-white group-hover:text-sky-300 transition">
                            {u.username}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            #{u.globalRank}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{u.currentRoom}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-sky-400 font-mono block">{u.eloRating} Elo</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold block mt-1">
                        {u.onlineStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BADGES TAB */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Platform Progression Milestones & Badges Index
                </h3>
                <p className="text-xs text-slate-400">Achievements unlockable across all 16 games</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MASTER_BADGES_CATALOG.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition flex items-start gap-4"
                  >
                    <div className="text-3xl bg-purple-500/10 border border-purple-500/30 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      {b.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-white">{b.title}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {b.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                      <span className="text-[10px] font-bold text-sky-400 block pt-1">
                        Category: {b.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Selected User Inspector */}
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
