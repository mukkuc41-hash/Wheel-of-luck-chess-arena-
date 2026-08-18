import React, { useState, useEffect } from 'react';
import { Dices, RotateCcw, Trophy, Bot, Users, User, ShieldCheck, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

export type LudoColor = 'blue' | 'green' | 'yellow' | 'red';

export interface LudoToken {
  id: string;
  color: LudoColor;
  step: number; // -1 = Yard, 0 = Start Square, 1..51 = Outer Ring, 52..56 = Home Stretch, 57 = Finished Home
}

interface LudoBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
}

const PLAYER_COLORS: LudoColor[] = ['blue', 'green', 'yellow', 'red'];

const COLOR_NAMES: Record<LudoColor, string> = {
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  red: 'Red',
};

const COLOR_BG_CLASSES: Record<LudoColor, string> = {
  blue: 'bg-[#0080ff]',
  green: 'bg-[#1da80e]',
  yellow: 'bg-[#ffcc00]',
  red: 'bg-[#e60000]',
};

// 52-step outer track grid coordinates (x: 0..14, y: 0..14) starting at Red Start (6, 13)
const OUTER_TRACK_COORDS: { x: number; y: number }[] = [
  { x: 6, y: 13 }, // 0: Red Start ⭐
  { x: 6, y: 12 }, // 1
  { x: 6, y: 11 }, // 2
  { x: 6, y: 10 }, // 3
  { x: 6, y: 9 },  // 4
  { x: 5, y: 8 },  // 5
  { x: 4, y: 8 },  // 6
  { x: 3, y: 8 },  // 7
  { x: 2, y: 8 },  // 8: Safe Star ⭐
  { x: 1, y: 8 },  // 9
  { x: 0, y: 8 },  // 10
  { x: 0, y: 7 },  // 11
  { x: 0, y: 6 },  // 12
  { x: 1, y: 6 },  // 13: Blue Start ⭐
  { x: 2, y: 6 },  // 14
  { x: 3, y: 6 },  // 15
  { x: 4, y: 6 },  // 16
  { x: 5, y: 6 },  // 17
  { x: 6, y: 5 },  // 18
  { x: 6, y: 4 },  // 19
  { x: 6, y: 3 },  // 20
  { x: 6, y: 2 },  // 21: Safe Star ⭐
  { x: 6, y: 1 },  // 22
  { x: 6, y: 0 },  // 23
  { x: 7, y: 0 },  // 24
  { x: 8, y: 0 },  // 25
  { x: 8, y: 1 },  // 26: Green Start ⭐
  { x: 8, y: 2 },  // 27
  { x: 8, y: 3 },  // 28
  { x: 8, y: 4 },  // 29
  { x: 8, y: 5 },  // 30
  { x: 9, y: 6 },  // 31
  { x: 10, y: 6 }, // 32
  { x: 11, y: 6 }, // 33
  { x: 12, y: 6 }, // 34: Safe Star ⭐
  { x: 13, y: 6 }, // 35
  { x: 14, y: 6 }, // 36
  { x: 14, y: 7 }, // 37
  { x: 14, y: 8 }, // 38
  { x: 13, y: 8 }, // 39: Yellow Start ⭐
  { x: 12, y: 8 }, // 40
  { x: 11, y: 8 }, // 41
  { x: 10, y: 8 }, // 42
  { x: 9, y: 8 },  // 43
  { x: 8, y: 9 },  // 44
  { x: 8, y: 10 }, // 45
  { x: 8, y: 11 }, // 46
  { x: 8, y: 12 }, // 47: Safe Star ⭐
  { x: 8, y: 13 }, // 48
  { x: 8, y: 14 }, // 49
  { x: 7, y: 14 }, // 50
  { x: 6, y: 14 }, // 51
];

// Start offset indices for each color on outer track
const COLOR_START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  blue: 13,
  green: 26,
  yellow: 39,
};

// Safe Ring Indices (where tokens cannot be captured)
const SAFE_RING_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home Stretch coordinates for steps 52..56
const HOME_STRETCH_COORDS: Record<LudoColor, { x: number; y: number }[]> = {
  red: [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 },
  ],
  blue: [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
  ],
  green: [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
  ],
  yellow: [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 },
  ],
};

