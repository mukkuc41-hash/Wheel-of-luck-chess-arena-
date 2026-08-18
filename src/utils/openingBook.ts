export interface Opening {
  name: string;
  eco: string;
  moves: string[]; // sequence of SAN moves (e.g. ["e4", "c5"])
  description: string;
}

export const CHESS_OPENINGS: Opening[] = [
  {
    name: "Sicilian Defense",
    eco: "B20",
    moves: ["e4", "c5"],
    description: "An aggressive counter-attacking opening for Black fighting for central control on c5.",
  },
  {
    name: "Sicilian Defense: Najdorf Variation",
    eco: "B90",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    description: "One of the most complex and sharp variations favored by Fischer and Kasparov.",
  },
  {
    name: "French Defense",
    eco: "C00",
    moves: ["e4", "e6"],
    description: "A solid pawn structure for Black focusing on counter-attacking the White d4 pawn.",
  },
  {
    name: "Caro-Kann Defense",
    eco: "B10",
    moves: ["e4", "c6"],
    description: "An extremely resilient and structurally sound defense for Black.",
  },
  {
    name: "Ruy Lopez (Spanish Opening)",
    eco: "C60",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    description: "One of the oldest and most thoroughly studied classical openings in chess history.",
  },
  {
    name: "Italian Game",
    eco: "C50",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    description: "Focuses on rapid development and pressure on the vulnerable f7 square.",
  },
  {
    name: "Queen's Gambit",
    eco: "D06",
    moves: ["d4", "d5", "c4"],
    description: "White sacrifices a side pawn to dominate the center with d4 and e4.",
  },
  {
    name: "Queen's Gambit Accepted",
    eco: "D20",
    moves: ["d4", "d5", "c4", "dxc4"],
    description: "Black takes the c4 pawn, trading center control for fluid piece activity.",
  },
  {
    name: "King's Indian Defense",
    eco: "E60",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"],
    description: "A hypermodern defense where Black allows White central space then launches a fierce king-side attack.",
  },
  {
    name: "English Opening",
    eco: "A10",
    moves: ["c4"],
    description: "A flexible flank opening controlling the d5 square without committing the d or e pawns.",
  },
  {
    name: "Scandinavian Defense",
    eco: "B01",
    moves: ["e4", "d5"],
    description: "Directly strikes at White's central pawn on move 1.",
  },
  {
    name: "Nimzo-Indian Defense",
    eco: "E40",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    description: "Pins White's c3 knight to disrupt White's center pawns.",
  }
];

export function detectOpening(sanHistory: string[]): Opening | null {
  if (!sanHistory || sanHistory.length === 0) return null;

  let bestMatch: Opening | null = null;
  let maxMatchedMoves = 0;

  for (const opening of CHESS_OPENINGS) {
    if (sanHistory.length < opening.moves.length) continue;

    let match = true;
    for (let i = 0; i < opening.moves.length; i++) {
      if (sanHistory[i] !== opening.moves[i]) {
        match = false;
        break;
      }
    }

    if (match && opening.moves.length > maxMatchedMoves) {
      maxMatchedMoves = opening.moves.length;
      bestMatch = opening;
    }
  }

  return bestMatch;
}
