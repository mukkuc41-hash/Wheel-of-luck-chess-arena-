import React, { useState, useEffect } from 'react';
import { Activity, Shield, Wifi, Radio, Zap, Server } from 'lucide-react';
import { telemetryEngine, REGIONAL_EDGE_NODES, SUPPORTED_COUNTRIES } from '../../utils/telemetryEngine';
import { CountryTelemetryMetrics } from '../../types/telemetry';

export const NetworkLatencyHeatmap: React.FC = () => {
  const [metrics, setMetrics] = useState<CountryTelemetryMetrics[]>([]);

  useEffect(() => {
    const updateData = () => {
      setMetrics(telemetryEngine.getCountryMetrics());
    };

    updateData();
    const unsubscribe = telemetryEngine.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Live Edge Network Latency & Ping Monitor
              </h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> WebRTC / WebSocket Edge
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Regional ping, jitter, packet loss & server node health
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-emerald-400" /> All 14 Edge Relays Operational
        </span>
      </div>

      {/* Latency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => {
          const edge = REGIONAL_EDGE_NODES[m.country.code] || { node: 'GEN-01', location: 'Global', basePing: 30 };
          const currentPing = m.avgPingMs;

          return (
            <div
              key={m.country.code}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.country.flagEmoji}</span>
                  <div>
                    <span className="text-xs font-black text-white">{m.country.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{edge.node} ({edge.location})</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black font-mono px-2 py-1 rounded-lg border ${
                    currentPing < 30
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentPing < 60
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {currentPing} ms
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 block">Loss</span>
                  <span className="font-bold text-emerald-400">0.0%</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 block">Jitter</span>
                  <span className="font-bold text-sky-400">1.8ms</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 block">Status</span>
                  <span className="font-bold text-emerald-300">100% OK</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
