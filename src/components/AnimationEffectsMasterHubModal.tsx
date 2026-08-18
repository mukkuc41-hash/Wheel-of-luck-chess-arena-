import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  ShoppingBag,
  PackageCheck,
  Play,
  Coins,
  Flame,
  Trophy,
  Filter,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Search,
  Zap,
  Shield,
  Swords,
  Layers,
  RotateCw,
  Gift,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkle,
  Eye,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playCinematicSound, triggerPieceCryState, CRY_STATES_MATRIX } from '../utils/cinematicVfx';
import { ChessPiece } from '../utils/chessPieces';
import {
  getUserPoints,
  spendPoints,
  getHatrickState,
  getActiveRandomQuests,
  checkDailyWheelStatus,
  resetAllPurchasesAndPoints,
} from '../utils/pointsManager';
import {
  MASTER_96_CATALOG,
  PIECES,
  CATEGORIES,
  CatalogItem,
  MasterPieceType,
  MasterCategoryType,
  notifyEquippedEffectsUpdated,
} from '../utils/masterEffectsCatalog';

interface AnimationEffectsMasterHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCinematicShowcase?: () => void;
  onOpenDailyWheel?: () => void;
  onOpenQuests?: () => void;
}

// Glowing piece visual artwork component
function GlowingPieceArt({
  pieceCode,
  glowColor,
  secondaryColor,
  size = 'md',
  animate = false,
}: {
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
  glowColor: string;
  secondaryColor: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const containerH = isSm ? 'h-24' : isLg ? 'h-36' : 'h-28';
  const pieceSize = isSm ? 'w-10 h-10 text-3xl' : isLg ? 'w-16 h-16 text-5xl' : 'w-12 h-12 text-4xl';

  return (
    <div
      className={`relative w-full ${containerH} rounded-xl overflow-hidden flex items-center justify-center bg-radial from-[#0d162d]/90 via-[#060a17]/95 to-[#04060e] border border-white/5 shadow-inner`}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 opacity-40 blur-xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, ${secondaryColor} 45%, transparent 75%)`,
        }}
      />

      {/* Energy Rings / Shockwave rings */}
      <div
        className="absolute w-24 h-24 rounded-full border border-dashed opacity-35 pointer-events-none animate-spin-slow"
        style={{ borderColor: glowColor }}
      />
      <div
        className="absolute w-16 h-16 rounded-full border opacity-50 pointer-events-none"
        style={{
          borderColor: secondaryColor,
          boxShadow: `0 0 16px ${glowColor}40`,
        }}
      />

      {/* Particle Flares */}
      <div
        className="absolute -top-1 right-3 w-1.5 h-1.5 rounded-full blur-[0.5px] animate-pulse"
        style={{ backgroundColor: glowColor, boxShadow: `0 0 8px ${glowColor}` }}
      />
      <div
        className="absolute bottom-2 left-3 w-2 h-2 rounded-full blur-[0.5px] animate-pulse"
        style={{ backgroundColor: secondaryColor, boxShadow: `0 0 10px ${secondaryColor}` }}
      />

      {/* Center 3D Glowing Chess Piece */}
      <div
        className={`relative z-10 flex items-center justify-center select-none transform transition-transform duration-300 group-hover:scale-110 ${
          animate ? 'animate-bounce' : ''
        }`}
        style={{
          filter: `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${secondaryColor}80)`,
        }}
      >
        <div className={`${pieceSize} flex items-center justify-center font-serif text-white`}>
          <ChessPiece type={pieceCode.toLowerCase() as any} color="w" />
        </div>
      </div>

      {/* Base Floor Light Plane */}
      <div
        className="absolute bottom-1 w-20 h-2 rounded-full opacity-60 blur-xs"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 80%)`,
        }}
      />
    </div>
  );
}

