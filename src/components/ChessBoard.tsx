import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { BoardTheme } from '../types';
import { ChessPiece } from '../utils/chessPieces';
import { soundFx } from '../utils/audio';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Trash2,
  Palette,
  Crosshair,
  Flame,
  Zap,
  Sliders,
  X,
  Play,
  CheckCircle2,
  Lock,
  Unlock,
  ShoppingBag,
  Check,
  Crown,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import {
  loadVfxSettings,
  saveVfxSettings,
  playCinematicSound,
  getThemeColors,
  VfxSettings,
  VfxParticle,
  VARIATIONS_96_MATRIX,
  PieceElementCode,
  triggerPieceCryState,
  CRY_STATES_MATRIX,
} from '../utils/cinematicVfx';
import {
  getEquippedItemForPiece,
  getEquippedMasterEffects,
  getMasterInventory,
  findCatalogItem,
  isVariationPurchased,
  purchaseCatalogItem,
  equipCatalogItem,
  unequipCatalogItem,
  getPurchasedItemsCount,
  CatalogItem,
  MasterPieceType,
} from '../utils/masterEffectsCatalog';
import { getUserPoints, spendPoints, addPoints } from '../utils/pointsManager';
import {
  calculateSquareThreats,
  scanBoardForHighStressThreats,
  SquareThreatData,
} from '../utils/threatEngine';

interface ChessBoardProps {
  chess: Chess;
  orientation: 'w' | 'b';
  boardTheme: BoardTheme;
  onMove: (from: Square, to: Square) => void;
  showLegalMoves?: boolean;
  showLastMove?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  kingInCheckSquare?: Square | null;
  readOnly?: boolean;
  onFlipOrientation?: () => void;
  onChangeTheme?: (theme: BoardTheme) => void;
  onOpenMasterHub?: () => void;
  onOpenQuests?: () => void;
  onOpenDailyWheel?: () => void;
}

interface TacticalArrow {
  from: Square;
  to: Square;
  color: 'green' | 'red' | 'amber' | 'blue';
}

interface ShockwaveRing {
  id: number;
  x: number;
  y: number;
  color: string;
  glowColor: string;
  size: number;
}

interface FloatingMoveBadge {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  bg: string;
  border: string;
}

const themeConfigs: Record<
  BoardTheme,
  {
    name: string;
    light: string;
    dark: string;
    lightText: string;
    darkText: string;
    border: string;
    outerRing: string;
    glow: string;
  }
> = {
  terracotta: {
    name: 'Terracotta Sienna (Cinema)',
    light: 'bg-[#eed7b5]',
    dark: 'bg-[#be5b3c]',
    lightText: 'text-[#be5b3c]',
    darkText: 'text-[#eed7b5]',
    border: 'border-[#913d24]',
    outerRing: 'from-[#9e4328] via-[#662816] to-[#301208]',
    glow: 'rgba(190, 91, 60, 0.45)',
  },
  emerald: {
    name: 'Classic Tournament',
    light: 'bg-[#eeeed2]',
    dark: 'bg-[#769656]',
    lightText: 'text-[#769656]',
    darkText: 'text-[#eeeed2]',
    border: 'border-[#4e6b36]',
    outerRing: 'from-[#4e6b36] via-[#2d401f] to-[#1b2713]',
    glow: 'rgba(118, 150, 86, 0.3)',
  },
  wood: {
    name: 'Walnut & Maple',
    light: 'bg-[#f0d9b5]',
    dark: 'bg-[#b58863]',
    lightText: 'text-[#b58863]',
    darkText: 'text-[#f0d9b5]',
    border: 'border-[#8c6243]',
    outerRing: 'from-[#6e462c] via-[#482c1b] to-[#2c1a0e]',
    glow: 'rgba(181, 136, 99, 0.35)',
  },
  slate: {
    name: 'Modern Slate',
    light: 'bg-[#e2e8f0]',
    dark: 'bg-[#475569]',
    lightText: 'text-[#475569]',
    darkText: 'text-[#e2e8f0]',
    border: 'border-slate-700',
    outerRing: 'from-slate-700 via-slate-800 to-slate-950',
    glow: 'rgba(71, 85, 105, 0.35)',
  },
  stone: {
    name: 'Obsidian Marble',
    light: 'bg-[#e7e5e4]',
    dark: 'bg-[#57534e]',
    lightText: 'text-[#57534e]',
    darkText: 'text-[#e7e5e4]',
    border: 'border-stone-700',
    outerRing: 'from-stone-700 via-stone-800 to-stone-950',
    glow: 'rgba(87, 83, 78, 0.35)',
  },
  neon: {
    name: 'Cyberpunk Neon',
    light: 'bg-[#ede9fe]',
    dark: 'bg-[#312e81]',
    lightText: 'text-[#312e81]',
    darkText: 'text-[#ede9fe]',
    border: 'border-indigo-800',
    outerRing: 'from-indigo-600 via-purple-900 to-slate-950',
    glow: 'rgba(99, 102, 241, 0.45)',
  },
  ocean: {
    name: 'Pacific Azure',
    light: 'bg-[#e0f2fe]',
    dark: 'bg-[#0284c7]',
    lightText: 'text-[#0284c7]',
    darkText: 'text-[#e0f2fe]',
    border: 'border-sky-800',
    outerRing: 'from-sky-600 via-blue-900 to-slate-950',
    glow: 'rgba(2, 132, 199, 0.4)',
  },
  crimson: {
    name: 'Royal Velvet',
    light: 'bg-[#fef2f2]',
    dark: 'bg-[#991b1b]',
    lightText: 'text-[#991b1b]',
    darkText: 'text-[#fef2f2]',
    border: 'border-rose-900',
    outerRing: 'from-rose-700 via-red-950 to-stone-950',
    glow: 'rgba(153, 27, 27, 0.4)',
  },
  glass: {
    name: 'Nordic Crystal',
    light: 'bg-[#f8fafc]',
    dark: 'bg-[#334155]',
    lightText: 'text-[#334155]',
    darkText: 'text-[#f8fafc]',
    border: 'border-slate-600',
    outerRing: 'from-slate-600 via-slate-800 to-slate-950',
    glow: 'rgba(148, 163, 184, 0.3)',
  },
  cyber: {
    name: 'Cyber Neon (Cinematic Image Match)',
    light: 'bg-[#28384f]',
    dark: 'bg-[#121c2a]',
    lightText: 'text-[#38bdf8]',
    darkText: 'text-[#00f2fe]',
    border: 'border-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.4)]',
    outerRing: 'from-cyan-500 via-slate-900 to-[#070e1b]',
    glow: 'rgba(0, 242, 254, 0.65)',
  },
};

const ARROW_COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
};

