import React, { useState, useEffect } from 'react';
import { RotateCcw, Dices, Trophy, ArrowRight, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PointStack {
  color: 'w' | 'b' | null;
  count: number;
  checkers: string[];
}

interface BackgammonBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const BackgammonBoard: React.FC<BackgammonBoardProps> = ({ gameMode = 'ai', onGameEnd }) => {
  // Backgammon standard 24 points setup (1-indexed 1 to 24)
  // Index 0 is Bar for White/Black hits, Index 25 is Bear-off
  const createInitialPoints = (): PointStack[] => {
    const points: PointStack[] = Array(25).fill(null).map(() => ({ color: null, count: 0, checkers: [] }));

    // Standard starting positions with unique checker IDs for smooth Motion sliding
    points[1] = { color: 'w', count: 2, checkers: ['w_1', 'w_2'] };
    points[6] = { color: 'b', count: 5, checkers: ['b_1', 'b_2', 'b_3', 'b_4', 'b_5'] };
    points[8] = { color: 'b', count: 3, checkers: ['b_6', 'b_7', 'b_8'] };
    points[12] = { color: 'w', count: 5, checkers: ['w_3', 'w_4', 'w_5', 'w_6', 'w_7'] };
    points[13] = { color: 'b', count: 5, checkers: ['b_9', 'b_10', 'b_11', 'b_12', 'b_13'] };
    points[19] = { color: 'w', count: 3, checkers: ['w_8', 'w_9', 'w_10'] };
    points[20] = { color: 'w', count: 5, checkers: ['w_11', 'w_12', 'w_13', 'w_14', 'w_15'] };
    points[24] = { color: 'b', count: 2, checkers: ['b_14', 'b_15'] };

    return points;
  };

  const [points, setPoints] = useState<PointStack[]>(createInitialPoints);
  const [turn, setTurn] = useState<'w' | 'b'>('w'); // White starts
  const [dice, setDice] = useState<number[]>([3, 5]);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [barWhite, setBarWhite] = useState<number>(0);
  const [barBlack, setBarBlack] = useState<number>(0);
  const [offWhite, setOffWhite] = useState<number>(0);
  const [offBlack, setOffBlack] = useState<number>(0);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);
  const hasRecordedRef = React.useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      onGameEnd(winner, 'bearing_off_win');
    }
  }, [winner, onGameEnd]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setPoints(createInitialPoints());
    setTurn('w');
    setDice([3, 5]);
    setHasRolled(false);
    setSelectedPoint(null);
    setBarWhite(0);
    setBarBlack(0);
    setOffWhite(0);
    setOffBlack(0);
    setWinner(null);
  };

  const rollDice = () => {
    if (winner) return;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]);
    setHasRolled(true);
    setSelectedPoint(null);
  };

  const handlePointClick = (pointIdx: number) => {
    if (!hasRolled || winner) return;

    // Selection
    if (selectedPoint === null) {
      if (points[pointIdx].color === turn && points[pointIdx].checkers.length > 0) {
        setSelectedPoint(pointIdx);
      }
      return;
    }

    // Unselect if same
    if (selectedPoint === pointIdx) {
      setSelectedPoint(null);
      return;
    }

    // Try moving from selectedPoint to pointIdx
    const from = selectedPoint;
    const to = pointIdx;

    // Check direction: White moves 1 -> 24, Black moves 24 -> 1
    const dist = turn === 'w' ? to - from : from - to;

    if (dist > 0 && dice.includes(dist)) {
      const targetStack = points[to];

      // Blocked if target has 2 or more opponent checkers
      if (targetStack.color && targetStack.color !== turn && targetStack.checkers.length > 1) {
        setSelectedPoint(null);
        return;
      }

      const newPoints = points.map((p) => ({ ...p, checkers: [...p.checkers] }));
      const movedChecker = newPoints[from].checkers.pop();

      if (movedChecker) {
        newPoints[from].count = newPoints[from].checkers.length;
        newPoints[from].color = newPoints[from].count > 0 ? newPoints[from].color : null;

        // Hit opponent single checker
        if (targetStack.color && targetStack.color !== turn && targetStack.checkers.length === 1) {
          if (turn === 'w') setBarBlack((prev) => prev + 1);
          else setBarWhite((prev) => prev + 1);

          newPoints[to].checkers = [movedChecker];
          newPoints[to].count = 1;
          newPoints[to].color = turn;
        } else {
          // Normal move
          newPoints[to].checkers.push(movedChecker);
          newPoints[to].count = newPoints[to].checkers.length;
          newPoints[to].color = turn;
        }

        setPoints(newPoints);
        setSelectedPoint(null);

        // Remove used die
        const dieIndex = dice.indexOf(dist);
        if (dieIndex !== -1) {
          const remainingDice = [...dice];
          remainingDice.splice(dieIndex, 1);
          setDice(remainingDice);

          if (remainingDice.length === 0) {
            setHasRolled(false);
            setTurn((prev) => (prev === 'w' ? 'b' : 'w'));
          }
        }
      }
    } else {
      setSelectedPoint(null);
    }
  };

  // Automated AI turn execution for Black ('b') in Backgammon
  useEffect(() => {
    if (gameMode === 'ai' && turn === 'b' && !winner) {
      const timer = setTimeout(() => {
        // Step 1: Roll dice if AI hasn't rolled yet
        if (!hasRolled) {
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          setDice([d1, d2]);
          setHasRolled(true);
          return;
        }

        // Step 2: Execute moves with rolled dice
        if (dice.length > 0) {
          const currentDie = dice[0];
          let moved = false;
          const newPoints = points.map((p) => ({ ...p, checkers: [...p.checkers] }));

          // Black moves from point 24 down towards 1
          for (let from = 24; from >= currentDie; from--) {
            if (newPoints[from].color === 'b' && newPoints[from].checkers.length > 0) {
              const to = from - currentDie;
              const targetStack = newPoints[to];

              if (!targetStack.color || targetStack.color === 'b' || targetStack.checkers.length === 1) {
                const movedChecker = newPoints[from].checkers.pop();

                if (movedChecker) {
                  newPoints[from].count = newPoints[from].checkers.length;
                  newPoints[from].color = newPoints[from].count > 0 ? newPoints[from].color : null;

                  if (targetStack.color === 'w' && targetStack.checkers.length === 1) {
                    setBarWhite((prev) => prev + 1);
                    newPoints[to].checkers = [movedChecker];
                    newPoints[to].count = 1;
                    newPoints[to].color = 'b';
                  } else {
                    newPoints[to].checkers.push(movedChecker);
                    newPoints[to].count = newPoints[to].checkers.length;
                    newPoints[to].color = 'b';
                  }

                  setPoints(newPoints);
                  moved = true;
                  break;
                }
              }
            }
          }

          const remainingDice = dice.slice(1);
          setDice(remainingDice);

          if (remainingDice.length === 0 || !moved) {
            setHasRolled(false);
            setTurn('w');
          }
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, hasRolled, dice, winner, points]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[620px] mx-auto p-4 bg-[#100d14] border border-amber-500/30 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.9)] text-white font-sans">
      
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-black font-serif text-[#ffe89e]">Backgammon Arena</h2>
        </div>
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition border border-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Turn & Dice Controls */}
      <div className="w-full flex flex-wrap items-center justify-between bg-black/50 p-3 rounded-2xl border border-white/10 mb-4 gap-2 text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Turn:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border ${
              turn === 'w'
                ? 'bg-amber-100 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
            }`}
          >
            {turn === 'w' ? '⚪ White' : '🔴 Red/Black'}
          </span>
        </div>

        {/* Dice Roller */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-[10px]">Dice:</span>
            {dice.map((d, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md border border-amber-300"
              >
                {d}
              </span>
            ))}
          </div>

          <button
            onClick={rollDice}
            disabled={hasRolled && dice.length > 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-lg ${
              !hasRolled
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>{hasRolled ? 'Move Checkers' : 'Roll Dice'}</span>
          </button>
        </div>
      </div>

      {/* Backgammon Board Display */}
      <div className="relative w-full aspect-[4/3] bg-[#2a1b12] border-4 border-[#3e2717] rounded-2xl p-2 shadow-2xl flex flex-col justify-between overflow-hidden">
        
        {/* Top Half Points (13-24) */}
        <div className="grid grid-cols-12 gap-1 h-[42%] relative border-b border-amber-900/40 bg-[#1e130d] rounded-t-xl overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => {
            const pointNum = 13 + i;
            const stack = points[pointNum];
            const isSelected = selectedPoint === pointNum;
            const isEven = i % 2 === 0;

            return (
              <button
                key={pointNum}
                onClick={() => handlePointClick(pointNum)}
                className={`relative flex flex-col items-center pt-1 transition-all ${
                  isEven ? 'bg-[#4a3222]' : 'bg-[#2b1c12]'
                } ${isSelected ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="text-[9px] text-amber-200/50 font-mono mb-1">{pointNum}</div>
                {/* Stacked Checkers with Framer Motion Sliding Transition */}
                {stack.checkers && stack.checkers.length > 0 && (
                  <div className="flex flex-col gap-0.5 items-center">
                    {stack.checkers.slice(0, 5).map((chkId, cIdx) => (
                      <motion.div
                        key={chkId}
                        layoutId={chkId}
                        transition={{
                          type: 'spring',
                          stiffness: 340,
                          damping: 25,
                          mass: 0.8,
                        }}
                        whileHover={{ scale: 1.15 }}
                        className={`w-5 h-5 rounded-full border border-black/40 shadow-md flex items-center justify-center text-[10px] font-bold z-10 ${
                          stack.color === 'w'
                            ? 'bg-amber-100 text-slate-900 border-amber-300 shadow-amber-200/30'
                            : 'bg-red-600 text-white border-red-400 shadow-red-900/50'
                        }`}
                      >
                        {cIdx === 4 && stack.checkers.length > 5 ? `+${stack.checkers.length - 4}` : ''}
                      </motion.div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Center Bar & Division */}
        <div className="h-10 bg-[#180e09] border-y border-amber-900/60 flex items-center justify-between px-4 text-xs font-bold text-amber-300/80">
          <div className="flex items-center gap-2">
            <span>Bar White: {barWhite}</span>
            <span>|</span>
            <span>Bar Red: {barBlack}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span>Home Quadrant</span>
            <ArrowRight className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Bottom Half Points (12-1) */}
        <div className="grid grid-cols-12 gap-1 h-[42%] relative border-t border-amber-900/40 bg-[#1e130d] rounded-b-xl overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => {
            const pointNum = 12 - i;
            const stack = points[pointNum];
            const isSelected = selectedPoint === pointNum;
            const isEven = i % 2 === 0;

            return (
              <button
                key={pointNum}
                onClick={() => handlePointClick(pointNum)}
                className={`relative flex flex-col-reverse items-center pb-1 transition-all ${
                  isEven ? 'bg-[#2b1c12]' : 'bg-[#4a3222]'
                } ${isSelected ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="text-[9px] text-amber-200/50 font-mono mt-1">{pointNum}</div>
                {/* Stacked Checkers with Framer Motion Sliding Transition */}
                {stack.checkers && stack.checkers.length > 0 && (
                  <div className="flex flex-col-reverse gap-0.5 items-center">
                    {stack.checkers.slice(0, 5).map((chkId, cIdx) => (
                      <motion.div
                        key={chkId}
                        layoutId={chkId}
                        transition={{
                          type: 'spring',
                          stiffness: 340,
                          damping: 25,
                          mass: 0.8,
                        }}
                        whileHover={{ scale: 1.15 }}
                        className={`w-5 h-5 rounded-full border border-black/40 shadow-md flex items-center justify-center text-[10px] font-bold z-10 ${
                          stack.color === 'w'
                            ? 'bg-amber-100 text-slate-900 border-amber-300 shadow-amber-200/30'
                            : 'bg-red-600 text-white border-red-400 shadow-red-900/50'
                        }`}
                      >
                        {cIdx === 4 && stack.checkers.length > 5 ? `+${stack.checkers.length - 4}` : ''}
                      </motion.div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

      </div>

      <p className="text-[11px] text-gray-400 mt-3 text-center">
        Roll dice to make legal moves. Click on a point stack to select checkers, then click target point to advance!
      </p>
    </div>
  );
};
