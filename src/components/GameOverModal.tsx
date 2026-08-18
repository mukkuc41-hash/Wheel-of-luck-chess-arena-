import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, PlayerInfo } from '../types';
import { Trophy, RefreshCw, Eye, ShieldAlert, Share2, AlertTriangle, Flame } from 'lucide-react';
import { ShareProgressModal } from './ShareProgressModal';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';
import { getSeriesState, getUserPoints } from '../utils/pointsManager';

interface GameOverModalProps {
  result: GameResult;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  moveCount: number;
  onNewGame: () => void;
  onReviewBoard: () => void;
  isPlayerLoss?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  whitePlayer,
  blackPlayer,
  moveCount,
  onNewGame,
  onReviewBoard,
  isPlayerLoss,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [seriesState, setSeriesState] = useState(() => getSeriesState());
  const [currentScore, setCurrentScore] = useState(() => getUserPoints());

  useEffect(() => {
    setSeriesState(getSeriesState());
    setCurrentScore(getUserPoints());
  }, [result]);

  useEffect(() => {
    if (result.winner && result.winner !== 'draw' && !isPlayerLoss) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [result, isPlayerLoss]);

  const winnerPlayer =
    result.winner === 'w' ? whitePlayer : result.winner === 'b' ? blackPlayer : null;

  const didUserLose = Boolean(isPlayerLoss);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
        <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80 max-w-md w-full text-center relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              didUserLose
                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_0_15px_#ef4444]'
                : result.winner === 'draw'
                ? 'bg-slate-400 shadow-[0_0_10px_#94a3b8]'
                : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'
            }`}
          />

          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-lg backdrop-blur-md ${
            didUserLose 
              ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
              : result.winner === 'draw' 
              ? 'bg-white/5 border-white/10 text-indigo-300' 
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-bounce'
          }`}>
            {didUserLose ? (
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            ) : result.winner === 'draw' ? (
              <ShieldAlert className="w-8 h-8 text-indigo-300" />
            ) : (
              <Trophy className="w-8 h-8 text-indigo-400" />
            )}
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight flex items-center justify-center gap-2 flex-wrap">
            {result.winner === 'draw' ? (
              'Draw Game'
            ) : didUserLose ? (
              <span className="text-red-400 font-extrabold">Defeat / Game Over</span>
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

          <p className="text-sm font-medium text-indigo-200/70 mb-4">
            {result.winner === 'draw'
              ? `Game drawn ${getReasonText()}`
              : `${winnerPlayer?.name ? winnerPlayer.name + ' won ' : 'Concluded '}${getReasonText()}`}
          </p>

          {/* 10,000 PTS LOSS PENALTY BANNER */}
          {didUserLose && (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-rose-950/70 to-slate-950/90 border border-red-500/50 text-left shadow-lg shadow-red-950/50 animate-shake">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-red-400 font-black text-xs uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>Loss Penalty Applied</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-xs font-black border border-red-500/40">
                  -10,000 PTS
                </span>
              </div>
              <p className="text-[11px] text-red-200/80 leading-relaxed font-medium">
                10,000 points were deducted from your balance in accordance with the 16-Game Series Engine.
              </p>
              <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px] font-mono">
                <span className="text-red-300/80">Series: Game {Math.min(seriesState.gamesPlayed, 16)}/16</span>
                <span className="text-amber-300 font-bold">Wallet: {currentScore.toLocaleString()} PTS</span>
              </div>
            </div>
          )}

          {/* Game Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 text-left backdrop-blur-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">Total Moves</span>
              <span className="text-sm font-bold text-white">{moveCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">Game Status</span>
              <span className={`text-sm font-bold ${didUserLose ? 'text-rose-400' : 'text-emerald-300'}`}>
                {didUserLose ? 'Penalty Applied' : 'Match Completed'}
              </span>
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
