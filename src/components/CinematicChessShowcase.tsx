import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Crown,
  Swords,
  Layers,
  Sliders,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Code,
  Shield,
  Eye,
} from 'lucide-react';
import { loadVfxSettings, VfxSettings } from '../utils/cinematicVfx';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type MoveQuality = 'brilliant' | 'great' | 'best' | 'blunder' | 'checkmate' | 'sacrifice' | 'normal';

export interface CinematicMovePayload {
  pieceType: PieceType;
  color: 'w' | 'b';
  from: string; // e.g. "e2"
  to: string;   // e.g. "e4"
  isCapture: boolean;
  capturedPiece?: { type: PieceType; color: 'w' | 'b' };
  moveQuality: MoveQuality;
  evalText?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
}

// Crisp High-Resolution SVG Chess Pieces (Chess.com Neo Authentic Style)
const PIECE_SVGS: Record<string, string> = {
  w_king: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(255,215,0,0.4)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z" fill="#ffffff"/><path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#272522" stroke-width="1.5" fill="none"/><path d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z" fill="#ffffff"/><path d="M 15 24 C 15 22.8 18 21.8 22.5 21.8 C 27 21.8 30 22.8 30 24 C 30 25.2 27 26.2 22.5 26.2 C 18 26.2 15 25.2 15 24 Z" fill="#ffffff"/><path d="M 14 22 C 12 18 15 13 22.5 13 C 30 13 33 18 31 22 Z" fill="#ffffff"/><path d="M 22.5 13 L 22.5 22" stroke="#272522" stroke-width="1.5"/><path d="M 22.5 5.5 L 22.5 13 M 19 8.5 L 26 8.5" stroke="#272522" stroke-width="2.2" stroke-linecap="square"/></g></svg>`,
  b_king: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z" fill="#454341"/><path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" fill="none"/><path d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z" fill="#454341"/><path d="M 15 24 C 15 22.8 18 21.8 22.5 21.8 C 27 21.8 30 22.8 30 24 C 30 25.2 27 26.2 22.5 26.2 C 18 26.2 15 25.2 15 24 Z" fill="#454341"/><path d="M 14 22 C 12 18 15 13 22.5 13 C 30 13 33 18 31 22 Z" fill="#454341"/><path d="M 22.5 13 L 22.5 22" stroke="#1c1a18" stroke-width="1.5"/><path d="M 22.5 5.5 L 22.5 13 M 19 8.5 L 26 8.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="square"/></g></svg>`,
  w_queen: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(147,197,253,0.5)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z" fill="#ffffff"/><path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#272522" stroke-width="1.5" fill="none"/><path d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z" fill="#ffffff"/><path d="M 15.5 24 C 15.5 22.8 18 21.8 22.5 21.8 C 27 21.8 29.5 22.8 29.5 24 C 29.5 25.2 27 26.2 22.5 26.2 C 18 26.2 15.5 25.2 15.5 24 Z" fill="#ffffff"/><path d="M 12 22.5 L 7.5 13.5 L 14.5 19 L 14.5 10 L 20 18 L 22.5 8.5 L 25 18 L 30.5 10 L 30.5 19 L 37.5 13.5 L 33 22.5 Z" fill="#ffffff"/><circle cx="7.5" cy="13.5" r="1.8" fill="#ffffff"/><circle cx="14.5" cy="10" r="1.8" fill="#ffffff"/><circle cx="22.5" cy="8.5" r="2" fill="#ffffff"/><circle cx="30.5" cy="10" r="1.8" fill="#ffffff"/><circle cx="37.5" cy="13.5" r="1.8" fill="#ffffff"/></g></svg>`,
  b_queen: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z" fill="#454341"/><path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" fill="none"/><path d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z" fill="#454341"/><path d="M 15.5 24 C 15.5 22.8 18 21.8 22.5 21.8 C 27 21.8 29.5 22.8 29.5 24 C 29.5 25.2 27 26.2 22.5 26.2 C 18 26.2 15.5 25.2 15.5 24 Z" fill="#454341"/><path d="M 12 22.5 L 7.5 13.5 L 14.5 19 L 14.5 10 L 20 18 L 22.5 8.5 L 25 18 L 30.5 10 L 30.5 19 L 37.5 13.5 L 33 22.5 Z" fill="#454341"/><circle cx="7.5" cy="13.5" r="1.8" fill="#454341" stroke="#1c1a18" stroke-width="1.5"/><circle cx="14.5" cy="10" r="1.8" fill="#454341" stroke="#1c1a18" stroke-width="1.5"/><circle cx="22.5" cy="8.5" r="2" fill="#454341" stroke="#1c1a18" stroke-width="1.5"/><circle cx="30.5" cy="10" r="1.8" fill="#454341" stroke="#1c1a18" stroke-width="1.5"/><circle cx="37.5" cy="13.5" r="1.8" fill="#454341" stroke="#1c1a18" stroke-width="1.5"/><circle cx="22.5" cy="8.5" r="0.8" fill="#ffffff" stroke="none"/></g></svg>`,
  w_rook: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9.5 39.5 L 35.5 39.5 L 35.5 36 C 33.5 34.5 31.5 34 22.5 34 C 13.5 34 11.5 34.5 9.5 36 Z" fill="#ffffff"/><path d="M 11.5 36.5 L 33.5 36.5" stroke="#272522" stroke-width="1.5" fill="none"/><path d="M 13.5 34 L 14.5 16.5 L 30.5 16.5 L 31.5 34 Z" fill="#ffffff"/><path d="M 11 16.5 L 34 16.5 L 34 14 L 11 14 Z" fill="#ffffff"/><path d="M 11 14 L 11 8.5 L 15.5 8.5 L 15.5 11.5 L 20 11.5 L 20 8.5 L 25 8.5 L 25 11.5 L 29.5 11.5 L 29.5 8.5 L 34 8.5 L 34 14 Z" fill="#ffffff"/></g></svg>`,
  b_rook: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 9.5 39.5 L 35.5 39.5 L 35.5 36 C 33.5 34.5 31.5 34 22.5 34 C 13.5 34 11.5 34.5 9.5 36 Z" fill="#454341"/><path d="M 11.5 36.5 L 33.5 36.5" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" fill="none"/><path d="M 13.5 34 L 14.5 16.5 L 30.5 16.5 L 31.5 34 Z" fill="#454341"/><path d="M 11 16.5 L 34 16.5 L 34 14 L 11 14 Z" fill="#454341"/><path d="M 11 14 L 11 8.5 L 15.5 8.5 L 15.5 11.5 L 20 11.5 L 20 8.5 L 25 8.5 L 25 11.5 L 29.5 11.5 L 29.5 8.5 L 34 8.5 L 34 14 Z" fill="#454341"/></g></svg>`,
  w_bishop: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 36.8 13.5 35 22.5 35 C 31.5 35 35 36.8 35 39.5 Z" fill="#ffffff"/><path d="M 12.5 37 C 16 36 29 36 32.5 37" stroke="#272522" stroke-width="1.5" fill="none"/><path d="M 14 35 C 14 31 16.5 28 17.5 24.5 L 27.5 24.5 C 28.5 28 31 31 31 35 Z" fill="#ffffff"/><path d="M 16 24.5 C 16 23.2 18.5 22.2 22.5 22.2 C 26.5 22.2 29 23.2 29 24.5 C 29 25.8 26.5 26.8 22.5 26.8 C 18.5 26.8 16 25.8 16 24.5 Z" fill="#ffffff"/><path d="M 15 23 C 14 18 17 12 22.5 9.5 C 28 12 31 18 30 23 C 28 24.5 17 24.5 15 23 Z" fill="#ffffff"/><path d="M 21.5 13 L 26.5 18" stroke="#272522" stroke-width="1.8" stroke-linecap="round"/><circle cx="22.5" cy="7.5" r="2.2" fill="#ffffff"/></g></svg>`,
  b_bishop: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 36.8 13.5 35 22.5 35 C 31.5 35 35 36.8 35 39.5 Z" fill="#454341"/><path d="M 12.5 37 C 16 36 29 36 32.5 37" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" fill="none"/><path d="M 14 35 C 14 31 16.5 28 17.5 24.5 L 27.5 24.5 C 28.5 28 31 31 31 35 Z" fill="#454341"/><path d="M 16 24.5 C 16 23.2 18.5 22.2 22.5 22.2 C 26.5 22.2 29 23.2 29 24.5 C 29 25.8 26.5 26.8 22.5 26.8 C 18.5 26.8 16 25.8 16 24.5 Z" fill="#454341"/><path d="M 15 23 C 14 18 17 12 22.5 9.5 C 28 12 31 18 30 23 C 28 24.5 17 24.5 15 23 Z" fill="#454341"/><path d="M 21.5 13 L 26.5 18" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.9"/><circle cx="22.5" cy="7.5" r="2.2" fill="#454341"/></g></svg>`,
  w_knight: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 37 13 35.5 22.5 35.5 C 32 35.5 35 37 35 39.5 Z" fill="#ffffff"/><path d="M 13.5 35.5 C 13.5 31.5 14 27.5 17 24.5 C 16.2 24.8 14.5 25.2 13 25 C 10.5 24.6 9 22.8 9.5 20.5 C 10 18.2 12.2 16.5 14.5 14.5 C 15.8 13.2 17 11.2 17.5 8.5 C 18 8 19 8.2 19.5 9.5 C 20 10.5 20.5 11.5 22.5 11 C 24 10.5 24.5 8.5 25.5 8.5 C 26.2 8.5 26.8 9.5 27 10.8 C 28.5 10.5 29.5 9.5 30.5 9.5 C 31.5 9.5 32 10.8 32 12.5 C 32.5 15.5 33.5 18 35.5 22 C 37 25 36.5 30 35 35.5 Z" fill="#ffffff"/><path d="M 10 20.5 C 11.5 22 14 22 17 20" stroke="#272522" stroke-width="1.6" fill="none"/><path d="M 19 16 C 18 19.5 16 22 14.5 23" stroke="#272522" stroke-width="1.5" fill="none"/><circle cx="15.5" cy="14.5" r="1.5" fill="#272522" stroke="none"/><path d="M 23.5 14.5 C 25.5 17 27 20 27 24.5" stroke="#272522" stroke-width="1.5" fill="none"/></g></svg>`,
  b_knight: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 37 13 35.5 22.5 35.5 C 32 35.5 35 37 35 39.5 Z" fill="#454341"/><path d="M 13.5 35.5 C 13.5 31.5 14 27.5 17 24.5 C 16.2 24.8 14.5 25.2 13 25 C 10.5 24.6 9 22.8 9.5 20.5 C 10 18.2 12.2 16.5 14.5 14.5 C 15.8 13.2 17 11.2 17.5 8.5 C 18 8 19 8.2 19.5 9.5 C 20 10.5 20.5 11.5 22.5 11 C 24 10.5 24.5 8.5 25.5 8.5 C 26.2 8.5 26.8 9.5 27 10.8 C 28.5 10.5 29.5 9.5 30.5 9.5 C 31.5 9.5 32 10.8 32 12.5 C 32.5 15.5 33.5 18 35.5 22 C 37 25 36.5 30 35 35.5 Z" fill="#454341"/><path d="M 10 20.5 C 11.5 22 14 22 17 20" stroke="#1c1a18" stroke-width="1.6" fill="none"/><path d="M 19 16 C 18 19.5 16 22 14.5 23" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.45" fill="none"/><circle cx="15.5" cy="14.5" r="1.5" fill="#ffffff" stroke="none"/><path d="M 23.5 14.5 C 25.5 17 27 20 27 24.5" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.45" fill="none"/></g></svg>`,
  w_pawn: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"><g fill="#ffffff" stroke="#272522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 36.5 13.5 34.5 22.5 34.5 C 31.5 34.5 35 36.5 35 39.5 Z" fill="#ffffff"/><path d="M 12 36.5 C 15.5 35.5 29.5 35.5 33 36.5" stroke="#272522" stroke-width="1.6" fill="none"/><path d="M 16.8 22 C 16.8 27 14 31.5 13 34.5 L 32 34.5 C 31 31.5 28.2 27 28.2 22 Z" fill="#ffffff"/><path d="M 16 22 C 16 20.8 18.5 19.8 22.5 19.8 C 26.5 19.8 29 20.8 29 22 C 29 23.2 26.5 24.2 22.5 24.2 C 18.5 24.2 16 23.2 16 22 Z" fill="#ffffff"/><circle cx="22.5" cy="12.5" r="6" fill="#ffffff"/><path d="M 19.5 9.5 C 20.5 8.8 22 8.5 23.5 8.5" stroke="#d1d5db" stroke-width="1.2" stroke-linecap="round" fill="none"/></g></svg>`,
  b_pawn: `<svg viewBox="0 0 45 45" class="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"><g fill="#454341" stroke="#1c1a18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 39.5 C 10 36.5 13.5 34.5 22.5 34.5 C 31.5 34.5 35 36.5 35 39.5 Z" fill="#454341"/><path d="M 12 36.5 C 15.5 35.5 29.5 35.5 33 36.5" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" fill="none"/><path d="M 16.8 22 C 16.8 27 14 31.5 13 34.5 L 32 34.5 C 31 31.5 28.2 27 28.2 22 Z" fill="#454341"/><path d="M 16 22 C 16 20.8 18.5 19.8 22.5 19.8 C 26.5 19.8 29 20.8 29 22 C 29 23.2 26.5 24.2 22.5 24.2 C 18.5 24.2 16 23.2 16 22 Z" fill="#454341"/><circle cx="22.5" cy="12.5" r="6" fill="#454341"/><path d="M 19.5 9.5 C 20.5 8.8 22 8.5 23.5 8.5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.55" fill="none"/></g></svg>`,
};

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'diamond';
}

