import React, { useState, useEffect } from 'react';
import { Globe, Users, Flame, Zap, Shield, ChevronRight, Activity, Radio } from 'lucide-react';
import { telemetryEngine, SUPPORTED_COUNTRIES } from '../../utils/telemetryEngine';
import { CountryTelemetryMetrics, TelemetryUser } from '../../types/telemetry';

interface CountryCoordinates {
  code: string;
  cx: number; // percentage 0-100
  cy: number; // percentage 0-100
}

const COUNTRY_MAP_COORDS: Record<string, { cx: number; cy: number }> = {
  US: { cx: 22, cy: 36 },
  CA: { cx: 20, cy: 22 },
  BR: { cx: 34, cy: 66 },
  GB: { cx: 48, cy: 26 },
  FR: { cx: 49, cy: 31 },
  DE: { cx: 52, cy: 28 },
  ES: { cx: 47, cy: 36 },
  IT: { cx: 52, cy: 34 },
  KE: { cx: 58, cy: 57 },
  AE: { cx: 62, cy: 45 },
  IN: { cx: 69, cy: 46 },
  KR: { cx: 82, cy: 38 },
  JP: { cx: 86, cy: 37 },
  AU: { cx: 85, cy: 72 },
};

interface MiniWorldMapHeatmapProps {
  onSelectCountry?: (countryCode: string) => void;
  selectedCountryCode?: string;
  onSelectUser?: (user: TelemetryUser) => void;
}

