import React from 'react';
import { EvalResult } from '../utils/evalEngine';

interface EvalBarProps {
  evalResult: EvalResult;
  orientation?: 'w' | 'b';
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalResult, orientation = 'w' }) => {
  const isWhiteBottom = orientation === 'w';
  
  // Bar percentages depending on orientation
  const topPercentage = isWhiteBottom ? 100 - evalResult.whitePercentage : evalResult.whitePercentage;
  const bottomPercentage = isWhiteBottom ? evalResult.whitePercentage : 100 - evalResult.whitePercentage;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 h-full py-1">
      {/* Evaluation Score Label */}
      <div className="text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-white/20 text-white shadow shadow-black">
        {evalResult.label}
      </div>

      {/* Advantage Bar Meter */}
      <div className="relative w-4 md:w-5 h-full min-h-[300px] max-h-[580px] bg-slate-900 border border-white/20 rounded-lg overflow-hidden flex flex-col shadow-lg shadow-black/50">
        {/* Top Half */}
        <div
          className={`w-full transition-all duration-300 ${
            isWhiteBottom ? 'bg-slate-900' : 'bg-white'
          }`}
          style={{ height: `${topPercentage}%` }}
        />

        {/* Divider line */}
        <div className="w-full h-0.5 bg-amber-400 z-10 shadow-[0_0_8px_#f59e0b]" />

        {/* Bottom Half */}
        <div
          className={`w-full transition-all duration-300 ${
            isWhiteBottom ? 'bg-white' : 'bg-slate-900'
          }`}
          style={{ height: `${bottomPercentage}%` }}
        />
      </div>
    </div>
  );
};
