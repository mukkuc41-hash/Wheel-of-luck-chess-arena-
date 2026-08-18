import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '../types';
import { Copy, Download, ChevronLeft, ChevronRight, SkipBack, SkipForward, Check } from 'lucide-react';

interface MoveHistoryProps {
  moves: MoveRecord[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
  pgn: string;
  fen: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
  pgn,
  fen,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedFen, setCopiedFen] = React.useState(false);
  const [copiedPgn, setCopiedPgn] = React.useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  // Group moves into pairs (1. White Black, 2. White Black)
  const pairedMoves: { number: number; white?: MoveRecord; whiteIdx?: number; black?: MoveRecord; blackIdx?: number }[] = [];

  moves.forEach((m, idx) => {
    if (m.color === 'w') {
      pairedMoves.push({
        number: m.moveNumber,
        white: m,
        whiteIdx: idx,
      });
    } else {
      if (pairedMoves.length > 0 && pairedMoves[pairedMoves.length - 1].number === m.moveNumber) {
        pairedMoves[pairedMoves.length - 1].black = m;
        pairedMoves[pairedMoves.length - 1].blackIdx = idx;
      } else {
        pairedMoves.push({
          number: m.moveNumber,
          black: m,
          blackIdx: idx,
        });
      }
    }
  });

  const copyToClipboard = (text: string, type: 'fen' | 'pgn') => {
    navigator.clipboard.writeText(text);
    if (type === 'fen') {
      setCopiedFen(true);
      setTimeout(() => setCopiedFen(false), 2000);
    } else {
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    }
  };

  const downloadPgn = () => {
    const element = document.createElement('a');
    const file = new Blob([pgn], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `chess_game_${new Date().toISOString().slice(0, 10)}.pgn`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      {/* Move History Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Move History</h3>
        <span className="text-[10px] font-mono text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          {moves.length} {moves.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {/* Move Navigation Bar */}
      <div className="px-3 py-2 bg-black/20 border-b border-white/5 flex items-center justify-center gap-1">
        <button
          onClick={() => onSelectMove(-1)}
          disabled={currentMoveIndex === -1}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition"
          title="Start of Game"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
          disabled={currentMoveIndex === -1}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition"
          title="Previous Move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
          disabled={currentMoveIndex >= moves.length - 1}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition"
          title="Next Move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(moves.length - 1)}
          disabled={currentMoveIndex >= moves.length - 1}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition"
          title="Current Position"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Move Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-[140px] max-h-[220px] p-2 space-y-1">
        {pairedMoves.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-white/30 italic py-6">
            Make a move to begin
          </div>
        ) : (
          pairedMoves.map((pair) => (
            <div key={pair.number} className="grid grid-cols-[36px_1fr_1fr] text-xs items-center gap-1">
              <span className="font-mono text-indigo-300/60 font-medium pl-1">
                {pair.number}.
              </span>
              
              {/* White move */}
              {pair.white ? (
                <button
                  onClick={() => pair.whiteIdx !== undefined && onSelectMove(pair.whiteIdx)}
                  className={`text-left px-2.5 py-1 rounded-lg font-mono transition ${
                    currentMoveIndex === pair.whiteIdx
                      ? 'bg-indigo-500/25 text-indigo-200 font-bold border border-indigo-400/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  {pair.white.san}
                </button>
              ) : (
                <div />
              )}

              {/* Black move */}
              {pair.black ? (
                <button
                  onClick={() => pair.blackIdx !== undefined && onSelectMove(pair.blackIdx)}
                  className={`text-left px-2.5 py-1 rounded-lg font-mono transition ${
                    currentMoveIndex === pair.blackIdx
                      ? 'bg-indigo-500/25 text-indigo-200 font-bold border border-indigo-400/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  {pair.black.san}
                </button>
              ) : (
                <div />
              )}
            </div>
          ))
        )}
      </div>

      {/* Export / Copy Options */}
      <div className="p-2.5 bg-black/30 border-t border-white/10 flex items-center justify-between text-xs gap-2">
        <button
          onClick={() => copyToClipboard(fen, 'fen')}
          className="flex items-center gap-1 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
        >
          {copiedFen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy FEN</span>
        </button>

        <button
          onClick={() => copyToClipboard(pgn, 'pgn')}
          className="flex items-center gap-1 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
        >
          {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy PGN</span>
        </button>

        <button
          onClick={downloadPgn}
          className="flex items-center gap-1 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
