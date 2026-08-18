import React from 'react';
import { ChessPiece } from '../utils/chessPieces';

interface CapturedPiecesProps {
  capturedByWhite: ('p' | 'n' | 'b' | 'r' | 'q')[];
  capturedByBlack: ('p' | 'n' | 'b' | 'r' | 'q')[];
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  capturedByWhite,
  capturedByBlack,
}) => {
  const whiteScore = capturedByWhite.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackScore = capturedByBlack.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);

  const whiteAdvantage = whiteScore - blackScore;
  const blackAdvantage = blackScore - whiteScore;

  const sortPieces = (pieces: ('p' | 'n' | 'b' | 'r' | 'q')[]) => {
    const order = ['q', 'r', 'b', 'n', 'p'];
    return [...pieces].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  };

  return (
    <div className="w-full flex flex-col gap-2.5 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
      {/* Black's captures (White pieces taken by Black) */}
      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex flex-wrap items-center gap-0.5">
          {sortPieces(capturedByBlack).map((p, idx) => (
            <div key={`b-cap-${idx}`} className="w-5.5 h-5.5 opacity-90">
              <ChessPiece type={p} color="w" />
            </div>
          ))}
          {capturedByBlack.length === 0 && (
            <span className="text-xs text-white/30 font-sans italic">No captures yet</span>
          )}
        </div>
        {blackAdvantage > 0 && (
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(52,211,153,0.3)]">
            +{blackAdvantage}
          </span>
        )}
      </div>

      <div className="border-t border-white/10" />

      {/* White's captures (Black pieces taken by White) */}
      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex flex-wrap items-center gap-0.5">
          {sortPieces(capturedByWhite).map((p, idx) => (
            <div key={`w-cap-${idx}`} className="w-5.5 h-5.5 opacity-90">
              <ChessPiece type={p} color="b" />
            </div>
          ))}
          {capturedByWhite.length === 0 && (
            <span className="text-xs text-white/30 font-sans italic">No captures yet</span>
          )}
        </div>
        {whiteAdvantage > 0 && (
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(52,211,153,0.3)]">
            +{whiteAdvantage}
          </span>
        )}
      </div>
    </div>
  );
};