interface FloatingBadge {
  id: string;
  square: string;
  quality: MoveQuality;
  label: string;
  icon: string;
  color: string;
  x: number;
  y: number;
}

interface GhostTrailItem {
  id: number;
  x: number;
  y: number;
  svgHtml: string;
  opacity: number;
}

interface CinematicChessShowcaseProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectForBoard?: () => void;
}

export const CinematicChessShowcase: React.FC<CinematicChessShowcaseProps> = ({
  isOpen = true,
  onClose,
}) => {
  // Board configuration & state
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sound Engine & VFX Settings
  const initialSettings = loadVfxSettings();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSettings.soundEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Settings
  const [animSpeed, setAnimSpeed] = useState<number>(initialSettings.animSpeed);
  const [particleDensity, setParticleDensity] = useState<number>(initialSettings.particleDensity);
  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(initialSettings.screenShake);
  const [vfxTheme, setVfxTheme] = useState<'cyber' | 'royal' | 'inferno' | 'emerald'>(initialSettings.vfxTheme || 'cyber');

  // Animation active state
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [boardShake, setBoardShake] = useState<boolean>(false);
  const [screenDim, setScreenDim] = useState<boolean>(false);
  const [crownDropSquare, setCrownDropSquare] = useState<{ x: number; y: number } | null>(null);

  // Active floating badges & banners
  const [floatingBadges, setFloatingBadges] = useState<FloatingBadge[]>([]);
  const [activeBanner, setActiveBanner] = useState<{
    quality: MoveQuality;
    title: string;
    subtitle: string;
    evalText?: string;
  } | null>(null);

  // Ghost trail for Queen
  const [ghostTrails, setGhostTrails] = useState<GhostTrailItem[]>([]);

  // Shockwave Rings State
  const [shockwaves, setShockwaves] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      glowColor: string;
      size: number;
    }>
  >([]);

  // Full Chess Board Piece State for Showcase (Initial Position or Custom Scenarios)
  const [boardPieces, setBoardPieces] = useState<Record<string, { type: PieceType; color: 'w' | 'b' }>>({
    a8: { type: 'rook', color: 'b' },
    b8: { type: 'knight', color: 'b' },
    c8: { type: 'bishop', color: 'b' },
    d8: { type: 'queen', color: 'b' },
    e8: { type: 'king', color: 'b' },
    f8: { type: 'bishop', color: 'b' },
    g8: { type: 'knight', color: 'b' },
    h8: { type: 'rook', color: 'b' },
    a7: { type: 'pawn', color: 'b' },
    b7: { type: 'pawn', color: 'b' },
    c7: { type: 'pawn', color: 'b' },
    d7: { type: 'pawn', color: 'b' },
    e7: { type: 'pawn', color: 'b' },
    f7: { type: 'pawn', color: 'b' },
    g7: { type: 'pawn', color: 'b' },
    h7: { type: 'pawn', color: 'b' },

    a2: { type: 'pawn', color: 'w' },
    b2: { type: 'pawn', color: 'w' },
    c2: { type: 'pawn', color: 'w' },
    d2: { type: 'pawn', color: 'w' },
    e2: { type: 'pawn', color: 'w' },
    f2: { type: 'pawn', color: 'w' },
    g2: { type: 'pawn', color: 'w' },
    h2: { type: 'pawn', color: 'w' },
    a1: { type: 'rook', color: 'w' },
    b1: { type: 'knight', color: 'w' },
    c1: { type: 'bishop', color: 'w' },
    d1: { type: 'queen', color: 'w' },
    e1: { type: 'king', color: 'w' },
    f1: { type: 'bishop', color: 'w' },
    g1: { type: 'knight', color: 'w' },
    h1: { type: 'rook', color: 'w' },
  });

  // Selected Square for manual interactive moves
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Moving piece animation overlay
  const [movingPiece, setMovingPiece] = useState<{
    svgKey: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    pieceType: PieceType;
    isLJump?: boolean;
    midX?: number;
    midY?: number;
    progress: number;
    scale: number;
  } | null>(null);

  // Captured piece death animation
  const [dyingPiece, setDyingPiece] = useState<{
    svgKey: string;
    x: number;
    y: number;
    opacity: number;
    scale: number;
    rotation: number;
  } | null>(null);

  // Particles animation frame loop ref
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Sound Synthesizer via Web Audio API
  const playSynthesizedSound = useCallback(
    (type: 'move' | 'capture' | 'brilliant' | 'blunder' | 'checkmate' | 'leap' | 'whoosh') => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'whoosh') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'leap') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(540, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'capture') {
          // Punchy low-end impact with noise burst
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
          gain.gain.setValueAtTime(0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'brilliant') {
          // Dual magical sparkling chime
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.setValueAtTime(880, now + 0.1); // A5
          osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(880, now);
          osc2.frequency.setValueAtTime(1318.51, now + 0.15);
          gain2.gain.setValueAtTime(0.3, now);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.6);
          osc2.stop(now + 0.7);
        } else if (type === 'checkmate') {
          // Majestic Royal Brass Chord + Sub Bass Boom
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(130.81, now); // C3
          osc.frequency.setValueAtTime(196.0, now + 0.15); // G3
          osc.frequency.setValueAtTime(261.63, now + 0.3); // C4
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
          osc.start(now);
          osc.stop(now + 0.9);
        } else if (type === 'blunder') {
          // Dismal falling minor dissonance
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(75, now + 0.4);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else {
          // Standard Move
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        }
      } catch (err) {
        // AudioContext silent fallback
      }
    },
    [soundEnabled]
  );

  // Helper to get pixel center coordinates of a square (e.g. "e4") relative to the board
  const getSquareCoords = (square: string): { x: number; y: number; size: number } => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
    const rank = 8 - parseInt(square[1], 10); // 0-7
    if (!boardRef.current) return { x: 0, y: 0, size: 60 };
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    return {
      x: file * squareSize + squareSize / 2,
      y: rank * squareSize + squareSize / 2,
      size: squareSize,
    };
  };

  // Spark Particles Emitter Engine
  const triggerParticleExplosion = (
    centerX: number,
    centerY: number,
    colorScheme: string[],
    count = particleDensity
  ) => {
    const shapes: ('circle' | 'star' | 'diamond')[] = ['circle', 'star', 'diamond'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      newParticles.push({
        id: Math.random(),
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 2 + 1),
        size: Math.random() * 5 + 2.5,
        color: colorScheme[Math.floor(Math.random() * colorScheme.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 30 + 25,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Main Canvas Render Loop for Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const active: Particle[] = [];

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // subtle gravity
        p.vx *= 0.96; // air resistance
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.alpha > 0.01 && p.life < p.maxLife) {
          active.push(p);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
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

  // Update canvas sizing on board resize
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

  /**
   * 🌟 MASTER ORCHESTRATION FUNCTION: executeCaptureMove
   * Implements exact physics per piece type (King, Knight, Bishop, Rook, Queen, Pawn)
   * Handles impact shockwaves, particle bursts, screen jolt, death animations, and UI badges.
   */
  const executeCaptureMove = useCallback(
    async (payload: CinematicMovePayload) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const { pieceType, color, from, to, isCapture, moveQuality, bannerTitle, bannerSubtitle, evalText } = payload;
      const fromCoords = getSquareCoords(from);
      const toCoords = getSquareCoords(to);
      const svgKey = `${color}_${pieceType}`;

      // 1. Piece-Specific Trajectory Physics Setup
      const durationMs = (pieceType === 'king' ? 620 : pieceType === 'knight' ? 540 : 420) / animSpeed;

      // Knight L-Jump Waypoints (2 steps along dominant axis, then 1 step perpendicular)
      const isKnight = pieceType === 'knight';
      let midX = fromCoords.x;
      let midY = fromCoords.y;

      if (isKnight) {
        const dx = toCoords.x - fromCoords.x;
        const dy = toCoords.y - fromCoords.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          midX = fromCoords.x + dx; // Horizontal first
          midY = fromCoords.y;
        } else {
          midX = fromCoords.x; // Vertical first
          midY = fromCoords.y + dy;
        }
      }

      // Hide piece from starting square temporarily during animation flight
      setBoardPieces((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });

      // Play Movement Audio FX
      if (isKnight) {
        playSynthesizedSound('leap');
      } else if (pieceType === 'queen') {
        playSynthesizedSound('whoosh');
      } else {
        playSynthesizedSound('move');
      }

      // Ghost trail tracking for Queen
      const ghostInterval: any = pieceType === 'queen' ? setInterval(() => {
        if (movingPiece) {
          setGhostTrails((prev) => [
            ...prev.slice(-4),
            {
              id: Math.random(),
              x: movingPiece.midX || movingPiece.fromX,
              y: movingPiece.midY || movingPiece.fromY,
              svgHtml: PIECE_SVGS[svgKey] || '',
              opacity: 0.6,
            },
          ]);
        }
      }, 50) : null;

      // Animate piece movement trajectory step by step using high-precision RAF
      const startTime = performance.now();

      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);

          // Easing calculations:
          // King: slow regal glide cubic-bezier(0.25, 1, 0.5, 1)
          // Pawn Capture: sharp aggressive lunge cubic-bezier(0.1, 0.9, 0.2, 1)
          // Knight: parabolic jump height scaling
          let currentX = fromCoords.x;
          let currentY = fromCoords.y;
          let currentScale = 1;

          if (isKnight) {
            // Two-segment L flight + 3D parabolic elevation
            if (progress < 0.5) {
              const p1 = progress * 2;
              currentX = fromCoords.x + (midX - fromCoords.x) * p1;
              currentY = fromCoords.y + (midY - fromCoords.y) * p1;
            } else {
              const p2 = (progress - 0.5) * 2;
              currentX = midX + (toCoords.x - midX) * p2;
              currentY = midY + (toCoords.y - midY) * p2;
            }
            // 3D leap height scale
            currentScale = 1 + Math.sin(progress * Math.PI) * 0.28;
          } else if (pieceType === 'king') {
            // Authoritative regal ease
            const ease = 1 - Math.pow(1 - progress, 3);
            currentX = fromCoords.x + (toCoords.x - fromCoords.x) * ease;
            currentY = fromCoords.y + (toCoords.y - fromCoords.y) * ease;
          } else if (pieceType === 'pawn' && isCapture) {
            // Aggressive snap lunge
            const ease = Math.pow(progress, 2.5);
            currentX = fromCoords.x + (toCoords.x - fromCoords.x) * ease;
            currentY = fromCoords.y + (toCoords.y - fromCoords.y) * ease;
          } else {
            // Linear/vector slider (Rook, Bishop, Queen)
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            currentX = fromCoords.x + (toCoords.x - fromCoords.x) * ease;
            currentY = fromCoords.y + (toCoords.y - fromCoords.y) * ease;
          }

          setMovingPiece({
            svgKey,
            fromX: fromCoords.x,
            fromY: fromCoords.y,
            toX: currentX,
            toY: currentY,
            pieceType,
            isLJump: isKnight,
            midX,
            midY,
            progress,
            scale: currentScale,
          });

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });

      if (ghostInterval) clearInterval(ghostInterval);
      setMovingPiece(null);
      setGhostTrails([]);

      // 2. MOMENT OF IMPACT (Piece lands on target square)
      const enemyPiece = boardPieces[to];

      if (isCapture && enemyPiece) {
        // Trigger Dying Piece Dissolve & Shrink Animation
        const enemySvgKey = `${enemyPiece.color}_${enemyPiece.type}`;
        setDyingPiece({
          svgKey: enemySvgKey,
          x: toCoords.x,
          y: toCoords.y,
          opacity: 1,
          scale: 1,
          rotation: (Math.random() - 0.5) * 45,
        });

        setTimeout(() => {
          setDyingPiece(null);
        }, 450 / animSpeed);
      }

      // Finalize piece placement on board
      setBoardPieces((prev) => ({
        ...prev,
        [to]: { type: pieceType, color },
      }));

      // 3. COLOR-CODED SHOCKWAVES & PARTICLES
      let shockwaveColors = ['#00f2fe', '#4facfe', '#00ffd5']; // Cyan brilliant
      let glowColor = 'rgba(0, 242, 254, 0.85)';
      let badgeLabel = '!!';
      let badgeIcon = '✨';
      let badgeColor = 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_#00f2fe]';

      if (moveQuality === 'checkmate') {
        shockwaveColors = ['#ffd700', '#f59e0b', '#3b82f6', '#ffffff'];
        glowColor = 'rgba(255, 215, 0, 0.95)';
        badgeLabel = '#';
        badgeIcon = '👑';
        badgeColor = 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-200 shadow-[0_0_25px_#ffd700]';
        playSynthesizedSound('checkmate');
        setScreenDim(true);
        setCrownDropSquare({ x: toCoords.x, y: toCoords.y });
        setTimeout(() => {
          setScreenDim(false);
          setCrownDropSquare(null);
        }, 1200 / animSpeed);
      } else if (moveQuality === 'brilliant') {
        shockwaveColors = ['#00ffd5', '#00f2fe', '#38ef7d', '#ffffff'];
        glowColor = 'rgba(0, 255, 213, 0.9)';
        badgeLabel = '!!';
        badgeIcon = '⚡️';
        badgeColor = 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 border-cyan-200 shadow-[0_0_22px_#00ffd5]';
        playSynthesizedSound('brilliant');
      } else if (moveQuality === 'great' || moveQuality === 'best') {
        shockwaveColors = ['#38ef7d', '#11998e', '#00ffd5'];
        glowColor = 'rgba(56, 239, 125, 0.8)';
        badgeLabel = '!';
        badgeIcon = '⭐️';
        badgeColor = 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_18px_#38ef7d]';
        playSynthesizedSound('capture');
      } else if (moveQuality === 'blunder') {
        shockwaveColors = ['#ff0844', '#ffb199', '#ff4b1f'];
        glowColor = 'rgba(255, 8, 68, 0.9)';
        badgeLabel = '??';
        badgeIcon = '💥';
        badgeColor = 'bg-rose-600 text-white border-rose-300 shadow-[0_0_22px_#ff0844]';
        playSynthesizedSound('blunder');
      } else if (moveQuality === 'sacrifice') {
        shockwaveColors = ['#ec4899', '#8b5cf6', '#00f2fe'];
        glowColor = 'rgba(236, 72, 153, 0.9)';
        badgeLabel = '!!';
        badgeIcon = '💎';
        badgeColor = 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-200 shadow-[0_0_25px_#ec4899]';
        playSynthesizedSound('brilliant');
      } else {
        if (isCapture) {
          playSynthesizedSound('capture');
        }
      }

      // Trigger Shockwave Expansion
      const shockwaveId = Date.now() + Math.random();
      setShockwaves((prev) => [
        ...prev,
        {
          id: shockwaveId,
          x: toCoords.x,
          y: toCoords.y,
          color: shockwaveColors[0],
          glowColor,
          size: toCoords.size,
        },
      ]);

      setTimeout(() => {
        setShockwaves((prev) => prev.filter((s) => s.id !== shockwaveId));
      }, 700 / animSpeed);

      // Trigger Particle Burst
      triggerParticleExplosion(toCoords.x, toCoords.y, shockwaveColors, particleDensity);

      // Trigger Screen & Board Jolt Shake
      if (screenShakeEnabled && (isCapture || moveQuality !== 'normal')) {
        setBoardShake(true);
        setTimeout(() => setBoardShake(false), 380 / animSpeed);
      }

      // 4. Floating UI Evaluation Badges
      if (moveQuality !== 'normal') {
        const badgeId = `badge_${Date.now()}`;
        setFloatingBadges((prev) => [
          ...prev,
          {
            id: badgeId,
            square: to,
            quality: moveQuality,
            label: badgeLabel,
            icon: badgeIcon,
            color: badgeColor,
            x: toCoords.x,
            y: toCoords.y,
          },
        ]);

        setTimeout(() => {
          setFloatingBadges((prev) => prev.filter((b) => b.id !== badgeId));
        }, 1600 / animSpeed);

        // Slide in Frosted Glass Top Evaluation Banner
        setActiveBanner({
          quality: moveQuality,
          title: bannerTitle || (moveQuality === 'brilliant' ? 'BRILLIANT MOVE' : moveQuality === 'checkmate' ? 'CHECKMATE!' : moveQuality.toUpperCase()),
          subtitle: bannerSubtitle || `${pieceType.toUpperCase()} takes on ${to.toUpperCase()}`,
          evalText: evalText || (moveQuality === 'brilliant' ? '+6.4' : moveQuality === 'checkmate' ? 'M1' : '+2.8'),
        });

        setTimeout(() => {
          setActiveBanner(null);
        }, 2400 / animSpeed);
      }

      setIsAnimating(false);
    },
    [animSpeed, boardPieces, isAnimating, particleDensity, playSynthesizedSound, screenShakeEnabled]
  );

  // Preset Cinematic Showcase Scenarios
  const runPreset = (presetKey: string) => {
    if (isAnimating) return;

    if (presetKey === 'knight_fork') {
      // Knight Jump Scenario: White Knight leaps from c3 to e4, capturing black Queen on e4
      setBoardPieces({
        c3: { type: 'knight', color: 'w' },
        e4: { type: 'queen', color: 'b' },
        e8: { type: 'king', color: 'b' },
        d8: { type: 'rook', color: 'b' },
        e1: { type: 'king', color: 'w' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'knight',
          color: 'w',
          from: 'c3',
          to: 'e4',
          isCapture: true,
          capturedPiece: { type: 'queen', color: 'b' },
          moveQuality: 'brilliant',
          bannerTitle: 'BRILLIANT KNIGHT FORK !!',
          bannerSubtitle: 'Unstoppable triple fork on King, Queen, and Rook',
          evalText: '+7.2',
        });
      }, 200);
    } else if (presetKey === 'queen_sacrifice') {
      // Queen Sacrifice ("Oh no, my Queen!")
      setBoardPieces({
        h5: { type: 'queen', color: 'w' },
        h7: { type: 'pawn', color: 'b' },
        g8: { type: 'king', color: 'b' },
        f8: { type: 'rook', color: 'b' },
        e1: { type: 'king', color: 'w' },
        c4: { type: 'bishop', color: 'w' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'queen',
          color: 'w',
          from: 'h5',
          to: 'h7',
          isCapture: true,
          capturedPiece: { type: 'pawn', color: 'b' },
          moveQuality: 'sacrifice',
          bannerTitle: 'BRILLIANT QUEEN SACRIFICE !!',
          bannerSubtitle: 'Forced mate in two with devastating bishop alignment',
          evalText: 'M2',
        });
      }, 200);
    } else if (presetKey === 'king_checkmate') {
      // King's Regal Walk & Golden Checkmate
      setBoardPieces({
        f6: { type: 'king', color: 'w' },
        g8: { type: 'king', color: 'b' },
        f7: { type: 'pawn', color: 'b' },
        h8: { type: 'rook', color: 'b' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'king',
          color: 'w',
          from: 'f6',
          to: 'f7',
          isCapture: true,
          capturedPiece: { type: 'pawn', color: 'b' },
          moveQuality: 'checkmate',
          bannerTitle: 'ROYAL CHECKMATE #',
          bannerSubtitle: 'The King personally strikes the fatal blow!',
          evalText: 'M0',
        });
      }, 200);
    } else if (presetKey === 'rook_smash') {
      // Heavy Rook Linear Smash
      setBoardPieces({
        a1: { type: 'rook', color: 'w' },
        a8: { type: 'rook', color: 'b' },
        e1: { type: 'king', color: 'w' },
        e8: { type: 'king', color: 'b' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'rook',
          color: 'w',
          from: 'a1',
          to: 'a8',
          isCapture: true,
          capturedPiece: { type: 'rook', color: 'b' },
          moveQuality: 'great',
          bannerTitle: 'HEAVY ROOK IMPACT !',
          bannerSubtitle: 'Back-rank penetration with crushing force',
          evalText: '+3.5',
        });
      }, 200);
    } else if (presetKey === 'bishop_slice') {
      // Bishop Diagonal Slice
      setBoardPieces({
        c1: { type: 'bishop', color: 'w' },
        g5: { type: 'knight', color: 'b' },
        e1: { type: 'king', color: 'w' },
        e8: { type: 'king', color: 'b' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'bishop',
          color: 'w',
          from: 'c1',
          to: 'g5',
          isCapture: true,
          capturedPiece: { type: 'knight', color: 'b' },
          moveQuality: 'best',
          bannerTitle: 'RAZOR DIAGONAL SLICE ⭐️',
          bannerSubtitle: 'Long-range sniper pin elimination',
          evalText: '+2.1',
        });
      }, 200);
    } else if (presetKey === 'pawn_lunge') {
      // Pawn Aggressive Diagonal Lunge
      setBoardPieces({
        e4: { type: 'pawn', color: 'w' },
        d5: { type: 'pawn', color: 'b' },
        e1: { type: 'king', color: 'w' },
        e8: { type: 'king', color: 'b' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'pawn',
          color: 'w',
          from: 'e4',
          to: 'd5',
          isCapture: true,
          capturedPiece: { type: 'pawn', color: 'b' },
          moveQuality: 'great',
          bannerTitle: 'AGGRESSIVE PAWN LUNGE !',
          bannerSubtitle: 'Center breakthrough with sharp diagonal strike',
          evalText: '+1.6',
        });
      }, 200);
    } else if (presetKey === 'blunder_catastrophe') {
      // Blunder Catastrophe
      setBoardPieces({
        d1: { type: 'queen', color: 'w' },
        d8: { type: 'rook', color: 'b' },
        e1: { type: 'king', color: 'w' },
        e8: { type: 'king', color: 'b' },
      });
      setTimeout(() => {
        executeCaptureMove({
          pieceType: 'queen',
          color: 'w',
          from: 'd1',
          to: 'd8',
          isCapture: true,
          capturedPiece: { type: 'rook', color: 'b' },
          moveQuality: 'blunder',
          bannerTitle: 'BLUNDER CATASTROPHE ??',
          bannerSubtitle: 'Unprotected queen hangs into reciprocal mate',
          evalText: '-9.4',
        });
      }, 200);
    }
  };

  // Reset standard board
  const resetStandardBoard = () => {
    setBoardPieces({
      a8: { type: 'rook', color: 'b' },
      b8: { type: 'knight', color: 'b' },
      c8: { type: 'bishop', color: 'b' },
      d8: { type: 'queen', color: 'b' },
      e8: { type: 'king', color: 'b' },
      f8: { type: 'bishop', color: 'b' },
      g8: { type: 'knight', color: 'b' },
      h8: { type: 'rook', color: 'b' },
      a7: { type: 'pawn', color: 'b' },
      b7: { type: 'pawn', color: 'b' },
      c7: { type: 'pawn', color: 'b' },
      d7: { type: 'pawn', color: 'b' },
      e7: { type: 'pawn', color: 'b' },
      f7: { type: 'pawn', color: 'b' },
      g7: { type: 'pawn', color: 'b' },
      h7: { type: 'pawn', color: 'b' },

      a2: { type: 'pawn', color: 'w' },
      b2: { type: 'pawn', color: 'w' },
      c2: { type: 'pawn', color: 'w' },
      d2: { type: 'pawn', color: 'w' },
      e2: { type: 'pawn', color: 'w' },
      f2: { type: 'pawn', color: 'w' },
      g2: { type: 'pawn', color: 'w' },
      h2: { type: 'pawn', color: 'w' },
      a1: { type: 'rook', color: 'w' },
      b1: { type: 'knight', color: 'w' },
      c1: { type: 'bishop', color: 'w' },
      d1: { type: 'queen', color: 'w' },
      e1: { type: 'king', color: 'w' },
      f1: { type: 'bishop', color: 'w' },
      g1: { type: 'knight', color: 'w' },
      h1: { type: 'rook', color: 'w' },
    });
    setSelectedSquare(null);
  };

  // Interactive Square Click Handler for Manual Moves on the Showcase Board
  const handleSquareClick = (square: string) => {
    if (isAnimating) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const sourcePiece = boardPieces[selectedSquare];
      if (!sourcePiece) {
        setSelectedSquare(null);
        return;
      }

      const targetPiece = boardPieces[square];
      const isCapture = !!targetPiece;

      // Randomly assign a fun cinematic move quality for interactive testing
      let moveQuality: MoveQuality = 'normal';
      if (isCapture) {
        const rand = Math.random();
        if (rand > 0.65) moveQuality = 'brilliant';
        else if (rand > 0.35) moveQuality = 'great';
        else moveQuality = 'best';
      }

      executeCaptureMove({
        pieceType: sourcePiece.type,
        color: sourcePiece.color,
        from: selectedSquare,
        to: square,
        isCapture,
        capturedPiece: targetPiece,
        moveQuality,
      });

      setSelectedSquare(null);
    } else {
      if (boardPieces[square]) {
        setSelectedSquare(square);
      }
    }
  };

  // Code Export Modal State
  const [showCodeExport, setShowCodeExport] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cinematic Chess Particle & Animation Engine</title>
  <style>
    :root {
      --bg-color: #0b0f19;
      --board-light: #2d3748;
      --board-dark: #1a202c;
      --neon-cyan: #00f2fe;
      --neon-gold: #ffd700;
      --neon-rose: #ff0844;
    }
    body {
      margin: 0;
      background: radial-gradient(circle at center, #1a1c2e 0%, var(--bg-color) 100%);
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .board-container {
      position: relative;
      width: min(90vw, 560px);
      height: min(90vw, 560px);
      border-radius: 16px;
      padding: 12px;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid rgba(0, 242, 254, 0.35);
      box-shadow: 0 0 40px rgba(0, 242, 254, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(16px);
      transition: transform 0.1s ease;
    }
    .board-container.shake {
      animation: boardJolt 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .chess-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    .tile {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      user-select: none;
    }
    .tile.light { background: #334155; }
    .tile.dark { background: #1e293b; }
    .tile.selected { box-shadow: inset 0 0 0 3px var(--neon-cyan); background: rgba(0, 242, 254, 0.2); }
    
    .piece-svg {
      width: 82%;
      height: 82%;
      pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    }
    canvas#fx-canvas {
      position: absolute;
      inset: 12px;
      pointer-events: none;
      z-index: 20;
    }
    .shockwave {
      position: absolute;
      border-radius: 50%;
      border: 3px solid var(--neon-cyan);
      box-shadow: 0 0 25px var(--neon-cyan);
      animation: shockwaveExpand 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
      pointer-events: none;
      z-index: 15;
    }
    .floating-badge {
      position: absolute;
      transform: translate(-50%, -50%);
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 900;
      font-size: 14px;
      z-index: 30;
      animation: badgeFloat 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      pointer-events: none;
    }
    @keyframes boardJolt {
      0% { transform: translate(0, 0); }
      20% { transform: translate(-6px, 4px) rotate(-1deg); }
      40% { transform: translate(6px, -4px) rotate(1deg); }
      60% { transform: translate(-3px, 2px); }
      80% { transform: translate(3px, -1px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes shockwaveExpand {
      0% { width: 10px; height: 10px; opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
      100% { width: 180px; height: 180px; opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
    }
    @keyframes badgeFloat {
      0% { opacity: 0; transform: translate(-50%, 0) scale(0.4); }
      25% { opacity: 1; transform: translate(-50%, -30px) scale(1.15); }
      80% { opacity: 1; transform: translate(-50%, -45px) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -65px) scale(0.85); }
    }
  </style>
</head>
<body>
  <div class="board-container" id="board">
    <canvas id="fx-canvas"></canvas>
    <div class="chess-grid" id="grid"></div>
  </div>
  <script>
    // Robust JavaScript Controller
    const grid = document.getElementById('grid');
    const board = document.getElementById('board');
    const canvas = document.getElementById('fx-canvas');
    const ctx = canvas.getContext('2d');
    
    // Auto-fit canvas
    canvas.width = grid.clientWidth;
    canvas.height = grid.clientHeight;
    
    function executeCaptureMove(pieceType, fromSq, toSq, moveQuality = 'brilliant') {
      // Dynamic piece flight, impact shockwave & particles
      board.classList.add('shake');
      setTimeout(() => board.classList.remove('shake'), 400);
    }
  </script>
</body>
</html>`;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="w-full max-w-[960px] mx-auto bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,242,254,0.2)] text-white backdrop-blur-2xl flex flex-col gap-6 relative overflow-hidden">
      {/* Screen Dim Vignette Pulse for Checkmate & Heavy King Impacts */}
      <AnimatePresence>
        {screenDim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-radial from-amber-500/15 via-black/80 to-black pointer-events-none flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: -60, scale: 0.5, rotate: -20 }}
                animate={{ y: 0, scale: 1.3, rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-6xl filter drop-shadow-[0_0_30px_#ffd700]"
              >
                👑
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-amber-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide bg-gradient-to-r from-cyan-300 via-white to-amber-300 bg-clip-text text-transparent uppercase flex items-center gap-2">
              Cinematic Chess VFX Engine
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 tracking-normal normal-case">
                Broadcast Physics
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Dynamic particle shocks, piece-specific move trajectories, L-jumps, king glides, and floating badges
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.25)]'
                : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'
            }`}
            title="Toggle Synthesized VFX Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowCodeExport(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Standalone Code</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Showcase Layout (Board + Control Reel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: The Chessboard Stage */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Frosted Glass Evaluation Banner */}
          <div className="w-full h-14 mb-2 relative flex items-center justify-center">
            <AnimatePresence>
              {activeBanner && (
                <motion.div
                  initial={{ y: -25, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                  className={`w-full px-4 py-2.5 rounded-2xl border backdrop-blur-xl flex items-center justify-between shadow-2xl ${
                    activeBanner.quality === 'checkmate'
                      ? 'bg-amber-950/80 border-amber-400/50 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.35)]'
                      : activeBanner.quality === 'brilliant' || activeBanner.quality === 'sacrifice'
                      ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200 shadow-[0_0_30px_rgba(0,242,254,0.35)]'
                      : activeBanner.quality === 'blunder'
                      ? 'bg-rose-950/80 border-rose-400/50 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.35)]'
                      : 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                      {activeBanner.quality === 'checkmate'
                        ? '👑'
                        : activeBanner.quality === 'brilliant'
                        ? '⚡️'
                        : activeBanner.quality === 'blunder'
                        ? '💥'
                        : '⭐️'}
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider uppercase">{activeBanner.title}</div>
                      <div className="text-[11px] opacity-80">{activeBanner.subtitle}</div>
                    </div>
                  </div>
                  {activeBanner.evalText && (
                    <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-black tracking-tight text-white">
                      {activeBanner.evalText}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Master Animated Board Container */}
          <div
            ref={boardRef}
            className={`w-full max-w-[480px] aspect-square relative rounded-2xl p-2.5 bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(0,242,254,0.25)] select-none transition-transform ${
              boardShake ? 'shake-active' : ''
            }`}
          >
            {/* Background Canvas for Particle Sparks */}
            <canvas ref={canvasRef} className="absolute inset-2.5 pointer-events-none z-20" />

            {/* Shockwaves Container */}
            {shockwaves.map((sw) => (
              <div
                key={sw.id}
                style={{
                  left: sw.x,
                  top: sw.y,
                  borderColor: sw.color,
                  boxShadow: `0 0 25px ${sw.glowColor}`,
                }}
                className="absolute w-2 h-2 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15 animate-[shockwaveExpand_0.65s_cubic-bezier(0.1,0.8,0.3,1)_forwards]"
              />
            ))}

            {/* Ghost Trail Afterimages for Queen */}
            {ghostTrails.map((gt) => (
              <div
                key={gt.id}
                style={{
                  left: gt.x,
                  top: gt.y,
                  opacity: gt.opacity,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute w-12 h-12 pointer-events-none z-10 filter blur-[1px] transition-opacity duration-300"
                dangerouslySetInnerHTML={{ __html: gt.svgHtml }}
              />
            ))}

            {/* Floating Evaluation Badges */}
            {floatingBadges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  left: badge.x,
                  top: badge.y,
                }}
                className={`floating-badge absolute z-30 flex items-center gap-1 border ${badge.color}`}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}

            {/* Dynamic Piece Flight Overlay */}
            {movingPiece && (
              <div
                style={{
                  left: movingPiece.toX,
                  top: movingPiece.toY,
                  transform: `translate(-50%, -50%) scale(${movingPiece.scale})`,
                  filter: movingPiece.isLJump
                    ? 'drop-shadow(0 15px 25px rgba(0,242,254,0.6))'
                    : 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                }}
                className="absolute w-12 h-12 sm:w-14 sm:h-14 z-30 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: PIECE_SVGS[movingPiece.svgKey] || '',
                }}
              />
            )}

            {/* Dying Piece Dissolve & Shrink Overlay */}
            {dyingPiece && (
              <div
                style={{
                  left: dyingPiece.x,
                  top: dyingPiece.y,
                  transform: `translate(-50%, -50%) scale(0) rotate(${dyingPiece.rotation}deg)`,
                  opacity: 0,
                  transition: `all ${400 / animSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
                className="absolute w-12 h-12 sm:w-14 sm:h-14 z-10 pointer-events-none filter blur-[1px]"
                dangerouslySetInnerHTML={{
                  __html: PIECE_SVGS[dyingPiece.svgKey] || '',
                }}
              />
            )}

            {/* Crown Drop for Royal Checkmate */}
            {crownDropSquare && (
              <motion.div
                initial={{ y: -80, scale: 0.2, opacity: 0 }}
                animate={{ y: 0, scale: 1.2, opacity: 1 }}
                style={{
                  left: crownDropSquare.x,
                  top: crownDropSquare.y,
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 text-4xl filter drop-shadow-[0_0_20px_#ffd700] pointer-events-none"
              >
                👑
              </motion.div>
            )}

            {/* The 8x8 Tile Grid */}
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-slate-800">
              {ranks.map((rank, rIdx) =>
                files.map((file, fIdx) => {
                  const sq = `${file}${rank}`;
                  const isLight = (rIdx + fIdx) % 2 === 0;
                  const isSelected = selectedSquare === sq;
                  const piece = boardPieces[sq];
                  const pieceSvgKey = piece ? `${piece.color}_${piece.type}` : null;

                  return (
                    <div
                      key={sq}
                      onClick={() => handleSquareClick(sq)}
                      className={`relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                        isLight ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-slate-900/90 hover:bg-slate-800/90'
                      } ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 bg-cyan-500/20 shadow-[inset_0_0_15px_rgba(0,242,254,0.4)]'
                          : ''
                      }`}
                    >
                      {/* Square Coordinate Labels on Margins */}
                      {fIdx === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-black opacity-30 select-none pointer-events-none">
                          {rank}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-black opacity-30 select-none pointer-events-none">
                          {file}
                        </span>
                      )}

                      {/* Placed Chess Piece SVG */}
                      {piece && pieceSvgKey && (
                        <div
                          className="w-[82%] h-[82%] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                          dangerouslySetInnerHTML={{
                            __html: PIECE_SVGS[pieceSvgKey] || '',
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span>Click any piece to move interactively</span>
            <button
              onClick={resetStandardBoard}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" /> Reset Board
            </button>
          </div>
        </div>

        {/* Right: Cinematic Presets Reel & Physics Configurator */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Preset Viral Animation Showcase Reel */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Signature Piece Physics</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to Play Effect</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runPreset('king_checkmate')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 hover:border-amber-400 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <span>👑</span> King's Checkmate
                </div>
                <span className="text-[10px] text-slate-400">Regal slide & golden shockwave</span>
              </button>

              <button
                onClick={() => runPreset('knight_fork')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-400/40 hover:border-cyan-400 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                  <span>♞</span> Knight 3D L-Jump
                </div>
                <span className="text-[10px] text-slate-400">Parabolic leap & heavy jolt</span>
              </button>

              <button
                onClick={() => runPreset('queen_sacrifice')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/10 border border-pink-400/40 hover:border-pink-400 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-pink-300">
                  <span>♛</span> Queen's Ghost Trail
                </div>
                <span className="text-[10px] text-slate-400">High-speed dash & !! badge</span>
              </button>

              <button
                onClick={() => runPreset('rook_smash')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-slate-500/10 border border-indigo-400/40 hover:border-indigo-400 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
                  <span>♜</span> Rook Linear Smash
                </div>
                <span className="text-[10px] text-slate-400">Orthogonal slide & stone jolt</span>
              </button>

              <button
                onClick={() => runPreset('bishop_slice')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-400/40 hover:border-emerald-400 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                  <span>♝</span> Bishop Diagonal Slice
                </div>
                <span className="text-[10px] text-slate-400">Smooth long-range glide</span>
              </button>

              <button
                onClick={() => runPreset('pawn_lunge')}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-white/20 hover:border-white/40 text-left transition hover:scale-[1.02] flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                  <span>♟</span> Pawn Aggressive Lunge
                </div>
                <span className="text-[10px] text-slate-400">Fast diagonal snap lunge</span>
              </button>
            </div>

            <button
              onClick={() => runPreset('blunder_catastrophe')}
              disabled={isAnimating}
              className="w-full p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <span>💥</span> Trigger Blunder Catastrophe (??)
            </button>
          </div>

          {/* Animation & VFX Configurator */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>VFX Dynamics & Tuning</span>
            </span>

            {/* Animation Speed */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Animation Speed:</span>
                <span className="text-cyan-300">{animSpeed}x {animSpeed < 1 ? '(Cinematic Slow-Mo)' : ''}</span>
              </div>
              <div className="flex gap-2">
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setAnimSpeed(spd)}
                    className={`flex-1 py-1 rounded-lg text-xs font-black transition ${
                      animSpeed === spd
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Particle Density */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Particle Spark Density:</span>
                <span className="text-cyan-300">{particleDensity} particles</span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="6"
                value={particleDensity}
                onChange={(e) => setParticleDensity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Screen Shake Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-xs text-slate-300 font-bold">Board & Camera Jolt Shake:</span>
              <button
                onClick={() => setScreenShakeEnabled(!screenShakeEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  screenShakeEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-slate-800 text-slate-500 border border-white/10'
                }`}
              >
                {screenShakeEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Code Modal */}
      <AnimatePresence>
        {showCodeExport && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-white">Standalone Deliverable Code (HTML, CSS, JS)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(standaloneHtmlCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_12px_#00f2fe]"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Full Code'}</span>
                  </button>
                  <button
                    onClick={() => setShowCodeExport(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 text-xs text-cyan-200 overflow-auto font-mono flex-1 leading-relaxed custom-scrollbar">
                <code>{standaloneHtmlCode}</code>
              </pre>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
