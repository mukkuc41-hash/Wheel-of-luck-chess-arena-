import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Shield,
  ShieldAlert,
  Radio,
  Compass,
  MapPin,
  Activity,
  AlertOctagon,
  UserCheck,
  UserX,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SpatialAudioEngine, SpatialPeerNode, PlayerCoordinate } from '../utils/spatialAudioEngine';
import { socketService } from '../utils/socket';
import { VoiceReportModal } from './VoiceReportModal';

interface VoiceProximityPanelProps {
  currentUsername: string;
  roomId?: string;
  boardWidth?: number; // Board dimension for coordinate mapping
}

export const VoiceProximityPanel: React.FC<VoiceProximityPanelProps> = ({
  currentUsername,
  roomId = 'default_lounge',
  boardWidth = 8,
}) => {
  const [engine, setEngine] = useState<SpatialAudioEngine | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [peers, setPeers] = useState<SpatialPeerNode[]>([]);
  const [myPos, setMyPos] = useState<PlayerCoordinate>({ x: 4, y: 4, z: 0 });
  const [aiShieldActive, setAiShieldActive] = useState(true);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [reportingPeer, setReportingPeer] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'radar' | 'peers' | 'moderation'>('radar');

  // Initialize Spatial Audio Engine on mount
  useEffect(() => {
    const spatialEngine = new SpatialAudioEngine(
      currentUsername,
      (updatedPeers) => setPeers([...updatedPeers]),
      (peerId, reason) => {
        setAiWarning(`AI Shield Auto-Muted Peer (${peerId}): ${reason}`);
        setTimeout(() => setAiWarning(null), 8000);
      }
    );

    const activeSocket = socketService.getSocket() || socketService.connect();
    spatialEngine.bindSocket(activeSocket, roomId);
    spatialEngine.setLocalPosition(4, 4, 0);
    setEngine(spatialEngine);

    // Mock initial demo spatial peers for rich UI feedback if alone
    spatialEngine.updatePeerPosition('peer_gm1', 'Grandmaster_Arjun', { x: 2, y: 3, z: 0 });
    spatialEngine.updatePeerPosition('peer_coach', 'Coach_Sarah', { x: 6, y: 5, z: 0 });

    return () => {
      spatialEngine.destroy();
    };
  }, [currentUsername, roomId]);

  // Toggle Microphone
  const toggleMicrophone = async () => {
    if (!engine) return;

    if (isMicOn) {
      engine.stopMicrophone();
      setIsMicOn(false);
    } else {
      try {
        await engine.startMicrophone();
        setIsMicOn(true);
      } catch (err) {
        alert('Could not activate microphone. Please verify browser permissions.');
      }
    }
  };

  // Move Local Position on Radar Canvas
  const handleRadarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!engine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale canvas coordinates (0-200px) to game grid coordinates (0-8 meters)
    const newX = Math.round((clickX / rect.width) * 8 * 10) / 10;
    const newY = Math.round((clickY / rect.height) * 8 * 10) / 10;

    const updatedPos = { x: newX, y: newY, z: 0 };
    setMyPos(updatedPos);
    engine.setLocalPosition(newX, newY, 0);
  };

  // Toggle Client Mute for a Peer
  const handleTogglePeerMute = (peerId: string, currentMuted: boolean) => {
    if (engine) {
      engine.setPeerMute(peerId, !currentMuted);
    }
  };

  // Trigger Mock Server AI Moderation Check (Demo Trigger)
  const handleSimulateAIAudit = async (peerId: string, username: string) => {
    try {
      const res = await fetch('/api/moderation/classify-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakerUsername: username,
          peerId,
          roomId,
          audioTranscript: 'Simulated abusive behavior outburst',
          peakDb: -3,
        }),
      });
      const data = await res.json();
      if (data.autoMuted) {
        setAiWarning(`[AI SHIELD TRIGGERED] ${username} auto-muted instantly. Violation: ${data.category}`);
        if (engine) {
          engine.setPeerMute(peerId, true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-950/90 border border-indigo-500/30 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl text-white w-full max-w-md my-3 transition-all">
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/60 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            {isMicOn && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>3D Spatial Voice Lounge</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-mono font-semibold text-emerald-300">
                WebRTC
              </span>
            </h3>
            <p className="text-[11px] text-indigo-200/70 flex items-center gap-1.5 font-mono">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>
                Pos: ({myPos.x}m, {myPos.y}m)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mic Quick Toggle */}
          <button
            onClick={toggleMicrophone}
            className={`p-2.5 rounded-2xl border transition shadow-lg flex items-center gap-2 text-xs font-bold ${
              isMicOn
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 shadow-emerald-950/50'
                : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30 shadow-red-950/50'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
            <span className="hidden sm:inline">{isMicOn ? 'Mic On' : 'Mic Muted'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* AI Shield Alert Bar */}
      {aiWarning && (
        <div className="bg-red-500/20 border-b border-red-500/40 p-3 text-xs text-red-200 flex items-center gap-2 animate-fadeIn">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
          <span className="font-semibold">{aiWarning}</span>
        </div>
      )}

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Spatial Radar</span>
            </button>
            <button
              onClick={() => setActiveTab('peers')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'peers'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Nearby ({peers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'moderation'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Shield</span>
            </button>
          </div>

          {/* TAB 1: 3D Spatial Radar Visualizer */}
          {activeTab === 'radar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Click grid to shift 3D spatial position
                </span>
                <span className="font-mono text-[10px] text-indigo-300">PannerNode: HRTF</span>
              </div>

              {/* Radar Grid Box */}
              <div
                onClick={handleRadarClick}
                className="w-full aspect-square max-h-56 bg-slate-900/90 border border-indigo-500/30 rounded-2xl relative overflow-hidden cursor-crosshair shadow-inner group"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.95) 70%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '100% 100%, 20px 20px, 20px 20px',
                }}
              >
                {/* Distance Rings */}
                <div className="absolute inset-4 rounded-full border border-indigo-500/20 pointer-events-none" />
                <div className="absolute inset-12 rounded-full border border-indigo-500/20 pointer-events-none" />
                <div className="absolute inset-20 rounded-full border border-indigo-500/10 pointer-events-none" />

                {/* Local Player Marker */}
                <div
                  className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg shadow-indigo-500/50 z-20 transition-all duration-300"
                  style={{
                    left: `${(myPos.x / 8) * 100}%`,
                    top: `${(myPos.y / 8) * 100}%`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>

                {/* Remote Peers Markers */}
                {peers.map((p) => {
                  const leftPct = (p.position.x / 8) * 100;
                  const topPct = (p.position.y / 8) * 100;
                  const volPct = Math.round(p.volume * 100);

                  return (
                    <div
                      key={p.peerId}
                      className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border flex items-center justify-center text-[10px] font-bold z-10 transition-all duration-300 shadow-md ${
                        p.isAutoMutedByAI
                          ? 'bg-red-950/80 border-red-500 text-red-400'
                          : p.isMuted
                          ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                          : 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      }`}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                      title={`${p.username} (${p.distance}m away • ${volPct}% volume)`}
                    >
                      <span>{p.username.substring(0, 2).toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <span>You</span>
                  <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full ml-2" />
                  <span>Nearby Peer</span>
                </div>
                <span className="text-indigo-300 font-mono text-[10px]">Max Range: 30m</span>
              </div>
            </div>
          )}

          {/* TAB 2: Nearby Proximity Peers List */}
          {activeTab === 'peers' && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {peers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                  <Radio className="w-6 h-6 mx-auto opacity-40 animate-pulse" />
                  <p>Searching for nearby spatial voice players...</p>
                </div>
              ) : (
                peers.map((p) => {
                  const volPct = Math.round(p.volume * 100);

                  return (
                    <div
                      key={p.peerId}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                            p.isAutoMutedByAI
                              ? 'bg-red-500/20 border-red-400 text-red-300'
                              : 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          }`}
                        >
                          {p.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{p.username}</span>
                            {p.isAutoMutedByAI && (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/30 text-red-300 text-[9px] border border-red-400/40">
                                AI Muted
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">
                            <span>Dist: {p.distance}m</span>
                            <span>•</span>
                            <span>Vol: {volPct}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Client Mute Toggle */}
                        <button
                          onClick={() => handleTogglePeerMute(p.peerId, p.isMuted)}
                          className={`p-2 rounded-xl border transition text-xs ${
                            p.isMuted || p.isAutoMutedByAI
                              ? 'bg-red-500/20 border-red-500/40 text-red-300'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                          }`}
                          title={p.isMuted ? 'Unmute Player' : 'Mute Player'}
                        >
                          {p.isMuted || p.isAutoMutedByAI ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>

                        {/* Trigger AI Audit (Demo) */}
                        <button
                          onClick={() => handleSimulateAIAudit(p.peerId, p.username)}
                          className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 text-xs transition"
                          title="Run AI Speech Audit"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Report Button */}
                        <button
                          onClick={() => setReportingPeer(p.username)}
                          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs transition"
                          title="Report Voice Misconduct"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: AI Moderation & Automated Safety Status */}
          {activeTab === 'moderation' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Automated AI Audio Shield
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] text-emerald-300 font-mono">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Real-time audio classification pipeline monitors incoming WebRTC stream energy & speech transcripts to automatically mute toxic outbursts, slurs, or harassment instantly.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-gray-400">Audio Codec</div>
                  <div className="font-bold text-white font-mono">Opus 48kHz</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-gray-400">Target Delay</div>
                  <div className="font-bold text-emerald-400 font-mono">&lt; 45ms</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-gray-400">Spatial Engine</div>
                  <div className="font-bold text-indigo-300 font-mono">HRTF Panner</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-gray-400">Privacy Mode</div>
                  <div className="font-bold text-white font-mono">Ephemeral RAM</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Report Modal */}
      {reportingPeer && (
        <VoiceReportModal
          isOpen={!!reportingPeer}
          onClose={() => setReportingPeer(null)}
          reportedUser={reportingPeer}
          roomId={roomId}
          transcriptSnapshot="[Telemetry Attached]: 3D Spatial Audio Coordinates (2.4m), Peak dB -4dB."
          onReportSubmitted={(user) => {
            setAiWarning(`Report submitted for ${user}. Voice stream blocked.`);
            setReportingPeer(null);
          }}
        />
      )}
    </div>
  );
};
