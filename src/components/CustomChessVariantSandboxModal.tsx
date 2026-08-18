import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Play,
  Save,
  Check,
  RefreshCw,
  Trash2,
  Shield,
  Info,
  Palette,
  Flame,
  History,
  BookOpen,
  Copy,
  ExternalLink,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from 'lucide-react';
import { ChessPiece } from '../utils/chessPieces';
import { BoardTheme, ChessVariantRecord } from '../types';
import {
  DEFAULT_PRESET_VARIANTS,
  getSavedVariantHistory,
  saveVariantToHistory,
  deleteVariantFromHistory,
  validateChessLayout,
  layoutToFen,
  voteOnVariant,
} from '../utils/variantManager';

interface CustomChessVariantSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVariant?: (variantConfig: {
    name?: string;
    boardSize: number;
    timeLimit: number;
    layout: Record<string, string>;
    theme?: BoardTheme;
    fen?: string;
  }) => void;
}

interface PieceDefinition {
  value: string;
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  label: string;
  name: string;
}

const PIECE_OPTIONS: PieceDefinition[] = [
  { value: 'wP', type: 'p', color: 'w', label: 'White Pawn (♙)', name: 'White Pawn' },
  { value: 'wN', type: 'n', color: 'w', label: 'White Knight (♘)', name: 'White Knight' },
  { value: 'wB', type: 'b', color: 'w', label: 'White Bishop (♗)', name: 'White Bishop' },
  { value: 'wR', type: 'r', color: 'w', label: 'White Rook (♖)', name: 'White Rook' },
  { value: 'wQ', type: 'q', color: 'w', label: 'White Queen (♕)', name: 'White Queen' },
  { value: 'wK', type: 'k', color: 'w', label: 'White King (♔)', name: 'White King' },
  { value: 'bP', type: 'p', color: 'b', label: 'Black Pawn (♟)', name: 'Black Pawn' },
  { value: 'bN', type: 'n', color: 'b', label: 'Black Knight (♞)', name: 'Black Knight' },
  { value: 'bB', type: 'b', color: 'b', label: 'Black Bishop (♝)', name: 'Black Bishop' },
  { value: 'bR', type: 'r', color: 'b', label: 'Black Rook (♜)', name: 'Black Rook' },
  { value: 'bQ', type: 'q', color: 'b', label: 'Black Queen (♛)', name: 'Black Queen' },
  { value: 'bK', type: 'k', color: 'b', label: 'Black King (♚)', name: 'Black King' },
];

const SANDBOX_THEMES: Record<
  BoardTheme,
  {
    name: string;
    light: string;
    dark: string;
    lightText: string;
    darkText: string;
    border: string;
    frameBg: string;
  }
> = {
  terracotta: {
    name: 'Terracotta Sienna (Image Match)',
    light: 'bg-[#eed7b5]',
    dark: 'bg-[#be5b3c]',
    lightText: 'text-[#be5b3c]',
    darkText: 'text-[#eed7b5]',
    border: 'border-[#8c3d25]',
    frameBg: 'bg-[#4a1c10]',
  },
  emerald: {
    name: 'Classic Tournament Green',
    light: 'bg-[#eeeed2]',
    dark: 'bg-[#769656]',
    lightText: 'text-[#769656]',
    darkText: 'text-[#eeeed2]',
    border: 'border-[#4e6b36]',
    frameBg: 'bg-[#223318]',
  },
  wood: {
    name: 'Walnut & Maple Wood',
    light: 'bg-[#f0d9b5]',
    dark: 'bg-[#b58863]',
    lightText: 'text-[#b58863]',
    darkText: 'text-[#f0d9b5]',
    border: 'border-[#8c6243]',
    frameBg: 'bg-[#3b2314]',
  },
  slate: {
    name: 'Modern Slate Blue',
    light: 'bg-[#e2e8f0]',
    dark: 'bg-[#475569]',
    lightText: 'text-[#475569]',
    darkText: 'text-[#e2e8f0]',
    border: 'border-slate-700',
    frameBg: 'bg-slate-900',
  },
  stone: {
    name: 'Obsidian Marble',
    light: 'bg-[#e7e5e4]',
    dark: 'bg-[#57534e]',
    lightText: 'text-[#57534e]',
    darkText: 'text-[#e7e5e4]',
    border: 'border-stone-700',
    frameBg: 'bg-stone-900',
  },
  neon: {
    name: 'Cyberpunk Neon',
    light: 'bg-[#ede9fe]',
    dark: 'bg-[#312e81]',
    lightText: 'text-[#312e81]',
    darkText: 'text-[#ede9fe]',
    border: 'border-indigo-800',
    frameBg: 'bg-[#151230]',
  },
  ocean: {
    name: 'Pacific Azure',
    light: 'bg-[#e0f2fe]',
    dark: 'bg-[#0284c7]',
    lightText: 'text-[#0284c7]',
    darkText: 'text-[#e0f2fe]',
    border: 'border-sky-800',
    frameBg: 'bg-[#062038]',
  },
  crimson: {
    name: 'Royal Velvet',
    light: 'bg-[#fef2f2]',
    dark: 'bg-[#991b1b]',
    lightText: 'text-[#991b1b]',
    darkText: 'text-[#fef2f2]',
    border: 'border-rose-900',
    frameBg: 'bg-[#2b0808]',
  },
  glass: {
    name: 'Nordic Crystal',
    light: 'bg-[#f8fafc]',
    dark: 'bg-[#334155]',
    lightText: 'text-[#334155]',
    darkText: 'text-[#f8fafc]',
    border: 'border-slate-600',
    frameBg: 'bg-[#111827]',
  },
  cyber: {
    name: 'Cyber Neon (Cinematic Image Match)',
    light: 'bg-[#28384f]',
    dark: 'bg-[#121c2a]',
    lightText: 'text-[#38bdf8]',
    darkText: 'text-[#00f2fe]',
    border: 'border-cyan-400',
    frameBg: 'bg-[#070e1b]',
  },
};

