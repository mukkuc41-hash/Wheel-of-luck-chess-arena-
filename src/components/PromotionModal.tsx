import React from 'react';
import { ChessPiece } from '../utils/chessPieces';

interface PromotionModalProps {
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect }) => {
  const pieces: { type: 'q' | 'r' | 'b' | 'n'; label: string }[] = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/80 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl shadow-black/80 max-w-sm w-full text-center">
        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Pawn Promotion</h3>
        <p className="text-xs text-indigo-200/70 mb-5">Select a piece to promote your pawn:</p>

        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-indigo-500/25 border border-white/10 hover:border-indigo-400/60 transition-all transform hover:-translate-y-1 backdrop-blur-md group shadow-md"
            >
              <div className="w-12 h-12 mb-1">
                <ChessPiece type={p.type} color={color} />
              </div>
              <span className="text-[10px] font-bold text-white/70 group-hover:text-indigo-200 uppercase tracking-wider">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
