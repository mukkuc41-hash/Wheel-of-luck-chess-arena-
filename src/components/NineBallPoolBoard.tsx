import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  Zap,
  BookOpen,
  Copy,
  Check,
  Code,
  Trophy,
  Bot,
  Users,
  Target,
  ChevronLeft,
  Flame,
  Layers,
  Crosshair,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

export type PoolGameMode = 'ai' | 'pvp' | 'practice';
export type PoolFeltTheme = 'emerald' | 'midnight' | 'burgundy' | 'slate' | 'cyber';

interface Ball {
  number: number; // 0 = cue ball, 1-9 = object balls
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isStripe?: boolean;
  active: boolean;
  sinking?: boolean;
  sinkScale?: number;
  sinkAlpha?: number;
}

interface Pocket {
  id: string;
  x: number;
  y: number;
  radius: number;
  dropRadius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface NineBallPoolBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

const BALL_COLORS: Record<number, { color: string; isStripe?: boolean; name: string }> = {
  0: { color: '#ffffff', name: 'Cue Ball' },
  1: { color: '#f1c40f', name: '1-Ball Solid Yellow' },
  2: { color: '#2980b9', name: '2-Ball Solid Blue' },
  3: { color: '#e74c3c', name: '3-Ball Solid Red' },
  4: { color: '#8e44ad', name: '4-Ball Solid Purple' },
  5: { color: '#e67e22', name: '5-Ball Solid Orange' },
  6: { color: '#27ae60', name: '6-Ball Solid Green' },
  7: { color: '#78281f', name: '7-Ball Solid Maroon' },
  8: { color: '#111111', name: '8-Ball Solid Black' },
  9: { color: '#f39c12', isStripe: true, name: '9-Ball Gold Stripe' },
};

const FELT_THEMES: Record<
  PoolFeltTheme,
  { name: string; inner: string; outer: string; cushion: string; wood: string }
> = {
  emerald: {
    name: 'Emerald Classic',
    inner: '#1b6335',
    outer: '#0c2d16',
    cushion: '#144d28',
    wood: '#2c1810',
  },
  midnight: {
    name: 'Midnight Navy',
    inner: '#1c3d5a',
    outer: '#0b1b2b',
    cushion: '#153047',
    wood: '#111827',
  },
  burgundy: {
    name: 'Royal Burgundy',
    inner: '#5c1d2e',
    outer: '#2b0c15',
    cushion: '#481523',
    wood: '#1f130b',
  },
  slate: {
    name: 'Tournament Slate',
    inner: '#2d3748',
    outer: '#131720',
    cushion: '#242c3b',
    wood: '#0f1117',
  },
  cyber: {
    name: 'Cyber Neon',
    inner: '#0b3c49',
    outer: '#03141a',
    cushion: '#082d37',
    wood: '#0a0f1d',
  },
};

export const NineBallPoolBoard: React.FC<NineBallPoolBoardProps> = ({
  gameMode: externalGameMode = 'local',
  onGameEnd,
}) => {
  // Navigation View: 'hub' (Arcade Hub preview card) or 'game' (Active Arena)
  const [currentView, setCurrentView] = useState<'game' | 'hub'>('game');

  // Match Configuration
  const [poolMode, setPoolMode] = useState<PoolGameMode>(
    externalGameMode === 'ai' ? 'ai' : 'pvp'
  );
  const [feltTheme, setFeltTheme] = useState<PoolFeltTheme>('emerald');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [powerMultiplier, setPowerMultiplier] = useState<number>(0.85);
  const [showAimTrajectory, setShowAimTrajectory] = useState<boolean>(true);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showSnippetModal, setShowSnippetModal] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Gameplay State
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Break Off: Drag cue ball to aim and strike the apex #1 ball!'
  );
  const [foulAlert, setFoulAlert] = useState<string | null>(null);
  const [isBallInHand, setIsBallInHand] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [consecutivePots, setConsecutivePots] = useState<number>(0);
  const [totalShots, setTotalShots] = useState<number>(0);
  const [pottedHistory, setPottedHistory] = useState<number[]>([]);

  // Canvas Refs & Coordinates
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 440,
    height: 600,
  });

  // Table Constants in Virtual Coordinate Space (width=440, height=600)
  const virtualWidth = 440;
  const virtualHeight = 600;
  const tableMargin = 32;
  const cushionBorder = 26;
  const tableLeft = tableMargin;
  const tableRight = virtualWidth - tableMargin;
  const tableTop = tableMargin;
  const tableBottom = virtualHeight - tableMargin;

  // Ball radius
  const BALL_RADIUS = 10;
  const POCKET_RADIUS = 20;

  // Game Engine State Refs (to avoid stale closures in requestAnimationFrame)
  const ballsRef = useRef<Ball[]>([]);
  const pocketsRef = useRef<Pocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const isPlacingCueRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const firstHitBallRef = useRef<number | null>(null);
  const pottedThisShotRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isShotInProgressRef = useRef<boolean>(false);

  // Sync soundFx
  useEffect(() => {
    soundFx.setEnabled(soundActive);
  }, [soundActive]);

  // Define Pockets
  const getPockets = useCallback((): Pocket[] => {
    const pRadius = POCKET_RADIUS;
    const dropR = 17;
    return [
      // Top Left Corner
      { id: 'tl', x: tableLeft + 10, y: tableTop + 10, radius: pRadius, dropRadius: dropR },
      // Top Right Corner
      { id: 'tr', x: tableRight - 10, y: tableTop + 10, radius: pRadius, dropRadius: dropR },
      // Middle Left
      { id: 'ml', x: tableLeft + 5, y: virtualHeight / 2, radius: pRadius - 2, dropRadius: dropR },
      // Middle Right
      { id: 'mr', x: tableRight - 5, y: virtualHeight / 2, radius: pRadius - 2, dropRadius: dropR },
      // Bottom Left Corner
      { id: 'bl', x: tableLeft + 10, y: tableBottom - 10, radius: pRadius, dropRadius: dropR },
      // Bottom Right Corner
      { id: 'br', x: tableRight - 10, y: tableBottom - 10, radius: pRadius, dropRadius: dropR },
    ];
  }, [tableLeft, tableRight, tableTop, tableBottom, virtualHeight]);

  // Initialize Pool Balls in standard 9-Ball Diamond Rack
  const initBalls = useCallback(() => {
    pocketsRef.current = getPockets();
    particlesRef.current = [];
    isShotInProgressRef.current = false;
    firstHitBallRef.current = null;
    pottedThisShotRef.current = [];

    const centerX = virtualWidth / 2;
    const apexY = 180; // Top diamond apex
    const spacing = BALL_RADIUS * 2 + 0.8;
    const rowOffset = spacing * Math.sin(Math.PI / 3);

    // Official 9-Ball Diamond Rack layout:
    // Row 0: [1]
    // Row 1: [2, 3]
    // Row 2: [4, 9, 5] (9 is at center of diamond)
    // Row 3: [6, 7]
    // Row 4: [8]
    const diamondPattern = [[1], [2, 3], [4, 9, 5], [6, 7], [8]];

    const newBalls: Ball[] = [
      // Cue Ball at bottom break zone
      {
        number: 0,
        x: centerX,
        y: 470,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#ffffff',
        active: true,
      },
    ];

    diamondPattern.forEach((row, rowIndex) => {
      const rowY = apexY + rowIndex * rowOffset;
      const rowWidth = (row.length - 1) * spacing;
      const startX = centerX - rowWidth / 2;

      row.forEach((ballNum, colIndex) => {
        const ballX = startX + colIndex * spacing;
        const config = BALL_COLORS[ballNum];
        newBalls.push({
          number: ballNum,
          x: ballX,
          y: rowY,
          vx: 0,
          vy: 0,
          radius: BALL_RADIUS,
          color: config.color,
          isStripe: config.isStripe,
          active: true,
        });
      });
    });

    ballsRef.current = newBalls;
    setPottedHistory([]);
    setMatchWinner(null);
    setFoulAlert(null);
    setIsBallInHand(false);
    setIsAiThinking(false);
    setConsecutivePots(0);
    setTotalShots(0);
    setCurrentPlayer(1);
    setStatusMessage('Break Shot: Pull back cue stick and strike apex #1 ball!');
  }, [getPockets, virtualWidth]);

  // Find lowest active numbered ball
  const getLowestActiveBall = useCallback((): Ball | null => {
    const active = ballsRef.current
      .filter((b) => b.active && b.number > 0)
      .sort((a, b) => a.number - b.number);
    return active.length > 0 ? active[0] : null;
  }, []);

  // Spawn visual sparkle particles
  const spawnParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  };

  // Check if all balls are at rest
  const areBallsAtRest = useCallback((): boolean => {
    return ballsRef.current.every(
      (b) => !b.active || (Math.abs(b.vx) < 0.04 && Math.abs(b.vy) < 0.04)
    );
  }, []);

  // Process shot resolution after all balls stop moving
  const handleShotComplete = useCallback(() => {
    isShotInProgressRef.current = false;
    const cueBall = ballsRef.current.find((b) => b.number === 0);
    const lowestTarget = getLowestActiveBall();
    const pottedList = [...pottedThisShotRef.current];
    pottedThisShotRef.current = [];

    // Check for Cue Scratch
    let isFoul = false;
    let foulReason = '';

    if (!cueBall || !cueBall.active) {
      isFoul = true;
      foulReason = 'Foul! Cue Ball Scratch (Potted in pocket)';
      // Resurrect Cue Ball for Ball-in-Hand
      if (cueBall) {
        cueBall.active = true;
        cueBall.x = virtualWidth / 2;
        cueBall.y = 450;
        cueBall.vx = 0;
        cueBall.vy = 0;
        cueBall.sinking = false;
        cueBall.sinkScale = 1;
        cueBall.sinkAlpha = 1;
      }
      setIsBallInHand(true);
    } else if (firstHitBallRef.current === null && ballsRef.current.some((b) => b.active && b.number > 0)) {
      // Cue ball touched nothing
      isFoul = true;
      foulReason = 'Foul! Missed contact (No ball was struck)';
      setIsBallInHand(true);
    } else if (lowestTarget && firstHitBallRef.current !== lowestTarget.number) {
      // Hit wrong ball first
      isFoul = true;
      foulReason = `Foul! First hit was #${firstHitBallRef.current} instead of lowest #${lowestTarget.number}`;
      setIsBallInHand(true);
    }

    firstHitBallRef.current = null;

    // Check if 9-Ball was potted
    if (pottedList.includes(9)) {
      if (!isFoul) {
        // Legal 9-Ball Pot = INSTANT VICTORY!
        setMatchWinner(currentPlayer);
        setStatusMessage(
          `🎉 WINNER! Player ${currentPlayer} sunk the 9-Ball for tournament victory!`
        );
        soundFx.playWin();
        if (currentPlayer === 1) setPlayer1Score((s) => s + 1);
        else setPlayer2Score((s) => s + 1);
        if (onGameEnd) {
          onGameEnd(currentPlayer === 1 ? 'w' : 'b', '9-Ball Potted Legally');
        }
        return;
      } else {
        // Foul pot of 9-Ball = Spot the 9-ball back on table foot spot
        const ball9 = ballsRef.current.find((b) => b.number === 9);
        if (ball9) {
          ball9.active = true;
          ball9.x = virtualWidth / 2;
          ball9.y = 180;
          ball9.vx = 0;
          ball9.vy = 0;
          ball9.sinking = false;
          ball9.sinkScale = 1;
          ball9.sinkAlpha = 1;
        }
        setFoulAlert('9-Ball potted on FOUL! Spotted back to foot-spot.');
      }
    }

    if (isFoul) {
      soundFx.playFoul();
      setFoulAlert(foulReason);
      setConsecutivePots(0);
      const nextP = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextP);
      setStatusMessage(
        `${foulReason}. Player ${nextP} awarded Ball-in-Hand (Click table to position cue ball)!`
      );
    } else if (pottedList.length > 0) {
      // Legal pot: Player continues turn!
      setConsecutivePots((c) => c + pottedList.length);
      const nextTarget = getLowestActiveBall();
      setStatusMessage(
        `Great Shot! Player ${currentPlayer} potted #${pottedList.join(', #')}! Continue turn (Target: #${nextTarget?.number || 9}).`
      );
      setFoulAlert(null);
      setIsBallInHand(false);
    } else {
      // Clean safety / dry shot: switch turn
      setConsecutivePots(0);
      setFoulAlert(null);
      setIsBallInHand(false);
      const nextP = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextP);
      const nextTarget = getLowestActiveBall();
      setStatusMessage(
        `Turn changed to ${poolMode === 'ai' && nextP === 2 ? 'AI Bot' : `Player ${nextP}`}. Target: #${nextTarget?.number || 9}.`
      );
    }
  }, [currentPlayer, getLowestActiveBall, onGameEnd, poolMode, virtualWidth]);

  // AI Turn Execution Logic
  useEffect(() => {
    if (poolMode !== 'ai' || currentPlayer !== 2 || matchWinner !== null || !areBallsAtRest()) {
      return;
    }

    if (isShotInProgressRef.current || isAiThinking) return;

    setIsAiThinking(true);
    setStatusMessage('🤖 AI Bot is analyzing angles & line of shot...');

    const aiTimer = setTimeout(() => {
      const cueBall = ballsRef.current.find((b) => b.number === 0 && b.active);
      const targetBall = getLowestActiveBall();

      if (!cueBall || !targetBall) {
        setIsAiThinking(false);
        return;
      }

      // If AI has ball-in-hand, reposition cue ball strategically behind target ball
      if (isBallInHand) {
        const pockets = pocketsRef.current;
        // Find best pocket near target
        let bestPocket = pockets[0];
        let minDist = 9999;
        pockets.forEach((p) => {
          const d = Math.hypot(p.x - targetBall.x, p.y - targetBall.y);
          if (d < minDist) {
            minDist = d;
            bestPocket = p;
          }
        });

        const targetToPocketAngle = Math.atan2(bestPocket.y - targetBall.y, bestPocket.x - targetBall.x);
        // Place cue ball in line with target & pocket
        const idealDist = BALL_RADIUS * 4;
        let candidateX = targetBall.x - Math.cos(targetToPocketAngle) * idealDist;
        let candidateY = targetBall.y - Math.sin(targetToPocketAngle) * idealDist;

        // Clamp inside table cushion bounds
        candidateX = Math.max(tableLeft + 20, Math.min(tableRight - 20, candidateX));
        candidateY = Math.max(tableTop + 20, Math.min(tableBottom - 20, candidateY));

        cueBall.x = candidateX;
        cueBall.y = candidateY;
        cueBall.vx = 0;
        cueBall.vy = 0;
        setIsBallInHand(false);
      }

      // Calculate AI Aim angle towards target ball & pocket ghost-ball
      const pockets = pocketsRef.current;
      let chosenPocket = pockets[0];
      let bestScore = -99999;

      pockets.forEach((pkt) => {
        const targetToPktX = pkt.x - targetBall.x;
        const targetToPktY = pkt.y - targetBall.y;
        const distTargetPkt = Math.hypot(targetToPktX, targetToPktY);
        const normX = targetToPktX / distTargetPkt;
        const normY = targetToPktY / distTargetPkt;

        // Ghost ball position (where cue ball center must be when hitting target)
        const ghostX = targetBall.x - normX * (BALL_RADIUS * 2);
        const ghostY = targetBall.y - normY * (BALL_RADIUS * 2);

        const cueToGhostX = ghostX - cueBall.x;
        const cueToGhostY = ghostY - cueBall.y;
        const distCueGhost = Math.hypot(cueToGhostX, cueToGhostY);

        // Dot product between cue->ghost vector and ghost->target vector
        const cueDirX = cueToGhostX / distCueGhost;
        const cueDirY = cueToGhostY / distCueGhost;
        const cutAngle = cueDirX * normX + cueDirY * normY; // 1 = straight on shot, 0 = 90 deg cut

        const score = cutAngle * 100 - distTargetPkt * 0.1 - distCueGhost * 0.05;
        if (score > bestScore) {
          bestScore = score;
          chosenPocket = pkt;
        }
      });

      // Target ghost ball position
      const tNormX = (chosenPocket.x - targetBall.x) / Math.hypot(chosenPocket.x - targetBall.x, chosenPocket.y - targetBall.y);
      const tNormY = (chosenPocket.y - targetBall.y) / Math.hypot(chosenPocket.x - targetBall.x, chosenPocket.y - targetBall.y);
      const aimGhostX = targetBall.x - tNormX * (BALL_RADIUS * 2);
      const aimGhostY = targetBall.y - tNormY * (BALL_RADIUS * 2);

      let aimAngle = Math.atan2(aimGhostY - cueBall.y, aimGhostX - cueBall.x);

      // Add difficulty-based error variance
      const errorMargin =
        aiDifficulty === 'hard' ? 0.03 : aiDifficulty === 'medium' ? 0.07 : 0.14;
      aimAngle += (Math.random() - 0.5) * errorMargin;

      // Calculate shot power
      const distToTarget = Math.hypot(targetBall.x - cueBall.x, targetBall.y - cueBall.y);
      let powerSpeed = 6.0 + Math.min(6.5, (distToTarget / 400) * 5.0) * powerMultiplier;

      // Strike the cue ball
      cueBall.vx = Math.cos(aimAngle) * powerSpeed;
      cueBall.vy = Math.sin(aimAngle) * powerSpeed;

      soundFx.playCueHit(powerMultiplier);
      isShotInProgressRef.current = true;
      firstHitBallRef.current = null;
      pottedThisShotRef.current = [];
      setTotalShots((s) => s + 1);
      setIsAiThinking(false);
      setStatusMessage('🤖 AI Bot fired shot!');
    }, 1100);

    return () => clearTimeout(aiTimer);
  }, [
    poolMode,
    currentPlayer,
    matchWinner,
    isBallInHand,
    aiDifficulty,
    powerMultiplier,
    tableLeft,
    tableRight,
    tableTop,
    tableBottom,
    areBallsAtRest,
    getLowestActiveBall,
    isAiThinking,
  ]);

  // Main Physics Engine & Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const updatePhysics = () => {
      const balls = ballsRef.current;
      const pockets = pocketsRef.current;
      const subSteps = 6; // Sub-stepping for ultra-accurate collision resolution
      const friction = 0.988;
      const cushionRestitution = 0.88;

      for (let step = 0; step < subSteps; step++) {
        // 1. Move balls
        for (let i = 0; i < balls.length; i++) {
          const ball = balls[i];
          if (!ball.active) continue;

          // If ball is sinking into pocket
          if (ball.sinking) {
            ball.sinkScale = (ball.sinkScale ?? 1) * 0.88;
            ball.sinkAlpha = (ball.sinkAlpha ?? 1) * 0.85;
            ball.vx *= 0.6;
            ball.vy *= 0.6;
            ball.x += ball.vx / subSteps;
            ball.y += ball.vy / subSteps;

            if ((ball.sinkScale ?? 1) < 0.2) {
              ball.active = false;
              ball.sinking = false;
              if (ball.number > 0) {
                setPottedHistory((prev) => [...prev, ball.number]);
              }
            }
            continue;
          }

          ball.x += ball.vx / subSteps;
          ball.y += ball.vy / subSteps;

          // Friction
          ball.vx *= Math.pow(friction, 1 / subSteps);
          ball.vy *= Math.pow(friction, 1 / subSteps);

          if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
          if (Math.abs(ball.vy) < 0.02) ball.vy = 0;

          // Cushion Wall Bounds
          const boundLeft = tableLeft + cushionBorder + ball.radius;
          const boundRight = tableRight - cushionBorder - ball.radius;
          const boundTop = tableTop + cushionBorder + ball.radius;
          const boundBottom = tableBottom - cushionBorder - ball.radius;

          let bounced = false;
          if (ball.x < boundLeft) {
            ball.x = boundLeft;
            ball.vx = -ball.vx * cushionRestitution;
            bounced = true;
          } else if (ball.x > boundRight) {
            ball.x = boundRight;
            ball.vx = -ball.vx * cushionRestitution;
            bounced = true;
          }

          if (ball.y < boundTop) {
            ball.y = boundTop;
            ball.vy = -ball.vy * cushionRestitution;
            bounced = true;
          } else if (ball.y > boundBottom) {
            ball.y = boundBottom;
            ball.vy = -ball.vy * cushionRestitution;
            bounced = true;
          }

          if (bounced && Math.hypot(ball.vx, ball.vy) > 0.8) {
            soundFx.playBilliardHit(0.25);
            spawnParticles(ball.x, ball.y, '#f1c40f', 3);
          }

          // Pocket Sinking Detection
          for (let p = 0; p < pockets.length; p++) {
            const pkt = pockets[p];
            const dx = ball.x - pkt.x;
            const dy = ball.y - pkt.y;
            const dist = Math.hypot(dx, dy);

            if (dist < pkt.dropRadius) {
              ball.sinking = true;
              ball.sinkScale = 1;
              ball.sinkAlpha = 1;
              // Gravity pull towards pocket center
              ball.vx = (pkt.x - ball.x) * 0.3;
              ball.vy = (pkt.y - ball.y) * 0.3;
              soundFx.playPocketDrop();
              spawnParticles(pkt.x, pkt.y, ball.color, 10);

              if (!pottedThisShotRef.current.includes(ball.number)) {
                pottedThisShotRef.current.push(ball.number);
              }
              break;
            }
          }
        }

        // 2. Ball-Ball 2D Elastic Collisions
        for (let i = 0; i < balls.length; i++) {
          const b1 = balls[i];
          if (!b1.active || b1.sinking) continue;

          for (let j = i + 1; j < balls.length; j++) {
            const b2 = balls[j];
            if (!b2.active || b2.sinking) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b1.radius + b2.radius;

            if (dist < minDist && dist > 0.0001) {
              // Overlap correction
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap * 0.5;
              b1.y -= ny * overlap * 0.5;
              b2.x += nx * overlap * 0.5;
              b2.y += ny * overlap * 0.5;

              // Elastic momentum transfer along collision normal
              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass = 1

              b1.vx -= p * nx * 0.96;
              b1.vy -= p * ny * 0.96;
              b2.vx += p * nx * 0.96;
              b2.vy += p * ny * 0.96;

              // Record first contact of cue ball
              if (b1.number === 0 && firstHitBallRef.current === null && b2.number > 0) {
                firstHitBallRef.current = b2.number;
              } else if (b2.number === 0 && firstHitBallRef.current === null && b1.number > 0) {
                firstHitBallRef.current = b1.number;
              }

              // Sound & particles
              const relSpeed = Math.hypot(kx, ky);
              if (relSpeed > 0.3) {
                soundFx.playBilliardHit(relSpeed / 10);
                spawnParticles((b1.x + b2.x) / 2, (b1.y + b2.y) / 2, '#ffffff', 4);
              }
            }
          }
        }
      }

      // Update sparkle particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.92;
        pt.vy *= 0.92;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Check if moving shot has fully ceased
      if (isShotInProgressRef.current && areBallsAtRest()) {
        handleShotComplete();
      }
    };

    // Render Canvas Scene
    const drawTable = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const theme = FELT_THEMES[feltTheme];
      const balls = ballsRef.current;
      const pockets = pocketsRef.current;
      const lowestTarget = getLowestActiveBall();
      const cueBall = balls.find((b) => b.number === 0 && b.active);

      ctx.save();
      ctx.clearRect(0, 0, virtualWidth, virtualHeight);

      // 1. Wood Rail Outer Frame
      ctx.fillStyle = theme.wood;
      ctx.beginPath();
      ctx.roundRect(tableLeft - 18, tableTop - 18, virtualWidth - 2 * tableMargin + 36, virtualHeight - 2 * tableMargin + 36, 24);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#3d2516';
      ctx.stroke();

      // Rail Inlay Diamond Sights (Sight markers around wood rail)
      ctx.fillStyle = '#f3ce6b';
      const sightsX = [virtualWidth / 4, virtualWidth / 2, (3 * virtualWidth) / 4];
      const sightsY = [virtualHeight / 4, virtualHeight / 2, (3 * virtualHeight) / 4];

      sightsX.forEach((sx) => {
        // Top & Bottom sights
        ctx.beginPath();
        ctx.arc(sx, tableTop - 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, tableBottom + 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      sightsY.forEach((sy) => {
        // Left & Right sights
        ctx.beginPath();
        ctx.arc(tableLeft - 9, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tableRight + 9, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Cushion Rubber Borders
      ctx.fillStyle = theme.cushion;
      ctx.beginPath();
      ctx.roundRect(tableLeft, tableTop, virtualWidth - 2 * tableMargin, virtualHeight - 2 * tableMargin, 16);
      ctx.fill();

      // 3. Pool Table Cloth Bed (Felt Radial Lighting)
      const clothWidth = virtualWidth - 2 * (tableMargin + cushionBorder);
      const clothHeight = virtualHeight - 2 * (tableMargin + cushionBorder);
      const clothLeft = tableLeft + cushionBorder;
      const clothTop = tableTop + cushionBorder;

      const feltGrad = ctx.createRadialGradient(
        virtualWidth / 2,
        virtualHeight / 2,
        40,
        virtualWidth / 2,
        virtualHeight / 2,
        virtualHeight / 1.5
      );
      feltGrad.addColorStop(0, theme.inner);
      feltGrad.addColorStop(1, theme.outer);

      ctx.fillStyle = feltGrad;
      ctx.beginPath();
      ctx.roundRect(clothLeft, clothTop, clothWidth, clothHeight, 8);
      ctx.fill();

      // Table markings (Head String line and Foot Spot)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clothLeft, 470);
      ctx.lineTo(clothLeft + clothWidth, 470);
      ctx.stroke();

      // Foot Spot (Rack Spot)
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(virtualWidth / 2, 180, 3, 0, Math.PI * 2);
      ctx.fill();

      // 4. Drop Pockets (6 Deep black leather cups)
      pockets.forEach((pkt) => {
        // Pocket outer rim
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, pkt.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0d';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#2b2c30';
        ctx.stroke();

        // Pocket deep hole
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, pkt.dropRadius - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#020204';
        ctx.fill();
      });

      // 5. Lowest Active Target Ball Highlight Ring
      if (lowestTarget && lowestTarget.active && !lowestTarget.sinking) {
        const pulse = 1 + 0.15 * Math.sin(performance.now() * 0.008);
        ctx.save();
        ctx.beginPath();
        ctx.arc(lowestTarget.x, lowestTarget.y, lowestTarget.radius * 1.6 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Aiming Trajectory & Ghost Ball Prediction (When dragging or aiming)
      if (
        isDraggingRef.current &&
        cueBall &&
        !isShotInProgressRef.current &&
        !isBallInHand &&
        showAimTrajectory
      ) {
        const dx = dragStartRef.current.x - dragCurrentRef.current.x;
        const dy = dragStartRef.current.y - dragCurrentRef.current.y;
        const pullDist = Math.hypot(dx, dy);

        if (pullDist > 4) {
          const aimAngle = Math.atan2(dy, dx);
          const rayLength = 360;
          const endX = cueBall.x + Math.cos(aimAngle) * rayLength;
          const endY = cueBall.y + Math.sin(aimAngle) * rayLength;

          // Ray-cast to find first ball struck
          let nearestHit: { ball: Ball; dist: number; ghostX: number; ghostY: number } | null = null;
          let minRayDist = 9999;

          balls.forEach((b) => {
            if (!b.active || b.number === 0 || b.sinking) return;
            const toBallX = b.x - cueBall.x;
            const toBallY = b.y - cueBall.y;
            const proj = toBallX * Math.cos(aimAngle) + toBallY * Math.sin(aimAngle);

            if (proj > 0) {
              const perpDist = Math.abs(toBallX * -Math.sin(aimAngle) + toBallY * Math.cos(aimAngle));
              const collisionRadius = b.radius + cueBall.radius;

              if (perpDist < collisionRadius) {
                const backDist = Math.sqrt(collisionRadius * collisionRadius - perpDist * perpDist);
                const hitDist = proj - backDist;
                if (hitDist > 0 && hitDist < minRayDist) {
                  minRayDist = hitDist;
                  nearestHit = {
                    ball: b,
                    dist: hitDist,
                    ghostX: cueBall.x + Math.cos(aimAngle) * hitDist,
                    ghostY: cueBall.y + Math.sin(aimAngle) * hitDist,
                  };
                }
              }
            }
          });

          // Draw Cue Ball Trajectory Guide
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(cueBall.x, cueBall.y);
          if (nearestHit) {
            ctx.lineTo(nearestHit.ghostX, nearestHit.ghostY);
          } else {
            ctx.lineTo(endX, endY);
          }
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Draw Ghost Ball at collision point
          if (nearestHit) {
            ctx.beginPath();
            ctx.arc(nearestHit.ghostX, nearestHit.ghostY, cueBall.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([2, 2]);
            ctx.stroke();

            // Draw Target Ball deflection vector towards pocket
            const hitNormX = nearestHit.ball.x - nearestHit.ghostX;
            const hitNormY = nearestHit.ball.y - nearestHit.ghostY;
            const hitNormDist = Math.hypot(hitNormX, hitNormY) || 1;
            const deflX = nearestHit.ball.x + (hitNormX / hitNormDist) * 45;
            const deflY = nearestHit.ball.y + (hitNormY / hitNormDist) * 45;

            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.moveTo(nearestHit.ball.x, nearestHit.ball.y);
            ctx.lineTo(deflX, deflY);
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.arc(deflX, deflY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();
          }

          // Draw Physical Cue Stick Behind Cue Ball
          const cueOffset = 22 + Math.min(60, pullDist * 0.45);
          const cueLength = 170;
          const cueStartX = cueBall.x - Math.cos(aimAngle) * cueOffset;
          const cueStartY = cueBall.y - Math.sin(aimAngle) * cueOffset;
          const cueEndX = cueBall.x - Math.cos(aimAngle) * (cueOffset + cueLength);
          const cueEndY = cueBall.y - Math.sin(aimAngle) * (cueOffset + cueLength);

          // Cue shaft
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(cueStartX, cueStartY);
          ctx.lineTo(cueEndX, cueEndY);
          ctx.strokeStyle = '#d4a373';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Cue tip
          ctx.beginPath();
          ctx.moveTo(cueStartX, cueStartY);
          ctx.lineTo(
            cueStartX - Math.cos(aimAngle) * 8,
            cueStartY - Math.sin(aimAngle) * 8
          );
          ctx.strokeStyle = '#3498db';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.restore();
        }
      }

      // 7. Render All Balls (3D Specular Spheres + Number discs)
      balls.forEach((ball) => {
        if (!ball.active) return;

        const scale = ball.sinkScale ?? 1;
        const alpha = ball.sinkAlpha ?? 1;
        const r = ball.radius * scale;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Ball Shadow
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 3, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // 3D Sphere Radial Gradient Base
        const ballGrad = ctx.createRadialGradient(
          ball.x - r * 0.35,
          ball.y - r * 0.35,
          r * 0.1,
          ball.x,
          ball.y,
          r
        );

        if (ball.number === 0) {
          // Cue ball ivory sheen
          ballGrad.addColorStop(0, '#ffffff');
          ballGrad.addColorStop(0.7, '#e6e9f0');
          ballGrad.addColorStop(1, '#a8b0be');
        } else if (ball.number === 9) {
          // 9-Ball Gold with center stripe
          ballGrad.addColorStop(0, '#fff5cc');
          ballGrad.addColorStop(0.5, '#f39c12');
          ballGrad.addColorStop(1, '#a35a00');
        } else {
          ballGrad.addColorStop(0, '#ffffff');
          ballGrad.addColorStop(0.35, ball.color);
          ballGrad.addColorStop(1, '#000000');
        }

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();

        // 9-Ball White Stripe Bands
        if (ball.isStripe) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, r * 0.95, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ball.x - r, ball.y - r * 0.45, r * 2, r * 0.9);
          ctx.restore();
        }

        // White Number Disc Circle
        if (ball.number > 0) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, r * 0.48, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

          // Ball Number Digit
          ctx.fillStyle = '#0a0a0d';
          ctx.font = `bold ${Math.max(6, Math.floor(r * 0.65))}px 'Segoe UI', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.number.toString(), ball.x, ball.y + 0.5);

          // Underline on 6 and 9 for official pool ball clarity
          if (ball.number === 6 || ball.number === 9) {
            ctx.beginPath();
            ctx.moveTo(ball.x - 2.5, ball.y + r * 0.3);
            ctx.lineTo(ball.x + 2.5, ball.y + r * 0.3);
            ctx.strokeStyle = '#0a0a0d';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else {
          // Cue Ball Red Target Aim Dot
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#e74c3c';
          ctx.fill();
        }

        // Glossy Top-Left Specular Glint
        ctx.beginPath();
        ctx.arc(ball.x - r * 0.35, ball.y - r * 0.35, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();

        ctx.restore();
      });

      // 8. Ball-in-Hand Placement Ring
      if (isBallInHand && cueBall) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cueBall.x, cueBall.y, cueBall.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // 9. Sparkle Particles
      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    };

    const mainLoop = (time: number) => {
      updatePhysics();
      drawTable();
      animFrameRef.current = requestAnimationFrame(mainLoop);
    };

    animFrameRef.current = requestAnimationFrame(mainLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    feltTheme,
    isBallInHand,
    showAimTrajectory,
    tableLeft,
    tableRight,
    tableTop,
    tableBottom,
    areBallsAtRest,
    getLowestActiveBall,
    handleShotComplete,
  ]);

  // Initial table setup on mount
  useEffect(() => {
    initBalls();
  }, [initBalls]);

  // Convert mouse/touch screen coordinates to virtual table coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = virtualWidth / rect.width;
    const scaleY = virtualHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Pointer Down (Drag Start / Ball-in-Hand Placement)
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (poolMode === 'ai' && currentPlayer === 2) return;
    if (matchWinner !== null) return;

    const { x, y } = getCanvasCoords(clientX, clientY);
    const cueBall = ballsRef.current.find((b) => b.number === 0 && b.active);
    if (!cueBall) return;

    // Ball-in-Hand repositioning
    if (isBallInHand) {
      // Clamp inside felt
      const minX = tableLeft + cushionBorder + cueBall.radius;
      const maxX = tableRight - cushionBorder - cueBall.radius;
      const minY = tableTop + cushionBorder + cueBall.radius;
      const maxY = tableBottom - cushionBorder - cueBall.radius;

      cueBall.x = Math.max(minX, Math.min(maxX, x));
      cueBall.y = Math.max(minY, Math.min(maxY, y));
      cueBall.vx = 0;
      cueBall.vy = 0;
      setIsBallInHand(false);
      setStatusMessage('Cue ball placed! Now pull back to aim & shoot.');
      soundFx.playClick();
      return;
    }

    // Cue aiming drag start: allow starting drag from anywhere or near cue ball
    if (areBallsAtRest()) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: cueBall.x, y: cueBall.y };
      dragCurrentRef.current = { x, y };
    }
  };

  // Pointer Move (Aiming Vector)
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const coords = getCanvasCoords(clientX, clientY);
    dragCurrentRef.current = coords;
  };

  // Pointer Up (Fire Shot)
  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const cueBall = ballsRef.current.find((b) => b.number === 0 && b.active);
    if (!cueBall) return;

    const dx = dragStartRef.current.x - dragCurrentRef.current.x;
    const dy = dragStartRef.current.y - dragCurrentRef.current.y;
    const pullDist = Math.hypot(dx, dy);

    if (pullDist > 8) {
      const aimAngle = Math.atan2(dy, dx);
      const strikeSpeed = Math.min(13.5, (pullDist / 12) * 1.5) * powerMultiplier;

      cueBall.vx = Math.cos(aimAngle) * strikeSpeed;
      cueBall.vy = Math.sin(aimAngle) * strikeSpeed;

      soundFx.playCueHit(powerMultiplier);
      isShotInProgressRef.current = true;
      firstHitBallRef.current = null;
      pottedThisShotRef.current = [];
      setTotalShots((s) => s + 1);
    }
  };

  const copyStandaloneCode = () => {
    const htmlSnippet = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>9-Ball Pool Pro Arena - Standalone Edition</title>
  <style>
    :root {
      --bg-canvas: #090b10;
      --panel-bg: #111522;
      --card-bg: #161c2d;
      --border-line: #242f4c;
      --accent-gold: #f1c40f;
      --accent-blue: #3498db;
      --text-main: #ffffff;
      --text-muted: #8c92a4;
    }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-canvas);
      color: var(--text-main);
      margin: 0; padding: 16px;
      display: flex; justify-content: center;
      touch-action: manipulation;
    }
    .platform-container {
      max-width: 480px; width: 100%;
      background: var(--panel-bg);
      border: 1px solid var(--border-line);
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.9);
      overflow: hidden; display: flex; flex-direction: column;
    }
    .arcade-header {
      background: #0d111b; padding: 14px 18px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border-line);
    }
    .scoreboard-panel {
      padding: 10px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #0f131d;
    }
    .score-card { background: var(--card-bg); border: 1px solid var(--border-line); border-radius: 10px; padding: 8px 12px; }
    .score-header { font-size: 9px; color: var(--text-muted); text-transform: uppercase; }
    .score-value { font-size: 13px; font-weight: 700; color: var(--accent-gold); }
    .board-stage { padding: 12px 16px; display: flex; justify-content: center; position: relative; }
    canvas {
      background: radial-gradient(circle, #1b6335 0%, #0c2d16 100%);
      border: 10px solid #2c1810; border-radius: 14px;
      box-shadow: inset 0 0 35px rgba(0,0,0,0.6), 0 10px 25px rgba(0,0,0,0.7);
      touch-action: none; cursor: crosshair; width: 100%; max-width: 400px; height: auto;
    }
    .controls-panel { padding: 0 18px 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .slider-group { background: var(--card-bg); border: 1px solid var(--border-line); border-radius: 8px; padding: 8px 12px; }
    .slider-header { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); }
    .slider-track { width: 100%; accent-color: var(--accent-blue); cursor: pointer; }
    .action-button {
      background: linear-gradient(135deg, #1b2438, #131929);
      border: 1px solid var(--border-line); color: var(--text-main);
      padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center;
    }
  </style>
</head>
<body>
<div class="platform-container">
  <div class="arcade-header">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#3498db,#f1c40f);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🎱</div>
      <div>
        <h3 style="margin:0;font-size:14px;color:#fff;">9-Ball Pool Pro Arena</h3>
        <p style="margin:2px 0 0;font-size:10px;color:#8c92a4;">Sequential Diamond Rack Physics</p>
      </div>
    </div>
  </div>
  <div class="scoreboard-panel">
    <div class="score-card">
      <div class="score-header" id="turnIndicator">TURN: PLAYER 1</div>
      <div class="score-value" id="targetDisplay">Target: #1 Ball</div>
    </div>
    <div class="score-card">
      <div class="score-header">REMAINING BALLS</div>
      <div class="score-value" id="ballsCount">9 Balls</div>
    </div>
  </div>
  <div class="board-stage">
    <canvas id="poolCanvas" width="400" height="550"></canvas>
  </div>
  <div class="controls-panel">
    <div class="slider-group">
      <div class="slider-header"><span>Shot Power:</span><strong id="powerVal" style="color:#f1c40f">85%</strong></div>
      <input type="range" min="15" max="100" value="85" class="slider-track" id="powerSlider">
    </div>
    <button class="action-button" onclick="initGame()">🔄 Reset Diamond Rack</button>
  </div>
</div>
<script>
  const canvas = document.getElementById('poolCanvas');
  const ctx = canvas.getContext('2d');
  let power = 0.85;
  let cueBall = { x: 200, y: 440, radius: 9, vx: 0, vy: 0 };
  let balls = [];
  let isDragging = false, startX = 0, startY = 0;
  const pockets = [
    {x:24,y:24,r:16},{x:376,y:24,r:16},
    {x:20,y:275,r:14},{x:380,y:275,r:14},
    {x:24,y:526,r:16},{x:376,y:526,r:16}
  ];
  const ballColors = {
    1:'#f1c40f',2:'#2980b9',3:'#e74c3c',4:'#8e44ad',
    5:'#e67e22',6:'#27ae60',7:'#78281f',8:'#111111',9:'#f39c12'
  };
  function initGame() {
    balls = [];
    cueBall = { x: 200, y: 440, radius: 9, vx: 0, vy: 0 };
    const rack = [[1], [2, 3], [4, 9, 5], [6, 7], [8]];
    rack.forEach((row, ri) => {
      const rw = (row.length - 1) * 18;
      const sx = 200 - rw / 2;
      row.forEach((num, ci) => {
        balls.push({
          num, x: sx + ci * 18, y: 150 + ri * 16,
          radius: 9, color: ballColors[num], active: true, vx: 0, vy: 0
        });
      });
    });
    updateUI();
  }
  function updateUI() {
    const active = balls.filter(b => b.active).sort((a,b)=>a.num - b.num);
    document.getElementById('ballsCount').textContent = active.length + ' Balls';
    document.getElementById('targetDisplay').textContent = active.length > 0 ? 'Target: #' + active[0].num : 'Victory!';
  }
  function updatePhysics() {
    cueBall.x += cueBall.vx; cueBall.y += cueBall.vy;
    cueBall.vx *= 0.985; cueBall.vy *= 0.985;
    if (cueBall.x < 24 || cueBall.x > 376) cueBall.vx *= -0.9;
    if (cueBall.y < 24 || cueBall.y > 526) cueBall.vy *= -0.9;
    balls.forEach(b => {
      if (!b.active) return;
      let dx = b.x - cueBall.x, dy = b.y - cueBall.y;
      let dist = Math.hypot(dx, dy);
      if (dist < b.radius + cueBall.radius && dist > 0) {
        let angle = Math.atan2(dy, dx);
        let speed = Math.hypot(cueBall.vx, cueBall.vy) || 3;
        b.vx = Math.cos(angle) * speed * 0.92;
        b.vy = Math.sin(angle) * speed * 0.92;
      }
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.985; b.vy *= 0.985;
      if (b.x < 24 || b.x > 376) b.vx *= -0.9;
      if (b.y < 24 || b.y > 526) b.vy *= -0.9;
      pockets.forEach(p => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
          b.active = false; updateUI();
        }
      });
    });
  }
  function draw() {
    ctx.clearRect(0, 0, 400, 550);
    pockets.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0d'; ctx.fill();
    });
    balls.forEach(b => {
      if (!b.active) return;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.num, b.x, b.y);
    });
    ctx.beginPath(); ctx.arc(cueBall.x, cueBall.y, cueBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    if (isDragging) {
      ctx.beginPath(); ctx.moveTo(cueBall.x, cueBall.y); ctx.lineTo(startX, startY);
      ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function loop() { updatePhysics(); draw(); requestAnimationFrame(loop); }
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    isDragging = true; startX = e.clientX - rect.left; startY = e.clientY - rect.top;
  });
  window.addEventListener('mousemove', e => {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left; startY = e.clientY - rect.top;
    }
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      let dx = cueBall.x - startX, dy = cueBall.y - startY;
      cueBall.vx = dx * 0.08 * power; cueBall.vy = dy * 0.08 * power;
    }
  });
  document.getElementById('powerSlider').addEventListener('input', e => {
    document.getElementById('powerVal').textContent = e.target.value + '%';
    power = e.target.value / 100;
  });
  initGame(); loop();
</script>
</body>
</html>`;

    navigator.clipboard.writeText(htmlSnippet).then(() => {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    });
  };

  const lowestActive = getLowestActiveBall();
  const remainingBallsCount = ballsRef.current.filter((b) => b.active && b.number > 0).length;

  return (
    <div className="w-full flex flex-col items-center select-none animate-fadeIn">
      {/* 1. ARCADE DASHBOARD VIEW (When currentView === 'hub') */}
      {currentView === 'hub' ? (
        <div className="w-full max-w-[540px] bg-[#111522] border border-[#242f4c] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3498db] to-[#f1c40f] flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                🎱
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Arcade Platform Pro Suite</h2>
                  <span className="text-[10px] bg-[#22304a] text-[#f1c40f] px-2 py-0.5 rounded font-mono font-bold border border-[#34495e]">
                    9-BALL PRO
                  </span>
                </div>
                <p className="text-xs text-gray-400">Standalone 9-Ball Pool Arena &amp; Physics Hub</p>
              </div>
            </div>
          </div>

          {/* Featured Game Card */}
          <div
            onClick={() => setCurrentView('game')}
            className="group bg-[#161c2d] hover:bg-[#1d263f] border border-[#242f4c] hover:border-[#3498db] rounded-2xl p-5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl">🎱</span>
              <span className="text-[10px] text-gray-400 bg-[#0f131d] px-2.5 py-1 rounded-lg border border-[#242f4c] font-bold">
                BEST: 9-BALL PRO
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-[#f1c40f] transition">
              9-Ball Pool Pro Arena
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Sequential diamond rack physics engine supporting touch drag on mobile and mouse drag
              on desktop. Play vs AI Bot or Pass &amp; Play!
            </p>
            <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#22304a] to-[#131929] border border-[#242f4c] text-[#f1c40f] text-xs font-bold text-center tracking-wide group-hover:border-[#f1c40f]/50 transition">
              ▶ PLAY 9-BALL POOL
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
            <span>Platform Engine v6.3</span>
            <span>60 FPS Unified Physics</span>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE 9-BALL ARENA VIEW */
        <div className="w-full max-w-[540px] bg-[#111522] border border-[#242f4c] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col">
          {/* Header Bar */}
          <div className="bg-[#0d111b] px-4 py-3 border-b border-[#242f4c] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('hub')}
                className="px-2.5 py-1 rounded-lg bg-[#161c2d] hover:bg-[#1f2942] border border-[#242f4c] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Arcade Hub</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#f1c40f]">
                <span>🎱 9-Ball Pool Pro</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundActive(!soundActive)}
                className={`p-1.5 rounded-lg border transition ${
                  soundActive
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-500'
                }`}
                title="Toggle Sound"
              >
                {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowRulesModal(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                title="9-Ball Rules"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSnippetModal(true)}
                className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 transition"
                title="Standalone HTML Code Snippet"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Tabs (AI Bot vs 2P Local vs Practice) */}
          <div className="bg-[#090d16] px-4 py-2 border-b border-[#242f4c] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 bg-[#131929] p-1 rounded-xl border border-[#242f4c]">
              <button
                onClick={() => {
                  setPoolMode('ai');
                  initBalls();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  poolMode === 'ai'
                    ? 'bg-[#3498db] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Vs AI Bot</span>
              </button>
              <button
                onClick={() => {
                  setPoolMode('pvp');
                  initBalls();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  poolMode === 'pvp'
                    ? 'bg-[#f1c40f] text-slate-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Pass &amp; Play</span>
              </button>
              <button
                onClick={() => {
                  setPoolMode('practice');
                  initBalls();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  poolMode === 'practice'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Practice</span>
              </button>
            </div>

            {poolMode === 'ai' && (
              <div className="flex items-center gap-1">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setAiDifficulty(lvl)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      aiDifficulty === lvl
                        ? 'bg-purple-600 text-white border border-purple-400'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scoreboard Panel */}
          <div className="bg-[#0f131d] px-4 py-3 border-b border-[#242f4c] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-[#161c2d] border border-[#242f4c] rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                {poolMode === 'ai'
                  ? currentPlayer === 1
                    ? 'TURN: YOUR SHOT'
                    : 'AI BOT THINKING...'
                  : `PLAYER ${currentPlayer}'S INNING`}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    currentPlayer === 1 ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                />
                <span className="font-bold text-white text-sm">
                  {poolMode === 'ai'
                    ? currentPlayer === 1
                      ? 'Player 1'
                      : 'AI Bot'
                    : `Player ${currentPlayer}`}
                </span>
              </div>
            </div>

            <div className="bg-[#161c2d] border border-[#242f4c] rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                MANDATORY TARGET
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {lowestActive ? (
                  <>
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow"
                      style={{ backgroundColor: lowestActive.color }}
                    >
                      {lowestActive.number}
                    </span>
                    <span className="font-bold text-[#f1c40f] text-sm">
                      Ball #{lowestActive.number}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-emerald-400 text-sm">Winner!</span>
                )}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#161c2d] border border-[#242f4c] rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                TABLE REMAINING
              </span>
              <span className="font-bold text-white text-sm mt-0.5">
                {remainingBallsCount} / 9 Balls
              </span>
            </div>
          </div>

          {/* Live Status & Foul Alert Banner */}
          {foulAlert && (
            <div className="bg-red-500/20 border-b border-red-500/40 px-4 py-1.5 text-xs text-red-200 font-bold flex items-center gap-2 animate-bounce">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>{foulAlert}</span>
            </div>
          )}

          <div className="bg-[#090d16] px-4 py-1.5 text-[11px] text-gray-300 font-medium border-b border-[#242f4c] truncate">
            {statusMessage}
          </div>

          {/* Interactive Pool Table Canvas Stage */}
          <div
            ref={containerRef}
            className="p-3 bg-[#0a0d16] flex flex-col items-center justify-center relative touch-none select-none"
          >
            <canvas
              ref={canvasRef}
              width={virtualWidth}
              height={virtualHeight}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handlePointerDown(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handlePointerMove(touch.clientX, touch.clientY);
              }}
              onTouchEnd={handlePointerUp}
              className="w-full max-w-[420px] h-auto rounded-2xl shadow-2xl cursor-crosshair active:cursor-grabbing border-4 border-[#1c1107]"
            />

            {/* Victory Splash Overlay */}
            <AnimatePresence>
              {matchWinner !== null && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-4 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 border border-amber-400/50 shadow-2xl"
                >
                  <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
                  <h3 className="text-2xl font-black text-white font-serif mb-1">
                    {poolMode === 'ai'
                      ? matchWinner === 1
                        ? 'YOU WON THE MATCH!'
                        : 'AI BOT WINS!'
                      : `PLAYER ${matchWinner} WINS!`}
                  </h3>
                  <p className="text-xs text-amber-200/80 mb-5">
                    9-Ball sunk legally into the pocket! Frame recorded in career history.
                  </p>
                  <button
                    onClick={initBalls}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:scale-105 transition"
                  >
                    🔄 Play Next Rack
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Potted Balls Collection Tray */}
          <div className="bg-[#0d111b] px-4 py-2 border-t border-b border-[#242f4c] flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Potted Rack Tray:
            </span>
            <div className="flex items-center gap-1.5">
              {pottedHistory.length === 0 ? (
                <span className="text-[10px] text-gray-600 italic">No balls potted yet</span>
              ) : (
                pottedHistory.map((bNum, idx) => (
                  <span
                    key={idx}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-black/40 shadow"
                    style={{ backgroundColor: BALL_COLORS[bNum]?.color || '#fff' }}
                  >
                    {bNum}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Controls & Power Slider Panel */}
          <div className="p-4 bg-[#0f131d] flex flex-col gap-3">
            {/* Power Slider */}
            <div className="bg-[#161c2d] border border-[#242f4c] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shot Power Gauge:</span>
                </span>
                <strong className="text-[#f1c40f] font-mono text-sm">
                  {Math.round(powerMultiplier * 100)}%
                </strong>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                value={Math.round(powerMultiplier * 100)}
                onChange={(e) => setPowerMultiplier(Number(e.target.value) / 100)}
                className="w-full accent-[#3498db] cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <button
                  onClick={() => setPowerMultiplier(0.35)}
                  className="hover:text-white px-2 py-0.5 rounded bg-white/5"
                >
                  Gentle (35%)
                </button>
                <button
                  onClick={() => setPowerMultiplier(0.65)}
                  className="hover:text-white px-2 py-0.5 rounded bg-white/5"
                >
                  Medium (65%)
                </button>
                <button
                  onClick={() => setPowerMultiplier(0.85)}
                  className="hover:text-white px-2 py-0.5 rounded bg-white/5"
                >
                  Hard (85%)
                </button>
                <button
                  onClick={() => setPowerMultiplier(1.0)}
                  className="hover:text-white px-2 py-0.5 rounded bg-white/5"
                >
                  Break (100%)
                </button>
              </div>
            </div>

            {/* Felt Theme Selector & Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#161c2d] border border-[#242f4c] rounded-xl p-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase pl-1">Felt Cloth:</span>
                <select
                  value={feltTheme}
                  onChange={(e) => setFeltTheme(e.target.value as PoolFeltTheme)}
                  className="bg-[#0f131d] text-xs text-amber-300 font-bold rounded-lg px-2 py-1 border border-[#242f4c] focus:outline-none"
                >
                  {Object.entries(FELT_THEMES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={initBalls}
                className="bg-gradient-to-r from-[#1b2438] to-[#131929] hover:border-[#3498db] border border-[#242f4c] text-white rounded-xl p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#f1c40f]" />
                <span>Rerack Table</span>
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-[#090b10] px-4 py-2.5 border-t border-[#242f4c] flex items-center justify-between text-[10px] text-gray-500">
            <span>Platform Engine v6.3 • 9-Ball Pool</span>
            <span>60 FPS Unified Engine</span>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111522] border border-[#242f4c] rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-serif">Official 9-Ball Pool Rules</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200">
                <strong>Objective:</strong> Be the player to legally pocket the <strong>9-Ball</strong>!
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs">1. Sequential Lowest Ball Rule:</h4>
                <p>
                  On every shot, the cue ball must make its <em>first contact</em> with the lowest-numbered
                  ball currently on the table (indicated by the Target display and glowing ring).
                </p>

                <h4 className="font-bold text-white text-xs">2. Pocketing Balls:</h4>
                <p>
                  Any ball pocketed on a legal shot allows the player to continue their turn. If the target ball
                  is struck first and deflects into other balls, any ball potted is valid (including combo shots).
                </p>

                <h4 className="font-bold text-white text-xs">3. Fouls &amp; Ball-in-Hand:</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-400">
                  <li>Cue ball scratch (pocketing the white cue ball).</li>
                  <li>First contact made with a higher ball instead of the lowest active ball.</li>
                  <li>Failure to strike any object ball on table.</li>
                </ul>
                <p className="text-blue-300">
                  After a foul, the incoming player gets <strong>Ball-in-Hand</strong> and can place the cue ball anywhere on table.
                </p>

                <h4 className="font-bold text-white text-xs">4. Winning the Game:</h4>
                <p>
                  A player wins immediately upon pocketing the <strong>9-Ball</strong> on a legal shot, whether on the break, during regular run-out, or via a legal combination shot!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Standalone Snippet Modal */}
      {showSnippetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#111522] border border-[#242f4c] rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2 text-[#3498db] font-bold">
                <Code className="w-5 h-5" />
                <h3 className="text-base">Standalone 9-Ball Pool Single-File HTML</h3>
              </div>
              <button
                onClick={() => setShowSnippetModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Copy this self-contained HTML/JS bundle to run the 9-Ball Pool physics game offline or in any browser window!
            </p>

            <button
              onClick={copyStandaloneCode}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition mb-3"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Standalone HTML5 Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
