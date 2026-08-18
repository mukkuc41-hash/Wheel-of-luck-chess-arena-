import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Target, Shield, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface BattleshipBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
}

type Ship = { name: string; size: number; coords: { r: number; c: number }[]; hits: number };

export const BattleshipBoard: React.FC<BattleshipBoardProps> = ({ gameMode: initialMode = 'ai' }) => {
  const GRID_SIZE = 10;
  const SHIP_SPECS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 },
  ];

  // Grid states
  const [playerGrid, setPlayerGrid] = useState<( 'S' | 'H' | 'M' | null )[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);

  const [enemyGrid, setEnemyGrid] = useState<( 'S' | 'H' | 'M' | null )[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [enemyShips, setEnemyShips] = useState<Ship[]>([]);

  const [phase, setPhase] = useState<'setup' | 'battle' | 'finished'>('setup');
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Fleet Deployment Phase');

  // Options state
  const [userSide, setUserSide] = useState<'cyan' | 'red'>('cyan');
  const [aiPlayers, setAiPlayers] = useState<Record<'cyan' | 'red', boolean>>({
    cyan: false,
    red: true,
  });

  // Random ship placement helper
  const generateRandomShips = (): { grid: ('S' | null)[][]; ships: Ship[] } => {
    const grid: ('S' | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const ships: Ship[] = [];

    for (const spec of SHIP_SPECS) {
      let placed = false;
      while (!placed) {
        const isHoriz = Math.random() < 0.5;
        const maxR = isHoriz ? GRID_SIZE : GRID_SIZE - spec.size;
        const maxC = isHoriz ? GRID_SIZE - spec.size : GRID_SIZE;

        const r = Math.floor(Math.random() * maxR);
        const c = Math.floor(Math.random() * maxC);

        let canPlace = true;
        const coords: { r: number; c: number }[] = [];

        for (let i = 0; i < spec.size; i++) {
          const currR = isHoriz ? r : r + i;
          const currC = isHoriz ? c + i : c;
          if (grid[currR][currC]) {
            canPlace = false;
            break;
          }
          coords.push({ r: currR, c: currC });
        }

        if (canPlace) {
          coords.forEach(pt => { grid[pt.r][pt.c] = 'S'; });
          ships.push({ name: spec.name, size: spec.size, coords, hits: 0 });
          placed = true;
        }
      }
    }

    return { grid, ships };
  };

  const setupFleet = () => {
    const p = generateRandomShips();
    const e = generateRandomShips();

    setPlayerGrid(p.grid);
    setPlayerShips(p.ships);
    setEnemyGrid(e.grid);
    setEnemyShips(e.ships);

    setPhase('battle');
    setTurn('player');
    setWinner(null);
    setStatusMsg('Target Enemy Radar Grid to Fire Missiles!');
  };

  useEffect(() => {
    setupFleet();
  }, []);

  const resetGame = () => {
    setupFleet();
  };

  const handleFire = (r: number, c: number) => {
    if (phase !== 'battle' || turn !== 'player') return;
    if (enemyGrid[r][c] === 'H' || enemyGrid[r][c] === 'M') return;

    soundFx.playMove();
    const newEnemyGrid = enemyGrid.map(row => [...row]);

    if (newEnemyGrid[r][c] === 'S') {
      newEnemyGrid[r][c] = 'H';
      soundFx.playCapture();

      // Update ship hit counts
      const newEnemyShips = enemyShips.map(s => {
        if (s.coords.some(pt => pt.r === r && pt.c === c)) {
          return { ...s, hits: s.hits + 1 };
        }
        return s;
      });

      setEnemyGrid(newEnemyGrid);
      setEnemyShips(newEnemyShips);

      // Check sunk ship
      const hitShip = newEnemyShips.find(s => s.coords.some(pt => pt.r === r && pt.c === c));
      if (hitShip && hitShip.hits === hitShip.size) {
        setStatusMsg(`DIRECT HIT! Enemy ${hitShip.name} SUNK!`);
      } else {
        setStatusMsg('DIRECT HIT on Enemy Ship!');
      }

      // Check win condition
      if (newEnemyShips.every(s => s.hits === s.size)) {
        setWinner('player');
        setPhase('finished');
        setStatusMsg('VICTORY! Enemy Fleet Completely Destroyed!');
        return;
      }
    } else {
      newEnemyGrid[r][c] = 'M';
      setEnemyGrid(newEnemyGrid);
      setStatusMsg('MISSILE MISSED! Enemy turn incoming...');
      setTurn('enemy');
    }
  };

  // Enemy AI Turn
  useEffect(() => {
    if (phase === 'battle' && turn === 'enemy' && !winner) {
      const timer = setTimeout(() => {
        const availableCoords: { r: number; c: number }[] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (playerGrid[r][c] !== 'H' && playerGrid[r][c] !== 'M') {
              availableCoords.push({ r, c });
            }
          }
        }

        if (availableCoords.length === 0) return;

        const target = availableCoords[Math.floor(Math.random() * availableCoords.length)];
        const newPlayerGrid = playerGrid.map(row => [...row]);

        if (newPlayerGrid[target.r][target.c] === 'S') {
          newPlayerGrid[target.r][target.c] = 'H';

          const newPlayerShips = playerShips.map(s => {
            if (s.coords.some(pt => pt.r === target.r && pt.c === target.c)) {
              return { ...s, hits: s.hits + 1 };
            }
            return s;
          });

          setPlayerGrid(newPlayerGrid);
          setPlayerShips(newPlayerShips);

          if (newPlayerShips.every(s => s.hits === s.size)) {
            setWinner('enemy');
            setPhase('finished');
            setStatusMsg('DEFEAT! Your entire fleet was sunk!');
            return;
          }

          setStatusMsg('ALERT! Your ship was hit by enemy fire!');
        } else {
          newPlayerGrid[target.r][target.c] = 'M';
          setPlayerGrid(newPlayerGrid);
          setStatusMsg('Enemy missile missed your fleet. Your turn to fire!');
        }

        setTurn('player');
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [turn, phase, winner, playerGrid, playerShips]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[660px] mx-auto p-4 bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Universal Options Selector Panel */}
      <GameOptionsControlPanel
        playerCountOptions={[2]}
        playerCount={2}
        userColorId={userSide}
        onUserColorChange={(id) => {
          const s = id as 'cyan' | 'red';
          setUserSide(s);
          setAiPlayers({
            cyan: s === 'red',
            red: s === 'cyan',
          });
          resetGame();
        }}
        playerSlots={[
          {
            id: 'cyan',
            name: 'Cyan Fleet (P1)',
            colorHex: '#06b6d4',
            isAi: aiPlayers.cyan,
            isUser: userSide === 'cyan',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, cyan: !prev.cyan })),
          },
          {
            id: 'red',
            name: 'Red Fleet (P2)',
            colorHex: '#ef4444',
            isAi: aiPlayers.red,
            isUser: userSide === 'red',
            onToggleAi: () => setAiPlayers(prev => ({ ...prev, red: !prev.red })),
          },
        ]}
        onResetGame={resetGame}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-800 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-cyan-400/30">
            🚢
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-[#ffe89e]">
              Battleship Arena
            </h3>
            <p className="text-xs text-gray-300">
              Locate and sink all 5 hidden enemy ships before they sink yours!
            </p>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset Fleet</span>
        </button>
      </div>

      {/* Status Banner */}
      <div className="w-full text-center py-2 px-4 rounded-xl bg-cyan-950/60 border border-cyan-400/30 text-cyan-200 text-xs font-mono font-bold shadow-md">
        {statusMsg}
      </div>

      {/* Dual Radar & Fleet Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Enemy Radar Grid (Targeting) */}
        <div className="bg-slate-950 border border-cyan-500/40 p-3 rounded-2xl flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-extrabold uppercase tracking-wider">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Enemy Radar Grid</span>
          </div>

          <div className="grid grid-cols-10 gap-1 w-full aspect-square max-w-[260px]">
            {enemyGrid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`e_${r}_${c}`}
                  onClick={() => handleFire(r, c)}
                  disabled={phase !== 'battle' || turn !== 'player' || cell === 'H' || cell === 'M'}
                  className={`aspect-square rounded border transition flex items-center justify-center text-[10px] font-black ${
                    cell === 'H'
                      ? 'bg-red-600/90 border-red-400 text-white animate-pulse'
                      : cell === 'M'
                      ? 'bg-slate-800 border-slate-700 text-cyan-400'
                      : 'bg-cyan-950/40 hover:bg-cyan-600/40 border-cyan-900/60 cursor-pointer'
                  }`}
                >
                  {cell === 'H' ? '💥' : cell === 'M' ? '•' : ''}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Player Fleet Grid */}
        <div className="bg-slate-950 border border-indigo-500/40 p-3 rounded-2xl flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Your Battleship Fleet</span>
          </div>

          <div className="grid grid-cols-10 gap-1 w-full aspect-square max-w-[260px]">
            {playerGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`p_${r}_${c}`}
                  className={`aspect-square rounded border flex items-center justify-center text-[10px] font-black ${
                    cell === 'H'
                      ? 'bg-red-600 border-red-400 text-white'
                      : cell === 'M'
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : cell === 'S'
                      ? 'bg-indigo-600 border-indigo-400 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {cell === 'H' ? '🔥' : cell === 'S' ? '🛡️' : cell === 'M' ? '•' : ''}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-400/40 rounded-2xl p-4 text-center space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-cyan-300 font-black text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {winner === 'player'
                  ? 'COMMANDER VICTORY! Enemy Fleet Destroyed!'
                  : 'DEFEAT! Enemy Fleet Overran Your Forces!'}
              </span>
            </div>
            <button
              onClick={resetGame}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              Start New Battle
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
