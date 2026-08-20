import React, { useState, useEffect } from 'react';
import { Dices, RotateCcw, Trophy, Bot, User, Settings, Palette, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

interface SnakesAndLaddersBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export interface PlayerConfig {
  id: number;
  name: string;
  pos: number;
  color: string;
  colorName: string;
  isAi: boolean;
}

// Ladders: bottom square -> top square
const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  15: 55,
  21: 42,
  28: 84,
  36: 66,
  51: 67,
  71: 91,
  80: 98,
};

// Snakes: head square -> tail square
const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 36,
  93: 73,
  95: 75,
  99: 54,
};

// Colors for snakes
const SNAKE_COLORS = [
  { body: '#22c55e', belly: '#86efac', spots: '#15803d' }, // Lime
  { body: '#06b6d4', belly: '#67e8f9', spots: '#0e7490' }, // Cyan
  { body: '#a855f7', belly: '#d8b4fe', spots: '#7e22ce' }, // Purple
  { body: '#ef4444', belly: '#fca5a5', spots: '#b91c1c' }, // Red
];

// Tile background colors pattern
const TILE_PALETTE = [
  '#facc15', // Vibrant Yellow
  '#fb923c', // Bright Orange
  '#f87171', // Soft Red
  '#a3e635', // Lime Green
];

