import React, { useEffect } from 'react';
import { PlayerInfo } from '../types';
import { Clock, Pause, Play } from 'lucide-react';

interface ChessClockProps {
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  activeTurn: 'w' | 'b';
  isGameActive: boolean;
  isPaused: boolean;
  isUntimed: boolean;
  onTimeout: (loserColor: 'w' | 'b') => void;
  onTogglePause?: () => void;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  whitePlayer,
  blackPlayer,
  whiteTime,
  blackTime,
  activeTurn,
  isGameActive,
  isPaused,
  isUntimed,
  onTimeout,
  onTogglePause,
}) => {
  useEffect(() => {
    if (isUntimed || !isGameActive || isPaused) return;

    if (whiteTime <= 0) {
      onTimeout('w');
      return;
    }
    if (blackTime <= 0) {
      onTimeout('b');
      return;
    }
  }, [whiteTime, blackTime, isGameActive, isPaused, isUntimed, onTimeout]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (seconds < 10) {
      return `${pad(secs)}.${tenths}`;
    }

    return `${pad(mins)}:${pad(secs)}`;
  };

  const ClockBox = ({
    player,
    time,
    color,
  }: {
    player: PlayerInfo;
    time: number;
    color: 'w' | 'b';
  }) => {
    const isActive = activeTurn === color && isGameActive && !isPaused;
    const isLowTime = time < 30 && !isUntimed;
    const isWhite = color === 'w';

    return (
      <div
        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
          isActive
            ? 'bg-white/10 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${
                isWhite
                  ? 'bg-slate-100 text-slate-900 border-white/40 shadow-sm'
                  : 'bg-slate-900 text-slate-100 border-white/20'
              }`}
            >
              {player.avatar || (isWhite ? '♔' : '♚')}
            </div>
            {isActive && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>{player.name}</span>
            </div>
            <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest">
              {isWhite ? 'White Pieces' : 'Black Pieces'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isUntimed ? (
            <div
              className={`font-mono text-xl md:text-2xl font-bold px-4 py-2 rounded-xl transition-all ${
                isLowTime
                  ? 'text-red-300 bg-red-500/20 border border-red-400/50 animate-pulse'
                  : isActive
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/50'
                  : 'bg-white/10 text-white/50 border border-white/5'
              }`}
            >
              {formatTime(time)}
            </div>
          ) : (
            <div className="text-xs font-medium text-indigo-200 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Untimed</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      <ClockBox player={blackPlayer} time={blackTime} color="b" />
      
      {onTogglePause && !isUntimed && isGameActive && (
        <div className="flex justify-center my-1">
          <button
            onClick={onTogglePause}
            className="text-xs font-medium bg-white/5 hover:bg-white/10 text-indigo-200 px-3.5 py-1.5 rounded-full border border-white/10 transition flex items-center gap-1.5 backdrop-blur-md"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Resume Clocks</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Pause Clocks</span>
              </>
            )}
          </button>
        </div>
      )}

      <ClockBox player={whitePlayer} time={whiteTime} color="w" />
    </div>
  );
};
