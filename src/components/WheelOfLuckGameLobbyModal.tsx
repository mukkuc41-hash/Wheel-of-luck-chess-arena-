import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Sparkles,
  RotateCw,
  Zap,
  CheckCircle2,
  Crown,
  Swords,
  ChevronDown,
} from 'lucide-react';
import { GameCatalogItem } from './WheelOfLuckMainCatalog';
import { ActiveBoardGame } from '../types';

export interface LobbyParticipant {
  id: string;
  username: string;
  avatar: string;
  colorHex: string;
}

interface WheelOfLuckGameLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGame: GameCatalogItem | null;
  currentUserUsername: string;
  onTeleportToMatch: (gameId: ActiveBoardGame, selectedParticipants: LobbyParticipant[]) => void;
}

// 16 VIBRANT CASINO SLICE COLORS matching the image
const WHEEL_16_COLORS = [
  '#f59e0b', // Gold / Yellow
  '#ea580c', // Orange
  '#ef4444', // Red
  '#e11d48', // Deep Rose
  '#c026d3', // Magenta
  '#9333ea', // Purple
  '#7c3aed', // Violet
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#16a34a', // Green
  '#65a30d', // Lime
  '#d97706', // Amber
  '#dc2626', // Red
];

export const WheelOfLuckGameLobbyModal: React.FC<WheelOfLuckGameLobbyModalProps> = ({
  isOpen,
  onClose,
  selectedGame,
  currentUserUsername,
  onTeleportToMatch,
}) => {
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedWinners, setSelectedWinners] = useState<LobbyParticipant[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const onTeleportRef = useRef(onTeleportToMatch);
  useEffect(() => {
    onTeleportRef.current = onTeleportToMatch;
  }, [onTeleportToMatch]);

  // Initialize lobby participants list whenever modal opens
  useEffect(() => {
    if (!isOpen || !selectedGame) return;

    const currentName = currentUserUsername ? currentUserUsername.toLowerCase().replace(/\s+/g, '') : 'guest01';

    // Build exactly 16 guests list to match the 16-slice Wheel of Luck in the reference image
    const initialList: LobbyParticipant[] = [
      {
        id: 'user_local',
        username: currentName.startsWith('guest') ? currentName : `guest01`,
        avatar: '👤',
        colorHex: WHEEL_16_COLORS[0],
      },
    ];

    for (let i = 2; i <= 16; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      initialList.push({
        id: `guest_${i}`,
        username: `guest${numStr}`,
        avatar: '👤',
        colorHex: WHEEL_16_COLORS[(i - 1) % WHEEL_16_COLORS.length],
      });
    }

    setParticipants(initialList);
    setIsSpinning(false);
    setSelectedWinners([]);
    setCountdownSeconds(null);
    setWheelRotation(0);
  }, [isOpen, selectedGame, currentUserUsername]);

  // Handle Teleportation trigger
  const executeTeleport = () => {
    if (selectedGame) {
      onTeleportRef.current(selectedGame.id, selectedWinners);
    }
  };

  // Handle Wheel Spin Action
  const handleSpinWheel = () => {
    if (isSpinning || !selectedGame || participants.length === 0) return;

    setIsSpinning(true);
    setSelectedWinners([]);
    setCountdownSeconds(null);

    // Spin multiple full rotations + random angle offset
    const extraTurns = 6 + Math.floor(Math.random() * 5); // 6 to 10 full turns
    const randomDegrees = Math.floor(Math.random() * 360);
    const totalRotation = wheelRotation + extraTurns * 360 + randomDegrees;

    setWheelRotation(totalRotation);

    // Select target number of players based on selected game maxPlayers
    setTimeout(() => {
      setIsSpinning(false);

      const capacity = selectedGame.maxPlayers;
      // Guarantee local user is included + random peers to match target count
      const otherPeers = participants.filter((p) => p.id !== 'user_local');
      const shuffled = [...otherPeers].sort(() => 0.5 - Math.random());
      const selected = [participants[0], ...shuffled.slice(0, capacity - 1)];

      setSelectedWinners(selected);
      setCountdownSeconds(3);
    }, 4000);
  };

  // Teleport countdown tick down
  useEffect(() => {
    if (countdownSeconds === null) return;

    if (countdownSeconds <= 0) {
      if (selectedGame) {
        executeTeleport();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownSeconds, selectedGame]);

  if (!isOpen || !selectedGame) return null;

  const totalSlices = participants.length;
  const sliceAngle = 360 / totalSlices;

  // Generate 16 Glowing Bulbs around the golden wheel border
  const bulbAngles = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
      <div className="bg-[#090704] border-2 border-[#d4af37]/60 rounded-3xl w-full max-w-5xl shadow-[0_0_100px_rgba(212,175,55,0.3)] overflow-hidden text-white my-auto flex flex-col relative">
        {/* Top Header Section */}
        <div className="pt-5 pb-3 px-6 text-center bg-gradient-to-b from-[#1c150b] via-[#0d0905] to-transparent border-b border-[#d4af37]/20 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-amber-200/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Crown Icon */}
          <div className="flex justify-center mb-1">
            <Crown className="w-8 h-8 text-[#f5d061] filter drop-shadow-[0_0_10px_rgba(245,208,97,0.8)]" />
          </div>

          {/* Golden Serif Title */}
          <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#fff3be] via-[#f5d061] to-[#b8860b] uppercase drop-shadow-[0_2px_12px_rgba(245,208,97,0.5)]">
            WHEEL OF LUCK
          </h1>

          {/* Subtitle */}
          <div className="mt-1 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-wider text-[#e6ca65]">
            <span>✦</span>
            <span>{selectedGame.maxPlayers} PLAYERS WILL BE CHOSEN RANDOMLY</span>
            <span>✦</span>
          </div>
        </div>

        {/* 3-Column Main Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 overflow-y-auto">
          {/* LEFT COLUMN: WAITING PLAYERS */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#140f08] to-[#0a0704] border border-[#d4af37]/40 rounded-2xl p-4 flex flex-col h-[400px] lg:h-[460px] shadow-lg shadow-black/80">
            <div className="text-center pb-2 border-b border-[#d4af37]/30 mb-3">
              <h3 className="text-xs font-black font-serif uppercase tracking-wider text-[#f5d061]">
                WAITING PLAYERS
              </h3>
            </div>

            {/* Scrollable Guest Handles */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#d4af37]/30">
              {participants.map((p) => {
                const isSelected = selectedWinners.some((w) => w.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition ${
                      isSelected
                        ? 'bg-amber-500/30 border border-[#f5d061] text-[#fff3be] font-extrabold shadow-md'
                        : 'bg-white/5 border border-white/5 text-amber-100/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-amber-400">👤</span>
                    <span className="truncate">{p.username}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Total Footer Counter */}
            <div className="pt-3 border-t border-[#d4af37]/30 mt-2 flex items-center justify-between text-xs text-[#e6ca65] font-bold">
              <span>TOTAL</span>
              <span className="flex items-center gap-1">
                <span>👤</span>
                <span>{participants.length}</span>
              </span>
            </div>
          </div>

          {/* CENTER COLUMN: THE GOLDEN CASINO WHEEL OF LUCK */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative my-2">
            {/* Top Pointer Teardrop Marker */}
            <div className="relative z-30 mb-[-18px] flex flex-col items-center">
              <div className="w-8 h-10 rounded-b-full bg-gradient-to-b from-[#fff3be] via-[#f5d061] to-[#b8860b] border-2 border-amber-200 shadow-[0_0_20px_rgba(245,208,97,0.9)] flex items-center justify-center text-slate-950 font-extrabold text-xs">
                👤
              </div>
            </div>

            {/* Golden Wheel Outer Ring with Glowing Bulb Studs */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full p-4 bg-gradient-to-b from-[#ffd700] via-[#b8860b] to-[#4a3300] shadow-[0_0_60px_rgba(212,175,55,0.4)] border-4 border-[#fff3be] flex items-center justify-center">
              {/* Perimeter Glowing Bulbs */}
              {bulbAngles.map((angle, idx) => {
                const radius = 48; // percent
                const x = 50 + radius * Math.cos((Math.PI * angle) / 180);
                const y = 50 + radius * Math.sin((Math.PI * angle) / 180);

                return (
                  <div
                    key={idx}
                    className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#fffbda] border border-[#d4af37] shadow-[0_0_12px_#ffe066] animate-pulse"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  />
                );
              })}

              {/* Rotating Inner Wheel Container */}
              <div
                className="w-full h-full rounded-full relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.12, 0.8, 0.2, 1) border-2 border-slate-950"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {participants.map((p, idx) => {
                    const startAngle = idx * sliceAngle - 90; // Align slice top
                    const endAngle = (idx + 1) * sliceAngle - 90;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    // Mid angle for rendering radial username text
                    const midAngle = (startAngle + endAngle) / 2;
                    const textRadius = 34;
                    const tx = 50 + textRadius * Math.cos((Math.PI * midAngle) / 180);
                    const ty = 50 + textRadius * Math.sin((Math.PI * midAngle) / 180);

                    return (
                      <g key={p.id}>
                        <path
                          d={pathData}
                          fill={p.colorHex}
                          stroke="#0a0704"
                          strokeWidth="0.6"
                        />
                        {/* Player Icon & Name Radial Label */}
                        <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                          <text
                            x="0"
                            y="0"
                            fill="#ffffff"
                            fontSize="3"
                            fontWeight="800"
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              textShadow: '0px 1px 3px rgba(0,0,0,0.9)',
                              fontFamily: 'sans-serif',
                            }}
                          >
                            👤 {p.username}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* Central Golden SPIN Hub Button */}
                <button
                  onClick={handleSpinWheel}
                  disabled={isSpinning || countdownSeconds !== null}
                  className="absolute inset-0 m-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-[#fff3be] via-[#f5d061] to-[#996515] border-4 border-[#fff3be] shadow-[0_0_30px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 active:scale-95 transition duration-200 z-20 group disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  <Crown className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition" />
                  <span className="text-base sm:text-lg font-black font-serif text-slate-950 tracking-wider uppercase drop-shadow">
                    SPIN
                  </span>
                </button>
              </div>
            </div>

            {/* Stand Base below wheel */}
            <div className="w-48 h-8 bg-gradient-to-b from-[#b8860b] via-[#4a3300] to-[#1c150b] rounded-b-2xl border-t border-[#f5d061] shadow-2xl flex items-center justify-center mt-[-10px] z-10">
              <div className="w-36 h-2 bg-[#f5d061]/40 rounded-full" />
            </div>

            {/* Bottom GOOD LUCK Badge */}
            <div className="mt-3 px-6 py-1.5 rounded-full bg-gradient-to-r from-transparent via-[#1c150b] to-transparent border border-[#d4af37]/40 text-xs font-serif font-extrabold text-[#f5d061] tracking-widest uppercase">
              ✦ GOOD LUCK! ✦
            </div>

            {/* Teleportation Banner Overlay */}
            {selectedWinners.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-400 text-center shadow-2xl z-30 flex flex-col items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-200 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>
                    Selected {selectedWinners.length} Players! Teleporting to {selectedGame.name}{' '}
                    {countdownSeconds !== null && <strong>in {countdownSeconds}s...</strong>}
                  </span>
                </span>
                <button
                  onClick={executeTeleport}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Teleport to Match Now &gt;</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: HOW IT WORKS */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#140f08] to-[#0a0704] border border-[#d4af37]/40 rounded-2xl p-4 flex flex-col h-[400px] lg:h-[460px] shadow-lg shadow-black/80 justify-between">
            <div className="text-center pb-2 border-b border-[#d4af37]/30 mb-2">
              <h3 className="text-xs font-black font-serif uppercase tracking-wider text-[#f5d061]">
                HOW IT WORKS
              </h3>
            </div>

            {/* Vertical Workflow Steps matching image */}
            <div className="flex-1 flex flex-col justify-around items-center py-2 text-center text-xs text-amber-100/90 space-y-1">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#2a1f10] border border-[#d4af37]/50 flex items-center justify-center text-base mb-1 shadow">
                  👥
                </div>
                <span className="text-[11px] font-medium">Players join the lobby</span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#f5d061] opacity-70" />

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#2a1f10] border border-[#d4af37]/50 flex items-center justify-center text-base mb-1 shadow">
                  🎡
                </div>
                <span className="text-[11px] font-medium">Spin the wheel</span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#f5d061] opacity-70" />

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#2a1f10] border border-[#d4af37]/50 flex items-center justify-center text-base mb-1 shadow">
                  👥
                </div>
                <span className="text-[11px] font-medium">
                  {selectedGame.maxPlayers} players will be chosen
                </span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#f5d061] opacity-70" />

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#2a1f10] border border-[#d4af37]/50 flex items-center justify-center text-base mb-1 shadow">
                  ♟️
                </div>
                <span className="text-[11px] font-medium">Random color assignment</span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#f5d061] opacity-70" />

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-[#2a1f10] border border-[#d4af37]/50 flex items-center justify-center text-base mb-1 shadow">
                  ⚔️
                </div>
                <span className="text-[11px] font-bold text-[#f5d061]">Let the game begin!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
