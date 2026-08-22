import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
  BookOpen,
  Copy,
  Check,
  Code,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { BotAISettingsBar } from './BotAISettingsBar';

export type CarromGameMode = 'classic' | 'points' | 'freestyle';
export type CarromOpponent = 'ai' | 'local' | 'solo';
export type CarromPieceLayout = 'tournament' | 'standard';

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
  sinkProgress?: number;
}

interface CollisionFlash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
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
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [pieceLayout, setPieceLayout] = useState<CarromPieceLayout>('tournament');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [vfxEnabled, setVfxEnabled] = useState<boolean>(true);
  const [quickPowerSelected, setQuickPowerSelected] = useState<number>(85);
  const [strikerPercent, setStrikerPercent] = useState<number>(85);

  // Match State
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [queenCoverPending, setQueenCoverPending] = useState<1 | 2 | null>(null);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [matchStatusText, setMatchStatusText] = useState<string>(
    'Player 1 Turn: Slide striker on baseline, pull back to aim & strike!'
  );
  const [gameTimeSeconds, setGameTimeSeconds] = useState<number>(0);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [comboCount, setComboCount] = useState<number>(0);
  const [fxHubPulse, setFxHubPulse] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const copyStandaloneCode = () => {
    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real Carrom Arena - Final Striker & Collision Fix</title>
  <style>
    :root {
      --bg-dark: #0b0f19;
      --panel-bg: #131c2e;
      --accent-gold: #f59e0b;
      --accent-blue: #3b82f6;
      --text-main: #f8fafc;
      --border-color: #1e293b;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .panel-bg, .config-toolbar {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      padding: 16px;
      margin-bottom: 16px;
      width: 100%;
      max-width: 480px;
    }

    .board-stage {
      background: #5c3a21; /* Rich dark mahogany wood frame */
      border: 14px solid #3d2312;
      border-radius: 16px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0,0,0,0.5);
      position: relative;
      width: 400px;
      height: 400px;
      margin: 0 auto;
    }

    canvas {
      background: radial-gradient(circle, #fce4b3 0%, #e6c589 70%, #d4aa65 100%);
      display: block;
      margin: 0 auto;
      border-radius: 4px;
      touch-action: none;
    }

    .score-board {
      display: flex;
      justify-content: space-between;
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 12px;
    }

    button {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    button:hover {
      border-color: var(--accent-gold);
    }

    .status-msg {
      text-align: center;
      color: var(--accent-gold);
      margin-top: 8px;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>

  <div class="panel-bg">
    <div class="score-board">
      <div>Player 1 (White): <span id="p1Score">0</span> PTS</div>
      <div>Computer (AI): <span id="p2Score">0</span> PTS</div>
    </div>
    <div id="gameStatus" class="status-msg">Drag striker on baseline, aim & release!</div>
  </div>

  <div class="board-stage">
    <canvas id="carromCanvas" width="400" height="400"></canvas>
  </div>

  <div class="config-toolbar" style="display: flex; justify-content: space-between; align-items: center;">
    <button onclick="resetGame()">Reset Board</button>
    <button onclick="toggleGameMode()">Mode: vs Computer</button>
  </div>

  <script>
    const canvas = document.getElementById('carromCanvas');
    const ctx = canvas.getContext('2d');

    let p1Score = 0;
    let p2Score = 0;
    let gameMode = 'vs-computer';
    let isAnimating = false;
    let collisionFlash = null;

    // Dragging & Aiming states
    let isDragging = false;
    let dragCurrentX = 0;
    let dragCurrentY = 0;

    const pockets = [
      { x: 30, y: 30, radius: 22 },
      { x: 370, y: 30, radius: 22 },
      { x: 30, y: 370, radius: 22 },
      { x: 370, y: 370, radius: 22 }
    ];

    let pieces = [
      { x: 200, y: 200, radius: 14, type: 'queen', color: '#dc2626', vx: 0, vy: 0 },
      { x: 190, y: 190, radius: 12, type: 'white', color: '#f8fafc', vx: 0, vy: 0 },
      { x: 210, y: 210, radius: 12, type: 'black', color: '#1e293b', vx: 0, vy: 0 },
      { x: 180, y: 210, radius: 12, type: 'white', color: '#f8fafc', vx: 0, vy: 0 },
      { x: 220, y: 190, radius: 12, type: 'black', color: '#1e293b', vx: 0, vy: 0 },
      // Professional Striker placed on bottom baseline
      { x: 200, y: 330, radius: 20, type: 'striker', color: '#e0e7ff', vx: 0, vy: 0 }
    ];

    // Pointer controls for smooth dragging along the bottom baseline
    canvas.addEventListener('pointerdown', (e) => {
      if (isAnimating) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let striker = pieces.find(p => p.type === 'striker');
      if (striker) {
        let dist = Math.hypot(mouseX - striker.x, mouseY - striker.y);
        if (dist < striker.radius + 15) {
          isDragging = true;
          dragCurrentX = mouseX;
          dragCurrentY = mouseY;
        }
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      dragCurrentX = e.clientX - rect.left;
      dragCurrentY = e.clientY - rect.top;

      let striker = pieces.find(p => p.type === 'striker');
      if (striker) {
        // Constrain striker strictly along the baseline bounds horizontally
        striker.x = Math.max(110, Math.min(290, dragCurrentX));
      }
    });

    canvas.addEventListener('pointerup', () => {
      if (!isDragging) return;
      isDragging = false;

      let striker = pieces.find(p => p.type === 'striker');
      if (striker) {
        // Pull-back vector calculation to push coins forward
        let dx = striker.x - dragCurrentX;
        let dy = striker.y - dragCurrentY;
        let powerMultiplier = 0.28;

        striker.vx = dx * powerMultiplier;
        striker.vy = dy * powerMultiplier;

        if (Math.abs(striker.vx) > 0.5 || Math.abs(striker.vy) > 0.5) {
          isAnimating = true;
          document.getElementById('gameStatus').innerText = "Shot executed!";
        }
      }
    });

    function drawBoard() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Pockets
      pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b18';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3d2312';
        ctx.stroke();
        ctx.closePath();
      });

      // Center Circle
      ctx.beginPath();
      ctx.arc(200, 200, 35, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4aa65';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();

      // Draw Baseline Guide & Aiming Line when dragging
      if (isDragging) {
        let striker = pieces.find(p => p.type === 'striker');
        if (striker) {
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(striker.x + (striker.x - dragCurrentX) * 2.5, striker.y + (striker.y - dragCurrentY) * 2.5);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.closePath();
        }
      }

      // Draw All Game Pieces & Authentic Carrom Striker Style
      pieces.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = p.type === 'striker' ? '#1e3a8a' : '#000000';
        ctx.stroke();
        ctx.closePath();

        // Render iconic double-ring aesthetic for the Carrom Striker
        if (p.type === 'striker') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
        }
      });

      // Collision Visual Spark Effect
      if (collisionFlash) {
        ctx.beginPath();
        ctx.arc(collisionFlash.x, collisionFlash.y, collisionFlash.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
        collisionFlash.radius += 4;
        if (collisionFlash.radius > 28) collisionFlash = null;
      }
    }

    function updatePhysics() {
      if (!isAnimating) return;

      let moving = false;

      // Friction & Motion Update
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Wall Bounces
        if (p.x - p.radius < 20) { p.x = 20 + p.radius; p.vx *= -1; triggerFlash(p.x, p.y); }
        if (p.x + p.radius > canvas.width - 20) { p.x = canvas.width - 20 - p.radius; p.vx *= -1; triggerFlash(p.x, p.y); }
        if (p.y - p.radius < 20) { p.y = 20 + p.radius; p.vy *= -1; triggerFlash(p.x, p.y); }
        if (p.y + p.radius > canvas.height - 20) { p.y = canvas.height - 20 - p.radius; p.vy *= -1; triggerFlash(p.x, p.y); }

        if (Math.abs(p.vx) > 0.15 || Math.abs(p.vy) > 0.15) {
          moving = true;
        } else {
          p.vx = 0;
          p.vy = 0;
        }
      });

      // Robust Elastic Piece-to-Piece Collisions (Striker pushing coins forward)
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          let p1 = pieces[i];
          let p2 = pieces[j];
          let dx = p2.x - p1.x;
          let dy = p2.y - p1.y;
          let dist = Math.hypot(dx, dy);
          let minDist = p1.radius + p2.radius;

          if (dist < minDist) {
            let overlap = minDist - dist;
            let nx = dx / dist;
            let ny = dy / dist;

            // Separate overlapping elements smoothly
            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            // Momentum transfer exchange
            let kx = p1.vx - p2.vx;
            let ky = p1.vy - p2.vy;
            let p = 2 * (nx * kx + ny * ky) / 2;

            p1.vx -= p * nx;
            p1.vy -= p * ny;
            p2.vx += p * nx;
            p2.vy += p * ny;

            triggerFlash((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          }
        }
      }

      checkPockets();

      // Motion Complete: Reset striker back to baseline (guarantees it never vanishes)
      if (!moving) {
        isAnimating = false;
        let striker = pieces.find(p => p.type === 'striker');
        if (!striker) {
          pieces.push({ x: 200, y: 330, radius: 20, type: 'striker', color: '#e0e7ff', vx: 0, vy: 0 });
        } else {
          striker.x = 200;
          striker.y = 330;
          striker.vx = 0;
          striker.vy = 0;
        }

        if (gameMode === 'vs-computer') {
          triggerAITurn();
        }
      }
    }

    function triggerFlash(x, y) {
      collisionFlash = { x, y, radius: 6 };
    }

    function checkPockets() {
      pieces.forEach((piece, index) => {
        if (piece.type === 'striker') return;
        pockets.forEach(pocket => {
          let dist = Math.hypot(piece.x - pocket.x, piece.y - pocket.y);
          if (dist < pocket.radius) {
            if (piece.type === 'queen') p1Score += 50;
            else if (piece.type === 'white') p1Score += 10;
            else if (piece.type === 'black') p2Score += 10;

            document.getElementById('p1Score').innerText = p1Score;
            document.getElementById('p2Score').innerText = p2Score;
            pieces.splice(index, 1);
          }
        });
      });
    }

    function triggerAITurn() {
      document.getElementById('gameStatus').innerText = "AI is thinking and aiming...";
      setTimeout(() => {
        const targetCoins = pieces.filter(p => p.type === 'black' || p.type === 'queen');
        const striker = pieces.find(p => p.type === 'striker');
        if (targetCoins.length === 0 || !striker) return;

        const target = targetCoins[0];
        striker.x = target.x + (Math.random() * 20 - 10);
        let angle = Math.atan2(target.y - striker.y, target.x - striker.x);

        striker.vx = Math.cos(angle) * 13;
        striker.vy = Math.sin(angle) * 13;
        isAnimating = true;
        document.getElementById('gameStatus').innerText = "AI shot fired! Your turn.";
      }, 800);
    }

    function toggleGameMode() {
      gameMode = gameMode === 'vs-computer' ? 'local' : 'vs-computer';
      document.getElementById('gameStatus').innerText = \`Mode: \${gameMode.toUpperCase()}\`;
    }

    function resetGame() {
      p1Score = 0;
      p2Score = 0;
      document.getElementById('p1Score').innerText = p1Score;
      document.getElementById('p2Score').innerText = p2Score;
      isAnimating = false;
      pieces = [
        { x: 200, y: 200, radius: 14, type: 'queen', color: '#dc2626', vx: 0, vy: 0 },
        { x: 190, y: 190, radius: 12, type: 'white', color: '#f8fafc', vx: 0, vy: 0 },
        { x: 210, y: 210, radius: 12, type: 'black', color: '#1e293b', vx: 0, vy: 0 },
        { x: 180, y: 210, radius: 12, type: 'white', color: '#f8fafc', vx: 0, vy: 0 },
        { x: 220, y: 190, radius: 12, type: 'black', color: '#1e293b', vx: 0, vy: 0 },
        { x: 200, y: 330, radius: 20, type: 'striker', color: '#e0e7ff', vx: 0, vy: 0 }
      ];
      document.getElementById('gameStatus').innerText = "Board reset successfully.";
    }

    function loop() {
      updatePhysics();
      drawBoard();
      requestAnimationFrame(loop);
    }

    loop();
  </script>
</body>
</html>`;
    navigator.clipboard.writeText(htmlCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  // Canvas Refs & Dimensions
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const BOARD_SIZE = 440; // Internal coordinate grid matching user template
  const POCKET_RADIUS = 24;
  const CORNER_OFFSET = 34;

  // Board Pockets
  const POCKETS = [
    { x: CORNER_OFFSET, y: CORNER_OFFSET },
    { x: BOARD_SIZE - CORNER_OFFSET, y: CORNER_OFFSET },
    { x: CORNER_OFFSET, y: BOARD_SIZE - CORNER_OFFSET },
    { x: BOARD_SIZE - CORNER_OFFSET, y: BOARD_SIZE - CORNER_OFFSET },
  ];

  // Baseline Boundaries
  const BASELINE_Y_P1 = 378;
  const BASELINE_Y_P2 = 62;
  const BASELINE_MIN_X = 75;
  const BASELINE_MAX_X = 365;

  // Live Physics State in Ref
  const strikerRef = useRef<StrikerState>({
    x: BASELINE_MIN_X + ((BASELINE_MAX_X - BASELINE_MIN_X) * 85) / 100,
    y: BASELINE_Y_P1,
    baseY: BASELINE_Y_P1,
    vx: 0,
    vy: 0,
    radius: 15,
    active: true,
    isAiming: false,
    aimAngle: -Math.PI / 2,
    aimPower: 85,
  });

  const piecesRef = useRef<CarromPiece[]>([]);
  const collisionFlashesRef = useRef<CollisionFlash[]>([]);
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

  const triggerCollisionFlash = (x: number, y: number, color = 'rgba(245, 158, 11, 0.9)') => {
    if (collisionFlashesRef.current.length > 12) {
      collisionFlashesRef.current.shift();
    }
    collisionFlashesRef.current.push({
      x,
      y,
      radius: 6,
      maxRadius: 28,
      alpha: 1,
      color,
    });
  };

  const animationFrameIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const piecePocketedThisShotRef = useRef<CarromPiece[]>([]);

  // Sound synthesis
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
      const pieceRadius = 11;
      let pieceId = 1;

      // Center Red Queen (25 points in Classic, 3 in Points, 50 in Freestyle)
      pieces.push({
        id: pieceId++,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: pieceRadius,
        color: '#dc2626',
        type: 'queen',
        points: carromFormat === 'classic' ? 25 : carromFormat === 'points' ? 3 : 50,
        active: true,
      });

      // Inner Ring of 6 Pieces (alternating White & Black)
      const innerDist = 24;
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
          color: isWhite ? '#fef3c7' : '#1e293b',
          type: isWhite ? 'white' : 'black',
          points: isWhite ? 10 : 5,
          active: true,
        });
      }

      // Outer Ring of 12 Pieces if Tournament Layout (19 pcs total)
      // If Standard Layout: 2 more pieces (9 pcs total)
      if (layout === 'tournament') {
        const outerDist = 48;
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
      } else {
        // Standard (9 pieces total: 1 Queen, 4 White, 4 Black)
        const outerDist = 46;
        for (let i = 0; i < 2; i++) {
          const angle = (i * Math.PI) + Math.PI / 4;
          const isWhite = i % 2 === 0;
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
    [carromFormat, pieceLayout]
  );

  // Position Striker on Baseline based on percentage (10 to 90%)
  const setStrikerByPercent = (pct: number, player: 1 | 2 = currentPlayer) => {
    const clampedPct = Math.max(10, Math.min(90, pct));
    setStrikerPercent(clampedPct);
    const targetX = BASELINE_MIN_X + ((BASELINE_MAX_X - BASELINE_MIN_X) * clampedPct) / 100;
    const baseY = player === 1 ? BASELINE_Y_P1 : BASELINE_Y_P2;
    const initialAim = player === 1 ? -Math.PI / 2 : Math.PI / 2;

    strikerRef.current.x = targetX;
    strikerRef.current.y = baseY;
    strikerRef.current.baseY = baseY;
    strikerRef.current.aimAngle = initialAim;
  };

  const resetStrikerToBaseline = (player: 1 | 2 = currentPlayer) => {
    const baseY = player === 1 ? BASELINE_Y_P1 : BASELINE_Y_P2;
    const initialAim = player === 1 ? -Math.PI / 2 : Math.PI / 2;
    const currentX = BASELINE_MIN_X + ((BASELINE_MAX_X - BASELINE_MIN_X) * strikerPercent) / 100;

    strikerRef.current = {
      x: currentX,
      y: baseY,
      baseY: baseY,
      vx: 0,
      vy: 0,
      radius: 15,
      active: true,
      isAiming: false,
      aimAngle: initialAim,
      aimPower: quickPowerSelected,
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

  // Fire Striker Shot from User or AI Action
  const releaseStriker = (angle: number, power: number) => {
    if (!strikerRef.current.active || isSimulatingRef.current || matchWinner) return;

    const clampedPower = Math.max(15, Math.min(100, power));
    const speed = (clampedPower / 100) * 16;

    strikerRef.current.vx = Math.cos(angle) * speed;
    strikerRef.current.vy = Math.sin(angle) * speed;
    strikerRef.current.active = false;
    strikerRef.current.isAiming = false;
    isSimulatingRef.current = true;
    piecePocketedThisShotRef.current = [];

    setIsGameRunning(true);
    playCarromSound('strike');
    setMatchStatusText(`Shot Released with ${Math.round(clampedPower)}% Power!`);
  };

  // AI Opponent Shot Generation (System Prompt Compliant)
  const executeAIShot = useCallback(() => {
    if (matchWinner || currentPlayer !== 2 || opponentType !== 'ai') return;

    setMatchStatusText('AI is thinking...');

    setTimeout(() => {
      if (currentPlayer !== 2 || opponentType !== 'ai') return;

      const activePieces = piecesRef.current.filter((p) => p.active);
      if (activePieces.length === 0) return;

      // 1. Target Priority: Scan board and prioritize Black coins or Queen
      const blackCoins = activePieces.filter((p) => p.type === 'black');
      const queen = activePieces.find((p) => p.type === 'queen');
      const whiteCoins = activePieces.filter((p) => p.type === 'white');

      let target: CarromPiece | null = null;

      if (queenCoverPending === 2 && blackCoins.length > 0) {
        // Must cover Queen with a black coin
        target = blackCoins[0];
      } else if (queen && (Math.random() > 0.3 || blackCoins.length === 0)) {
        // Prioritize Red Queen if favorable
        target = queen;
      } else if (blackCoins.length > 0) {
        // Prioritize Black coins
        // Sort by distance to any of the 4 pockets or easiest unobstructed line
        const sortedBlack = [...blackCoins].sort((a, b) => {
          const minDistA = Math.min(...POCKETS.map((pkt) => Math.hypot(a.x - pkt.x, a.y - pkt.y)));
          const minDistB = Math.min(...POCKETS.map((pkt) => Math.hypot(b.x - pkt.x, b.y - pkt.y)));
          return minDistA - minDistB;
        });
        target = sortedBlack[0];
      } else if (queen) {
        target = queen;
      } else if (whiteCoins.length > 0) {
        // Fallback only if no black or queen coins remain
        target = whiteCoins[0];
      } else {
        target = activePieces[0];
      }

      if (!target) return;

      // 2. Baseline Alignment with human-like randomized offset based on difficulty
      const offsetRange = aiDifficulty === 'easy' ? 36 : aiDifficulty === 'medium' ? 16 : 4;
      const idealX = Math.max(
        BASELINE_MIN_X,
        Math.min(BASELINE_MAX_X, target.x + (Math.random() * offsetRange - offsetRange / 2))
      );
      strikerRef.current.x = idealX;
      strikerRef.current.y = BASELINE_Y_P2;

      // 3. Aiming & Vector Math
      const dx = target.x - strikerRef.current.x;
      const dy = target.y - strikerRef.current.y;
      let angle = Math.atan2(dy, dx);

      // Angle variance based on difficulty
      const angleVariance = aiDifficulty === 'easy' ? 0.14 : aiDifficulty === 'medium' ? 0.04 : 0.008;
      angle += (Math.random() - 0.5) * angleVariance;

      // 4. Power Scaling (balanced velocity between 11 and 14)
      const speed = aiDifficulty === 'easy' ? (9 + Math.random() * 3) : (11 + Math.random() * 3);
      const powerEquivalent = (speed / 16) * 100;

      strikerRef.current.aimAngle = angle;
      strikerRef.current.aimPower = powerEquivalent;
      strikerRef.current.vx = Math.cos(angle) * speed;
      strikerRef.current.vy = Math.sin(angle) * speed;
      strikerRef.current.active = false;
      strikerRef.current.isAiming = false;
      isSimulatingRef.current = true;
      piecePocketedThisShotRef.current = [];

      setIsGameRunning(true);
      playCarromSound('strike');
      setMatchStatusText(`${aiDifficulty === 'easy' ? 'Easy Bot' : aiDifficulty === 'medium' ? 'Medium Bot' : 'Pro Bot'} shot fired! Your turn.`);
    }, 800);
  }, [aiDifficulty, currentPlayer, matchWinner, opponentType, queenCoverPending]);

  useEffect(() => {
    if (currentPlayer === 2 && opponentType === 'ai' && !matchWinner && strikerRef.current.active) {
      executeAIShot();
    }
  }, [currentPlayer, opponentType, matchWinner, executeAIShot]);

  // Check End of Turn Outcomes & Scoring
  const evaluateTurnEnd = useCallback(() => {
    const pocketedThisTurn = piecePocketedThisShotRef.current;
    let switchTurn = true;
    let earnedPoints = 0;

    // Check if striker pocketed (Foul)
    const strikerY = strikerRef.current.y;
    const isStrikerInPocket = POCKETS.some(
      (pocket) => Math.hypot(strikerRef.current.x - pocket.x, strikerY - pocket.y) < POCKET_RADIUS + 4
    );

    if (isStrikerInPocket) {
      playCarromSound('foul');
      if (currentPlayer === 1) {
        setPlayer1Score((s) => Math.max(0, s - 5));
      } else {
        setPlayer2Score((s) => Math.max(0, s - 5));
      }

      // Return a piece to center
      const pocketedPieces = piecesRef.current.filter((p) => !p.active);
      if (pocketedPieces.length > 0) {
        const returned = pocketedPieces[pocketedPieces.length - 1];
        returned.active = true;
        returned.x = BOARD_SIZE / 2 + (Math.random() * 16 - 8);
        returned.y = BOARD_SIZE / 2 + (Math.random() * 16 - 8);
        returned.vx = 0;
        returned.vy = 0;
      }
      setMatchStatusText(`⚠️ FOUL: Striker pocketed! -5 PTS penalty for Player ${currentPlayer}`);
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
            setMatchStatusText(`👑 QUEEN POCKETED (+25 PTS)! Player ${currentPlayer} must cover next turn.`);
          } else if (piece.type === 'white' && currentPlayer === 1) {
            earnedPoints += 10;
          } else if (piece.type === 'black' && currentPlayer === 2) {
            earnedPoints += 10;
          } else {
            earnedPoints += 5;
          }
        } else {
          earnedPoints += piece.points;
        }
      });

      if (currentPlayer === 1) {
        setPlayer1Score((s) => s + earnedPoints);
      } else {
        setPlayer2Score((s) => s + earnedPoints);
      }

      switchTurn = false;
      setMatchStatusText(
        `🎯 Great Shot! Player ${currentPlayer} pocketed ${pocketedThisTurn.length} piece(s) (+${earnedPoints} PTS) & keeps turn!`
      );
    } else {
      setComboCount(0);
      if (queenCoverPending === currentPlayer) {
        const queen = piecesRef.current.find((p) => p.type === 'queen');
        if (queen) {
          queen.active = true;
          queen.x = BOARD_SIZE / 2;
          queen.y = BOARD_SIZE / 2;
          queen.vx = 0;
          queen.vy = 0;
          setQueenCoverPending(null);
          setMatchStatusText(`Queen not covered! Returned to center circle.`);
        }
      }
    }

    // Check Win Conditions
    const remainingPieces = piecesRef.current.filter((p) => p.active);
    if (remainingPieces.length === 0) {
      const p1Final = player1Score + (currentPlayer === 1 ? earnedPoints : 0);
      const p2Final = player2Score + (currentPlayer === 2 ? earnedPoints : 0);

      let winnerId: 1 | 2 | 'draw' = 'draw';
      if (p1Final > p2Final) winnerId = 1;
      else if (p2Final > p1Final) winnerId = 2;

      setMatchWinner(winnerId);
      playCarromSound('win');
      const winReason = `Carrom Board Cleared! Final Score: Player 1 (${p1Final}) vs Player 2 (${p2Final})`;
      setMatchStatusText(`🏆 Match Over! ${winnerId === 'draw' ? 'Draw Match!' : `Player ${winnerId} Wins!`}`);

      if (onGameEnd) {
        onGameEnd(winnerId === 1 ? 'w' : winnerId === 2 ? 'b' : 'draw', winReason);
      }
      return;
    }

    const nextPlayer: 1 | 2 = switchTurn ? (currentPlayer === 1 ? 2 : 1) : currentPlayer;
    setCurrentPlayer(nextPlayer);
    resetStrikerToBaseline(nextPlayer);

    if (switchTurn) {
      const nextName = nextPlayer === 2 && opponentType === 'ai' ? '🤖 AI' : `Player ${nextPlayer}`;
      setMatchStatusText(`${nextName}'s Turn: Slide striker on baseline & pull back to aim.`);
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

    const FRICTION = 0.984;
    const RESTITUTION = 0.92;
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

          const wallMin = 24;
          const wallMax = BOARD_SIZE - 24;
          if (striker.x < wallMin + striker.radius) {
            striker.x = wallMin + striker.radius;
            striker.vx = -striker.vx * WALL_RESTITUTION;
            triggerCollisionFlash(striker.x, striker.y, '#38bdf8');
            playCarromSound('clack');
          } else if (striker.x > wallMax - striker.radius) {
            striker.x = wallMax - striker.radius;
            striker.vx = -striker.vx * WALL_RESTITUTION;
            triggerCollisionFlash(striker.x, striker.y, '#38bdf8');
            playCarromSound('clack');
          }

          if (striker.y < wallMin + striker.radius) {
            striker.y = wallMin + striker.radius;
            striker.vy = -striker.vy * WALL_RESTITUTION;
            triggerCollisionFlash(striker.x, striker.y, '#38bdf8');
            playCarromSound('clack');
          } else if (striker.y > wallMax - striker.radius) {
            striker.y = wallMax - striker.radius;
            striker.vy = -striker.vy * WALL_RESTITUTION;
            triggerCollisionFlash(striker.x, striker.y, '#38bdf8');
            playCarromSound('clack');
          }

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

          const wallMin = 24;
          const wallMax = BOARD_SIZE - 24;
          if (p.x < wallMin + p.radius) {
            p.x = wallMin + p.radius;
            p.vx = -p.vx * WALL_RESTITUTION;
            triggerCollisionFlash(p.x, p.y, p.color === '#dc2626' ? '#ef4444' : '#f59e0b');
            playCarromSound('clack');
          } else if (p.x > wallMax - p.radius) {
            p.x = wallMax - p.radius;
            p.vx = -p.vx * WALL_RESTITUTION;
            triggerCollisionFlash(p.x, p.y, p.color === '#dc2626' ? '#ef4444' : '#f59e0b');
            playCarromSound('clack');
          }

          if (p.y < wallMin + p.radius) {
            p.y = wallMin + p.radius;
            p.vy = -p.vy * WALL_RESTITUTION;
            triggerCollisionFlash(p.x, p.y, p.color === '#dc2626' ? '#ef4444' : '#f59e0b');
            playCarromSound('clack');
          } else if (p.y > wallMax - p.radius) {
            p.y = wallMax - p.radius;
            p.vy = -p.vy * WALL_RESTITUTION;
            triggerCollisionFlash(p.x, p.y, p.color === '#dc2626' ? '#ef4444' : '#f59e0b');
            playCarromSound('clack');
          }

          POCKETS.forEach((pocket) => {
            const dist = Math.hypot(p.x - pocket.x, p.y - pocket.y);
            if (dist < POCKET_RADIUS + 2 && p.active) {
              p.active = false;
              p.vx = 0;
              p.vy = 0;
              triggerCollisionFlash(pocket.x, pocket.y, '#f59e0b');
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
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              striker.x -= nx * overlap * 0.5;
              striker.y -= ny * overlap * 0.5;
              p.x += nx * overlap * 0.5;
              p.y += ny * overlap * 0.5;

              const m1 = 2.8;
              const m2 = 1.0;
              const kx = striker.vx - p.vx;
              const ky = striker.vy - p.vy;
              const pVel = (2 * (nx * kx + ny * ky)) / (m1 + m2);

              striker.vx -= pVel * m2 * nx * RESTITUTION;
              striker.vy -= pVel * m2 * ny * RESTITUTION;
              p.vx += pVel * m1 * nx * RESTITUTION;
              p.vy += pVel * m1 * ny * RESTITUTION;

              triggerCollisionFlash((striker.x + p.x) / 2, (striker.y + p.y) / 2, '#38bdf8');
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

              triggerCollisionFlash((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, '#f59e0b');
              playCarromSound('clack');
            }
          }
        }

        if (!anyMoving) {
          isSimulatingRef.current = false;
          evaluateTurnEnd();
        }
      }

      // 2. RENDER BOARD GRAPHICS
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Inner Playing Board Bed with Radial Wood Finish
      const gradient = ctx.createRadialGradient(
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        10,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        BOARD_SIZE * 0.72
      );
      gradient.addColorStop(0, '#fce4b3');
      gradient.addColorStop(0.7, '#e6c589');
      gradient.addColorStop(1, '#d4aa65');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Inner border lines
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, BOARD_SIZE - 36, BOARD_SIZE - 36);

      // Diagonal lines to pockets
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.2;
      POCKETS.forEach((pocket) => {
        ctx.beginPath();
        ctx.moveTo(BOARD_SIZE / 2, BOARD_SIZE / 2);
        ctx.lineTo(pocket.x, pocket.y);
        ctx.stroke();
      });

      // Center Decorative Rosette
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Center Red Queen circle
      ctx.fillStyle = '#dc262622';
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.stroke();

      // Baseline Bars
      const drawBaseline = (y: number) => {
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(BASELINE_MIN_X, y - 6);
        ctx.lineTo(BASELINE_MAX_X, y - 6);
        ctx.moveTo(BASELINE_MIN_X, y + 6);
        ctx.lineTo(BASELINE_MAX_X, y + 6);
        ctx.stroke();

        const drawBaseCircle = (bx: number) => {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        };
        drawBaseCircle(BASELINE_MIN_X);
        drawBaseCircle(BASELINE_MAX_X);
      };

      drawBaseline(BASELINE_Y_P1);
      drawBaseline(BASELINE_Y_P2);

      // 4 Corner Pockets
      POCKETS.forEach((pocket) => {
        ctx.fillStyle = '#090b10';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Active Carrom Pieces
      pieces.forEach((p) => {
        if (!p.active) return;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1.5;
        ctx.shadowOffsetY = 1.5;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.type === 'white' ? '#d97706' : p.type === 'queen' ? '#fde047' : '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // Draw Collision Flashes & Shockwave Rings
      if (collisionFlashesRef.current.length > 0) {
        for (let i = collisionFlashesRef.current.length - 1; i >= 0; i--) {
          const flash = collisionFlashesRef.current[i];
          ctx.save();
          ctx.beginPath();
          ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
          ctx.strokeStyle = flash.color;
          ctx.globalAlpha = Math.max(0, flash.alpha);
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          flash.radius += 4;
          flash.alpha -= 0.12;

          if (flash.radius >= flash.maxRadius || flash.alpha <= 0) {
            collisionFlashesRef.current.splice(i, 1);
          }
        }
      }

      // Draw Striker
      if (striker.active || !isSimulatingRef.current) {
        ctx.save();
        if (vfxEnabled) {
          ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
          ctx.shadowBlur = 10;
        }

        // Striker Base
        ctx.fillStyle = '#e0e7ff';
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Authentic double-ring aesthetic
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Aiming Trajectory Guide Line & Power Indicator
        if (striker.isAiming || pointerDragRef.current.isPullingAim) {
          const aimAngle = striker.aimAngle;
          const power = striker.aimPower;
          const lineLength = 40 + (power / 100) * 140;

          const targetX = striker.x + Math.cos(aimAngle) * lineLength;
          const targetY = striker.y + Math.sin(aimAngle) * lineLength;

          ctx.save();
          // Trajectory Forward Line
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Target reticle / impact ring
          ctx.setLineDash([]);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Pull-back indicator line
          if (pointerDragRef.current.isPullingAim) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(striker.x, striker.y);
            ctx.lineTo(pointerDragRef.current.currentX, pointerDragRef.current.currentY);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(pointerDragRef.current.currentX, pointerDragRef.current.currentY, 4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Power readout badge
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(striker.x - 36, striker.y + 20, 72, 18, 6) : ctx.rect(striker.x - 36, striker.y + 20, 72, 18);
          ctx.fill();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ ${Math.round(power)}%`, striker.x, striker.y + 33);

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
  }, [POCKETS, playCarromSound, evaluateTurnEnd, vfxEnabled]);

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

    if (distToStriker <= striker.radius + 15) {
      pointerDragRef.current.isPullingAim = true;
      pointerDragRef.current.startX = px;
      pointerDragRef.current.startY = py;
      pointerDragRef.current.currentX = px;
      pointerDragRef.current.currentY = py;
      striker.isAiming = true;
    } else if (Math.abs(py - striker.baseY) < 30 && px >= BASELINE_MIN_X - 15 && px <= BASELINE_MAX_X + 15) {
      const clampedX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, px));
      striker.x = clampedX;
      const pct = Math.round(((clampedX - BASELINE_MIN_X) / (BASELINE_MAX_X - BASELINE_MIN_X)) * 100);
      setStrikerPercent(pct);
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
      const clampedX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, px));
      strikerRef.current.x = clampedX;
      const pct = Math.round(((clampedX - BASELINE_MIN_X) / (BASELINE_MAX_X - BASELINE_MIN_X)) * 100);
      setStrikerPercent(pct);
    } else if (pointerDragRef.current.isPullingAim) {
      pointerDragRef.current.currentX = px;
      pointerDragRef.current.currentY = py;

      const dx = pointerDragRef.current.startX - px;
      const dy = pointerDragRef.current.startY - py;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 5) {
        strikerRef.current.aimAngle = Math.atan2(dy, dx);
        const calcPwr = Math.min(100, Math.max(20, pullDist * 1.3));
        strikerRef.current.aimPower = calcPwr;
        setQuickPowerSelected(Math.round(calcPwr));
      }
    }
  };

  const handlePointerUp = () => {
    if (pointerDragRef.current.isPullingAim) {
      const pullDist = Math.hypot(
        pointerDragRef.current.startX - pointerDragRef.current.currentX,
        pointerDragRef.current.startY - pointerDragRef.current.currentY
      );

      if (pullDist > 10) {
        releaseStriker(strikerRef.current.aimAngle, strikerRef.current.aimPower);
      }
    }

    pointerDragRef.current.isPullingAim = false;
    pointerDragRef.current.isDraggingPosition = false;
    strikerRef.current.isAiming = false;
  };

  const handleQuickPowerClick = (pwr: number) => {
    setQuickPowerSelected(pwr);
    strikerRef.current.aimPower = pwr;
    if (strikerRef.current.active && !isSimulatingRef.current && !matchWinner) {
      releaseStriker(strikerRef.current.aimAngle, pwr);
    }
  };

  const handle96FxHubTrigger = () => {
    setFxHubPulse(true);
    soundFx.playGameOver(true);
    setTimeout(() => setFxHubPulse(false), 1200);
  };

  return (
    <div className="w-full flex justify-center p-2 sm:p-4 text-white font-sans">
      <div className="w-full max-w-[520px] bg-[#111522] border border-[#242f4c] rounded-[20px] shadow-[0_25px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col box-border">
        {/* Arena Header */}
        <div className="bg-[#0d111b] px-4 sm:px-5 py-4 flex justify-between items-center border-b border-[#242f4c]">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] bg-gradient-to-br from-[#3498db] to-[#f1c40f] rounded-[10px] flex items-center justify-center text-lg shadow-[0_4px_10px_rgba(52,152,219,0.3)]">
              🎯
            </div>
            <div>
              <h2 className="m-0 text-base font-bold text-white flex items-center gap-2">
                Carrom Board Arena{' '}
                <span className="text-[9px] bg-[#22304a] text-[#f1c40f] px-1.5 py-0.5 rounded uppercase border border-[#34495e] font-semibold">
                  {carromFormat}
                </span>
              </h2>
              <p className="m-0 text-[11px] text-[#8c92a4]">Multi-Format Physics Simulation &amp; Striker Arena</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSoundActive(!soundActive)}
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] hover:bg-[#222d4a] text-white w-[34px] h-[34px] rounded-[8px] flex items-center justify-center cursor-pointer transition text-sm"
              title={soundActive ? 'Toggle Sound (Mute)' : 'Toggle Sound (Unmute)'}
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-[#3498db]" /> : <VolumeX className="w-4 h-4 text-[#8c92a4]" />}
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] hover:bg-[#222d4a] text-white w-[34px] h-[34px] rounded-[8px] flex items-center justify-center cursor-pointer transition text-sm"
              title="Help & Info"
            >
              <HelpCircle className="w-4 h-4 text-[#f1c40f]" />
            </button>
            <button
              onClick={() => resetMatch()}
              id="resetMatchBtn"
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] hover:bg-[#222d4a] text-white w-[34px] h-[34px] rounded-[8px] flex items-center justify-center cursor-pointer transition text-sm"
              title="Reset Arena"
            >
              <RotateCcw className="w-4 h-4 text-[#2ecc71]" />
            </button>
          </div>
        </div>

        {/* Config Toolbar */}
        <div className="px-4 sm:px-5 py-3.5 grid grid-cols-3 gap-2 bg-[#111522] border-b border-[#242f4c]">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-[#8c92a4] font-bold tracking-wide">Format</label>
            <select
              value={carromFormat}
              onChange={(e) => {
                const newF = e.target.value as CarromGameMode;
                setCarromFormat(newF);
                resetMatch(undefined, newF);
              }}
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] text-white px-2 py-1.5 rounded-[6px] text-[11px] outline-none cursor-pointer w-full box-border"
            >
              <option value="classic">Classic (Points &amp; Queen)</option>
              <option value="points">Points Carrom</option>
              <option value="freestyle">Freestyle</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-[#8c92a4] font-bold tracking-wide">Opponent</label>
            <select
              value={opponentType}
              onChange={(e) => {
                const opp = e.target.value as CarromOpponent;
                setOpponentType(opp);
                resetMatch();
              }}
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] text-white px-2 py-1.5 rounded-[6px] text-[11px] outline-none cursor-pointer w-full box-border"
            >
              <option value="ai">vs Computer AI</option>
              <option value="local">2 Player Local</option>
              <option value="solo">Practice Solo</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-[#8c92a4] font-bold tracking-wide">Pieces</label>
            <select
              value={pieceLayout}
              onChange={(e) => {
                const lay = e.target.value as CarromPieceLayout;
                setPieceLayout(lay);
                resetMatch(lay, undefined);
              }}
              className="bg-[#161c2d] border border-[#242f4c] hover:border-[#3498db] text-white px-2 py-1.5 rounded-[6px] text-[11px] outline-none cursor-pointer w-full box-border"
            >
              <option value="tournament">Tournament (19 Pcs)</option>
              <option value="standard">Standard (9 Pcs)</option>
            </select>
          </div>
        </div>

        {/* Scoreboard Panel */}
        <div className="px-4 sm:px-5 py-3.5 grid grid-cols-2 gap-3 bg-[#0f131d]">
          {/* P1 Score Card */}
          <div
            id="p1Card"
            className={`bg-[#161c2d] border rounded-[12px] p-3 flex flex-col relative transition-all duration-300 ${
              currentPlayer === 1 && !matchWinner
                ? 'bg-[#1d263f] border-[#3498db] shadow-[0_0_15px_rgba(52,152,219,0.15)]'
                : 'border-[#242f4c]'
            }`}
          >
            <div className="flex justify-between items-center text-[11px] text-[#8c92a4] mb-1">
              <span>👤 Player 1 (White)</span>
              {currentPlayer === 1 && !matchWinner && (
                <span className="text-[9px] bg-[#3498db] text-white px-1.5 py-0.5 rounded-[4px] font-bold">
                  TURN
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-white" id="p1Score">
              {player1Score} PTS
            </div>
          </div>

          {/* P2 / AI Score Card */}
          <div
            id="p2Card"
            className={`bg-[#161c2d] border rounded-[12px] p-3 flex flex-col relative transition-all duration-300 ${
              currentPlayer === 2 && !matchWinner
                ? 'bg-[#1d263f] border-[#3498db] shadow-[0_0_15px_rgba(52,152,219,0.15)]'
                : 'border-[#242f4c]'
            }`}
          >
            <div className="flex justify-between items-center text-[11px] text-[#8c92a4] mb-1">
              <span>{opponentType === 'ai' ? '🤖 Computer (Black)' : '👥 Player 2 (Black)'}</span>
              {currentPlayer === 2 && !matchWinner && (
                <span className="text-[9px] bg-[#3498db] text-white px-1.5 py-0.5 rounded-[4px] font-bold">
                  TURN
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-white" id="p2Score">
              {player2Score} PTS
            </div>
          </div>
        </div>

        {/* Ticker Bar */}
        <div className="bg-[#161c2d] mx-4 sm:mx-5 mb-3.5 px-3 py-2 rounded-[8px] border border-[#242f4c] flex justify-between items-center text-[11px] text-[#8c92a4]">
          <div className="flex items-center gap-1.5 text-white truncate max-w-[80%]">
            <span>{currentPlayer === 2 && opponentType === 'ai' ? '🤖' : '🎯'}</span>
            <span id="tickerMessage" className="truncate">{matchStatusText}</span>
          </div>
          <span id="tickerTime" className="font-mono font-medium text-[#f1c40f]">
            {Math.floor(gameTimeSeconds / 60)}:{(gameTimeSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Board Stage */}
        <div className="px-4 sm:px-5 pb-3.5 flex flex-col items-center relative">
          <div className="relative rounded-[16px] overflow-hidden bg-[#5c3a21] border-[12px] sm:border-[14px] border-[#3d2312] shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.5)]">
            <canvas
              id="carromCanvas"
              ref={canvasRef}
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="cursor-crosshair touch-none select-none block max-w-full h-auto aspect-square"
            />

            {/* Floating Combo Badge */}
            <AnimatePresence>
              {comboCount > 1 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f1c40f] to-[#e67e22] text-[#090b10] font-black text-xs shadow-lg flex items-center gap-1 pointer-events-none"
                >
                  <span>🔥 STREAK x{comboCount}!</span>
                </motion.div>
              )}

              {queenCoverPending && (
                <motion.div
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#e74c3c] border border-[#f1c40f] text-white font-bold text-[11px] shadow-lg flex items-center gap-1 pointer-events-none"
                >
                  <span>👑 Queen Cover Pending for Player {queenCoverPending}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="px-4 sm:px-5 pb-4 flex flex-col gap-3">
          {/* Uniform AI & Opponent Bar */}
          <BotAISettingsBar
            opponentType={opponentType === 'local' ? 'pvp' : opponentType}
            onOpponentTypeChange={(t) => {
              setOpponentType(t === 'pvp' ? 'local' : t);
              resetMatch();
            }}
            aiDifficulty={aiDifficulty}
            onAiDifficultyChange={(d) => setAiDifficulty(d)}
            statusMessage={matchStatusText}
            hasSoloMode={true}
            soloLabel="Solo"
          />

          {/* Slider Group */}
          <div className="bg-[#161c2d] border border-[#242f4c] rounded-[10px] p-3 sm:p-3.5 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-[#8c92a4]">
              <span>Baseline Striker Position:</span>
              <strong id="sliderValDisplay" className="text-[#f1c40f]">
                {strikerPercent}%
              </strong>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={strikerPercent}
              id="strikerSlider"
              disabled={!strikerRef.current.active || isSimulatingRef.current || matchWinner !== null}
              onChange={(e) => {
                setStrikerByPercent(parseInt(e.target.value, 10));
              }}
              className="w-full accent-[#3498db] cursor-pointer h-2 bg-[#111522] rounded-lg appearance-none"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {[35, 60, 85, 100].map((pwr) => (
                <button
                  key={pwr}
                  disabled={!strikerRef.current.active || isSimulatingRef.current || matchWinner !== null}
                  onClick={() => handleQuickPowerClick(pwr)}
                  className={`bg-[#111522] border border-[#242f4c] py-1.5 rounded-[6px] text-[10px] font-semibold cursor-pointer transition text-center disabled:opacity-40 active:scale-95 ${
                    quickPowerSelected === pwr
                      ? 'bg-[#222d4a] text-white border-[#3498db]'
                      : 'text-[#8c92a4] hover:bg-[#222d4a] hover:text-white hover:border-[#3498db]'
                  }`}
                >
                  {pwr}%
                </button>
              ))}
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="resetBoardBtn"
              onClick={() => resetMatch()}
              className="bg-gradient-to-br from-[#1b2438] to-[#131929] border border-[#242f4c] hover:border-[#3498db] text-white p-2.5 rounded-[8px] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition hover:from-[#24304d] hover:to-[#192238] active:scale-95"
            >
              <span>🔄</span> Reset Board
            </button>
            <button
              id="rulesBtn"
              onClick={() => setShowGuideModal(true)}
              className="bg-gradient-to-br from-[#1b2438] to-[#131929] border border-[#242f4c] hover:border-[#3498db] text-white p-2.5 rounded-[8px] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition hover:from-[#24304d] hover:to-[#192238] active:scale-95"
            >
              <span>📖</span> Rules Guide
            </button>
            <button
              onClick={handle96FxHubTrigger}
              className={`bg-gradient-to-br from-[#1b2438] to-[#131929] border border-[#242f4c] hover:border-[#2ecc71] text-[#2ecc71] p-2.5 rounded-[8px] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-95 ${
                fxHubPulse ? 'ring-2 ring-[#2ecc71] shadow-[0_0_15px_rgba(46,204,113,0.4)]' : ''
              }`}
            >
              <span>✨</span> 96 FX Hub
            </button>
            <button
              onClick={() => setVfxEnabled(!vfxEnabled)}
              className={`bg-gradient-to-br from-[#1b2438] to-[#131929] border border-[#242f4c] hover:border-[#3498db] text-[#3498db] p-2.5 rounded-[8px] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-95 ${
                vfxEnabled ? 'border-[#3498db]/60 shadow-[0_0_10px_rgba(52,152,219,0.2)]' : 'opacity-70'
              }`}
            >
              <span>⚡</span> VFX Engine: {vfxEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Arena Footer */}
        <div className="bg-[#090b10] px-4 sm:px-5 py-3 border-t border-[#242f4c] flex justify-between text-[10px] text-[#8c92a4]">
          <span>Web Carrom Physics Module v2.5</span>
          <span className="text-[#2ecc71]">Active Frame Rate: 60 FPS</span>
        </div>
      </div>

      {/* Rules Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#111522] border border-[#242f4c] rounded-[16px] p-5 shadow-2xl text-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#242f4c] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-base font-bold text-[#f1c40f]">Carrom Board Rules &amp; Controls</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-2.5 py-1 rounded-[6px] bg-[#161c2d] hover:bg-[#222d4a] text-xs font-bold border border-[#242f4c]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8c92a4] leading-relaxed max-h-[60vh] overflow-y-auto">
              <div className="p-2.5 bg-[#161c2d] border border-[#242f4c] rounded-[8px] text-[#f1c40f] font-semibold">
                🎯 Striker Placement &amp; Aiming
              </div>
              <ul className="space-y-1 pl-2 text-slate-200">
                <li>• <strong>Baseline Position:</strong> Adjust the slider from 10% to 90% or drag along the baseline.</li>
                <li>• <strong>Pull to Aim:</strong> Touch and pull backward on the striker to adjust shooting angle &amp; power.</li>
                <li>• <strong>Quick Strike:</strong> Tap any of the preset power buttons (35%, 60%, 85%, 100%) to instantly strike.</li>
              </ul>

              <div className="p-2.5 bg-[#161c2d] border border-[#242f4c] rounded-[8px] text-[#f1c40f] font-semibold">
                🏆 Scoring &amp; Formats
              </div>
              <ul className="space-y-1 pl-2 text-slate-200">
                <li>• <strong>White Carrom Men:</strong> 10 Points</li>
                <li>• <strong>Black Carrom Men:</strong> 5 Points</li>
                <li>• <strong>Red Queen:</strong> 25 Points (Requires pocketing a cover piece on your next turn).</li>
                <li>• <strong>Striker Foul:</strong> -5 Points penalty and returns a pocketed piece to the center rosette.</li>
              </ul>

              <div className="pt-2 border-t border-[#242f4c]">
                <button
                  onClick={copyStandaloneCode}
                  className="w-full bg-[#1b2438] hover:bg-[#24304d] border border-[#3498db] text-[#3498db] hover:text-white py-2 px-3 rounded-[8px] font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-4 h-4 text-[#2ecc71]" />
                      <span className="text-[#2ecc71]">Copied Standalone HTML Snippet!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Standalone Carrom HTML Snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
