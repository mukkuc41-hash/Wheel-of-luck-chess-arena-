import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Trophy,
  Zap,
  Play,
  CheckCircle2,
  Sparkles,
  Timer,
  Target,
  Hash,
  Flame,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Award,
  Users,
  User,
  Bot,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { GameOptionsControlPanel } from './GameOptionsControlPanel';

interface FindTheNumberBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

interface NumberNode {
  id: string;
  num: number;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  region: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky' | 'palm';
}

export const FindTheNumberBoard: React.FC<FindTheNumberBoardProps> = ({
  gameMode: initialMode = 'local',
  onGameEnd,
}) => {
  // Game Configuration State
  const [playMode, setPlayMode] = useState<'solo' | 'coop' | 'ai'>('solo');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Round Gameplay State
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [targetNum, setTargetNum] = useState<number | null>(null);
  const [nodes, setNodes] = useState<NumberNode[]>([]);
  const [foundTarget, setFoundTarget] = useState<boolean>(false);
  const [wrongNodeId, setWrongNodeId] = useState<string | null>(null);

  // Cross Grid State (5x5 = 25 cells)
  const TOTAL_CELLS = 25;
  const [filledCells, setFilledCells] = useState<boolean[]>(Array(TOTAL_CELLS).fill(false));
  const [filledCount, setFilledCount] = useState<number>(0);

  // Timing & Score Metrics
  const [elapsedTime, setElapsedTime] = useState<number>(0.0);
  const [numberFindTime, setNumberFindTime] = useState<number | null>(null);
  const [crossFillTime, setCrossFillTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('find_number_best_time');
    return saved ? parseFloat(saved) : null;
  });
  const [streakCount, setStreakCount] = useState<number>(0);
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState<number>(0);

  // UI status & announcement
  const [statusMessage, setStatusMessage] = useState<string>(
    'Press "Start Game" to generate a target number and start the speed challenge!'
  );
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  // Refs for timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const findStartTimeRef = useRef<number>(0);

  // Synthesize sound helpers
  const playSfx = (type: 'start' | 'click' | 'correct' | 'wrong' | 'cross' | 'win') => {
    if (!soundActive) return;
    try {
      if (type === 'start' || type === 'click') soundFx.playMove();
      else if (type === 'correct') soundFx.playCapture();
      else if (type === 'wrong') soundFx.playCheck();
      else if (type === 'cross') soundFx.playMove();
      else if (type === 'win') soundFx.playGameOver(true);
    } catch {
      // Fallback safe
    }
  };

  // Generate realistic hand layout coordinates for numbers 1..100
  const generateHandCoordinates = (total: number): { x: number; y: number; region: NumberNode['region'] }[] => {
    const coords: { x: number; y: number; region: NumberNode['region'] }[] = [];

    for (let i = 0; i < total; i++) {
      let x = 50;
      let y = 50;
      let region: NumberNode['region'] = 'palm';

      if (i < 6) {
        // Thumb (Left outward flare)
        region = 'thumb';
        x = 12 + i * 4.5;
        y = 52 - i * 5;
      } else if (i < 13) {
        // Index finger (Upper Left-Center)
        region = 'index';
        const idx = i - 6;
        x = 32 + idx * 2.8;
        y = 26 - idx * 3.5;
      } else if (i < 20) {
        // Middle finger (Center Tallest)
        region = 'middle';
        const idx = i - 13;
        x = 48 + (idx % 2 === 0 ? -2 : 2);
        y = 12 + idx * 4.2;
      } else if (i < 27) {
        // Ring finger (Upper Right-Center)
        region = 'ring';
        const idx = i - 20;
        x = 64 + idx * 2.6;
        y = 19 + idx * 3.5;
      } else if (i < 33) {
        // Pinky finger (Far Right)
        region = 'pinky';
        const idx = i - 27;
        x = 78 + idx * 2.5;
        y = 36 + idx * 4.5;
      } else {
        // Palm area (Center-Bottom matrix)
        region = 'palm';
        const idx = i - 33;
        x = 28 + (idx % 4) * 14 + (Math.random() * 6 - 3);
        y = 58 + Math.floor(idx / 4) * 12 + (Math.random() * 6 - 3);
      }

      // Constrain boundaries within hand silhouette (10% - 90%)
      const clampedX = Math.max(8, Math.min(88, Math.round(x)));
      const clampedY = Math.max(8, Math.min(88, Math.round(y)));

      coords.push({ x: clampedX, y: clampedY, region });
    }

    return coords;
  };

  // Initialize the hand board with 35 distinct random numbers (1-100)
  const initializeHandBoard = () => {
    const nums: number[] = [];
    while (nums.length < 35) {
      const r = Math.floor(Math.random() * 100) + 1;
      if (!nums.includes(r)) nums.push(r);
    }

    const coordinates = generateHandCoordinates(nums.length);

    const newNodes: NumberNode[] = nums.map((num, index) => ({
      id: `node_${index}_${num}`,
      num,
      x: coordinates[index].x,
      y: coordinates[index].y,
      region: coordinates[index].region,
    }));

    setNodes(newNodes);
    return newNodes;
  };

  // Start new round
  const startGame = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const generatedNodes = initializeHandBoard();
    const chosenTarget = generatedNodes[Math.floor(Math.random() * generatedNodes.length)].num;

    setTargetNum(chosenTarget);
    setFoundTarget(false);
    setWrongNodeId(null);
    setFilledCells(Array(TOTAL_CELLS).fill(false));
    setFilledCount(0);
    setElapsedTime(0.0);
    setNumberFindTime(null);
    setCrossFillTime(null);
    setGameFinished(false);
    setGameActive(true);

    setStatusMessage(`Step 1: Locate and click target number ${chosenTarget} on the hand diagram!`);
    playSfx('start');

    startTimeRef.current = Date.now();
    findStartTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const currentElapsed = (now - startTimeRef.current) / 1000;
      setElapsedTime(parseFloat(currentElapsed.toFixed(1)));
    }, 100);
  };

  // Handle clicking a number on the hand board
  const handleNodeClick = (node: NumberNode) => {
    if (!gameActive || foundTarget) return;

    if (node.num === targetNum) {
      // Correct number found!
      const findDuration = (Date.now() - findStartTimeRef.current) / 1000;
      setNumberFindTime(parseFloat(findDuration.toFixed(1)));
      setFoundTarget(true);
      setWrongNodeId(null);
      playSfx('correct');

      setStatusMessage(
        playMode === 'coop'
          ? `🎉 Number found by P1! Player 2: Sprint-tap all 25 cross boxes below!`
          : `🎉 Target ${node.num} Found! Step 2: Quickly fill all 25 boxes in the action cross grid below!`
      );
    } else {
      // Wrong number clicked
      setWrongNodeId(node.id);
      playSfx('wrong');
      setTimeout(() => {
        setWrongNodeId((prev) => (prev === node.id ? null : prev));
      }, 350);
    }
  };

  // Handle clicking a cell in the 5x5 cross grid
  const handleCellClick = (index: number) => {
    if (!gameActive || !foundTarget) return;
    if (filledCells[index]) return;

    const newFilled = [...filledCells];
    newFilled[index] = true;
    const newCount = filledCount + 1;

    setFilledCells(newFilled);
    setFilledCount(newCount);
    playSfx('cross');

    if (newCount === TOTAL_CELLS) {
      // Complete Victory!
      finishGame();
    }
  };

  // Complete Game Round
  const finishGame = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameActive(false);
    setGameFinished(true);

    const totalSeconds = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    setElapsedTime(totalSeconds);

    if (numberFindTime !== null) {
      const crossSeconds = parseFloat(Math.max(0.1, totalSeconds - numberFindTime).toFixed(1));
      setCrossFillTime(crossSeconds);
    }

    setTotalRoundsCompleted((prev) => prev + 1);
    setStreakCount((prev) => prev + 1);

    // Check & save personal best
    if (!bestTime || totalSeconds < bestTime) {
      setBestTime(totalSeconds);
      localStorage.setItem('find_number_best_time', totalSeconds.toString());
    }

    playSfx('win');
    setStatusMessage(`🏆 CHALLENGE COMPLETE! Finished in ${totalSeconds}s! (Find: ${numberFindTime || 0}s, Grid: ${(totalSeconds - (numberFindTime || 0)).toFixed(1)}s)`);

    // Report stats
    if (onGameEnd) {
      onGameEnd('w', 'speed_challenge_completed');
    }
  };

  // AI Automatic bot assistance in AI Battle mode
  useEffect(() => {
    if (playMode === 'ai' && gameActive && foundTarget && filledCount < TOTAL_CELLS) {
      const aiTapInterval = setInterval(() => {
        setFilledCells((prev) => {
          const nextUnfilledIdx = prev.findIndex((f) => !f);
          if (nextUnfilledIdx === -1) return prev;
          const updated = [...prev];
          updated[nextUnfilledIdx] = true;
          setFilledCount((cnt) => {
            const nextCnt = cnt + 1;
            if (nextCnt >= TOTAL_CELLS) {
              setTimeout(() => finishGame(), 50);
            }
            return nextCnt;
          });
          playSfx('cross');
          return updated;
        });
      }, 160);

      return () => clearInterval(aiTapInterval);
    }
  }, [playMode, gameActive, foundTarget, filledCount]);

  // Initial preview board setup on mount
  useEffect(() => {
    initializeHandBoard();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Raw HTML Code snippet for embedding / downloading
  const singleFileHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Find the Number - Hand Speed Challenge</title>
<style>
:root { --bg-color: #0f172a; --card-bg: #1e293b; --accent: #38bdf8; --accent-hover: #0ea5e9; --text-color: #f8fafc; --danger: #f43f5e; --success: #22c55e; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
h1 { margin-bottom: 5px; text-align: center; font-size: 1.8rem; color: var(--accent); }
p.instructions { text-align: center; color: #94a3b8; max-width: 600px; margin-bottom: 20px; font-size: 0.95rem; }
.game-container { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 650px; background: var(--card-bg); padding: 20px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.scoreboard { display: flex; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 12px 20px; border-radius: 8px; font-weight: bold; }
.control-panel { display: flex; justify-content: center; gap: 15px; align-items: center; }
button { background-color: var(--accent); color: #0f172a; border: none; padding: 10px 20px; font-size: 1rem; font-weight: bold; border-radius: 8px; cursor: pointer; transition: background 0.2s, transform 0.1s; }
button:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
.target-display { font-size: 1.2rem; font-weight: bold; }
.target-display span { color: var(--danger); font-size: 1.5rem; }
.board-wrapper { position: relative; background: #ffffff; border-radius: 12px; padding: 15px; min-height: 320px; display: flex; justify-content: center; align-items: center; overflow: hidden; }
.hand-board { position: relative; width: 300px; height: 340px; border: 2px dashed #cbd5e1; border-radius: 40px 40px 20px 20px; background: #f8fafc; }
.number-node { position: absolute; width: 28px; height: 28px; font-size: 0.75rem; font-weight: bold; color: #334155; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; user-select: none; }
.number-node:hover { background: var(--accent); color: #fff; transform: scale(1.15); }
.number-node.selected { background: var(--success); color: white; box-shadow: 0 0 10px var(--success); }
.cross-section { display: flex; flex-direction: column; align-items: center; gap: 10px; background: rgba(15, 23, 42, 0.4); padding: 15px; border-radius: 8px; }
.cross-grid { display: grid; grid-template-columns: repeat(5, 40px); grid-template-rows: repeat(5, 40px); gap: 5px; }
.cross-cell { background: #334155; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; color: var(--danger); cursor: pointer; user-select: none; transition: background 0.1s; }
.cross-cell:hover { background: #475569; }
.cross-cell.filled { background: #1e293b; }
.status-message { text-align: center; font-weight: bold; min-height: 24px; color: var(--accent); }
</style>
</head>
<body>
<h1>Find the Number: Hand Challenge</h1>
<p class="instructions">Click "Start Game", look for the target number hidden inside the hand layout, circle it, then complete the cross-fill grid box as fast as possible!</p>
<div class="game-container">
    <div class="scoreboard">
        <div>⏱️ Time: <span id="timer">0.0</span>s</div>
        <div>🏆 Status: <span id="game-status">Ready</span></div>
    </div>
    <div class="control-panel">
        <div class="target-display">Find: <span id="target-number">--</span></div>
        <button id="start-btn" onclick="startGame()">Start Game</button>
    </div>
    <div class="status-message" id="instruction-msg">Press Start Game to begin round.</div>
    <div class="board-wrapper">
        <div class="hand-board" id="hand-board"></div>
    </div>
    <div class="cross-section">
        <div style="font-size: 0.9rem; color: #94a3b8;">Player 2 Action Grid: Fill all boxes with crosses (X) after finding the number!</div>
        <div class="cross-grid" id="cross-grid"></div>
    </div>
</div>
<script>
    let targetNum = null, timerInterval = null, startTime = null, gameActive = false, numbersList = [], totalCellsToFill = 25, filledCount = 0;
    const handBoard = document.getElementById('hand-board'), crossGrid = document.getElementById('cross-grid'), targetNumberDisplay = document.getElementById('target-number'), timerDisplay = document.getElementById('timer'), gameStatus = document.getElementById('game-status'), instructionMsg = document.getElementById('instruction-msg');
    function initHandBoard() {
        handBoard.innerHTML = ''; numbersList = [];
        let nums = []; while(nums.length < 35) { let r = Math.floor(Math.random() * 100) + 1; if(!nums.includes(r)) nums.push(r); }
        const coordinates = generateHandCoordinates(nums.length);
        nums.forEach((num, index) => {
            numbersList.push(num); const node = document.createElement('div'); node.className = 'number-node'; node.innerText = num;
            node.style.left = coordinates[index].x + '%'; node.style.top = coordinates[index].y + '%';
            node.onclick = () => checkNumberSelection(num, node); handBoard.appendChild(node);
        });
    }
    function generateHandCoordinates(total) {
        let coords = [];
        for(let i = 0; i < total; i++) {
            let x, y;
            if (i < 7) { x = 15 + (i * 5); y = 45 - (i * 4); }
            else if (i < 14) { x = 35 + ((i-7) * 3); y = 20 - ((i-7) * 2); }
            else if (i < 21) { x = 50 + ((i-14) * 2); y = 10; }
            else if (i < 28) { x = 65 + ((i-21) * 4); y = 25 + ((i-21) * 3); }
            else { x = 30 + (Math.random() * 40); y = 55 + (Math.random() * 35); }
            coords.push({ x: Math.max(5, Math.min(85, x)), y: Math.max(5, Math.min(85, y)) });
        }
        return coords;
    }
    function initCrossGrid() {
        crossGrid.innerHTML = ''; filledCount = 0;
        for(let i = 0; i < totalCellsToFill; i++) {
            const cell = document.createElement('div'); cell.className = 'cross-cell';
            cell.onclick = () => { if(!gameActive) return; if(!cell.classList.contains('filled')) { cell.classList.add('filled'); cell.innerText = 'X'; filledCount++; checkWinCondition(); } };
            crossGrid.appendChild(cell);
        }
    }
    function startGame() {
        initHandBoard(); initCrossGrid(); targetNum = numbersList[Math.floor(Math.random() * numbersList.length)];
        targetNumberDisplay.innerText = targetNum; gameActive = true; gameStatus.innerText = "Playing...";
        instructionMsg.innerText = "Step 1: Find and click number " + targetNum + " on the hand board!";
        startTime = Date.now(); clearInterval(timerInterval);
        timerInterval = setInterval(() => { timerDisplay.innerText = ((Date.now() - startTime) / 1000).toFixed(1); }, 100);
        document.getElementById('start-btn').innerText = "Restart";
    }
    function checkNumberSelection(num, nodeElement) {
        if(!gameActive) return;
        if(num === targetNum) { nodeElement.classList.add('selected'); instructionMsg.innerText = "Correct! Step 2: Quickly fill all boxes in the cross grid below!"; }
        else { nodeElement.style.background = 'var(--danger)'; setTimeout(() => nodeElement.style.background = '#e2e8f0', 300); }
    }
    function checkWinCondition() {
        if(filledCount === totalCellsToFill && gameActive) {
            gameActive = false; clearInterval(timerInterval); gameStatus.innerText = "Finished! 🎉";
            instructionMsg.innerText = "Challenge completed in " + timerDisplay.innerText + " seconds!";
        }
    }
    initHandBoard(); initCrossGrid();
</script>
</body>
</html>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(singleFileHtmlCode);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="w-full max-w-[850px] mx-auto flex flex-col gap-4 text-white font-sans">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#111e38] to-[#0d1627] border-2 border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow backdrop accent */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300">
              🖐️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-cyan-300 tracking-wide font-mono">
                  FIND THE NUMBER
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 text-[10px] font-extrabold uppercase tracking-wider">
                  Hand Speed Challenge
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Locate the scattered number on the hand diagram, circle it, then sprint-fill the 25-cell action cross grid!
              </p>
            </div>
          </div>

          {/* Mode & Sound Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-1 flex items-center gap-1">
              <button
                onClick={() => setPlayMode('solo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  playMode === 'solo'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Solo Speedrun</span>
              </button>
              <button
                onClick={() => setPlayMode('coop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  playMode === 'coop'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2P Co-Op</span>
              </button>
              <button
                onClick={() => setPlayMode('ai')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  playMode === 'ai'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Assist</span>
              </button>
            </div>

            <button
              onClick={() => setSoundActive(!soundActive)}
              className="p-2.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white transition shadow"
              title="Toggle Sound Effects"
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow"
              title="Copy Standalone HTML code snippet"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHtml ? 'Copied HTML!' : 'Export HTML'}</span>
            </button>
          </div>
        </div>

        {/* Live Scoreboard Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10 text-xs">
          {/* Target Number */}
          <div className="bg-[#070d1a] border border-cyan-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <Target className="w-4 h-4 text-rose-400" />
              <span>Target:</span>
            </div>
            <span className="text-xl font-black font-mono text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
              {targetNum !== null ? targetNum : '--'}
            </span>
          </div>

          {/* Precision Timer */}
          <div className="bg-[#070d1a] border border-cyan-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Stopwatch:</span>
            </div>
            <span className="text-xl font-black font-mono text-amber-300">
              {elapsedTime.toFixed(1)}s
            </span>
          </div>

          {/* Grid Fill Progress */}
          <div className="bg-[#070d1a] border border-cyan-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Cross Grid:</span>
            </div>
            <span className="text-sm font-black font-mono text-cyan-300">
              {filledCount} / {TOTAL_CELLS}
            </span>
          </div>

          {/* Best Time Record */}
          <div className="bg-[#070d1a] border border-cyan-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Best PB:</span>
            </div>
            <span className="text-sm font-black font-mono text-yellow-300">
              {bestTime !== null ? `${bestTime}s` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Left Arena: Stylized Hand Diagram Board */}
        <div className="bg-[#0a0f1d] border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
          {/* Top Status & Start / Reset Row */}
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  gameActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-bold text-slate-300">
                {gameActive ? (foundTarget ? 'Phase 2: Filling Crosses' : 'Phase 1: Hunting Number') : 'Ready to Start'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startGame}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95 border border-cyan-200"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{gameActive ? 'Restart Round' : 'Start Game'}</span>
              </button>
            </div>
          </div>

          {/* Instruction Prompter */}
          <div
            className={`w-full py-2 px-3.5 rounded-2xl border text-xs font-bold text-center transition ${
              gameFinished
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : foundTarget
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : gameActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-white/5 text-slate-400'
            }`}
          >
            {statusMessage}
          </div>

          {/* Interactive Hand Board Canvas Container */}
          <div className="relative w-full max-w-[440px] aspect-[4/5] bg-gradient-to-b from-[#0e1628] via-[#091122] to-[#060a14] rounded-3xl border-2 border-cyan-500/30 p-4 shadow-inner flex items-center justify-center select-none overflow-hidden group">
            {/* SVG Hand Illustration Backdrop */}
            <svg
              viewBox="0 0 400 480"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              {/* Hand Silhouette Path with Palm & 5 Fingers */}
              <defs>
                <linearGradient id="handGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Hand Outline */}
              <path
                d="M 120 450 
                   C 100 400, 60 330, 40 280 
                   C 25 240, 45 220, 65 240 
                   C 95 270, 115 300, 125 260
                   C 115 190, 105 110, 130 90
                   C 148 75, 165 95, 160 140
                   C 160 180, 165 210, 175 160
                   C 175 90, 185 40, 205 35
                   C 225 35, 235 80, 230 150
                   C 235 190, 240 210, 250 170
                   C 260 110, 275 75, 295 85
                   C 310 95, 305 140, 295 190
                   C 295 230, 305 240, 320 200
                   C 335 160, 355 180, 350 220
                   C 340 270, 335 340, 300 400
                   C 270 450, 210 460, 120 450 Z"
                fill="url(#handGlow)"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Finger Crease Dividers */}
              <line x1="125" y1="260" x2="165" y2="290" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="175" y1="240" x2="235" y2="250" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="250" y1="245" x2="295" y2="265" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="120" y1="380" x2="280" y2="380" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.3" />
            </svg>

            {/* Scattered Number Nodes in Hand Region */}
            {nodes.map((node) => {
              const isTarget = node.num === targetNum;
              const isFound = isTarget && foundTarget;
              const isWrong = wrongNodeId === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  disabled={!gameActive || foundTarget}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                    isFound
                      ? 'bg-emerald-500 text-slate-950 font-black scale-125 ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.9)] z-30 animate-bounce'
                      : isWrong
                      ? 'bg-rose-600 text-white scale-110 ring-2 ring-rose-400 z-20 animate-shake'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-600/80 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-300 hover:scale-115 hover:z-20 active:scale-95'
                  }`}
                >
                  {node.num}
                </button>
              );
            })}
          </div>

          {/* Quick Stats Footnote */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span>🖐️ 35 Numbers Scattered (1-100)</span>
            <span>Rounds Finished: <strong className="text-cyan-300">{totalRoundsCompleted}</strong></span>
            <span>Streak: <strong className="text-amber-300">{streakCount} 🔥</strong></span>
          </div>
        </div>

        {/* Right Arena: Action Cross-Filling Penalty Grid */}
        <div className="bg-[#0a0f1d] border-2 border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider font-mono">
                Action Cross Grid
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                foundTarget
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-white/5'
              }`}
            >
              {foundTarget ? '⚡ ACTIVE (SPRINT!)' : '🔒 LOCKED'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-snug">
            {playMode === 'coop'
              ? 'Player 2 Action: Rapidly tap all 25 boxes below with crosses (X) after Player 1 spots the number!'
              : 'Sprint tap all 25 boxes with crosses (X) immediately after finding the target number!'}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full transition-all duration-150"
              style={{ width: `${(filledCount / TOTAL_CELLS) * 100}%` }}
            />
          </div>

          {/* 5x5 Cross Grid Box Area */}
          <div className="bg-[#060a14] border-2 border-slate-800/80 rounded-2xl p-3 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-2 w-full max-w-[260px] aspect-square">
              {filledCells.map((isFilled, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={!gameActive || !foundTarget || isFilled}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center font-black text-base sm:text-lg transition-all duration-150 select-none shadow-sm ${
                    isFilled
                      ? 'bg-gradient-to-br from-rose-950 to-slate-900 text-rose-400 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)] scale-95'
                      : foundTarget
                      ? 'bg-slate-800/90 hover:bg-slate-700 text-transparent border border-cyan-500/40 hover:border-rose-400 cursor-pointer active:scale-90 hover:shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-900/60 text-transparent border border-white/5 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {isFilled ? '✕' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Breakdown upon completion */}
          {gameFinished && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-400/50 rounded-2xl p-3 space-y-1.5 text-xs text-slate-200"
            >
              <div className="flex items-center gap-1.5 font-black text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Round Complete!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>Reflex Hunt: <strong className="text-cyan-300">{numberFindTime}s</strong></div>
                <div>Cross Tap: <strong className="text-rose-300">{crossFillTime}s</strong></div>
                <div className="col-span-2">Total Time: <strong className="text-amber-300 font-bold">{elapsedTime}s</strong></div>
              </div>
            </motion.div>
          )}

          {/* Instructions Modal / Drawer Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              className="w-full py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showHowToPlay ? 'Hide How to Play' : 'How to Play Rules'}</span>
            </button>

            {showHowToPlay && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-950 border border-white/10 text-[11px] text-slate-300 space-y-1.5">
                <p>1. <strong>Start Round:</strong> Click "Start Game" to spawn 35 random numbers across the hand diagram.</p>
                <p>2. <strong>Locate Target:</strong> Spot the highlighted Target Number (1-100) hidden within the palm or fingers.</p>
                <p>3. <strong>Sprint Action Grid:</strong> Immediately tap all 25 boxes on the action grid with crosses (X).</p>
                <p>4. <strong>Co-op Mode:</strong> Player 1 hunts the target number, Player 2 hammers the cross-fill grid!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