export const MiniWorldMapHeatmap: React.FC<MiniWorldMapHeatmapProps> = ({
  onSelectCountry,
  selectedCountryCode = 'ALL',
  onSelectUser,
}) => {
  const [metrics, setMetrics] = useState<CountryTelemetryMetrics[]>([]);
  const [allUsers, setAllUsers] = useState<TelemetryUser[]>([]);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  useEffect(() => {
    const updateData = () => {
      setMetrics(telemetryEngine.getCountryMetrics());
      setAllUsers(telemetryEngine.getAllUsers());
    };

    updateData();
    const unsubscribe = telemetryEngine.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  const totalActivePlayers = allUsers.filter(
    (u) => u.onlineStatus === 'In Match' || u.onlineStatus === 'In Lobby' || u.onlineStatus === 'Spectating'
  ).length;

  const activeCountriesCount = metrics.filter((m) => m.activePlayerCount > 0).length;

  // Find max active count for heatmap intensity scale
  const maxActive = Math.max(...metrics.map((m) => m.activePlayerCount), 1);

  const getHeatmapColor = (activeCount: number) => {
    if (activeCount === 0) return { dot: '#475569', fill: 'rgba(71, 85, 105, 0.2)', stroke: '#334155' };
    const ratio = activeCount / maxActive;
    if (ratio >= 0.7) {
      return { dot: '#ef4444', fill: 'rgba(239, 68, 68, 0.45)', stroke: '#f87171', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.8)]' };
    }
    if (ratio >= 0.3) {
      return { dot: '#f59e0b', fill: 'rgba(245, 158, 11, 0.4)', stroke: '#fbbf24', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.7)]' };
    }
    return { dot: '#06b6d4', fill: 'rgba(6, 182, 212, 0.35)', stroke: '#38bdf8', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.6)]' };
  };

  const hoveredMetrics = metrics.find((m) => m.country.code === hoveredCode);
  const hoveredCountryUsers = allUsers.filter((u) => u.country.code === hoveredCode);

  return (
    <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Global Live Player Density Map
              </h3>
              <span className="flex items-center gap-1 text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active player heatmaps derived strictly from real active game sessions
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2 sm:gap-4 self-start sm:self-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-1.5 text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Real Active Players</span>
            <span className="text-xs font-black text-sky-400 font-mono">{totalActivePlayers} Online</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-1.5 text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Countries Active</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {activeCountriesCount} / {SUPPORTED_COUNTRIES.length}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[220px] max-h-[380px] bg-[#050811] rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
        
        {/* Subtle grid background pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle, rgba(56, 189, 248, 0.25) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG World Map Vector Outline */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(14,165,233,0.15)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Lines */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>

            {/* Glowing Hotspot Gradients */}
            <radialGradient id="heatRed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>

            <radialGradient id="heatAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.8)" />
              <stop offset="50%" stopColor="rgba(245, 158, 11, 0.3)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </radialGradient>

            <radialGradient id="heatCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.8)" />
              <stop offset="50%" stopColor="rgba(56, 189, 248, 0.3)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </radialGradient>
          </defs>

          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Continent Silhouettes (Stylized World Map Paths) */}
          <g fill="rgba(30, 41, 59, 0.5)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.2">
            {/* North America */}
            <path d="M 120 100 Q 180 80 280 90 L 320 160 Q 280 230 200 240 Q 140 220 100 160 Z" />
            {/* South America */}
            <path d="M 280 260 Q 350 280 380 340 L 340 450 Q 290 440 270 350 Z" />
            {/* Europe */}
            <path d="M 460 110 Q 550 100 580 160 L 520 210 Q 450 200 440 150 Z" />
            {/* Africa */}
            <path d="M 450 220 Q 580 210 610 290 L 580 410 Q 500 420 460 320 Z" />
            {/* Asia */}
            <path d="M 590 100 Q 820 80 900 180 L 800 280 Q 650 260 580 180 Z" />
            {/* Australia */}
            <path d="M 780 330 Q 890 320 900 390 L 820 420 Q 770 400 780 330 Z" />
          </g>

          {/* Flight/Latency Connection Arcs connecting active hubs */}
          <g opacity="0.3">
            <path d="M 220 180 Q 350 100 480 130" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M 480 130 Q 580 120 690 230" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M 690 230 Q 780 200 860 185" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
          </g>

          {/* Country Heatmap Nodes & Pulse Radar Rings */}
          {SUPPORTED_COUNTRIES.map((c) => {
            const coords = COUNTRY_MAP_COORDS[c.code] || { cx: 50, cy: 50 };
            const svgX = (coords.cx / 100) * 1000;
            const svgY = (coords.cy / 100) * 500;

            const m = metrics.find((item) => item.country.code === c.code);
            const activeCount = m ? m.activePlayerCount : 0;
            const isHovered = hoveredCode === c.code;
            const isSelected = selectedCountryCode === c.code;

            const styling = getHeatmapColor(activeCount);
            const heatRadius = activeCount > 0 ? Math.min(25 + activeCount * 12, 60) : 10;

            return (
              <g
                key={c.code}
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectCountry && onSelectCountry(c.code)}
                onMouseEnter={() => setHoveredCode(c.code)}
                onMouseLeave={() => setHoveredCode(null)}
              >
                {/* Outer Heat Aura Gradient */}
                {activeCount > 0 && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={heatRadius}
                    fill={
                      activeCount / maxActive >= 0.7
                        ? 'url(#heatRed)'
                        : activeCount / maxActive >= 0.3
                        ? 'url(#heatAmber)'
                        : 'url(#heatCyan)'
                    }
                    className="animate-pulse opacity-80"
                  />
                )}

                {/* Radar Pulse Wave (Only when active) */}
                {activeCount > 0 && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={heatRadius * 0.75}
                    fill="none"
                    stroke={styling.stroke}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Selection Highlight Ring */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={heatRadius + 6}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Center Core Node */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={activeCount > 0 ? (isHovered ? 8 : 6) : 3.5}
                  fill={styling.dot}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Country Flag & Active Badge Overlay */}
                <foreignObject
                  x={svgX - 20}
                  y={svgY - 32}
                  width="40"
                  height="24"
                  className="pointer-events-none overflow-visible"
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {c.flagEmoji}
                    </span>
                    {activeCount > 0 && (
                      <span className="text-[9px] font-black font-mono bg-sky-500/90 text-slate-950 px-1 rounded shadow-md border border-sky-300 -mt-1">
                        {activeCount}
                      </span>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center gap-3 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
            Density Intensity:
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> 0 Offline
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block animate-pulse" /> Low (1)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" /> Med (2)
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" /> High (3+)
            </span>
          </div>
        </div>

        {/* Hovered Country Popover Tooltip */}
        {hoveredMetrics && (
          <div className="absolute top-3 right-3 bg-slate-950/95 border border-sky-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-[220px] animate-fadeIn pointer-events-none z-20 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{hoveredMetrics.country.flagEmoji}</span>
                <span className="text-xs font-black text-white">{hoveredMetrics.country.name}</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold px-1.5 py-0.5 rounded border border-sky-400/30">
                {hoveredMetrics.country.code}
              </span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Real Active Players:</span>
                <span className="font-bold text-emerald-400">{hoveredMetrics.activePlayerCount} Online</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Top Player:</span>
                <span className="font-bold text-sky-300 truncate max-w-[110px]">
                  {hoveredMetrics.topRankedUser}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Avg Win Rate:</span>
                <span className="font-bold text-amber-400">{hoveredMetrics.avgWinRate}%</span>
              </div>
            </div>

            {hoveredCountryUsers.length > 0 && (
              <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 italic">
                Click map marker to filter telemetry dashboard
              </div>
            )}
          </div>
        )}
      </div>

      {/* Country Selection Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => onSelectCountry && onSelectCountry('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            selectedCountryCode === 'ALL'
              ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> All Regions ({totalActivePlayers})
        </button>

        {metrics.map((m) => {
          const isSelected = selectedCountryCode === m.country.code;
          return (
            <button
              key={m.country.code}
              onClick={() => onSelectCountry && onSelectCountry(m.country.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/30'
                  : m.activePlayerCount > 0
                  ? 'bg-slate-900 text-sky-300 hover:bg-slate-800 border border-sky-500/40'
                  : 'bg-slate-950/60 text-slate-500 hover:text-slate-300 border border-slate-800'
              }`}
            >
              <span>{m.country.flagEmoji}</span>
              <span>{m.country.name}</span>
              {m.activePlayerCount > 0 && (
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                  {m.activePlayerCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
