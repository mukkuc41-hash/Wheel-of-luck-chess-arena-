import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, PieChart as PieIcon, Zap, Radio, Globe } from 'lucide-react';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { ConcurrencyDataPoint, OutcomeRatioDataPoint, PlaytimeVelocityDataPoint } from '../../types/telemetry';
import { MiniWorldMapHeatmap } from './MiniWorldMapHeatmap';

export const RealTimeDataCharts: React.FC = () => {
  const [concurrencyData, setConcurrencyData] = useState<ConcurrencyDataPoint[]>([]);
  const [outcomeData, setOutcomeData] = useState<OutcomeRatioDataPoint[]>([]);
  const [velocityData, setVelocityData] = useState<PlaytimeVelocityDataPoint[]>([]);

  const refreshCharts = () => {
    setConcurrencyData(telemetryEngine.get24hConcurrencyData());
    setOutcomeData(telemetryEngine.getOutcomeRatioData());
    setVelocityData(telemetryEngine.getPlaytimeVelocityData());
  };

  useEffect(() => {
    refreshCharts();
    const unsubscribe = telemetryEngine.subscribe(refreshCharts);
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* 0. Live Interactive World Map Heatmap */}
      <MiniWorldMapHeatmap />

      {/* 1. Live Match Concurrency Area Chart */}
      <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                Live Match Concurrency Chart
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio className="w-3 h-3 text-emerald-400" /> REAL-TIME STREAM
                </span>
              </h3>
              <p className="text-xs text-slate-400">24-Hour player volume across Chess, Card Games & Board Games</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={concurrencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorChess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px' }}
                labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="totalActive" name="Total Concurrency" stroke="#38bdf8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="chessActive" name="Chess & Strategy" stroke="#a855f7" fillOpacity={1} fill="url(#colorChess)" strokeWidth={2} />
              <Area type="monotone" dataKey="cardGamesActive" name="Uno & Card Hub" stroke="#22c55e" fillOpacity={1} fill="url(#colorCards)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grid for Win/Loss Doughnut & Velocity Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Outcome Ratio Pie Chart */}
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Win/Loss Ratio Distribution
              </h3>
              <p className="text-[11px] text-slate-400">Global Match Outcomes Breakdown</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Play-Time Velocity Heatmap Bar Chart */}
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Play-Time Velocity Heatmap
              </h3>
              <p className="text-[11px] text-slate-400">Peak Engagement Velocity by Global Hour</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#a855f7', borderRadius: '10px' }}
                />
                <Bar dataKey="engagementIndex" name="Engagement Index" fill="#a855f7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="activeMatches" name="Active Matches" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
