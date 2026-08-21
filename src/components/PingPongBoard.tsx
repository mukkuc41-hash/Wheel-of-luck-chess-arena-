import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Bot,
  Users,
  Sparkles,
  Zap,
  Flame,
  HelpCircle,
  Play,
  Pause,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

export type PingPongMode = 'match11' | 'match21' | 'endlessRally';
export type PingPongOpponent = 'ai' | 'pvp' | 'wall';

interface PingPongBoardProps {
  gameMode?: 'pvp' | 'ai' | 'local';
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason?: string) => void;
}

export const PingPongBoard: React.FC<PingPongBoardProps> = ({
  gameMode: externalGameMode = 'local',
  onGameEnd,
}) => {
  const [matchMode, setMatchMode] = useState<PingPongMode>('match11');
  const [opponentType, setOpponentType] = useState<PingPongOpponent>(
    externalGameMode === 'ai' ? 'ai' : 'pvp'
  );
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Match State
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [currentRally, setCurrentRally] = useState<number>(0);
  const [bestRally, setBestRally] = useState<number>(0);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Move your paddle to serve the ball!');
  const [serverPlayer, setServerPlayer] = useState<1 | 2>(1);

  // Table Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Virtual Dimensions (400 width x 500 height)
  const TABLE_W = 400;
  const TABLE_H = 500;
  const PADDLE_W = 74;
  const PADDLE_H = 14;
  const BALL_R = 7;

  // Ball & Paddle state references for 60fps loop
  const ballRef = useRef({
    x: 200,
    y: 430,
    vx: 0,
    vy: 0,
    speed: 5.5,
    spin: 0,
    inPlay: false,
    lastHitBy: 1 as 1 | 2,
  });

  const playerPaddleRef = useRef({
    x: 200 - PADDLE_W / 2,
    targetX: 200 - PADDLE_W / 2,
    vx: 0,
  });

  const opponentPaddleRef = useRef({
    x: 200 - PADDLE_W / 2,
    targetX: 200 - PADDLE_W / 2,
    vx: 0,
  });

  // Sound sync
  useEffect(() => {
    soundFx.setEnabled(soundActive);
  }, [soundActive]);

  // Target winning score
  const targetWinningScore = matchMode === 'match11' ? 11 : matchMode === 'match21' ? 21 : 999;

  // Reset Ball for Serve
  const resetServe = useCallback((server: 1 | 2 = 1) => {
    const isP1 = server === 1;
    ballRef.current = {
      x: isP1 ? playerPaddleRef.current.x + PADDLE_W / 2 : opponentPaddleRef.current.x + PADDLE_W / 2,
      y: isP1 ? TABLE_H - 70 : 70,
      vx: 0,
      vy: 0,
      speed: 5.5,
      spin: 0,
      inPlay: false,
      lastHitBy: server,
    };
    setCurrentRally(0);
    setStatusMessage(
      server === 1
        ? 'Your Serve: Tap table or move paddle to hit!'
        : `${opponentType === 'ai' ? 'AI Bot' : 'Player 2'} Serve: Ready!`
    );

    // Auto AI serve
    if (server === 2 && opponentType === 'ai') {
      setTimeout(() => {
        if (!ballRef.current.inPlay && matchWinner === null) {
          const angle = (Math.random() - 0.5) * 1.2;
          ballRef.current.vx = Math.sin(angle) * 5.5;
          ballRef.current.vy = Math.cos(angle) * 5.5;
          ballRef.current.inPlay = true;
          soundFx.playPaddleHit(false);
        }
      }, 1000);
    }
  }, [opponentType, matchWinner]);

  // Reset Entire Match
  const resetMatch = useCallback(
    (mode: PingPongMode = matchMode) => {
      setPlayerScore(0);
      setOpponentScore(0);
      setCurrentRally(0);
      setMatchWinner(null);
      setIsPaused(false);
      setServerPlayer(1);
      playerPaddleRef.current.x = 200 - PADDLE_W / 2;
      opponentPaddleRef.current.x = 200 - PADDLE_W / 2;
      resetServe(1);
    },
    [matchMode, resetServe]
  );

  useEffect(() => {
    resetMatch(matchMode);
  }, [matchMode, opponentType, resetMatch]);

  // Serve Ball by Click or Space
  const launchBall = () => {
    if (ballRef.current.inPlay || matchWinner !== null) return;
    const isP1 = serverPlayer === 1;
    const directionY = isP1 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    ballRef.current.vx = Math.sin(angle) * ballRef.current.speed;
    ballRef.current.vy = directionY * Math.cos(angle) * ballRef.current.speed;
    ballRef.current.inPlay = true;
    soundFx.playPaddleHit(false);
    setStatusMessage('Rally in progress! Keep the ball moving!');
  };

  // Main 60 FPS Physics & Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isPaused && matchWinner === null) {
        // 1. Move Player Paddle towards target
        const p1 = playerPaddleRef.current;
        const prevP1X = p1.x;
        p1.x += (p1.targetX - p1.x) * 0.35;
        p1.x = Math.max(16, Math.min(TABLE_W - PADDLE_W - 16, p1.x));
        p1.vx = p1.x - prevP1X;

        // 2. Move Opponent / AI Paddle
        const p2 = opponentPaddleRef.current;
        if (opponentType === 'ai') {
          // AI Tracking behavior
          const errorOffset =
            aiDifficulty === 'easy' ? 24 : aiDifficulty === 'medium' ? 12 : 3;
          const target = ballRef.current.x - PADDLE_W / 2 + (Math.sin(time * 0.003) * errorOffset);
          const aiSpeed = aiDifficulty === 'easy' ? 0.09 : aiDifficulty === 'medium' ? 0.16 : 0.28;
          p2.targetX += (target - p2.targetX) * aiSpeed;
        } else if (opponentType === 'wall') {
          // Solo Wall Mode
          p2.targetX = 16;
        }
        const prevP2X = p2.x;
        p2.x += (p2.targetX - p2.x) * 0.35;
        p2.x = Math.max(16, Math.min(TABLE_W - PADDLE_W - 16, p2.x));
        p2.vx = p2.x - prevP2X;

        // 3. Move Ball
        const b = ballRef.current;
        if (b.inPlay) {
          b.x += b.vx;
          b.y += b.vy;

          // Side Cushions Bounce
          if (b.x - BALL_R <= 16) {
            b.x = 16 + BALL_R;
            b.vx = -b.vx * 0.98;
            soundFx.playTableBounce();
          } else if (b.x + BALL_R >= TABLE_W - 16) {
            b.x = TABLE_W - 16 - BALL_R;
            b.vx = -b.vx * 0.98;
            soundFx.playTableBounce();
          }

          // Net Line Sound (at y = 250)
          if (Math.abs(b.y - 250) < 6 && Math.random() < 0.08) {
            soundFx.playTableBounce();
          }

          // 4. Collision with Player Paddle (Bottom, y ~ 455)
          const p1Y = TABLE_H - 45;
          if (
            b.vy > 0 &&
            b.y + BALL_R >= p1Y &&
            b.y - BALL_R <= p1Y + PADDLE_H &&
            b.x >= p1.x - 4 &&
            b.x <= p1.x + PADDLE_W + 4
          ) {
            // Hit by Player 1!
            const hitPos = (b.x - (p1.x + PADDLE_W / 2)) / (PADDLE_W / 2); // -1.0 (left edge) to 1.0 (right edge)
            const isSmash = Math.abs(p1.vx) > 5;
            b.speed = Math.min(11, b.speed + 0.3);

            const bounceAngle = hitPos * 1.05; // max ~60 deg
            b.vx = Math.sin(bounceAngle) * b.speed + p1.vx * 0.3;
            b.vy = -Math.cos(bounceAngle) * b.speed;
            b.y = p1Y - BALL_R - 1;
            b.lastHitBy = 1;

            soundFx.playPaddleHit(isSmash);
            setCurrentRally((r) => {
              const next = r + 1;
              setBestRally((b) => Math.max(b, next));
              return next;
            });
          }

          // 5. Collision with Opponent Paddle / Wall (Top, y ~ 45)
          const p2Y = 45;
          if (opponentType === 'wall') {
            // Top wall bounce in solo wall practice mode
            if (b.y - BALL_R <= 20) {
              b.y = 20 + BALL_R;
              b.vy = Math.abs(b.vy);
              soundFx.playTableBounce();
            }
          } else if (
            b.vy < 0 &&
            b.y - BALL_R <= p2Y + PADDLE_H &&
            b.y + BALL_R >= p2Y &&
            b.x >= p2.x - 4 &&
            b.x <= p2.x + PADDLE_W + 4
          ) {
            // Hit by Opponent / AI!
            const hitPos = (b.x - (p2.x + PADDLE_W / 2)) / (PADDLE_W / 2);
            const isSmash = Math.abs(p2.vx) > 5;
            b.speed = Math.min(11, b.speed + 0.3);

            const bounceAngle = hitPos * 1.05;
            b.vx = Math.sin(bounceAngle) * b.speed + p2.vx * 0.3;
            b.vy = Math.cos(bounceAngle) * b.speed;
            b.y = p2Y + PADDLE_H + BALL_R + 1;
            b.lastHitBy = 2;

            soundFx.playPaddleHit(isSmash);
            setCurrentRally((r) => {
              const next = r + 1;
              setBestRally((b) => Math.max(b, next));
              return next;
            });
          }

          // 6. Point Scored Check
          // Out past Player's baseline (Bottom Miss -> Opponent scores)
          if (b.y > TABLE_H + 20) {
            soundFx.playFoul();
            setOpponentScore((s) => {
              const nextScore = s + 1;
              if (nextScore >= targetWinningScore && matchMode !== 'endlessRally') {
                setMatchWinner(2);
                setStatusMessage(`🏆 ${opponentType === 'ai' ? 'AI Bot' : 'Player 2'} Wins the Match!`);
                soundFx.playWin();
                if (onGameEnd) onGameEnd('b', 'Ping Pong Victory');
              } else {
                setServerPlayer(1);
                resetServe(1);
              }
              return nextScore;
            });
          }
          // Out past Opponent's baseline (Top Miss -> Player 1 scores)
          else if (b.y < -20 && opponentType !== 'wall') {
            soundFx.playWin();
            setPlayerScore((s) => {
              const nextScore = s + 1;
              if (nextScore >= targetWinningScore && matchMode !== 'endlessRally') {
                setMatchWinner(1);
                setStatusMessage('🏆 Player 1 Wins the Table Tennis Match!');
                soundFx.playWin();
                if (onGameEnd) onGameEnd('w', 'Ping Pong Champion');
              } else {
                setServerPlayer(2);
                resetServe(2);
              }
              return nextScore;
            });
          }
        } else {
          // Ball follows current server paddle before serve
          if (serverPlayer === 1) {
            b.x = p1.x + PADDLE_W / 2;
            b.y = TABLE_H - 65;
          } else {
            b.x = p2.x + PADDLE_W / 2;
            b.y = 65;
          }
        }
      }

      // 7. Render Table Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, TABLE_W, TABLE_H);

          // Outer Floor & Table Wood Edge
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, TABLE_W, TABLE_H);

          // Table Blue Surface
          ctx.fillStyle = '#1e3a8a'; // Deep ITTF Blue
          ctx.fillRect(16, 16, TABLE_W - 32, TABLE_H - 32);

          // White Boundary Border Lines
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(16, 16, TABLE_W - 32, TABLE_H - 32);

          // Center White Service Line
          ctx.beginPath();
          ctx.moveTo(TABLE_W / 2, 16);
          ctx.lineTo(TABLE_W / 2, TABLE_H - 16);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center Net (at y = 250)
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(8, 248, TABLE_W - 16, 4);

          // Net Post Caps & Mesh Net Texture
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(4, 244, 8, 12);
          ctx.fillRect(TABLE_W - 12, 244, 8, 12);

          // Render Opponent Paddle (Top)
          if (opponentType !== 'wall') {
            const p2 = opponentPaddleRef.current;
            ctx.fillStyle = '#ef4444'; // Red Paddle Rubber
            ctx.beginPath();
            ctx.roundRect(p2.x, 45, PADDLE_W, PADDLE_H, 6);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Render Player Paddle (Bottom)
          const p1 = playerPaddleRef.current;
          ctx.fillStyle = '#22c55e'; // Green/Black Rubber
          ctx.beginPath();
          ctx.roundRect(p1.x, TABLE_H - 45, PADDLE_W, PADDLE_H, 6);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Render Ping Pong Ball (Orange 40mm ball)
          const b = ballRef.current;
          // Ball Shadow
          ctx.beginPath();
          ctx.arc(b.x + 3, b.y + 4, BALL_R, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fill();

          // Ball Body
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
          ctx.fillStyle = '#fb923c'; // Tournament Orange
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, matchWinner, opponentType, aiDifficulty, targetWinningScore, matchMode, onGameEnd, resetServe]);

  // Touch & Mouse Event Handlers for Player Paddle
  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = TABLE_W / rect.width;
    const scaleY = TABLE_H / rect.height;

    const posX = (clientX - rect.left) * scaleX;
    const posY = (clientY - rect.top) * scaleY;

    // If 2P local mode and touch in top half, control opponent paddle
    if (opponentType === 'pvp' && posY < TABLE_H / 2) {
      opponentPaddleRef.current.targetX = posX - PADDLE_W / 2;
    } else {
      playerPaddleRef.current.targetX = posX - PADDLE_W / 2;
    }

    if (!ballRef.current.inPlay && matchWinner === null) {
      launchBall();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-white">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
            🏓
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Ping Pong Classic
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30 uppercase font-mono">
                {matchMode}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Fast-Paced Paddle Rally Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => resetMatch()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
            title="Restart Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Select Tabs */}
      <div className="w-full grid grid-cols-3 gap-2 mb-3">
        {(['match11', 'match21', 'endlessRally'] as PingPongMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMatchMode(m);
              soundFx.playClick();
            }}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold uppercase transition flex items-center justify-center gap-1 border ${
              matchMode === m
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20 font-bold'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-800'
            }`}
          >
            {m === 'match11' ? 'First to 11' : m === 'match21' ? 'First to 21' : 'Endless Rally'}
          </button>
        ))}
      </div>

      {/* Score & Rally Dashboard */}
      <div className="w-full grid grid-cols-3 gap-2 mb-3">
        {/* Player 1 Score */}
        <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" /> P1 (Green)
          </span>
          <div className="text-2xl font-black text-white font-mono">{playerScore}</div>
        </div>

        {/* Live Rally Counter */}
        <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-center flex flex-col justify-center">
          <span className="text-[10px] text-blue-300 uppercase font-semibold">Rally Count</span>
          <div className="text-xl font-black text-amber-300 font-mono flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-amber-400" /> {currentRally}
          </div>
          <span className="text-[9px] text-slate-400">Best: {bestRally}</span>
        </div>

        {/* Opponent Score */}
        <div className="p-2.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-center">
          <span className="text-[11px] font-bold text-red-400 flex items-center justify-center gap-1">
            {opponentType === 'ai' ? <Bot className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {opponentType === 'ai' ? 'AI Bot' : 'P2 (Red)'}
          </span>
          <div className="text-2xl font-black text-white font-mono">{opponentScore}</div>
        </div>
      </div>

      {/* Table Tennis Arena Stage */}
      <div className="relative w-full max-w-[360px] aspect-[4/5] flex items-center justify-center mb-3">
        <canvas
          ref={canvasRef}
          width={TABLE_W}
          height={TABLE_H}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onClick={launchBall}
          onTouchStart={launchBall}
          className="w-full h-full rounded-2xl shadow-2xl border-4 border-slate-800 touch-none select-none cursor-pointer"
        />

        {/* Serve Prompt Banner */}
        <AnimatePresence>
          {!ballRef.current.inPlay && matchWinner === null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none bg-slate-950/90 border border-amber-400 text-amber-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Tap table to serve ball!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Overlay */}
        <AnimatePresence>
          {matchWinner !== null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-center p-5 backdrop-blur-sm border-2 border-amber-400 space-y-3"
            >
              <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
              <h3 className="text-xl font-black text-white">
                {matchWinner === 1 ? 'Player 1 Champion!' : `${opponentType === 'ai' ? 'AI Bot' : 'Player 2'} Champion!`}
              </h3>
              <p className="text-xs text-slate-300">
                Final Score: {playerScore} - {opponentScore} | Longest Rally: {bestRally}
              </p>
              <button
                onClick={() => resetMatch()}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
              >
                Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Opponent Settings & Status */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
        <div className="text-xs text-slate-300 text-center sm:text-left flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => {
                setOpponentType('pvp');
                resetMatch();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentType === 'pvp' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              2P Local
            </button>
            <button
              onClick={() => {
                setOpponentType('ai');
                resetMatch();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentType === 'ai' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              AI Bot
            </button>
            <button
              onClick={() => {
                setOpponentType('wall');
                resetMatch();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                opponentType === 'wall' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              Wall
            </button>
          </div>

          {opponentType === 'ai' && (
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-amber-300 text-xs rounded-xl px-2 py-1 outline-none font-semibold"
            >
              <option value="easy">Easy Bot</option>
              <option value="medium">Medium Bot</option>
              <option value="hard">Pro Bot</option>
            </select>
          )}
        </div>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  🏓 Ping Pong Rules & Controls
                </h3>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <p>
                  <strong>Objective:</strong> Return the ball across the center net onto your
                  opponent's side. First player to reach 11 (or 21) points wins the game!
                </p>
                <p>
                  <strong>Controls:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Slide finger or mouse horizontally to maneuver your paddle.</li>
                  <li>Hit the ball with the edges of your paddle to produce angled slice returns.</li>
                  <li>Move paddle rapidly upon impact to trigger a high-velocity Smash shot!</li>
                </ul>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Let's Rally!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
