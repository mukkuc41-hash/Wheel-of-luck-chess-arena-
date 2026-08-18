import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Box,
  Eye,
  Wand2,
  Play,
  MousePointer,
  Activity,
  Shield,
  Swords,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VARIATIONS_96_MATRIX, PieceElementCode } from '../utils/cinematicVfx';
import { ChessPiece } from '../utils/chessPieces';
import {
  findCatalogItem,
  getMasterInventory,
  getEquippedMasterEffects,
  purchaseCatalogItem,
  equipCatalogItem,
  unequipCatalogItem,
  getPurchasedItemsCount,
} from '../utils/masterEffectsCatalog';
import { getUserPoints } from '../utils/pointsManager';

interface AnimationLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCinematicVfx?: () => void;
  onOpenMasterHub?: () => void;
}

export const AnimationLibraryModal: React.FC<AnimationLibraryModalProps> = ({
  isOpen,
  onClose,
  onOpenCinematicVfx,
  onOpenMasterHub,
}) => {
  // Shake animation trigger
  const [isShaking, setIsShaking] = useState(false);

  // Modal & Drawer inside demo state
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);

  // 96-State Animation Matrix Explorer State
  const [matrixPiece, setMatrixPiece] = useState<PieceElementCode>('N');
  const [matrixAction, setMatrixAction] = useState<'all' | 'capturing' | 'occupying'>('all');
  const [matrixStyle, setMatrixStyle] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [animTriggerKey, setAnimTriggerKey] = useState<number>(1);
  const [onlyPurchasedFilter, setOnlyPurchasedFilter] = useState<boolean>(false);

  // Inventory & Equipped state
  const [inventory, setInventory] = useState<Record<string, boolean>>(() => getMasterInventory());
  const [equipped, setEquipped] = useState<Record<string, string>>(() => getEquippedMasterEffects());
  const [points, setPoints] = useState<number>(() => getUserPoints());
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setInventory(getMasterInventory());
      setEquipped(getEquippedMasterEffects());
      setPoints(getUserPoints());
    };
    window.addEventListener('chess_equipped_effects_updated', handleUpdate);
    window.addEventListener('chess_points_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('chess_equipped_effects_updated', handleUpdate);
      window.removeEventListener('chess_points_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // FLIP animation slot state
  const [slotIdx, setSlotIdx] = useState<number>(1);

  // Tilt Card Ref
  const tiltCardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tilt card hover handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltCardRef.current) return;
    const rect = tiltCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    tiltCardRef.current.style.transform = `rotateX(${-y / 8}deg) rotateY(${x / 8}deg)`;
  };

  const handleMouseLeave = () => {
    if (!tiltCardRef.current) return;
    tiltCardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  // Shake trigger
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // FLIP slot step
  const moveToken = () => {
    setSlotIdx((prev) => (prev % 3) + 1);
  };

  // Canvas Particle Burst
  const triggerParticles = (e: React.MouseEvent<HTMLButtonElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ['#66FCF1', '#45A29E', '#9B51E0', '#FF007A', '#FFD700'];

    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        if (p.alpha > 0) {
          aliveCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gravity
          p.alpha -= 0.02;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Particle Overlay Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl my-8 bg-[#0B0C10] border border-[#2C3531] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-[#C5C6C7]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1F2833]/80 border-b border-[#2C3531]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-[#66FCF1]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Master Web Animation &amp; Transition Library</span>
              </h2>
              <p className="text-xs text-[#45A29E]">Interactive catalog of standard modern CSS &amp; JavaScript animations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid Catalog */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Spotlight Hero: Cinematic Chess Particle & Animation Engine */}
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-amber-950/60 border-2 border-cyan-400/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,242,254,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Interactive Physics Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Web Audio Synthesizer
                </span>
              </div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚡️ High-Energy Cinematic Chess Broadcast Animator</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Featuring piece-specific parabolic 3D trajectories (Knight L-jump, King royal glide, Pawn lunge), screen shockwaves, canvas spark physics, synthesized sound effects, and floating evaluation badges (!!, ??, #).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
              {onOpenMasterHub && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMasterHub();
                  }}
                  className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(46,204,113,0.4)] transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>96-Item Master Hub</span>
                </button>
              )}
              {onOpenCinematicVfx && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCinematicVfx();
                  }}
                  className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(0,242,254,0.4)] transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch VFX Studio</span>
                </button>
              )}
              <a
                href="/master-customization-hub.html"
                target="_blank"
                rel="noreferrer"
                className="w-full md:w-auto px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition text-center"
              >
                Standalone Hub
              </a>
            </div>
          </div>

          {/* 96-State Chess Piece Variations Architecture & Live Interactive Explorer */}
          <div className="md:col-span-2 lg:col-span-3 bg-[#131922] border-2 border-indigo-500/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>96 Unique Chess Piece Variations Matrix</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30">
                      48 Animations + 48 Effects
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    6 Pieces (P, N, B, R, Q, K) &times; 8 States (4 Capturing + 4 Occupying) with hardware-accelerated CSS Keyframes &amp; VFX modifiers.
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Piece Selector */}
                <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
                  {(['P', 'N', 'B', 'R', 'Q', 'K'] as PieceElementCode[]).map((pCode) => (
                    <button
                      key={pCode}
                      onClick={() => {
                        setMatrixPiece(pCode);
                        setAnimTriggerKey((k) => k + 1);
                      }}
                      className={`w-7 h-7 rounded-lg font-black text-xs transition flex items-center justify-center ${
                        matrixPiece === pCode
                          ? 'bg-indigo-500 text-white shadow-[0_0_12px_#6366f1]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pCode}
                    </button>
                  ))}
                </div>

                {/* Action Mode Selector */}
                <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
                  {(['all', 'capturing', 'occupying'] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => {
                        setMatrixAction(act);
                        setAnimTriggerKey((k) => k + 1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition capitalize flex items-center gap-1 ${
                        matrixAction === act
                          ? act === 'capturing'
                            ? 'bg-rose-500 text-white shadow-[0_0_10px_#ef4444]'
                            : act === 'occupying'
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_#10b981]'
                            : 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {act === 'capturing' && <Swords className="w-3 h-3" />}
                      {act === 'occupying' && <Shield className="w-3 h-3" />}
                      {act === 'all' ? 'All (8)' : act}
                    </button>
                  ))}
                </div>

                {/* Purchased Only Filter Toggle */}
                <button
                  onClick={() => setOnlyPurchasedFilter(!onlyPurchasedFilter)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    onlyPurchasedFilter
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-black/50 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{onlyPurchasedFilter ? 'Purchased Only' : 'Show All (96)'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[9px] font-black text-emerald-200">
                    {getPurchasedItemsCount()}/96
                  </span>
                </button>

                {/* Refresh Trigger */}
                <button
                  onClick={() => setAnimTriggerKey((k) => k + 1)}
                  className="p-2 bg-white/5 hover:bg-white/15 rounded-xl border border-white/10 text-cyan-300 hover:text-white transition"
                  title="Re-play all preview animations"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {VARIATIONS_96_MATRIX.filter(
                (v) =>
                  v.piece === matrixPiece &&
                  (matrixAction === 'all' || v.action === matrixAction) &&
                  (matrixStyle === 'all' || v.styleIndex === matrixStyle)
              ).map((v) => {
                const isCapturing = v.action === 'capturing';
                const isSelected = activePreviewId === v.id;
                const catalogItem = findCatalogItem(v.piece, v.action, v.styleIndex);
                const isOwned = catalogItem ? Boolean(inventory[catalogItem.id]) : false;
                const isEquipped = catalogItem ? equipped[catalogItem.piece] === catalogItem.id : false;

                if (onlyPurchasedFilter && !isOwned) {
                  return null;
                }

                return (
                  <div
                    key={`${v.id}-${animTriggerKey}`}
                    onClick={() => setActivePreviewId(v.id)}
                    className={`relative p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                        : isOwned
                        ? 'bg-black/60 hover:bg-slate-900/80 border-cyan-500/30'
                        : 'bg-black/30 hover:bg-slate-950 border-white/10'
                    }`}
                  >
                    {/* Top Row: Piece, Style & Ownership Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            isCapturing
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          }`}
                        >
                          {v.piece}
                        </span>
                        <div>
                          <span className="text-xs font-black text-white block">
                            {v.styleName || `Style ${v.styleIndex}`}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Style #{v.styleIndex}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isOwned ? (
                          isEquipped ? (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 flex items-center gap-0.5">
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
                    </div>

                    {/* Titles */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-black text-cyan-300 truncate" title={v.animationTitle}>
                        🎬 {v.animationTitle || `${v.pieceName} ${v.styleName}`}
                      </div>
                      <div className="text-[10px] text-purple-300 font-medium truncate" title={v.effectModifierTitle}>
                        ✨ {v.effectModifierTitle || v.effectFilter}
                      </div>
                    </div>

                    {/* Center Animated Piece Preview Arena */}
                    <div className="w-full h-24 rounded-lg bg-slate-950/90 border border-white/5 relative flex items-center justify-center overflow-hidden group">
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:8px_8px]" />
                      
                      {/* Animated Piece Subject */}
                      <div
                        data-piece={v.piece}
                        className={`piece-${v.action} style-${v.styleIndex} relative z-10 w-14 h-14 flex items-center justify-center transform transition-transform group-hover:scale-110`}
                      >
                        <ChessPiece
                          type={v.piece.toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                          color={isCapturing ? 'b' : 'w'}
                        />
                      </div>

                      {/* Click to re-trigger prompt */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnimTriggerKey((k) => k + 1);
                        }}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition p-1 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] flex items-center gap-1 z-20"
                      >
                        <Play className="w-2.5 h-2.5" /> Replay
                      </button>
                    </div>

                    {/* Bottom Specs & Keyframe Info */}
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] bg-black/40 px-2 py-0.5 rounded border border-white/5 truncate" title={v.cssSelector}>
                        <span className="truncate text-indigo-300">{v.cssSelector || `[data-piece="${v.piece}"].piece-${v.action}.style-${v.styleIndex}`}</span>
                        <span style={{ color: v.colorAccent }} className="font-bold shrink-0 ml-1">{v.speed}</span>
                      </div>
                      <p className="text-slate-300 text-[10px] leading-tight line-clamp-2">
                        {v.description}
                      </p>

                      {/* Equip / Unlock Footer Action */}
                      <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                        {isOwned ? (
                          isEquipped ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (catalogItem) {
                                  unequipCatalogItem(catalogItem.piece);
                                  setEquipped(getEquippedMasterEffects());
                                }
                              }}
                              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 underline"
                            >
                              Unequip from Chess
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (catalogItem) {
                                  equipCatalogItem(catalogItem.piece, catalogItem.id);
                                  setEquipped(getEquippedMasterEffects());
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[9px] font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" /> Equip to Main Game
                            </button>
                          )
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (catalogItem) {
                                const res = purchaseCatalogItem(catalogItem.id);
                                if (res.success) {
                                  setInventory(getMasterInventory());
                                  setEquipped(getEquippedMasterEffects());
                                  setPoints(getUserPoints());
                                } else if (onOpenMasterHub) {
                                  onOpenMasterHub();
                                }
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[9px] font-bold transition flex items-center gap-1"
                          >
                            <Unlock className="w-2.5 h-2.5" /> Unlock (1k PTS)
                          </button>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono capitalize">
                          {v.action}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Micro Interactions */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <MousePointer className="w-4 h-4" />
              <span>1. UI Micro-Interactions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-[#45A29E] hover:bg-[#66FCF1] text-black font-semibold rounded-lg text-xs transition transform hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_rgba(102,252,241,0.35)] active:scale-95">
                Hover Scale &amp; Lift
              </button>
              <button className="relative px-4 py-2 bg-black text-white text-xs rounded-lg font-semibold overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 opacity-50 group-hover:opacity-100 group-hover:blur-sm transition duration-300" />
                <span className="relative z-10">Glow Border</span>
              </button>
            </div>
            <div className="pt-1">
              <a href="#0" onClick={(e) => e.preventDefault()} className="relative text-white font-semibold text-xs pb-1 group inline-block">
                <span>Magnetic Underline Transition</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF007A] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-bottom-left" />
              </a>
            </div>
          </div>

          {/* Section 2: Keyframe State */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>2. Keyframe State Animations</span>
            </div>
            {/* Skeleton Shimmer */}
            <div className="w-full h-5 rounded bg-gradient-to-r from-[#2C3531] via-[#3A4742] to-[#2C3531] bg-[length:200%_100%] animate-pulse" />
            
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-[#9B51E0] text-white text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(155,81,224,0.6)]">
                Live Pulse
              </span>
              <button
                onClick={triggerShake}
                className="px-3 py-1.5 bg-[#45A29E] text-black font-bold text-xs rounded-lg hover:bg-[#66FCF1] transition"
              >
                Test Error Shake
              </button>
            </div>
            <input
              type="text"
              readOnly
              value="Click button to test shake..."
              className={`w-full bg-black border border-[#FF007A] text-white text-xs px-3 py-2 rounded-lg outline-none transition-transform ${
                isShaking ? 'animate-bounce text-pink-400 border-pink-400' : ''
              }`}
            />
          </div>

          {/* Section 3: 3D Perspective & Transforms */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Box className="w-4 h-4" />
              <span>3. 3D Perspective &amp; Transforms</span>
            </div>
            {/* Flip Card Container */}
            <div className="w-full h-24 [perspective:1000px] cursor-pointer group">
              <div className="relative w-full h-full duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                <div className="absolute inset-0 bg-black border border-[#2C3531] rounded-lg flex items-center justify-center font-bold text-xs text-[#66FCF1] [backface-visibility:hidden]">
                  Hover to Flip 3D Card
                </div>
                <div className="absolute inset-0 bg-[#9B51E0] text-white rounded-lg flex items-center justify-center font-bold text-xs [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  Back Side Revealed ✦
                </div>
              </div>
            </div>
            {/* Parallax Mouse Tilt Card */}
            <div
              ref={tiltCardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full p-3 bg-black border border-[#2C3531] rounded-lg transition-transform duration-100 ease-out [transform-style:preserve-3d]"
            >
              <p className="text-[11px] text-[#C5C6C7] font-mono">Interactive 3D Mouse Parallax Tilt</p>
            </div>
          </div>

          {/* Section 4: Clip-Path Shape Reveals */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Layers className="w-4 h-4" />
              <span>4. Clip-Path Shape Reveals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="relative px-4 py-2 bg-black text-[#66FCF1] border border-[#66FCF1] rounded-lg font-bold text-xs overflow-hidden group">
                <span className="relative z-10 group-hover:text-black transition duration-300">Circular Expand</span>
                <span className="absolute inset-0 bg-[#66FCF1] [clip-path:circle(0%_at_50%_50%)] group-hover:[clip-path:circle(150%_at_50%_50%)] transition-all duration-500 ease-out z-0" />
              </button>

              <button className="relative px-4 py-2 bg-[#9B51E0] text-white rounded-lg font-bold text-xs overflow-hidden group">
                <span className="relative z-10">Curtain Wipe</span>
                <span className="absolute inset-0 bg-[#FF007A] [clip-path:polygon(0_0,0_0,0_100%,0_100%)] group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] transition-all duration-500 ease-in-out" />
              </button>
            </div>
          </div>

          {/* Section 5: SVG Vector & Text Shimmer */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Wand2 className="w-4 h-4" />
              <span>5. SVG &amp; Text Vector Effects</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 stroke-[#66FCF1] stroke-2 fill-none cursor-pointer group" viewBox="0 0 24 24">
                <path
                  className="[stroke-dasharray:100] [stroke-dashoffset:100] group-hover:[stroke-dashoffset:0] transition-all duration-700 ease-in-out group-hover:fill-cyan-400/20"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
              <span className="text-sm font-extrabold bg-gradient-to-r from-white via-[#66FCF1] to-white bg-[length:200%_auto] text-transparent bg-clip-text animate-pulse">
                Text Gradient Shimmer
              </span>
            </div>
          </div>

          {/* Section 6: Overlay & Drawer */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Eye className="w-4 h-4" />
              <span>6. Overlay &amp; Drawer Transitions</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="flex-1 py-2 bg-[#45A29E] hover:bg-[#66FCF1] text-black font-bold text-xs rounded-lg transition"
              >
                Modal Pop-In
              </button>
              <button
                onClick={() => setDemoDrawerOpen(true)}
                className="flex-1 py-2 bg-[#9B51E0] hover:bg-purple-400 text-white font-bold text-xs rounded-lg transition"
              >
                Slide Drawer
              </button>
            </div>
          </div>

          {/* Section 7: FLIP Interpolation */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Play className="w-4 h-4" />
              <span>7. Web Animations API (FLIP)</span>
            </div>
            <button
              onClick={moveToken}
              className="py-2 bg-[#45A29E] hover:bg-[#66FCF1] text-black font-bold text-xs rounded-lg transition"
            >
              Interpolate Motion across Slots
            </button>
            <div className="flex justify-between bg-black p-3 rounded-lg border border-[#2C3531]">
              {[1, 2, 3].map((sNum) => (
                <div key={sNum} className="w-12 h-12 border-2 border-dashed border-[#2C3531] rounded-lg flex items-center justify-center">
                  {slotIdx === sNum && (
                    <motion.div
                      layoutId="demo-flip-token"
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-9 h-9 bg-[#66FCF1] rounded-full flex items-center justify-center text-black font-bold text-sm shadow-[0_0_15px_rgba(102,252,241,0.8)]"
                    >
                      ★
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Canvas Particle Burst */}
          <div className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-5 flex flex-col gap-4 shadow-lg md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 text-[#66FCF1] border-b border-[#2C3531] pb-2 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>8. Canvas Particle Explosions</span>
            </div>
            <p className="text-xs text-[#C5C6C7]">Click button to trigger a hardware-accelerated 2D canvas physics burst.</p>
            <button
              onClick={triggerParticles}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400 text-white font-extrabold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              💥 Click for Particle Burst
            </button>
          </div>

        </div>

        {/* Inner Demo Modal Overlay */}
        <AnimatePresence>
          {demoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-[#1F2833] border border-[#2C3531] rounded-xl p-6 max-w-sm w-full shadow-2xl text-white"
              >
                <h3 className="text-md font-bold text-[#66FCF1] mb-2">Elastic Modal Window</h3>
                <p className="text-xs text-[#C5C6C7] mb-4">Combines background blur transition with an elastic scale pop-in curve.</p>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="w-full py-2 bg-[#45A29E] text-black font-bold text-xs rounded-lg hover:bg-[#66FCF1] transition"
                >
                  Close Modal
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner Demo Drawer */}
        <AnimatePresence>
          {demoDrawerOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1F2833] border-t border-[#2C3531] rounded-t-2xl p-6 shadow-2xl text-white"
            >
              <div className="max-w-xl mx-auto flex flex-col gap-3">
                <h3 className="text-md font-bold text-[#66FCF1]">Slide-Up Bottom Sheet</h3>
                <p className="text-xs text-[#C5C6C7]">Useful for mobile navigation or context sheets using hardware-accelerated transforms.</p>
                <button
                  onClick={() => setDemoDrawerOpen(false)}
                  className="w-full py-2 bg-[#9B51E0] text-white font-bold text-xs rounded-lg hover:bg-purple-400 transition"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
