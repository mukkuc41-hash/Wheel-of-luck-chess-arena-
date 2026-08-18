import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';
import { AIDifficulty } from '../types';

interface ConnectFourBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const ConnectFourBoard: React.FC<ConnectFourBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const ROWS = 6;
  const COLS = 7;

  // board[row][col]: null | 'r' (Red/P1) | 'y' (Yellow/P2)
  const [board, setBoard] = useState<('r' | 'y' | null)[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<'r' | 'y'>('r'); // Red starts
  const [winner, setWinner] = useState<'r' | 'y' | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<{ row: number; col: number }[]>([]);
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const w = winner === 'draw' ? 'draw' : winner === 'r' ? 'w' : 'b';
      onGameEnd(w, 'connect4_win');
    }
  }, [winner, onGameEnd]);

  // Settings state
  const [userColor, setUserColor] = useState<'r' | 'y'>('r');
  const [aiPlayers, setAiPlayers] = useState<Record<'r' | 'y', boolean>>({
    r: false,
    y: true,
  });

  const resetGame = () => {
    hasRecordedRef.current = false;
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setTurn('r');
    setWinner(null);
    setWinningCells([]);
  };

  const check4InARow = (b: ('r' | 'y' | null)[][], r: number, c: number, color: 'r' | 'y') => {
    const directions = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal \
      [[1, -1], [-1, 1]],  // Diagonal /
    ];

    for (const [d1, d2] of directions) {
      const line = [{ row: r, col: c }];
      for (const [dr, dc] of [d1, d2]) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc] === color) {
          line.push({ row: nr, col: nc });
          nr += dr;
          nc += dc;
        }
      }
      if (line.length >= 4) return line;
    }
    return null;
  };

  const dropDisc = (col: number) => {
    if (winner) return;
    if (aiPlayers[turn]) return; // Block input if AI turn

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return;

    makeMove(targetRow, col, turn);
  };

  const makeMove = (row: number, col: number, playerColor: 'r' | 'y') => {
    soundFx.playMove();
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = playerColor;
    setBoard(newBoard);

    const winSeq = check4InARow(newBoard, row, col, playerColor);
    if (winSeq) {
      soundFx.playGameOver(playerColor === userColor);
      setWinningCells(winSeq);
      setWinner(playerColor);
      return;
    }

    if (newBoard.every(r => r.every(c => c !== null))) {
      setWinner('draw');
      return;
    }

    setTurn(playerColor === 'r' ? 'y' : 'r');
  };

  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(4);

  // AI Logic for Connect Four
  useEffect(() => {
    if (aiPlayers[turn] && !winner) {
      const timer = setTimeout(() => {
        const availableCols: number[] = [];
        for (let c = 0; c < COLS; c++) {
          if (!board[0][c]) availableCols.push(c);
        }

        if (availableCols.length === 0) return;

        const numLevel = typeof aiDifficulty === 'number' 
          ? aiDifficulty 
          : aiDifficulty === 'easy' ? 2 
          : aiDifficulty === 'medium' ? 4 
          : aiDifficulty === 'hard' ? 6 
          : aiDifficulty === 'master' ? 8 : 4;

        // Level 1-3: Probability of pure blunder
        const blunderChance = numLevel === 1 ? 0.55 : numLevel === 2 ? 0.35 : numLevel === 3 ? 0.15 : 0;
        if (blunderChance > 0 && Math.random() < blunderChance) {
          const chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)];
          for (let r = ROWS - 1; r >= 0; r--) {
            if (!board[r][chosenCol]) {
              makeMove(r, chosenCol, turn);
              return;
            }
          }
        }

        // Tactical 1: Win if available
        for (const col of availableCols) {
          let r = -1;
          for (let row = ROWS - 1; row >= 0; row--) {
            if (!board[row][col]) { r = row; break; }
          }
          if (r !== -1) {
            board[r][col] = turn;
            if (check4InARow(board, r, col, turn)) {
              board[r][col] = null;
              makeMove(r, col, turn);
              return;
            }
            board[r][col] = null;
          }
        }

        // Tactical 2: Block opponent win if level >= 2
        if (numLevel >= 2) {
          for (const col of availableCols) {
            let r = -1;
            for (let row = ROWS - 1; row >= 0; row--) {
              if (!board[row][col]) { r = row; break; }
            }
            if (r !== -1) {
              const opp = turn === 'r' ? 'y' : 'r';
              board[r][col] = opp;
              if (check4InARow(board, r, col, opp)) {
                board[r][col] = null;
                makeMove(r, col, turn);
                return;
              }
              board[r][col] = null;
            }
          }
        }

        // Tactical 3: Prioritize center columns for level >= 4
        let chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)];
        if (numLevel >= 4) {
          const centerPreferred = availableCols.filter((c) => Math.abs(c - 3) <= 1);
          if (centerPreferred.length > 0 && Math.random() < 0.75) {
            chosenCol = centerPreferred[Math.floor(Math.random() * centerPreferred.length)];
          }
        }

        let targetRow = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!board[r][chosenCol]) { targetRow = r; break; }
        }
        if (targetRow !== -1) {
          makeMove(targetRow, chosenCol, turn);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, board, aiPlayers, aiDifficulty]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[560px] mx-auto p-4 bg-slate-900/90 border border-blue-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        gameMode={initialMode}
        aiDifficulty={aiDifficulty}
        onAiDifficultyChange={setAiDifficulty}
        userColorId={userColor}
        onUserColorChange={(id) => {
          const col = id as 'r' | 'y';
          setUserColor(col);
          setAiPlayers({
            r: col === 'y',
            y: col === 'r',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'r',
            name: 'Red Discs',
            colorHex: '#ef4444',
            isAi: aiPlayers.r,
            isUser: userColor === 'r',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, r: !prev.r })),
          },
          {
            id: 'y',
            name: 'Yellow Discs',
            colorHex: '#eab308',
            isAi: aiPlayers.y,
            isUser: userColor === 'y',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, y: !prev.y })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-blue-400/30">
            🟡
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Connect Four
            </h3>
            <p className="text-xs text-gray-300">
              Drop discs into columns. Connect 4 in a row to win!
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

      {/* Turn Indicator */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-bold">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'r' ? 'bg-red-500/20 text-red-300 border border-red-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-300" />
          <span>Red {userColor === 'r' ? '(You)' : aiPlayers.r ? '(AI)' : '(Human)'}</span>
        </div>
        <span className="text-gray-500 uppercase font-extrabold tracking-widest text-[10px]">
          {winner ? 'Game Over' : `Turn: ${turn === 'r' ? 'Red' : 'Yellow'}`}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'y' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-200" />
          <span>Yellow {userColor === 'y' ? '(You)' : aiPlayers.y ? '(AI)' : '(Human)'}</span>
        </div>
      </div>

      {/* Board Layout */}
      <div className="w-full bg-blue-800 border-4 border-blue-900 rounded-2xl p-3 shadow-2xl space-y-2">
        {/* Column Drop Buttons Header */}
        <div className="grid grid-cols-7 gap-2">
          {Array(COLS).fill(0).map((_, c) => (
            <button
              key={c}
              onClick={() => dropDisc(c)}
              disabled={!!board[0][c] || !!winner}
              className="py-1.5 rounded-lg bg-blue-700/60 hover:bg-blue-600 text-blue-200 text-xs font-black transition flex items-center justify-center gap-1 border border-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <span>↓</span>
            </button>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-2 bg-blue-950/60 p-2 rounded-xl">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWinCell = winningCells.some(w => w.row === r && w.col === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => dropDisc(c)}
                  className="aspect-square rounded-full bg-slate-950 border-2 border-blue-900 flex items-center justify-center p-1 cursor-pointer overflow-hidden relative shadow-inner"
                >
                  {cell && (
                    <motion.div
                      initial={{ y: -150 }}
                      animate={{ y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`w-full h-full rounded-full shadow-lg ${
                        cell === 'r'
                          ? 'bg-gradient-to-tr from-red-700 to-red-500 border border-red-300'
                          : 'bg-gradient-to-tr from-yellow-500 to-amber-300 border border-yellow-200'
                      } ${isWinCell ? 'ring-4 ring-white animate-bounce' : ''}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Win Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-blue-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'draw'
                  ? 'Grid Full - Draw!'
                  : winner === 'r'
                  ? 'Red Team Wins!'
                  : 'Yellow Team Wins!'}
              </span>
            </div>
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
