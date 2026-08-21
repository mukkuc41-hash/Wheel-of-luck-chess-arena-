import React, { useEffect, useRef, useState } from 'react';
import { X, Play, RotateCcw, ArrowLeft, Gamepad2, Sparkles, Trophy, Flame, Layers, Maximize2, Shield, CircleDot } from 'lucide-react';
import { ActiveBoardGame } from '../types';

interface ArcadeCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFullGame?: (game: ActiveBoardGame) => void;
  initialGame?: string;
}

interface GameState {
  // Darts
  score?: number;
  dartsThrown?: number;
  lastScore?: number;
  message?: string;
  // Ping Pong
  pScore?: number;
  bScore?: number;
  bx?: number;
  by?: number;
  bvx?: number;
  bvy?: number;
  py?: number;
  // Pool (8-Ball and 9-Ball)
  ball?: { x: number; y: number; radius: number; vx?: number; vy?: number };
  objects?: Array<{ number: number; x: number; y: number; radius: number; color: string; isStripe?: boolean; active: boolean; vx?: number; vy?: number }>;
  // Chess
  turn?: number;
  // Checkers
  selected?: { r: number; c: number } | null;
  pieces?: Array<{ r: number; c: number; p: number }>;
  // Backgammon
  p1Score?: number;
  p2Score?: number;
  dice?: number | [number, number];
  // Snakes
  p1?: number;
  p2?: number;
  // Ludo
  p1Pos?: number;
  p2Pos?: number;
  // Gomoku
  board?: number[][];
  winner?: number;
  // Connect 4
  // Ultimate TTT
  boards?: number[][];
  master?: number[];
  // Dots
  hLines?: number[][];
  vLines?: number[][];
  boxes?: number[][];
  // Battleship
  p1Grid?: number[][];
  shots?: number[][];
  // Sim
  edges?: Array<{ u: number; v: number; p: number }>;
  // Uno
  topCard?: { color: string; val: string };
  hand?: string[];
  // Hearts
  trickCards?: string[];
  // Gin Rummy
  melds?: string[];
  // Speed
  pile1?: string;
  pile2?: string;
}

interface ArcadeGameCategory {
  title: string;
  countLabel: string;
  games: ArcadeGameItem[];
}

interface ArcadeGameItem {
  id: string;
  title: string;
  icon: string;
  scoreBadge: string;
  desc: string;
  targetGame: ActiveBoardGame;
  fullWidth?: boolean;
}

