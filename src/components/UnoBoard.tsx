import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Sparkles, Layers, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { BotAISettingsBar } from './BotAISettingsBar';

interface UnoBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Skip' | 'Reverse' | '+2' | 'Wild' | '+4';

type UnoCard = {
  id: string;
  color: CardColor;
  value: CardValue;
};

export const UnoBoard: React.FC<UnoBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];

  const [opponentType, setOpponentType] = useState<'pvp' | 'ai'>(
    initialMode === 'local' || initialMode === 'pvp' ? 'pvp' : 'ai'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const PLAYER_COLORS_LIST = [
    { id: 'p1', name: 'Red (P1)', hex: '#ef4444' },
    { id: 'p2', name: 'Blue (P2)', hex: '#3b82f6' },
    { id: 'p3', name: 'Green (P3)', hex: '#10b981' },
    { id: 'p4', name: 'Yellow (P4)', hex: '#eab308' },
    { id: 'p5', name: 'Purple (P5)', hex: '#a855f7' },
    { id: 'p6', name: 'Pink (P6)', hex: '#ec4899' },
    { id: 'p7', name: 'Orange (P7)', hex: '#f97316' },
    { id: 'p8', name: 'Cyan (P8)', hex: '#06b6d4' },
    { id: 'p9', name: 'Teal (P9)', hex: '#14b8a6' },
    { id: 'p10', name: 'Indigo (P10)', hex: '#6366f1' },
  ];

  const createDeck = (): UnoCard[] => {
    const deck: UnoCard[] = [];
    let idCounter = 1;

    for (const color of COLORS) {
      for (const val of VALUES) {
        deck.push({ id: `c_${idCounter++}`, color, value: val });
        if (val !== '0') {
          deck.push({ id: `c_${idCounter++}`, color, value: val });
        }
      }
    }

    // Add Wilds
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `w_${idCounter++}`, color: 'wild', value: 'Wild' });
      deck.push({ id: `w4_${idCounter++}`, color: 'wild', value: '+4' });
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [aiHand, setAiHand] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Match top card by color or rank!');
  const hasRecordedRef = React.useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === 'player' ? 'w' : 'b';
      onGameEnd(winnerCode, 'uno_hand_cleared');
    }
  }, [winner, onGameEnd]);

  const setupGame = () => {
    hasRecordedRef.current = false;
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 7);
    const aHand = newDeck.splice(0, 7);

    let topCard = newDeck.pop()!;
    while (topCard.color === 'wild') {
      newDeck.unshift(topCard);
      topCard = newDeck.pop()!;
    }

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([topCard]);
    setCurrentColor(topCard.color);
    setTurn('player');
    setWinner(null);
    setStatusMsg('Game Started! Your turn to play a card.');
  };

  useEffect(() => {
    setupGame();
  }, []);

  const resetGame = () => {
    setupGame();
  };

  const topCard = discardPile[discardPile.length - 1];

  const isValidPlay = (card: UnoCard) => {
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (topCard && card.value === topCard.value) return true;
    return false;
  };

  const playCard = (card: UnoCard, isPlayer: boolean) => {
    soundFx.playMove();

    if (isPlayer) {
      const newHand = playerHand.filter(c => c.id !== card.id);
      setPlayerHand(newHand);
      if (newHand.length === 0) {
        soundFx.playGameOver(true);
        setWinner('player');
        setStatusMsg('UNO VICTORY! You cleared your hand first!');
        return;
      }
    } else {
      const newHand = aiHand.filter(c => c.id !== card.id);
      setAiHand(newHand);
      if (newHand.length === 0) {
        soundFx.playGameOver(false);
        setWinner('ai');
        setStatusMsg('DEFEAT! AI Bot cleared its hand!');
        return;
      }
    }

    setDiscardPile(prev => [...prev, card]);

    // Handle special action cards
    let nextColor = card.color;
    if (card.color === 'wild') {
      nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      setStatusMsg(`Wild Card played! Active color changed to ${nextColor.toUpperCase()}`);
    } else {
      setStatusMsg(`${isPlayer ? 'You' : 'AI'} played ${card.color.toUpperCase()} ${card.value}`);
    }

    setCurrentColor(nextColor);

    // Turn logic
    if (card.value === '+2') {
      drawCards(isPlayer ? false : true, 2);
    } else if (card.value === '+4') {
      drawCards(isPlayer ? false : true, 4);
    }

    if (card.value === 'Skip' || card.value === 'Reverse') {
      // Retain turn
      setStatusMsg(`${card.value} card played! Turn skipped!`);
    } else {
      setTurn(isPlayer ? 'ai' : 'player');
    }
  };

  const drawCards = (isPlayer: boolean, count: number) => {
    const newDeck = [...deck];
    const drawn: UnoCard[] = [];

    for (let i = 0; i < count; i++) {
      if (newDeck.length === 0) break;
      drawn.push(newDeck.pop()!);
    }

    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand(prev => [...prev, ...drawn]);
    } else {
      setAiHand(prev => [...prev, ...drawn]);
    }
  };

  const handlePlayerDraw = () => {
    if (turn !== 'player' || winner) return;
    drawCards(true, 1);
    setStatusMsg('You drew 1 card from deck.');
    setTurn('ai');
  };

  // AI Turn Logic with difficulty
  useEffect(() => {
    if (turn === 'ai' && !winner && discardPile.length > 0 && opponentType === 'ai') {
      const delay = aiDifficulty === 'easy' ? 950 : aiDifficulty === 'medium' ? 700 : 450;
      const timer = setTimeout(() => {
        const playable = aiHand.filter(isValidPlay);

        if (playable.length > 0) {
          let chosen: UnoCard;
          if (aiDifficulty === 'hard') {
            // Prioritize action cards if human player has 3 or fewer cards
            const actionCard = playable.find(c => c.value === '+2' || c.value === '+4' || c.value === 'Skip' || c.value === 'Reverse');
            if (playerHand.length <= 3 && actionCard) {
              chosen = actionCard;
            } else {
              // Prefer non-wild matching colored cards first to save wilds
              chosen = playable.find(c => c.color !== 'wild') || playable[0];
            }
          } else {
            chosen = playable[Math.floor(Math.random() * playable.length)];
          }
          playCard(chosen, false);
        } else {
          drawCards(false, 1);
          setStatusMsg(`${aiDifficulty === 'easy' ? 'Easy Bot' : aiDifficulty === 'medium' ? 'Medium Bot' : 'Pro Bot'} drew 1 card.`);
          setTurn('player');
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, aiHand, discardPile, currentColor, opponentType, aiDifficulty, playerHand.length]);

  const getColorBg = (c: CardColor) => {
    switch (c) {
      case 'red': return 'bg-red-600 text-white border-red-400';
      case 'blue': return 'bg-blue-600 text-white border-blue-400';
      case 'green': return 'bg-emerald-600 text-white border-emerald-400';
      case 'yellow': return 'bg-yellow-500 text-slate-950 border-yellow-300';
      default: return 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white border-white';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-red-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Uniform AI & Opponent Bar */}
      <BotAISettingsBar
        opponentType={opponentType}
        onOpponentTypeChange={(t) => {
          setOpponentType(t === 'solo' ? 'pvp' : t);
          resetGame();
        }}
        aiDifficulty={aiDifficulty}
        onAiDifficultyChange={(d) => setAiDifficulty(d)}
        statusMessage={statusMsg}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-yellow-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md border border-red-400/30">
            🔥
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Uno (Crazy Eights)
            </h3>
            <p className="text-xs text-gray-300">
              Match color or number. Play action cards (+2, +4, Skip) to empty hand!
            </p>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Status Bar */}
      <div className="w-full text-center py-2 px-4 rounded-xl bg-slate-950 border border-white/10 text-amber-300 text-xs font-mono font-bold">
        {statusMsg}
      </div>

      {/* Playfield Area */}
      <div className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4">
        {/* AI Hand (Hidden) */}
        <div className="flex items-center gap-1 overflow-x-auto w-full justify-center py-1">
          <span className="text-xs font-extrabold text-purple-400 mr-2">AI ({aiHand.length}):</span>
          {aiHand.map((_, idx) => (
            <div key={idx} className="w-7 h-11 bg-red-950 border border-red-600 rounded-md shadow flex items-center justify-center text-[10px] text-red-300 font-bold shrink-0">
              UNO
            </div>
          ))}
        </div>

        {/* Center Deck & Discard Pile */}
        <div className="flex items-center justify-center gap-6 my-2">
          {/* Draw Deck */}
          <button
            onClick={handlePlayerDraw}
            disabled={turn !== 'player' || !!winner}
            className="w-16 h-24 rounded-xl bg-gradient-to-tr from-stone-900 to-red-950 border-2 border-red-500/60 shadow-xl flex flex-col items-center justify-center text-red-400 hover:scale-105 transition cursor-pointer"
          >
            <Layers className="w-6 h-6 mb-1 text-red-400" />
            <span className="text-[10px] font-black uppercase">Draw ({deck.length})</span>
          </button>

          {/* Discard Pile Top Card */}
          {topCard && (
            <div className={`w-18 h-28 rounded-xl border-2 shadow-2xl flex flex-col items-center justify-between p-2 font-black ${getColorBg(currentColor)} animate-in fade-in`}>
              <span className="text-xs">{topCard.value}</span>
              <span className="text-xl font-extrabold">{topCard.value}</span>
              <span className="text-xs uppercase">{currentColor}</span>
            </div>
          )}
        </div>

        {/* Player Hand */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300 font-extrabold px-1">
            <span>Your Cards ({playerHand.length}):</span>
            {playerHand.length === 1 && (
              <span className="animate-pulse text-red-400 font-black text-sm">🔥 UNO ALERT! 🔥</span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-900 rounded-xl border border-white/10 custom-scrollbar">
            {playerHand.map(card => {
              const playable = isValidPlay(card) && turn === 'player' && !winner;

              return (
                <button
                  key={card.id}
                  onClick={() => playable && playCard(card, true)}
                  disabled={!playable}
                  className={`w-14 h-22 rounded-xl border-2 shrink-0 flex flex-col items-center justify-between p-1.5 font-black text-xs transition-all ${getColorBg(card.color)} ${
                    playable ? 'hover:-translate-y-2 cursor-pointer shadow-lg ring-2 ring-amber-400' : 'opacity-50'
                  }`}
                >
                  <span>{card.value}</span>
                  <span className="text-base">{card.value}</span>
                  <span className="text-[9px] uppercase">{card.color}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'player' ? 'UNO CHAMPION! You Win!' : 'AI Bot Cleared Hand First!'}
              </span>
            </div>
            <button
              onClick={resetGame}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
