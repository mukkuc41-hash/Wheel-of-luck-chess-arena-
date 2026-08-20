import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface SpeedBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
type Card = { id: string; suit: Suit; rank: number; rankStr: string };

export const SpeedBoard: React.FC<SpeedBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
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

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);

  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [aiDeck, setAiDeck] = useState<Card[]>([]);

  const [pile1, setPile1] = useState<Card | null>(null);
  const [pile2, setPile2] = useState<Card | null>(null);

  const [sideStock, setSideStock] = useState<Card[]>([]);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Match cards ±1 rank on either central pile as fast as you can!');
  const hasRecordedRef = React.useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === 'player' ? 'w' : 'b';
      onGameEnd(winnerCode, 'speed_depleted_deck_win');
    }
  }, [winner, onGameEnd]);

  const setupGame = () => {
    hasRecordedRef.current = false;
    const deck = createDeck();
    const pHand = deck.splice(0, 5);
    const pDeck = deck.splice(0, 15);

    const aHand = deck.splice(0, 5);
    const aDeck = deck.splice(0, 15);

    const c1 = deck.pop()!;
    const c2 = deck.pop()!;

    setPlayerHand(pHand);
    setPlayerDeck(pDeck);
    setAiHand(aHand);
    setAiDeck(aDeck);
    setPile1(c1);
    setPile2(c2);
    setSideStock(deck);
    setWinner(null);
    setStatusMsg('SPEED START! Play cards ±1 rank on either pile!');
  };

  useEffect(() => {
    setupGame();
  }, []);

  const resetGame = () => {
    setupGame();
  };

  // Check valid play (+1 or -1 rank away, wrapping Ace to King)
  const isValidPlay = (card: Card, targetPile: Card | null) => {
    if (!targetPile) return true;
    const diff = Math.abs(card.rank - targetPile.rank);
    if (diff === 1) return true;
    if (card.rank === 1 && targetPile.rank === 13) return true;
    if (card.rank === 13 && targetPile.rank === 1) return true;
    return false;
  };

  const playCardToPile = (card: Card, pileNum: 1 | 2, isPlayer: boolean) => {
    soundFx.playMove();

    if (pileNum === 1) setPile1(card);
    else setPile2(card);

    if (isPlayer) {
      let newHand = playerHand.filter(c => c.id !== card.id);
      let newDeck = [...playerDeck];

      if (newDeck.length > 0 && newHand.length < 5) {
        newHand.push(newDeck.pop()!);
      }

      setPlayerHand(newHand);
      setPlayerDeck(newDeck);

      if (newHand.length === 0 && newDeck.length === 0) {
        soundFx.playGameOver(true);
        setWinner('player');
        setStatusMsg('⚡ VICTORY! You cleared all your cards first!');
      }
    } else {
      let newHand = aiHand.filter(c => c.id !== card.id);
      let newDeck = [...aiDeck];

      if (newDeck.length > 0 && newHand.length < 5) {
        newHand.push(newDeck.pop()!);
      }

      setAiHand(newHand);
      setAiDeck(newDeck);

      if (newHand.length === 0 && newDeck.length === 0) {
        soundFx.playGameOver(false);
        setWinner('ai');
        setStatusMsg('⚡ DEFEAT! AI Bot cleared all cards first!');
      }
    }
  };

  const handleFlip = () => {
    if (sideStock.length < 2) {
      // Re-shuffle side stock
      const fresh = createDeck().splice(0, 10);
      setSideStock(fresh);
      return;
    }

    soundFx.playClick();
    const newStock = [...sideStock];
    setPile1(newStock.pop()!);
    setPile2(newStock.pop()!);
    setSideStock(newStock);
    setStatusMsg('FLIPPED new central cards!');
  };

  // AI Real-Time Fast Play Loop
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      if (!pile1 || !pile2) return;

      for (const card of aiHand) {
        if (isValidPlay(card, pile1)) {
          playCardToPile(card, 1, false);
          break;
        } else if (isValidPlay(card, pile2)) {
          playCardToPile(card, 2, false);
          break;
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [aiHand, pile1, pile2, winner]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-yellow-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-600 to-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md border border-yellow-400/30">
            ⚡
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Speed (Spit Card Game)
            </h3>
            <p className="text-xs text-gray-300">
              Real-time matching! Play cards ±1 rank away on either pile as fast as you can.
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
        {/* AI Opponent Card Count */}
        <div className="text-xs font-extrabold text-purple-300">
          AI Cards Left: <strong className="text-white font-black">{aiHand.length + aiDeck.length}</strong>
        </div>

        {/* Central Active Matching Piles */}
        <div className="flex items-center justify-center gap-6 my-2">
          {/* Pile 1 */}
          {pile1 && (
            <div className="w-16 h-24 rounded-xl bg-white border-2 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2 font-black text-xs text-slate-950">
              <span className={pile1.suit === '♥' || pile1.suit === '♦' ? 'text-red-600' : 'text-slate-950'}>{pile1.rankStr}{pile1.suit}</span>
              <span className="text-xl">{pile1.suit}</span>
            </div>
          )}

          {/* FLIP STUCK BUTTON */}
          <button
            onClick={handleFlip}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md flex flex-col items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>FLIP</span>
          </button>

          {/* Pile 2 */}
          {pile2 && (
            <div className="w-16 h-24 rounded-xl bg-white border-2 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2 font-black text-xs text-slate-950">
              <span className={pile2.suit === '♥' || pile2.suit === '♦' ? 'text-red-600' : 'text-slate-950'}>{pile2.rankStr}{pile2.suit}</span>
              <span className="text-xl">{pile2.suit}</span>
            </div>
          )}
        </div>

        {/* Player Remaining Count */}
        <div className="text-xs font-extrabold text-amber-300">
          Your Cards Left: <strong className="text-white font-black">{playerHand.length + playerDeck.length}</strong>
        </div>

        {/* Player Active Hand */}
        <div className="w-full overflow-x-auto p-2 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center gap-2 custom-scrollbar">
          {playerHand.map(card => {
            const p1Valid = isValidPlay(card, pile1);
            const p2Valid = isValidPlay(card, pile2);

            return (
              <div key={card.id} className="flex flex-col items-center gap-1">
                {/* Target Pile Play Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => p1Valid && playCardToPile(card, 1, true)}
                    disabled={!p1Valid || !!winner}
                    className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black disabled:opacity-30 hover:bg-blue-500 transition cursor-pointer"
                  >
                    P1
                  </button>
                  <button
                    onClick={() => p2Valid && playCardToPile(card, 2, true)}
                    disabled={!p2Valid || !!winner}
                    className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black disabled:opacity-30 hover:bg-emerald-500 transition cursor-pointer"
                  >
                    P2
                  </button>
                </div>

                {/* Card UI */}
                <div className={`w-12 h-18 rounded-xl bg-white border-2 border-slate-300 flex flex-col items-center justify-between p-1 font-black text-xs shadow-md ${
                  card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-slate-950'
                } ${p1Valid || p2Valid ? 'ring-2 ring-amber-400 animate-bounce' : ''}`}>
                  <span>{card.rankStr}</span>
                  <span className="text-base">{card.suit}</span>
                </div>
              </div>
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
            className="w-full bg-gradient-to-r from-yellow-950 via-slate-900 to-amber-950 border border-yellow-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'player' ? 'SPEED CHAMPION! You Win!' : 'AI Bot Outspeeded You!'}
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
