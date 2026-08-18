import React, { useState, useEffect } from 'react';
import { Bell, Download, FileSpreadsheet, FileJson, Shield, Radio, CheckCircle, Award, Zap } from 'lucide-react';
import { telemetryEngine } from '../../utils/telemetryEngine';
import { TelemetryAlert } from '../../types/telemetry';

export const TelemetryAlertsAndExport: React.FC = () => {
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);

  useEffect(() => {
    const updateData = () => {
      setAlerts(telemetryEngine.getTelemetryAlerts());
    };

    updateData();
    const unsubscribe = telemetryEngine.subscribe(updateData);
    const unsubscribeAlerts = telemetryEngine.subscribeAlerts(() => updateData());

    return () => {
      unsubscribe();
      unsubscribeAlerts();
    };
  }, []);

  return (
    <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Milestone Telemetry Alerts & Data Export Engine
              </h3>
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" /> LIVE NOTIFICATIONS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Platform milestone alerts & instant CSV/JSON telemetry downloads
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => telemetryEngine.exportTelemetryCSV()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-extrabold text-xs border border-emerald-500/40 transition flex items-center gap-2 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download CSV
          </button>

          <button
            onClick={() => telemetryEngine.exportTelemetryJSON()}
            className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 font-extrabold text-xs border border-sky-500/40 transition flex items-center gap-2 shadow-md"
          >
            <FileJson className="w-4 h-4" /> Download JSON
          </button>
        </div>
      </div>

      {/* Live Alerts Stream List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Recent Platform Milestone & Achievement Alerts
        </h4>

        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 max-h-52 overflow-y-auto scrollbar-thin space-y-2">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No new milestone alerts yet. Rank ups, badge unlocks, and match wins will trigger live alerts here!
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 shrink-0">
                    {a.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{a.title}</span>
                      <span className="text-[10px] text-amber-400">
                        {a.userCountry.flagEmoji} {a.username}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{a.message}</p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
