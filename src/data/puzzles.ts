export interface ChessPuzzle {
  id: string;
  title: string;
  category: 'Mate in 1' | 'Mate in 2' | 'Fork' | 'Pin' | 'Discovered Attack' | 'Deflection';
  rating: number;
  fen: string; // starting position
  solution: string[]; // sequence of moves in SAN or from-to squares e.g. ["Qxf7#"] or ["d2d4", "e7e5"]
  solutionMoves: { from: string; to: string; promotion?: string }[];
  hint: string;
  explanation: string;
}

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    id: "p1",
    title: "Scholar's Mate Finish",
    category: "Mate in 1",
    rating: 800,
    fen: "r1bqkb1r/ppp2ppp/2n5/3np3/2B5/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 5",
    solution: ["Qxf7#"],
    solutionMoves: [{ from: "f3", to: "f7" }],
    hint: "Target the weak, undefended f7 square with your Queen.",
    explanation: "Qxf7# delivers checkmate because the Queen is guarded by the Bishop on c4 and the Black King has no escape squares."
  },
  {
    id: "p2",
    title: "Smothered Mate Tactical Beauty",
    category: "Mate in 1",
    rating: 1200,
    fen: "6rk/5Npp/8/8/8/8/8/7K w - - 0 1",
    solution: ["Nf7#"],
    solutionMoves: [{ from: "f7", to: "h6" }], // Already in smothered position or Nf7#
    hint: "Use your Knight to deliver checkmate to a trapped King.",
    explanation: "The Knight attacks the King on h8 while Black's own Rook and Pawns block every single flight square."
  },
  {
    id: "p3",
    title: "Back Rank Mate Threat",
    category: "Mate in 1",
    rating: 900,
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    solution: ["Rxd8#"],
    solutionMoves: [{ from: "d1", to: "d8" }],
    hint: "Infiltrate Black's vulnerable 8th rank.",
    explanation: "Rxd8# captures the Rook and delivers back-rank checkmate because Black's King is trapped behind its own pawns."
  },
  {
    id: "p4",
    title: "Royal Knight Fork",
    category: "Fork",
    rating: 1100,
    fen: "r1b1k2r/pppp1ppp/2n5/4p3/2B5/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
    solution: ["Ng5"],
    solutionMoves: [{ from: "f3", to: "g5" }],
    hint: "Attack two high-value targets simultaneously on f7.",
    explanation: "Ng5 threatens a deadly fork on f7 with double pressure from the Knight and c4 Bishop."
  },
  {
    id: "p5",
    title: "Queen & Bishop Battery Mate",
    category: "Mate in 1",
    rating: 950,
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1Q2/PPP2PPP/RNB1K1NR w KQkq - 1 5",
    solution: ["Qxf7#"],
    solutionMoves: [{ from: "f3", to: "f7" }],
    hint: "The classic f7 battery strike.",
    explanation: "Qxf7# ends the game immediately as the Bishop on c4 supports the Queen."
  },
  {
    id: "p6",
    title: "Anatomy of a Pin",
    category: "Pin",
    rating: 1050,
    fen: "r1bqk2r/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 4",
    solution: ["Nd5"],
    solutionMoves: [{ from: "c3", to: "d5" }],
    hint: "Centralize your Knight to exploit the pinned Black Bishop.",
    explanation: "Nd5 threatens the bishop and d7 pawn with central dominance."
  }
];
