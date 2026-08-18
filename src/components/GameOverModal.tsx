import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, PlayerInfo } from '../types';
import { Trophy, RefreshCw, Eye, ShieldAlert, Share2 } from 'lucide-react';
import { ShareProgressModal } from './ShareProgressModal';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface GameOverModalProps {
  result: GameResult;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  moveCount: number;
  onNewGame: () => void;
  onReviewBoard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  whitePlayer,
  blackPlayer,
  moveCount,
  onNewGame,
  onReviewBoard,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (result.winner && result.winner !== 'draw') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [result]);

  const winnerPlayer =
    result.winner === 'w' ? whitePlayer : result.winner === 'b' ? blackPlayer : null;

  const getReasonText = () => {
    switch (result.reason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'timeout':
        return 'on Time';
      case 'resignation':
        return 'by Resignation';
      case 'stalemate':
        return 'by Stalemate';
      case 'threefold':
        return 'by Threefold Repetition';
      case 'insufficient':
        return 'by Insufficient Material';
      case 'agreement':
        return 'by Mutual Agreement';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-fadeIn">
        <div className="bg-slate-950/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80 max-w-md w-full text-center relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              result.winner === 'draw'
                ? 'bg-slate-400 shadow-[0_0_10px_#94a3b8]'
                : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'
            }`}
          />

          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
            {result.winner === 'draw' ? (
              <ShieldAlert className="w-8 h-8 text-indigo-300" />
            ) : (
              <Trophy className="w-8 h-8 text-indigo-400 animate-bounce" />
            )}
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight flex items-center justify-center gap-2 flex-wrap">
            {result.winner === 'draw' ? (
              'Draw Game'
            ) : (
              <>
                <span className={isSiteOwner(winnerPlayer?.name) ? 'text-amber-300 font-extrabold' : 'text-indigo-300'}>
                  {winnerPlayer?.name} Wins!
                </span>
                {isSiteOwner(winnerPlayer?.name) && (
                  <OwnerBadge username={winnerPlayer?.name} size="xs" label="OWNER" />
                )}
              </>
            )}
          </h2>

          <p className="text-sm font-medium text-indigo-200/70 mb-6">
            {result.winner === 'draw'
              ? `Game drawn ${getReasonText()}`
              : `Victory ${getReasonText()}`}
          </p>

          {/* Game Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 text-left backdrop-blur-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">Total Moves</span>
              <span className="text-sm font-bold text-white">{moveCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">Game Status</span>
              <span className="text-sm font-bold text-emerald-300">Match Completed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setIsShareOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 border border-indigo-400/50"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Game Result &amp; Progress</span>
            </button>

            <button
              onClick={onNewGame}
              className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              onClick={onReviewBoard}
              className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <Eye className="w-4 h-4" />
              <span>Review Game Board</span>
            </button>
          </div>
        </div>
      </div>

      <ShareProgressModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        moveCount={moveCount}
        gameResult={result}
      />
    </>
  );
};