const parsePieceCode = (code: string): { type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: 'w' | 'b' } | null => {
  if (!code || code.length < 2) return null;
  const color = code.charAt(0).toLowerCase() === 'b' ? 'b' : 'w';
  const typeChar = code.charAt(1).toLowerCase();
  const validTypes: ('p' | 'n' | 'b' | 'r' | 'q' | 'k')[] = ['p', 'n', 'b', 'r', 'q', 'k'];
  const type = validTypes.includes(typeChar as any) ? (typeChar as 'p' | 'n' | 'b' | 'r' | 'q' | 'k') : 'p';
  return { color, type };
};

export const CustomChessVariantSandboxModal: React.FC<CustomChessVariantSandboxModalProps> = ({
  isOpen,
  onClose,
  onApplyVariant,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [variantName, setVariantName] = useState<string>('Spider Chess 3v3 Meme');
  const [variantDescription, setVariantDescription] = useState<string>('Custom 3 pawns vs 3 pawns endgame dash');
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);

  const [boardSize, setBoardSize] = useState<number>(8);
  const [turnTime, setTurnTime] = useState<number>(300);
  const [selectedPiece, setSelectedPiece] = useState<string>('wP');
  const [customPieceLayout, setCustomPieceLayout] = useState<Record<string, string>>({});
  const [selectedTheme, setSelectedTheme] = useState<BoardTheme>('terracotta');

  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<ChessVariantRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'top' | 'newest' | 'all'>('top');
  const [copiedFenId, setCopiedFenId] = useState<string | null>(null);

  // Initialize Standard Board Layout helper
  const initDefaultLayout = (size: number) => {
    const layout: Record<string, string> = {};
    if (size === 8) {
      const bRow = ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'];
      bRow.forEach((p, c) => {
        layout[`0,${c}`] = p;
      });
      for (let c = 0; c < 8; c++) layout[`1,${c}`] = 'bP';
      for (let c = 0; c < 8; c++) layout[`6,${c}`] = 'wP';
      const wRow = ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'];
      wRow.forEach((p, c) => {
        layout[`7,${c}`] = p;
      });
    } else if (size === 6) {
      const bRow = ['bR', 'bN', 'bQ', 'bK', 'bN', 'bR'];
      bRow.forEach((p, c) => {
        layout[`0,${c}`] = p;
      });
      for (let c = 0; c < 6; c++) layout[`1,${c}`] = 'bP';
      for (let c = 0; c < 6; c++) layout[`4,${c}`] = 'wP';
      const wRow = ['wR', 'wN', 'wQ', 'wK', 'wN', 'wR'];
      wRow.forEach((p, c) => {
        layout[`5,${c}`] = p;
      });
    } else if (size === 10) {
      const bRow = ['bR', 'bN', 'bB', 'bQ', 'bK', 'bK', 'bQ', 'bB', 'bN', 'bR'];
      bRow.forEach((p, c) => {
        layout[`0,${c}`] = p;
      });
      for (let c = 0; c < 10; c++) layout[`1,${c}`] = 'bP';
      for (let c = 0; c < 10; c++) layout[`8,${c}`] = 'wP';
      const wRow = ['wR', 'wN', 'wB', 'wQ', 'wK', 'wK', 'wQ', 'wB', 'wN', 'wR'];
      wRow.forEach((p, c) => {
        layout[`9,${c}`] = p;
      });
    }
    return layout;
  };

  // Load preset from the uploaded image meme (Spider Chess: 3 pawns vs 3 pawns endgame)
  const loadSpiderMemePreset = () => {
    setBoardSize(8);
    setVariantName('3 Pawns vs 3 Pawns Endgame (Spider Meme)');
    setVariantDescription('White King & 4 pawns vs Black King & 3 pawns in an intense geometric sprint.');
    const layout: Record<string, string> = {
      '0,7': 'bK', // Black King on h8
      '1,6': 'bP', // Black Pawn on g7
      '2,5': 'bP', // Black Pawn on f6
      '3,4': 'bP', // Black Pawn on e5
      '4,3': 'wP', // White Pawn on d4
      '5,2': 'wP', // White Pawn on c3
      '6,0': 'wP', // White Pawn on a2
      '6,1': 'wP', // White Pawn on b2
      '7,0': 'wK', // White King on a1
    };
    setCustomPieceLayout(layout);
    setSelectedTheme('terracotta');
    setValidationWarning(null);
  };

  // Refresh history records from storage
  const reloadHistory = () => {
    const list = getSavedVariantHistory();
    setHistoryList(list);
  };

  useEffect(() => {
    if (isOpen) {
      reloadHistory();
      // If layout is currently empty, load the Spider Meme or default
      if (Object.keys(customPieceLayout).length === 0) {
        loadSpiderMemePreset();
      }
    }
  }, [isOpen]);

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    setCustomPieceLayout(initDefaultLayout(newSize));
    setValidationWarning(null);
  };

  const handleSquareClick = (squareKey: string) => {
    setCustomPieceLayout((prev) => {
      const next = { ...prev };
      if (next[squareKey] === selectedPiece) {
        delete next[squareKey];
      } else {
        next[squareKey] = selectedPiece;
      }
      return next;
    });
    setValidationWarning(null);
  };

  const clearBoard = () => {
    setCustomPieceLayout({});
    setValidationWarning(null);
  };

  const resetToStandard = () => {
    setBoardSize(8);
    setCustomPieceLayout(initDefaultLayout(8));
    setVariantName('Standard Chess Setup');
    setVariantDescription('Official Staunton classical setup with 16 pieces per side.');
    setValidationWarning(null);
  };

  // Load a record from history into the active Sandbox Editor
  const handleLoadIntoEditor = (variant: ChessVariantRecord) => {
    setBoardSize(variant.boardSize);
    setTurnTime(variant.timeLimit);
    setCustomPieceLayout({ ...variant.layout });
    setVariantName(variant.name);
    setVariantDescription(variant.description || '');
    if (variant.theme) setSelectedTheme(variant.theme);
    setCurrentVariantId(variant.isPreset ? null : variant.id);
    setActiveTab('editor');
    setSavedSuccessMessage(`Loaded "${variant.name}" into Sandbox editor!`);
    setTimeout(() => setSavedSuccessMessage(null), 3000);
  };

  // Directly apply and launch the variant into the Main Board Chess Game
  const handleLoadAndPlayInMainChess = (variantRecord?: ChessVariantRecord) => {
    const targetLayout = variantRecord ? variantRecord.layout : customPieceLayout;
    const targetSize = variantRecord ? variantRecord.boardSize : boardSize;
    const targetTime = variantRecord ? variantRecord.timeLimit : turnTime;
    const targetTheme = variantRecord ? variantRecord.theme || selectedTheme : selectedTheme;
    const targetName = variantRecord ? variantRecord.name : variantName;

    // Validate layout
    const validation = validateChessLayout(targetLayout, targetSize);
    if (!validation.isValid) {
      setValidationWarning(validation.message || 'Invalid position for standard chess rules.');
      setActiveTab('editor');
      return;
    }

    // Save into history automatically if not already existing
    const saved = saveVariantToHistory({
      id: currentVariantId || undefined,
      name: targetName,
      description: variantDescription,
      boardSize: targetSize,
      timeLimit: targetTime,
      layout: targetLayout,
      theme: targetTheme,
    });
    reloadHistory();

    const fen = layoutToFen(targetLayout, targetSize);

    if (onApplyVariant) {
      onApplyVariant({
        name: targetName,
        boardSize: targetSize,
        timeLimit: targetTime,
        layout: targetLayout,
        theme: targetTheme,
        fen,
      });
    }

    onClose();
  };

  // Save variant to history without necessarily closing modal
  const handleSaveToHistory = () => {
    const validation = validateChessLayout(customPieceLayout, boardSize);
    if (!validation.isValid) {
      setValidationWarning(validation.message || 'Please ensure position is valid.');
    }

    const saved = saveVariantToHistory({
      id: currentVariantId || undefined,
      name: variantName.trim() || 'Custom Chess Variant',
      description: variantDescription.trim() || 'Custom sandbox arrangement',
      boardSize,
      timeLimit: turnTime,
      layout: customPieceLayout,
      theme: selectedTheme,
    });

    setCurrentVariantId(saved.id);
    reloadHistory();
    setSavedSuccessMessage(`Saved "${saved.name}" to variant history!`);
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const handleDeleteVariant = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteVariantFromHistory(id);
    setHistoryList(updated);
    if (currentVariantId === id) setCurrentVariantId(null);
  };

  const handleVote = (variantId: string, direction: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = voteOnVariant(variantId, direction);
    setHistoryList(updated);
  };

  const handleCopyFen = (fenStr: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fenStr);
    setCopiedFenId(id);
    setTimeout(() => setCopiedFenId(null), 2500);
  };

  if (!isOpen) return null;

  const activePiecesList = Object.values(customPieceLayout);
  const totalPieces = activePiecesList.length;
  const whitePiecesCount = activePiecesList.filter((p) => p.startsWith('w')).length;
  const blackPiecesCount = activePiecesList.filter((p) => p.startsWith('b')).length;
  const currentTheme = SANDBOX_THEMES[selectedTheme] || SANDBOX_THEMES.terracotta;

  const fileLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  // Filter and sort history records based on search query and sort criteria
  const filteredHistory = historyList
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'top') {
        const scoreA = a.score ?? (a.upvotes || 0) - (a.downvotes || 0);
        const scoreB = b.score ?? (b.upvotes || 0) - (b.downvotes || 0);
        return scoreB - scoreA;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-2 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="container max-w-[760px] w-full bg-[#18181b] border border-white/15 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col my-auto text-white max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#7c2d12]/40 via-[#18181b] to-[#1e1b4b]/40 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-400 tracking-tight leading-tight">
                Custom Chess Variant Sandbox &amp; History
              </h2>
              <p className="text-[11px] text-amber-200/70 font-medium">
                Design custom piece layouts, save variant blueprints, and load instantly into Main Chess
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#141416] px-4 sm:px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t-2 ${
              activeTab === 'editor'
                ? 'bg-[#232326] text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Sandbox Editor</span>
            <span className="ml-1 px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded-full">
              {totalPieces} pcs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t-2 ${
              activeTab === 'history'
                ? 'bg-[#232326] text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Saved Variants History</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/10 text-white/80 text-[10px] rounded-full">
              {historyList.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Global Alert / Feedback */}
          {savedSuccessMessage && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{savedSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSavedSuccessMessage(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {validationWarning && (
            <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-200 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{validationWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationWarning(null)}
                className="text-amber-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: SANDBOX EDITOR */}
          {activeTab === 'editor' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Section 1: Variant Title & Description */}
              <div className="section bg-[#232326] p-4 rounded-xl border border-white/10 space-y-3 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="variantName" className="block mb-1 text-xs font-bold text-slate-300">
                      Variant Title / Name:
                    </label>
                    <input
                      type="text"
                      id="variantName"
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                      placeholder="e.g. Spider Meme 3v3 Endgame"
                      className="w-full p-2.5 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs font-semibold focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="variantDescription" className="block mb-1 text-xs font-bold text-slate-300">
                      Notes / Strategic Goal:
                    </label>
                    <input
                      type="text"
                      id="variantDescription"
                      value={variantDescription}
                      onChange={(e) => setVariantDescription(e.target.value)}
                      placeholder="e.g. Fast-paced pawn race to 8th rank"
                      className="w-full p-2.5 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs font-semibold focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Board Dimensions & Time Rules */}
              <div className="section bg-[#232326] p-4 rounded-xl border border-white/10 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Board Dimensions &amp; Time Rules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/50 font-bold">Theme:</span>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value as BoardTheme)}
                      className="px-2 py-1 bg-[#18181b] border border-white/20 text-white rounded text-xs font-semibold focus:border-amber-400 focus:outline-none cursor-pointer"
                    >
                      {(Object.keys(SANDBOX_THEMES) as BoardTheme[]).map((tKey) => (
                        <option key={tKey} value={tKey}>
                          {SANDBOX_THEMES[tKey].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="boardSize" className="block mb-1 text-xs font-bold text-slate-300">
                      Select Board Dimensions:
                    </label>
                    <select
                      id="boardSize"
                      value={boardSize}
                      onChange={(e) => handleBoardSizeChange(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs font-semibold focus:border-amber-400 focus:outline-none transition cursor-pointer"
                    >
                      <option value="8">Standard 8x8 Board (Full Rule Support)</option>
                      <option value="6">Compact 6x6 Board</option>
                      <option value="10">Large 10x10 Board</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="turnTime" className="block mb-1 text-xs font-bold text-slate-300">
                      Match Time Limit (Seconds):
                    </label>
                    <input
                      type="number"
                      id="turnTime"
                      value={turnTime}
                      min={30}
                      onChange={(e) => setTurnTime(Math.max(30, parseInt(e.target.value, 10) || 30))}
                      className="w-full p-2.5 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs font-mono focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Piece Customization & Board Grid */}
              <div className="section bg-[#232326] p-4 rounded-xl border border-white/10 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Piece Palette &amp; Interactive Placement
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full">
                      Total: {totalPieces}
                    </span>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      W: {whitePiecesCount}
                    </span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                      B: {blackPiecesCount}
                    </span>
                  </div>
                </div>

                {/* Piece Selector */}
                <div>
                  <select
                    id="selectedPiece"
                    value={selectedPiece}
                    onChange={(e) => setSelectedPiece(e.target.value)}
                    className="w-full p-2.5 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs font-semibold focus:border-amber-400 focus:outline-none transition cursor-pointer mb-2.5"
                  >
                    {PIECE_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <div className="bg-[#18181b] border border-white/10 rounded-xl p-3 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">
                          White Pieces (Staunton Vector)
                        </span>
                        {selectedPiece.startsWith('w') && (
                          <span className="text-[10px] font-bold text-amber-400">Selected: {selectedPiece}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {PIECE_OPTIONS.filter((p) => p.color === 'w').map((p) => {
                          const isSelected = selectedPiece === p.value;
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setSelectedPiece(p.value)}
                              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center transition relative ${
                                isSelected
                                  ? 'bg-amber-400/30 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105 z-10'
                                  : 'bg-[#2a2a2e] hover:bg-[#38383e] border border-white/10'
                              }`}
                              title={p.name}
                            >
                              <ChessPiece type={p.type} color="w" className="w-full h-full" />
                              <span className="text-[9px] font-mono text-slate-300 leading-none">{p.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Black Pieces (Staunton Vector)
                        </span>
                        {selectedPiece.startsWith('b') && (
                          <span className="text-[10px] font-bold text-slate-300">Selected: {selectedPiece}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {PIECE_OPTIONS.filter((p) => p.color === 'b').map((p) => {
                          const isSelected = selectedPiece === p.value;
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setSelectedPiece(p.value)}
                              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center transition relative ${
                                isSelected
                                  ? 'bg-amber-400/30 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105 z-10'
                                  : 'bg-[#2a2a2e] hover:bg-[#38383e] border border-white/10'
                              }`}
                              title={p.name}
                            >
                              <ChessPiece type={p.type} color="b" className="w-full h-full" />
                              <span className="text-[9px] font-mono text-slate-300 leading-none">{p.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presets & Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-300 font-semibold">Quick Presets &amp; Tools:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={loadSpiderMemePreset}
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-orange-600/30 hover:bg-orange-600/40 text-orange-200 text-[11px] font-bold flex items-center gap-1 border border-orange-400/40 transition shadow-sm"
                      title="Load the 3 Pawns vs 3 Pawns Endgame Meme"
                    >
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>Spider 3v3 Preset</span>
                    </button>
                    <button
                      onClick={resetToStandard}
                      type="button"
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-semibold flex items-center gap-1 border border-white/10 transition"
                      title="Reset to default rank layout"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Standard
                    </button>
                    <button
                      onClick={clearBoard}
                      type="button"
                      className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold flex items-center gap-1 border border-red-400/30 transition"
                      title="Clear all pieces"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Enhanced Interactive Board Grid */}
                <div
                  className={`p-2 rounded-2xl ${currentTheme.frameBg} border-2 ${currentTheme.border} shadow-2xl max-w-md mx-auto`}
                >
                  <div
                    id="boardPreview"
                    className="grid-preview grid gap-0 rounded-lg overflow-hidden border border-white/20 shadow-inner w-full aspect-square"
                    style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: boardSize }).map((_, r) =>
                      Array.from({ length: boardSize }).map((_, c) => {
                        const coordKey = `${r},${c}`;
                        const pieceVal = customPieceLayout[coordKey];
                        const isLight = (r + c) % 2 === 0;
                        const parsed = pieceVal ? parsePieceCode(pieceVal) : null;

                        const rankLabel = boardSize - r;
                        const fileLabel = fileLetters[c] || `${c}`;

                        return (
                          <div
                            key={coordKey}
                            data-coord={coordKey}
                            onClick={() => handleSquareClick(coordKey)}
                            className={`square aspect-square flex flex-col items-center justify-center cursor-pointer select-none relative group transition-colors duration-150 ${
                              isLight ? currentTheme.light : currentTheme.dark
                            }`}
                          >
                            {/* Coordinate labels */}
                            {c === 0 && (
                              <span
                                className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-black font-mono select-none pointer-events-none z-10 leading-none ${
                                  isLight ? currentTheme.lightText : currentTheme.darkText
                                }`}
                              >
                                {rankLabel}
                              </span>
                            )}
                            {r === boardSize - 1 && (
                              <span
                                className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-black font-mono select-none pointer-events-none z-10 leading-none ${
                                  isLight ? currentTheme.lightText : currentTheme.darkText
                                }`}
                              >
                                {fileLabel}
                              </span>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none z-10" />

                            {/* Piece Vector */}
                            {parsed && (
                              <div className="w-full h-full p-1 sm:p-1.5 flex items-center justify-center pointer-events-none z-20">
                                <ChessPiece type={parsed.type} color={parsed.color} className="w-full h-full" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save & Load to Main Chess */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="w-full py-3.5 bg-[#2a2a2e] hover:bg-[#38383e] border border-white/20 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Variant to History</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadAndPlayInMainChess()}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Load &amp; Play on Main Board</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED VARIANTS & HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Search & Actions Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#232326] p-3 rounded-xl border border-white/10">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved variants by name or tag..."
                    className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-white/20 text-white rounded-lg text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort Filter */}
                  <div className="flex items-center bg-[#18181b] border border-white/10 rounded-lg p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSortBy('top')}
                      className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition ${
                        sortBy === 'top'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Sort by highest community score (+1/-1 votes)"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Top Rated</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('newest')}
                      className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition ${
                        sortBy === 'newest'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Sort by recently created"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Newest</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetToStandard();
                      setActiveTab('editor');
                    }}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* History Cards List */}
              <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center bg-[#232326] rounded-xl border border-white/10 text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-400" />
                    <p className="text-xs font-medium">No custom variants found matching your search.</p>
                  </div>
                ) : (
                  filteredHistory.map((variant) => {
                    const themeObj = SANDBOX_THEMES[variant.theme || 'terracotta'] || SANDBOX_THEMES.terracotta;
                    const fenDisplay = variant.fen || (variant.boardSize === 8 ? layoutToFen(variant.layout, 8) : '');
                    const currentScore = variant.score ?? ((variant.upvotes || 0) - (variant.downvotes || 0));

                    return (
                      <div
                        key={variant.id}
                        className="p-4 bg-[#232326] hover:bg-[#28282d] border border-white/10 hover:border-amber-400/50 rounded-xl transition duration-200 space-y-3 group shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {/* Mini Board Thumbnail */}
                            <div
                              className={`w-14 h-14 rounded-lg overflow-hidden grid border border-white/20 flex-shrink-0 shadow ${themeObj.border}`}
                              style={{ gridTemplateColumns: `repeat(${variant.boardSize}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: variant.boardSize }).map((_, r) =>
                                Array.from({ length: variant.boardSize }).map((_, c) => {
                                  const pieceVal = variant.layout[`${r},${c}`];
                                  const isLight = (r + c) % 2 === 0;
                                  const parsed = pieceVal ? parsePieceCode(pieceVal) : null;
                                  return (
                                    <div
                                      key={`${r},${c}`}
                                      className={`w-full h-full flex items-center justify-center ${
                                        isLight ? themeObj.light : themeObj.dark
                                      }`}
                                    >
                                      {parsed && (
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            parsed.color === 'w' ? 'bg-white shadow' : 'bg-slate-900'
                                          }`}
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                                  {variant.name}
                                </h4>
                                {variant.isPreset && (
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-black rounded-full uppercase tracking-wider">
                                    Preset
                                  </span>
                                )}
                              </div>
                              {variant.description && (
                                <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 font-medium">
                                  {variant.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono flex-wrap">
                                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                  {variant.boardSize}x{variant.boardSize}
                                </span>
                                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                  {variant.timeLimit}s Clock
                                </span>
                                <span className="text-amber-300/90 font-bold">
                                  {variant.totalPieces} Pieces (W:{variant.whiteCount} B:{variant.blackCount})
                                </span>
                                <span>{new Date(variant.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Voting & Actions */}
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Voting Component (+1 / -1) */}
                            <div className="flex items-center bg-[#18181b] border border-white/10 rounded-lg p-1 gap-1 shadow-inner">
                              <button
                                type="button"
                                onClick={(e) => handleVote(variant.id, 1, e)}
                                className={`px-2 py-1 rounded-md text-xs font-black flex items-center gap-1 transition ${
                                  variant.userVote === 1
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                                    : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'
                                }`}
                                title="Upvote (+1) this custom variant"
                              >
                                <ThumbsUp className={`w-3.5 h-3.5 ${variant.userVote === 1 ? 'fill-slate-950' : ''}`} />
                                <span>+1</span>
                              </button>

                              <div className="px-1.5 text-center min-w-[28px]">
                                <span
                                  className={`text-xs font-mono font-black ${
                                    currentScore > 0
                                      ? 'text-emerald-400'
                                      : currentScore < 0
                                      ? 'text-rose-400'
                                      : 'text-slate-400'
                                  }`}
                                  title={`${variant.upvotes || 0} upvotes, ${variant.downvotes || 0} downvotes`}
                                >
                                  {currentScore > 0 ? `+${currentScore}` : currentScore}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleVote(variant.id, -1, e)}
                                className={`px-2 py-1 rounded-md text-xs font-black flex items-center gap-1 transition ${
                                  variant.userVote === -1
                                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                                    : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                                }`}
                                title="Downvote (-1) this custom variant"
                              >
                                <ThumbsDown className={`w-3.5 h-3.5 ${variant.userVote === -1 ? 'fill-white' : ''}`} />
                                <span>-1</span>
                              </button>
                            </div>

                            {/* Copy FEN */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyFen(fenDisplay, variant.id, e)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                              title="Copy FEN position"
                            >
                              {copiedFenId === variant.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Edit in Sandbox */}
                            <button
                              type="button"
                              onClick={() => handleLoadIntoEditor(variant)}
                              className="px-2.5 py-2 rounded-lg bg-[#303036] hover:bg-[#3c3c44] text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition"
                              title="Open and edit layout in Sandbox"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* Play on Main */}
                            <button
                              type="button"
                              onClick={() => handleLoadAndPlayInMainChess(variant)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                              title="Load directly into the active Main Chess Board"
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-950" />
                              <span className="hidden sm:inline">Play on Main</span>
                              <span className="sm:hidden">Play</span>
                            </button>

                            {!variant.isPreset && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteVariant(variant.id, e)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                title="Delete variant from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* FEN Preview snippet & Community Rating stats */}
                        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[10px] font-mono text-slate-400 bg-[#19191c] px-2.5 py-1.5 rounded-md">
                          <span className="truncate max-w-[420px] text-slate-300">
                            {fenDisplay ? `FEN: ${fenDisplay}` : `${variant.boardSize}x${variant.boardSize} Custom Variant`}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-emerald-400 font-bold">{variant.upvotes || 0} 👍</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-rose-400 font-bold">{variant.downvotes || 0} 👎</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-400/90 font-bold">Staunton {variant.boardSize}x{variant.boardSize}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
