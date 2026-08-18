import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { CHESS_PUZZLES, ChessPuzzle } from '../data/puzzles';
import { ChessBoard } from './ChessBoard';
import { Trophy, Lightbulb, CheckCircle2, XCircle, ArrowRight, Sparkles, RefreshCw, X, Flame } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { ActiveBoardGame } from '../types';

interface PuzzleModalProps {
  activeBoardGame?: ActiveBoardGame;
  isOpen: boolean;
  onClose: () => void;
}

interface GenericPuzzle {
  id: string;
  game: ActiveBoardGame;
  title: string;
  category: string;
  objective: string;
  solution: string;
  explanation: string;
}

const GAME_PUZZLES: Record<ActiveBoardGame, GenericPuzzle[]> = {
  chess: [
    {
      id: 'c1',
      game: 'chess',
      title: 'Queen Back-Rank Checkmate',
      category: 'Mate in 1',
      objective: 'Find the mating move with the White Queen.',
      solution: 'Qd8#',
      explanation: 'Delivers back-rank checkmate as the enemy king is trapped by its own pawns.',
    },
    {
      id: 'c2',
      game: 'chess',
      title: 'Knight Fork Attack',
      category: 'Tactical Fork',
      objective: 'Fork the King and Heavy Rook.',
      solution: 'Nxc7+',
      explanation: 'Nxc7+ gives a royal fork capturing the rook on the next turn.',
    },
  ],
  checkers: [
    {
      id: 'chk1',
      game: 'checkers',
      title: 'Triple Crown Jump',
      category: 'Multi-Jump Capture',
      objective: 'Execute a forced 3-piece jump sequence to reach the back rank.',
      solution: 'Jump C3 -> E5 -> G7 -> E9 (Kinged!)',
      explanation: 'Overlaps two unprotected single checkers to sweep the board and crown a King disc.',
    },
    {
      id: 'chk2',
      game: 'checkers',
      title: 'Backline Trap Defense',
      category: 'Endgame Blockade',
      objective: 'Trap the opponent king on the corner square.',
      solution: 'Advance B2 to A3',
      explanation: 'Locks the enemy king into the double-corner trap with no legal escape squares.',
    },
  ],
  backgammon: [
    {
      id: 'bg1',
      game: 'backgammon',
      title: '6-Point Prime Wall Building',
      category: 'Blockade Tactics',
      objective: 'Construct a full 6-point prime to wall off opponent checkers on the bar.',
      solution: 'Move 13/7, 8/7 to close the 7-Point',
      explanation: 'A 6-point prime makes it mathematically impossible for opponent checkers on the bar to leap over.',
    },
    {
      id: 'bg2',
      game: 'backgammon',
      title: 'Optimal Bearing-Off Distribution',
      category: 'Endgame Bearing-Off',
      objective: 'Safely bear off 2 checkers without leaving a vulnerable blot.',
      solution: 'Bear off from 6-point and 5-point',
      explanation: 'Clears the highest points while leaving lower points protected against hits.',
    },
  ],
  snakes: [
    {
      id: 'snk1',
      game: 'snakes',
      title: 'Tile 80 Ladder Leap Quest',
      category: 'Daily Roll Quest',
      objective: 'Calculate roll probabilities to hit the super ladder at tile 80.',
      solution: 'Roll 4 from Tile 76',
      explanation: 'Hitting tile 80 instantly leaps your pawn directly to tile 98 near the finish line!',
    },
    {
      id: 'snk2',
      game: 'snakes',
      title: 'Snake Bypass Navigation',
      category: 'Risk Mitigation',
      objective: 'Avoid the monster snake at tile 99.',
      solution: 'Aim for exact roll of 1 from tile 99 target zone',
      explanation: 'Landing on tile 100 requires an exact roll to win without sliding down tile 99.',
    },
  ],
  ludo: [
    {
      id: 'ld1',
      game: 'ludo',
      title: 'Double Token Blockade',
      category: 'Safe Star Strategy',
      objective: 'Form a 2-token blockade on the Red Safe Star square.',
      solution: 'Land second Red token on Star tile 48',
      explanation: 'Two tokens of the same color on a single tile create an impassable blockade for opponent tokens.',
    },
    {
      id: 'ld2',
      game: 'ludo',
      title: 'Home Corridor Sprint',
      category: 'Yard Release',
      objective: 'Advance 4th token into Home Triangle.',
      solution: 'Roll exact 6 from Yard, advance into Home corridor',
      explanation: 'Secures your final token into the home triangle zone to trigger victory!',
    },
  ],
  gomoku: [
    {
      id: 'gom1',
      game: 'gomoku',
      title: 'Open-Four Winning Sequence',
      category: 'Five in a Row',
      objective: 'Place stone at intersection to create an Open Four.',
      solution: 'Place stone at Row 8, Col 8',
      explanation: 'Creates an Open Four bounded by no opposing stones on either side.',
    },
  ],
  reversi: [
    {
      id: 'rev1',
      game: 'reversi',
      title: 'Corner Lock Blitz',
      category: 'Corner Control',
      objective: 'Capture top-left corner A1.',
      solution: 'Move to A1',
      explanation: 'Corner pieces are permanently stable and can never be flipped back.',
    },
  ],
  connect4: [
    {
      id: 'c4_1',
      game: 'connect4',
      title: '7-Column Double Threat',
      category: 'Gravity Alignment',
      objective: 'Drop yellow disc into Column 4.',
      solution: 'Drop in Column 4',
      explanation: 'Creates a simultaneous horizontal and diagonal threat that opponent cannot block.',
    },
  ],
  ultimatetictactoe: [
    {
      id: 'ut1',
      game: 'ultimatetictactoe',
      title: 'Super-Grid Routing Trap',
      category: 'Grid Control',
      objective: 'Force opponent into filled mini-board.',
      solution: 'Mark center cell in Mini-Board 5',
      explanation: 'Forces opponent to play in Mini-Board 5, allowing you to choose any open space next.',
    },
  ],
  dotsandboxes: [
    {
      id: 'db1',
      game: 'dotsandboxes',
      title: 'Double-Cross Chain Sacrifice',
      category: 'Chain Tactics',
      objective: 'Close 4th line of 2-box chain.',
      solution: 'Draw bottom line on Box 3',
      explanation: 'Completes box and awards immediate bonus turn to claim next 3 boxes.',
    },
  ],
  battleship: [
    {
      id: 'bs1',
      game: 'battleship',
      title: 'Carrier Sink Final Shot',
      category: 'Naval Radar',
      objective: 'Call final coordinate shot on 5-length Carrier.',
      solution: 'Fire at Coordinate D-7',
      explanation: 'Sinks opponent Carrier and secures victory.',
    },
  ],
  sim: [
    {
      id: 'sim1',
      game: 'sim',
      title: 'Triangle Misère Defense',
      category: 'Graph Theory',
      objective: 'Draw edge without forming a 3-vertex triangle.',
      solution: 'Connect Vertex 2 to Vertex 5',
      explanation: 'Avoids creating a same-color triangle while forcing opponent into a loss.',
    },
  ],
  uno: [
    {
      id: 'uno1',
      game: 'uno',
      title: 'Wild +4 Victory Sprint',
      category: 'Action Card Blitz',
      objective: 'Play Wild +4 card on yellow discard.',
      solution: 'Play Wild +4 and switch active color to Blue',
      explanation: 'Forces opponent to draw 4 cards and empties your hand for UNO victory!',
    },
  ],
  hearts: [
    {
      id: 'hrt1',
      game: 'hearts',
      title: 'Shoot the Moon Finale',
      category: 'Trick Taking',
      objective: 'Take final Heart trick to achieve 26-point Shoot the Moon.',
      solution: 'Play Ace of Hearts on final trick',
      explanation: 'Claims all 13 hearts and QS, giving 0 pts to you and 26 penalty pts to opponents!',
    },
  ],
  ginrummy: [
    {
      id: 'gin1',
      game: 'ginrummy',
      title: 'Zero-Deadwood GIN Knock',
      category: 'Meld Building',
      objective: 'Meld 10 cards into 3 Sets and 1 Run.',
      solution: 'Discard 10 of Clubs and call GIN!',
      explanation: 'Reduces deadwood to 0 for a +35 point GIN bonus.',
    },
  ],
  speed: [
    {
      id: 'spd1',
      game: 'speed',
      title: 'Dual-Pile Blitz Clear',
      category: 'Reflex Speed',
      objective: 'Play King on Ace and 2 on 3 simultaneously.',
      solution: 'Play King to Pile 1, 2 to Pile 2',
      explanation: 'Clears final hand cards instantly to win the Speed race!',
    },
  ],
};

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ activeBoardGame = 'chess', isOpen, onClose }) => {
  const [selectedGame, setSelectedGame] = useState<ActiveBoardGame>(activeBoardGame);
  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [status, setStatus] = useState<'playing' | 'success' | 'failed'>('playing');
  const [geminiExplanation, setGeminiExplanation] = useState<string | null>(null);
  const [loadingGemini, setLoadingGemini] = useState<boolean>(false);

  useEffect(() => {
    setSelectedGame(activeBoardGame);
  }, [activeBoardGame]);

  const currentChessPuzzle: ChessPuzzle = CHESS_PUZZLES[puzzleIndex % CHESS_PUZZLES.length];
  const genericPuzzles = GAME_PUZZLES[selectedGame] || GAME_PUZZLES.chess;
  const currentGenericPuzzle = genericPuzzles[puzzleIndex % genericPuzzles.length];

  const chessRef = useRef<Chess>(new Chess(currentChessPuzzle.fen));
  const [fen, setFen] = useState<string>(currentChessPuzzle.fen);

  useEffect(() => {
    if (isOpen) {
      if (selectedGame === 'chess') {
        chessRef.current = new Chess(currentChessPuzzle.fen);
        setFen(currentChessPuzzle.fen);
      }
      setStatus('playing');
      setShowHint(false);
      setGeminiExplanation(null);
    }
  }, [isOpen, puzzleIndex, selectedGame]);

  if (!isOpen) return null;

  const handlePuzzleMove = (from: Square, to: Square, promotionPiece?: string) => {
    if (status !== 'playing') return;

    try {
      const targetSolution = currentChessPuzzle.solutionMoves[0];
      const isCorrect = targetSolution.from === from && targetSolution.to === to;

      const moveRes = chessRef.current.move({
        from,
        to,
        promotion: promotionPiece || 'q',
      });

      if (!moveRes) return;
      setFen(chessRef.current.fen());

      if (isCorrect) {
        soundFx.playGameOver(true);
        setStatus('success');
        setStreak((prev) => prev + 1);
      } else {
        soundFx.playGameOver(false);
        setStatus('failed');
      }
    } catch {
      // Invalid move
    }
  };

  const handleSolveGeneric = () => {
    soundFx.playGameOver(true);
    setStatus('success');
    setStreak((prev) => prev + 1);
  };

  const handleNextPuzzle = () => {
    setPuzzleIndex((prev) => prev + 1);
  };

  const handleFetchGeminiExplanation = async () => {
    setLoadingGemini(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeGame: selectedGame,
          fen: selectedGame === 'chess' ? currentChessPuzzle.fen : 'standard',
          question: `Explain tactical strategy for ${
            selectedGame === 'chess' ? currentChessPuzzle.title : currentGenericPuzzle.title
          }.`,
        }),
      });
      const data = await res.json();
      setGeminiExplanation(
        data.analysis ||
          (selectedGame === 'chess' ? currentChessPuzzle.explanation : currentGenericPuzzle.explanation)
      );
    } catch {
      setGeminiExplanation(
        selectedGame === 'chess' ? currentChessPuzzle.explanation : currentGenericPuzzle.explanation
      );
    } finally {
      setLoadingGemini(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-900/40 via-slate-900 to-indigo-900/40 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Tactical Puzzles & Daily Quests</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> Streak: {streak}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Active Game Category: <span className="text-amber-300 font-bold capitalize">{selectedGame}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Tabs */}
        <div className="px-6 py-2.5 bg-black/50 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          {(['chess', 'checkers', 'backgammon', 'snakes', 'ludo'] as ActiveBoardGame[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                setSelectedGame(g);
                setPuzzleIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 capitalize whitespace-nowrap ${
                selectedGame === g
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span>{g === 'chess' ? '♔' : g === 'checkers' ? '👑' : g === 'backgammon' ? '🎲' : g === 'snakes' ? '🐍' : '🎯'}</span>
              <span>{g === 'checkers' ? 'Draughts' : g === 'snakes' ? 'Snakes & Ladders' : g}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-center">
          {selectedGame === 'chess' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-1">
                <span>{currentChessPuzzle.title}</span>
                <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-400/20">
                  {currentChessPuzzle.category}
                </span>
              </div>
              <ChessBoard
                chess={chessRef.current}
                orientation={chessRef.current.turn()}
                boardTheme="emerald"
                onMove={handlePuzzleMove}
                readOnly={status !== 'playing'}
              />
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 text-center">
              <div className="text-4xl">
                {selectedGame === 'checkers' ? '👑' : selectedGame === 'backgammon' ? '🎲' : selectedGame === 'snakes' ? '🐍' : '🎯'}
              </div>
              <h3 className="text-lg font-black text-amber-300">{currentGenericPuzzle.title}</h3>
              <p className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 px-3 py-1 rounded-full inline-block font-mono">
                {currentGenericPuzzle.category}
              </p>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-gray-300 leading-relaxed text-left">
                <span className="text-amber-400 font-bold block mb-1">Tactical Challenge Goal:</span>
                {currentGenericPuzzle.objective}
              </div>

              {status === 'playing' && (
                <button
                  onClick={handleSolveGeneric}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg transition"
                >
                  Execute Tactical Solution
                </button>
              )}
            </div>
          )}

          {/* Puzzle Info & Feedback Sidebar */}
          <div className="flex flex-col gap-4 justify-between h-full bg-slate-950/60 p-5 rounded-2xl border border-white/10">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Tactical Objective</p>
                <p className="text-sm font-bold text-white">
                  {selectedGame === 'chess'
                    ? `Find the winning move for ${chessRef.current.turn() === 'w' ? 'White ♔' : 'Black ♚'}!`
                    : currentGenericPuzzle.objective}
                </p>
              </div>

              {/* Success / Failure Banner */}
              {status === 'success' && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Puzzle Solved!</span>
                  </div>
                  <p>
                    {selectedGame === 'chess'
                      ? currentChessPuzzle.explanation
                      : currentGenericPuzzle.explanation}
                  </p>
                </div>
              )}

              {status === 'failed' && (
                <div className="p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-xs space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-300">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Incorrect Move</span>
                  </div>
                  <p>Try again or reveal the hint!</p>
                  <button
                    onClick={() => {
                      if (selectedGame === 'chess') {
                        chessRef.current = new Chess(currentChessPuzzle.fen);
                        setFen(currentChessPuzzle.fen);
                      }
                      setStatus('playing');
                    }}
                    className="mt-2 text-xs font-bold text-white bg-red-500/30 hover:bg-red-500/50 px-3 py-1.5 rounded-lg border border-red-400/30 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Position
                  </button>
                </div>
              )}

              {/* Hint Section */}
              {showHint && (
                <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    {selectedGame === 'chess'
                      ? currentChessPuzzle.hint
                      : `Solution: ${currentGenericPuzzle.solution}`}
                  </p>
                </div>
              )}

              {/* Gemini Explanation */}
              {geminiExplanation && (
                <div className="p-3 bg-purple-500/10 border border-purple-400/30 rounded-xl text-purple-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini Analysis:
                  </p>
                  <p className="leading-relaxed">{geminiExplanation}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!showHint && status === 'playing' && (
                <button
                  onClick={() => setShowHint(true)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Show Hint
                </button>
              )}

              {status === 'success' && !geminiExplanation && (
                <button
                  onClick={handleFetchGeminiExplanation}
                  disabled={loadingGemini}
                  className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 font-semibold text-xs rounded-xl border border-purple-400/30 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>{loadingGemini ? 'Asking Gemini...' : 'Ask Gemini for Deep Explanation'}</span>
                </button>
              )}

              <button
                onClick={handleNextPuzzle}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
              >
                <span>Next Tactical Quest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