const ARCADE_CATEGORIES: ArcadeGameCategory[] = [
  {
    title: 'Sports & Precision Additions',
    countLabel: '2 Games',
    games: [
      {
        id: 'darts',
        title: 'Darts Championship',
        icon: '🎯',
        scoreBadge: 'AIM',
        desc: 'Precision target aiming & scoring rings.',
        targetGame: 'darts',
      },
      {
        id: 'pingpong',
        title: 'Ping Pong Classic',
        icon: '🏓',
        scoreBadge: 'ARCADE',
        desc: 'Fast-paced paddle rally table tennis.',
        targetGame: 'pingpong',
      },
    ],
  },
  {
    title: 'Board & Dice Classics',
    countLabel: '5 Games',
    games: [
      {
        id: 'chess',
        title: 'Master Chess',
        icon: '♟️',
        scoreBadge: 'CLASSIC',
        desc: 'Check & checkmate rules.',
        targetGame: 'chess',
      },
      {
        id: 'checkers',
        title: 'Draughts / Checkers',
        icon: '⚪',
        scoreBadge: 'TACTIC',
        desc: 'Jumps & king promotion.',
        targetGame: 'checkers',
      },
      {
        id: 'backgammon',
        title: 'Royal Backgammon',
        icon: '⚄',
        scoreBadge: 'ROYAL',
        desc: 'Dice rolls & bearing off.',
        targetGame: 'backgammon',
      },
      {
        id: 'snakes',
        title: 'Snakes & Ladders',
        icon: '🐍',
        scoreBadge: 'DICE',
        desc: 'Climb ladders, avoid snakes.',
        targetGame: 'snakes',
      },
      {
        id: 'ludo',
        title: 'Ludo Super Star',
        icon: '🎲',
        scoreBadge: 'RACE',
        desc: 'Token home run race.',
        targetGame: 'ludo',
        fullWidth: true,
      },
    ],
  },
  {
    title: 'Classic Grid & Alignment',
    countLabel: '4 Games',
    games: [
      {
        id: 'gomoku',
        title: 'Gomoku (5 in a Row)',
        icon: '⚫',
        scoreBadge: 'GRID',
        desc: '15x15 intersection alignment.',
        targetGame: 'gomoku',
      },
      {
        id: 'reversi',
        title: 'Grand Reversi',
        icon: '🔵',
        scoreBadge: 'FLIP',
        desc: '8x8 disc flipping strategy.',
        targetGame: 'reversi',
      },
      {
        id: 'connect4',
        title: 'Connect Four',
        icon: '🔴',
        scoreBadge: 'DROP',
        desc: 'Vertical gravity drop grid.',
        targetGame: 'connect4',
      },
      {
        id: 'ultimatetictactoe',
        title: 'Ultimate Tic-Tac-Toe',
        icon: '❌',
        scoreBadge: 'NESTED',
        desc: '9 mini grids in a master board.',
        targetGame: 'ultimatetictactoe',
      },
    ],
  },
  {
    title: 'Pen, Paper & Strategy',
    countLabel: '3 Games',
    games: [
      {
        id: 'dots',
        title: 'Dots & Boxes',
        icon: '📦',
        scoreBadge: 'BOXES',
        desc: 'Line drawing territory capture.',
        targetGame: 'dotsandboxes',
      },
      {
        id: 'battleship',
        title: 'Battleship Fleet',
        icon: '🚢',
        scoreBadge: 'FLEET',
        desc: '10x10 radar combat strikes.',
        targetGame: 'battleship',
      },
      {
        id: 'sim',
        title: "Ramsey's Sim Game",
        icon: '🔺',
        scoreBadge: 'GRAPH',
        desc: 'Vertex edge-coloring puzzle.',
        targetGame: 'sim',
        fullWidth: true,
      },
    ],
  },
  {
    title: 'Card Games Collection',
    countLabel: '4 Games',
    games: [
      {
        id: 'uno',
        title: 'Color Uno',
        icon: '🃏',
        scoreBadge: 'COLOR',
        desc: 'Wild, Skip & action cards match.',
        targetGame: 'uno',
      },
      {
        id: 'hearts',
        title: 'Hearts Trick-Taking',
        icon: '♥️',
        scoreBadge: 'AVOID',
        desc: 'Avoid Queen of Spades & Hearts.',
        targetGame: 'hearts',
      },
      {
        id: 'ginrummy',
        title: 'Gin Rummy',
        icon: '🎴',
        scoreBadge: 'MELD',
        desc: 'Sets, runs, knock & undercut.',
        targetGame: 'ginrummy',
      },
      {
        id: 'speed',
        title: 'Speed / Spit',
        icon: '⚡',
        scoreBadge: 'SPEED',
        desc: 'Real-time sequence shedding.',
        targetGame: 'speed',
      },
    ],
  },
];

const ALL_GAMES_FLAT = ARCADE_CATEGORIES.flatMap((c) => c.games);