export function AnimationEffectsMasterHubModal({
  isOpen,
  onClose,
  onOpenCinematicShowcase,
  onOpenDailyWheel,
  onOpenQuests,
}: AnimationEffectsMasterHubModalProps) {
  // Points & Wallet State
  const [points, setPoints] = useState<number>(() => getUserPoints());

  // Inventory & Equipped Map (localStorage persistent)
  const [inventory, setInventory] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('chess_master_hub_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    // By default, NO animations or effects are unlocked (0 unlocked by default)
    return {};
  });

  const [equipped, setEquipped] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('chess_master_hub_equipped');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    // By default no animation and effects are equipped (all are unequipped)
    return {};
  });

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'shop' | 'cry' | 'inventory' | 'sandbox'>('shop');

  // Filters & Sorting
  const [filterPiece, setFilterPiece] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination (12 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Activity Log
  const [activityLog, setActivityLog] = useState<string>(
    'Welcome! No animations or effects are unlocked or equipped by default. Unlock any animation or effect for 1,000 Points in the Shop to equip to your piece loadouts.'
  );

  // Earn Modal / Feedback
  const [isEarnModalOpen, setIsEarnModalOpen] = useState<boolean>(false);
  const [hatrickData, setHatrickData] = useState(() => getHatrickState());
  const [wheelStatus, setWheelStatus] = useState(() => checkDailyWheelStatus());
  const [activeQuests, setActiveQuests] = useState(() => getActiveRandomQuests());

  // Sandbox State
  const [sandboxPiece, setSandboxPiece] = useState<'p' | 'n' | 'b' | 'r' | 'q' | 'k'>('r');
  const [sandboxAnimKey, setSandboxAnimKey] = useState<number>(1);
  const [isSandboxTesting, setIsSandboxTesting] = useState<boolean>(false);

  // Sync Points and Tasks live
  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      setPoints(getUserPoints());
      setHatrickData(getHatrickState());
      setWheelStatus(checkDailyWheelStatus());
      setActiveQuests(getActiveRandomQuests());
    };

    refreshData();

    const handlePointsUpdate = () => refreshData();
    const handleQuestsUpdate = () => refreshData();
    const handleHatrickUpdate = () => refreshData();

    window.addEventListener('chess_points_updated', handlePointsUpdate);
    window.addEventListener('chess_quests_updated', handleQuestsUpdate);
    window.addEventListener('chess_hatrick_achieved', handleHatrickUpdate);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdate);
      window.removeEventListener('chess_quests_updated', handleQuestsUpdate);
      window.removeEventListener('chess_hatrick_achieved', handleHatrickUpdate);
    };
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('chess_master_hub_inventory', JSON.stringify(inventory));
    notifyEquippedEffectsUpdated();
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('chess_master_hub_equipped', JSON.stringify(equipped));
    notifyEquippedEffectsUpdated();
  }, [equipped]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPiece, filterCategory, sortOption, searchQuery]);

  if (!isOpen) return null;

  // Filtered Shop Catalog
  const filteredCatalog = MASTER_96_CATALOG.filter((item) => {
    const matchPiece = filterPiece === 'ALL' || item.piece === filterPiece;
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPiece && matchCat && matchSearch;
  });

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / itemsPerPage));
  const paginatedItems = filteredCatalog.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Owned items in inventory
  const ownedItems = MASTER_96_CATALOG.filter((item) => inventory[item.id]);

  const handleBuy = (item: CatalogItem) => {
    if (inventory[item.id]) {
      handleToggleEquip(item);
      return;
    }
    if (points >= item.price) {
      const success = spendPoints(item.price, `Unlocked ${item.name}`);
      if (success) {
        setPoints(getUserPoints());
        setInventory((prev) => ({ ...prev, [item.id]: true }));
        playCinematicSound('capture');
        setActivityLog(`🎉 Successfully purchased "${item.name}" for ${item.price} PTS! Unlocked in inventory.`);
      }
    } else {
      setActivityLog('⚠️ Insufficient points! Points are earned by spinning the Daily Wheel, completing Hatrick, or finishing Random Quests.');
      setIsEarnModalOpen(true);
    }
  };

  const handleToggleEquip = (item: CatalogItem) => {
    setEquipped((prev) => {
      if (prev[item.piece] === item.id) {
        const next = { ...prev };
        delete next[item.piece];
        playCinematicSound('whoosh');
        setActivityLog(`🛡️ Unequipped "${item.name}" from [${item.piece}] loadout slot. Slot is now empty.`);
        return next;
      } else {
        playCinematicSound('whoosh');
        setActivityLog(`🛡️ Equipped "${item.name}" for [${item.piece}] loadout slot!`);
        return { ...prev, [item.piece]: item.id };
      }
    });
  };

  const handleUnequipPiece = (pieceName: string) => {
    setEquipped((prev) => {
      const next = { ...prev };
      delete next[pieceName];
      playCinematicSound('whoosh');
      setActivityLog(`🛡️ Unequipped [${pieceName}] loadout slot. Piece now has standard classic effect.`);
      return next;
    });
  };

  const handleUnequipAll = () => {
    setEquipped({});
    playCinematicSound('whoosh');
    setActivityLog('🛡️ All animations and effects are unequipped! All loadouts are currently clean/empty.');
  };

  const handleResetAllPurchases = () => {
    resetAllPurchasesAndPoints(5000);
    setInventory({});
    setEquipped({});
    setPoints(5000);
    playCinematicSound('whoosh');
    setActivityLog('🔄 Reset all purchases! Inventory is cleared and balance is reset to 5,000 PTS.');
  };

  const triggerTestSandbox = () => {
    setIsSandboxTesting(true);
    setSandboxAnimKey((prev) => prev + 1);
    playCinematicSound('capture');
    setActivityLog(
      `🕹️ Tested ${sandboxPiece.toUpperCase()} loadout animation on sandbox simulation arena tile!`
    );
    setTimeout(() => {
      setIsSandboxTesting(false);
    }, 1500);
  };

  // Find currently equipped items for the 6 chess pieces (null if unequipped)
  const equippedItemsList = PIECES.map((p) => {
    const itemId = equipped[p.name];
    const item = itemId ? MASTER_96_CATALOG.find((i) => i.id === itemId) || null : null;
    return { piece: p.name, pieceCode: p.code, item };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-2xl bg-black/90">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-[1340px] bg-[#070c1b] border-2 border-[#1a2642] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[96vh] text-slate-100"
        >
          {/* 1. TOP HEADER - Exact CHESS-WHEEL-ARENA Brand Bar */}
          <div className="px-5 py-4 border-b border-[#17233f] bg-gradient-to-r from-[#0a1126] via-[#0b142d] to-[#0a1126] flex flex-wrap items-center justify-between gap-4">
            {/* Left: Brand & Logo */}
            <div className="flex items-center gap-3.5">
              {/* Royal Shield Icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-blue-700 via-indigo-900 to-slate-950 border-2 border-[#f1c40f] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] shrink-0">
                <div className="text-2xl font-serif text-amber-300 drop-shadow-[0_0_8px_rgba(241,196,15,0.8)]">
                  ♚
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black italic tracking-wide text-white drop-shadow-md flex items-center gap-1.5">
                  <span>CHESS-</span>
                  <span className="text-[#f1c40f] drop-shadow-[0_0_10px_rgba(241,196,15,0.6)]">WHEEL</span>
                  <span>-ARENA</span>
                </h1>
                <p className="text-[11px] sm:text-xs font-black tracking-widest text-[#00d2ff] uppercase drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]">
                  96-ITEM MASTER CUSTOMIZATION HUB
                </p>
              </div>
            </div>

            {/* Center: Points Balance & Earn Button */}
            <div className="flex items-center gap-3">
              {/* Points Box */}
              <div className="bg-[#0b1328] border border-[#23355d] px-4 py-2 rounded-2xl shadow-inner flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Points Balance
                </span>
                <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-[#f1c40f]">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                    $
                  </div>
                  <span>{points.toLocaleString()}</span>
                  <span className="text-xs text-amber-300 font-bold">PTS</span>
                </div>
              </div>

              {/* Earn Points Button */}
              <button
                onClick={() => setIsEarnModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#b45309] hover:brightness-110 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] transition transform active:scale-95 flex items-center gap-2 border border-amber-300/40"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                <div className="text-left">
                  <div className="leading-none text-xs font-black">EARN POINTS</div>
                  <div className="text-[9px] opacity-85 font-bold leading-none mt-0.5">Wheel / Hatrick</div>
                </div>
              </button>
            </div>

            {/* Right: Daily Wheel & Hatrick Badges + Close Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Daily Wheel Mini Badge */}
              <div
                onClick={() => {
                  if (onOpenDailyWheel) {
                    onClose();
                    onOpenDailyWheel();
                  } else {
                    setIsEarnModalOpen(true);
                  }
                }}
                className="bg-[#0b1328] hover:bg-[#121f3f] cursor-pointer border border-[#23355d] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs transition"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] text-white">
                  🎡
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-bold leading-none">Daily Wheel</div>
                  <div className="text-[11px] text-[#2ecc71] font-black leading-none mt-0.5">+500 PTS</div>
                </div>
              </div>

              {/* Hatrick Victory Mini Badge */}
              <div
                onClick={() => {
                  if (onOpenQuests) {
                    onClose();
                    onOpenQuests();
                  } else {
                    setIsEarnModalOpen(true);
                  }
                }}
                className="bg-[#0b1328] hover:bg-[#121f3f] cursor-pointer border border-[#23355d] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs transition"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-[10px] text-white">
                  🏆
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-bold leading-none">Hatrick Victory</div>
                  <div className="text-[11px] text-[#2ecc71] font-black leading-none mt-0.5">+2,000 PTS</div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/10 ml-1"
                title="Close Hub"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. NAVIGATION TABS BAR */}
          <div className="flex flex-wrap items-center gap-2 px-6 pt-3 pb-2 border-b border-[#17233f] bg-[#070c1b]">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide transition shadow-md ${
                activeTab === 'shop'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'bg-[#0b1328] text-slate-400 hover:text-white border border-[#1b2a4d]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>MASTER SHOP (96 ITEMS)</span>
            </button>

            <button
              onClick={() => setActiveTab('cry')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide transition shadow-md ${
                activeTab === 'cry'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                  : 'bg-[#131008] text-amber-300/90 hover:text-amber-200 border border-amber-500/30'
              }`}
            >
              <span className="text-base leading-none">😭</span>
              <span>CRY STATES (6 ELEMENTS • 2,500 PTS)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                EXCLUSIVE
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide transition shadow-md ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'bg-[#0b1328] text-slate-400 hover:text-white border border-[#1b2a4d]'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>MY INVENTORY ({ownedItems.length}/96)</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide transition shadow-md ${
                activeTab === 'sandbox'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'bg-[#0b1328] text-slate-400 hover:text-white border border-[#1b2a4d]'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>LIVE TEST SANDBOX</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Reset all effect/animation purchases and reset wallet balance to 5,000 PTS?')) {
                    handleResetAllPurchases();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition shadow-sm"
                title="Reset all purchases and restore 5,000 PTS starting balance"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>RESET ALL PURCHASES (5,000 PTS)</span>
              </button>
            </div>
          </div>

          {/* 3. MAIN DUAL-PANE BODY */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
            {activeTab === 'shop' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT PANE: 96-ITEM MASTER CATALOG (8 cols) */}
                <div className="lg:col-span-8 space-y-3.5">
                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filter Piece */}
                    <div className="relative">
                      <select
                        value={filterPiece}
                        onChange={(e) => setFilterPiece(e.target.value)}
                        className="bg-[#0c142b] text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-[#23355d] focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm pr-8"
                      >
                        <option value="ALL">All Chess Pieces</option>
                        <option value="Pawn">Pawn</option>
                        <option value="Knight">Knight</option>
                        <option value="Bishop">Bishop</option>
                        <option value="Rook">Rook</option>
                        <option value="Queen">Queen</option>
                        <option value="King">King</option>
                      </select>
                    </div>

                    {/* Filter Category */}
                    <div className="relative">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-[#0c142b] text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-[#23355d] focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm pr-8"
                      >
                        <option value="ALL">All Types (Animations, Effects &amp; Cry)</option>
                        <option value="Capture Animation">Capture Animation</option>
                        <option value="Occupying Animation">Occupying Animation</option>
                        <option value="Capture Effect">Capture Effect</option>
                        <option value="Occupying Effect">Occupying Effect</option>
                        <option value="Cry State">Exclusive Cry State (+2,500 PTS)</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="bg-[#0c142b] text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-[#23355d] focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm pr-8"
                      >
                        <option value="latest">Sort: Latest</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="piece">Sort: Piece Order</option>
                      </select>
                    </div>

                    {/* Quick Search */}
                    <div className="relative flex-1 min-w-[140px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0c142b] text-slate-200 text-xs pl-8 pr-3 py-2 rounded-xl border border-[#23355d] focus:outline-none focus:border-blue-400 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-300 flex items-center justify-between">
                    <div>
                      BROWSE MASTER LIBRARY (
                      <span className="text-[#2ecc71]">{filteredCatalog.length} ITEMS DISPLAYED</span>) –
                      COST: <span className="text-[#f1c40f]">1,000 PTS</span> EACH
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Unlocked: <span className="text-white font-bold">{ownedItems.length}</span>/96
                    </span>
                  </div>

                  {/* 12-ITEM PRODUCT GRID (6 Columns x 2 Rows on Desktop) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
                    {paginatedItems.map((item) => {
                      const isOwned = inventory[item.id];
                      const isEquipped = equipped[item.piece] === item.id;

                      // Badge styling
                      const badgeLabel = item.category.toUpperCase();
                      const badgeBorderColor =
                        item.badgeType === 'red'
                          ? 'border-rose-500 text-rose-300 bg-rose-500/15'
                          : item.badgeType === 'cyan'
                          ? 'border-cyan-400 text-cyan-300 bg-cyan-500/15'
                          : item.badgeType === 'gold'
                          ? 'border-amber-400 text-amber-300 bg-amber-500/15'
                          : item.badgeType === 'green'
                          ? 'border-emerald-400 text-emerald-300 bg-emerald-500/15'
                          : 'border-purple-400 text-purple-300 bg-purple-500/15';

                      return (
                        <div
                          key={item.id}
                          className="bg-[#0a1024] border border-[#1d2a4d] hover:border-[#3b82f6] rounded-2xl p-2.5 flex flex-col justify-between gap-2 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.8)] group relative overflow-hidden"
                        >
                          {/* Top Badge */}
                          <div className="w-full text-center">
                            <span
                              className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${badgeBorderColor}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>

                          {/* 3D Glowing Hologram Visual */}
                          <GlowingPieceArt
                            pieceCode={item.pieceCode}
                            glowColor={item.glowColor}
                            secondaryColor={item.secondaryColor}
                            size="sm"
                          />

                          {/* Title & Subtitle */}
                          <div className="text-center space-y-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <h4 className="text-xs font-black text-white truncate group-hover:text-[#00d2ff] transition">
                                {item.name}
                              </h4>
                              {item.isCryState && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playCinematicSound(`cry_${item.piece.toLowerCase()}` as any);
                                  }}
                                  className="p-1 rounded-md bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition"
                                  title="Audition synthesized cry sound"
                                >
                                  <Volume2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">{item.piece}</p>
                          </div>

                          {/* Action Button: Dynamic PTS / Equip / Equipped */}
                          <div>
                            {isOwned ? (
                              <button
                                onClick={() => handleToggleEquip(item)}
                                className={`w-full py-1.5 rounded-xl font-black text-[10px] transition active:scale-95 flex items-center justify-center gap-1 shadow-md ${
                                  isEquipped
                                    ? 'bg-[#10b981]/25 hover:bg-rose-500/25 text-[#34d399] hover:text-rose-300 border border-[#10b981]/50 hover:border-rose-500/50'
                                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border border-blue-400/40'
                                }`}
                                title={isEquipped ? 'Click to unequip' : 'Click to equip'}
                              >
                                {isEquipped ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#34d399]" />
                                    <span>EQUIPPED</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3 h-3 text-blue-200" />
                                    <span>EQUIP</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBuy(item)}
                                className={`w-full py-1.5 rounded-xl text-slate-950 font-black text-[10px] transition active:scale-95 shadow-md flex items-center justify-center gap-1 border ${
                                  item.isCryState
                                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 border-amber-200'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-300/40'
                                }`}
                              >
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center text-[9px] font-black">
                                  $
                                </div>
                                <span>{item.price.toLocaleString()} PTS</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#17233f]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-xl bg-[#0c142b] hover:bg-[#162244] disabled:opacity-30 disabled:cursor-not-allowed border border-[#23355d] text-slate-300 font-bold text-xs flex items-center justify-center transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: Math.min(4, totalPages) }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition border ${
                              currentPage === pageNum
                                ? 'bg-[#2563eb] text-white border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                : 'bg-[#0c142b] hover:bg-[#162244] text-slate-300 border-[#23355d]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {totalPages > 4 && (
                        <>
                          <span className="text-slate-500 text-xs px-1">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition border ${
                              currentPage === totalPages
                                ? 'bg-[#2563eb] text-white border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                : 'bg-[#0c142b] hover:bg-[#162244] text-slate-300 border-[#23355d]'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-xl bg-[#0c142b] hover:bg-[#162244] disabled:opacity-30 disabled:cursor-not-allowed border border-[#23355d] text-slate-300 font-bold text-xs flex items-center justify-center transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-400 font-bold">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, filteredCatalog.length)} of {filteredCatalog.length}{' '}
                      items
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE: INVENTORY LOADOUT & LIVE TEST SANDBOX (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* BOX A: MY UNLOCKED INVENTORY / EQUIP YOUR LOADOUTS */}
                  <div className="bg-[#090e21] border border-[#1a2748] rounded-3xl p-4 shadow-xl space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#1a2748] pb-2.5">
                      <div className="text-xs font-black tracking-wider text-[#2ecc71] uppercase flex items-center gap-1.5">
                        <span>MY LOADOUT INVENTORY</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#00d2ff] uppercase">
                          EQUIP LOADOUTS
                        </span>
                        {Object.keys(equipped).length > 0 && (
                          <button
                            onClick={handleUnequipAll}
                            className="text-[9px] px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 transition active:scale-95"
                            title="Unequip all animations and effects"
                          >
                            Unequip All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6 Equipped Slot Cards Grid (3 Columns x 2 Rows) */}
                    <div className="grid grid-cols-3 gap-2">
                      {equippedItemsList.map(({ piece, pieceCode, item }) => (
                        <div
                          key={piece}
                          className={`bg-[#0a1129] border rounded-2xl p-2 flex flex-col items-center justify-between gap-1 text-center shadow-md relative group transition ${
                            item
                              ? 'border-[#20315a] hover:border-[#00d2ff]'
                              : 'border-dashed border-slate-700/60 opacity-80 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-[9px] font-black text-slate-200 truncate w-full flex items-center justify-between">
                            <span>{piece}</span>
                            {item && (
                              <button
                                onClick={() => handleUnequipPiece(piece)}
                                className="text-[8px] text-slate-400 hover:text-rose-400 font-bold"
                                title="Unequip this slot"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className="text-[8px] text-slate-400 font-bold truncate w-full">
                            {item ? `${item.category.split(' ')[0]} ${item.category.split(' ')[1] || ''}` : 'No Effect'}
                          </div>

                          {/* Mini Hologram or Empty Silhouette */}
                          <div className="w-full flex items-center justify-center py-1">
                            {item ? (
                              <GlowingPieceArt
                                pieceCode={pieceCode}
                                glowColor={item.glowColor}
                                secondaryColor={item.secondaryColor}
                                size="sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-lg text-slate-600 select-none">
                                <ChessPiece type={pieceCode.toLowerCase() as any} color="w" />
                              </div>
                            )}
                          </div>

                          {/* Green Equipped Tag / Slate Unequipped Tag */}
                          <div className="w-full pt-1">
                            {item ? (
                              <button
                                onClick={() => handleUnequipPiece(piece)}
                                className="w-full py-0.5 rounded-lg bg-[#10b981]/20 hover:bg-rose-500/20 border border-[#10b981]/60 hover:border-rose-500/60 text-[#34d399] hover:text-rose-300 font-black text-[8px] flex items-center justify-center gap-0.5 transition"
                                title="Click to unequip"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>EQUIPPED</span>
                              </button>
                            ) : (
                              <div className="w-full py-0.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 font-semibold text-[8px] flex items-center justify-center">
                                <span>UNEQUIPPED</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View All Inventory Button */}
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="w-full py-2 rounded-2xl bg-[#0c1633] hover:bg-[#12224d] text-[#00d2ff] border border-[#24417d] font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <PackageCheck className="w-4 h-4 text-[#00d2ff]" />
                      <span>View All Inventory</span>
                    </button>
                  </div>

                  {/* BOX B: LIVE TEST SANDBOX PREVIEW */}
                  <div className="bg-[#090e21] border border-[#3b1d5c] rounded-3xl p-4 shadow-xl space-y-3">
                    {/* Header */}
                    <div className="text-xs font-black tracking-wider text-[#d946ef] uppercase border-b border-[#3b1d5c] pb-2">
                      LIVE TEST SANDBOX PREVIEW
                    </div>

                    <p className="text-[11px] text-slate-300 font-medium leading-tight">
                      Test your equipped loadout item on a simulation tile:
                    </p>

                    {/* Interactive Simulation Display */}
                    <div className="flex items-center justify-center gap-3 py-2 bg-[#050814] rounded-2xl border border-white/5 p-3">
                      {/* Source Tile: Wood Tile with Marble White Rook */}
                      <div className="w-16 h-16 rounded-xl bg-[#c29b68] border-2 border-[#8c6239] flex items-center justify-center text-3xl font-serif text-slate-900 shadow-md select-none shrink-0">
                        ♖
                      </div>

                      {/* Animated Purple Arrows */}
                      <div className="flex items-center gap-0.5 text-purple-400 font-black text-base animate-pulse">
                        &gt;&gt;&gt;
                      </div>

                      {/* Target Simulation Tile with Glowing Cosmic Purple Pawn */}
                      <div className="w-16 h-16 rounded-xl bg-[#090518] border-2 border-purple-500 relative flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.5)] shrink-0">
                        {/* Radial Shockwave rings */}
                        <div
                          className={`absolute inset-0 rounded-xl bg-purple-600/30 blur-md ${
                            isSandboxTesting ? 'animate-ping' : ''
                          }`}
                        />
                        <div className="absolute w-12 h-12 rounded-full border border-purple-400/60 animate-spin-slow" />
                        <div className="text-3xl font-serif text-white z-10 drop-shadow-[0_0_10px_#c084fc]">
                          ♟
                        </div>
                      </div>

                      {/* Trigger Test Action Button */}
                      <button
                        onClick={triggerTestSandbox}
                        className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 text-white font-black text-[11px] shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/50 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <div className="leading-tight text-left">
                          <div>TRIGGER</div>
                          <div>TEST ACTION</div>
                        </div>
                      </button>
                    </div>

                    {/* Subtitle / Footer of Sandbox */}
                    <div className="text-center text-[10px] text-purple-300 font-black tracking-wide">
                      Currently Testing: Rook Occupying Animation #4
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'cry' ? (
              /* TAB: EXCLUSIVE 2,500 PTS CRY STATES FOR 6 CHESS ELEMENTS */
              <div className="space-y-4">
                {/* Banner */}
                <div className="bg-gradient-to-r from-[#1a1205] via-[#241708] to-[#120e06] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">😭</span>
                        <h3 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide">
                          EXCLUSIVE 2,500 POINTS CRY ANIMATIONS &amp; EFFECTS
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm">
                          6 ELEMENTS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        Every chess element (Pawn, Knight, Bishop, Rook, Queen, King) has an exclusive Cry Animation paired with synthesized acoustic soundwaves and custom GPU particle filters — each valued at exactly <strong className="text-amber-300">2,500 PTS</strong>. Audition their sounds, test their keyframe physics, and equip them to your live match loadouts!
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          CRY_STATES_MATRIX.forEach((spec, idx) => {
                            setTimeout(() => {
                              playCinematicSound(spec.soundType);
                            }, idx * 400);
                          });
                          setActivityLog('🔊 Auditioning all 6 Chess Element Cry Sounds sequence!');
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-400/40 flex items-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Audition All 6 Sounds</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6 Elements Cry Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CRY_STATES_MATRIX.map((spec) => {
                    const matchingCatalog = MASTER_96_CATALOG.find((c) => c.id === spec.id);
                    const isOwned = matchingCatalog ? Boolean(inventory[matchingCatalog.id]) : false;
                    const isEquipped = matchingCatalog ? equipped[matchingCatalog.piece] === matchingCatalog.id : false;

                    return (
                      <div
                        key={spec.id}
                        style={{
                          borderColor: isOwned ? `${spec.colorAccent}80` : 'rgba(245, 158, 11, 0.25)',
                        }}
                        className="bg-[#090e21] border-2 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-xl hover:shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition group relative overflow-hidden"
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">😭</span>
                            <span className="text-xs font-black text-white">{spec.pieceName}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-black">
                            <span>$</span>
                            <span>{spec.pointsValue.toLocaleString()} PTS</span>
                          </div>
                        </div>

                        {/* Center Hologram Artwork with Cry Animation on Hover/Click */}
                        <div className="relative group/art cursor-pointer" onClick={() => playCinematicSound(spec.soundType)}>
                          <GlowingPieceArt
                            pieceCode={spec.piece}
                            glowColor={spec.colorAccent}
                            secondaryColor="#ffd700"
                            size="md"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/art:opacity-100 bg-black/40 backdrop-blur-xs rounded-xl transition duration-200">
                            <div className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Audition Sound</span>
                            </div>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition truncate">
                              {spec.name}
                            </h4>
                            <span
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${spec.colorAccent}20`,
                                color: spec.colorAccent,
                              }}
                            >
                              {spec.animationName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium leading-snug">
                            {spec.description}
                          </p>
                        </div>

                        {/* Keyframe & Particle Specs */}
                        <div className="bg-[#050814] rounded-xl p-2.5 border border-white/5 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Animation:</span>
                            <span className="font-bold text-slate-200">{spec.animationTitle}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Effect Modifier:</span>
                            <span className="font-bold text-amber-300">{spec.effectModifierTitle}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>CSS Selector:</span>
                            <span className="font-mono text-[9px] text-cyan-300 truncate max-w-[180px]">{spec.cssSelector}</span>
                          </div>
                        </div>

                        {/* Interactive Buttons Bar */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {/* Audition Sound Button */}
                          <button
                            onClick={() => {
                              playCinematicSound(spec.soundType);
                              setActivityLog(`🔊 Played ${spec.pieceName} Synthesized Cry Audio!`);
                            }}
                            className="py-2 rounded-xl bg-[#0c1633] hover:bg-[#13234f] text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-1 transition active:scale-95"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Audition Sound</span>
                          </button>

                          {/* Trigger Live Board Alert */}
                          <button
                            onClick={() => {
                              triggerPieceCryState(spec.piece, 'e4');
                              setActivityLog(`😭 Triggered ${spec.pieceName} Cry State (+2,500 PTS) on Live Board!`);
                            }}
                            className="py-2 rounded-xl bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-200 font-bold text-xs border border-amber-400/40 flex items-center justify-center gap-1 transition active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Trigger on Board</span>
                          </button>
                        </div>

                        {/* Purchase / Equip Primary Button */}
                        <div>
                          {isOwned ? (
                            <button
                              onClick={() => {
                                if (matchingCatalog) handleToggleEquip(matchingCatalog);
                              }}
                              className={`w-full py-2.5 rounded-xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                                isEquipped
                                  ? 'bg-[#10b981]/25 hover:bg-rose-500/25 text-[#34d399] hover:text-rose-300 border border-[#10b981]/60 hover:border-rose-500/60'
                                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border border-blue-400/40'
                              }`}
                            >
                              {isEquipped ? (
                                <>
                                  <Check className="w-4 h-4 text-[#34d399]" />
                                  <span>EQUIPPED TO LOADOUT</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 text-blue-200" />
                                  <span>EQUIP TO [{spec.pieceName.toUpperCase()}]</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (matchingCatalog) handleBuy(matchingCatalog);
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs transition active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 border border-amber-200"
                            >
                              <div className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center text-[10px] font-black">
                                $
                              </div>
                              <span>UNLOCK CRY STATE ({spec.pointsValue.toLocaleString()} PTS)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'inventory' ? (
              /* TAB: FULL INVENTORY EXPLORER */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#17233f] pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">
                      Unlocked Loadout Inventory ({ownedItems.length} of 96 Unlocked)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click "Equip" on any unlocked item to apply its animations &amp; visual effects to your live chess matches.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-4 py-2 rounded-xl bg-[#2563eb] text-white font-bold text-xs shadow-md hover:bg-blue-600 transition"
                  >
                    Browse More in Shop
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ownedItems.map((item) => {
                    const isEquipped = equipped[item.piece] === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#0a1024] border rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-lg transition ${
                          isEquipped ? 'border-[#10b981] bg-[#0a1820]' : 'border-[#1d2a4d]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-300">{item.piece}</span>
                          {isEquipped && (
                            <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-400/40">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <GlowingPieceArt
                          pieceCode={item.pieceCode}
                          glowColor={item.glowColor}
                          secondaryColor={item.secondaryColor}
                          size="sm"
                        />

                        <div className="text-center">
                          <div className="text-xs font-black text-white truncate">{item.name}</div>
                          <div className="text-[9px] text-slate-400">{item.category}</div>
                        </div>

                        <button
                          onClick={() => handleToggleEquip(item)}
                          className={`w-full py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 ${
                            isEquipped
                              ? 'bg-[#10b981]/25 hover:bg-rose-500/20 text-[#34d399] hover:text-rose-300 border border-[#10b981]/60 hover:border-rose-500/60'
                              : 'bg-[#2ecc71] hover:bg-[#27ae60] text-slate-950'
                          }`}
                          title={isEquipped ? 'Click to unequip' : 'Click to equip'}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipped (Click to Unequip)</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3.5 h-3.5" />
                              <span>Equip Item</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB: EXPANDED SANDBOX */
              <div className="space-y-4 bg-[#090e21] border border-[#1a2748] rounded-3xl p-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h3 className="text-lg font-black text-white">Full Simulation Arena Sandbox</h3>
                  <p className="text-xs text-slate-400">
                    Test hardware keyframe visual animation routines for any piece loadout on a real dual-tile chessboard stage.
                  </p>
                </div>

                {/* Piece Selector */}
                <div className="flex items-center justify-center gap-2">
                  {(['p', 'n', 'b', 'r', 'q', 'k'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSandboxPiece(p)}
                      className={`w-10 h-10 rounded-2xl font-black text-sm transition flex items-center justify-center border ${
                        sandboxPiece === p
                          ? 'bg-[#2563eb] text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                          : 'bg-[#0c142b] text-slate-400 border-[#23355d] hover:text-white'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Stage */}
                <div className="flex items-center justify-center gap-6 py-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#c29b68] border-4 border-[#8c6239] flex items-center justify-center text-5xl font-serif text-slate-900 shadow-xl select-none">
                    ♖
                  </div>

                  <div className="flex items-center gap-1 text-purple-400 font-black text-2xl animate-pulse">
                    &gt;&gt;&gt;
                  </div>

                  <div className="w-24 h-24 rounded-2xl bg-[#090518] border-4 border-purple-500 relative flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.7)]">
                    <div
                      key={sandboxAnimKey}
                      className={`text-5xl font-serif text-white z-10 drop-shadow-[0_0_15px_#c084fc] ${
                        isSandboxTesting ? 'animate-bounce' : ''
                      }`}
                    >
                      {sandboxPiece === 'p'
                        ? '♟'
                        : sandboxPiece === 'n'
                        ? '♞'
                        : sandboxPiece === 'b'
                        ? '♝'
                        : sandboxPiece === 'r'
                        ? '♜'
                        : sandboxPiece === 'q'
                        ? '♛'
                        : '♚'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={triggerTestSandbox}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center gap-2 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Trigger Replay Animation</span>
                  </button>
                  {onOpenCinematicShowcase && (
                    <button
                      onClick={onOpenCinematicShowcase}
                      className="px-5 py-3 rounded-2xl bg-[#0c1633] hover:bg-[#12224d] text-cyan-300 border border-cyan-400/40 font-bold text-xs transition"
                    >
                      Open Broadcast VFX Studio
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. BOTTOM ACTIVITY LOG & FOOTER BAR (Exact Match to Image) */}
          <div className="px-5 py-2.5 bg-[#050916] border-t border-[#17233f] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Activity Log Badge */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="px-3 py-1 rounded-xl bg-[#0b142d] border border-[#23355d] text-[#00d2ff] font-black text-[11px] flex items-center gap-1.5 shrink-0 shadow-sm">
                <Volume2 className="w-3.5 h-3.5 text-[#00d2ff]" />
                <span>ACTIVITY LOG</span>
              </div>

              {/* Status Message */}
              <div className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-[#2ecc71] shrink-0" />
                <span className="truncate">{activityLog}</span>
              </div>
            </div>

            {/* Right: Made In India Badge */}
            <div className="flex items-center gap-2 text-slate-300 font-black text-[11px] shrink-0 pl-2">
              <div className="w-6 h-4 border border-white/20 rounded-xs flex flex-col overflow-hidden shadow-xs">
                <div className="flex-1 bg-[#FF9933]" />
                <div className="flex-1 bg-[#FFFFFF] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full border border-[#000080]" />
                </div>
                <div className="flex-1 bg-[#138808]" />
              </div>
              <span className="tracking-wide uppercase text-slate-200">MADE IN INDIA</span>
              <span className="text-rose-500">❤️</span>
            </div>
          </div>
        </motion.div>

        {/* Earn Points Authentic Tasks Modal */}
        {isEarnModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-[#0a1126] border-2 border-[#f1c40f] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Authentic Points Earning Tasks</h3>
                    <p className="text-xs text-slate-400">
                      Points are strictly earned by completing these 3 gameplay activities:
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEarnModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-left">
                {/* 1. Daily Wheel */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/40 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. 25-Segment Daily Lucky Wheel</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                        100 - 11,500 PTS + 1M Jackpot
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Spin once every 24h across 25 segments with an annual global 1M Jackpot winner!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEarnModalOpen(false);
                      if (onOpenDailyWheel) {
                        onClose();
                        onOpenDailyWheel();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 shrink-0"
                  >
                    {wheelStatus.canSpin ? 'Spin Wheel' : 'View Wheel'}
                  </button>
                </div>

                {/* 2. Simultaneous Hatrick */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-400/40 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2. Simultaneous Hatrick</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                        +2,000 PTS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Deliver 3 consecutive captures in a match. Current streak: {hatrickData.currentCaptureStreak}/3.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEarnModalOpen(false);
                      if (onOpenQuests) {
                        onClose();
                        onOpenQuests();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 shrink-0"
                  >
                    Hatrick Tracker
                  </button>
                </div>

                {/* 3. Random Quests */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-400/40 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3. Complete Random Quests</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                        +800 - 2,500 PTS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {activeQuests.length} daily random quests ready in your task center.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEarnModalOpen(false);
                      if (onOpenQuests) {
                        onClose();
                        onOpenQuests();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 shrink-0"
                  >
                    Open Quests
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsEarnModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
