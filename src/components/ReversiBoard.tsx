import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface ReversiBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const ReversiBoard: React.FC<ReversiBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  // 'd' = Dark (Black/P1), 'l' = Light (White/P2), null = empty
  const createInitialBoard = (): ('d' | 'l' | null)[][] => {
    const b: ('d' | 'l' | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    b[3][3] = 'l';
    b[3][4] = 'd';
    b[4][3] = 'd';
    b[4][4] = 'l';
    return b;
  };

  const [board, setBoard] = useState<('d' | 'l' | null)[][]>(createInitialBoard);
  const [turn, setTurn] = useState<'d' | 'l'>('d'); // Dark moves first
  const [winner, setWinner] = useState<'d' | 'l' | 'draw' | null>(null);
  const [passedCount, setPassedCount] = useState<number>(0);
  const hasRecordedRef = React.useRef(false);

  // Settings state
  const [userColor, setUserColor] = useState<'d' | 'l'>('d');
  const [aiPlayers, setAiPlayers] = useState<Record<'d' | 'l', boolean>>({
    d: false,
    l: true,
  });

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === 'draw' ? 'draw' : winner === userColor ? 'w' : 'b';
      onGameEnd(winnerCode, 'reversi_majority_discs');
    }
  }, [winner, onGameEnd, userColor]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setBoard(createInitialBoard());
    setTurn('d');
    setWinner(null);
    setPassedCount(0);
  };

  // Directions for outflanking
  const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  const getFlips = (b: ('d' | 'l' | null)[][], r: number, c: number, player: 'd' | 'l') => {
    if (b[r][c] !== null) return [];
    const opponent = player === 'd' ? 'l' : 'd';
    const toFlip: { row: number; col: number }[] = [];

    for (const [dr, dc] of DIRECTIONS) {
      let currR = r + dr;
      let currC = c + dc;
      const line: { row: number; col: number }[] = [];

      while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8 && b[currR][currC] === opponent) {
        line.push({ row: currR, col: currC });
        currR += dr;
        currC += dc;
      }

      if (currR >= 0 && currR < 8 && currC >= 0 && currC < 8 && b[currR][currC] === player && line.length > 0) {
        toFlip.push(...line);
      }
    }

    return toFlip;
  };

  const getValidMoves = (b: ('d' | 'l' | null)[][], player: 'd' | 'l') => {
    const valid: { row: number; col: number; flips: { row: number; col: number }[] }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const flips = getFlips(b, r, c, player);
        if (flips.length > 0) {
          valid.push({ row: r, col: c, flips });
        }
      }
    }
    return valid;
  };

  const currentValidMoves = getValidMoves(board, turn);

  const handleCellClick = (r: number, c: number) => {
    if (winner) return;
    if (aiPlayers[turn]) return;

    const flips = getFlips(board, r, c, turn);
    if (flips.length === 0) return;

    makeMove(r, c, flips, turn);
  };

  const makeMove = (r: number, c: number, flips: { row: number; col: number }[], player: 'd' | 'l') => {
    soundFx.playMove();
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = player;
    flips.forEach(f => {
      newBoard[f.row][f.col] = player;
    });

    setBoard(newBoard);
    setPassedCount(0);

    const nextPlayer = player === 'd' ? 'l' : 'd';
    const nextValid = getValidMoves(newBoard, nextPlayer);

    if (nextValid.length > 0) {
      setTurn(nextPlayer);
    } else {
      // Check if current player also has no moves
      const currValid = getValidMoves(newBoard, player);
      if (currValid.length > 0) {
        // Pass back
        setTurn(player);
      } else {
        // Both passed -> Game Over
        finishGame(newBoard);
      }
    }
  };

  const finishGame = (finalBoard: ('d' | 'l' | null)[][]) => {
    let dCount = 0;
    let lCount = 0;
    finalBoard.forEach(row => {
      row.forEach(cell => {
        if (cell === 'd') dCount++;
        if (cell === 'l') lCount++;
      });
    });

    soundFx.playGameOver(true);
    if (dCount > lCount) setWinner('d');
    else if (lCount > dCount) setWinner('l');
    else setWinner('draw');
  };

  // AI Logic
  useEffect(() => {
    if (aiPlayers[turn] && !winner) {
      const validMoves = getValidMoves(board, turn);
      if (validMoves.length === 0) {
        // Pass
        setTurn(turn === 'd' ? 'l' : 'd');
        return;
      }

      const timer = setTimeout(() => {
        let bestMove = validMoves[0];
        let maxVal = -100;

        validMoves.forEach(m => {
          let score = m.flips.length;
          if ((m.row === 0 || m.row === 7) && (m.col === 0 || m.col === 7)) {
            score += 20;
          }
          if (score > maxVal) {
            maxVal = score;
            bestMove = m;
          }
        });

        makeMove(bestMove.row, bestMove.col, bestMove.flips, turn);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, board, aiPlayers]);

  // Counts
  let darkCount = 0;
  let lightCount = 0;
  board.forEach(r => r.forEach(c => {
    if (c === 'd') darkCount++;
    if (c === 'l') lightCount++;
  }));

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[580px] mx-auto p-4 bg-slate-900/90 border border-[#f3ce6b]/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        userColorId={userColor}
        onUserColorChange={(id) => {
          const col = id as 'd' | 'l';
          setUserColor(col);
          setAiPlayers({
            d: col === 'l',
            l: col === 'd',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'd',
            name: 'Dark Discs',
            colorHex: '#1e293b',
            isAi: aiPlayers.d,
            isUser: userColor === 'd',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, d: !prev.d })),
          },
          {
            id: 'l',
            name: 'Light Discs',
            colorHex: '#f8fafc',
            isAi: aiPlayers.l,
            isUser: userColor === 'l',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, l: !prev.l })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-emerald-400/30">
            ☯️
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Reversi (Othello)
            </h3>
            <p className="text-xs text-gray-300">
              Outflank opponent pieces in any line to flip them.
            </p>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Score & Turn Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-bold">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'd' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'text-gray-400'}`}>
          <span className="w-4 h-4 rounded-full bg-stone-900 border border-stone-600 shadow" />
          <span>Dark: <strong className="text-white text-sm">{darkCount}</strong></span>
        </div>
        <span className="text-gray-500 uppercase font-extrabold tracking-widest text-[10px]">
          {winner ? 'Game Over' : `Turn: ${turn === 'd' ? 'Dark' : 'Light'}`}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'l' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'text-gray-400'}`}>
          <span className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 shadow" />
          <span>Light: <strong className="text-white text-sm">{lightCount}</strong></span>
        </div>
      </div>

      {/* 8x8 Board Canvas */}
      <div className="relative w-full aspect-square max-w-[480px] bg-[#1d5c3d] border-4 border-[#0e301f] rounded-2xl shadow-2xl p-2 grid grid-cols-8 grid-rows-8 gap-1">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isValid = currentValidMoves.some(m => m.row === r && m.col === c);

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={!isValid || !!winner}
                className={`relative flex items-center justify-center rounded-lg border border-emerald-900/40 transition ${
                  isValid ? 'bg-emerald-600/40 hover:bg-emerald-500/60 cursor-pointer shadow-inner' : 'bg-[#246e4a]/60'
                }`}
              >
                {isValid && !cell && (
                  <span className="w-3 h-3 rounded-full bg-emerald-300/40 animate-pulse" />
                )}

                {cell && (
                  <motion.div
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-[82%] h-[82%] rounded-full shadow-lg ${
                      cell === 'd'
                        ? 'bg-gradient-to-tr from-stone-950 via-stone-800 to-stone-700 border border-stone-600'
                        : 'bg-gradient-to-tr from-stone-200 via-stone-100 to-white border border-stone-300'
                    }`}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'draw'
                  ? 'Tie Game! Perfect Balance!'
                  : winner === 'd'
                  ? 'Dark Side Wins!'
                  : 'Light Side Wins!'}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Final Score: Dark {darkCount} - Light {lightCount}
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
