import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { BotAISettingsBar } from './BotAISettingsBar';

interface DotsAndBoxesBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const DotsAndBoxesBoard: React.FC<DotsAndBoxesBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const GRID_SIZE = 5;
  const BOX_COUNT = GRID_SIZE - 1;

  const [opponentType, setOpponentType] = useState<'pvp' | 'ai'>(
    initialMode === 'local' || initialMode === 'pvp' ? 'pvp' : 'ai'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [hLines, setHLines] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(false).map(() => Array(BOX_COUNT).fill(false))
  );

  const [vLines, setVLines] = useState<boolean[][]>(
    Array(BOX_COUNT).fill(false).map(() => Array(GRID_SIZE).fill(false))
  );

  const [boxes, setBoxes] = useState<('P1' | 'P2' | null)[][]>(
    Array(BOX_COUNT).fill(null).map(() => Array(BOX_COUNT).fill(null))
  );

  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
  const [winner, setWinner] = useState<'P1' | 'P2' | 'draw' | null>(null);
  const hasRecordedRef = React.useRef(false);

  // Settings state
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [userColor, setUserColor] = useState<string>('P1');
  const [aiPlayers, setAiPlayers] = useState<Record<string, boolean>>({
    P1: false,
    P2: true,
    P3: true,
    P4: true,
  });

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === 'draw' ? 'draw' : winner === userColor ? 'w' : 'b';
      onGameEnd(winnerCode, 'dots_boxes_claim_squares');
    }
  }, [winner, onGameEnd, userColor]);

  const PLAYER_DECK = [
    { id: 'P1', name: 'Emerald (P1)', hex: '#10b981' },
    { id: 'P2', name: 'Indigo (P2)', hex: '#6366f1' },
    { id: 'P3', name: 'Amber (P3)', hex: '#f59e0b' },
    { id: 'P4', name: 'Rose (P4)', hex: '#f43f5e' },
  ];

  const resetGame = () => {
    hasRecordedRef.current = false;
    setHLines(Array(GRID_SIZE).fill(false).map(() => Array(BOX_COUNT).fill(false)));
    setVLines(Array(BOX_COUNT).fill(false).map(() => Array(GRID_SIZE).fill(false)));
    setBoxes(Array(BOX_COUNT).fill(null).map(() => Array(BOX_COUNT).fill(null)));
    setP1Score(0);
    setP2Score(0);
    setTurn('P1');
    setWinner(null);
  };

  const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
    if (winner) return;
    if (aiPlayers[turn]) return;

    if (type === 'h' && hLines[r][c]) return;
    if (type === 'v' && vLines[r][c]) return;

    makeMove(type, r, c, turn);
  };

  const makeMove = (type: 'h' | 'v', r: number, c: number, player: 'P1' | 'P2') => {
    soundFx.playMove();

    const newH = hLines.map(row => [...row]);
    const newV = vLines.map(row => [...row]);

    if (type === 'h') newH[r][c] = true;
    else newV[r][c] = true;

    setHLines(newH);
    setVLines(newV);

    const newBoxes = boxes.map(row => [...row]);
    let boxesCompleted = 0;

    for (let boxR = 0; boxR < BOX_COUNT; boxR++) {
      for (let boxC = 0; boxC < BOX_COUNT; boxC++) {
        if (!newBoxes[boxR][boxC]) {
          const top = newH[boxR][boxC];
          const bottom = newH[boxR + 1][boxC];
          const left = newV[boxR][boxC];
          const right = newV[boxR][boxC + 1];

          if (top && bottom && left && right) {
            newBoxes[boxR][boxC] = player;
            boxesCompleted++;
          }
        }
      }
    }

    setBoxes(newBoxes);

    let newP1 = p1Score;
    let newP2 = p2Score;
    if (player === 'P1') {
      newP1 += boxesCompleted;
      setP1Score(newP1);
    } else {
      newP2 += boxesCompleted;
      setP2Score(newP2);
    }

    if (newP1 + newP2 === BOX_COUNT * BOX_COUNT) {
      const isUserWin = (userColor === 'P1' && newP1 > newP2) || (userColor === 'P2' && newP2 > newP1);
      soundFx.playGameOver(isUserWin);
      if (newP1 > newP2) setWinner('P1');
      else if (newP2 > newP1) setWinner('P2');
      else setWinner('draw');
      return;
    }

    if (boxesCompleted === 0) {
      setTurn(player === 'P1' ? 'P2' : 'P1');
    }
  };

  // Helper to count sides completed on a box
  const countBoxSides = (r: number, c: number, testHLines = hLines, testVLines = vLines) => {
    let count = 0;
    if (testHLines[r][c]) count++;
    if (testHLines[r + 1][c]) count++;
    if (testVLines[r][c]) count++;
    if (testVLines[r][c + 1]) count++;
    return count;
  };

  // AI Logic with difficulty
  useEffect(() => {
    if (turn === 'P2' && opponentType === 'ai' && !winner) {
      const delay = aiDifficulty === 'easy' ? 750 : aiDifficulty === 'medium' ? 500 : 350;
      const timer = setTimeout(() => {
        const availableLines: { type: 'h' | 'v'; r: number; c: number }[] = [];

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < BOX_COUNT; c++) {
            if (!hLines[r][c]) availableLines.push({ type: 'h', r, c });
          }
        }
        for (let r = 0; r < BOX_COUNT; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!vLines[r][c]) availableLines.push({ type: 'v', r, c });
          }
        }

        if (availableLines.length === 0) return;

        let chosen: { type: 'h' | 'v'; r: number; c: number };

        if (aiDifficulty === 'easy') {
          chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
        } else {
          // Find any move that completes a box (has 3 sides currently)
          const winningMoves = availableLines.filter(line => {
            const tempH = hLines.map(row => [...row]);
            const tempV = vLines.map(row => [...row]);
            if (line.type === 'h') tempH[line.r][line.c] = true;
            else tempV[line.r][line.c] = true;

            for (let r = 0; r < BOX_COUNT; r++) {
              for (let c = 0; c < BOX_COUNT; c++) {
                if (!boxes[r][c] && countBoxSides(r, c, tempH, tempV) === 4) {
                  return true;
                }
              }
            }
            return false;
          });

          if (winningMoves.length > 0) {
            chosen = winningMoves[0];
          } else if (aiDifficulty === 'hard') {
            // Avoid creating a 3rd side for opponent
            const safeMoves = availableLines.filter(line => {
              const tempH = hLines.map(row => [...row]);
              const tempV = vLines.map(row => [...row]);
              if (line.type === 'h') tempH[line.r][line.c] = true;
              else tempV[line.r][line.c] = true;

              for (let r = 0; r < BOX_COUNT; r++) {
                for (let c = 0; c < BOX_COUNT; c++) {
                  if (!boxes[r][c] && countBoxSides(r, c, tempH, tempV) === 3) {
                    return false;
                  }
                }
              }
              return true;
            });

            chosen = safeMoves.length > 0 ? safeMoves[Math.floor(Math.random() * safeMoves.length)] : availableLines[0];
          } else {
            chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
          }
        }

        makeMove(chosen.type, chosen.r, chosen.c, turn);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, hLines, vLines, boxes, opponentType, aiDifficulty]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[560px] mx-auto p-4 bg-slate-900/90 border border-emerald-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Uniform AI & Opponent Bar */}
      <BotAISettingsBar
        opponentType={opponentType}
        onOpponentTypeChange={(t) => {
          setOpponentType(t === 'solo' ? 'pvp' : t);
          resetGame();
        }}
        aiDifficulty={aiDifficulty}
        onAiDifficultyChange={(d) => setAiDifficulty(d)}
        statusMessage={winner ? `Game Over: ${winner === 'draw' ? 'Draw' : `${winner} Wins!`}` : `${turn === 'P1' ? 'P1' : 'P2 (AI)'}'s turn - Connect dots to claim boxes.`}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-emerald-400/30">
            📦
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Dots &amp; Boxes
            </h3>
            <p className="text-xs text-gray-300">
              Draw lines between dots. Complete 4th side to claim boxes &amp; extra turn!
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
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'P1' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-300" />
          <span>Player 1: <strong className="text-white text-sm">{p1Score}</strong></span>
        </div>
        <span className="text-gray-500 uppercase font-extrabold tracking-widest text-[10px]">
          {winner ? 'Game Over' : `Turn: ${turn === 'P1' ? 'P1' : 'P2'}`}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'P2' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-300" />
          <span>{userColor === 'P2' ? 'You (P2)' : aiPlayers.P2 ? 'AI Bot' : 'Player 2'}: <strong className="text-white text-sm">{p2Score}</strong></span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="relative w-full aspect-square max-w-[440px] bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
        {Array(GRID_SIZE).fill(0).map((_, r) => (
          <div key={r} className="flex flex-col w-full">
            {/* Dots + Horizontal Lines Row */}
            <div className="flex items-center justify-between w-full">
              {Array(GRID_SIZE).fill(0).map((_, c) => (
                <React.Fragment key={c}>
                  {/* Dot */}
                  <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(243,206,107,0.8)] z-10 shrink-0" />

                  {/* Horizontal Line Segment */}
                  {c < BOX_COUNT && (
                    <button
                      onClick={() => handleLineClick('h', r, c)}
                      disabled={hLines[r][c] || !!winner}
                      className={`flex-1 h-3 -mx-1 transition-all rounded cursor-pointer z-0 ${
                        hLines[r][c]
                          ? 'bg-amber-400 shadow-[0_0_10px_rgba(243,206,107,0.6)]'
                          : 'bg-slate-800 hover:bg-emerald-500/50'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Vertical Lines + Box Fill Row */}
            {r < BOX_COUNT && (
              <div className="flex items-center justify-between w-full h-16 my-1">
                {Array(GRID_SIZE).fill(0).map((_, c) => (
                  <React.Fragment key={c}>
                    {/* Vertical Line Segment */}
                    <button
                      onClick={() => handleLineClick('v', r, c)}
                      disabled={vLines[r][c] || !!winner}
                      className={`w-3 h-full my-0.5 transition-all rounded cursor-pointer ${
                        vLines[r][c]
                          ? 'bg-amber-400 shadow-[0_0_10px_rgba(243,206,107,0.6)]'
                          : 'bg-slate-800 hover:bg-emerald-500/50'
                      }`}
                    />

                    {/* Box Space */}
                    {c < BOX_COUNT && (
                      <div className="flex-1 h-full mx-1 rounded-xl flex items-center justify-center transition-all">
                        {boxes[r][c] && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-full h-full rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${
                              boxes[r][c] === 'P1'
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                                : 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                            }`}
                          >
                            {boxes[r][c]}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'draw'
                  ? 'Tie Game!'
                  : winner === 'P1'
                  ? 'Player 1 Wins!'
                  : 'Player 2 Wins!'}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Final Score: P1 ({p1Score}) - P2 ({p2Score})
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
