import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  Trophy,
  Bot,
  Users,
  Sparkles,
  HelpCircle,
  Zap,
  Flame,
  Layers,
  Crosshair,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

export type DartsGameMode = '501' | '301' | 'clock' | 'highScore';
export type DartsOpponent = 'ai' | 'pvp' | 'solo';

interface DartThrow {
  score: number;
  multiplier: number; // 1 = single, 2 = double, 3 = triple, 50 = inner bull, 25 = outer bull, 0 = miss
  sector: number;
  label: string;
  x: number;
  y: number;
}

interface DartsBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

// Clockwise standard London dartboard sector sequence starting from top (12 o'clock = 20)
const SECTORS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export const DartsBoard: React.FC<DartsBoardProps> = ({
  gameMode: externalGameMode = 'local',
  onGameEnd,
}) => {
  const [matchType, setMatchType] = useState<DartsGameMode>('501');
  const [opponentType, setOpponentType] = useState<DartsOpponent>(
    externalGameMode === 'ai' ? 'ai' : 'pvp'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Scores and Turn State
  const [player1Score, setPlayer1Score] = useState<number>(501);
  const [player2Score, setPlayer2Score] = useState<number>(501);
  const [p1ClockTarget, setP1ClockTarget] = useState<number>(1);
  const [p2ClockTarget, setP2ClockTarget] = useState<number>(1);
  const [p1HighScore, setP1HighScore] = useState<number>(0);
  const [p2HighScore, setP2HighScore] = useState<number>(0);

  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [currentTurnDarts, setCurrentTurnDarts] = useState<DartThrow[]>([]);
  const [allStuckDarts, setAllStuckDarts] = useState<(DartThrow & { player: 1 | 2 })[]>([]);
  const [isAiThrowing, setIsAiThrowing] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Aim crosshair with mouse/touch & click or tap to throw dart!'
  );
  const [turnStartScore, setTurnStartScore] = useState<number>(501);
  const [bustAlert, setBustAlert] = useState<string | null>(null);
  const [lastThrowBanner, setLastThrowBanner] = useState<string | null>(null);

  // Statistics
  const [p1ThrowsCount, setP1ThrowsCount] = useState<number>(0);
  const [p2ThrowsCount, setP2ThrowsCount] = useState<number>(0);
  const [p1TotalScored, setP1TotalScored] = useState<number>(0);
  const [p2TotalScored, setP2TotalScored] = useState<number>(0);

  // Canvas & Aim Crosshair
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number }>({ x: 200, y: 200 });
  const [isAiming, setIsAiming] = useState<boolean>(true);
  const swayAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Board Radii (in virtual coordinate space 400x400, center at 200, 200)
  const CENTER_X = 200;
  const CENTER_Y = 200;
  const R_DOUBLE_BULL = 8;
  const R_SINGLE_BULL = 18;
  const R_TRIPLE_INNER = 88;
  const R_TRIPLE_OUTER = 98;
  const R_DOUBLE_INNER = 146;
  const R_DOUBLE_OUTER = 158;
  const R_BOARD_OUTER = 188;

  // Sound sync
  useEffect(() => {
    soundFx.setEnabled(soundActive);
  }, [soundActive]);

  // Reset Match
  const resetMatch = useCallback(
    (mode: DartsGameMode = matchType) => {
      const starting = mode === '501' ? 501 : mode === '301' ? 301 : 0;
      setPlayer1Score(starting);
      setPlayer2Score(starting);
      setTurnStartScore(starting);
      setP1ClockTarget(1);
      setP2ClockTarget(1);
      setP1HighScore(0);
      setP2HighScore(0);
      setCurrentPlayer(1);
      setCurrentTurnDarts([]);
      setAllStuckDarts([]);
      setMatchWinner(null);
      setBustAlert(null);
      setLastThrowBanner(null);
      setIsAiThrowing(false);
      setP1ThrowsCount(0);
      setP2ThrowsCount(0);
      setP1TotalScored(0);
      setP2TotalScored(0);
      setStatusMessage(
        mode === 'clock'
          ? 'Around the Clock: Hit Sector #1 to advance!'
          : mode === 'highScore'
          ? 'High Score Blitz: Score maximum points across 10 rounds!'
          : `Match Started: First to exact 0 in ${mode} wins!`
      );
    },
    [matchType]
  );

  useEffect(() => {
    resetMatch(matchType);
  }, [matchType, resetMatch]);

  // Calculate Dart Score from (x, y) coordinates
  const calculateDartScore = (x: number, y: number): DartThrow => {
    const dx = x - CENTER_X;
    const dy = y - CENTER_Y;
    const dist = Math.hypot(dx, dy);

    // Missed board
    if (dist > R_DOUBLE_OUTER) {
      return { score: 0, multiplier: 0, sector: 0, label: 'MISS (0)', x, y };
    }

    // Double Bullseye (50 pts)
    if (dist <= R_DOUBLE_BULL) {
      return { score: 50, multiplier: 50, sector: 50, label: 'DOUBLE BULL (50)', x, y };
    }

    // Single Bullseye (25 pts)
    if (dist <= R_SINGLE_BULL) {
      return { score: 25, multiplier: 25, sector: 25, label: 'BULLSEYE (25)', x, y };
    }

    // Angle calculation (standard dartboard is 20 sectors of 18 degrees each, sector 20 centered at -90 deg)
    let angleRad = Math.atan2(dy, dx); // -PI to +PI
    let angleDeg = (angleRad * 180) / Math.PI; // -180 to +180
    // Rotate so top (270 deg or -90 deg) aligns with sector index 0 (20)
    let normalizedDeg = (angleDeg + 90 + 9) % 360;
    if (normalizedDeg < 0) normalizedDeg += 360;
    const sectorIndex = Math.floor(normalizedDeg / 18) % 20;
    const sectorNum = SECTORS[sectorIndex];

    // Triple Ring
    if (dist >= R_TRIPLE_INNER && dist <= R_TRIPLE_OUTER) {
      return {
        score: sectorNum * 3,
        multiplier: 3,
        sector: sectorNum,
        label: `TRIPLE ${sectorNum} (${sectorNum * 3})`,
        x,
        y,
      };
    }

    // Double Ring
    if (dist >= R_DOUBLE_INNER && dist <= R_DOUBLE_OUTER) {
      return {
        score: sectorNum * 2,
        multiplier: 2,
        sector: sectorNum,
        label: `DOUBLE ${sectorNum} (${sectorNum * 2})`,
        x,
        y,
      };
    }

    // Single Wedge
    return {
      score: sectorNum,
      multiplier: 1,
      sector: sectorNum,
      label: `SINGLE ${sectorNum} (${sectorNum})`,
      x,
      y,
    };
  };

  // Convert (Sector, Multiplier) into ideal coordinate on board for AI aim
  const getCoordinatesForTarget = (sector: number, multiplier: number = 3) => {
    if (sector === 50) return { x: CENTER_X, y: CENTER_Y };
    if (sector === 25) return { x: CENTER_X + 5, y: CENTER_Y + 5 };

    const sectorIdx = SECTORS.indexOf(sector);
    if (sectorIdx === -1) return { x: CENTER_X, y: CENTER_Y };

    // Center angle of this sector
    const angleDeg = sectorIdx * 18 - 90;
    const angleRad = (angleDeg * Math.PI) / 180;

    let targetRadius = (R_SINGLE_BULL + R_TRIPLE_INNER) / 2; // single inner
    if (multiplier === 3) targetRadius = (R_TRIPLE_INNER + R_TRIPLE_OUTER) / 2;
    else if (multiplier === 2) targetRadius = (R_DOUBLE_INNER + R_DOUBLE_OUTER) / 2;

    return {
      x: CENTER_X + Math.cos(angleRad) * targetRadius,
      y: CENTER_Y + Math.sin(angleRad) * targetRadius,
    };
  };

  // Handle a completed throw
  const processThrow = (dart: DartThrow) => {
    if (matchWinner !== null) return;

    if (dart.score === 50) {
      soundFx.playBullseye();
    } else if (dart.multiplier >= 2) {
      soundFx.playDartHit(true);
    } else {
      soundFx.playDartHit(false);
    }

    setLastThrowBanner(dart.label);

    const isP1 = currentPlayer === 1;
    const updatedDarts = [...currentTurnDarts, dart];
    setCurrentTurnDarts(updatedDarts);
    setAllStuckDarts((prev) => [...prev, { ...dart, player: currentPlayer }]);

    // Track statistics
    if (isP1) {
      setP1ThrowsCount((c) => c + 1);
      setP1TotalScored((s) => s + dart.score);
    } else {
      setP2ThrowsCount((c) => c + 1);
      setP2TotalScored((s) => s + dart.score);
    }

    // 1. GAME MODE: 501 / 301 Countdown
    if (matchType === '501' || matchType === '301') {
      const currentScore = isP1 ? player1Score : player2Score;
      const newScore = currentScore - dart.score;

      // Check for WIN
      if (newScore === 0) {
        if (isP1) setPlayer1Score(0);
        else setPlayer2Score(0);
        setMatchWinner(currentPlayer);
        setStatusMessage(`🏆 GAME SHOT! Player ${currentPlayer} wins the match with a checkout!`);
        soundFx.playWin();
        if (onGameEnd) {
          onGameEnd(isP1 ? 'w' : 'b', 'Dart Checkout Victory');
        }
        return;
      }

      // Check for BUST (score drops below 0 or 1 in double out rules)
      if (newScore < 0) {
        soundFx.playFoul();
        setBustAlert(`BUST! Score went below zero. Turn reset to ${turnStartScore}.`);
        if (isP1) setPlayer1Score(turnStartScore);
        else setPlayer2Score(turnStartScore);

        // End turn immediately
        setTimeout(() => {
          advanceTurn(isP1 ? turnStartScore : player1Score, !isP1 ? turnStartScore : player2Score);
        }, 1200);
        return;
      }

      // Valid reduction
      if (isP1) setPlayer1Score(newScore);
      else setPlayer2Score(newScore);

      if (updatedDarts.length >= 3) {
        setTimeout(() => {
          advanceTurn(isP1 ? newScore : player1Score, !isP1 ? newScore : player2Score);
        }, 800);
      }
    }

    // 2. GAME MODE: Around the Clock (1 to 20, then Bull)
    else if (matchType === 'clock') {
      const currentTarget = isP1 ? p1ClockTarget : p2ClockTarget;
      let targetHit = false;

      if (currentTarget <= 20 && dart.sector === currentTarget && dart.multiplier > 0) {
        targetHit = true;
      } else if (currentTarget === 21 && (dart.score === 25 || dart.score === 50)) {
        targetHit = true;
      }

      if (targetHit) {
        const nextTarget = currentTarget + 1;
        if (isP1) setP1ClockTarget(nextTarget);
        else setP2ClockTarget(nextTarget);

        if (nextTarget > 21) {
          // Finished the clock!
          setMatchWinner(currentPlayer);
          setStatusMessage(`🏆 WINNER! Player ${currentPlayer} completed Around the Clock!`);
          soundFx.playWin();
          if (onGameEnd) onGameEnd(isP1 ? 'w' : 'b', 'Around the Clock Champion');
          return;
        } else {
          soundFx.playWin();
          setStatusMessage(
            `Target #${currentTarget} HIT! Next target: ${
              nextTarget === 21 ? 'BULLSEYE' : '#' + nextTarget
            }!`
          );
        }
      }

      if (updatedDarts.length >= 3) {
        setTimeout(() => {
          advanceTurn(0, 0);
        }, 800);
      }
    }

    // 3. GAME MODE: High Score Blitz
    else if (matchType === 'highScore') {
      if (isP1) setP1HighScore((s) => s + dart.score);
      else setP2HighScore((s) => s + dart.score);

      if (updatedDarts.length >= 3) {
        setTimeout(() => {
          advanceTurn(0, 0);
        }, 800);
      }
    }
  };

  // Switch to next player's turn
  const advanceTurn = (newP1Score: number, newP2Score: number) => {
    setCurrentTurnDarts([]);
    setBustAlert(null);
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    const nextScore = nextPlayer === 1 ? newP1Score : newP2Score;
    setTurnStartScore(nextScore);

    const nextName =
      opponentType === 'ai' && nextPlayer === 2 ? 'AI Bot' : `Player ${nextPlayer}`;
    setStatusMessage(`Turn changed to ${nextName}. 3 Darts ready.`);
  };

  // AI Throw Execution Logic
  useEffect(() => {
    if (opponentType !== 'ai' || currentPlayer !== 2 || matchWinner !== null || isAiThrowing) {
      return;
    }

    setIsAiThrowing(true);

    const timer = setTimeout(() => {
      // Determine AI ideal target
      let targetSector = 20;
      let targetMultiplier = 3; // default T20 for max scoring

      if (matchType === '501' || matchType === '301') {
        const remaining = player2Score;
        // Checkouts logic
        if (remaining <= 40 && remaining % 2 === 0) {
          targetSector = remaining / 2;
          targetMultiplier = 2; // Double out!
        } else if (remaining === 50) {
          targetSector = 50;
          targetMultiplier = 50;
        } else if (remaining <= 60 && remaining > 40) {
          targetSector = remaining - 40;
          targetMultiplier = 1;
        } else if (remaining < 100) {
          targetSector = 19;
          targetMultiplier = 3;
        }
      } else if (matchType === 'clock') {
        targetSector = p2ClockTarget === 21 ? 50 : p2ClockTarget;
        targetMultiplier = 1;
      }

      const idealCoords = getCoordinatesForTarget(targetSector, targetMultiplier);

      // Add difficulty error variance
      const variance =
        aiDifficulty === 'hard' ? 7 : aiDifficulty === 'medium' ? 16 : 28;
      const throwX = idealCoords.x + (Math.random() - 0.5) * variance;
      const throwY = idealCoords.y + (Math.random() - 0.5) * variance;

      const dartResult = calculateDartScore(throwX, throwY);
      processThrow(dartResult);
      setIsAiThrowing(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [
    opponentType,
    currentPlayer,
    matchWinner,
    isAiThrowing,
    player2Score,
    matchType,
    p2ClockTarget,
    aiDifficulty,
  ]);

  // Aim crosshair breathing sway animation
  useEffect(() => {
    const updateSway = () => {
      swayAngleRef.current += 0.05;
      animFrameRef.current = requestAnimationFrame(updateSway);
    };
    animFrameRef.current = requestAnimationFrame(updateSway);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, 400, 400);

    // 1. Outer Dark Cabinet & Wire Surround
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, R_BOARD_OUTER + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0d14';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // 2. Black Outer Number Ring
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, R_BOARD_OUTER, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // 3. Draw 20 Alternating Color Wedges
    const sliceAngle = (Math.PI * 2) / 20;

    SECTORS.forEach((sectorNum, idx) => {
      const startAngle = idx * sliceAngle - Math.PI / 2 - sliceAngle / 2;
      const endAngle = startAngle + sliceAngle;

      const isEven = idx % 2 === 0;
      const singleColor = isEven ? '#0f0f12' : '#f8f4e6'; // Black / Pale Cream
      const ringColor = isEven ? '#e74c3c' : '#27ae60'; // Red / Green

      // Outer Single Area (between Double and Triple rings)
      ctx.beginPath();
      ctx.moveTo(CENTER_X, CENTER_Y);
      ctx.arc(CENTER_X, CENTER_Y, R_DOUBLE_INNER, startAngle, endAngle);
      ctx.fillStyle = singleColor;
      ctx.fill();

      // Double Ring Arc
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, R_DOUBLE_OUTER, startAngle, endAngle);
      ctx.arc(CENTER_X, CENTER_Y, R_DOUBLE_INNER, endAngle, startAngle, true);
      ctx.fillStyle = ringColor;
      ctx.fill();

      // Triple Ring Arc
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, R_TRIPLE_OUTER, startAngle, endAngle);
      ctx.arc(CENTER_X, CENTER_Y, R_TRIPLE_INNER, endAngle, startAngle, true);
      ctx.fillStyle = ringColor;
      ctx.fill();

      // Inner Single Area (between Triple and Bullseye)
      ctx.beginPath();
      ctx.moveTo(CENTER_X, CENTER_Y);
      ctx.arc(CENTER_X, CENTER_Y, R_TRIPLE_INNER, startAngle, endAngle);
      ctx.fillStyle = singleColor;
      ctx.fill();

      // Sector Number Labels in outer ring
      const midAngle = startAngle + sliceAngle / 2;
      const textRadius = (R_DOUBLE_OUTER + R_BOARD_OUTER) / 2;
      const textX = CENTER_X + Math.cos(midAngle) * textRadius;
      const textY = CENTER_Y + Math.sin(midAngle) * textRadius;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sectorNum.toString(), textX, textY);
      ctx.restore();
    });

    // 4. Outer Bull (Green 25 pts)
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, R_SINGLE_BULL, 0, Math.PI * 2);
    ctx.fillStyle = '#27ae60';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 5. Inner Double Bull (Red 50 pts)
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, R_DOUBLE_BULL, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 6. Metallic Spider Wires (Radial dividers & concentric wire rings)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;

    // Concentric wire circles
    [R_DOUBLE_BULL, R_SINGLE_BULL, R_TRIPLE_INNER, R_TRIPLE_OUTER, R_DOUBLE_INNER, R_DOUBLE_OUTER].forEach(
      (r) => {
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    );

    // Radial wires
    for (let i = 0; i < 20; i++) {
      const a = i * sliceAngle - Math.PI / 2 - sliceAngle / 2;
      ctx.beginPath();
      ctx.moveTo(CENTER_X + Math.cos(a) * R_SINGLE_BULL, CENTER_Y + Math.sin(a) * R_SINGLE_BULL);
      ctx.lineTo(CENTER_X + Math.cos(a) * R_DOUBLE_OUTER, CENTER_Y + Math.sin(a) * R_DOUBLE_OUTER);
      ctx.stroke();
    }

    // 7. Render All Stuck Darts on the board
    allStuckDarts.forEach((d) => {
      // Dart Shadow
      ctx.beginPath();
      ctx.arc(d.x + 3, d.y + 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Dart Flight Tail Bar
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 12, d.y - 14);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dart Wing / Flight
      ctx.beginPath();
      ctx.arc(d.x - 12, d.y - 14, 5, 0, Math.PI * 2);
      ctx.fillStyle = d.player === 1 ? '#3498db' : '#f1c40f';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Dart Point Center Pin
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4757';
      ctx.fill();
    });

    // 8. Interactive Aim Crosshair (when human's turn)
    if (isAiming && !(opponentType === 'ai' && currentPlayer === 2) && matchWinner === null) {
      // Natural human breathing sway offset
      const swayX = Math.cos(swayAngleRef.current) * 3.5;
      const swayY = Math.sin(swayAngleRef.current * 1.3) * 3.5;
      const aimX = crosshairPos.x + swayX;
      const aimY = crosshairPos.y + swayY;

      ctx.save();
      // Outer Target Reticle Circle
      ctx.beginPath();
      ctx.arc(aimX, aimY, 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      // Crosshair Lines
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(aimX - 18, aimY);
      ctx.lineTo(aimX + 18, aimY);
      ctx.moveTo(aimX, aimY - 18);
      ctx.lineTo(aimX, aimY + 18);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Precision Dot
      ctx.beginPath();
      ctx.arc(aimX, aimY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [allStuckDarts, crosshairPos, isAiming, opponentType, currentPlayer, matchWinner]);

  // Mouse & Touch Controls
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;

    setCrosshairPos({
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    });
  };

  const handleThrow = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (opponentType === 'ai' && currentPlayer === 2) return;
    if (matchWinner !== null || currentTurnDarts.length >= 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;

    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    // Small random hand jitter
    const jitterX = (Math.random() - 0.5) * 5;
    const jitterY = (Math.random() - 0.5) * 5;

    const result = calculateDartScore(targetX + jitterX, targetY + jitterY);
    processThrow(result);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-white">
      {/* Top Header & Mode Select */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            🎯
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Darts Championship
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30 uppercase font-mono">
                {matchType}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Official London Board Precision</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Rules & Checkouts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => resetMatch()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
            title="Reset Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode & Opponent Selector Pills */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {(['501', '301', 'clock', 'highScore'] as DartsGameMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMatchType(m);
              soundFx.playClick();
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold uppercase transition flex items-center justify-center gap-1 border ${
              matchType === m
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-800'
            }`}
          >
            {m === 'clock' ? 'Around Clock' : m === 'highScore' ? 'High Score' : m}
          </button>
        ))}
      </div>

      {/* Chalkboard Scorecard Panel */}
      <div className="w-full grid grid-cols-2 gap-3 mb-3">
        {/* Player 1 Card */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            currentPlayer === 1
              ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
              : 'bg-slate-800/40 border-slate-700/40 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-blue-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Player 1
            </span>
            {currentPlayer === 1 && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono animate-pulse">
                THROWING
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {matchType === '501' || matchType === '301'
              ? player1Score
              : matchType === 'clock'
              ? `Target: #${p1ClockTarget > 20 ? 'BULL' : p1ClockTarget}`
              : `${p1HighScore} pts`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
            <span>Avg: {p1ThrowsCount ? (p1TotalScored / (p1ThrowsCount / 3)).toFixed(1) : '0.0'}</span>
            <span>Throws: {p1ThrowsCount}</span>
          </div>
        </div>

        {/* Player 2 / AI Card */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            currentPlayer === 2
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-slate-800/40 border-slate-700/40 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              {opponentType === 'ai' ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {opponentType === 'ai' ? 'AI Bot' : 'Player 2'}
            </span>
            {currentPlayer === 2 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono animate-pulse">
                THROWING
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {matchType === '501' || matchType === '301'
              ? player2Score
              : matchType === 'clock'
              ? `Target: #${p2ClockTarget > 20 ? 'BULL' : p2ClockTarget}`
              : `${p2HighScore} pts`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
            <span>Avg: {p2ThrowsCount ? (p2TotalScored / (p2ThrowsCount / 3)).toFixed(1) : '0.0'}</span>
            <span>Throws: {p2ThrowsCount}</span>
          </div>
        </div>
      </div>

      {/* 3-Dart Turn Display Rack */}
      <div className="w-full flex items-center justify-between bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-2xl mb-3">
        <span className="text-xs font-semibold text-slate-400">Current Turn Darts:</span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((idx) => {
            const thrown = currentTurnDarts[idx];
            return (
              <div
                key={idx}
                className={`w-20 h-7 rounded-xl border flex items-center justify-center text-xs font-mono font-bold transition ${
                  thrown
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                {thrown ? thrown.score : `Dart ${idx + 1}`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Dartboard Stage */}
      <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center mb-3">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseMove={handleCanvasMove}
          onTouchMove={handleCanvasMove}
          onClick={handleThrow}
          onTouchStart={handleThrow}
          className="w-full h-full rounded-full shadow-2xl border-4 border-slate-800 cursor-crosshair touch-none select-none"
        />

        {/* Last Throw Floating Pill */}
        <AnimatePresence>
          {lastThrowBanner && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 bg-slate-950/90 border border-amber-400 text-amber-300 px-3 py-1 rounded-full text-xs font-bold font-mono shadow-xl"
            >
              {lastThrowBanner}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bust Alert Overlay */}
        <AnimatePresence>
          {bustAlert && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/80 rounded-full flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm border-2 border-red-500"
            >
              <Flame className="w-10 h-10 text-red-400 mb-1 animate-bounce" />
              <h3 className="text-xl font-black text-red-200">BUST!</h3>
              <p className="text-xs text-red-300">{bustAlert}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Match Status & Opponent Controls */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
        <div className="text-xs text-slate-300 text-center sm:text-left flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => {
                setOpponentType('pvp');
                resetMatch();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentType === 'pvp' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              2P Local
            </button>
            <button
              onClick={() => {
                setOpponentType('ai');
                resetMatch();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentType === 'ai' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              AI Bot
            </button>
          </div>

          {opponentType === 'ai' && (
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs rounded-xl px-2 py-1 outline-none font-semibold"
            >
              <option value="easy">Easy Bot</option>
              <option value="medium">Medium Bot</option>
              <option value="hard">Pro Bot</option>
            </select>
          )}
        </div>
      </div>

      {/* Rules & Checkouts Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Target className="w-5 h-5" /> Darts Championship Rules
                </h3>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <p>
                  <strong>501 / 301 Rules:</strong> Each player starts with 501 (or 301) points.
                  Subtract the score of your 3 darts per turn. First to hit exactly 0 points wins! If
                  you score more than remaining, you <em>Bust</em> and your score resets.
                </p>
                <p>
                  <strong>Board Multipliers:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Double Bullseye (Inner Red): 50 Points</li>
                  <li>Single Bullseye (Outer Green): 25 Points</li>
                  <li>Triple Ring (Narrow Inner): 3x Sector Value (e.g. T20 = 60 pts!)</li>
                  <li>Double Ring (Narrow Outer): 2x Sector Value</li>
                  <li>Single Wedge: 1x Sector Value</li>
                </ul>
                <p>
                  <strong>Around the Clock:</strong> Hit sectors 1 through 20 in exact sequential
                  order, finishing with the Bullseye to win!
                </p>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Got It, Let's Play!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
