import React from 'react';
import { BookOpen, X, Check, ShieldAlert, Sparkles, Dices, Award } from 'lucide-react';
import { ActiveBoardGame } from '../types';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: ActiveBoardGame;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  isOpen,
  onClose,
  activeGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-[#11131e] border border-[#f3ce6b]/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-amber-950/50 via-purple-950/40 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif text-[#ffe89e] capitalize">
                {activeGame} Rules &amp; Guide
              </h2>
              <p className="text-xs text-gray-400">Official turn mechanics &amp; win conditions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-300 leading-relaxed custom-scrollbar">
          {activeGame === 'chess' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                Objective: Checkmate the opponent's King so it cannot escape capture!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Pawns move 1 square forward (or 2 on initial move), capture diagonally.</li>
                <li>• Knights move in L-shapes and can jump over other pieces.</li>
                <li>• Bishops move diagonally; Rooks move horizontally &amp; vertically; Queens move both.</li>
                <li>• Special rules: Castling, En Passant captures, and Pawn Promotion on the 8th rank.</li>
              </ul>
            </div>
          )}

          {activeGame === 'checkers' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-2xl text-red-200 font-bold">
                Objective: Capture all opposing checkers or block opponent from making moves!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Regular checkers move forward 1 square diagonally on dark squares.</li>
                <li>• Jump over adjacent opposing pieces into empty squares to capture them.</li>
                <li>• Captures are mandatory and multi-jumps must be completed in a single turn.</li>
                <li>• Reaching the back row promotes a checker to a King, enabling backward diagonal movement.</li>
              </ul>
            </div>
          )}

          {activeGame === 'backgammon' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-400/30 rounded-2xl text-indigo-200 font-bold">
                Objective: Race all 15 checkers into your Home board and bear them off first!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Roll two 6-sided dice to move checkers along 24 triangular points.</li>
                <li>• Rolling doubles grants 4 moves of that face value.</li>
                <li>• Landing on a single opposing checker ("blot") sends it to the central Bar.</li>
                <li>• Checkers on the Bar must re-enter opponent's home board before any other move.</li>
              </ul>
            </div>
          )}

          {activeGame === 'ludo' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl text-blue-200 font-bold">
                Objective: Move all 4 tokens from Yard, around the track, into central Home!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Roll a 6 on die to exit token from Yard onto starting square (and get extra roll).</li>
                <li>• Move tokens clockwise along track according to die face.</li>
                <li>• Landing on opponent token captures it and sends it back to Yard!</li>
                <li>• Exact roll required to land inside central Home triangle.</li>
              </ul>
            </div>
          )}

          {activeGame === 'snakes' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl text-emerald-200 font-bold">
                Objective: Race from square 1 to square 100 on the grid!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Roll 6-sided die to advance your token forward.</li>
                <li>• Land on the bottom of a Ladder to climb directly to its top!</li>
                <li>• Land on a Snake's head to slide down to its tail.</li>
                <li>• First to land on square 100 with exact roll wins.</li>
              </ul>
            </div>
          )}

          {activeGame === 'gomoku' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                Objective: Align 5 unbroken stones horizontally, vertically, or diagonally!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Black moves first, placing 1 stone on any open grid intersection on a 15x15 board.</li>
                <li>• White follows, alternating turns.</li>
                <li>• Placed stones are permanent and cannot be moved or captured.</li>
                <li>• First player to align 5 unbroken stones in a row wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'reversi' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl text-emerald-200 font-bold">
                Objective: Outflank opposing pieces to flip them to your color!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 8x8 grid starts with 4 central pieces (2 Dark, 2 Light).</li>
                <li>• Valid move MUST outflank 1+ opposing pieces in a straight line bounded by own piece.</li>
                <li>• Outflanked pieces are instantly flipped to your color.</li>
                <li>• Turn passes if no valid move exists. Player with most pieces when board fills wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'connect4' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl text-blue-200 font-bold">
                Objective: Align 4 colored discs in a row before your opponent!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 7-column x 6-row vertical grid with gravity physics.</li>
                <li>• Click a column to drop a disc into the lowest open slot.</li>
                <li>• Check for 4 discs in a row horizontally, vertically, or diagonally.</li>
                <li>• First to connect 4 wins the match!</li>
              </ul>
            </div>
          )}

          {activeGame === 'ultimatetictactoe' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-400/30 rounded-2xl text-indigo-200 font-bold">
                Objective: Claim 3 mini-boards in a row across the main 3x3 grid!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 3x3 main board containing 9 sub-boards (3x3 each).</li>
                <li>• Placed mark in cell [X,Y] forces opponent to play in mini-board [X,Y] next.</li>
                <li>• Winning a mini-board claims that square on the main board.</li>
                <li>• Routed to full/won mini-board allows opponent to play in ANY open board.</li>
              </ul>
            </div>
          )}

          {activeGame === 'dotsandboxes' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl text-emerald-200 font-bold">
                Objective: Complete the 4th side of boxes to claim territory &amp; extra turns!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Alternate drawing horizontal or vertical line segments between adjacent dots.</li>
                <li>• Completing the 4th line of a 1x1 box claims it and scores 1 point.</li>
                <li>• Claiming a box grants an immediate extra turn!</li>
                <li>• Highest score when all lines are drawn wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'battleship' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-2xl text-cyan-200 font-bold">
                Objective: Locate and sink all 5 hidden enemy ships on a 10x10 radar grid!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Fleet consists of Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2).</li>
                <li>• Alternate targeting coordinates (e.g., C-7) on radar grid.</li>
                <li>• System reports HIT or MISS and alerts when a ship is fully sunk.</li>
                <li>• First commander to sink all 5 enemy ships wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'sim' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-500/10 border border-purple-400/30 rounded-2xl text-purple-200 font-bold">
                Objective: AVOID forming a single-color triangle with 3 vertices!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 6 circular dots connected by 15 potential straight lines.</li>
                <li>• Players alternate drawing edges (Red vs Blue).</li>
                <li>• Misère Rule: Creating a same-color triangle with 3 vertices immediately loses!</li>
                <li>• Force your opponent to complete a same-color triangle to win.</li>
              </ul>
            </div>
          )}

          {activeGame === 'uno' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-2xl text-red-200 font-bold">
                Objective: Match top discard card by color or rank and empty your hand first!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Deal 7 cards per player. Match color (Red/Blue/Green/Yellow) or rank (0-9).</li>
                <li>• Action cards: Skip, Reverse, Draw Two (+2), Wild, Wild Draw Four (+4).</li>
                <li>• Draw 1 card from deck if unable to match.</li>
                <li>• Call UNO when holding 1 card left to win!</li>
              </ul>
            </div>
          )}

          {activeGame === 'hearts' && (
            <div className="space-y-3">
              <div className="p-3 bg-pink-500/10 border border-pink-400/30 rounded-2xl text-pink-200 font-bold">
                Objective: Avoid taking tricks containing Hearts (+1 pt) &amp; Queen of Spades (+13 pts)!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 4 players, 13 trick rounds per hand. Must follow suit led if possible.</li>
                <li>• Highest card of led suit wins trick. Penalty points scored on trick taken.</li>
                <li>• Shooting the Moon: Taking ALL 13 hearts + Queen of Spades gives 0 pts to shooter, +26 pts to opponents!</li>
                <li>• Player with lowest cumulative score when match target reached wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'ginrummy' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                Objective: Form Melds (Sets &amp; Runs) and Knock with &le; 10 deadwood points!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• 10 cards per hand. Draw 1 card &rarr; Form melds &rarr; Discard 1 card.</li>
                <li>• Sets: 3-4 cards of same rank. Runs: 3+ consecutive cards of same suit.</li>
                <li>• Knock when deadwood points &le; 10. Call GIN (0 deadwood) for +25 bonus points!</li>
                <li>• First player to 100 cumulative points wins the match!</li>
              </ul>
            </div>
          )}

          {activeGame === 'speed' && (
            <div className="space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-2xl text-yellow-200 font-bold">
                Objective: Real-time simultaneous matching to empty your hand &amp; deck first!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• Two central active piles. Match cards ±1 rank away (Aces connect to 2 and King).</li>
                <li>• No turn waiting! Play cards as fast as your fingers can move.</li>
                <li>• Click FLIP to reveal new central pile cards when both players are stuck.</li>
                <li>• First to clear hand &amp; draw stack wins!</li>
              </ul>
            </div>
          )}

          {activeGame === 'carrom' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-200 font-bold">
                Objective: Strike and pocket carrom men into 4 corner pockets to outscore your opponent!
              </div>
              <ul className="space-y-1.5 pl-2">
                <li>• <strong>Classic Points:</strong> White = 10 pts, Black = 5 pts, Red Queen = 25 pts (must cover with a carrom piece on same or next shot).</li>
                <li>• <strong>Freestyle:</strong> Pocket any pieces to accumulate maximum points before the board clears.</li>
                <li>• <strong>Disc Pool / Speed:</strong> Pocket all pieces against the clock or opponent with combo multipliers!</li>
                <li>• <strong>Striker Controls:</strong> Drag striker horizontally along baseline, then pull back aim line to adjust angle and force &rarr; release to strike!</li>
                <li>• <strong>Foul:</strong> Sinking the striker incurs a -5 pt penalty and returns a pocketed piece to the center.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#f3ce6b] text-slate-950 font-black text-xs hover:bg-[#ffe89e] transition shadow-md"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
