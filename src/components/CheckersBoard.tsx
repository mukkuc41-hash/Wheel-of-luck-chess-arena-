import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type CheckersPiece = {
  id: string;
  color: 'r' | 'b'; // r = Red (moves up), b = Black (moves down)
  isKing: boolean;
};

type SquarePosition = { row: number; col: number };

interface CheckersBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({ gameMode = 'ai', onGameEnd }) => {
  // Initialize 8x8 board with 12 black checkers (rows 0-2) and 12 red checkers (rows 5-7) on dark squares
  const createInitialBoard = (): (CheckersPiece | null)[][] => {
    const board: (CheckersPiece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    let pieceId = 1;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          if (row < 3) {
            board[row][col] = { id: `b_${pieceId++}`, color: 'b', isKing: false };
          } else if (row > 4) {
            board[row][col] = { id: `r_${pieceId++}`, color: 'r', isKing: false };
          }
        }
      }
    }
    return board;
  };

  const [board, setBoard] = useState<(CheckersPiece | null)[][]>(createInitialBoard);
  const [turn, setTurn] = useState<'r' | 'b'>('r'); // Red starts
  const [selectedSquare, setSelectedSquare] = useState<SquarePosition | null>(null);
  const [capturedRed, setCapturedRed] = useState<number>(0);
  const [capturedBlack, setCapturedBlack] = useState<number>(0);
  const [winner, setWinner] = useState<'r' | 'b' | null>(null);
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      onGameEnd(winner === 'r' ? 'w' : 'b', 'checkers_win');
    }
  }, [winner, onGameEnd]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setBoard(createInitialBoard());
    setTurn('r');
    setSelectedSquare(null);
    setCapturedRed(0);
    setCapturedBlack(0);
    setWinner(null);
  };

  // Get legal move targets for selected square
  const getLegalMoves = (pos: SquarePosition): { to: SquarePosition; jumpOver?: SquarePosition }[] => {
    const piece = board[pos.row][pos.col];
    if (!piece || piece.color !== turn) return [];

    const moves: { to: SquarePosition; jumpOver?: SquarePosition }[] = [];
    const directions: number[][] = [];

    if (piece.color === 'r' || piece.isKing) {
      directions.push([-1, -1], [-1, 1]); // Move up
    }
    if (piece.color === 'b' || piece.isKing) {
      directions.push([1, -1], [1, 1]); // Move down
    }

    for (const [dRow, dCol] of directions) {
      const targetRow = pos.row + dRow;
      const targetCol = pos.col + dCol;

      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        // Simple move
        if (!board[targetRow][targetCol]) {
          moves.push({ to: { row: targetRow, col: targetCol } });
        } else if (board[targetRow][targetCol]?.color !== piece.color) {
          // Jump capture move
          const jumpRow = targetRow + dRow;
          const jumpCol = targetCol + dCol;
          if (
            jumpRow >= 0 &&
            jumpRow < 8 &&
            jumpCol >= 0 &&
            jumpCol < 8 &&
            !board[jumpRow][jumpCol]
          ) {
            moves.push({
              to: { row: jumpRow, col: jumpCol },
              jumpOver: { row: targetRow, col: targetCol },
            });
          }
        }
      }
    }

    return moves;
  };

  const legalMoves = selectedSquare ? getLegalMoves(selectedSquare) : [];

  // Automated AI opponent turn execution for Black ('b')
  useEffect(() => {
    if (gameMode === 'ai' && turn === 'b' && !winner) {
      const timer = setTimeout(() => {
        const blackPiecesWithMoves: { pos: SquarePosition; moves: { to: SquarePosition; jumpOver?: SquarePosition }[] }[] = [];

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c]?.color === 'b') {
              const pieceMoves = getLegalMoves({ row: r, col: c });
              if (pieceMoves.length > 0) {
                blackPiecesWithMoves.push({ pos: { row: r, col: c }, moves: pieceMoves });
              }
            }
          }
        }

        if (blackPiecesWithMoves.length > 0) {
          // Prioritize capture jump moves if available
          const jumpPiece = blackPiecesWithMoves.find((p) => p.moves.some((m) => m.jumpOver));
          const chosenPiece = jumpPiece || blackPiecesWithMoves[Math.floor(Math.random() * blackPiecesWithMoves.length)];
          const jumpMove = chosenPiece.moves.find((m) => m.jumpOver);
          const chosenMove = jumpMove || chosenPiece.moves[Math.floor(Math.random() * chosenPiece.moves.length)];

          const newBoard = board.map((row) => [...row]);
          const piece = newBoard[chosenPiece.pos.row][chosenPiece.pos.col]!;

          newBoard[chosenPiece.pos.row][chosenPiece.pos.col] = null;
          let isKing = piece.isKing;
          if (chosenMove.to.row === 7) isKing = true;

          newBoard[chosenMove.to.row][chosenMove.to.col] = { ...piece, isKing };

          if (chosenMove.jumpOver) {
            const { row: jRow, col: jCol } = chosenMove.jumpOver;
            const capturedPiece = newBoard[jRow][jCol];
            newBoard[jRow][jCol] = null;
            if (capturedPiece?.color === 'r') setCapturedRed((prev) => prev + 1);
            if (capturedPiece?.color === 'b') setCapturedBlack((prev) => prev + 1);
          }

          setBoard(newBoard);

          let redCount = 0;
          let blackCount = 0;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (newBoard[r][c]?.color === 'r') redCount++;
              if (newBoard[r][c]?.color === 'b') blackCount++;
            }
          }

          if (redCount === 0) setWinner('b');
          else if (blackCount === 0) setWinner('r');
          else setTurn('r');
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, board, winner]);

  const handleSquareClick = (row: number, col: number) => {
    if (winner) return;

    const clickedPiece = board[row][col];

    // Select piece if it's player's turn
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedSquare({ row, col });
      return;
    }

    // Try executing a move if square is selected
    if (selectedSquare) {
      const matchingMove = legalMoves.find((m) => m.to.row === row && m.to.col === col);

      if (matchingMove) {
        const newBoard = board.map((r) => [...r]);
        const piece = newBoard[selectedSquare.row][selectedSquare.col]!;

        // Remove from old square
        newBoard[selectedSquare.row][selectedSquare.col] = null;

        // Check King promotion
        let isKing = piece.isKing;
        if (piece.color === 'r' && row === 0) isKing = true;
        if (piece.color === 'b' && row === 7) isKing = true;

        newBoard[row][col] = { ...piece, isKing };

        // Handle capture
        if (matchingMove.jumpOver) {
          const { row: jRow, col: jCol } = matchingMove.jumpOver;
          const capturedPiece = newBoard[jRow][jCol];
          newBoard[jRow][jCol] = null;

          if (capturedPiece?.color === 'r') setCapturedRed((prev) => prev + 1);
          if (capturedPiece?.color === 'b') setCapturedBlack((prev) => prev + 1);
        }

        setBoard(newBoard);
        setSelectedSquare(null);

        // Check remaining pieces for win
        let redCount = 0;
        let blackCount = 0;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c]?.color === 'r') redCount++;
            if (newBoard[r][c]?.color === 'b') blackCount++;
          }
        }

        if (redCount === 0) setWinner('b');
        else if (blackCount === 0) setWinner('r');
        else setTurn((prev) => (prev === 'r' ? 'b' : 'r'));
      } else {
        setSelectedSquare(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[580px] mx-auto p-4 bg-[#121214] border border-amber-500/30 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] text-white font-sans">
      
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-lg font-black font-serif text-[#ffe89e]">Roads (Draughts / Checkers)</h2>
        </div>
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition border border-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Turn & Score Status */}
      <div className="w-full flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/10 mb-4 text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Current Turn:</span>
          <span
            className={`px-3 py-1 rounded-full text-white font-black tracking-wide uppercase border ${
              turn === 'r'
                ? 'bg-red-600/80 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'bg-slate-700/80 border-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.5)]'
            }`}
          >
            {turn === 'r' ? '🔴 Red' : '⚫ Black'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-300 font-mono">
          <span>Captured Red: <strong className="text-red-400">{capturedRed}</strong>/12</span>
          <span>Captured Black: <strong className="text-slate-200">{capturedBlack}</strong>/12</span>
        </div>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="w-full p-3 mb-4 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center gap-2 text-sm font-black animate-bounce shadow-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Game Over! {winner === 'r' ? '🔴 Red Player' : '⚫ Black Player'} Wins!</span>
        </div>
      )}

      {/* 8x8 Board Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-[#3d2b1f] shadow-2xl grid grid-cols-8 grid-rows-8 bg-[#f0d9b5]">
        {board.map((rowArr, rowIndex) =>
          rowArr.map((piece, colIndex) => {
            const isDarkSquare = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isTarget = legalMoves.some((m) => m.to.row === rowIndex && m.to.col === colIndex);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                className={`relative flex items-center justify-center transition-all duration-150 ${
                  isDarkSquare ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'
                } ${isSelected ? 'ring-4 ring-amber-400 z-10' : ''}`}
              >
                {/* Highlight valid destination square */}
                {isTarget && (
                  <div className="absolute w-5 h-5 rounded-full bg-emerald-400/80 ring-2 ring-emerald-300 animate-ping z-20" />
                )}

                {/* Checker Piece with Framer Motion Sliding Transition */}
                {piece && (
                  <motion.div
                    layoutId={piece.id}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 26,
                      mass: 0.8,
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-[78%] h-[78%] rounded-full flex items-center justify-center shadow-lg z-10 ${
                      piece.color === 'r'
                        ? 'bg-gradient-to-tr from-red-700 via-red-500 to-rose-400 border-2 border-red-300 shadow-red-950/80'
                        : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 border-2 border-slate-500 shadow-black'
                    }`}
                  >
                    {/* Inner Crown / Ring for Kings */}
                    {piece.isKing ? (
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]" />
                    ) : (
                      <div className="w-1/2 h-1/2 rounded-full border border-white/20" />
                    )}
                  </motion.div>
                )}
              </button>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-3 text-center">
        Click a piece on your turn to highlight legal diagonal moves. Jump over enemy pieces to capture them!
      </p>
    </div>
  );
};
