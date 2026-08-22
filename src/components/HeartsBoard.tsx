import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Heart, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { BotAISettingsBar } from './BotAISettingsBar';

interface HeartsBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
type Card = { id: string; suit: Suit; value: number; rankStr: string };

export const HeartsBoard: React.FC<HeartsBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

  const [opponentType, setOpponentType] = useState<'pvp' | 'ai'>(
    initialMode === 'local' || initialMode === 'pvp' ? 'pvp' : 'ai'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    let counter = 1;
    SUITS.forEach(suit => {
      RANKS.forEach((rankStr, idx) => {
        deck.push({
          id: `card_${counter++}`,
          suit,
          value: idx + 2, // 2..14 (Ace = 14)
          rankStr
        });
      });
    });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]); // P1 (You), Bot 1, Bot 2, Bot 3
  const [hands, setHands] = useState<Card[][]>([[], [], [], []]);
  const [currentTrick, setCurrentTrick] = useState<{ playerIdx: number; card: Card }[]>([]);
  const [leadPlayer, setLeadPlayer] = useState<number>(0);
  const [turn, setTurn] = useState<number>(0);
  const [roundHearts, setRoundHearts] = useState<number[]>([0, 0, 0, 0]);
  const [roundEnded, setRoundEnded] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Follow suit led if possible. Avoid Hearts & Queen of Spades!');
  const hasRecordedRef = React.useRef(false);

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner.includes('You') ? 'w' : 'b';
      onGameEnd(winnerCode, 'hearts_moon_shoot_penalty');
    }
  }, [winner, onGameEnd]);

  const setupRound = () => {
    const deck = createDeck();
    const p0 = deck.slice(0, 13);
    const p1 = deck.slice(13, 26);
    const p2 = deck.slice(26, 39);
    const p3 = deck.slice(39, 52);

    // Sort hands by suit and value
    const sortHand = (h: Card[]) => [...h].sort((a,b) => a.suit.localeCompare(b.suit) || a.value - b.value);

    setHands([sortHand(p0), sortHand(p1), sortHand(p2), sortHand(p3)]);
    setCurrentTrick([]);
    setLeadPlayer(0);
    setTurn(0);
    setRoundHearts([0, 0, 0, 0]);
    setRoundEnded(false);
    setStatusMsg('New Round Hand Dealt. Your turn to lead a card.');
  };

  useEffect(() => {
    setupRound();
  }, []);

  const playCard = (playerIdx: number, card: Card) => {
    soundFx.playMove();
    const newHands = hands.map((h, idx) => idx === playerIdx ? h.filter(c => c.id !== card.id) : h);
    setHands(newHands);

    const newTrick = [...currentTrick, { playerIdx, card }];
    setCurrentTrick(newTrick);

    // If trick full (4 cards)
    if (newTrick.length === 4) {
      resolveTrick(newTrick, newHands);
    } else {
      setTurn((playerIdx + 1) % 4);
    }
  };

  const resolveTrick = (trick: { playerIdx: number; card: Card }[], remainingHands: Card[][]) => {
    const leadCard = trick[0].card;
    let highestVal = leadCard.value;
    let trickWinner = trick[0].playerIdx;

    // Find highest card matching lead suit
    for (let i = 1; i < 4; i++) {
      if (trick[i].card.suit === leadCard.suit && trick[i].card.value > highestVal) {
        highestVal = trick[i].card.value;
        trickWinner = trick[i].playerIdx;
      }
    }

    // Calculate penalty points in trick
    let points = 0;
    trick.forEach(t => {
      if (t.card.suit === '♥') points += 1;
      if (t.card.suit === '♠' && t.card.rankStr === 'Q') points += 13;
    });

    const newRoundHearts = [...roundHearts];
    newRoundHearts[trickWinner] += points;
    setRoundHearts(newRoundHearts);

    setStatusMsg(`Player ${trickWinner + 1} took the trick (+${points} pts).`);

    setTimeout(() => {
      setCurrentTrick([]);
      setLeadPlayer(trickWinner);
      setTurn(trickWinner);

      // Check if all 13 tricks played
      if (remainingHands.every(h => h.length === 0)) {
        finishRound(newRoundHearts);
      }
    }, 1000);
  };

  const finishRound = (roundPoints: number[]) => {
    soundFx.playGameOver(true);

    // Check Shooting the Moon (13 hearts + QS = 26 pts)
    const shooterIdx = roundPoints.findIndex(pts => pts === 26);
    let finalRoundPts = [...roundPoints];

    if (shooterIdx !== -1) {
      finalRoundPts = [26, 26, 26, 26];
      finalRoundPts[shooterIdx] = 0;
      setStatusMsg(`🔥 PLAYER ${shooterIdx + 1} SHOT THE MOON! 0 pts to shooter, +26 pts to all opponents!`);
    }

    const newScores = scores.map((s, idx) => s + finalRoundPts[idx]);
    setScores(newScores);
    setRoundEnded(true);

    if (newScores.some(s => s >= 50)) {
      const minScore = Math.min(...newScores);
      const winnerIdx = newScores.findIndex(s => s === minScore);
      setWinner(winnerIdx === 0 ? 'You Win!' : `Player ${winnerIdx + 1} Wins!`);
    }
  };

  // AI Bots Automatic Turn Execution
  useEffect(() => {
    if (turn !== 0 && !roundEnded && hands[turn] && hands[turn].length > 0 && currentTrick.length < 4) {
      const delay = aiDifficulty === 'easy' ? 850 : aiDifficulty === 'medium' ? 600 : 400;
      const timer = setTimeout(() => {
        const botHand = hands[turn];
        const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;

        let playable = botHand;
        if (leadCard) {
          const sameSuit = botHand.filter(c => c.suit === leadCard.suit);
          if (sameSuit.length > 0) playable = sameSuit;
        }

        let chosen: Card;
        if (aiDifficulty === 'hard') {
          // If cannot follow suit, discard dangerous Queen of Spades or highest Heart
          if (leadCard && !botHand.some(c => c.suit === leadCard.suit)) {
            const qs = playable.find(c => c.suit === '♠' && c.value === 12);
            const highHeart = playable.filter(c => c.suit === '♥').sort((a,b) => b.value - a.value)[0];
            chosen = qs || highHeart || playable.sort((a,b) => b.value - a.value)[0];
          } else {
            // Play lowest possible winning or ducking card
            chosen = playable.sort((a,b) => a.value - b.value)[0];
          }
        } else {
          chosen = playable[Math.floor(Math.random() * playable.length)];
        }

        playCard(turn, chosen);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, currentTrick, hands, roundEnded, aiDifficulty]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[620px] mx-auto p-4 bg-slate-900/90 border border-pink-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Uniform AI & Opponent Bar */}
      <BotAISettingsBar
        opponentType={opponentType}
        onOpponentTypeChange={(t) => {
          setOpponentType(t === 'solo' ? 'pvp' : t);
          setupRound();
        }}
        aiDifficulty={aiDifficulty}
        onAiDifficultyChange={(d) => setAiDifficulty(d)}
        statusMessage={statusMsg}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-700 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-md border border-pink-400/30">
            ♥
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Hearts Card Arena
            </h3>
            <p className="text-xs text-gray-300">
              Trick-taking strategy. Avoid Hearts (+1) &amp; Queen of Spades (+13)!
            </p>
          </div>
        </div>

        <button
          onClick={setupRound}
          className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Deal Hand</span>
        </button>
      </div>

      {/* Scores Bar */}
      <div className="grid grid-cols-4 gap-2 w-full text-center bg-slate-950 p-2 rounded-xl border border-white/10 text-xs font-bold">
        {scores.map((s, idx) => (
          <div key={idx} className={`p-1.5 rounded-lg border ${turn === idx ? 'bg-pink-500/20 border-pink-400/40 text-pink-300' : 'bg-slate-900 border-white/5 text-gray-400'}`}>
            <span>{idx === 0 ? 'You (P1)' : `Bot ${idx + 1}`}: </span>
            <strong className="text-white font-black">{s} pts</strong>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="w-full text-center py-2 px-4 rounded-xl bg-slate-950 border border-white/10 text-amber-300 text-xs font-mono font-bold">
        {statusMsg}
      </div>

      {/* Active Trick Mat */}
      <div className="relative w-full aspect-video max-w-[460px] bg-emerald-900/60 border-4 border-emerald-800 rounded-2xl p-4 flex flex-col items-center justify-between shadow-2xl">
        {/* Top Bot 2 */}
        <div className="text-xs font-extrabold text-emerald-200">Bot 3 (Hand: {hands[2].length})</div>

        {/* Center Trick Cards */}
        <div className="flex items-center justify-center gap-3">
          {currentTrick.map((item, idx) => (
            <div key={idx} className="w-12 h-18 rounded-lg bg-white border border-slate-300 shadow-xl flex flex-col items-center justify-between p-1 font-black text-xs text-slate-950 shrink-0 animate-in fade-in">
              <span className={item.card.suit === '♥' || item.card.suit === '♦' ? 'text-red-600' : 'text-slate-950'}>{item.card.rankStr}{item.card.suit}</span>
              <span className="text-base">{item.card.suit}</span>
            </div>
          ))}
        </div>

        {/* Player Bottom Bar */}
        <div className="text-xs font-extrabold text-amber-300">Your Hand ({hands[0].length} cards)</div>
      </div>

      {/* Player Hand Cards */}
      <div className="w-full overflow-x-auto p-2 bg-slate-950 rounded-xl border border-white/10 flex items-center gap-1.5 custom-scrollbar">
        {hands[0].map(card => {
          const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;
          let isPlayable = turn === 0 && !roundEnded;
          if (leadCard) {
            const hasLeadSuit = hands[0].some(c => c.suit === leadCard.suit);
            if (hasLeadSuit && card.suit !== leadCard.suit) isPlayable = false;
          }

          return (
            <button
              key={card.id}
              onClick={() => isPlayable && playCard(0, card)}
              disabled={!isPlayable}
              className={`w-11 h-16 rounded-lg bg-white border-2 border-slate-300 shrink-0 flex flex-col items-center justify-between p-1 font-black text-xs shadow-md transition-all ${
                card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-slate-950'
              } ${isPlayable ? 'hover:-translate-y-2 cursor-pointer ring-2 ring-amber-400' : 'opacity-40'}`}
            >
              <span>{card.rankStr}</span>
              <span className="text-sm">{card.suit}</span>
            </button>
          );
        })}
      </div>

      {/* Round/Winner Banner */}
      <AnimatePresence>
        {(roundEnded || winner) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-pink-950 via-slate-900 to-rose-950 border border-pink-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-pink-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{winner ? `CHAMPION: ${winner}` : 'Round Finished!'}</span>
            </div>
            <button
              onClick={setupRound}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              {winner ? 'New Tournament' : 'Next Round'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
