import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { BotAISettingsBar } from './BotAISettingsBar';

interface UltimateTicTacToeBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const UltimateTicTacToeBoard: React.FC<UltimateTicTacToeBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const [opponentType, setOpponentType] = useState<'pvp' | 'ai'>(
    initialMode === 'local' || initialMode === 'pvp' ? 'pvp' : 'ai'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [boards, setBoards] = useState<( 'X' | 'O' | null )[][]>(
    Array(9).fill(null).map(() => Array(9).fill(null))
  );

  const [boardWinners, setBoardWinners] = useState<( 'X' | 'O' | 'draw' | null )[]>(Array(9).fill(null));
  const [activeBoardIdx, setActiveBoardIdx] = useState<number>(-1);
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const hasRecordedRef = React.useRef(false);

  // Settings state
  const [userColor, setUserColor] = useState<'X' | 'O'>('X');
  const [aiPlayers, setAiPlayers] = useState<Record<'X' | 'O', boolean>>({
    X: false,
    O: true,
  });

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === 'draw' ? 'draw' : winner === userColor ? 'w' : 'b';
      onGameEnd(winnerCode, 'ultimate_tictactoe_macro_win');
    }
  }, [winner, onGameEnd, userColor]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setBoardWinners(Array(9).fill(null));
    setActiveBoardIdx(-1);
    setTurn('X');
    setWinner(null);
  };

  const checkMiniWin = (cells: ('X' | 'O' | null)[]) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (const [a, b, c] of lines) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    if (cells.every(c => c !== null)) return 'draw';
    return null;
  };

  const checkMainWin = (bWinners: ('X' | 'O' | 'draw' | null)[]) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (const [a, b, c] of lines) {
      if (bWinners[a] && bWinners[a] !== 'draw' && bWinners[a] === bWinners[b] && bWinners[a] === bWinners[c]) {
        return bWinners[a];
      }
    }
    if (bWinners.every(w => w !== null)) return 'draw';
    return null;
  };

  const handleCellClick = (boardIdx: number, cellIdx: number) => {
    if (winner) return;
    if (aiPlayers[turn]) return;

    if (activeBoardIdx !== -1 && activeBoardIdx !== boardIdx) return;
    if (boardWinners[boardIdx]) return;
    if (boards[boardIdx][cellIdx]) return;

    makeMove(boardIdx, cellIdx, turn);
  };

  const makeMove = (boardIdx: number, cellIdx: number, playerMark: 'X' | 'O') => {
    soundFx.playMove();
    const newBoards = boards.map(b => [...b]);
    newBoards[boardIdx][cellIdx] = playerMark;
    setBoards(newBoards);

    const miniWin = checkMiniWin(newBoards[boardIdx]);
    const newBoardWinners = [...boardWinners];
    if (miniWin) {
      newBoardWinners[boardIdx] = miniWin;
      setBoardWinners(newBoardWinners);
    }

    const mainWin = checkMainWin(newBoardWinners);
    if (mainWin) {
      soundFx.playGameOver(playerMark === userColor);
      setWinner(mainWin);
      return;
    }

    if (newBoardWinners[cellIdx] !== null || newBoards[cellIdx].every(c => c !== null)) {
      setActiveBoardIdx(-1);
    } else {
      setActiveBoardIdx(cellIdx);
    }

    setTurn(playerMark === 'X' ? 'O' : 'X');
  };

  // AI Logic with difficulty
  useEffect(() => {
    if (turn === 'O' && opponentType === 'ai' && !winner) {
      const delay = aiDifficulty === 'easy' ? 750 : aiDifficulty === 'medium' ? 500 : 350;
      const timer = setTimeout(() => {
        let validBoards: number[] = [];
        if (activeBoardIdx !== -1 && !boardWinners[activeBoardIdx] && boards[activeBoardIdx].some(c => c === null)) {
          validBoards = [activeBoardIdx];
        } else {
          validBoards = boardWinners
            .map((w, idx) => (w === null && boards[idx].some(c => c === null) ? idx : -1))
            .filter(i => i !== -1);
        }

        if (validBoards.length === 0) return;

        const targetBoard = validBoards[Math.floor(Math.random() * validBoards.length)];
        const emptyCells = boards[targetBoard]
          .map((c, idx) => (c === null ? idx : -1))
          .filter(i => i !== -1);

        if (emptyCells.length === 0) return;

        let targetCell: number = emptyCells[0];

        if (aiDifficulty === 'easy') {
          targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
          // Check for immediate mini-board winning move
          const winningCell = emptyCells.find(cell => {
            const testCells = [...boards[targetBoard]];
            testCells[cell] = 'O';
            return checkMiniWin(testCells) === 'O';
          });

          // Check for mini-board block move
          const blockCell = emptyCells.find(cell => {
            const testCells = [...boards[targetBoard]];
            testCells[cell] = 'X';
            return checkMiniWin(testCells) === 'X';
          });

          if (winningCell !== undefined) {
            targetCell = winningCell;
          } else if (blockCell !== undefined) {
            targetCell = blockCell;
          } else if (aiDifficulty === 'hard') {
            // Pick center or corners, and prefer cells that send opponent to an already completed board
            const favorableCell = emptyCells.find(cell => boardWinners[cell] !== null) ||
                                  emptyCells.find(cell => cell === 4) ||
                                  emptyCells[Math.floor(Math.random() * emptyCells.length)];
            targetCell = favorableCell;
          } else {
            targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          }
        }

        makeMove(targetBoard, targetCell, turn);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, boards, boardWinners, activeBoardIdx, opponentType, aiDifficulty]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-indigo-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Uniform AI & Opponent Bar */}
      <BotAISettingsBar
        opponentType={opponentType}
        onOpponentTypeChange={(t) => {
          setOpponentType(t === 'solo' ? 'pvp' : t);
          resetGame();
        }}
        aiDifficulty={aiDifficulty}
        onAiDifficultyChange={(d) => setAiDifficulty(d)}
        statusMessage={winner ? `Match Over: ${winner === 'draw' ? 'Draw' : `${winner} Wins!`}` : `${turn === 'X' ? 'X (You)' : 'O (AI)'}'s turn - Choose valid sub-grid.`}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-indigo-400/30">
            <Grid className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Ultimate Tic-Tac-Toe
            </h3>
            <p className="text-xs text-gray-300">
              Your cell choice dictates where your opponent plays next!
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

      {/* Turn Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-bold">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'X' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40' : 'text-gray-400'}`}>
          <span className="font-extrabold text-indigo-400 text-sm">X</span>
          <span>X Mark {userColor === 'X' ? '(You)' : aiPlayers.X ? '(AI)' : '(Human)'}</span>
        </div>
        <span className="text-gray-400 uppercase font-extrabold tracking-widest text-[10px]">
          {winner
            ? 'Finished'
            : activeBoardIdx === -1
            ? 'Any Board Open'
            : `Play in Board #${activeBoardIdx + 1}`}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'O' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'text-gray-400'}`}>
          <span className="font-extrabold text-purple-400 text-sm">O</span>
          <span>O Mark {userColor === 'O' ? '(You)' : aiPlayers.O ? '(AI)' : '(Human)'}</span>
        </div>
      </div>

      {/* 3x3 Grid of 3x3 Boards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[500px] aspect-square bg-slate-950 p-3 rounded-2xl border-2 border-indigo-500/40 shadow-2xl">
        {boards.map((miniBoard, bIdx) => {
          const isBoardActive = (activeBoardIdx === -1 || activeBoardIdx === bIdx) && !boardWinners[bIdx] && !winner;
          const miniWinner = boardWinners[bIdx];

          return (
            <div
              key={bIdx}
              className={`relative grid grid-cols-3 gap-1 p-1.5 rounded-xl border-2 transition ${
                isBoardActive
                  ? 'border-amber-400 bg-indigo-950/40 shadow-[0_0_15px_rgba(243,206,107,0.3)]'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Mini-Board Overlay if Won */}
              {miniWinner && (
                <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className={`text-4xl font-black ${miniWinner === 'X' ? 'text-indigo-400' : miniWinner === 'O' ? 'text-purple-400' : 'text-gray-400'}`}>
                    {miniWinner === 'draw' ? '-' : miniWinner}
                  </span>
                </div>
              )}

              {/* 9 Cells */}
              {miniBoard.map((cell, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleCellClick(bIdx, cIdx)}
                  disabled={!isBoardActive || !!cell}
                  className="aspect-square bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center font-black text-sm hover:bg-slate-800/80 transition cursor-pointer"
                >
                  <span className={cell === 'X' ? 'text-indigo-400' : cell === 'O' ? 'text-purple-400' : ''}>
                    {cell}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'draw'
                  ? 'Draw Match!'
                  : winner === 'X'
                  ? 'Player X Claims Ultimate Victory!'
                  : 'Player O Claims Ultimate Victory!'}
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