const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const BOARD_RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
const REVERSED_FILES = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] as const;
const REVERSED_RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation,
  boardTheme,
  onMove,
  showLegalMoves = true,
  showLastMove = true,
  lastMove = null,
  kingInCheckSquare = null,
  readOnly = false,
  onFlipOrientation,
  onChangeTheme,
  onOpenMasterHub,
  onOpenQuests,
  onOpenDailyWheel,
}: ChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  // Right-Click Drawing & Tactical Annotations Engine
  const [arrows, setArrows] = useState<TacticalArrow[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Record<Square, 'green' | 'red' | 'amber' | 'blue'>>({} as any);
  const rightClickStartSquareRef = useRef<Square | null>(null);
  const isRightMouseDownRef = useRef<boolean>(false);

  // Board Coordinates & UI preferences
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const [showVfxPanel, setShowVfxPanel] = useState<boolean>(false);

  // Cinematic VFX Settings (Active by Default)
  const [vfxSettings, setVfxSettings] = useState<VfxSettings>(() => loadVfxSettings());
  const [equippedRevision, setEquippedRevision] = useState<number>(0);

  // Master Catalog, Inventory & Points State (Ensuring ONLY purchased effects apply)
  const [masterInventory, setMasterInventory] = useState<Record<string, boolean>>(() => getMasterInventory());
  const [equippedMaster, setEquippedMaster] = useState<Record<string, string>>(() => getEquippedMasterEffects());
  const [userPoints, setUserPointsState] = useState<number>(() => getUserPoints());
  const [selectedUnlockItem, setSelectedUnlockItem] = useState<CatalogItem | null>(null);
  const [filterPurchasedOnly, setFilterPurchasedOnly] = useState<boolean>(false);
  const [vfxFeedbackToast, setVfxFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Listen for VFX settings updates, points updates, and equipped loadout updates
  useEffect(() => {
    const handleVfxUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VfxSettings>;
      if (customEvent.detail) {
        setVfxSettings(customEvent.detail);
      }
    };
    const handleEquippedUpdate = () => {
      setEquippedRevision((prev) => prev + 1);
      setMasterInventory(getMasterInventory());
      setEquippedMaster(getEquippedMasterEffects());
      setUserPointsState(getUserPoints());
    };
    const handlePointsUpdate = () => {
      setUserPointsState(getUserPoints());
    };
    const handlePieceCry = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.pieceCode) {
        const pCode = detail.pieceCode.toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
        const targetSquare = (detail.square || 'e4') as Square;
        const ghostId = Date.now() + Math.random();
        setCryGhosts((prev) => [
          ...prev,
          {
            id: ghostId,
            square: targetSquare,
            pieceType: pCode,
            pieceColor: 'w',
          },
        ]);
        setVfxFeedbackToast({
          message: `😭 ${detail.pieceName || 'Piece'} Triggered Cry State! +${(detail.pointsAwarded || 2500).toLocaleString()} PTS Awarded!`,
          type: 'success',
        });
        setTimeout(() => {
          setCryGhosts((prev) => prev.filter((g) => g.id !== ghostId));
        }, 1200);
      }
    };

    window.addEventListener('chess_vfx_settings_updated', handleVfxUpdate);
    window.addEventListener('chess_equipped_effects_updated', handleEquippedUpdate);
    window.addEventListener('chess_points_updated', handlePointsUpdate);
    window.addEventListener('chess_piece_cry_triggered', handlePieceCry);
    window.addEventListener('storage', handleEquippedUpdate);

    return () => {
      window.removeEventListener('chess_vfx_settings_updated', handleVfxUpdate);
      window.removeEventListener('chess_equipped_effects_updated', handleEquippedUpdate);
      window.removeEventListener('chess_points_updated', handlePointsUpdate);
      window.removeEventListener('chess_piece_cry_triggered', handlePieceCry);
      window.removeEventListener('storage', handleEquippedUpdate);
    };
  }, []);

  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VfxParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // VFX States
  const [shockwaves, setShockwaves] = useState<ShockwaveRing[]>([]);
  const [floatingBadges, setFloatingBadges] = useState<FloatingMoveBadge[]>([]);
  const [isBoardShaking, setIsBoardShaking] = useState<boolean>(false);

  // 96-State Capture Ghosts, Occupation Active States & Cry States
  const [captureGhosts, setCaptureGhosts] = useState<{
    id: number;
    square: Square;
    pieceType: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    pieceColor: 'w' | 'b';
    styleIndex: 1 | 2 | 3 | 4;
  }[]>([]);

  const [cryGhosts, setCryGhosts] = useState<{
    id: number;
    square: Square;
    pieceType: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    pieceColor: 'w' | 'b';
  }[]>([]);

  const [occupyingSquare, setOccupyingSquare] = useState<{
    square: Square;
    styleIndex: 1 | 2 | 3 | 4;
  } | null>(null);

  // Real-time Multi-Element High Stress Threat State (3+ Enemy Attackers)
  const [highStressThreatMap, setHighStressThreatMap] = useState<Partial<Record<Square, SquareThreatData>>>({});
  const [activeThreatTelemetry, setActiveThreatTelemetry] = useState<{
    totalHighStress: number;
    mostThreatened: SquareThreatData | null;
  }>({ totalHighStress: 0, mostThreatened: null });
  const triggeredHighStressSetRef = useRef<Set<string>>(new Set());

  // Real-time 96-Variation Tester State
  const [simulationTarget, setSimulationTarget] = useState<{
    id: string;
    square: Square;
    piece: PieceElementCode;
    color: 'w' | 'b';
    action: 'capturing' | 'occupying';
    styleIndex: 1 | 2 | 3 | 4;
  } | null>(null);

  const [testerPieceFilter, setTesterPieceFilter] = useState<PieceElementCode>('N');
  const [testerActionFilter, setTesterActionFilter] = useState<'capturing' | 'occupying' | 'cry'>('capturing');

  // Piece ID Tracking for smooth Motion layoutId slide animations
  const [pieceIds, setPieceIds] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    const board = chess.board();
    const filesList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const sq = `${filesList[c]}${8 - r}`;
          initialMap[sq] = `${p.color}_${p.type}_${sq}`;
        }
      }
    }
    return initialMap;
  });

  useEffect(() => {
    setPieceIds((prevIds) => {
      const nextIds: Record<string, string> = {};
      const board = chess.board();
      const filesList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      // Build list of active pieces on board
      const activePieces: { sq: Square; color: string; type: string }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p) {
            const sq = `${filesList[c]}${8 - r}` as Square;
            activePieces.push({ sq, color: p.color, type: p.type });
          }
        }
      }

      // If lastMove exists, transfer the ID from lastMove.from to lastMove.to
      if (lastMove && prevIds[lastMove.from]) {
        nextIds[lastMove.to] = prevIds[lastMove.from];

        // Castling checks for rooks
        if (lastMove.from === 'e1' && lastMove.to === 'g1' && prevIds['h1']) nextIds['f1'] = prevIds['h1'];
        if (lastMove.from === 'e1' && lastMove.to === 'c1' && prevIds['a1']) nextIds['d1'] = prevIds['a1'];
        if (lastMove.from === 'e8' && lastMove.to === 'g8' && prevIds['h8']) nextIds['f8'] = prevIds['h8'];
        if (lastMove.from === 'e8' && lastMove.to === 'c8' && prevIds['a8']) nextIds['d8'] = prevIds['a8'];
      }

      // Map remaining active pieces
      for (const pItem of activePieces) {
        if (nextIds[pItem.sq]) continue;

        const existingId = prevIds[pItem.sq];
        if (existingId && existingId.startsWith(`${pItem.color}_`)) {
          nextIds[pItem.sq] = existingId;
        } else {
          nextIds[pItem.sq] = `${pItem.color}_${pItem.type}_${pItem.sq}_${Math.random().toString(36).slice(2, 6)}`;
        }
      }

      return nextIds;
    });
  }, [chess.fen(), lastMove]);

  const displayedRanks = orientation === 'w' ? BOARD_RANKS : REVERSED_RANKS;
  const displayedFiles = orientation === 'w' ? BOARD_FILES : REVERSED_FILES;

  // Helper to get pixel center coordinates of a square on the board
  const getSquareCoords = useCallback(
    (square: Square): { x: number; y: number; size: number } => {
      if (!boardRef.current) return { x: 0, y: 0, size: 60 };
      const rect = boardRef.current.getBoundingClientRect();
      const squareSize = rect.width / 8;
      const fList = orientation === 'w' ? BOARD_FILES : REVERSED_FILES;
      const rList = orientation === 'w' ? BOARD_RANKS : REVERSED_RANKS;
      const fIdx = (fList as readonly string[]).indexOf(square[0]);
      const rIdx = (rList as readonly string[]).indexOf(square[1]);
      return {
        x: fIdx * squareSize + squareSize / 2,
        y: rIdx * squareSize + squareSize / 2,
        size: squareSize,
      };
    },
    [orientation]
  );

  // Spark Particles Emitter
  const triggerParticleBurst = useCallback(
    (centerX: number, centerY: number, colorScheme: string[], count = 32) => {
      const shapes: ('circle' | 'star' | 'diamond')[] = ['circle', 'star', 'diamond'];
      const newParticles: VfxParticle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 8 + 3) * (vfxSettings.animSpeed || 1);
        newParticles.push({
          id: Math.random(),
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 2 + 1),
          size: Math.random() * 4.5 + 2,
          color: colorScheme[Math.floor(Math.random() * colorScheme.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 26 + 22,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    [vfxSettings.animSpeed]
  );

  // Main Canvas Render Loop for Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const active: VfxParticle[] = [];

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // subtle gravity
        p.vx *= 0.96; // air resistance
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.alpha > 0.01 && p.life < p.maxLife) {
          active.push(p);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size * 1.3);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.lineTo(p.x, p.y + p.size * 1.3);
            ctx.lineTo(p.x - p.size, p.y);
            ctx.closePath();
            ctx.fill();
          } else {
            // Star
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              ctx.lineTo(
                Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size + p.x,
                -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size + p.y
              );
              ctx.lineTo(
                Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2) + p.x,
                -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2) + p.y
              );
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }

      particlesRef.current = active;
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Update canvas size on resize
  const syncCanvasSize = useCallback(() => {
    if (!boardRef.current || !canvasRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    canvasRef.current.width = rect.width;
    canvasRef.current.height = rect.height;
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [syncCanvasSize]);

  // Master Reaction Trigger on every move in Main Chess
  const prevLastMoveRef = useRef<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    if (!lastMove) {
      prevLastMoveRef.current = null;
      return;
    }

    // Check if this is a newly arrived move
    const isNewMove =
      !prevLastMoveRef.current ||
      prevLastMoveRef.current.from !== lastMove.from ||
      prevLastMoveRef.current.to !== lastMove.to;

    if (!isNewMove) return;
    prevLastMoveRef.current = lastMove;

    // Identify pieces and game state
    const coords = getSquareCoords(lastMove.to);
    const pieceOnTo = chess.get(lastMove.to);
    const pType = pieceOnTo?.type || 'p';
    const isCheck = !!kingInCheckSquare || chess.inCheck();
    const isCheckmate = chess.isGameOver() && isCheck;
    const isCapture = !!chess.history({ verbose: true }).slice(-1)[0]?.captured;
    const historyVerbose = chess.history({ verbose: true });
    const lastVerbose = historyVerbose[historyVerbose.length - 1];
    const capturedType = (lastVerbose?.captured || 'p') as 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

    // Check ONLY purchased and equipped effects/animations for the moving and captured pieces
    const movingPieceEquipped = getEquippedItemForPiece(pType);
    const capturedPieceEquipped = isCapture ? getEquippedItemForPiece(capturedType) : null;

    // IF NEITHER PIECE HAS A PURCHASED & EQUIPPED ITEM:
    if (!movingPieceEquipped && !capturedPieceEquipped) {
      if (soundEnabled) {
        if (isCheckmate) playCinematicSound('checkmate');
        else if (isCheck) playCinematicSound('check');
        else if (isCapture) playCinematicSound('capture');
        else playCinematicSound('move');
      }
      return;
    }

    // 1. Play Synthesized Sound for equipped pieces
    if (soundEnabled) {
      if (isCheckmate) {
        playCinematicSound('checkmate');
      } else if (isCheck) {
        playCinematicSound('check');
      } else if (isCapture) {
        playCinematicSound('capture');
      } else if (pType === 'n') {
        playCinematicSound('leap');
      } else if (pType === 'q') {
        playCinematicSound('whoosh');
      } else {
        playCinematicSound('move');
      }
    }

    // Determine 96-State Variation Style Index from equipped item
    const activeStyle: 1 | 2 | 3 | 4 = (movingPieceEquipped?.variantIndex || capturedPieceEquipped?.variantIndex || 1) as 1 | 2 | 3 | 4;

    // Trigger Occupying Arrival Animation ONLY if moving piece has an equipped effect/animation
    if (movingPieceEquipped) {
      setOccupyingSquare({
        square: lastMove.to,
        styleIndex: activeStyle,
      });
      setTimeout(() => {
        setOccupyingSquare((curr) => (curr?.square === lastMove.to ? null : curr));
      }, 600);
    }

    // Trigger Capture Ghost ONLY if captured piece (or capturing piece) has an equipped effect/animation
    if (isCapture && (capturedPieceEquipped || movingPieceEquipped)) {
      const capturedColor = pieceOnTo?.color === 'w' ? 'b' : 'w';
      const ghostStyle = (capturedPieceEquipped?.variantIndex || activeStyle) as 1 | 2 | 3 | 4;

      const ghostId = Date.now() + Math.random();
      setCaptureGhosts((prev) => [
        ...prev,
        {
          id: ghostId,
          square: lastMove.to,
          pieceType: capturedType,
          pieceColor: capturedColor,
          styleIndex: ghostStyle,
        },
      ]);

      setTimeout(() => {
        setCaptureGhosts((prev) => prev.filter((g) => g.id !== ghostId));
      }, 700);
    }

    // 2. Trigger Particles using equipped item's glowColor & secondaryColor
    const activeGlow = movingPieceEquipped?.glowColor || capturedPieceEquipped?.glowColor || '#00f2fe';
    const activeSec = movingPieceEquipped?.secondaryColor || capturedPieceEquipped?.secondaryColor || '#3b82f6';
    let particleColors = [activeGlow, activeSec, '#ffffff'];
    if (isCheckmate) particleColors = ['#ffd700', activeGlow, '#ffffff', '#eab308'];
    else if (isCapture) particleColors = [activeGlow, '#ef4444', activeSec, '#ffffff'];
    else if (isCheck) particleColors = [activeGlow, '#f59e0b', '#fbbf24', '#ffffff'];

    triggerParticleBurst(coords.x, coords.y, particleColors, isCheckmate ? 50 : isCapture ? 36 : 24);

    // 3. Trigger Shockwave Ring with equipped item's glow color
    const shockwaveId = Date.now() + Math.random();
    const shockColor = isCheckmate
      ? 'rgba(250, 204, 21, 0.9)'
      : isCapture
      ? `${activeGlow}e6`
      : isCheck
      ? 'rgba(245, 158, 11, 0.9)'
      : `${activeGlow}cc`;

    setShockwaves((prev) => [
      ...prev,
      {
        id: shockwaveId,
        x: coords.x,
        y: coords.y,
        color: shockColor,
        glowColor: activeGlow,
        size: coords.size,
      },
    ]);

    setTimeout(() => {
      setShockwaves((prev) => prev.filter((s) => s.id !== shockwaveId));
    }, 850);

    // 4. Trigger Board Jolt Shake if screenShake is enabled in settings
    if (vfxSettings.screenShake && (isCapture || isCheck || isCheckmate)) {
      setIsBoardShaking(true);
      setTimeout(() => setIsBoardShaking(false), 420);
    }

    // 5. Trigger Floating Evaluation Badge for equipped piece moves
    if (vfxSettings.floatingBadges || movingPieceEquipped) {
      let badgeText = '';
      let badgeColor = 'text-cyan-300';
      let badgeBg = 'bg-cyan-950/80';
      let badgeBorder = 'border-cyan-400/50';

      if (isCheckmate) {
        badgeText = '# MATE';
        badgeColor = 'text-amber-300';
        badgeBg = 'bg-amber-950/90';
        badgeBorder = 'border-amber-400/80';
      } else if (isCheck) {
        badgeText = '+ CHECK';
        badgeColor = 'text-red-300';
        badgeBg = 'bg-red-950/90';
        badgeBorder = 'border-red-400/80';
      } else if (isCapture) {
        badgeText = '💥 CAPTURE';
        badgeColor = 'text-rose-300';
        badgeBg = 'bg-rose-950/80';
        badgeBorder = 'border-rose-400/60';
      } else if (movingPieceEquipped) {
        badgeText = `${movingPieceEquipped.piece.toUpperCase()} #${movingPieceEquipped.variantIndex}`;
        badgeColor = 'text-sky-300';
        badgeBg = 'bg-slate-950/85';
        badgeBorder = 'border-cyan-400/60';
      }

      if (badgeText) {
        const badgeId = Date.now() + Math.random();
        setFloatingBadges((prev) => [
          ...prev,
          {
            id: badgeId,
            x: coords.x,
            y: coords.y,
            text: badgeText,
            color: badgeColor,
            bg: badgeBg,
            border: badgeBorder,
          },
        ]);

        setTimeout(() => {
          setFloatingBadges((prev) => prev.filter((b) => b.id !== badgeId));
        }, 1100);
      }
    }
  }, [lastMove, chess, kingInCheckSquare, vfxSettings, getSquareCoords, triggerParticleBurst]);

  // High-Stress Multi-Threat & Cry State Trigger Engine (Element Cry Matrix = Cry State + 2,500 PTS)
  const lastProcessedThreatFenRef = useRef<string>('');

  useEffect(() => {
    const currentFen = chess.fen();
    if (lastProcessedThreatFenRef.current === currentFen) {
      return;
    }
    lastProcessedThreatFenRef.current = currentFen;

    const stressList = scanBoardForHighStressThreats(chess);
    const map: Partial<Record<Square, SquareThreatData>> = {};
    let maxThreat: SquareThreatData | null = null;

    for (const item of stressList) {
      map[item.square] = item;
      if (!maxThreat || item.attackerCount > maxThreat.attackerCount) {
        maxThreat = item;
      }
    }

    setHighStressThreatMap(map);
    setActiveThreatTelemetry({
      totalHighStress: stressList.length,
      mostThreatened: maxThreat,
    });

    // Check for pieces newly entering cry state conditions (Element Cry Matrix or >= 3 enemy attackers)
    for (const item of stressList) {
      const fenKey = `${chess.history().length}_${item.square}_${item.pieceType}_${item.attackerCount}_${item.cryEvaluation?.behaviorTitle || ''}`;
      if (!triggeredHighStressSetRef.current.has(fenKey)) {
        triggeredHighStressSetRef.current.add(fenKey);

        // 1. Award +2,500 Points Reward
        addPoints(2500, `Element Cry Defense (${item.pieceCode} - ${item.cryEvaluation?.behaviorTitle || 'Tactical Threat'})`);
        setUserPointsState(getUserPoints());

        // 2. Play piece-specific synthesized cry sound
        const crySpec = CRY_STATES_MATRIX.find((c) => c.piece === item.pieceCode);
        if (crySpec && soundEnabled) {
          playCinematicSound(crySpec.soundType);
        }

        // 3. Trigger board visual burst & shockwave
        const coords = getSquareCoords(item.square);
        const cryColor = crySpec?.colorAccent || '#f59e0b';
        triggerParticleBurst(coords.x, coords.y, [cryColor, '#00d2ff', '#ffffff', '#ef4444', '#f59e0b'], 36);

        const shockId = Date.now() + Math.random();
        setShockwaves((prev) => [
          ...prev,
          {
            id: shockId,
            x: coords.x,
            y: coords.y,
            color: cryColor,
            glowColor: cryColor,
            size: coords.size,
          },
        ]);
        setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 800);

        // Add floating cry reward badge
        const badgeId = Date.now() + Math.random();
        const behaviorName = item.cryEvaluation?.behaviorTitle || 'CRY STATE';
        setFloatingBadges((prev) => [
          ...prev,
          {
            id: badgeId,
            x: coords.x,
            y: coords.y,
            text: `😭 ${behaviorName.toUpperCase()} +2,500 PTS (${item.attackerCount}⚔️)`,
            color: 'text-amber-300 font-black',
            bg: 'bg-gradient-to-r from-amber-950/95 to-slate-950/95',
            border: 'border-amber-400',
          },
        ]);
        setTimeout(() => setFloatingBadges((prev) => prev.filter((b) => b.id !== badgeId)), 1400);

        // Add to Cry Ghosts so .piece-cry animates
        const ghostId = Date.now() + Math.random();
        setCryGhosts((prev) => [
          ...prev,
          {
            id: ghostId,
            square: item.square,
            pieceType: item.pieceType,
            pieceColor: item.pieceColor,
          },
        ]);
        setTimeout(() => setCryGhosts((prev) => prev.filter((cg) => cg.id !== ghostId)), 1200);

        // Trigger Screen Shake if enabled
        if (vfxSettings.screenShake) {
          setIsBoardShaking(true);
          setTimeout(() => setIsBoardShaking(false), 420);
        }

        // Toast feedback
        const customMsg = item.cryEvaluation?.threatDescription
          ? `⚠️ ${item.cryEvaluation.behaviorTitle.toUpperCase()}: ${item.cryEvaluation.threatDescription} +2,500 PTS Cry Reward Granted!`
          : `⚠️ HIGH STRESS! ${crySpec?.pieceName || item.pieceCode} is under attack by ${item.attackerCount} enemy pieces! 3D Tears Flowing & +2,500 PTS Cry Reward Granted!`;

        setVfxFeedbackToast({
          message: customMsg,
          type: 'info',
        });
        setTimeout(() => setVfxFeedbackToast((curr) => (curr?.type === 'info' ? null : curr)), 4500);
      }
    }
  }, [chess.fen(), soundEnabled, vfxSettings.screenShake, getSquareCoords, triggerParticleBurst]);

  // Trigger signature physics test effect right onto the main board
  const triggerSignaturePhysicsPreset = (presetName: string) => {
    const centerCoords = {
      x: (boardRef.current?.clientWidth || 400) / 2,
      y: (boardRef.current?.clientHeight || 400) / 2,
      size: 50,
    };

    if (presetName === 'knight_leap') {
      playCinematicSound('leap');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('cyber'), 40);
    } else if (presetName === 'king_mate') {
      playCinematicSound('checkmate');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('royal'), 60);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 450);
      }
    } else if (presetName === 'queen_ghost') {
      playCinematicSound('whoosh');
      triggerParticleBurst(centerCoords.x, centerCoords.y, ['#c084fc', '#e879f9', '#a855f7', '#ffffff'], 45);
    } else if (presetName === 'rook_smash') {
      playCinematicSound('capture');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('inferno'), 45);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 450);
      }
    } else {
      playCinematicSound('brilliant');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('emerald'), 40);
    }

    const shockId = Date.now();
    setShockwaves((prev) => [
      ...prev,
      {
        id: shockId,
        x: centerCoords.x,
        y: centerCoords.y,
        color: 'rgba(0, 242, 254, 0.9)',
        glowColor: 'rgba(0, 242, 254, 0.9)',
        size: 50,
      },
    ]);
    setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 850);
  };

  // Trigger any of the 96 exact piece variations in real-time on board square e4
  const triggerSimulationVariation = (
    piece: PieceElementCode,
    action: 'capturing' | 'occupying',
    styleIndex: 1 | 2 | 3 | 4,
    color: 'w' | 'b' = 'w'
  ) => {
    const targetSq: Square = 'e4';
    const coords = getSquareCoords(targetSq);
    const simId = `${piece}_${action}_${styleIndex}_${Date.now()}`;

    if (action === 'capturing') {
      playCinematicSound('capture');
      triggerParticleBurst(coords.x, coords.y, ['#ef4444', '#f97316', '#ffedd5', '#f87171'], 38);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 380);
      }
    } else {
      if (piece === 'N') playCinematicSound('leap');
      else if (piece === 'Q') playCinematicSound('whoosh');
      else if (piece === 'K') playCinematicSound('checkmate');
      else playCinematicSound('move');
      triggerParticleBurst(coords.x, coords.y, getThemeColors(vfxSettings.vfxTheme), 30);
    }

    const shockId = Date.now();
    setShockwaves((prev) => [
      ...prev,
      {
        id: shockId,
        x: coords.x,
        y: coords.y,
        color: action === 'capturing' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 242, 254, 0.85)',
        glowColor: action === 'capturing' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 242, 254, 0.85)',
        size: coords.size,
      },
    ]);
    setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 800);

    setSimulationTarget({
      id: simId,
      square: targetSq,
      piece,
      color,
      action,
      styleIndex,
    });

    setTimeout(() => {
      setSimulationTarget((curr) => (curr?.id === simId ? null : curr));
    }, 850);
  };

  // Select or trigger a 96-variation style with strict ownership verification
  const handleSelectOrTriggerVariation = (
    piece: PieceElementCode,
    action: 'capturing' | 'occupying',
    styleIndex: 1 | 2 | 3 | 4
  ) => {
    const matchingCatalog = findCatalogItem(piece, action, styleIndex);
    if (!matchingCatalog) return;

    const isOwned = Boolean(masterInventory[matchingCatalog.id]);

    if (!isOwned) {
      // LOCKED! Prompt 1-Click Purchase & Unlock Modal
      setSelectedUnlockItem(matchingCatalog);
      setVfxFeedbackToast({
        message: `🔒 "${matchingCatalog.name}" is locked. Unlock for 1,000 PTS to apply in main chess!`,
        type: 'info',
      });
      setTimeout(() => setVfxFeedbackToast((curr) => (curr?.type === 'info' ? null : curr)), 3500);
      return;
    }

    // IS OWNED! Trigger simulation live on e4 and equip for main game
    triggerSimulationVariation(piece, action, styleIndex, 'w');
    equipCatalogItem(matchingCatalog.piece, matchingCatalog.id);
    setEquippedMaster(getEquippedMasterEffects());

    setVfxFeedbackToast({
      message: `✨ Equipped "${matchingCatalog.name}" for ${matchingCatalog.piece}! Active in main chess.`,
      type: 'success',
    });
    setTimeout(() => setVfxFeedbackToast((curr) => (curr?.type === 'success' ? null : curr)), 3500);
  };

  // Direct 1-Click Unlock with Points
  const handleUnlockItemDirectly = (item: CatalogItem) => {
    const res = purchaseCatalogItem(item.id);
    if (res.success) {
      setMasterInventory(getMasterInventory());
      setEquippedMaster(getEquippedMasterEffects());
      setUserPointsState(getUserPoints());
      setSelectedUnlockItem(null);

      // Trigger live simulation on e4
      const pCode = item.pieceCode;
      const actionType = item.category.includes('Capture') ? 'capturing' : 'occupying';
      triggerSimulationVariation(pCode, actionType, item.variantIndex as 1 | 2 | 3 | 4, 'w');

      setVfxFeedbackToast({
        message: `🎉 Unlocked & equipped "${item.name}" for ${item.piece}! Active in main chess.`,
        type: 'success',
      });
      setTimeout(() => setVfxFeedbackToast(null), 4000);
    } else {
      setVfxFeedbackToast({
        message: res.message,
        type: 'error',
      });
      setTimeout(() => setVfxFeedbackToast(null), 4000);
    }
  };

  // Unequip specific piece
  const handleUnequipPiece = (piece: MasterPieceType) => {
    unequipCatalogItem(piece);
    setEquippedMaster(getEquippedMasterEffects());
    setVfxFeedbackToast({
      message: `Unequipped effect for ${piece}. Standard chess visuals restored.`,
      type: 'info',
    });
    setTimeout(() => setVfxFeedbackToast(null), 3000);
  };

  // Get legal move target squares for currently selected square
  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare || readOnly) return [];
    try {
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      return moves.map((m) => m.to as Square);
    } catch {
      return [];
    }
  }, [chess, selectedSquare, readOnly]);

  const clearAnnotations = () => {
    setArrows([]);
    setHighlightedSquares({} as any);
  };

  const handleSquareClick = (square: Square) => {
    // Clear user annotations on board interaction
    if (arrows.length > 0 || Object.keys(highlightedSquares).length > 0) {
      clearAnnotations();
    }

    if (readOnly) return;

    const piece = chess.get(square);
    const turn = chess.turn();

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (legalMovesForSelected.includes(square)) {
        if (soundEnabled && !vfxSettings.enabled) {
          if (piece) soundFx.playCapture();
          else soundFx.playMove();
        }
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled && !vfxSettings.enabled) soundFx.playMove();
        return;
      }

      setSelectedSquare(null);
    } else {
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled && !vfxSettings.enabled) soundFx.playMove();
      }
    }
  };

  // Right-Click Annotation Handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      e.preventDefault();
      rightClickStartSquareRef.current = square;
      isRightMouseDownRef.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2 && rightClickStartSquareRef.current) {
      e.preventDefault();
      const startSq = rightClickStartSquareRef.current;
      const endSq = square;

      let color: 'green' | 'red' | 'amber' | 'blue' = 'green';
      if (e.shiftKey) color = 'red';
      else if (e.altKey) color = 'amber';
      else if (e.ctrlKey || e.metaKey) color = 'blue';

      if (startSq === endSq) {
        setHighlightedSquares((prev) => {
          const next = { ...prev };
          if (next[startSq] === color) {
            delete next[startSq];
          } else {
            next[startSq] = color;
          }
          return next;
        });
      } else {
        setArrows((prev) => {
          const existingIdx = prev.findIndex((a) => a.from === startSq && a.to === endSq);
          if (existingIdx >= 0) {
            return prev.filter((_, idx) => idx !== existingIdx);
          } else {
            return [...prev, { from: startSq, to: endSq, color }];
          }
        });
      }

      rightClickStartSquareRef.current = null;
      isRightMouseDownRef.current = false;
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(square);
    setDraggedSquare(square);
    clearAnnotations();
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = (e.dataTransfer.getData('text/plain') || draggedSquare) as Square;
    if (sourceSquare && sourceSquare !== targetSquare) {
      const moves = chess.moves({ square: sourceSquare, verbose: true });
      const isValid = moves.some((m) => m.to === targetSquare);
      if (isValid) {
        onMove(sourceSquare, targetSquare);
      }
    }
    setSelectedSquare(null);
    setDraggedSquare(null);
  };

  const updateVfxSetting = <K extends keyof VfxSettings>(key: K, value: VfxSettings[K]) => {
    const next = saveVfxSettings({ [key]: value });
    setVfxSettings(next);
  };

  const theme = themeConfigs[boardTheme] || themeConfigs.emerald;
  const currentTurn = chess.turn();
  const hasAnnotations = arrows.length > 0 || Object.keys(highlightedSquares).length > 0;

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center select-none group/board relative">
      {/* Floating Micro-Toolbar for Board Enhancement & VFX */}
      <div className="w-full flex items-center justify-between px-2 py-1 mb-1.5 text-xs text-white/70">
        <div className="flex items-center gap-1.5">
          {/* Turn Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
            <div
              className={`w-2.5 h-2.5 rounded-full border border-white/30 ${
                currentTurn === 'w' ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-slate-900 border-white/40 shadow-[0_0_8px_#475569]'
              }`}
            />
            <span className="text-[11px] font-bold tracking-tight text-white/90">
              {currentTurn === 'w' ? 'White to Move' : 'Black to Move'}
            </span>
          </div>

          {/* King in Danger Badge */}
          {kingInCheckSquare && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 animate-pulse font-bold text-[10px]">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Check!</span>
            </div>
          )}

          {/* High Stress Threat Alert Pill */}
          {activeThreatTelemetry.totalHighStress > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-300 animate-pulse font-bold text-[10px] shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <span>😭 {activeThreatTelemetry.totalHighStress} Under 3+ Threats (+2,500 PTS)</span>
            </div>
          )}
        </div>

        {/* Board Controls & VFX Action Button */}
        <div className="flex items-center gap-1">
          {/* CINEMATIC VFX & ANIMATION QUICK-CONTROL BUTTON */}
          <button
            onClick={() => setShowVfxPanel(!showVfxPanel)}
            className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition border ${
              vfxSettings.enabled
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-amber-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Cinematic VFX & Signature Physics Settings (Off by Default)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">VFX</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-200">
              {vfxSettings.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {hasAnnotations && (
            <button
              onClick={clearAnnotations}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1 transition"
              title="Clear Tactical Annotations & Arrows"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {onChangeTheme && (
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition flex items-center gap-1"
                title="Change Board Theme"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              {showThemePicker && (
                <div className="absolute right-0 top-8 z-50 bg-slate-900/95 border border-white/15 backdrop-blur-xl rounded-xl p-2 shadow-2xl w-48 space-y-1 animate-fadeIn">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1 mb-1">
                    Board Themes
                  </span>
                  {(Object.keys(themeConfigs) as BoardTheme[]).map((tKey) => (
                    <button
                      key={tKey}
                      onClick={() => {
                        onChangeTheme(tKey);
                        setShowThemePicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition ${
                        boardTheme === tKey
                          ? 'bg-indigo-500/30 border border-indigo-400 text-white'
                          : 'hover:bg-white/10 text-white/70'
                      }`}
                    >
                      <span>{themeConfigs[tKey].name}</span>
                      <div className={`w-3 h-3 rounded-full border border-white/30 ${themeConfigs[tKey].dark}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowCoordinates(!showCoordinates)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
            title={showCoordinates ? 'Hide Algebraic Coordinates' : 'Show Algebraic Coordinates'}
          >
            {showCoordinates ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              updateVfxSetting('soundEnabled', next);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
            title={soundEnabled ? 'Mute Board Sound FX' : 'Enable Board Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {onFlipOrientation && (
            <button
              onClick={onFlipOrientation}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
              title="Flip Board View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive VFX Controls Drawer / Panel */}
      <AnimatePresence>
        {showVfxPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="w-full mb-2 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Cinematic VFX & Physics (Active in Main Game)
                </span>
              </div>
              <button
                onClick={() => setShowVfxPanel(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {/* Master Toggle */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">VFX Status</span>
                <button
                  onClick={() => updateVfxSetting('enabled', !vfxSettings.enabled)}
                  className={`py-1 px-2 rounded-lg font-black text-[11px] transition ${
                    vfxSettings.enabled
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {vfxSettings.enabled ? 'ACTIVE (ON)' : 'DISABLED'}
                </button>
              </div>

              {/* Animation Speed */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Speed: {vfxSettings.animSpeed}x</span>
                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateVfxSetting('animSpeed', s)}
                      className={`flex-1 py-1 rounded text-[10px] font-black transition ${
                        vfxSettings.animSpeed === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Particle Sparks Density */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Sparks: {vfxSettings.particleDensity}</span>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="6"
                  value={vfxSettings.particleDensity}
                  onChange={(e) => updateVfxSetting('particleDensity', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Screen / Board Shake */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Board Shake</span>
                <button
                  onClick={() => updateVfxSetting('screenShake', !vfxSettings.screenShake)}
                  className={`py-1 px-2 rounded-lg font-black text-[11px] transition ${
                    vfxSettings.screenShake
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {vfxSettings.screenShake ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              {/* 96-State Style Mode Selector */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-cyan-500/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-cyan-300 font-black">96-State Mode</span>
                <select
                  value={vfxSettings.animStyleMode || 'dynamic'}
                  onChange={(e) =>
                    updateVfxSetting(
                      'animStyleMode',
                      e.target.value === 'dynamic' ? 'dynamic' : (Number(e.target.value) as 1 | 2 | 3 | 4)
                    )
                  }
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1 text-[10px] font-bold text-white focus:outline-none"
                >
                  <option value="dynamic">✨ Auto-Cycle (1-4)</option>
                  <option value="1">Style 1 (Dissolve / Gate)</option>
                  <option value="2">Style 2 (Spin Vortex / Gold)</option>
                  <option value="3">Style 3 (Shatter / Solar)</option>
                  <option value="4">Style 4 (Singularity / Sweep)</option>
                </select>
              </div>
            </div>

            {/* 96-State Variation Matrix Live Trigger Toolbar */}
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    96 Variations Matrix:
                  </span>

                  {/* Piece Filter Selector */}
                  <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                    {(['P', 'N', 'B', 'R', 'Q', 'K'] as PieceElementCode[]).map((pCode) => (
                      <button
                        key={pCode}
                        onClick={() => setTesterPieceFilter(pCode)}
                        className={`w-6 h-6 rounded font-black text-[11px] transition ${
                          testerPieceFilter === pCode
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#00f2fe]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {pCode}
                      </button>
                    ))}
                  </div>

                  {/* Action Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setTesterActionFilter('capturing')}
                      className={`px-2 py-1 rounded text-[10px] font-black transition ${
                        testerActionFilter === 'capturing'
                          ? 'bg-rose-500 text-white shadow-[0_0_8px_#ef4444]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚔️ Capture
                    </button>
                    <button
                      onClick={() => setTesterActionFilter('occupying')}
                      className={`px-2 py-1 rounded text-[10px] font-black transition ${
                        testerActionFilter === 'occupying'
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛡️ Occupy
                    </button>
                    <button
                      onClick={() => setTesterActionFilter('cry')}
                      className={`px-2 py-1 rounded text-[10px] font-black transition ${
                        testerActionFilter === 'cry'
                          ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      😭 Cry (2.5k PTS)
                    </button>
                  </div>
                </div>

                {/* Purchased Only Toggle & Count */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterPurchasedOnly(!filterPurchasedOnly)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                      filterPurchasedOnly
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-950/80 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3 text-emerald-400" />
                    <span>{filterPurchasedOnly ? 'Filter: Purchased Only' : 'Show All 96'}</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[9px] font-black text-emerald-200">
                      {getPurchasedItemsCount()}/96
                    </span>
                  </button>
                </div>
              </div>

              {/* Styles Trigger & Equip Grid or Dedicated Cry State Card */}
              {testerActionFilter === 'cry' ? (
                (() => {
                  const crySpec = CRY_STATES_MATRIX.find((c) => c.piece === testerPieceFilter);
                  const matchingCatalog = crySpec ? findCatalogItem(testerPieceFilter, 'cry', 1) || null : null;
                  const isOwned = matchingCatalog ? Boolean(masterInventory[matchingCatalog.id]) : false;
                  const isEquipped = matchingCatalog ? equippedMaster[matchingCatalog.piece] === matchingCatalog.id : false;

                  if (!crySpec) return null;

                  return (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1b1206] via-[#241708] to-[#140e06] border-2 border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-serif text-white shadow-lg border"
                          style={{
                            backgroundColor: `${crySpec.colorAccent}25`,
                            borderColor: crySpec.colorAccent,
                          }}
                        >
                          {crySpec.piece === 'P'
                            ? '♟'
                            : crySpec.piece === 'N'
                            ? '♞'
                            : crySpec.piece === 'B'
                            ? '♝'
                            : crySpec.piece === 'R'
                            ? '♜'
                            : crySpec.piece === 'Q'
                            ? '♛'
                            : '♚'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-300">{crySpec.name}</span>
                            <span className="px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                              {crySpec.pointsValue.toLocaleString()} PTS
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-tight mt-0.5">{crySpec.description}</p>
                          <div className="text-[9px] font-mono text-cyan-300 mt-0.5">
                            {crySpec.animationTitle} • {crySpec.effectModifierTitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            playCinematicSound(crySpec.soundType);
                            setVfxFeedbackToast({
                              message: `🔊 Playing ${crySpec.pieceName} Synthesized Cry Audio`,
                              type: 'info',
                            });
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-cyan-400/40 flex items-center gap-1 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Sound</span>
                        </button>

                        <button
                          onClick={() => {
                            const res = triggerPieceCryState(crySpec.piece, 'e4');
                            addPoints(2500, `Simulated High-Stress Cry (${crySpec.piece})`);
                            setUserPointsState(getUserPoints());
                            
                            const coords = getSquareCoords('e4');
                            triggerParticleBurst(coords.x, coords.y, [crySpec.colorAccent, '#00d2ff', '#ffffff', '#ef4444'], 36);

                            const shockId = Date.now();
                            setShockwaves((prev) => [
                              ...prev,
                              {
                                id: shockId,
                                x: coords.x,
                                y: coords.y,
                                color: crySpec.colorAccent,
                                glowColor: crySpec.colorAccent,
                                size: coords.size,
                              },
                            ]);
                            setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 800);

                            const badgeId = Date.now();
                            setFloatingBadges((prev) => [
                              ...prev,
                              {
                                id: badgeId,
                                x: coords.x,
                                y: coords.y,
                                text: `😭 ${crySpec.name}: +2,500 PTS`,
                                color: 'text-amber-300 font-black',
                                bg: 'bg-gradient-to-r from-amber-950/95 to-slate-950/95',
                                border: 'border-amber-400',
                              },
                            ]);
                            setTimeout(() => setFloatingBadges((prev) => prev.filter((b) => b.id !== badgeId)), 1400);

                            const ghostId = Date.now();
                            setCryGhosts((prev) => [
                              ...prev,
                              {
                                id: ghostId,
                                square: 'e4',
                                pieceType: crySpec.piece.toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
                                pieceColor: 'w',
                              },
                            ]);
                            setTimeout(() => setCryGhosts((prev) => prev.filter((cg) => cg.id !== ghostId)), 1200);

                            if (vfxSettings.screenShake) {
                              setIsBoardShaking(true);
                              setTimeout(() => setIsBoardShaking(false), 420);
                            }

                            setVfxFeedbackToast({
                              message: `😭 Triggered ${crySpec.name}! 3D Tears Streaming & +2,500 PTS Awarded!`,
                              type: 'success',
                            });
                            setTimeout(() => setVfxFeedbackToast((curr) => (curr?.type === 'success' ? null : curr)), 3500);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1.5 transition active:scale-95 border border-amber-300"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Trigger Cry State (+2,500 PTS)</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((sIndex) => {
                    const matchingSpec = VARIATIONS_96_MATRIX.find(
                      (v) =>
                        v.piece === testerPieceFilter &&
                        v.action === testerActionFilter &&
                        v.styleIndex === sIndex
                    );
                    const matchingCatalog = findCatalogItem(
                      testerPieceFilter,
                      testerActionFilter,
                      sIndex as 1 | 2 | 3 | 4
                    );
                    const isOwned = matchingCatalog ? Boolean(masterInventory[matchingCatalog.id]) : false;
                    const isEquipped = matchingCatalog
                      ? equippedMaster[matchingCatalog.piece] === matchingCatalog.id
                      : false;

                    if (filterPurchasedOnly && !isOwned) {
                      return (
                        <div
                          key={sIndex}
                          className="p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-white/10 flex flex-col justify-center items-center text-center opacity-40 py-4"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-500 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500">Style {sIndex} Locked</span>
                          <span className="text-[8px] text-slate-600">1,000 PTS</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={sIndex}
                        onClick={() =>
                          handleSelectOrTriggerVariation(
                            testerPieceFilter,
                            testerActionFilter,
                            sIndex as 1 | 2 | 3 | 4
                          )
                        }
                        style={{
                          borderColor: isOwned ? matchingSpec?.colorAccent || '#00f2fe' : 'rgba(255,255,255,0.12)',
                        }}
                        className={`p-2.5 rounded-xl text-left transition transform hover:-translate-y-0.5 active:scale-95 group flex flex-col justify-between gap-1.5 shadow-md relative overflow-hidden ${
                          isOwned
                            ? isEquipped
                              ? 'bg-gradient-to-br from-slate-900 to-emerald-950/40 border-2 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                              : 'bg-slate-950/90 hover:bg-slate-900 border'
                            : 'bg-slate-950/60 hover:bg-slate-900/80 border border-dashed hover:border-amber-400/50'
                        }`}
                      >
                        {/* Top Header: Style Number + Ownership Status */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-[11px] font-black ${
                              isOwned ? 'text-white group-hover:text-cyan-300' : 'text-slate-300'
                            }`}
                          >
                            Style {sIndex}
                          </span>

                          {isOwned ? (
                            isEquipped ? (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 flex items-center gap-0.5 shadow-sm">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> EQUIPPED
                              </span>
                            ) : (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                                ✨ OWNED
                              </span>
                            )
                          ) : (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
                              <Lock className="w-2 h-2" /> 1,000 PTS
                            </span>
                          )}
                        </div>

                        {/* Animation Technical Tag */}
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                            style={{
                              backgroundColor: `${matchingSpec?.colorAccent || '#fff'}20`,
                              color: matchingSpec?.colorAccent || '#fff',
                            }}
                          >
                            {matchingSpec?.animationName.replace('anim-core-', '')}
                          </span>
                        </div>

                        <span className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                          {matchingSpec?.description || 'Custom piece state'}
                        </span>

                        {/* Bottom Hint */}
                        <div className="text-[8px] font-bold text-slate-500 group-hover:text-slate-300 mt-0.5 flex items-center gap-1">
                          {isOwned ? (
                            isEquipped ? (
                              <span className="text-emerald-400">✓ Active in main game</span>
                            ) : (
                              <span>▶ Click to test & equip</span>
                            )
                          ) : (
                            <span className="text-amber-400/80">🔒 Click to unlock (1k PTS)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Equipped Piece Loadout Summary Tray */}
              <div className="mt-1 p-2 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Equipped Loadout for Main Chess:
                  </span>
                  {onOpenMasterHub && (
                    <button
                      onClick={onOpenMasterHub}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                    >
                      <ShoppingBag className="w-2.5 h-2.5" />
                      Open Full 96 FX Hub
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(
                    [
                      { code: 'P', name: 'Pawn', icon: '♟' },
                      { code: 'N', name: 'Knight', icon: '♞' },
                      { code: 'B', name: 'Bishop', icon: '♝' },
                      { code: 'R', name: 'Rook', icon: '♜' },
                      { code: 'Q', name: 'Queen', icon: '♛' },
                      { code: 'K', name: 'King', icon: '♚' },
                    ] as const
                  ).map((pInfo) => {
                    const equippedItem = getEquippedItemForPiece(pInfo.code);
                    return (
                      <div
                        key={pInfo.code}
                        className={`p-1.5 rounded-lg border text-[9px] flex flex-col justify-between transition ${
                          equippedItem
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-900/60 border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span>{pInfo.icon}</span> {pInfo.name}
                          </span>
                          {equippedItem && (
                            <button
                              onClick={() => handleUnequipPiece(pInfo.name as MasterPieceType)}
                              title="Unequip effect"
                              className="text-slate-400 hover:text-rose-400"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <span className="truncate text-[8px] font-mono mt-0.5">
                          {equippedItem ? equippedItem.name : 'Standard (None)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Feedback Toast */}
      <AnimatePresence>
        {vfxFeedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`w-full mb-2 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xl backdrop-blur-md z-40 ${
              vfxFeedbackToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : vfxFeedbackToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900/95 border-amber-400/50 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
            }`}
          >
            <span>{vfxFeedbackToast.message}</span>
            <button
              onClick={() => setVfxFeedbackToast(null)}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant 1-Click Unlock / Purchase Modal */}
      <AnimatePresence>
        {selectedUnlockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedUnlockItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                  style={{
                    backgroundColor: `${selectedUnlockItem.glowColor}25`,
                    borderColor: selectedUnlockItem.glowColor,
                  }}
                >
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Unlock Cinematic Effect
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">
                    {selectedUnlockItem.name}
                  </h3>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 mb-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Piece:</span>
                  <span className="font-bold text-white">{selectedUnlockItem.piece}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-cyan-300">{selectedUnlockItem.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Animation Style:</span>
                  <span className="font-bold text-purple-300">Style #{selectedUnlockItem.variantIndex}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 pt-2 border-t border-white/10 leading-relaxed">
                  {selectedUnlockItem.desc}
                </p>
              </div>

              {/* Price & Balance Row */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-400/30 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                    Unlock Price
                  </span>
                  <span className="text-lg font-black text-amber-400">
                    {((selectedUnlockItem.price) || 5000).toLocaleString()} PTS
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Your Points
                  </span>
                  <span
                    className={`text-lg font-black ${
                      userPoints >= (selectedUnlockItem.price || 5000) ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {userPoints.toLocaleString()} PTS
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {userPoints >= (selectedUnlockItem.price || 5000) ? (
                <button
                  onClick={() => handleUnlockItemDirectly(selectedUnlockItem)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)] transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock & Equip to Chess Board</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold text-center">
                    You need {(((selectedUnlockItem.price || 5000) - userPoints)).toLocaleString()} more PTS to unlock this effect!
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {onOpenDailyWheel && (
                      <button
                        onClick={() => {
                          setSelectedUnlockItem(null);
                          onOpenDailyWheel();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
                      >
                        <span>🎡 Daily Wheel</span>
                      </button>
                    )}
                    {onOpenQuests && (
                      <button
                        onClick={() => {
                          setSelectedUnlockItem(null);
                          onOpenQuests();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
                      >
                        <span>📜 Daily Quests</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Luxury Board Frame with Jolt Shake */}
      <div
        ref={boardRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{ boxShadow: `0 20px 50px -10px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.1)` }}
        className={`w-full aspect-square relative select-none p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br ${theme.outerRing} border-2 ${theme.border} transition-all duration-300 ${
          isBoardShaking ? 'shake-active' : ''
        }`}
      >
        {/* Subtle Inner Bevel Container */}
        <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden shadow-2xl border border-white/15">
          {displayedRanks.map((rank, rIdx) =>
            displayedFiles.map((file, fIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (rIdx + fIdx) % 2 === 0;
              const piece = chess.get(square);

              const isSelected = selectedSquare === square;
              const isLegalTarget = showLegalMoves && legalMovesForSelected.includes(square);
              const isLastMoveSquare =
                showLastMove &&
                lastMove &&
                (lastMove.from === square || lastMove.to === square);
              const isKingInCheck = kingInCheckSquare === square;
              const isHovered = hoveredSquare === square;
              const squareCircleHighlight = highlightedSquares[square];

              return (
                <div
                  key={square}
                  data-square={square}
                  onClick={() => handleSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onMouseUp={(e) => handleMouseUp(e, square)}
                  onMouseEnter={() => setHoveredSquare(square)}
                  onMouseLeave={() => setHoveredSquare(null)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                    isLight ? theme.light : theme.dark
                  }`}
                >
                  {/* Subtle Square Hover Highlight */}
                  {isHovered && !isSelected && (
                    <div className="absolute inset-0 bg-white/10 z-5 pointer-events-none transition" />
                  )}

                  {/* Last Move Aura */}
                  {isLastMoveSquare && (
                    <div className="absolute inset-0 bg-[#baca44]/75 z-0 animate-fadeIn" />
                  )}

                  {/* Selected Square Golden Glow Plate */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#f7f769]/85 border-2 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.6)] z-10" />
                  )}

                  {/* King Danger Zone / Check Shockwave */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-600/75 animate-pulse border-2 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.95),inset_0_0_15px_rgba(239,68,68,0.8)] z-10">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <Crosshair className="w-full h-full text-red-200 animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                    </div>
                  )}

                  {/* Right-Click Circular Tactical Ring */}
                  {squareCircleHighlight && (
                    <div
                      className="absolute inset-1 rounded-full border-4 pointer-events-none z-15 animate-scaleIn"
                      style={{
                        borderColor: ARROW_COLORS[squareCircleHighlight],
                        boxShadow: `0 0 12px ${ARROW_COLORS[squareCircleHighlight]}`,
                        backgroundColor: `${ARROW_COLORS[squareCircleHighlight]}25`,
                      }}
                    />
                  )}

                  {/* Algebraic Rank Coordinate */}
                  {showCoordinates && fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-black font-mono select-none pointer-events-none z-15 ${
                        isLight ? theme.lightText : theme.darkText
                      }`}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Algebraic File Coordinate */}
                  {showCoordinates && rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-black font-mono select-none pointer-events-none z-15 ${
                        isLight ? theme.lightText : theme.darkText
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Chess Piece Vector Render with Spring Animations, 96-State Occupying Classes & 3D High-Stress Tear-Cry States */}
                  {piece && (() => {
                    const equippedItem = getEquippedItemForPiece(piece.type);
                    const stressThreat = highStressThreatMap[square];
                    const isUnderHeavyThreat = Boolean(stressThreat && stressThreat.isHighStress);

                    return (
                      <motion.div
                        layoutId={pieceIds[square] || `${piece.color}_${piece.type}_${square}`}
                        data-piece={piece.type.toUpperCase()}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 26,
                          mass: 0.7,
                        }}
                        draggable={!readOnly && piece.color === chess.turn()}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, square)}
                        style={
                          equippedItem
                            ? {
                                filter: isSelected
                                  ? `drop-shadow(0 0 12px ${equippedItem.glowColor})`
                                  : `drop-shadow(0 0 5px ${equippedItem.glowColor}80)`,
                              }
                            : undefined
                        }
                        className={`relative w-full h-full z-20 p-0.5 sm:p-1 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                          occupyingSquare?.square === square && equippedItem
                            ? `piece-occupying style-${occupyingSquare.styleIndex}`
                            : ''
                        } ${
                          isSelected ? 'scale-110 -translate-y-1 drop-shadow-2xl' : 'hover:scale-105'
                        }`}
                      >
                        <div
                          className={`piece-wrapper ${isUnderHeavyThreat ? 'under-attack' : ''}`}
                          data-current={piece.type.toUpperCase()}
                          data-piece={piece.type.toUpperCase()}
                        >
                          <ChessPiece
                            type={piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                            color={piece.color as 'w' | 'b'}
                          />
                          {isUnderHeavyThreat && (
                            <>
                              <div className="tear tear-left" />
                              <div className="tear tear-right" />
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* High-Stress Multi-Threat Badge Indicator */}
                  {(() => {
                    const stressThreat = highStressThreatMap[square];
                    if (!stressThreat || !stressThreat.isHighStress) return null;
                    return (
                      <div
                        title={`${stressThreat.pieceCode} is under simultaneous attack by ${stressThreat.attackerCount} enemy pieces (+2,500 PTS Cry Active)!`}
                        className="absolute top-0.5 right-0.5 z-30 px-1 py-0.2 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-amber-300 text-[8px] sm:text-[9px] font-black text-white shadow-[0_0_10px_#ef4444] animate-pulse flex items-center gap-0.5"
                      >
                        <span>⚠️ {stressThreat.attackerCount}⚔️</span>
                      </div>
                    );
                  })()}

                  {/* 96-State Captured Piece Dissolution / Shatter / Warp Ghosts */}
                  {captureGhosts
                    .filter((g) => g.square === square)
                    .map((ghost) => (
                      <div
                        key={ghost.id}
                        data-piece={ghost.pieceType.toUpperCase()}
                        className={`piece-capturing style-${ghost.styleIndex} absolute inset-0 z-30 pointer-events-none p-0.5 sm:p-1 flex items-center justify-center`}
                      >
                        <ChessPiece
                          type={ghost.pieceType}
                          color={ghost.pieceColor}
                        />
                      </div>
                    ))}

                  {/* Exclusive Cry State Overlay Animation */}
                  {cryGhosts
                    .filter((c) => c.square === square)
                    .map((cg) => (
                      <div
                        key={cg.id}
                        data-piece={cg.pieceType.toUpperCase()}
                        className="piece-cry absolute inset-0 z-35 pointer-events-none p-0.5 sm:p-1 flex items-center justify-center"
                      >
                        <ChessPiece
                          type={cg.pieceType}
                          color={cg.pieceColor}
                        />
                      </div>
                    ))}

                  {/* 96-State Real-Time Simulation Showcase Target */}
                  {simulationTarget && simulationTarget.square === square && (
                    <div
                      key={simulationTarget.id}
                      data-piece={simulationTarget.piece}
                      className={`piece-${simulationTarget.action} style-${simulationTarget.styleIndex} absolute inset-0 z-35 pointer-events-none p-0.5 sm:p-1 flex items-center justify-center`}
                    >
                      <ChessPiece
                        type={simulationTarget.piece.toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                        color={simulationTarget.color}
                      />
                    </div>
                  )}

                  {/* High-Precision Legal Move Indicators */}
                  {isLegalTarget && (
                    <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
                      {piece ? (
                        /* Capture Target Lock Ring */
                        <div className="absolute inset-1 rounded-xl border-4 border-red-500 bg-red-500/25 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center justify-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_10px_#f87171] border border-white/60" />
                        </div>
                      ) : (
                        /* Empty Square Destination Dot with Glowing Halo */
                        <div className="relative flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/40 animate-ping absolute" />
                          <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 bg-indigo-400 rounded-full shadow-[0_0_14px_#818cf8] border-2 border-white/80" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Shockwave Rings Layer */}
          {shockwaves.map((sw) => (
            <div
              key={sw.id}
              className="absolute rounded-full pointer-events-none z-30"
              style={{
                left: `${sw.x}px`,
                top: `${sw.y}px`,
                border: `3px solid ${sw.color}`,
                color: sw.color,
                animation: `shockwaveExpand ${0.75 / (vfxSettings.animSpeed || 1)}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
              }}
            />
          ))}

          {/* Floating Evaluation Badges */}
          {floatingBadges.map((badge) => (
            <div
              key={badge.id}
              className={`absolute z-40 px-2 py-0.5 rounded-full border text-[11px] font-black pointer-events-none backdrop-blur-md shadow-2xl flex items-center gap-1 ${badge.color} ${badge.bg} ${badge.border}`}
              style={{
                left: `${badge.x}px`,
                top: `${badge.y}px`,
                animation: `badgeFloatUp ${1.0 / (vfxSettings.animSpeed || 1)}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
              }}
            >
              <span>{badge.text}</span>
            </div>
          ))}

          {/* Canvas Particles Layer */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-35"
          />

          {/* SVG Tactical Arrows Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
              <marker id="arrowhead-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#ef4444" />
              </marker>
              <marker id="arrowhead-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#f59e0b" />
              </marker>
              <marker id="arrowhead-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#3b82f6" />
              </marker>
              <marker id="arrowhead-lastmove" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#818cf8" />
              </marker>
            </defs>

            {/* Last Move Trajectory Line */}
            {showLastMove && lastMove && (
              <line
                x1={`${((displayedFiles as readonly string[]).indexOf(lastMove.from[0]) + 0.5) * 12.5}%`}
                y1={`${((displayedRanks as readonly string[]).indexOf(lastMove.from[1]) + 0.5) * 12.5}%`}
                x2={`${((displayedFiles as readonly string[]).indexOf(lastMove.to[0]) + 0.5) * 12.5}%`}
                y2={`${((displayedRanks as readonly string[]).indexOf(lastMove.to[1]) + 0.5) * 12.5}%`}
                stroke="#818cf8"
                strokeWidth="4"
                strokeDasharray="6 3"
                strokeOpacity="0.85"
                markerEnd="url(#arrowhead-lastmove)"
              />
            )}

            {/* User Tactical Annotation Arrows */}
            {arrows.map((arrow, idx) => {
              const x1 = ((displayedFiles as readonly string[]).indexOf(arrow.from[0]) + 0.5) * 12.5;
              const y1 = ((displayedRanks as readonly string[]).indexOf(arrow.from[1]) + 0.5) * 12.5;
              const x2 = ((displayedFiles as readonly string[]).indexOf(arrow.to[0]) + 0.5) * 12.5;
              const y2 = ((displayedRanks as readonly string[]).indexOf(arrow.to[1]) + 0.5) * 12.5;

              return (
                <line
                  key={`arrow-${idx}-${arrow.from}-${arrow.to}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={ARROW_COLORS[arrow.color]}
                  strokeWidth="5"
                  strokeOpacity="0.9"
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${arrow.color})`}
                  style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.6))` }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Helper Hint */}
      <div className="w-full text-center mt-2 flex items-center justify-center gap-2">
        <p className="text-[10px] text-white/40 font-medium">
          💡 <span className="text-white/60">Tip:</span> Cinematic VFX is <span className="text-cyan-400 font-bold">Enabled by Default</span> • Click ⚡ VFX for quick-tuning
        </p>
      </div>
    </div>
  );
};
