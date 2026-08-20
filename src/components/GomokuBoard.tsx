import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface GomokuBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const GomokuBoard: React.FC<GomokuBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const GRID_SIZE = 15;
  const [board, setBoard] = useState<( 'b' | 'w' | null )[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [turn, setTurn] = useState<'b' | 'w'>('b'); // Black moves first in Gomoku
  const [winner, setWinner] = useState<'b' | 'w' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const hasRecordedRef = React.useRef(false);

  // Settings state
  const [userColor, setUserColor] = useState<'b' | 'w'>('b');
  const [aiPlayers, setAiPlayers] = useState<Record<'b' | 'w', boolean>>({
    b: false,
    w: true,
  });

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      onGameEnd(winner, 'five_in_a_row_align');
    }
  }, [winner, onGameEnd]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setBoard(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setTurn('b');
    setWinner(null);
    setWinningLine([]);
    setLastMove(null);
  };

  // Check 5 in a row unbroken
  const checkWin = (b: ('b' | 'w' | null)[][], r: number, c: number, color: 'b' | 'w') => {
    const directions = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal \
      [[1, -1], [-1, 1]]   // Diagonal /
    ];

    for (const [d1, d2] of directions) {
      const line = [{ row: r, col: c }];

      for (const [dr, dc] of [d1, d2]) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && b[nr][nc] === color) {
          line.push({ row: nr, col: nc });
          nr += dr;
          nc += dc;
        }
      }

      if (line.length >= 5) {
        return line;
      }
    }
    return null;
  };

  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] || winner) return;
    if (aiPlayers[turn]) return; // AI turn block

    makeMove(r, c, turn);
  };

  const makeMove = (r: number, c: number, playerColor: 'b' | 'w') => {
    soundFx.playMove();
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = playerColor;
    setBoard(newBoard);
    setLastMove({ row: r, col: c });

    const winSeq = checkWin(newBoard, r, c, playerColor);
    if (winSeq) {
      soundFx.playGameOver(playerColor === userColor);
      setWinningLine(winSeq);
      setWinner(playerColor);
      return;
    }

    // Check draw
    const isFull = newBoard.every(row => row.every(cell => cell !== null));
    if (isFull) {
      setWinner('draw');
      return;
    }

    setTurn(playerColor === 'b' ? 'w' : 'b');
  };

  // AI Logic
  useEffect(() => {
    if (aiPlayers[turn] && !winner) {
      const timer = setTimeout(() => {
        let bestScore = -100000;
        let bestCell = { row: 7, col: 7 };

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === null) {
              let score = 0;
              score += 7 - Math.abs(r - 7) - Math.abs(c - 7);
              if (lastMove && Math.abs(r - lastMove.row) <= 2 && Math.abs(c - lastMove.col) <= 2) {
                score += 20;
              }
              if (score > bestScore) {
                bestScore = score;
                bestCell = { row: r, col: c };
              }
            }
          }
        }
        makeMove(bestCell.row, bestCell.col, turn);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, aiPlayers, board]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        userColorId={userColor}
        onUserColorChange={(id) => {
          const col = id as 'b' | 'w';
          setUserColor(col);
          setAiPlayers({
            b: col === 'w',
            w: col === 'b',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'b',
            name: 'Black Stones',
            colorHex: '#1e1b18',
            isAi: aiPlayers.b,
            isUser: userColor === 'b',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, b: !prev.b })),
          },
          {
            id: 'w',
            name: 'White Stones',
            colorHex: '#ffffff',
            isAi: aiPlayers.w,
            isUser: userColor === 'w',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, w: !prev.w })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Game Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-700 to-stone-500 flex items-center justify-center text-white font-black text-xl shadow-md border border-amber-400/30">
            ⚫
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e] flex items-center gap-2">
              <span>Gomoku (Five in a Row)</span>
            </h3>
            <p className="text-xs text-gray-300">
              Align 5 unbroken stones horizontally, vertically, or diagonally.
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
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'b' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-gray-400'}`}>
          <span className="w-3 h-3 rounded-full bg-black border border-amber-300" />
          <span>Black {userColor === 'b' ? '(You)' : aiPlayers.b ? '(AI Bot)' : '(Human)'}</span>
        </div>
        <span className="text-gray-500 uppercase font-extrabold tracking-widest text-[10px]">
          {winner ? 'Game Ended' : 'Turn Phase'}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'w' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-gray-400'}`}>
          <span className="w-3 h-3 rounded-full bg-white border border-gray-400" />
          <span>White {userColor === 'w' ? '(You)' : aiPlayers.w ? '(AI Bot)' : '(Human)'}</span>
        </div>
      </div>

      {/* 15x15 Intersection Board Canvas */}
      <div className="relative w-full aspect-square max-w-[520px] bg-[#d2a679] border-4 border-[#8a5a36] rounded-2xl shadow-inner p-3 grid grid-cols-15 grid-rows-15 gap-0 overflow-hidden">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWinningCell = winningLine.some(p => p.row === r && p.col === c);
            const isLast = lastMove?.row === r && lastMove?.col === c;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="relative flex items-center justify-center border border-amber-900/20 hover:bg-black/10 transition cursor-pointer"
              >
                {/* Intersection Grid Lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-amber-950/40" />
                  <div className="h-full w-[1px] bg-amber-950/40 absolute" />
                </div>

                {/* Star Point Markers at (3,3), (3,11), (7,7), (11,3), (11,11) */}
                {((r === 3 || r === 11 || r === 7) && (c === 3 || c === 11 || c === 7)) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-950/70 z-0 pointer-events-none" />
                )}

                {/* Placed Stone */}
                {cell && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`relative z-10 w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center ${
                      cell === 'b'
                        ? 'bg-gradient-to-tr from-stone-900 to-stone-700 border border-stone-600 shadow-black/80'
                        : 'bg-gradient-to-tr from-stone-200 to-white border border-stone-300 shadow-black/40'
                    } ${isWinningCell ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                  >
                    {isLast && (
                      <span className={`w-2 h-2 rounded-full ${cell === 'b' ? 'bg-amber-400' : 'bg-red-500'}`} />
                    )}
                  </motion.div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Winner Popup Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'draw'
                  ? "It's a Draw!"
                  : winner === 'b'
                  ? 'Black Wins the Match!'
                  : 'White Wins the Match!'}
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
