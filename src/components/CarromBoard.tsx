import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Target,
  Bot,
  User,
  Users,
  Sparkles,
  Zap,
  HelpCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Flame,
  Sliders,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

export type CarromGameMode = 'classic' | 'freestyle' | 'discpool';
export type CarromOpponent = 'ai' | 'local' | 'solo';
export type CarromPieceLayout = 'tournament' | 'compact';

interface CarromPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'white' | 'black' | 'queen';
  points: number;
  active: boolean;
  pocketedBy?: 1 | 2;
  sinkProgress?: number; // 0 to 1 for pocket suction animation
}

interface StrikerState {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean; // true = ready to shoot, false = in motion
  isAiming: boolean;
  aimAngle: number; // in radians
  aimPower: number; // 0 to 100
}

interface CarromBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const CarromBoard: React.FC<CarromBoardProps> = ({
  gameMode: externalGameMode = 'local',
  onGameEnd,
}) => {
  // Game Setup
  const [carromFormat, setCarromFormat] = useState<CarromGameMode>('classic');
  const [opponentType, setOpponentType] = useState<CarromOpponent>(
    externalGameMode === 'ai' ? 'ai' : 'local'
  );
  const [pieceLayout, setPieceLayout] = useState<CarromPieceLayout>('tournament');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Match State
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [queenCoverPending, setQueenCoverPending] = useState<1 | 2 | null>(null);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [matchStatusText, setMatchStatusText] = useState<string>(
    'Player 1 Turn: Slide striker on baseline, pull back to aim & strike!'
  );
  const [foulOccurred, setFoulOccurred] = useState<string | null>(null);
  const [shotCount, setShotCount] = useState<number>(0);
  const [gameTimeSeconds, setGameTimeSeconds] = useState<number>(0);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [comboCount, setComboCount] = useState<number>(0);

  // Canvas Refs & Dimensions
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const BOARD_SIZE = 500; // Internal coordinate grid
  const POCKET_RADIUS = 26;
  const CORNER_OFFSET = 38;

  // Board Pockets
  const POCKETS = [
    { x: CORNER_OFFSET, y: CORNER_OFFSET },
    { x: BOARD_SIZE - CORNER_OFFSET, y: CORNER_OFFSET },
    { x: CORNER_OFFSET, y: BOARD_SIZE - CORNER_OFFSET },
    { x: BOARD_SIZE - CORNER_OFFSET, y: BOARD_SIZE - CORNER_OFFSET },
  ];

  // Baseline Boundaries
  const BASELINE_Y_P1 = 430;
  const BASELINE_Y_P2 = 70;
  const BASELINE_MIN_X = 90;
  const BASELINE_MAX_X = 410;

  // Live Physics State in Ref
  const strikerRef = useRef<StrikerState>({
    x: 250,
    y: BASELINE_Y_P1,
    baseY: BASELINE_Y_P1,
    vx: 0,
    vy: 0,
    radius: 17,
    active: true,
    isAiming: false,
    aimAngle: -Math.PI / 2, // Aim straight up initially
    aimPower: 50,
  });

  const piecesRef = useRef<CarromPiece[]>([]);
  const isSimulatingRef = useRef<boolean>(false);
  const pointerDragRef = useRef<{
    isDraggingPosition: boolean;
    isPullingAim: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    isDraggingPosition: false,
    isPullingAim: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const animationFrameIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const piecePocketedThisShotRef = useRef<CarromPiece[]>([]);

  // Synthesize Sound Effects
  const playCarromSound = (type: 'strike' | 'clack' | 'pocket' | 'foul' | 'win') => {
    if (!soundActive) return;
    try {
      if (type === 'strike') soundFx.playMove();
      else if (type === 'clack') soundFx.playCheck();
      else if (type === 'pocket') soundFx.playCapture();
      else if (type === 'foul') soundFx.playCheck();
      else if (type === 'win') soundFx.playGameOver(true);
    } catch {
      // Safe fallback
    }
  };

  // Initialize Piece Layouts
  const initBoardPieces = useCallback(
    (layout: CarromPieceLayout = pieceLayout) => {
      const pieces: CarromPiece[] = [];
      const cx = BOARD_SIZE / 2;
      const cy = BOARD_SIZE / 2;
      const pieceRadius = 12.5;

      let pieceId = 1;

      // Center Red Queen (25 points)
      pieces.push({
        id: pieceId++,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: pieceRadius,
        color: '#dc2626', // Vibrant Red
        type: 'queen',
        points: 25,
        active: true,
      });

      // Inner Ring of 6 Pieces (alternating White & Black)
      const innerDist = 27;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const isWhite = i % 2 === 0;
        pieces.push({
          id: pieceId++,
          x: cx + Math.cos(angle) * innerDist,
          y: cy + Math.sin(angle) * innerDist,
          vx: 0,
          vy: 0,
          radius: pieceRadius,
          color: isWhite ? '#fef3c7' : '#1e293b', // Cream White & Obsidian Black
          type: isWhite ? 'white' : 'black',
          points: isWhite ? 10 : 5,
          active: true,
        });
      }

      // If Tournament Layout, add Outer Ring of 12 Pieces
      if (layout === 'tournament') {
        const outerDist = 53;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6 + Math.PI / 12;
          const isWhite = i % 2 === 1;
          pieces.push({
            id: pieceId++,
            x: cx + Math.cos(angle) * outerDist,
            y: cy + Math.sin(angle) * outerDist,
            vx: 0,
            vy: 0,
            radius: pieceRadius,
            color: isWhite ? '#fef3c7' : '#1e293b',
            type: isWhite ? 'white' : 'black',
            points: isWhite ? 10 : 5,
            active: true,
          });
        }
      }

      piecesRef.current = pieces;
    },
    [pieceLayout]
  );

  // Position Striker on Baseline
  const resetStrikerToBaseline = (player: 1 | 2 = currentPlayer) => {
    const baseY = player === 1 ? BASELINE_Y_P1 : BASELINE_Y_P2;
    const initialAim = player === 1 ? -Math.PI / 2 : Math.PI / 2;

    strikerRef.current = {
      x: BOARD_SIZE / 2,
      y: baseY,
      baseY: baseY,
      vx: 0,
      vy: 0,
      radius: 17,
      active: true,
      isAiming: false,
      aimAngle: initialAim,
      aimPower: 55,
    };
  };

  // Full Match Reset
  const resetMatch = useCallback(
    (newLayout?: CarromPieceLayout, newFormat?: CarromGameMode) => {
      const activeL = newLayout || pieceLayout;
      const activeF = newFormat || carromFormat;

      setPlayer1Score(0);
      setPlayer2Score(0);
      setCurrentPlayer(1);
      setQueenCoverPending(null);
      setMatchWinner(null);
      setFoulOccurred(null);
      setShotCount(0);
      setGameTimeSeconds(0);
      setIsGameRunning(false);
      setComboCount(0);
      setMatchStatusText(
        `New ${activeF.toUpperCase()} Match Started. Player 1 (Bottom Baseline) Aim & Strike!`
      );

      initBoardPieces(activeL);
      resetStrikerToBaseline(1);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    },
    [carromFormat, pieceLayout, initBoardPieces]
  );

  // Timer Tick
  useEffect(() => {
    if (isGameRunning && !matchWinner) {
      timerIntervalRef.current = setInterval(() => {
        setGameTimeSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isGameRunning, matchWinner]);

  // Initial Load
  useEffect(() => {
    resetMatch();
  }, [resetMatch]);

  // AI Opponent Shot Generation
  const executeAIShot = useCallback(() => {
    if (matchWinner || currentPlayer !== 2 || opponentType !== 'ai') return;

    setMatchStatusText('🤖 AI is calculating angle, bank shot and power...');

    setTimeout(() => {
      const activePieces = piecesRef.current.filter((p) => p.active);
      if (activePieces.length === 0) return;

      // Target selection: priority to Queen or White/Black pieces based on mode
      let targetPiece = activePieces[0];
      if (carromFormat === 'classic') {
        const blackPieces = activePieces.filter((p) => p.type === 'black');
        const queen = activePieces.find((p) => p.type === 'queen');
        if (queenCoverPending === 2 && blackPieces.length > 0) {
          targetPiece = blackPieces[0];
        } else if (queen) {
          targetPiece = queen;
        } else if (blackPieces.length > 0) {
          targetPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        }
      } else {
        // Freestyle / Speed: pick closest piece with clear angle to pocket
        targetPiece = activePieces[Math.floor(Math.random() * activePieces.length)];
      }

      // Best baseline position for AI (Top baseline)
      const aiX = Math.max(
        BASELINE_MIN_X + 20,
        Math.min(BASELINE_MAX_X - 20, targetPiece.x + (Math.random() * 40 - 20))
      );
      strikerRef.current.x = aiX;
      strikerRef.current.y = BASELINE_Y_P2;

      // Calculate Angle from Striker to Target Piece
      const dx = targetPiece.x - strikerRef.current.x;
      const dy = targetPiece.y - strikerRef.current.y;
      let angle = Math.atan2(dy, dx);

      // Add a slight realistic human jitter based on difficulty
      angle += (Math.random() - 0.5) * 0.08;
      const power = 50 + Math.random() * 40;

      // Execute AI Strike
      const speed = (power / 100) * 16;
      strikerRef.current.vx = Math.cos(angle) * speed;
      strikerRef.current.vy = Math.sin(angle) * speed;
      strikerRef.current.active = false;
      isSimulatingRef.current = true;
      piecePocketedThisShotRef.current = [];

      setIsGameRunning(true);
      setShotCount((c) => c + 1);
      playCarromSound('strike');
      setMatchStatusText('🤖 AI released striker!');
    }, 900);
  }, [carromFormat, currentPlayer, matchWinner, opponentType, queenCoverPending]);

  // Trigger AI if it's Player 2's turn
  useEffect(() => {
    if (currentPlayer === 2 && opponentType === 'ai' && !matchWinner && strikerRef.current.active) {
      executeAIShot();
    }
  }, [currentPlayer, opponentType, matchWinner, executeAIShot]);

  // Fire Striker Shot from User Action
  const releaseStriker = (angle: number, power: number) => {
    if (!strikerRef.current.active || isSimulatingRef.current || matchWinner) return;

    const clampedPower = Math.max(15, Math.min(100, power));
    const speed = (clampedPower / 100) * 17; // Physics impulse scale

    strikerRef.current.vx = Math.cos(angle) * speed;
    strikerRef.current.vy = Math.sin(angle) * speed;
    strikerRef.current.active = false;
    strikerRef.current.isAiming = false;
    isSimulatingRef.current = true;
    piecePocketedThisShotRef.current = [];

    setIsGameRunning(true);
    setShotCount((s) => s + 1);
    playCarromSound('strike');
    setMatchStatusText(`Shot Released! Speed: ${Math.round(clampedPower)}%`);
  };

  // Check End of Turn Outcomes & Scoring
  const evaluateTurnEnd = useCallback(() => {
    const pocketedThisTurn = piecePocketedThisShotRef.current;
    let switchTurn = true;
    let earnedPoints = 0;

    // Check if striker pocketed (Foul)
    let foulMsg = '';
    const strikerY = strikerRef.current.y;
    const isStrikerInPocket = POCKETS.some(
      (pocket) => Math.hypot(strikerRef.current.x - pocket.x, strikerY - pocket.y) < POCKET_RADIUS + 4
    );

    if (isStrikerInPocket) {
      foulMsg = `⚠️ FOUL! Player ${currentPlayer} pocketed the Striker (-5 PTS Penalty)!`;
      setFoulOccurred(foulMsg);
      playCarromSound('foul');

      if (currentPlayer === 1) {
        setPlayer1Score((s) => Math.max(0, s - 5));
      } else {
        setPlayer2Score((s) => Math.max(0, s - 5));
      }

      // Return a previously pocketed piece back to the center circle if any
      const pocketedPieces = piecesRef.current.filter((p) => !p.active);
      if (pocketedPieces.length > 0) {
        const returned = pocketedPieces[pocketedPieces.length - 1];
        returned.active = true;
        returned.x = BOARD_SIZE / 2 + (Math.random() * 20 - 10);
        returned.y = BOARD_SIZE / 2 + (Math.random() * 20 - 10);
        returned.vx = 0;
        returned.vy = 0;
      }
    }

    // Process Carrom Men pocketed
    if (pocketedThisTurn.length > 0) {
      playCarromSound('pocket');
      setComboCount((c) => c + pocketedThisTurn.length);

      pocketedThisTurn.forEach((piece) => {
        if (carromFormat === 'classic') {
          if (piece.type === 'queen') {
            setQueenCoverPending(currentPlayer);
            earnedPoints += 25;
            setMatchStatusText(`👑 QUEEN POCKETED (+25 PTS)! Player ${currentPlayer} must cover with a carrom man!`);
          } else if (piece.type === 'white' && currentPlayer === 1) {
            earnedPoints += 10;
          } else if (piece.type === 'black' && currentPlayer === 2) {
            earnedPoints += 10;
          } else {
            earnedPoints += 5;
          }
        } else {
          // Freestyle & Disc Pool
          earnedPoints += piece.points;
        }
      });

      if (currentPlayer === 1) {
        setPlayer1Score((s) => s + earnedPoints);
      } else {
        setPlayer2Score((s) => s + earnedPoints);
      }

      // In Carrom: Pocketing your piece keeps your turn!
      switchTurn = false;
      setMatchStatusText(
        `🎯 Great Shot! Player ${currentPlayer} pocketed ${pocketedThisTurn.length} piece(s) (+${earnedPoints} PTS) & keeps turn!`
      );
    } else {
      setComboCount(0);
      if (queenCoverPending === currentPlayer) {
        // Failed to cover queen -> return queen to center
        const queen = piecesRef.current.find((p) => p.type === 'queen');
        if (queen) {
          queen.active = true;
          queen.x = BOARD_SIZE / 2;
          queen.y = BOARD_SIZE / 2;
          queen.vx = 0;
          queen.vy = 0;
          setQueenCoverPending(null);
          setMatchStatusText(`Queen not covered! Returned to center rosette.`);
        }
      }
    }

    // Check Win Conditions
    const remainingPieces = piecesRef.current.filter((p) => p.active);
    if (remainingPieces.length === 0) {
      // Board Cleared!
      const p1Final = player1Score + (currentPlayer === 1 ? earnedPoints : 0);
      const p2Final = player2Score + (currentPlayer === 2 ? earnedPoints : 0);

      let winnerId: 1 | 2 | 'draw' = 'draw';
      if (p1Final > p2Final) winnerId = 1;
      else if (p2Final > p1Final) winnerId = 2;

      setMatchWinner(winnerId);
      playCarromSound('win');
      const winReason = `Board Cleared! Final: Player 1 (${p1Final}) vs Player 2 (${p2Final})`;
      setMatchStatusText(`🏆 Match Finished! ${winnerId === 'draw' ? 'Draw Match!' : `Player ${winnerId} Wins!`}`);

      if (onGameEnd) {
        onGameEnd(winnerId === 1 ? 'w' : winnerId === 2 ? 'b' : 'draw', winReason);
      }
      return;
    }

    // Switch turns if needed
    const nextPlayer: 1 | 2 = switchTurn ? (currentPlayer === 1 ? 2 : 1) : currentPlayer;
    setCurrentPlayer(nextPlayer);
    resetStrikerToBaseline(nextPlayer);

    if (switchTurn) {
      const nextName = nextPlayer === 2 && opponentType === 'ai' ? '🤖 AI' : `Player ${nextPlayer}`;
      setMatchStatusText(`${nextName}'s Turn: Slide striker on baseline & aim.`);
    }
  }, [
    carromFormat,
    currentPlayer,
    onGameEnd,
    opponentType,
    player1Score,
    player2Score,
    queenCoverPending,
  ]);

  // Main 60FPS Physics Simulation & Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FRICTION = 0.984; // Smooth board glide friction
    const RESTITUTION = 0.92; // Elasticity of piece collisions
    const WALL_RESTITUTION = 0.88;
    const MIN_SPEED = 0.08;

    const gameLoop = () => {
      const striker = strikerRef.current;
      const pieces = piecesRef.current;

      // 1. UPDATE PHYSICS
      if (isSimulatingRef.current) {
        let anyMoving = false;

        // Update Striker
        if (!striker.active) {
          striker.x += striker.vx;
          striker.y += striker.vy;
          striker.vx *= FRICTION;
          striker.vy *= FRICTION;

          if (Math.hypot(striker.vx, striker.vy) > MIN_SPEED) {
            anyMoving = true;
          } else {
            striker.vx = 0;
            striker.vy = 0;
          }

          // Wall Rebounds for Striker
          const wallMin = 28;
          const wallMax = BOARD_SIZE - 28;
          if (striker.x < wallMin + striker.radius) {
            striker.x = wallMin + striker.radius;
            striker.vx = -striker.vx * WALL_RESTITUTION;
            playCarromSound('clack');
          } else if (striker.x > wallMax - striker.radius) {
            striker.x = wallMax - striker.radius;
            striker.vx = -striker.vx * WALL_RESTITUTION;
            playCarromSound('clack');
          }

          if (striker.y < wallMin + striker.radius) {
            striker.y = wallMin + striker.radius;
            striker.vy = -striker.vy * WALL_RESTITUTION;
            playCarromSound('clack');
          } else if (striker.y > wallMax - striker.radius) {
            striker.y = wallMax - striker.radius;
            striker.vy = -striker.vy * WALL_RESTITUTION;
            playCarromSound('clack');
          }

          // Check Striker Corner Pockets
          POCKETS.forEach((pocket) => {
            const dist = Math.hypot(striker.x - pocket.x, striker.y - pocket.y);
            if (dist < POCKET_RADIUS + 2) {
              striker.vx = 0;
              striker.vy = 0;
            }
          });
        }

        // Update Carrom Pieces
        pieces.forEach((p) => {
          if (!p.active) return;

          p.x += p.vx;
          p.y += p.vy;
          p.vx *= FRICTION;
          p.vy *= FRICTION;

          if (Math.hypot(p.vx, p.vy) > MIN_SPEED) {
            anyMoving = true;
          } else {
            p.vx = 0;
            p.vy = 0;
          }

          // Wall Rebounds
          const wallMin = 28;
          const wallMax = BOARD_SIZE - 28;
          if (p.x < wallMin + p.radius) {
            p.x = wallMin + p.radius;
            p.vx = -p.vx * WALL_RESTITUTION;
            playCarromSound('clack');
          } else if (p.x > wallMax - p.radius) {
            p.x = wallMax - p.radius;
            p.vx = -p.vx * WALL_RESTITUTION;
            playCarromSound('clack');
          }

          if (p.y < wallMin + p.radius) {
            p.y = wallMin + p.radius;
            p.vy = -p.vy * WALL_RESTITUTION;
            playCarromSound('clack');
          } else if (p.y > wallMax - p.radius) {
            p.y = wallMax - p.radius;
            p.vy = -p.vy * WALL_RESTITUTION;
            playCarromSound('clack');
          }

          // Pocket Hole Detection
          POCKETS.forEach((pocket) => {
            const dist = Math.hypot(p.x - pocket.x, p.y - pocket.y);
            if (dist < POCKET_RADIUS + 2 && p.active) {
              p.active = false;
              p.vx = 0;
              p.vy = 0;
              piecePocketedThisShotRef.current.push(p);
            }
          });
        });

        // Striker vs Piece Collisions
        if (!striker.active) {
          pieces.forEach((p) => {
            if (!p.active) return;
            const dx = p.x - striker.x;
            const dy = p.y - striker.y;
            const dist = Math.hypot(dx, dy);
            const minDist = striker.radius + p.radius;

            if (dist < minDist && dist > 0) {
              // Overlap separation
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              striker.x -= nx * overlap * 0.5;
              striker.y -= ny * overlap * 0.5;
              p.x += nx * overlap * 0.5;
              p.y += ny * overlap * 0.5;

              // Elastic Momentum Exchange (Striker mass = 3, Piece mass = 1)
              const m1 = 2.8;
              const m2 = 1.0;
              const kx = striker.vx - p.vx;
              const ky = striker.vy - p.vy;
              const pVel = 2 * (nx * kx + ny * ky) / (m1 + m2);

              striker.vx -= pVel * m2 * nx * RESTITUTION;
              striker.vy -= pVel * m2 * ny * RESTITUTION;
              p.vx += pVel * m1 * nx * RESTITUTION;
              p.vy += pVel * m1 * ny * RESTITUTION;

              playCarromSound('clack');
            }
          });
        }

        // Piece vs Piece Collisions
        for (let i = 0; i < pieces.length; i++) {
          for (let j = i + 1; j < pieces.length; j++) {
            const p1 = pieces[i];
            const p2 = pieces[j];
            if (!p1.active || !p2.active) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p1.radius + p2.radius;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              p1.x -= nx * overlap * 0.5;
              p1.y -= ny * overlap * 0.5;
              p2.x += nx * overlap * 0.5;
              p2.y += ny * overlap * 0.5;

              const kx = p1.vx - p2.vx;
              const ky = p1.vy - p2.vy;
              const pVel = nx * kx + ny * ky;

              p1.vx -= pVel * nx * RESTITUTION;
              p1.vy -= pVel * ny * RESTITUTION;
              p2.vx += pVel * nx * RESTITUTION;
              p2.vy += pVel * ny * RESTITUTION;

              playCarromSound('clack');
            }
          }
        }

        // Check if all motion stopped -> End of Shot
        if (!anyMoving) {
          isSimulatingRef.current = false;
          evaluateTurnEnd();
        }
      }

      // 2. RENDER BOARD GRAPHICS
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // A. Outer Wooden Border & Bevels
      ctx.fillStyle = '#451a03'; // Rich dark walnut wood
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Inner Playing Board Bed
      const innerMargin = 26;
      const innerSize = BOARD_SIZE - innerMargin * 2;
      const gradient = ctx.createRadialGradient(
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        40,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2
      );
      gradient.addColorStop(0, '#fef08a'); // Warm polished beech wood center
      gradient.addColorStop(0.65, '#fde047');
      gradient.addColorStop(1, '#eab308'); // Amber edge shadow

      ctx.fillStyle = gradient;
      ctx.fillRect(innerMargin, innerMargin, innerSize, innerSize);

      // Inner Border Line
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(innerMargin + 2, innerMargin + 2, innerSize - 4, innerSize - 4);

      // B. Diagonal Foul Lines & Corner Arrows
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      POCKETS.forEach((pocket) => {
        ctx.beginPath();
        ctx.moveTo(BOARD_SIZE / 2, BOARD_SIZE / 2);
        ctx.lineTo(pocket.x, pocket.y);
        ctx.stroke();
      });

      // C. Center Rosette Circle & Queen Circle
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Decorative Center Ring
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Center Red Queen circle
      ctx.fillStyle = '#dc262625';
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.stroke();

      // D. Baseline Striking Bars (Top & Bottom)
      const drawBaseline = (y: number, playerLabel: string) => {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;

        // Dual baseline lines
        ctx.beginPath();
        ctx.moveTo(BASELINE_MIN_X, y - 8);
        ctx.lineTo(BASELINE_MAX_X, y - 8);
        ctx.moveTo(BASELINE_MIN_X, y + 8);
        ctx.lineTo(BASELINE_MAX_X, y + 8);
        ctx.stroke();

        // Baseline Circles on ends (Red filled circles)
        const drawBaseCircle = (bx: number) => {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.stroke();
        };
        drawBaseCircle(BASELINE_MIN_X);
        drawBaseCircle(BASELINE_MAX_X);
      };

      drawBaseline(BASELINE_Y_P1, 'Player 1');
      drawBaseline(BASELINE_Y_P2, 'Player 2');

      // E. 4 Corner Pockets with Dark Depth & Shadows
      POCKETS.forEach((pocket) => {
        // Deep hole
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Brass rim
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      });

      // F. Draw Active Carrom Pieces
      pieces.forEach((p) => {
        if (!p.active) return;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.type === 'white' ? '#d97706' : p.type === 'queen' ? '#fde047' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center piece indentation/ridge ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // G. Draw Striker
      if (striker.active || !isSimulatingRef.current) {
        ctx.save();
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 12;

        // Striker body (Cyan Ivory with Golden Ring)
        const strikerGrad = ctx.createRadialGradient(
          striker.x - 3,
          striker.y - 3,
          2,
          striker.x,
          striker.y,
          striker.radius
        );
        strikerGrad.addColorStop(0, '#e0f2fe');
        strikerGrad.addColorStop(0.7, '#38bdf8');
        strikerGrad.addColorStop(1, '#0284c7');

        ctx.fillStyle = strikerGrad;
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner Striker ring
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // H. Aiming Trajectory Guide Line & Pull-Back Force Indicator
        if (striker.isAiming || pointerDragRef.current.isPullingAim) {
          const aimAngle = striker.aimAngle;
          const power = striker.aimPower;
          const lineLength = 50 + (power / 100) * 110;

          const targetX = striker.x + Math.cos(aimAngle) * lineLength;
          const targetY = striker.y + Math.sin(aimAngle) * lineLength;

          // Dashed Aim Arrow
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Arrow head
          ctx.setLineDash([]);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Power Percentage Label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Power: ${Math.round(power)}%`, striker.x - 28, striker.y + 32);

          ctx.restore();
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [POCKETS, playCarromSound, evaluateTurnEnd]);

  // Pointer Interaction Handlers for Slider / Drag / Aim
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!strikerRef.current.active || isSimulatingRef.current || matchWinner) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;

    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const striker = strikerRef.current;
    const distToStriker = Math.hypot(px - striker.x, py - striker.y);

    // If tapped directly on striker -> start aiming pull
    if (distToStriker <= striker.radius + 15) {
      pointerDragRef.current.isPullingAim = true;
      pointerDragRef.current.startX = px;
      pointerDragRef.current.startY = py;
      pointerDragRef.current.currentX = px;
      pointerDragRef.current.currentY = py;
      striker.isAiming = true;
    } else if (Math.abs(py - striker.baseY) < 30 && px >= BASELINE_MIN_X - 15 && px <= BASELINE_MAX_X + 15) {
      // Tapped baseline -> position striker horizontally
      striker.x = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, px));
      pointerDragRef.current.isDraggingPosition = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;

    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    if (pointerDragRef.current.isDraggingPosition) {
      strikerRef.current.x = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, px));
    } else if (pointerDragRef.current.isPullingAim) {
      pointerDragRef.current.currentX = px;
      pointerDragRef.current.currentY = py;

      // Calculate direction from drag pull
      const dx = pointerDragRef.current.startX - px;
      const dy = pointerDragRef.current.startY - py;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 5) {
        strikerRef.current.aimAngle = Math.atan2(dy, dx);
        strikerRef.current.aimPower = Math.min(100, Math.max(20, pullDist * 1.2));
      }
    }
  };

  const handlePointerUp = () => {
    if (pointerDragRef.current.isPullingAim) {
      const pullDist = Math.hypot(
        pointerDragRef.current.startX - pointerDragRef.current.currentX,
        pointerDragRef.current.startY - pointerDragRef.current.currentY
      );

      if (pullDist > 12) {
        releaseStriker(strikerRef.current.aimAngle, strikerRef.current.aimPower);
      }
    }

    pointerDragRef.current.isPullingAim = false;
    pointerDragRef.current.isDraggingPosition = false;
    strikerRef.current.isAiming = false;
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 text-white">
      {/* Top Banner & Mode Switches */}
      <div className="w-full max-w-[580px] bg-[#121626]/90 border border-amber-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl shadow-md">
              🥏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-amber-300">Carrom Board Arena</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                  {carromFormat.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">Multi-Format Physics Simulation &amp; Striker Arena</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundActive(!soundActive)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-400 text-amber-300 transition"
              title={soundActive ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-400 text-amber-300 transition"
              title="Rules & Controls"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => resetMatch()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-black flex items-center gap-1 hover:bg-amber-500/30 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Format, Opponent & Layout Selector Chips */}
        <div className="grid grid-cols-3 gap-2">
          {/* Format Select */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Format</span>
            <select
              value={carromFormat}
              onChange={(e) => {
                const newF = e.target.value as CarromGameMode;
                setCarromFormat(newF);
                resetMatch(undefined, newF);
              }}
              className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="classic">Classic (Points &amp; Queen)</option>
              <option value="freestyle">Freestyle (Max Score)</option>
              <option value="discpool">Disc Pool (Speed Run)</option>
            </select>
          </div>

          {/* Opponent Mode */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Opponent</span>
            <select
              value={opponentType}
              onChange={(e) => {
                const opp = e.target.value as CarromOpponent;
                setOpponentType(opp);
                resetMatch();
              }}
              className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ai">🤖 vs Computer AI</option>
              <option value="local">👥 2-Player Pass &amp; Play</option>
              <option value="solo">🎯 Solo Practice</option>
            </select>
          </div>

          {/* Piece Layout */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Pieces</span>
            <select
              value={pieceLayout}
              onChange={(e) => {
                const lay = e.target.value as CarromPieceLayout;
                setPieceLayout(lay);
                resetMatch(lay, undefined);
              }}
              className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="tournament">Tournament (19 Pcs)</option>
              <option value="compact">Quick Match (7 Pcs)</option>
            </select>
          </div>
        </div>

        {/* Live Match Scoreboard & Turn Display */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Player 1 Card */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              currentPlayer === 1 && !matchWinner
                ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-xs font-black text-slate-200">Player 1 (White)</span>
              </div>
              {currentPlayer === 1 && !matchWinner && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 animate-pulse">
                  TURN
                </span>
              )}
            </div>
            <div className="text-xl font-black text-amber-300 mt-1">{player1Score} PTS</div>
          </div>

          {/* Player 2 / AI Card */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              currentPlayer === 2 && !matchWinner
                ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/60 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {opponentType === 'ai' ? (
                  <Bot className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-cyan-300" />
                )}
                <span className="text-xs font-black text-slate-200">
                  {opponentType === 'ai' ? 'Computer (Black)' : 'Player 2 (Black)'}
                </span>
              </div>
              {currentPlayer === 2 && !matchWinner && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 animate-pulse">
                  TURN
                </span>
              )}
            </div>
            <div className="text-xl font-black text-cyan-300 mt-1">{player2Score} PTS</div>
          </div>
        </div>

        {/* Live Announcement Toast */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm">📢</span>
            <span className="text-slate-200 font-medium truncate">{matchStatusText}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-mono">
            <Clock className="w-3 h-3" />
            <span>{Math.floor(gameTimeSeconds / 60)}:{(gameTimeSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Carrom Board Container */}
      <div className="relative w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border-4 border-[#78350f] bg-[#451a03]">
        <canvas
          ref={canvasRef}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none select-none block"
        />

        {/* Floating Combo & Queen Alerts */}
        <AnimatePresence>
          {comboCount > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1 pointer-events-none"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>COMBO STREAK x{comboCount}!</span>
            </motion.div>
          )}

          {queenCoverPending && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-red-600/90 border border-amber-300 text-white font-black text-xs shadow-lg flex items-center gap-1.5 pointer-events-none"
            >
              <span>👑 Queen Cover Pending for Player {queenCoverPending}!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Baseline Slider & Power Controls Bar */}
      <div className="w-full max-w-[500px] bg-[#121626]/90 border border-amber-500/30 rounded-3xl p-4 flex flex-col gap-3 shadow-xl">
        {/* Horizontal Slider for Striker Positioning */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Baseline Striker Position:</span>
            </span>
            <span className="text-amber-300 font-mono">
              {Math.round(((strikerRef.current.x - BASELINE_MIN_X) / (BASELINE_MAX_X - BASELINE_MIN_X)) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={BASELINE_MIN_X}
            max={BASELINE_MAX_X}
            value={strikerRef.current.x}
            disabled={!strikerRef.current.active || isSimulatingRef.current || matchWinner !== null}
            onChange={(e) => {
              strikerRef.current.x = parseFloat(e.target.value);
            }}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Quick Power Strike Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400">Quick Strike:</span>
          <div className="flex items-center gap-1.5">
            {[35, 60, 85, 100].map((pwr) => (
              <button
                key={pwr}
                disabled={!strikerRef.current.active || isSimulatingRef.current || matchWinner !== null}
                onClick={() => releaseStriker(strikerRef.current.aimAngle, pwr)}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-white/10 text-xs font-bold text-slate-200 transition disabled:opacity-50 active:scale-95"
              >
                {pwr}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules & Controls Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#11131e] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥏</span>
                <h3 className="text-base font-black text-amber-300">Carrom Arena Guide</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                🎯 Striker Controls &amp; Shooting
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• <strong>Position Striker:</strong> Drag slider or touch baseline to place striker.</li>
                <li>• <strong>Aim &amp; Power:</strong> Pull back on striker to create aim line and build power meter.</li>
                <li>• <strong>Release:</strong> Release touch or click Quick Strike buttons to propel striker.</li>
              </ul>

              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                🏆 Scoring &amp; Queen Rules
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• <strong>White Carrom Men:</strong> 10 Points</li>
                <li>• <strong>Black Carrom Men:</strong> 5 Points</li>
                <li>• <strong>Red Queen:</strong> 25 Points (Must pocket a carrom piece to cover Queen).</li>
                <li>• <strong>Foul Penalty:</strong> Pocketing striker costs 5 points and returns piece to center.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