export const ArcadeCanvasModal: React.FC<ArcadeCanvasModalProps> = ({
  isOpen,
  onClose,
  onLaunchFullGame,
  initialGame,
}) => {
  const [view, setView] = useState<'dashboard' | 'game'>('dashboard');
  const [currentGameType, setCurrentGameType] = useState<string>('darts');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>({});
  const animationFrameRef = useRef<number | null>(null);

  const initGameEngine = (type: string) => {
    setCurrentGameType(type);
    if (type === 'darts') {
      gameStateRef.current = { score: 501, dartsThrown: 0, lastScore: 0, message: "Tap board to throw dart" };
    } else if (type === 'pingpong') {
      gameStateRef.current = { pScore: 0, bScore: 0, bx: 200, by: 200, bvx: 3, bvy: 2, py: 170, message: "Move cursor/tap to control paddle" };
    } else if (type === 'pool8' || type === 'pool') {
      // 15-Ball Triangle Rack for 8-Ball Pool
      const colors = ['#f1c40f', '#3498db', '#e74c3c', '#9b59b6', '#e67e22', '#2ecc71', '#78350f', '#000000', '#f1c40f', '#3498db', '#e74c3c', '#9b59b6', '#e67e22', '#2ecc71', '#78350f'];
      const rack: Array<{ number: number; x: number; y: number; radius: number; color: string; isStripe: boolean; active: boolean }> = [];
      
      // Triangle geometry: 5 rows
      const apexX = 200;
      const apexY = 110;
      const r = 8;
      let count = 1;
      for (let row = 0; row < 5; row++) {
        const startX = apexX - row * r;
        const rowY = apexY + row * (r * 1.732);
        for (let col = 0; col <= row; col++) {
          const ballX = startX + col * (r * 2);
          const num = count;
          rack.push({
            number: num,
            x: ballX,
            y: rowY,
            radius: r,
            color: colors[(num - 1) % colors.length],
            isStripe: num > 8,
            active: true,
          });
          count++;
        }
      }

      gameStateRef.current = {
        ball: { x: 200, y: 310, radius: 9, vx: 0, vy: 0 },
        objects: rack,
        message: "8-Ball Pro Rack Active - Tap cue ball to break!",
      };
    } else if (type === 'chess') {
      gameStateRef.current = { turn: 1, message: "White's turn (Tap pieces)" };
    } else if (type === 'checkers') {
      gameStateRef.current = { turn: 1, selected: null, pieces: [{ r: 0, c: 1, p: 1 }, { r: 0, c: 3, p: 1 }, { r: 5, c: 0, p: 2 }, { r: 5, c: 2, p: 2 }] };
    } else if (type === 'backgammon') {
      gameStateRef.current = { p1Score: 0, p2Score: 0, dice: [3, 4], message: "Roll & bear off checkers" };
    } else if (type === 'snakes') {
      gameStateRef.current = { p1: 1, p2: 1, turn: 1, dice: 1, message: "Tap board to roll dice" };
    } else if (type === 'ludo') {
      gameStateRef.current = { p1Pos: 0, p2Pos: 0, turn: 1, dice: 1, message: "Tap board to advance tokens" };
    } else if (type === 'gomoku') {
      gameStateRef.current = { board: Array(15).fill(null).map(() => Array(15).fill(0)), turn: 1, winner: 0, message: "Tap grid intersections to place stone" };
    } else if (type === 'reversi') {
      const b = Array(8).fill(null).map(() => Array(8).fill(0));
      b[3][3] = 2; b[3][4] = 1; b[4][3] = 1; b[4][4] = 2;
      gameStateRef.current = { board: b, turn: 1, message: "Tap valid squares to flip opponent discs" };
    } else if (type === 'connect4') {
      gameStateRef.current = { board: Array(6).fill(null).map(() => Array(7).fill(0)), turn: 1, winner: 0, message: "Tap column to drop token" };
    } else if (type === 'ultimatetictactoe') {
      gameStateRef.current = { boards: Array(9).fill(null).map(() => Array(9).fill(0)), master: Array(9).fill(0), turn: 1, message: "Tap sub-grid cells" };
    } else if (type === 'dots') {
      gameStateRef.current = { hLines: Array(4).fill(null).map(() => Array(3).fill(0)), vLines: Array(3).fill(null).map(() => Array(4).fill(0)), boxes: Array(3).fill(null).map(() => Array(3).fill(0)), turn: 1, p1: 0, p2: 0, message: "Connect dots to form boxes" };
    } else if (type === 'battleship') {
      gameStateRef.current = { p1Grid: Array(10).fill(null).map(() => Array(10).fill(0)), shots: Array(10).fill(null).map(() => Array(10).fill(0)), message: "Tap to fire torpedo!" };
    } else if (type === 'sim') {
      gameStateRef.current = { edges: [], turn: 1, winner: 0, message: "Avoid making monochromatic triangles!" };
    } else if (type === 'uno') {
      gameStateRef.current = { topCard: { color: 'red', val: '7' }, hand: ['Red 3', 'Blue Skip', 'Wild Card', 'Yellow 5'], message: "Play matching color or number" };
    } else if (type === 'hearts') {
      gameStateRef.current = { trickCards: ['♠Q', '♥K', '♦10', '♣2'], turn: 1, message: "Trick-taking: Avoid Hearts & Q♠" };
    } else if (type === 'ginrummy') {
      gameStateRef.current = { hand: ['♠7', '♠8', '♠9', '♥K', '♦2'], melds: [], message: "Form sets and runs, Knock to win" };
    } else if (type === 'speed') {
      gameStateRef.current = { pile1: '10', pile2: '4', hand: ['7', '6', '2', 'K'], message: "Quickly play matching sequential cards" };
    }
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    const height = 400;
    const state = gameStateRef.current;
    const type = currentGameType;

    ctx.clearRect(0, 0, size, height);

    if (type === 'darts') {
      const cx = 200, cy = 200;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 400);

      // Rings
      const colors = ['#1e293b', '#ef4444', '#22c55e', '#ef4444', '#22c55e', '#ef4444', '#facc15'];
      const radii = [160, 135, 125, 90, 80, 25, 10];
      for (let i = 0; i < radii.length; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, radii[i], 0, Math.PI * 2);
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Sector lines
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      for (let i = 0; i < 20; i++) {
        const angle = (i * 18 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 160, cy + Math.sin(angle) * 160);
        ctx.stroke();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Score Remaining: ${state.score ?? 501}  |  Throws: ${state.dartsThrown ?? 0}`, 200, 25);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(state.message || "Tap board to throw dart", 200, 385);
    } else if (type === 'pingpong') {
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(20, 20, 360, 360);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 360, 360);

      // Net
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(198, 20, 4, 360);

      // Player Paddle
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(30, state.py ?? 170, 12, 60);

      // AI Paddle
      ctx.fillStyle = '#f87171';
      ctx.fillRect(358, (state.by ?? 200) - 30, 12, 60);

      // Ball
      ctx.beginPath();
      ctx.arc(state.bx ?? 200, state.by ?? 200, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();

      // Ball physics step
      if (state.bx !== undefined && state.by !== undefined && state.bvx !== undefined && state.bvy !== undefined) {
        state.bx += state.bvx;
        state.by += state.bvy;
        if (state.by <= 28 || state.by >= 372) state.bvy = -state.bvy;
        if (state.bx <= 45 && state.py !== undefined && state.by >= state.py && state.by <= state.py + 60) {
          state.bvx = Math.abs(state.bvx) + 0.1;
          state.pScore = (state.pScore ?? 0) + 1;
        } else if (state.bx >= 350) {
          state.bvx = -Math.abs(state.bvx);
        } else if (state.bx < 15) {
          state.bx = 200; state.by = 200; state.bvx = 3;
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Player Score: ${state.pScore ?? 0}  |  Move Mouse/Tap to Control Paddle`, 200, 15);
    } else if (type === 'pool8' || type === 'pool') {
      ctx.fillStyle = '#065f46';
      ctx.fillRect(20, 20, 360, 360);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 360, 360);

      // Pockets
      const pockets = [
        [24, 24], [200, 20], [376, 24],
        [24, 376], [200, 380], [376, 376]
      ];
      ctx.fillStyle = '#0f172a';
      pockets.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cue Ball
      ctx.beginPath();
      ctx.arc(state.ball?.x ?? 200, state.ball?.y ?? 310, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Object balls
      state.objects?.forEach((ob) => {
        if (!ob.active) return;
        ctx.beginPath();
        ctx.arc(ob.x, ob.y, ob.radius, 0, Math.PI * 2);
        ctx.fillStyle = ob.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Number badge
        ctx.fillStyle = ob.number === 8 ? '#fff' : '#000';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(ob.number), ob.x, ob.y + 2.5);
      });

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "8-Ball Pool Pro Arena Engine Active", 200, 390);
    } else if (type === 'chess') {
      const sq = 40;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#f3f4f6' : '#334155';
          ctx.fillRect(40 + c * sq, 40 + r * sq, sq, sq);
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "White's turn (Tap pieces)", 200, 25);
    } else if (type === 'checkers') {
      const sq = 40;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#d1d5db' : '#1e293b';
          ctx.fillRect(40 + c * sq, 40 + r * sq, sq, sq);
        }
      }
      state.pieces?.forEach(p => {
        ctx.beginPath();
        ctx.arc(60 + p.c * sq, 60 + p.r * sq, 15, 0, Math.PI * 2);
        ctx.fillStyle = p.p === 1 ? '#ef4444' : '#facc15';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Checkers Draughts - Turn Player ${state.turn ?? 1}`, 200, 25);
    } else if (type === 'backgammon') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(40, 40, 320, 320);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Royal Backgammon | Dice: [3] [4]`, 200, 25);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(state.message || "Roll & bear off checkers", 200, 385);
    } else if (type === 'snakes') {
      ctx.strokeStyle = '#4b5563';
      for (let i = 0; i < 100; i++) {
        const x = 40 + (i % 10) * 32;
        const y = 340 - Math.floor(i / 10) * 32;
        ctx.strokeRect(x, y, 30, 30);
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(55 + (((state.p1 ?? 1) - 1) % 10) * 32, 355 - Math.floor(((state.p1 ?? 1) - 1) / 10) * 32, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Snakes & Ladders (Tap to Roll) P1: ${state.p1 ?? 1}`, 200, 25);
    } else if (type === 'ludo') {
      ctx.fillStyle = '#ef4444'; ctx.fillRect(50, 50, 100, 100);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(250, 50, 100, 100);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(50, 250, 100, 100);
      ctx.fillStyle = '#eab308'; ctx.fillRect(250, 250, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Ludo Super Star | P1: ${state.p1Pos ?? 0} | P2: ${state.p2Pos ?? 0}`, 200, 25);
    } else if (type === 'gomoku') {
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        ctx.beginPath(); ctx.moveTo(40 + i * 21, 40); ctx.lineTo(40 + i * 21, 334); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 40 + i * 21); ctx.lineTo(334, 40 + i * 21); ctx.stroke();
      }
      state.board?.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val > 0) {
            ctx.beginPath();
            ctx.arc(40 + c * 21, 40 + r * 21, 8, 0, Math.PI * 2);
            ctx.fillStyle = val === 1 ? '#000000' : '#ffffff';
            ctx.fill();
            ctx.stroke();
          }
        });
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Gomoku 15x15 - Turn: Player ${state.turn ?? 1}`, 200, 25);
    } else if (type === 'reversi') {
      const sq = 40;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(40 + c * sq, 40 + r * sq, sq, sq);
          ctx.strokeStyle = '#14532d';
          ctx.strokeRect(40 + c * sq, 40 + r * sq, sq, sq);
          if (state.board && state.board[r][c] > 0) {
            ctx.beginPath();
            ctx.arc(60 + c * sq, 60 + r * sq, 15, 0, Math.PI * 2);
            ctx.fillStyle = state.board[r][c] === 1 ? '#000000' : '#ffffff';
            ctx.fill();
          }
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Grand Reversi - Turn Player ${state.turn ?? 1}`, 200, 25);
    } else if (type === 'connect4') {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(40, 60, 320, 280);
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          ctx.beginPath();
          ctx.arc(65 + c * 45, 85 + r * 42, 17, 0, Math.PI * 2);
          const val = state.board ? state.board[r][c] : 0;
          ctx.fillStyle = val === 1 ? '#ef4444' : val === 2 ? '#facc15' : '#0f172a';
          ctx.fill();
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Connect Four - Turn Player ${state.turn ?? 1}`, 200, 35);
    } else if (type === 'ultimatetictactoe') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("Ultimate Tic-Tac-Toe 9x9 Nested Grid", 200, 35);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, 280, 280);
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(60 + (i * 280) / 3, 60); ctx.lineTo(60 + (i * 280) / 3, 340); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(60, 60 + (i * 280) / 3); ctx.lineTo(340, 60 + (i * 280) / 3); ctx.stroke();
      }
    } else if (type === 'dots') {
      ctx.fillStyle = '#38bdf8';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.beginPath();
          ctx.arc(80 + c * 80, 80 + r * 80, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Dots & Boxes - P1: ${state.p1 ?? 0} | P2: ${state.p2 ?? 0}`, 200, 25);
    } else if (type === 'battleship') {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(50, 50, 300, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "Tap to fire torpedo!", 200, 30);
    } else if (type === 'sim') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "Avoid making monochromatic triangles!", 200, 40);
      const vertices = [
        [200, 90], [295, 160], [260, 270],
        [140, 270], [105, 160], [200, 180]
      ];
      vertices.forEach(([vx, vy]) => {
        ctx.beginPath();
        ctx.arc(vx, vy, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
      });
    } else if (type === 'uno') {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(130, 120, 140, 180);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`UNO: ${state.topCard?.color.toUpperCase()}`, 200, 210);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Hand: ${state.hand?.join(', ')}`, 200, 350);
    } else if (type === 'hearts') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "Trick-taking: Avoid Hearts & Q♠", 200, 40);
      ctx.font = '14px sans-serif';
      ctx.fillText(`Trick Cards: ${state.trickCards?.join(' | ')}`, 200, 200);
    } else if (type === 'ginrummy') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "Form sets and runs, Knock to win", 200, 40);
      ctx.font = '14px sans-serif';
      ctx.fillText(`Hand: ${state.hand?.join(', ')}`, 200, 220);
    } else if (type === 'speed') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message || "Quickly play matching sequential cards", 200, 40);
      ctx.font = '14px sans-serif';
      ctx.fillText(`Piles: [ ${state.pile1} ]   [ ${state.pile2} ]`, 200, 160);
      ctx.fillText(`Your Hand: ${state.hand?.join(', ')}`, 200, 300);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    const state = gameStateRef.current;
    const type = currentGameType;

    if (type === 'darts') {
      const dist = Math.hypot(x - 200, y - 200);
      const pts = dist < 10 ? 50 : (dist < 25 ? 25 : (dist < 80 ? 20 : (dist < 125 ? 15 : (dist < 160 ? 10 : 0))));
      state.score = Math.max(0, (state.score ?? 501) - pts);
      state.dartsThrown = (state.dartsThrown ?? 0) + 1;
      state.message = `Hit: +${pts} pts! Remaining: ${state.score}`;
    } else if (type === 'pingpong') {
      state.py = Math.max(20, Math.min(320, y - 30));
    } else if (type === 'pool8' || type === 'pool') {
      // Scatter balls on click
      state.objects?.forEach((ob) => {
        ob.x += (Math.random() - 0.5) * 40;
        ob.y += (Math.random() - 0.5) * 40;
        ob.x = Math.max(40, Math.min(360, ob.x));
        ob.y = Math.max(40, Math.min(360, ob.y));
      });
      state.message = "Break shot executed! Solid & Stripe balls scattered.";
    } else if (type === 'snakes') {
      const roll = Math.floor(Math.random() * 6) + 1;
      state.p1 = Math.min(100, (state.p1 ?? 1) + roll);
      state.message = `Rolled a ${roll}! Position: ${state.p1}`;
    } else if (type === 'connect4' && !state.winner) {
      const col = Math.floor((x - 40) / 45);
      if (col >= 0 && col < 7 && state.board) {
        for (let r = 5; r >= 0; r--) {
          if (state.board[r][col] === 0) {
            state.board[r][col] = state.turn ?? 1;
            state.turn = state.turn === 1 ? 2 : 1;
            break;
          }
        }
      }
    } else if (type === 'gomoku') {
      const c = Math.floor((x - 40) / 21);
      const r = Math.floor((y - 40) / 21);
      if (c >= 0 && c < 15 && r >= 0 && r < 15 && state.board && state.board[r][c] === 0) {
        state.board[r][c] = state.turn ?? 1;
        state.turn = state.turn === 1 ? 2 : 1;
      }
    } else if (type === 'uno') {
      const colors = ['red', 'blue', 'green', 'yellow'];
      state.topCard = { color: colors[Math.floor(Math.random() * 4)], val: String(Math.floor(Math.random() * 9)) };
      state.message = `Played card to stack! Current: ${state.topCard.color.toUpperCase()} ${state.topCard.val}`;
    }

    renderGame();
  };

  const handleLaunchGame = (type: string) => {
    initGameEngine(type);
    setView('game');
  };

  useEffect(() => {
    if (isOpen) {
      if (initialGame) {
        handleLaunchGame(initialGame);
      } else {
        setView('dashboard');
      }
    }
  }, [isOpen, initialGame]);

  useEffect(() => {
    if (view === 'game') {
      renderGame();
      const loop = () => {
        if (currentGameType === 'pingpong') {
          renderGame();
        }
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [view, currentGameType]);

  if (!isOpen) return null;

  const currentGameMeta = ALL_GAMES_FLAT.find((g) => g.id === currentGameType) || ALL_GAMES_FLAT[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[540px] max-h-[94vh] flex flex-col bg-[#111522] border border-[#242f4c] rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden text-white">
        
        {/* Arcade Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0d111b] border-b border-[#242f4c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3498db] to-[#f1c40f] flex items-center justify-center text-xl shadow-[0_4px_12px_rgba(52,152,219,0.3)]">
              🕹️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Arcade Platform
                </h2>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#22304a] text-[#f1c40f] border border-[#34495e] rounded">
                  20-Game Master Suite
                </span>
              </div>
              <p className="text-[11px] text-[#8c92a4] mt-0.5">
                {view === 'dashboard'
                  ? 'Board, Grid, Sport & Card Classics'
                  : currentGameMeta.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8c92a4] hover:text-white hover:bg-[#161c2d] rounded-xl transition border border-transparent hover:border-[#242f4c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {view === 'dashboard' ? (
            <div className="space-y-4">
              {ARCADE_CATEGORIES.map((cat, catIdx) => (
                <div key={cat.title} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#242f4c] pb-1 pt-1">
                    <span className="text-[11px] font-bold text-[#f1c40f] uppercase tracking-wider">
                      {cat.title} ({cat.countLabel})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {cat.games.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => handleLaunchGame(game.id)}
                        className={`group relative bg-[#161c2d] hover:bg-[#1d263f] border border-[#242f4c] hover:border-[#3498db] rounded-xl p-3 flex flex-col justify-between gap-1.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                          game.fullWidth ? 'col-span-2' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">{game.icon}</span>
                          <span className="text-[8px] font-bold text-[#8c92a4] bg-[#0f131d] px-1.5 py-0.5 rounded border border-[#242f4c]">
                            {game.scoreBadge}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-white group-hover:text-[#f1c40f] transition">
                            {game.title}
                          </h3>
                          <p className="text-[9px] text-[#8c92a4] line-clamp-1 mt-0.5">
                            {game.desc}
                          </p>
                        </div>

                        <div className="mt-1 py-1 px-2 rounded-md bg-gradient-to-r from-[#22304a] to-[#131929] border border-[#242f4c] text-[#f1c40f] text-[10px] font-bold text-center group-hover:border-[#3498db] transition">
                          {game.fullWidth ? `PLAY ${game.title.toUpperCase()}` : 'PLAY'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* Top Arena Header */}
              <div className="w-full flex items-center justify-between bg-[#0f131d] px-3.5 py-2 rounded-xl border border-[#242f4c]">
                <button
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#161c2d] hover:bg-[#1d263f] text-white text-xs font-semibold rounded-lg border border-[#242f4c] transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  ⬅ Arcade Hub
                </button>
                <div className="text-xs font-bold text-[#f1c40f]">
                  {currentGameMeta.title}
                </div>
              </div>

              {/* 400x400 Canvas Stage */}
              <div className="relative w-full max-w-[400px] flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  onClick={handleCanvasClick}
                  className="bg-[#111827] border-4 border-[#242f4c] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] cursor-crosshair w-full max-w-[400px] h-auto block"
                />
              </div>

              {/* Controls Panel */}
              <div className="w-full max-w-[400px] flex flex-col gap-2">
                <button
                  onClick={() => {
                    initGameEngine(currentGameType);
                    renderGame();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-[#1b2438] to-[#131929] hover:border-[#3498db] border border-[#242f4c] text-white text-xs font-semibold rounded-lg text-center transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#f1c40f]" />
                  <span>🔄 Reset / Restart Game</span>
                </button>

                {onLaunchFullGame && (
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchFullGame(currentGameMeta.targetGame);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#3498db]/30 to-[#f1c40f]/30 hover:from-[#3498db]/40 hover:to-[#f1c40f]/40 border border-[#f1c40f]/50 text-[#f1c40f] text-xs font-bold rounded-lg text-center transition flex items-center justify-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Launch Full HD Board Game</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#090b10] border-t border-[#242f4c] flex items-center justify-between text-[10px] text-[#8c92a4]">
          <span>Platform Engine v9.1</span>
          <span className="text-[#f1c40f] font-semibold">20 Master Arcade Games</span>
        </div>
      </div>
    </div>
  );
};
