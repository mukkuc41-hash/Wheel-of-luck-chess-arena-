import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  Coins,
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Gift,
  Zap,
  Info,
  Crown,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkDailyWheelStatus,
  recordDailyWheelSpin,
  getUserPoints,
  SEGMENTS_25_CONFIG,
  WheelSegmentConfig,
  determineWinningWheelSlice,
  getGlobalJackpotAnnualState,
  GlobalJackpotAnnualState,
} from '../utils/pointsManager';
import { playCinematicSound } from '../utils/cinematicVfx';
import { soundFx } from '../utils/audio';

interface DailyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuestsOrHatrick?: () => void;
}

export const DailyWheelModal: React.FC<DailyWheelModalProps> = ({
  isOpen,
  onClose,
  onOpenQuestsOrHatrick,
}) => {
  const [wheelStatus, setWheelStatus] = useState(() => checkDailyWheelStatus());
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonSlice, setWonSlice] = useState<WheelSegmentConfig | null>(null);
  const [isJackpotWin, setIsJackpotWin] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userPoints, setUserPoints] = useState(getUserPoints());
  const [countdownText, setCountdownText] = useState('');
  const [showOddsTable, setShowOddsTable] = useState(false);
  const [annualJackpotState, setAnnualJackpotState] = useState<GlobalJackpotAnnualState>(() =>
    getGlobalJackpotAnnualState()
  );

  const wheelRef = useRef<SVGSVGElement | null>(null);

  // Sync points and status on open
  useEffect(() => {
    if (isOpen) {
      setWheelStatus(checkDailyWheelStatus());
      setUserPoints(getUserPoints());
      setAnnualJackpotState(getGlobalJackpotAnnualState());
      setShowCelebration(false);
      setWonSlice(null);
      setIsJackpotWin(false);
    }
  }, [isOpen]);

  // Countdown timer update
  useEffect(() => {
    if (wheelStatus.canSpin) {
      setCountdownText('');
      return;
    }

    const interval = setInterval(() => {
      const status = checkDailyWheelStatus();
      setWheelStatus(status);

      if (status.canSpin) {
        setCountdownText('');
      } else {
        const totalSec = status.remainingSeconds;
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        setCountdownText(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [wheelStatus.canSpin]);

  if (!isOpen) return null;

  const numSlices = SEGMENTS_25_CONFIG.length; // 25
  const sliceAngle = 360 / numSlices; // 14.4 deg

  const handleSpin = () => {
    if (isSpinning) return;
    if (!wheelStatus.canSpin) return;

    setIsSpinning(true);
    setShowCelebration(false);
    setWonSlice(null);
    setIsJackpotWin(false);
    playCinematicSound('whoosh');

    // Determine winning slice based on Global Annual Jackpot Trigger + Inversely Weighted Segments 1-24
    const result = determineWinningWheelSlice();
    const { slice: targetSlice, sliceIndex: winningIndex, isGlobalJackpotHit } = result;

    // Pointer is located at the TOP (0 deg / 12 o'clock in our SVG coordinates)
    const extraRounds = 6 + Math.floor(Math.random() * 2);
    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
    const finalRotation =
      rotationDegrees + extraRounds * 360 + (360 - (rotationDegrees % 360)) + (360 - sliceCenterAngle);

    setRotationDegrees(finalRotation);

    // Audio ticker during spin
    const totalDurationMs = 4500;
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount % 2 === 0) {
        soundFx.playMove();
      }
      if (tickCount > 30) {
        clearInterval(tickInterval);
      }
    }, 130);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWonSlice(targetSlice);
      setIsJackpotWin(isGlobalJackpotHit);
      setShowCelebration(true);

      // Record in Points engine
      const updatedPts = recordDailyWheelSpin(targetSlice.points);
      setUserPoints(updatedPts);
      setWheelStatus(checkDailyWheelStatus());
      setAnnualJackpotState(getGlobalJackpotAnnualState());

      if (isGlobalJackpotHit) {
        playCinematicSound('brilliant');
        soundFx.playGameOver(true);
      } else {
        playCinematicSound('checkmate');
        soundFx.playGameOver(true);
      }
    }, totalDurationMs);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xl bg-black/85">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl bg-[#12141c] border-2 border-amber-500/40 rounded-3xl shadow-[0_20px_70px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col relative my-auto max-h-[94vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-yellow-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Crown className="w-5 h-5 animate-bounce text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-tight">
                    25-Segment Daily Reward Wheel
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> 1M Grand Jackpot
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Segments 1–24 (100–11,500 PTS) &amp; Segment 25 (1,000,000 PTS Global Annual Jackpot)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowOddsTable((prev) => !prev)}
                className={`p-2 rounded-xl transition border text-xs font-bold flex items-center gap-1 ${
                  showOddsTable
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border-white/10'
                }`}
                title="View Segment Odds & Breakdown"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Odds</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Points & Global Jackpot Status Ribbon */}
          <div className="px-4 sm:px-5 py-2.5 bg-black/50 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Balance:</span>
              <span className="font-extrabold text-amber-300 font-mono text-sm">
                {(userPoints ?? 0).toLocaleString()} PTS
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/25 text-yellow-300">
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-semibold">Year {annualJackpotState.currentYear} Jackpot:</span>
                <span className="font-extrabold font-mono">
                  {annualJackpotState.jackpotWonThisYear ? 'WON (Claimed)' : 'ACTIVE (1 Guaranteed Winner/Yr)'}
                </span>
              </div>

              {wheelStatus.canSpin ? (
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SPIN READY</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-400/90 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  <Clock className="w-3 h-3" />
                  <span>{countdownText}</span>
                </span>
              )}
            </div>
          </div>

          {/* Collapsible Odds & Segment Breakdown */}
          {showOddsTable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 sm:p-4 bg-slate-950/90 border-b border-white/10 overflow-y-auto max-h-56 text-xs text-slate-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-amber-300 tracking-wide uppercase">
                  25-Segment Mathematical Distribution Table
                </span>
                <span className="text-[11px] text-slate-400">
                  Segments 1–24 Total Weight: 1042.06 | Combined Probability: 100%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 font-mono text-[11px]">
                {SEGMENTS_25_CONFIG.map((seg) => (
                  <div
                    key={seg.segmentNumber}
                    className={`p-1.5 rounded-lg border flex flex-col justify-between ${
                      seg.isJackpot
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 col-span-2 sm:col-span-3 md:col-span-4'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        #{seg.segmentNumber} {seg.label}
                      </span>
                      {seg.isJackpot ? (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-black font-black rounded text-[9px]">
                          1 WINNER / YEAR
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">~{seg.probabilityPercent.toFixed(3)}%</span>
                      )}
                    </div>
                    {!seg.isJackpot && (
                      <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                        <span>Weight: {seg.weight.toFixed(2)}</span>
                        <span>{(seg?.points ?? 0).toLocaleString()} PTS</span>
                      </div>
                    )}
                    {seg.isJackpot && (
                      <div className="text-[10px] text-amber-300/90 mt-0.5">
                        Governed by platform annual cryptographic milestone trigger. Exactly 1 guaranteed winner across all users per 365-day cycle.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Wheel Arena */}
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0d0f14] to-black min-h-[390px] overflow-y-auto">
            {/* Background Atmosphere Glow */}
            <div className="absolute w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            {/* Top Pointer Needle */}
            <div className="relative z-30 mb-[-14px] flex flex-col items-center">
              <div className="w-7 h-9 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 clip-triangle shadow-[0_0_20px_#f59e0b] border-x-2 border-white/90" />
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-100 shadow-md mt-[-7px] border border-black/50" />
            </div>

            {/* 25-Segment Rotating SVG Wheel */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center p-1.5 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.45)] border-4 border-yellow-300/50">
              {/* Outer rim gold lights */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 pointer-events-none animate-spin-slow" />

              <svg
                ref={wheelRef}
                viewBox="0 0 320 320"
                className="w-full h-full rounded-full select-none"
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transition: isSpinning
                    ? 'transform 4.5s cubic-bezier(0.15, 0.95, 0.25, 1)'
                    : 'none',
                }}
              >
                <defs>
                  <filter id="sliceShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.6" />
                  </filter>
                  <radialGradient id="jackpotSliceGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                  <radialGradient id="hubGrad25" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#fde047" />
                    <stop offset="70%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#451a03" />
                  </radialGradient>
                </defs>

                {SEGMENTS_25_CONFIG.map((slice, index) => {
                  const startAngle = index * sliceAngle;
                  const endAngle = (index + 1) * sliceAngle;
                  const startRad = ((startAngle - 90) * Math.PI) / 180;
                  const endRad = ((endAngle - 90) * Math.PI) / 180;

                  const x1 = 160 + 160 * Math.cos(startRad);
                  const y1 = 160 + 160 * Math.sin(startRad);
                  const x2 = 160 + 160 * Math.cos(endRad);
                  const y2 = 160 + 160 * Math.sin(endRad);

                  const pathData = `M 160 160 L ${x1} ${y1} A 160 160 0 0 1 ${x2} ${y2} Z`;

                  // Text position & rotation along the slice's center radius
                  const midAngle = startAngle + sliceAngle / 2;

                  return (
                    <g key={`slice-${slice.segmentNumber}`}>
                      <path
                        d={pathData}
                        fill={slice.isJackpot ? 'url(#jackpotSliceGrad)' : slice.color}
                        stroke={slice.isJackpot ? '#ffffff' : '#0a0d14'}
                        strokeWidth={slice.isJackpot ? '2' : '1'}
                      />
                      {/* Radial Text */}
                      <text
                        x="160"
                        y="42"
                        fill={slice.textColor}
                        fontSize={slice.isJackpot ? '7.5' : '6.5'}
                        fontWeight="900"
                        letterSpacing="0.01em"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${midAngle} 160 160)`}
                        filter="url(#sliceShadow)"
                      >
                        {slice.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Inner Gold Hub */}
                <circle cx="160" cy="160" r="32" fill="url(#hubGrad25)" stroke="#fff" strokeWidth="2.5" />
              </svg>

              {/* Center Decorative Crown */}
              <div className="absolute z-20 pointer-events-none w-11 h-11 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Crown className="w-5 h-5 text-yellow-200 animate-pulse" />
              </div>
            </div>

            {/* Celebration Alert */}
            {showCelebration && wonSlice && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-2xl border-2 text-center shadow-2xl backdrop-blur-md max-w-md w-full ${
                  isJackpotWin
                    ? 'bg-gradient-to-r from-yellow-500/40 via-amber-500/40 to-orange-500/40 border-yellow-300 animate-pulse shadow-[0_0_50px_rgba(234,179,8,0.7)]'
                    : 'bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-cyan-500/25 border-amber-400'
                }`}
              >
                <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>
                    {isJackpotWin
                      ? '★ ULTRA GRAND JACKPOT WINNER ★'
                      : `CONGRATULATIONS — SEGMENT #${wonSlice.segmentNumber}!`}
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-1">
                  You won{' '}
                  <span
                    className={`font-mono ${isJackpotWin ? 'text-yellow-300 text-2xl drop-shadow-[0_0_10px_#facc15]' : 'text-emerald-400'}`}
                  >
                    +{(wonSlice?.points ?? 0).toLocaleString()} PTS
                  </span>
                  !
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {isJackpotWin
                    ? '🏆 You hit the Guaranteed Global 1,000,000 PTS Annual Jackpot across the entire platform!'
                    : `Formula: Points = 500 * (${wonSlice.segmentNumber} - 1) ${wonSlice.segmentNumber === 1 ? '(Base 100 PTS)' : ''}. Credited instantly to your wallet.`}
                </p>
              </motion.div>
            )}

            {/* Action Spin Button */}
            <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-xs">
              <button
                disabled={isSpinning || !wheelStatus.canSpin}
                onClick={handleSpin}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 ${
                  wheelStatus.canSpin && !isSpinning
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinning
                    ? 'SPINNING 25-SEGMENT WHEEL...'
                    : wheelStatus.canSpin
                    ? 'SPIN 25-SEGMENT WHEEL FREE!'
                    : `NEXT SPIN IN (${countdownText})`}
                </span>
              </button>

              <div className="text-[11px] text-slate-400 text-center mt-1 flex items-center justify-center gap-1">
                <span>Earn additional points:</span>
                <span className="text-emerald-400 font-bold">Hatrick</span>
                <span>&amp;</span>
                <span className="text-cyan-400 font-bold">Random Quests</span>
              </div>
            </div>
          </div>

          {/* Footer Ribbon */}
          <div className="p-3.5 bg-[#0e1017] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Points Rule: Earned strictly via 25-Segment Wheel, Hatrick &amp; Quests.</span>
            </div>

            {onOpenQuestsOrHatrick && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQuestsOrHatrick();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/30 transition flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>View Quests &amp; Hatrick</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