// Available Player Color Options
export const COLOR_PALETTE = [
  { hex: '#ef4444', name: 'Red', bgClass: 'bg-red-500', borderClass: 'border-red-400', ringClass: 'ring-red-500/50' },
  { hex: '#06b6d4', name: 'Cyan', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-400', ringClass: 'ring-cyan-500/50' },
  { hex: '#10b981', name: 'Emerald', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-400', ringClass: 'ring-emerald-500/50' },
  { hex: '#f59e0b', name: 'Gold', bgClass: 'bg-amber-500', borderClass: 'border-amber-400', ringClass: 'ring-amber-500/50' },
  { hex: '#a855f7', name: 'Purple', bgClass: 'bg-purple-500', borderClass: 'border-purple-400', ringClass: 'ring-purple-500/50' },
  { hex: '#ec4899', name: 'Pink', bgClass: 'bg-pink-500', borderClass: 'border-pink-400', ringClass: 'ring-pink-500/50' },
  { hex: '#f97316', name: 'Orange', bgClass: 'bg-orange-500', borderClass: 'border-orange-400', ringClass: 'ring-orange-500/50' },
];

export const SnakesAndLaddersBoard: React.FC<SnakesAndLaddersBoardProps> = ({ gameMode = 'ai', onGameEnd }) => {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { id: 1, name: 'Player 1', pos: 1, color: COLOR_PALETTE[0].hex, colorName: COLOR_PALETTE[0].name, isAi: false },
    { id: 2, name: 'Player 2', pos: 1, color: COLOR_PALETTE[1].hex, colorName: COLOR_PALETTE[1].name, isAi: gameMode === 'ai' },
    { id: 3, name: 'Player 3', pos: 1, color: COLOR_PALETTE[2].hex, colorName: COLOR_PALETTE[2].name, isAi: true },
    { id: 4, name: 'Player 4', pos: 1, color: COLOR_PALETTE[3].hex, colorName: COLOR_PALETTE[3].name, isAi: true },
  ]);

  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0); // index 0..playerCount-1
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerConfig | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const hasRecordedRef = React.useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner.id === 1 ? 'w' : 'b';
      onGameEnd(winnerCode, 'snakes_ladder_reach_100');
    }
  }, [winner, onGameEnd]);

  const activePlayers = players.slice(0, playerCount);
  const currentPlayer = activePlayers[currentTurnIndex] || activePlayers[0];

  const resetGame = () => {
    hasRecordedRef.current = false;
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        pos: 1,
      }))
    );
    setCurrentTurnIndex(0);
    setDiceValue(null);
    setIsRolling(false);
    setIsMoving(false);
    setWinner(null);
    setEventMessage(null);
  };

  // Change Player Count (2, 3, 4)
  const handlePlayerCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count);
    setCurrentTurnIndex(0);
    setWinner(null);
    setEventMessage(null);
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        pos: 1,
      }))
    );
  };

  // Change Player Color
  const handleColorChange = (playerId: number, newColorHex: string, newColorName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, color: newColorHex, colorName: newColorName } : p))
    );
  };

  // Toggle Human / AI for a player
  const handleToggleAi = (playerId: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isAi: !p.isAi } : p))
    );
  };

  // Get (row, col) coordinates for square 1..100
  const getSquareCoordinates = (square: number) => {
    const rowFromBottom = Math.floor((square - 1) / 10);
    const rowFromTop = 9 - rowFromBottom;
    let col = (square - 1) % 10;
    if (rowFromBottom % 2 === 1) {
      col = 9 - col; // Boustrophedon right-to-left
    }
    return { row: rowFromTop, col };
  };

  // Get percentage coordinates (0..100%) for square center
  const getSquareCenterPct = (square: number) => {
    const { row, col } = getSquareCoordinates(square);
    return {
      x: (col + 0.5) * 10,
      y: (row + 0.5) * 10,
    };
  };

  // Roll Dice
  const handleRollDice = () => {
    if (isRolling || isMoving || winner !== null) return;

    setIsRolling(true);
    soundFx.playRoll();
    setEventMessage(null);

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        executeMove(finalRoll);
      }
    }, 80);
  };

  const executeMove = (roll: number) => {
    setIsMoving(true);
    const activeCurrentPlayer = activePlayers[currentTurnIndex];
    let targetPos = activeCurrentPlayer.pos + roll;

    if (targetPos > 100) {
      setEventMessage(`${activeCurrentPlayer.name} rolled ${roll}! Exact roll needed to land on 100.`);
      setIsMoving(false);
      switchTurn(roll === 6);
      return;
    }

    // Update position
    setPlayers((prev) =>
      prev.map((p) => (p.id === activeCurrentPlayer.id ? { ...p, pos: targetPos } : p))
    );
    soundFx.playMove();

    setTimeout(() => {
      // Check for Ladder or Snake
      if (LADDERS[targetPos]) {
        const ladderEnd = LADDERS[targetPos];
        soundFx.playCheck();
        setEventMessage(`🪜 ${activeCurrentPlayer.name} climbed ladder from ${targetPos} up to ${ladderEnd}!`);
        setPlayers((prev) =>
          prev.map((p) => (p.id === activeCurrentPlayer.id ? { ...p, pos: ladderEnd } : p))
        );
        targetPos = ladderEnd;
      } else if (SNAKES[targetPos]) {
        const snakeEnd = SNAKES[targetPos];
        soundFx.playCapture();
        setEventMessage(`🐍 ${activeCurrentPlayer.name} slid down snake from ${targetPos} to ${snakeEnd}!`);
        setPlayers((prev) =>
          prev.map((p) => (p.id === activeCurrentPlayer.id ? { ...p, pos: snakeEnd } : p))
        );
        targetPos = snakeEnd;
      }

      if (targetPos === 100) {
        setWinner({ ...activeCurrentPlayer, pos: 100 });
        soundFx.playWin();
        setIsMoving(false);
        return;
      }

      setIsMoving(false);
      switchTurn(roll === 6);
    }, 500);
  };

  const switchTurn = (rolledSix: boolean) => {
    if (rolledSix && winner === null) {
      setEventMessage((prev) => (prev ? `${prev} Extra roll for a 6! 🎲` : 'Extra roll for a 6! 🎲'));
      return;
    }
    setCurrentTurnIndex((prev) => (prev + 1) % playerCount);
  };

  // AI Turn Handling
  useEffect(() => {
    if (currentPlayer && currentPlayer.isAi && winner === null && !isRolling && !isMoving) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurnIndex, currentPlayer, winner, isRolling, isMoving, playerCount]);

  // Build grid squares 1..100
  const squares = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const rowFromBottom = 9 - r;
      const isRightToLeft = rowFromBottom % 2 === 1;
      const col = isRightToLeft ? 9 - c : c;
      const sqNum = rowFromBottom * 10 + col + 1;
      squares.push({ sqNum, row: r, col: c });
    }
  }

  // Offset coordinates for multiple pawns on same square
  const getPawnOffset = (pawnIndex: number) => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 1.8, y: 0 },
      { x: 0, y: 1.8 },
      { x: 1.8, y: 1.8 },
    ];
    return offsets[pawnIndex % 4];
  };

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col items-center gap-3.5 animate-fadeIn">
      {/* Header Bar */}
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between backdrop-blur-md shadow-xl">
        {/* Players Turn */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white ring-4 ring-white/20 transition-all"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{currentPlayer.name} Turn</span>
                {currentPlayer.isAi ? (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                    <Bot className="w-3 h-3" /> AI
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Player
                  </span>
                )}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Square {currentPlayer.pos}</span>
            </div>
          </div>
        </div>

        {/* Dice Controls */}
        <div className="flex items-center gap-2">
          {diceValue !== null && (
            <motion.div
              key={diceValue}
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border border-amber-200"
            >
              {diceValue}
            </motion.div>
          )}

          <button
            onClick={handleRollDice}
            disabled={isRolling || isMoving || winner !== null || currentPlayer.isAi}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300/60 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 flex items-center gap-1.5"
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rolling...' : currentPlayer.isAi ? 'AI Turn' : 'Roll Dice'}</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border transition ${
              showSettings
                ? 'bg-amber-500/30 text-amber-300 border-amber-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-white/10'
            }`}
            title="Player Settings & Colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={resetGame}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl border border-white/10 transition"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Player Count & Color Selector Bar */}
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2.5 shadow-lg backdrop-blur-md">
        {/* Top Controls: Player Number Selector */}
        <div className="flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" /> Players:
            </span>
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => handlePlayerCountChange(num)}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition ${
                    playerCount === num
                      ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg transition"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{showSettings ? 'Hide Options' : 'Colors & AI Options'}</span>
          </button>
        </div>

        {/* Expandable Player Customization Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-800 pt-2.5 flex flex-col gap-2.5"
            >
              <div className="text-[11px] font-bold text-gray-400">Select Colors & Mode for each Player:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-slate-900/80 border border-white/10 rounded-xl p-2 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-xs font-black text-white">{player.name}</span>
                      </div>

                      <button
                        onClick={() => handleToggleAi(player.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                          player.isAi
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        }`}
                      >
                        {player.isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{player.isAi ? 'AI' : 'Human'}</span>
                      </button>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => handleColorChange(player.id, c.hex, c.name)}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                          className={`w-5 h-5 rounded-full border transition transform hover:scale-110 ${
                            player.color === c.hex
                              ? 'border-white ring-2 ring-amber-400 scale-110'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event Message Toast */}
      <AnimatePresence mode="wait">
        {eventMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full bg-indigo-950/90 border border-indigo-400/40 text-indigo-200 text-xs px-4 py-2 rounded-xl text-center font-bold shadow-md"
          >
            {eventMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Celebration Modal */}
      {winner !== null && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-r from-amber-500/30 via-red-500/30 to-blue-500/30 border border-amber-400/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 shadow-2xl backdrop-blur-md"
        >
          <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
          <h3 className="text-lg font-black text-white">
            🎉 {winner.name} Won Snakes & Ladders!
          </h3>
          <p className="text-xs text-amber-200/90">Reached Square 100 first!</p>
          <button
            onClick={resetGame}
            className="mt-1 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </motion.div>
      )}

      {/* 10x10 Colorful Cartoon Snakes & Ladders Board Container */}
      <div className="relative w-full aspect-square bg-[#331800] border-4 border-[#1f0d00] rounded-2xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* 10x10 Tile Grid */}
        <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-0.5 rounded-xl overflow-hidden border border-amber-900/40">
          {squares.map(({ sqNum }) => {
            const tileBg = TILE_PALETTE[(sqNum - 1) % TILE_PALETTE.length];
            const isTop100 = sqNum === 100;

            return (
              <div
                key={sqNum}
                style={{ backgroundColor: isTop100 ? '#fef08a' : tileBg }}
                className={`relative flex items-center justify-center select-none border border-black/10 shadow-inner ${
                  isTop100 ? 'ring-2 ring-amber-500 font-extrabold' : ''
                }`}
              >
                {/* Tile Number Label */}
                <span
                  className={`text-[11px] sm:text-xs font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ${
                    isTop100 ? 'text-amber-950 scale-110' : 'text-slate-900'
                  }`}
                >
                  {sqNum === 100 ? '100 🏆' : sqNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* SVG Overlay Layer for Wooden Ladders and Cartoon Snakes */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            {/* Wooden Rail Gradient */}
            <linearGradient id="ladder-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Render Wooden Ladders */}
          {Object.entries(LADDERS).map(([startStr, endNum]) => {
            const startNum = parseInt(startStr, 10);
            const p1 = getSquareCenterPct(startNum);
            const p2 = getSquareCenterPct(endNum);

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const ladderWidth = 3.2; // width in %
            const px = (ladderWidth / 2) * -Math.sin(angle);
            const py = (ladderWidth / 2) * Math.cos(angle);

            // Rails
            const r1x1 = p1.x + px;
            const r1y1 = p1.y + py;
            const r1x2 = p2.x + px;
            const r1y2 = p2.y + py;

            const r2x1 = p1.x - px;
            const r2y1 = p1.y - py;
            const r2x2 = p2.x - px;
            const r2y2 = p2.y - py;

            // Rungs
            const numRungs = Math.max(3, Math.floor(dist / 7));
            const rungs = [];
            for (let i = 1; i < numRungs; i++) {
              const t = i / numRungs;
              const rx1 = r1x1 + (r1x2 - r1x1) * t;
              const ry1 = r1y1 + (r1y2 - r1y1) * t;
              const rx2 = r2x1 + (r2x2 - r2x1) * t;
              const ry2 = r2y1 + (r2y2 - r2y1) * t;
              rungs.push({ x1: rx1, y1: ry1, x2: rx2, y2: ry2 });
            }

            return (
              <g key={`ladder-${startNum}`} filter="url(#shadow)">
                {/* Side Rails */}
                <line x1={r1x1} y1={r1y1} x2={r1x2} y2={r1y2} stroke="url(#ladder-wood)" strokeWidth="1.2" strokeLinecap="round" />
                <line x1={r2x1} y1={r2y1} x2={r2x2} y2={r2y2} stroke="url(#ladder-wood)" strokeWidth="1.2" strokeLinecap="round" />

                {/* Rungs */}
                {rungs.map((r, idx) => (
                  <line
                    key={idx}
                    x1={r.x1}
                    y1={r.y1}
                    x2={r.x2}
                    y2={r.y2}
                    stroke="#f59e0b"
                    strokeWidth="1.0"
                    strokeLinecap="round"
                  />
                ))}
              </g>
            );
          })}

          {/* Render Wavy Cartoon Snakes */}
          {Object.entries(SNAKES).map(([headStr, tailNum], index) => {
            const headNum = parseInt(headStr, 10);
            const head = getSquareCenterPct(headNum);
            const tail = getSquareCenterPct(tailNum);

            const colorSet = SNAKE_COLORS[index % SNAKE_COLORS.length];

            // Wavy path calculation
            const dx = tail.x - head.x;
            const dy = tail.y - head.y;

            // Perpendicular wave offset
            const perpX = -dy * 0.25 * (index % 2 === 0 ? 1 : -1);
            const perpY = dx * 0.25 * (index % 2 === 0 ? 1 : -1);

            const cp1x = head.x + dx * 0.25 + perpX;
            const cp1y = head.y + dy * 0.25 + perpY;
            const cp2x = head.x + dx * 0.75 - perpX;
            const cp2y = head.y + dy * 0.75 - perpY;

            const pathD = `M ${head.x} ${head.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tail.x} ${tail.y}`;

            return (
              <g key={`snake-${headNum}`} filter="url(#shadow)">
                {/* Snake Outer Body */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colorSet.body}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Belly Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colorSet.belly}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeDasharray="2 2"
                />

                {/* Snake Tail Point */}
                <circle cx={tail.x} cy={tail.y} r="1.2" fill={colorSet.body} />

                {/* Snake Head */}
                <g transform={`translate(${head.x}, ${head.y})`}>
                  {/* Head Oval */}
                  <circle cx="0" cy="0" r="3.2" fill={colorSet.body} stroke="#000" strokeWidth="0.4" />

                  {/* Googly Eyes */}
                  <circle cx="-1.0" cy="-1.0" r="1.1" fill="#ffffff" />
                  <circle cx="-0.8" cy="-1.0" r="0.5" fill="#000000" />

                  <circle cx="1.0" cy="-1.0" r="1.1" fill="#ffffff" />
                  <circle cx="1.2" cy="-1.0" r="0.5" fill="#000000" />

                  {/* Red Flicking Tongue */}
                  <path d="M 0 2.8 L 0 5.0 L -1.0 6.2 M 0 5.0 L 1.0 6.2" stroke="#dc2626" strokeWidth="0.6" fill="none" />
                </g>
              </g>
            );
          })}
        </svg>

        {/* Animated 3D Player Pawns Layer for Active Players */}
        {activePlayers.map((player, idx) => {
          const { row, col } = getSquareCoordinates(player.pos);
          const offset = getPawnOffset(idx);

          return (
            <motion.div
              key={player.id}
              layoutId={`snakes-pawn-${player.id}`}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{
                top: `${(row / 10) * 100 + 1 + offset.y}%`,
                left: `${(col / 10) * 100 + 1 + offset.x}%`,
                width: '7.5%',
                height: '7.5%',
              }}
              className="absolute z-30 flex items-center justify-center pointer-events-none drop-shadow-lg"
            >
              <div
                style={{ backgroundColor: player.color }}
                className={`w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black text-[10px] text-white ${
                  currentTurnIndex === idx ? 'ring-2 ring-white scale-110 z-40' : 'opacity-90'
                }`}
              >
                P{player.id}
              </div>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
};
