import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Circle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface SimBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

type Edge = { id: string; u: number; v: number; color: 'red' | 'blue' | null };

export const SimBoard: React.FC<SimBoardProps> = ({ gameMode: initialMode = 'ai', onGameEnd }) => {
  const NUM_DOTS = 6;

  const getDotCoords = () => {
    const coords: { x: number; y: number }[] = [];
    const center = 150;
    const radius = 110;

    for (let i = 0; i < NUM_DOTS; i++) {
      const angle = (i * 2 * Math.PI) / NUM_DOTS - Math.PI / 2;
      coords.push({
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      });
    }
    return coords;
  };

  const dots = getDotCoords();

  const createInitialEdges = (): Edge[] => {
    const edges: Edge[] = [];
    for (let i = 0; i < NUM_DOTS; i++) {
      for (let j = i + 1; j < NUM_DOTS; j++) {
        edges.push({ id: `${i}_${j}`, u: i, v: j, color: null });
      }
    }
    return edges;
  };

  const [edges, setEdges] = useState<Edge[]>(createInitialEdges);
  const [turn, setTurn] = useState<'red' | 'blue'>('red');
  const [winner, setWinner] = useState<'red' | 'blue' | null>(null);
  const hasRecordedRef = React.useRef(false);

  // Settings state
  const [userColor, setUserColor] = useState<'red' | 'blue'>('red');
  const [aiPlayers, setAiPlayers] = useState<Record<'red' | 'blue', boolean>>({
    red: false,
    blue: true,
  });

  useEffect(() => {
    if (winner && onGameEnd && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      const winnerCode = winner === userColor ? 'w' : 'b';
      onGameEnd(winnerCode, 'sim_monochromatic_triangle_formed');
    }
  }, [winner, onGameEnd, userColor]);

  const resetGame = () => {
    hasRecordedRef.current = false;
    setEdges(createInitialEdges());
    setTurn('red');
    setWinner(null);
  };

  // Check if player formed a same-color triangle
  const checkTriangleLoss = (currentEdges: Edge[], color: 'red' | 'blue') => {
    const colorEdges = currentEdges.filter(e => e.color === color);
    const adj: boolean[][] = Array(NUM_DOTS).fill(false).map(() => Array(NUM_DOTS).fill(false));

    colorEdges.forEach(e => {
      adj[e.u][e.v] = true;
      adj[e.v][e.u] = true;
    });

    for (let i = 0; i < NUM_DOTS; i++) {
      for (let j = i + 1; j < NUM_DOTS; j++) {
        for (let k = j + 1; k < NUM_DOTS; k++) {
          if (adj[i][j] && adj[j][k] && adj[k][i]) {
            return true; // Formed triangle -> Misère Loss!
          }
        }
      }
    }
    return false;
  };

  const handleEdgeClick = (edgeId: string) => {
    if (winner) return;
    if (aiPlayers[turn]) return;

    const edge = edges.find(e => e.id === edgeId);
    if (!edge || edge.color) return;

    makeMove(edgeId, turn);
  };

  const makeMove = (edgeId: string, playerColor: 'red' | 'blue') => {
    soundFx.playMove();
    const newEdges = edges.map(e => (e.id === edgeId ? { ...e, color: playerColor } : e));
    setEdges(newEdges);

    if (checkTriangleLoss(newEdges, playerColor)) {
      const isUserWin = (playerColor !== userColor);
      soundFx.playGameOver(isUserWin);
      setWinner(playerColor === 'red' ? 'blue' : 'red');
      return;
    }

    setTurn(playerColor === 'red' ? 'blue' : 'red');
  };

  // AI Logic
  useEffect(() => {
    if (aiPlayers[turn] && !winner) {
      const timer = setTimeout(() => {
        const available = edges.filter(e => e.color === null);
        if (available.length === 0) return;

        let safeEdges: Edge[] = [];
        for (const e of available) {
          const testEdges = edges.map(item => (item.id === e.id ? { ...item, color: turn as any } : item));
          if (!checkTriangleLoss(testEdges, turn)) {
            safeEdges.push(e);
          }
        }

        const chosen = safeEdges.length > 0
          ? safeEdges[Math.floor(Math.random() * safeEdges.length)]
          : available[Math.floor(Math.random() * available.length)];

        makeMove(chosen.id, turn);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, edges, aiPlayers]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[540px] mx-auto p-4 bg-slate-900/90 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        userColorId={userColor}
        onUserColorChange={(id) => {
          const col = id as 'red' | 'blue';
          setUserColor(col);
          setAiPlayers({
            red: col === 'blue',
            blue: col === 'red',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'red',
            name: 'Red Lines',
            colorHex: '#ef4444',
            isAi: aiPlayers.red,
            isUser: userColor === 'red',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, red: !prev.red })),
          },
          {
            id: 'blue',
            name: 'Blue Lines',
            colorHex: '#3b82f6',
            isAi: aiPlayers.blue,
            isUser: userColor === 'blue',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, blue: !prev.blue })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-purple-400/30">
            🔺
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Sim (Triangle Game)
            </h3>
            <p className="text-xs text-gray-300">
              Draw lines between dots. Misère rule: AVOID forming a same-color triangle!
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

      {/* Turn Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-bold">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'red' ? 'bg-red-500/20 text-red-300 border border-red-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-300" />
          <span>Red {userColor === 'red' ? '(You)' : aiPlayers.red ? '(AI)' : '(Human)'}</span>
        </div>
        <span className="text-gray-500 uppercase font-extrabold tracking-widest text-[10px]">
          {winner ? 'Game Over' : `Turn: ${turn === 'red' ? 'Red' : 'Blue'}`}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${turn === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40' : 'text-gray-400'}`}>
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-300" />
          <span>Blue {userColor === 'blue' ? '(You)' : aiPlayers.blue ? '(AI)' : '(Human)'}</span>
        </div>
      </div>

      {/* Graph Vector Canvas */}
      <div className="relative w-full aspect-square max-w-[360px] bg-slate-950 border-2 border-purple-500/40 rounded-full p-4 flex items-center justify-center shadow-2xl overflow-hidden">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Edges */}
          {edges.map(e => {
            const p1 = dots[e.u];
            const p2 = dots[e.v];
            const isClickable = !e.color && !winner && !aiPlayers[turn];

            return (
              <line
                key={e.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={e.color === 'red' ? '#ef4444' : e.color === 'blue' ? '#3b82f6' : '#334155'}
                strokeWidth={e.color ? 5 : 2}
                strokeDasharray={e.color ? undefined : '4 4'}
                onClick={() => isClickable && handleEdgeClick(e.id)}
                className={`transition-all ${isClickable ? 'hover:stroke-amber-400 hover:stroke-[6px] cursor-pointer' : ''}`}
              />
            );
          })}

          {/* Vertices */}
          {dots.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={12}
                fill="#0f172a"
                stroke="#f3ce6b"
                strokeWidth={3}
                className="shadow-xl"
              />
              <text
                x={pt.x}
                y={pt.y + 4}
                textAnchor="middle"
                fill="#ffe89e"
                fontSize={10}
                fontWeight="black"
              >
                {idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-purple-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'red'
                  ? 'Red Team Wins! Blue Formed A Triangle!'
                  : 'Blue Team Wins! Red Formed A Triangle!'}
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
