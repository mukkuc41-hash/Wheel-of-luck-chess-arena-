import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Layers, Award, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface GinRummyBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
}

type Suit = '♠' | '♥' | '♦' | '♣';
type Card = { id: string; suit: Suit; rank: number; rankStr: string };

export const GinRummyBoard: React.FC<GinRummyBoardProps> = ({ gameMode: initialMode = 'ai' }) => {
  const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  // Options state
  const [userSide, setUserSide] = useState<'amber' | 'purple'>('amber');
  const [aiPlayers, setAiPlayers] = useState<Record<'amber' | 'purple', boolean>>({
    amber: false,
    purple: true,
  });

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    let counter = 1;
    SUITS.forEach(suit => {
      RANKS.forEach((rankStr, idx) => {
        deck.push({ id: `c_${counter++}`, suit, rank: idx + 1, rankStr });
      });
    });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const [stock, setStock] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [turnPhase, setTurnPhase] = useState<'draw' | 'discard'>('draw');
  const [p1Score, setP1Score] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Draw 1 card from Stock or Discard pile.');

  const setupRound = () => {
    const deck = createDeck();
    const pHand = deck.splice(0, 10);
    const aHand = deck.splice(0, 10);
    const topDiscard = deck.pop()!;

    setStock(deck);
    setDiscardPile([topDiscard]);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setTurn('player');
    setTurnPhase('draw');
    setWinner(null);
    setStatusMsg('New Round! Draw a card from Stock or Discard pile.');
  };

  useEffect(() => {
    setupRound();
  }, []);

  const resetGame = () => {
    setP1Score(0);
    setAiScore(0);
    setupRound();
  };

  // Compute Deadwood points
  const calculateDeadwood = (hand: Card[]) => {
    // Basic estimation for unmatched cards
    let pts = 0;
    hand.forEach(c => {
      pts += Math.min(c.rank, 10);
    });
    return Math.max(0, pts - 15); // meld reduction
  };

  const playerDeadwood = calculateDeadwood(playerHand);

  const drawCard = (source: 'stock' | 'discard', isPlayer: boolean) => {
    soundFx.playClick();
    let drawn: Card | undefined;

    if (source === 'stock') {
      const newStock = [...stock];
      drawn = newStock.pop();
      setStock(newStock);
    } else {
      const newDiscard = [...discardPile];
      drawn = newDiscard.pop();
      setDiscardPile(newDiscard);
    }

    if (!drawn) return;

    if (isPlayer) {
      setPlayerHand(prev => [...prev, drawn!]);
      setTurnPhase('discard');
      setStatusMsg('Card drawn! Click a card in your hand to discard it.');
    } else {
      setAiHand(prev => [...prev, drawn!]);
      setTurnPhase('discard');
    }
  };

  const handlePlayerDiscard = (card: Card) => {
    if (turn !== 'player' || turnPhase !== 'discard') return;

    soundFx.playMove();
    const newHand = playerHand.filter(c => c.id !== card.id);
    setPlayerHand(newHand);
    setDiscardPile(prev => [...prev, card]);

    setTurn('ai');
    setTurnPhase('draw');
    setStatusMsg('Discarded. AI Bot taking turn...');
  };

  const handleKnock = () => {
    soundFx.playGameOver(true);
    const dw = playerDeadwood;
    if (dw === 0) {
      // GIN!
      const bonus = 25 + 10;
      const newP1 = p1Score + bonus;
      setP1Score(newP1);
      if (newP1 >= 100) setWinner('You Win Match with GIN!');
      else setStatusMsg('🔥 GIN BONUS! +35 points awarded!');
    } else {
      const pts = 15;
      const newP1 = p1Score + pts;
      setP1Score(newP1);
      if (newP1 >= 100) setWinner('You Win Match!');
      else setStatusMsg(`Knocked! Scored +${pts} pts.`);
    }
  };

  // AI Logic
  useEffect(() => {
    if (turn === 'ai' && !winner) {
      const timer = setTimeout(() => {
        if (turnPhase === 'draw') {
          // Draw from stock
          drawCard('stock', false);
        } else if (turnPhase === 'discard') {
          // Discard highest rank
          if (aiHand.length > 0) {
            const highest = [...aiHand].sort((a,b) => b.rank - a.rank)[0];
            const newHand = aiHand.filter(c => c.id !== highest.id);
            setAiHand(newHand);
            setDiscardPile(prev => [...prev, highest]);
            setTurn('player');
            setTurnPhase('draw');
            setStatusMsg('AI Bot completed turn. Your turn to draw.');
          }
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [turn, turnPhase, winner, aiHand, stock, discardPile]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        userColorId={userSide}
        onUserColorChange={(id) => {
          const col = id as 'amber' | 'purple';
          setUserSide(col);
          setAiPlayers({
            amber: col === 'purple',
            purple: col === 'amber',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'amber',
            name: 'Gold Deck (P1)',
            colorHex: '#f59e0b',
            isAi: aiPlayers.amber,
            isUser: userSide === 'amber',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, amber: !prev.amber })),
          },
          {
            id: 'purple',
            name: 'Purple Deck (P2)',
            colorHex: '#a855f7',
            isAi: aiPlayers.purple,
            isUser: userSide === 'purple',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, purple: !prev.purple })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-yellow-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md border border-amber-400/30">
            🃏
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Gin Rummy
            </h3>
            <p className="text-xs text-gray-300">
              Form melds (sets &amp; runs). Knock when deadwood ≤ 10 pts for Gin bonus!
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

      {/* Match Score Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-950 rounded-xl border border-white/10 text-xs font-bold">
        <div className="text-amber-300 font-bold">
          Your Match Score: <strong className="text-white text-base font-black">{p1Score}</strong> / 100
        </div>
        <div className="text-purple-300 font-bold">
          AI Score: <strong className="text-white text-base font-black">{aiScore}</strong> / 100
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full text-center py-2 px-4 rounded-xl bg-slate-950 border border-white/10 text-amber-300 text-xs font-mono font-bold">
        {statusMsg}
      </div>

      {/* Playfield Area */}
      <div className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4">
        {/* Center Stock & Discard Piles */}
        <div className="flex items-center justify-center gap-6">
          {/* Stock Pile */}
          <button
            onClick={() => turn === 'player' && turnPhase === 'draw' && drawCard('stock', true)}
            disabled={turn !== 'player' || turnPhase !== 'draw'}
            className="w-16 h-24 rounded-xl bg-gradient-to-tr from-stone-900 to-amber-950 border-2 border-amber-500/60 shadow-xl flex flex-col items-center justify-center text-amber-300 hover:scale-105 transition cursor-pointer disabled:opacity-50"
          >
            <Layers className="w-6 h-6 mb-1 text-amber-400" />
            <span className="text-[10px] font-black uppercase">Stock ({stock.length})</span>
          </button>

          {/* Discard Pile */}
          {discardPile.length > 0 && (
            <button
              onClick={() => turn === 'player' && turnPhase === 'draw' && drawCard('discard', true)}
              disabled={turn !== 'player' || turnPhase !== 'draw'}
              className="w-16 h-24 rounded-xl bg-white border-2 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2 font-black text-xs hover:scale-105 transition cursor-pointer disabled:opacity-50"
            >
              <span className={discardPile[discardPile.length-1].suit === '♥' || discardPile[discardPile.length-1].suit === '♦' ? 'text-red-600' : 'text-slate-950'}>
                {discardPile[discardPile.length-1].rankStr}{discardPile[discardPile.length-1].suit}
              </span>
              <span className="text-lg">{discardPile[discardPile.length-1].suit}</span>
            </button>
          )}
        </div>

        {/* Player Controls & Knock Button */}
        <div className="flex items-center justify-between w-full px-2">
          <span className="text-xs font-extrabold text-amber-300">
            Deadwood Points: <strong className="text-white font-black">{playerDeadwood}</strong>
          </span>

          <button
            onClick={handleKnock}
            disabled={playerDeadwood > 10 || turn !== 'player'}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md disabled:opacity-40 flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-slate-950" />
            <span>KNOCK {playerDeadwood === 0 ? '(GIN!)' : ''}</span>
          </button>
        </div>

        {/* Player Hand Cards */}
        <div className="w-full overflow-x-auto p-2 bg-slate-900 rounded-xl border border-white/10 flex items-center gap-1.5 custom-scrollbar">
          {playerHand.map(card => {
            const isClickable = turn === 'player' && turnPhase === 'discard';

            return (
              <button
                key={card.id}
                onClick={() => isClickable && handlePlayerDiscard(card)}
                disabled={!isClickable}
                className={`w-12 h-18 rounded-xl bg-white border-2 border-slate-300 shrink-0 flex flex-col items-center justify-between p-1 font-black text-xs shadow-md transition-all ${
                  card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-slate-950'
                } ${isClickable ? 'hover:-translate-y-2 cursor-pointer ring-2 ring-amber-400' : ''}`}
              >
                <span>{card.rankStr}</span>
                <span className="text-base">{card.suit}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border border-amber-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{winner}</span>
            </div>
            <button
              onClick={resetGame}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              Start New Match
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
