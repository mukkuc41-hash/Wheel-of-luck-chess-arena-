import React from 'react';
import { ActiveBoardGame } from '../types';

interface GameBarSelectorProps {
  activeBoardGame: ActiveBoardGame;
  onSelectGame: (game: ActiveBoardGame) => void;
}

export const GAME_BAR_ITEMS: { id: ActiveBoardGame; title: string; icon: string }[] = [
  { id: 'chess', title: '1. Chess', icon: '♚' },
  { id: 'checkers', title: '2. Draughts', icon: '⚪' },
  { id: 'backgammon', title: '3. Backgammon', icon: '🎲' },
  { id: 'snakes', title: '4. Snakes & Ladders', icon: '🐍' },
  { id: 'ludo', title: '5. Ludo', icon: '🎲' },
  { id: 'gomoku', title: '6. Gomoku', icon: '⚫' },
  { id: 'reversi', title: '7. Reversi', icon: '☯️' },
  { id: 'connect4', title: '8. Connect Four', icon: '🟡' },
  { id: 'ultimatetictactoe', title: '9. Ultimate TTT', icon: '❌' },
  { id: 'dotsandboxes', title: '10. Dots & Boxes', icon: '📦' },
  { id: 'battleship', title: '11. Battleship', icon: '🚢' },
  { id: 'sim', title: '12. Sim Game', icon: '🔺' },
  { id: 'uno', title: '13. Uno', icon: '🔥' },
  { id: 'hearts', title: '14. Hearts', icon: '♥' },
  { id: 'ginrummy', title: '15. Gin Rummy', icon: '🃏' },
  { id: 'speed', title: '16. Speed', icon: '⚡' },
  { id: 'carrom', title: '17. Carrom Board', icon: '🥏' },
];

export const GameBarSelector: React.FC<GameBarSelectorProps> = ({
  activeBoardGame,
  onSelectGame,
}) => {
  return (
    <div className="w-full max-w-[850px] bg-[#0c0a13]/90 border border-[#f3ce6b]/30 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto shadow-2xl backdrop-blur-xl custom-scrollbar scroll-smooth">
      {GAME_BAR_ITEMS.map((game) => {
        const isActive = activeBoardGame === game.id;
        return (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
              isActive
                ? 'bg-[#f3ce6b] text-slate-950 shadow-[0_0_16px_rgba(243,206,107,0.45)] border border-amber-300'
                : 'text-gray-200 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <span className="text-sm select-none">{game.icon}</span>
            <span>{game.title}</span>
          </button>
        );
      })}
    </div>
  );
};