// Center Triangle finish point (step 57)
const CENTER_TRIANGLE_COORDS: Record<LudoColor, { x: number; y: number }> = {
  red: { x: 7, y: 8 },
  blue: { x: 6, y: 7 },
  green: { x: 7, y: 6 },
  yellow: { x: 8, y: 7 },
};

// Convert step index (0..57) to (x,y) grid coordinates
const getTokenGridPos = (color: LudoColor, step: number): { x: number; y: number } | null => {
  if (step < 0) return null; // In Yard
  if (step <= 51) {
    const ringIndex = (COLOR_START_OFFSETS[color] + step) % 52;
    return OUTER_TRACK_COORDS[ringIndex];
  }
  if (step <= 56) {
    return HOME_STRETCH_COORDS[color][step - 52];
  }
  if (step === 57) {
    return CENTER_TRIANGLE_COORDS[color];
  }
  return null;
};

// 3D Glossy Pawn Component matching user image
const LudoPawn: React.FC<{
  color: LudoColor;
  isMovable?: boolean;
  size?: number;
  onClick?: () => void;
}> = ({ color, isMovable, size = 26, onClick }) => {
  const pawnColors = {
    blue: {
      gradient: ['#7dd3fc', '#0284c7', '#0369a1'],
      border: '#0284c7',
      glow: 'rgba(56,189,248,0.8)',
    },
    green: {
      gradient: ['#86efac', '#16a34a', '#15803d'],
      border: '#16a34a',
      glow: 'rgba(74,222,128,0.8)',
    },
    yellow: {
      gradient: ['#fef08a', '#eab308', '#a16207'],
      border: '#eab308',
      glow: 'rgba(250,204,21,0.8)',
    },
    red: {
      gradient: ['#fca5a5', '#dc2626', '#991b1b'],
      border: '#dc2626',
      glow: 'rgba(248,113,113,0.8)',
    },
  };

  const c = pawnColors[color];

  return (
    <motion.button
      whileHover={isMovable ? { scale: 1.25 } : undefined}
      whileTap={isMovable ? { scale: 0.95 } : undefined}
      onClick={isMovable ? onClick : undefined}
      disabled={!isMovable}
      className={`relative flex items-center justify-center transition-all ${
        isMovable ? 'cursor-pointer z-30' : 'pointer-events-none'
      }`}
      style={{ width: size, height: size * 1.25 }}
    >
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 40 50"
        className="overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <radialGradient id={`pawn-head-${color}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={c.gradient[0]} />
            <stop offset="60%" stopColor={c.gradient[1]} />
            <stop offset="100%" stopColor={c.gradient[2]} />
          </radialGradient>
          <radialGradient id={`pawn-body-${color}`} cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor={c.gradient[0]} />
            <stop offset="50%" stopColor={c.gradient[1]} />
            <stop offset="100%" stopColor={c.gradient[2]} />
          </radialGradient>
        </defs>

        {/* Drop shadow oval under pawn base */}
        <ellipse cx="20" cy="47" rx="14" ry="3.5" fill="rgba(0,0,0,0.35)" />

        {/* Bottom Base */}
        <ellipse cx="20" cy="44" rx="14" ry="4.5" fill={`url(#pawn-body-${color})`} stroke="#000" strokeWidth="0.8" />

        {/* Body Cone */}
        <path
          d="M 8 44 C 9 34, 13 26, 15 20 L 25 20 C 27 26, 31 34, 32 44 Z"
          fill={`url(#pawn-body-${color})`}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="0.8"
        />

        {/* Neck Collar Ring */}
        <ellipse cx="20" cy="20" rx="6.5" ry="2.2" fill={c.gradient[0]} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />

        {/* Head Sphere */}
        <circle cx="20" cy="11" r="10" fill={`url(#pawn-head-${color})`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />

        {/* Specular White Highlight */}
        <ellipse cx="16" cy="8" rx="3.5" ry="2" fill="#ffffff" opacity="0.75" transform="rotate(-30 16 8)" />

        {/* Pulsing ring if movable */}
        {isMovable && (
          <circle
            cx="20"
            cy="25"
            r="20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            className="animate-ping opacity-90"
          />
        )}
      </svg>
    </motion.button>
  );
};

export const LudoBoard: React.FC<LudoBoardProps> = ({ gameMode = 'ai' }) => {
  // Player count & AI setup
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [userColor, setUserColor] = useState<LudoColor>('red');
  const [showColorMenu, setShowColorMenu] = useState<boolean>(false);
  const [aiPlayers, setAiPlayers] = useState<Record<LudoColor, boolean>>({
    blue: gameMode === 'ai',
    green: gameMode === 'ai',
    yellow: gameMode === 'ai',
    red: false, // Player 1
  });

  const getOppositeColor = (col: LudoColor): LudoColor => {
    if (col === 'red') return 'green';
    if (col === 'green') return 'red';
    if (col === 'blue') return 'yellow';
    return 'blue';
  };

  const activeColors: LudoColor[] = (() => {
    if (playerCount === 2) {
      return [userColor, getOppositeColor(userColor)];
    }
    if (playerCount === 3) {
      const all: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
      const remaining = all.filter((c) => c !== userColor);
      return [userColor, remaining[0], remaining[1]];
    }
    return ['red', 'green', 'yellow', 'blue'];
  })();

  const createInitialTokens = (): LudoToken[] => {
    const list: LudoToken[] = [];
    PLAYER_COLORS.forEach((col) => {
      for (let i = 1; i <= 4; i++) {
        list.push({ id: `${col[0]}${i}`, color: col, step: -1 });
      }
    });
    return list;
  };

  const [tokens, setTokens] = useState<LudoToken[]>(createInitialTokens);
  const [currentTurn, setCurrentTurn] = useState<LudoColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [winner, setWinner] = useState<LudoColor | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const resetGame = () => {
    setTokens(createInitialTokens());
    setCurrentTurn('red');
    setDiceValue(null);
    setIsRolling(false);
    setHasRolled(false);
    setWinner(null);
    setEventMessage(null);
  };

  // Roll Dice
  const handleRollDice = () => {
    if (isRolling || hasRolled || winner !== null) return;

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
        setHasRolled(true);

        // Check if player has any legal moves
        const validTokens = getMovableTokens(finalRoll, currentTurn);
        if (validTokens.length === 0) {
          setEventMessage(`Rolled ${finalRoll}. No legal moves available!`);
          setTimeout(() => {
            switchTurn(finalRoll === 6);
          }, 1200);
        } else if (validTokens.length === 1 && aiPlayers[currentTurn]) {
          // Auto move for single choice AI
          setTimeout(() => {
            moveToken(validTokens[0], finalRoll);
          }, 400);
        }
      }
    }, 80);
  };

  // Check if a token can move
  const canMoveToken = (token: LudoToken, roll: number): boolean => {
    if (token.color !== currentTurn) return false;
    if (token.step === 57) return false; // Finished
    if (token.step === -1) {
      return roll === 6; // Requires 6 to release from Yard
    }
    return token.step + roll <= 57;
  };

  const getMovableTokens = (roll: number, color: LudoColor): LudoToken[] => {
    return tokens.filter((t) => t.color === color && canMoveToken(t, roll));
  };

  // Execute Token Move
  const moveToken = (tokenToMove: LudoToken, roll: number) => {
    if (!hasRolled || diceValue !== roll || winner !== null) return;

    let newStep = tokenToMove.step;
    if (tokenToMove.step === -1) {
      if (roll === 6) newStep = 0; // Release to Start Square
    } else {
      newStep = tokenToMove.step + roll;
    }

    soundFx.playMove();

    // Check for captures on outer track (steps 0..51)
    let captureOccurred = false;
    const targetGridPos = getTokenGridPos(tokenToMove.color, newStep);

    const updatedTokens = tokens.map((t) => {
      if (t.id === tokenToMove.id) {
        return { ...t, step: newStep };
      }

      // Check capture on outer ring (not on safe star squares)
      if (
        newStep >= 0 &&
        newStep <= 51 &&
        t.color !== tokenToMove.color &&
        t.step >= 0 &&
        t.step <= 51
      ) {
        const ringIndex = (COLOR_START_OFFSETS[tokenToMove.color] + newStep) % 52;
        const opponentRingIndex = (COLOR_START_OFFSETS[t.color] + t.step) % 52;

        if (ringIndex === opponentRingIndex && !SAFE_RING_INDICES.has(ringIndex)) {
          captureOccurred = true;
          soundFx.playCapture();
          return { ...t, step: -1 }; // Sent back to Yard
        }
      }
      return t;
    });

    setTokens(updatedTokens);

    if (captureOccurred) {
      setEventMessage(`⚔️ Captured opponent token back to Yard!`);
    } else if (newStep === 57) {
      soundFx.playCheck();
      setEventMessage(`🎉 ${COLOR_NAMES[currentTurn]} brought token Home!`);
    }

    // Check Win Condition (All 4 tokens at step 57)
    const finishedCount = updatedTokens.filter((t) => t.color === currentTurn && t.step === 57).length;
    if (finishedCount === 4) {
      setWinner(currentTurn);
      soundFx.playWin();
      return;
    }

    // Extra turn if rolled 6 or captured
    switchTurn(roll === 6 || captureOccurred);
  };

  const switchTurn = (extraTurn: boolean) => {
    setHasRolled(false);
    setDiceValue(null);
    if (extraTurn && winner === null) {
      setEventMessage((prev) => (prev ? `${prev} Extra roll! 🎲` : 'Extra roll! 🎲'));
      return;
    }

    // Advance turn to next active color
    const currentIndex = activeColors.indexOf(currentTurn);
    const nextTurn = activeColors[(currentIndex + 1) % activeColors.length];
    setCurrentTurn(nextTurn);
  };

  // AI Turn Handling
  useEffect(() => {
    if (aiPlayers[currentTurn] && winner === null) {
      if (!hasRolled && !isRolling) {
        const timer = setTimeout(() => {
          handleRollDice();
        }, 900);
        return () => clearTimeout(timer);
      } else if (hasRolled && diceValue !== null) {
        const validTokens = getMovableTokens(diceValue, currentTurn);
        if (validTokens.length > 0) {
          const timer = setTimeout(() => {
            // AI Priority: 1. Capture/Move Out, 2. Move to Home 57, 3. Furthest Token
            const preferredToken =
              validTokens.find((t) => t.step === -1) ||
              validTokens.find((t) => t.step + diceValue === 57) ||
              validTokens.sort((a, b) => b.step - a.step)[0];
            moveToken(preferredToken, diceValue);
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentTurn, aiPlayers, winner, hasRolled, isRolling, diceValue]);

  // Render individual 1x1 grid cell or safe star
  const renderGridCell = (r: number, c: number) => {
    // Determine cell characteristics
    let bg = 'bg-white';
    let isHomePath = false;
    let isStart = false;
    let isSafe = false;
    let icon: React.ReactNode = null;

    // Top Arm (c: 6..8, r: 0..5)
    if (c >= 6 && c <= 8 && r >= 0 && r <= 5) {
      if (c === 7 && r >= 1 && r <= 5) {
        bg = 'bg-[#1da80e]'; // Green Home Path
        isHomePath = true;
      } else if (c === 8 && r === 1) {
        bg = 'bg-[#1da80e]'; // Green Start
        isStart = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (c === 6 && r === 2) {
        bg = 'bg-[#d1d5db]'; // Grey Safe Star
        isSafe = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (c === 7 && r === 0) {
        icon = <span className="text-[#1da80e] text-xs font-black">▼</span>;
      }
    }

    // Left Arm (r: 6..8, c: 0..5)
    else if (r >= 6 && r <= 8 && c >= 0 && c <= 5) {
      if (r === 7 && c >= 1 && c <= 5) {
        bg = 'bg-[#0080ff]'; // Blue Home Path
        isHomePath = true;
      } else if (r === 6 && c === 1) {
        bg = 'bg-[#0080ff]'; // Blue Start
        isStart = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (r === 8 && c === 2) {
        bg = 'bg-[#d1d5db]'; // Grey Safe Star
        isSafe = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (r === 7 && c === 0) {
        icon = <span className="text-[#0080ff] text-xs font-black">▶</span>;
      }
    }

    // Bottom Arm (c: 6..8, r: 9..14)
    else if (c >= 6 && c <= 8 && r >= 9 && r <= 14) {
      if (c === 7 && r >= 9 && r <= 13) {
        bg = 'bg-[#e60000]'; // Red Home Path
        isHomePath = true;
      } else if (c === 6 && r === 13) {
        bg = 'bg-[#e60000]'; // Red Start
        isStart = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (c === 8 && r === 12) {
        bg = 'bg-[#d1d5db]'; // Grey Safe Star
        isSafe = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (c === 7 && r === 14) {
        icon = <span className="text-[#e60000] text-xs font-black">▲</span>;
      }
    }

    // Right Arm (r: 6..8, c: 9..14)
    else if (r >= 6 && r <= 8 && c >= 9 && c <= 14) {
      if (r === 7 && c >= 9 && c <= 13) {
        bg = 'bg-[#ffcc00]'; // Yellow Home Path
        isHomePath = true;
      } else if (r === 8 && c === 13) {
        bg = 'bg-[#ffcc00]'; // Yellow Start
        isStart = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (r === 6 && c === 12) {
        bg = 'bg-[#d1d5db]'; // Grey Safe Star
        isSafe = true;
        icon = <span className="text-white text-xs drop-shadow font-black">★</span>;
      } else if (r === 7 && c === 14) {
        icon = <span className="text-[#ffcc00] text-xs font-black">◀</span>;
      }
    }

    // Check which tokens are currently on cell (c, r)
    const tokensOnCell = tokens.filter((t) => {
      const pos = getTokenGridPos(t.color, t.step);
      return pos !== null && pos.x === c && pos.y === r;
    });

    return (
      <div
        key={`${r}-${c}`}
        style={{ gridRow: r + 1, gridColumn: c + 1 }}
        className={`relative border border-slate-400/80 flex items-center justify-center ${bg}`}
      >
        {icon}

        {/* Tokens on Cell */}
        {tokensOnCell.length > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-0.5">
            {tokensOnCell.map((t, idx) => {
              const isMovable = hasRolled && diceValue !== null && canMoveToken(t, diceValue);
              return (
                <div
                  key={t.id}
                  style={{
                    transform: tokensOnCell.length > 1 ? `translate(${(idx - 0.5) * 6}px, ${(idx - 0.5) * 6}px)` : undefined,
                  }}
                  className="relative"
                >
                  <LudoPawn
                    color={t.color}
                    isMovable={isMovable}
                    size={22}
                    onClick={() => isMovable && diceValue && moveToken(t, diceValue)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center gap-4 animate-fadeIn">
      {/* Top Controls & Status Bar */}
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between backdrop-blur-md shadow-xl">
        {/* Turn & Player Setup */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                currentTurn === 'blue'
                  ? 'bg-[#0080ff] border-white ring-4 ring-blue-500/40'
                  : currentTurn === 'green'
                  ? 'bg-[#1da80e] border-white ring-4 ring-green-500/40'
                  : currentTurn === 'yellow'
                  ? 'bg-[#ffcc00] border-white ring-4 ring-yellow-500/40'
                  : 'bg-[#e60000] border-white ring-4 ring-red-500/40'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{COLOR_NAMES[currentTurn]}'s Turn</span>
                {aiPlayers[currentTurn] ? (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                    <Bot className="w-3 h-3" /> AI
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Player
                  </span>
                )}
              </span>
              <span className="text-[10px] text-gray-400">
                {tokens.filter((t) => t.color === currentTurn && t.step === 57).length}/4 Pawns Home
              </span>
            </div>
          </div>
        </div>

        {/* Dice Roller & Reset */}
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
            disabled={isRolling || hasRolled || winner !== null || aiPlayers[currentTurn]}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300/60 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 flex items-center gap-1.5"
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rolling...' : aiPlayers[currentTurn] ? 'AI Rolling' : 'Roll Dice'}</span>
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

      {/* Mode & Player / Color Selection Bar */}
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2.5 shadow-lg backdrop-blur-md text-xs text-gray-300">
        <div className="flex items-center justify-between">
          {/* Player Count Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" /> Players:
            </span>
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setPlayerCount(num);
                    resetGame();
                  }}
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
            onClick={() => setShowColorMenu(!showColorMenu)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg transition"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{showColorMenu ? 'Hide Options' : 'Colors & AI Options'}</span>
          </button>
        </div>

        {/* Expandable Player Color & AI Settings */}
        <AnimatePresence>
          {showColorMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-800 pt-2.5 flex flex-col gap-2.5"
            >
              {/* Player 1 Color Picker */}
              <div className="flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-xl p-2">
                <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                  <span>Your Color (Player 1):</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {(['red', 'green', 'yellow', 'blue'] as LudoColor[]).map((col) => {
                    const colorHexMap: Record<LudoColor, string> = {
                      red: '#e60000',
                      green: '#1da80e',
                      yellow: '#ffcc00',
                      blue: '#0080ff',
                    };
                    return (
                      <button
                        key={col}
                        onClick={() => {
                          setUserColor(col);
                          setAiPlayers((prev) => ({
                            ...prev,
                            [col]: false,
                          }));
                          setCurrentTurn(col);
                          resetGame();
                        }}
                        style={{ backgroundColor: colorHexMap[col] }}
                        className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${
                          userColor === col
                            ? 'border-white ring-2 ring-amber-400 scale-110 shadow-lg'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        title={`Select ${COLOR_NAMES[col]}`}
                      >
                        {userColor === col && <User className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Colors AI/Human Toggles */}
              <div className="text-[11px] font-bold text-gray-400">Toggle Human / AI for Active Board Colors:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeColors.map((col) => {
                  const isUser = userColor === col;
                  const isAi = aiPlayers[col];
                  const colorHexMap: Record<LudoColor, string> = {
                    red: '#e60000',
                    green: '#1da80e',
                    yellow: '#ffcc00',
                    blue: '#0080ff',
                  };

                  return (
                    <div
                      key={col}
                      className="bg-slate-900/90 border border-white/10 rounded-xl p-2 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white"
                          style={{ backgroundColor: colorHexMap[col] }}
                        />
                        <span className="text-xs font-black text-white capitalize">{COLOR_NAMES[col]}</span>
                      </div>

                      <button
                        disabled={isUser}
                        onClick={() => {
                          setAiPlayers((prev) => ({
                            ...prev,
                            [col]: !prev[col],
                          }));
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                          isUser
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 opacity-90 cursor-default'
                            : isAi
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30 hover:bg-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        {isUser ? (
                          <>
                            <User className="w-3 h-3 text-amber-400" />
                            <span>Player 1</span>
                          </>
                        ) : isAi ? (
                          <>
                            <Bot className="w-3 h-3" />
                            <span>AI Opponent</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" />
                            <span>Human</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
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
          className="w-full bg-gradient-to-r from-red-600/30 via-amber-500/30 to-blue-600/30 border border-amber-400/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 shadow-2xl backdrop-blur-md"
        >
          <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
          <h3 className="text-lg font-black text-white capitalize">
            🎉 {COLOR_NAMES[winner]} Player Won Ludo!
          </h3>
          <p className="text-xs text-amber-200/90">All 4 tokens brought safely into the center Home!</p>
          <button
            onClick={resetGame}
            className="mt-1 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </motion.div>
      )}

      {/* Standard 15x15 Graphic Ludo Board Container */}
      <div className="relative w-full aspect-square bg-[#ffffff] border-4 border-[#333333] rounded-2xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* 15x15 CSS Grid */}
        <div className="w-full h-full grid grid-cols-15 grid-rows-15 gap-0 relative">
          
          {/* Top-Left Blue Home Yard (6x6) */}
          <div
            style={{ gridRow: '1 / span 6', gridColumn: '1 / span 6' }}
            className="bg-[#0080ff] p-3 rounded-tl-xl flex items-center justify-center relative shadow-inner"
          >
            <div className="w-full h-full bg-white rounded-[24px] p-2 flex items-center justify-center shadow-md">
              <div className="grid grid-cols-2 gap-3 p-1">
                {tokens
                  .filter((t) => t.color === 'blue')
                  .map((t) => {
                    const isMovable = hasRolled && diceValue !== null && canMoveToken(t, diceValue);
                    return (
                      <div key={t.id} className="flex items-center justify-center min-w-[28px] min-h-[28px]">
                        {t.step === -1 && (
                          <LudoPawn
                            color="blue"
                            isMovable={isMovable}
                            size={28}
                            onClick={() => isMovable && diceValue && moveToken(t, diceValue)}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Top-Right Green Home Yard (6x6) */}
          <div
            style={{ gridRow: '1 / span 6', gridColumn: '10 / span 6' }}
            className="bg-[#1da80e] p-3 rounded-tr-xl flex items-center justify-center relative shadow-inner"
          >
            <div className="w-full h-full bg-white rounded-[24px] p-2 flex items-center justify-center shadow-md">
              <div className="grid grid-cols-2 gap-3 p-1">
                {tokens
                  .filter((t) => t.color === 'green')
                  .map((t) => {
                    const isMovable = hasRolled && diceValue !== null && canMoveToken(t, diceValue);
                    return (
                      <div key={t.id} className="flex items-center justify-center min-w-[28px] min-h-[28px]">
                        {t.step === -1 && (
                          <LudoPawn
                            color="green"
                            isMovable={isMovable}
                            size={28}
                            onClick={() => isMovable && diceValue && moveToken(t, diceValue)}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Bottom-Left Red Home Yard (6x6) */}
          <div
            style={{ gridRow: '10 / span 6', gridColumn: '1 / span 6' }}
            className="bg-[#e60000] p-3 rounded-bl-xl flex items-center justify-center relative shadow-inner"
          >
            <div className="w-full h-full bg-white rounded-[24px] p-2 flex items-center justify-center shadow-md">
              <div className="grid grid-cols-2 gap-3 p-1">
                {tokens
                  .filter((t) => t.color === 'red')
                  .map((t) => {
                    const isMovable = hasRolled && diceValue !== null && canMoveToken(t, diceValue);
                    return (
                      <div key={t.id} className="flex items-center justify-center min-w-[28px] min-h-[28px]">
                        {t.step === -1 && (
                          <LudoPawn
                            color="red"
                            isMovable={isMovable}
                            size={28}
                            onClick={() => isMovable && diceValue && moveToken(t, diceValue)}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Bottom-Right Yellow Home Yard (6x6) */}
          <div
            style={{ gridRow: '10 / span 6', gridColumn: '10 / span 6' }}
            className="bg-[#ffcc00] p-3 rounded-br-xl flex items-center justify-center relative shadow-inner"
          >
            <div className="w-full h-full bg-white rounded-[24px] p-2 flex items-center justify-center shadow-md">
              <div className="grid grid-cols-2 gap-3 p-1">
                {tokens
                  .filter((t) => t.color === 'yellow')
                  .map((t) => {
                    const isMovable = hasRolled && diceValue !== null && canMoveToken(t, diceValue);
                    return (
                      <div key={t.id} className="flex items-center justify-center min-w-[28px] min-h-[28px]">
                        {t.step === -1 && (
                          <LudoPawn
                            color="yellow"
                            isMovable={isMovable}
                            size={28}
                            onClick={() => isMovable && diceValue && moveToken(t, diceValue)}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Center Triangular Finish Zone (3x3, cols 7..9, rows 7..9) */}
          <div
            style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3' }}
            className="relative border-2 border-slate-700 overflow-hidden bg-white"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Top Triangle: Green */}
              <polygon points="0,0 100,0 50,50" fill="#1da80e" />
              {/* Right Triangle: Yellow */}
              <polygon points="100,0 100,100 50,50" fill="#ffcc00" />
              {/* Bottom Triangle: Red */}
              <polygon points="100,100 0,100 50,50" fill="#e60000" />
              {/* Left Triangle: Blue */}
              <polygon points="0,100 0,0 50,50" fill="#0080ff" />
            </svg>

            {/* Finished Pawns inside Center Triangles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {tokens
                .filter((t) => t.step === 57)
                .map((t, idx) => (
                  <div key={t.id} className="absolute transform scale-75" style={{ top: `${20 + (idx % 2) * 20}%`, left: `${20 + Math.floor(idx / 2) * 20}%` }}>
                    <LudoPawn color={t.color} size={20} />
                  </div>
                ))}
            </div>
          </div>

          {/* Render track cells for Top, Left, Bottom, Right arms */}
          {/* Top Arm (c: 6..8, r: 0..5) */}
          {Array.from({ length: 6 }).map((_, r) =>
            [6, 7, 8].map((c) => renderGridCell(r, c))
          )}

          {/* Left Arm (r: 6..8, c: 0..5) */}
          {[6, 7, 8].map((r) =>
            Array.from({ length: 6 }).map((_, c) => renderGridCell(r, c))
          )}

          {/* Bottom Arm (c: 6..8, r: 9..14) */}
          {Array.from({ length: 6 }).map((_, rIdx) => {
            const r = 9 + rIdx;
            return [6, 7, 8].map((c) => renderGridCell(r, c));
          })}

          {/* Right Arm (r: 6..8, c: 9..14) */}
          {[6, 7, 8].map((r) =>
            Array.from({ length: 6 }).map((_, cIdx) => {
              const c = 9 + cIdx;
              return renderGridCell(r, c);
            })
          )}

        </div>
      </div>
    </div>
  );
};
