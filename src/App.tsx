import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import {
  GameSettings,
  GameResult,
  MoveRecord,
  GameMode,
  UserSession,
  ChatMessage,
  MatchRecord,
  ActiveBoardGame,
  LobbyUser,
  AIDifficulty,
} from './types';
import { ChessBoard } from './components/ChessBoard';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { CapturedPieces } from './components/CapturedPieces';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { GameHeader } from './components/GameHeader';
import { GameSettingsModal } from './components/GameSettingsModal';
import { AuthModal } from './components/AuthModal';
import { StatsModal } from './components/StatsModal';
import { ChatPanel } from './components/ChatPanel';
import { MatchmakingModal } from './components/MatchmakingModal';
import { AskGeminiModal } from './components/AskGeminiModal';
import { EvalBar } from './components/EvalBar';
import { PuzzleModal } from './components/PuzzleModal';
import { PositionEditorModal } from './components/PositionEditorModal';
import { CustomChessVariantSandboxModal } from './components/CustomChessVariantSandboxModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SEOHead } from './components/SEOHead';
import { SEOFooter } from './components/SEOFooter';
import { MultiGameHubModal } from './components/MultiGameHubModal';
import { WheelOfLuckMainCatalog, GameCatalogItem } from './components/WheelOfLuckMainCatalog';
import { WheelOfLuckGameLobbyModal, LobbyParticipant } from './components/WheelOfLuckGameLobbyModal';
import { CheckersBoard } from './components/CheckersBoard';
import { BackgammonBoard } from './components/BackgammonBoard';
import { SnakesAndLaddersBoard } from './components/SnakesAndLaddersBoard';
import { LudoBoard } from './components/LudoBoard';
import { GomokuBoard } from './components/GomokuBoard';
import { ReversiBoard } from './components/ReversiBoard';
import { ConnectFourBoard } from './components/ConnectFourBoard';
import { UltimateTicTacToeBoard } from './components/UltimateTicTacToeBoard';
import { DotsAndBoxesBoard } from './components/DotsAndBoxesBoard';
import { BattleshipBoard } from './components/BattleshipBoard';
import { SimBoard } from './components/SimBoard';
import { UnoBoard } from './components/UnoBoard';
import { HeartsBoard } from './components/HeartsBoard';
import { GinRummyBoard } from './components/GinRummyBoard';
import { SpeedBoard } from './components/SpeedBoard';
import { CarromBoard } from './components/CarromBoard';
import { DartsBoard } from './components/DartsBoard';
import { PingPongBoard } from './components/PingPongBoard';
import { ArcadeCanvasModal } from './components/ArcadeCanvasModal';
import { GameBarSelector } from './components/GameBarSelector';
import { GameOptionsControlPanel } from './components/GameOptionsControlPanel';
import { GameRulesModal } from './components/GameRulesModal';
import { AnimationLibraryModal } from './components/AnimationLibraryModal';
import { CinematicChessShowcase } from './components/CinematicChessShowcase';
import { AnimationEffectsMasterHubModal } from './components/AnimationEffectsMasterHubModal';
import { DailyWheelModal } from './components/DailyWheelModal';
import { PlayerStatusCardDeck } from './components/PlayerStatusCardDeck';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { CommunitySocialModal } from './components/CommunitySocialModal';
import { TournamentModal } from './components/TournamentModal';
import { CoachPanel } from './components/CoachPanel';
import { AIDifficultySelector } from './components/AIDifficultySelector';
import { QuestPanel } from './components/QuestPanel';
import { CustomizationModal } from './components/CustomizationModal';
import { VoiceProximityPanel } from './components/VoiceProximityPanel';
import { GlobalUserListSidebar } from './components/telemetry/GlobalUserListSidebar';
import { GlobalAnalyticsDashboardModal } from './components/telemetry/GlobalAnalyticsDashboardModal';
import { GoogleConnectModal } from './components/GoogleConnectModal';
import { telemetryEngine } from './utils/telemetryEngine';
import { evaluateBoard } from './utils/evalEngine';
import { detectOpening } from './utils/openingBook';
import { recordPlayerCaptureForHatrick, updateQuestProgress, applyMatchLossPenalty } from './utils/pointsManager';

import { RotateCcw, BookOpen, Wand2, ShieldAlert, Flame, Sliders, History, Sparkles, Gamepad2 } from 'lucide-react';
import { layoutToFen } from './utils/variantManager';
import { soundFx } from './utils/audio';
import {
  fetchGuestAuth,
  fetchCurrentUser,
  clearStoredToken,
  recordGameResult,
  trackGameOpened,
  syncGameTime,
  hasAgreedPrivacyPolicy,
  agreePrivacyPolicy,
} from './utils/auth';
import { socketService } from './utils/socket';
import { getAIMove } from './utils/aiEngine';

const defaultSettings: GameSettings = {
  boardTheme: 'emerald',
  pieceTheme: 'classic',
  autoFlipBoard: false,
  showLegalMoves: true,
  showLastMove: true,
  soundEnabled: true,
  timeControl: {
    preset: '10+0',
    initialSeconds: 600,
    incrementSeconds: 0,
  },
  whitePlayer: {
    name: 'Player 1',
    avatar: '♔',
  },
  blackPlayer: {
    name: 'Player 2',
    avatar: '♚',
  },
  aiDifficulty: 'medium',
};

export default function App() {
  // Main Chess Engine Instance
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [pgn, setPgn] = useState<string>('');

  // Authentication & User Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Game Mode State: 'pvp' | 'ai' | 'local'
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  // Selected Board Game: ActiveBoardGame
  const [activeBoardGame, setActiveBoardGame] = useState<ActiveBoardGame>('chess');

  // Real-Time PvP Room State
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [myPvPColor, setMyPvPColor] = useState<'w' | 'b' | 'spectator'>('w');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomNotice, setRoomNotice] = useState<string>('');
  const [roomRules, setRoomRules] = useState<{ minimumRating: number; allowChat: boolean; maxPlayers: number } | null>(null);

  // Matchmaking & Modals State
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState<boolean>(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [matchmakingError, setMatchmakingError] = useState<string>('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isWheelCatalogOpen, setIsWheelCatalogOpen] = useState<boolean>(false);
  const [selectedWheelGame, setSelectedWheelGame] = useState<GameCatalogItem | null>(null);
  const [isWheelGameLobbyOpen, setIsWheelGameLobbyOpen] = useState<boolean>(false);
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUser[]>([]);
  const [isAskGeminiOpen, setIsAskGeminiOpen] = useState<boolean>(false);
  const [isPuzzleOpen, setIsPuzzleOpen] = useState<boolean>(false);
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState<boolean>(false);
  const [isCustomSandboxOpen, setIsCustomSandboxOpen] = useState<boolean>(false);
  const [activeCustomVariant, setActiveCustomVariant] = useState<{
    name: string;
    boardSize: number;
    timeLimit: number;
    layout: Record<string, string>;
    theme?: any;
    fen?: string;
  } | null>(null);
  const [isGameHubOpen, setIsGameHubOpen] = useState<boolean>(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState<boolean>(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState<boolean>(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isAnimationLibraryOpen, setIsAnimationLibraryOpen] = useState<boolean>(false);
  const [isCinematicVfxOpen, setIsCinematicVfxOpen] = useState<boolean>(false);
  const [isMasterHubOpen, setIsMasterHubOpen] = useState<boolean>(false);
  const [isDailyWheelOpen, setIsDailyWheelOpen] = useState<boolean>(false);
  const [hatrickNotification, setHatrickNotification] = useState<{ show: boolean; reward: number; streak: number } | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isCompulsoryPrivacy, setIsCompulsoryPrivacy] = useState<boolean>(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms' | 'appflow'>('privacy');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState<boolean>(false);
  const [isArcadeCanvasOpen, setIsArcadeCanvasOpen] = useState<boolean>(false);

  // Settings & Configuration
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Board View State
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Move History & Review Mode
  const [moveRecords, setMoveRecords] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);

  // Game Status
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult>({ winner: null, reason: null });

  // Pawn Promotion Modal
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [compromiseAlert, setCompromiseAlert] = useState<string | null>(null);

  // Clocks State (in seconds)
  const [whiteTime, setWhiteTime] = useState<number>(settings.timeControl.initialSeconds);
  const [blackTime, setBlackTime] = useState<number>(settings.timeControl.initialSeconds);

  const matchStartTimeRef = useRef<number>(Date.now());

  const isUntimed = settings.timeControl.preset === 'untimed';
  const activeTurn = chessRef.current.turn();

  // 1. Initial Guest Auth & Socket Setup
  useEffect(() => {
    async function initAuth() {
      try {
        let user = await fetchCurrentUser();
        if (!user) {
          user = await fetchGuestAuth();
        }
        setCurrentUser(user);

        // Connect socket
        const socket = socketService.connect();
        socketService.authenticate(user.token);

        // Check compulsory privacy & terms agreement
        const agreed = hasAgreedPrivacyPolicy();
        if (!agreed) {
          setIsCompulsoryPrivacy(true);
          setIsPrivacyModalOpen(true);
        } else {
          trackGameOpened(activeBoardGame);
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
      } finally {
        // Smoothly hide preloader overlay once app is ready (3.0s animation)
        if (typeof window !== 'undefined' && window.hideChessProPreloader) {
          window.hideChessProPreloader();
        }
        // Step 1: Open Login Screen immediately after splash animation completes (if privacy already agreed)
        setTimeout(() => {
          if (hasAgreedPrivacyPolicy()) {
            setIsAuthModalOpen(true);
          }
        }, 5200);
      }
    }
    initAuth();

    const handleCompromiseAlert = (e: any) => {
      const msg =
        e.detail?.message ||
        'Security Anomaly Prevented: Token reuse attempt detected. All active session tokens across all devices were globally revoked.';
      setCompromiseAlert(msg);
      setCurrentUser(null);
      setIsAuthModalOpen(true);
    };

    window.addEventListener('token_compromised_alert', handleCompromiseAlert);

    const handleHatrickAchieved = (e: any) => {
      const { reward, streak } = e.detail || { reward: 2000, streak: 3 };
      setHatrickNotification({ show: true, reward, streak });
      soundFx.playGameOver(true);
      setTimeout(() => {
        setHatrickNotification(null);
      }, 6000);
    };

    window.addEventListener('chess_hatrick_achieved', handleHatrickAchieved);

    return () => {
      window.removeEventListener('token_compromised_alert', handleCompromiseAlert);
      window.removeEventListener('chess_hatrick_achieved', handleHatrickAchieved);
    };
  }, []);

  // Sync current user session and connected lobby users into global telemetry engine
  useEffect(() => {
    if (currentUser?.username) {
      const activeGameId = selectedWheelGame?.id || 'chess';
      const roomTitle = selectedWheelGame ? `${selectedWheelGame.name} Arena - Room #${activeRoomId || '001'}` : 'Main Platform Lobby';
      telemetryEngine.updateLocalUserSession(
        currentUser.username,
        currentUser.stats,
        currentUser.isGuest,
        activeGameId,
        roomTitle
      );
    }
    lobbyUsers.forEach((lu) => {
      if (lu.username && lu.username !== currentUser?.username) {
        telemetryEngine.updateLocalUserSession(
          lu.username,
          undefined,
          false,
          'chess',
          'Multiplayer Match Arena'
        );
      }
    });
  }, [currentUser, selectedWheelGame, activeRoomId, lobbyUsers]);

  // Track each game open event whenever a game is switched or loaded
  useEffect(() => {
    if (hasAgreedPrivacyPolicy()) {
      trackGameOpened(activeBoardGame);
    }
  }, [activeBoardGame]);

  // Periodic active gameplay duration synchronization (starts when user agreements privacy policy and starts playing)
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasAgreedPrivacyPolicy() && isGameActive && !isPaused) {
        syncGameTime(10, activeBoardGame);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isGameActive, isPaused, activeBoardGame]);

  // 2. Socket.io Event Handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('lobby:users', (users: LobbyUser[]) => {
      setLobbyUsers(users);
    });

    socket.on('matchmaking:waiting', () => {
      setMatchmakingStatus('waiting');
    });

    socket.on('game:started', (data: { roomId: string; whiteUsername: string; blackUsername: string; fen: string; communityNotice?: string; roomRules?: any }) => {
      setActiveRoomId(data.roomId);
      setIsMatchmakingOpen(false);
      setMatchmakingStatus('idle');
      setCreatedRoomCode(null);
      if (data.communityNotice !== undefined) setRoomNotice(data.communityNotice);
      if (data.roomRules) setRoomRules(data.roomRules);

      // Determine player color
      const isWhite = data.whiteUsername.toLowerCase() === currentUser?.username.toLowerCase();
      const myColor: 'w' | 'b' = isWhite ? 'w' : 'b';
      setMyPvPColor(myColor);
      setOrientation(myColor);

      // Update Player Names
      setSettings((prev) => ({
        ...prev,
        whitePlayer: { ...prev.whitePlayer, name: data.whiteUsername },
        blackPlayer: { ...prev.blackPlayer, name: data.blackUsername },
      }));

      // Reset Board
      chessRef.current.reset();
      setFen(chessRef.current.fen());
      setMoveRecords([]);
      setCurrentMoveIndex(-1);
      setIsGameActive(true);
      setGameResult({ winner: null, reason: null });
      setWhiteTime(settings.timeControl.initialSeconds);
      setBlackTime(settings.timeControl.initialSeconds);
      setChatMessages([]);
      soundFx.playClick();
    });

    socket.on('room:created', (data: { roomId: string; room?: any }) => {
      setCreatedRoomCode(data.roomId);
      setActiveRoomId(data.roomId);
      setMyPvPColor('w');
      setOrientation('w');
      setIsSpectator(false);
      if (data.room?.communityNotice !== undefined) setRoomNotice(data.room.communityNotice);
      if (data.room?.roomRules) setRoomRules(data.room.roomRules);
    });

    socket.on('room:joined', (data: { roomId: string; myColor: 'w' | 'b' | 'spectator'; isSpectator?: boolean; room?: any; communityNotice?: string; roomRules?: any }) => {
      setActiveRoomId(data.roomId);
      setIsMatchmakingOpen(false);
      setMatchmakingStatus('idle');
      setCreatedRoomCode(null);
      if (data.communityNotice !== undefined) setRoomNotice(data.communityNotice);
      else if (data.room?.communityNotice !== undefined) setRoomNotice(data.room.communityNotice);
      if (data.roomRules) setRoomRules(data.roomRules);
      else if (data.room?.roomRules) setRoomRules(data.room.roomRules);

      if (data.isSpectator || data.myColor === 'spectator') {
        setIsSpectator(true);
        setMyPvPColor('spectator');
      } else {
        setIsSpectator(false);
        setMyPvPColor(data.myColor);
        setOrientation(data.myColor);
      }

      if (data.room) {
        setSettings((prev) => ({
          ...prev,
          whitePlayer: { ...prev.whitePlayer, name: data.room.whiteUsername || 'White' },
          blackPlayer: { ...prev.blackPlayer, name: data.room.blackUsername || 'Black' },
        }));
        if (data.room.fen) {
          try {
            chessRef.current.load(data.room.fen);
            setFen(chessRef.current.fen());
          } catch (e) {}
        }
      }
      setIsGameActive(true);
      soundFx.playClick();
    });

    socket.on('room:error', (data: { message: string }) => {
      setMatchmakingError(data.message);
    });

    socket.on('game:moved', (data: { from: Square; to: Square; promotion?: string; fen: string; san: string; turn: 'w' | 'b' }) => {
      try {
        const moveRes = chessRef.current.move({
          from: data.from,
          to: data.to,
          promotion: data.promotion || 'q',
        });
        if (moveRes) {
          const newFen = chessRef.current.fen();
          setFen(newFen);
          setPgn(chessRef.current.pgn());
          setLastMove({ from: data.from, to: data.to });

          const record: MoveRecord = {
            san: moveRes.san,
            from: data.from,
            to: data.to,
            piece: moveRes.piece,
            captured: moveRes.captured,
            promotion: moveRes.promotion,
            color: moveRes.color,
            fen: newFen,
            moveNumber: Math.ceil((moveRecords.length + 1) / 2),
          };

          setMoveRecords((prev) => [...prev, record]);
          setCurrentMoveIndex((prev) => prev + 1);

          if (chessRef.current.isCheckmate()) {
            soundFx.playGameOver(true);
          } else if (chessRef.current.isCheck()) {
            soundFx.playCheck();
          } else if (moveRes.captured) {
            soundFx.playCapture();
          } else {
            soundFx.playMove();
          }
        }
      } catch (err) {
        console.error('Error handling socket move:', err);
      }
    });

    socket.on('game:ended', (data: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
      setIsGameActive(false);
      setGameResult({ winner: data.winner, reason: data.reason as any });
      const userLost = data.winner !== null && data.winner !== 'draw' && data.winner !== myPvPColor;
      if (userLost) {
        applyMatchLossPenalty(activeBoardGame, 10000);
        soundFx.playGameOver(false);
      } else {
        soundFx.playGameOver(data.winner !== null && data.winner !== 'draw');
      }
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('game:draw_offered', (data: { offeredBy: string }) => {
      if (window.confirm(`${data.offeredBy} is offering a draw. Do you accept?`)) {
        socket.emit('game:draw_respond', { roomId: activeRoomId, accept: true });
      } else {
        socket.emit('game:draw_respond', { roomId: activeRoomId, accept: false });
      }
    });

    return () => {
      socket.off('lobby:users');
      socket.off('lobby:spin_result');
      socket.off('matchmaking:waiting');
      socket.off('game:started');
      socket.off('room:created');
      socket.off('room:error');
      socket.off('game:moved');
      socket.off('game:ended');
      socket.off('chat:message');
      socket.off('game:draw_offered');
    };
  }, [activeRoomId, currentUser, moveRecords.length, settings.timeControl.initialSeconds]);

  // Sync soundFx setting
  useEffect(() => {
    soundFx.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Clock Timer
  useEffect(() => {
    if (isUntimed || !isGameActive || isPaused || gameResult.winner !== null) return;

    const timer = setInterval(() => {
      if (activeTurn === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTurn, isGameActive, isPaused, isUntimed, gameResult.winner]);

  // Player vs AI Engine Turn Trigger
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      isGameActive &&
      gameResult.winner === null &&
      activeTurn === 'b'
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(chessRef.current, settings.aiDifficulty);
        if (aiMove) {
          executeMove(aiMove.from, aiMove.to, aiMove.promotion);
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [gameMode, isGameActive, gameResult.winner, activeTurn, settings.aiDifficulty]);

  // Derived captured pieces
  const capturedPieces = React.useMemo(() => {
    const whiteCaps: ('p' | 'n' | 'b' | 'r' | 'q')[] = [];
    const blackCaps: ('p' | 'n' | 'b' | 'r' | 'q')[] = [];

    moveRecords.slice(0, currentMoveIndex + 1).forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          whiteCaps.push(m.captured as 'p' | 'n' | 'b' | 'r' | 'q');
        } else {
          blackCaps.push(m.captured as 'p' | 'n' | 'b' | 'r' | 'q');
        }
      }
    });

    return { white: whiteCaps, black: blackCaps };
  }, [moveRecords, currentMoveIndex]);

  // Find King square if in check
  const kingInCheckSquare = React.useMemo(() => {
    if (!chessRef.current.isCheck()) return null;
    const board = chessRef.current.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === activeTurn) {
          return piece.square as Square;
        }
      }
    }
    return null;
  }, [fen, activeTurn]);

  // Execute Move Core Logic
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: 'q' | 'r' | 'b' | 'n') => {
      const chess = chessRef.current;
      const piece = chess.get(from);

      // Check promotion requirement
      if (
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1')) &&
        !promotionPiece
      ) {
        setPendingPromotion({ from, to });
        return;
      }

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotionPiece || 'q',
        });

        if (!moveResult) return;

        // Sounds & Voice Announcement
        if (chess.isCheckmate()) {
          soundFx.playGameOver(true);
        } else if (chess.isCheck()) {
          soundFx.playCheck();
        } else if (moveResult.captured) {
          soundFx.playCapture();
        } else {
          soundFx.playMove();
        }
        soundFx.announceMove(moveResult.san);

        const newFen = chess.fen();
        const newPgn = chess.pgn();
        setFen(newFen);
        setPgn(newPgn);
        setLastMove({ from, to });

        const record: MoveRecord = {
          san: moveResult.san,
          from,
          to,
          piece: moveResult.piece,
          captured: moveResult.captured,
          promotion: moveResult.promotion,
          color: moveResult.color,
          fen: newFen,
          moveNumber: Math.ceil((moveRecords.length + 1) / 2),
        };

        const updatedHistory = [...moveRecords, record];
        setMoveRecords(updatedHistory);
        setCurrentMoveIndex(updatedHistory.length - 1);

        // Update Quest & Hatrick Progress for player actions
        const isPlayerTurn = (gameMode === 'ai' && moveResult.color === orientation) ||
                             (gameMode === 'local') ||
                             (gameMode === 'pvp' && moveResult.color === myPvPColor);

        if (isPlayerTurn) {
          updateQuestProgress('moves', 1);

          if (moveResult.captured) {
            recordPlayerCaptureForHatrick(moveResult.captured);
            updateQuestProgress('capture', 1);
          }

          if (chess.isCheck()) {
            updateQuestProgress('check', 1);
          }

          if (moveResult.san.includes('O-O')) {
            updateQuestProgress('castle', 1);
          }

          if (moveResult.promotion) {
            updateQuestProgress('promote', 1);
          }
        }

        // Check game over conditions
        let isGameOver = false;
        let winnerRes: 'w' | 'b' | 'draw' = 'draw';
        let reasonRes = '';

        if (chess.isCheckmate()) {
          isGameOver = true;
          winnerRes = moveResult.color;
          reasonRes = 'checkmate';
          setIsGameActive(false);
          setGameResult({ winner: winnerRes, reason: 'checkmate' });
          const userColorCode = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
          if (winnerRes !== userColorCode) {
            applyMatchLossPenalty('chess', 10000);
          }
          if (isPlayerTurn && winnerRes === moveResult.color) {
            updateQuestProgress('win', 1);
          }
        } else if (chess.isStalemate()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'stalemate';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'stalemate' });
        } else if (chess.isThreefoldRepetition()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'threefold';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'threefold' });
        } else if (chess.isInsufficientMaterial()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'insufficient';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'insufficient' });
        } else if (chess.isDraw()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'agreement';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'agreement' });
        }

        // Emit over socket if in PvP mode
        if (gameMode === 'pvp' && activeRoomId) {
          const socket = socketService.getSocket();
          socket?.emit('game:move', {
            roomId: activeRoomId,
            from,
            to,
            promotion: promotionPiece || 'q',
            fen: newFen,
            san: moveResult.san,
            isGameOver,
            winner: winnerRes,
            reason: reasonRes,
          });
        }

        // Record AI game if finished
        if (isGameOver && gameMode === 'ai') {
          recordGameResult({
            gameType: activeBoardGame,
            mode: 'ai',
            whiteUsername: currentUser?.username || 'Guest',
            blackUsername: `Computer (${settings.aiDifficulty})`,
            winner: winnerRes,
            reason: reasonRes,
            moveCount: updatedHistory.length,
            pgn: newPgn,
            moves: updatedHistory,
            timeControlPreset: settings.timeControl.preset,
          });
        }
      } catch (err) {
        console.error('Invalid move attempted:', err);
      }
    },
    [activeBoardGame, activeRoomId, currentUser?.username, gameMode, moveRecords, settings.aiDifficulty, settings.timeControl.preset]
  );

  // Handle Timeout
  const handleTimeout = useCallback((loserColor: 'w' | 'b') => {
    soundFx.playGameOver(false);
    setIsGameActive(false);
    const winnerColor = loserColor === 'w' ? 'b' : 'w';
    const userColorCode = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
    if (loserColor === userColorCode) {
      applyMatchLossPenalty('chess', 10000);
    }
    setGameResult({
      winner: winnerColor,
      reason: 'timeout',
    });
  }, [gameMode, myPvPColor, orientation]);

  // Handle Game End for any of the 18 platform board games
  const handleBoardGameEnd = useCallback(
    (gameType: ActiveBoardGame, w: 'w' | 'b' | 'draw', reason?: string) => {
      const durationSec = Math.max(5, Math.round((Date.now() - matchStartTimeRef.current) / 1000));
      const userColorCode: 'w' | 'b' = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
      const isDefeat = w !== 'draw' && w !== userColorCode;

      // Deduct 10,000 points in 96 FX Hub & user points manager on any match defeat
      if (isDefeat) {
        applyMatchLossPenalty(gameType, 10000);
        soundFx.playGameOver(false);
      } else if (w !== 'draw') {
        soundFx.playGameOver(true);
      }

      recordGameResult({
        gameType,
        mode: gameMode,
        whiteUsername: currentUser?.username || 'Guest',
        blackUsername: gameMode === 'ai' ? 'Computer' : 'Player 2',
        winner: w,
        reason: reason || `${gameType}_match_end`,
        moveCount: 15,
        durationSeconds: durationSec,
      });

      setGameResult({
        winner: w,
        reason: reason || `${gameType}_completed`,
      });
    },
    [currentUser?.username, gameMode, myPvPColor, orientation]
  );

  // Reset Game
  const resetGame = (forceClassical: boolean | React.MouseEvent = false) => {
    const shouldForceClassical = forceClassical === true;
    if (activeCustomVariant && !shouldForceClassical && activeCustomVariant.boardSize === 8) {
      const customFen = activeCustomVariant.fen || layoutToFen(activeCustomVariant.layout, 8);
      try {
        chessRef.current.load(customFen);
      } catch {
        chessRef.current.reset();
      }
    } else {
      chessRef.current.reset();
      if (shouldForceClassical) {
        setActiveCustomVariant(null);
      }
    }
    setFen(chessRef.current.fen());
    setPgn('');
    setLastMove(null);
    setMoveRecords([]);
    setCurrentMoveIndex(-1);
    setIsGameActive(true);
    setIsPaused(false);
    setGameResult({ winner: null, reason: null });
    setWhiteTime(settings.timeControl.initialSeconds);
    setBlackTime(settings.timeControl.initialSeconds);
    soundFx.playClick();
  };

  // Undo Move (Single-Player & Local mode)
  const handleUndoMove = () => {
    if (gameMode === 'pvp' || moveRecords.length === 0) return;

    const undoCount = gameMode === 'ai' && moveRecords.length >= 2 ? 2 : 1;
    for (let i = 0; i < undoCount; i++) {
      chessRef.current.undo();
    }

    const newHistory = moveRecords.slice(0, Math.max(0, moveRecords.length - undoCount));
    setMoveRecords(newHistory);
    setCurrentMoveIndex(newHistory.length - 1);
    setFen(chessRef.current.fen());
    setPgn(chessRef.current.pgn());

    const prevMove = newHistory[newHistory.length - 1];
    setLastMove(prevMove ? { from: prevMove.from as Square, to: prevMove.to as Square } : null);
    soundFx.playClick();
  };

  // Reviewing historical move positions
  const handleSelectMoveIndex = (index: number) => {
    soundFx.playClick();
    setCurrentMoveIndex(index);

    const tempChess = new Chess();
    if (index === -1) {
      setFen(tempChess.fen());
      setLastMove(null);
      return;
    }

    const targetRecord = moveRecords[index];
    if (targetRecord) {
      for (let i = 0; i <= index; i++) {
        const m = moveRecords[i];
        if (m) tempChess.move({ from: m.from as Square, to: m.to as Square, promotion: m.promotion });
      }
      setFen(tempChess.fen());
      setLastMove({ from: targetRecord.from as Square, to: targetRecord.to as Square });
    }
  };

  const handleResign = () => {
    soundFx.playGameOver(false);
    setIsGameActive(false);
    const winningColor = activeTurn === 'w' ? 'b' : 'w';
    applyMatchLossPenalty(activeBoardGame, 10000);
    setGameResult({
      winner: winningColor,
      reason: 'resignation',
    });

    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('game:resign', { roomId: activeRoomId });
    } else if (gameMode === 'ai') {
      recordGameResult({
        gameType: activeBoardGame,
        mode: 'ai',
        whiteUsername: currentUser?.username || 'Guest',
        blackUsername: `Computer (${settings.aiDifficulty})`,
        winner: winningColor,
        reason: 'resignation',
        moveCount: moveRecords.length,
        pgn,
        moves: moveRecords,
        timeControlPreset: settings.timeControl.preset,
      });
    }
  };

  const handleOfferDraw = () => {
    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('game:draw_offer', { roomId: activeRoomId });
    } else if (window.confirm('Do both players agree to a draw?')) {
      setIsGameActive(false);
      setGameResult({
        winner: 'draw',
        reason: 'agreement',
      });
    }
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('chat:send', { roomId: activeRoomId, text });
    } else {
      const msg: ChatMessage = {
        id: `local_${Date.now()}`,
        sender: currentUser?.username || 'Guest',
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, msg]);
    }
  };

  // Replay Past Match
  const handleReplayMatch = (match: MatchRecord) => {
    chessRef.current.reset();
    const tempMoves: MoveRecord[] = [];

    match.moves.forEach((m, idx) => {
      const moveRes = chessRef.current.move({
        from: m.from,
        to: m.to,
        promotion: m.promotion,
      });
      if (moveRes) {
        tempMoves.push({
          san: moveRes.san,
          from: m.from,
          to: m.to,
          piece: moveRes.piece,
          captured: moveRes.captured,
          promotion: moveRes.promotion,
          color: moveRes.color,
          fen: chessRef.current.fen(),
          moveNumber: Math.ceil((idx + 1) / 2),
        });
      }
    });

    setMoveRecords(tempMoves);
    setCurrentMoveIndex(tempMoves.length - 1);
    setFen(chessRef.current.fen());
    setPgn(chessRef.current.pgn());
    setIsGameActive(false);
    setGameResult({ winner: match.winner as any, reason: match.reason as any });
  };

  const isReviewMode = currentMoveIndex < moveRecords.length - 1;

  // Real-time Opening Book & Evaluation Meter
  const detectedOpening = React.useMemo(() => {
    return detectOpening(moveRecords.map((m) => m.san));
  }, [moveRecords]);

  const evalResult = React.useMemo(() => {
    return evaluateBoard(chessRef.current);
  }, [fen]);

  // Determine board interaction read-only rule
  const isMyTurnInPvP = gameMode === 'pvp' ? activeTurn === myPvPColor : true;
  const isReadOnlyBoard = !isGameActive || isReviewMode || !isMyTurnInPvP;

  return (
    <div
      className="min-h-screen text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(at 0% 0%, #1e1b4b 0px, transparent 50%), radial-gradient(at 100% 0%, #312e81 0px, transparent 50%), radial-gradient(at 100% 100%, #4338ca 0px, transparent 50%), radial-gradient(at 0% 100%, #1e293b 0px, transparent 50%), #0f172a',
      }}
    >
      <SEOHead />

      {/* Top Banner: Made in India & Owner Badge */}
      <div className="w-full bg-[#0a0806]/95 border-b border-[#f3ce6b]/40 py-2 px-4 text-center flex flex-col items-center justify-center gap-1.5 z-40 relative shadow-md">
        {/* Top: Made in India with India Flag */}
        <div className="flex items-center justify-center gap-2">
          {/* India Flag Vector Badge */}
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-950/70 via-stone-900/90 to-emerald-950/70 border border-orange-500/40 px-3 py-0.5 rounded-full shadow-md backdrop-blur-md">
            <svg
              className="w-5 h-3.5 rounded-[2px] shadow-sm overflow-hidden shrink-0 border border-white/20"
              viewBox="0 0 900 600"
              aria-label="Flag of India"
            >
              <rect width="900" height="200" fill="#FF9933" />
              <rect y="200" width="900" height="200" fill="#FFFFFF" />
              <rect y="400" width="900" height="200" fill="#138808" />
              <g transform="translate(450, 300)">
                <circle r="80" fill="none" stroke="#000080" strokeWidth="6" />
                <circle r="16" fill="#000080" />
                {Array.from({ length: 24 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={80 * Math.cos((i * 15 * Math.PI) / 180)}
                    y2={80 * Math.sin((i * 15 * Math.PI) / 180)}
                    stroke="#000080"
                    strokeWidth="3.5"
                  />
                ))}
              </g>
            </svg>
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-orange-400 via-stone-100 to-emerald-400 bg-clip-text text-transparent">
              Made in India
            </span>
          </span>
        </div>

        {/* Below: Owner: Aditya */}
        <div className="flex items-center justify-center">
          <span className="text-xs font-black tracking-widest uppercase text-[#ffe89e] bg-[#14100c]/90 border border-[#f3ce6b]/50 px-4 py-0.5 rounded-full shadow-lg shadow-[#f3ce6b]/15 backdrop-blur-md flex items-center gap-1.5">
            <span className="text-amber-400 text-sm">👑</span>
            <span>OWNER:</span>
            <strong className="text-white font-extrabold tracking-wider">Aditya</strong>
          </span>
        </div>
      </div>

      {/* Top Navigation */}
      <GameHeader
        activeBoardGame={activeBoardGame}
        gameMode={gameMode}
        onChangeGameMode={(mode) => {
          setGameMode(mode);
          resetGame();
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenTournament={() => setIsTournamentOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        onOpenGameHub={() => setIsGameHubOpen(true)}
        onOpenSocialHub={() => setIsSocialHubOpen(true)}
        onOpenAskGemini={() => setIsAskGeminiOpen(true)}
        onOpenCinematicVfx={() => setIsCinematicVfxOpen(true)}
        onOpenAnimationHub={() => setIsMasterHubOpen(true)}
        onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenPositionEditor={() => setIsPositionEditorOpen(true)}
        onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
        onUndoMove={handleUndoMove}
        canUndo={moveRecords.length > 0 && gameMode !== 'pvp'}
        onResetGame={resetGame}
        onFlipBoard={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
        onOfferDraw={handleOfferDraw}
        onResign={handleResign}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        isGameActive={isGameActive && gameResult.winner === null}
        isSpectator={isSpectator}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Board & Controls */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Classic Board Games Selector Tabs */}
          <div className="w-full">
            <GameBarSelector
              activeBoardGame={activeBoardGame}
              onSelectGame={setActiveBoardGame}
            />
          </div>

          {/* AI Difficulty Selector - Displayed in P vs AI mode for all games */}
          {gameMode === 'ai' && activeBoardGame !== 'chess' && (
            <div className="w-full max-w-[580px] my-1 animate-fadeIn">
              <AIDifficultySelector
                currentLevel={settings.aiDifficulty}
                onSelectLevel={(level) => {
                  setSettings((prev) => ({ ...prev, aiDifficulty: level as AIDifficulty }));
                }}
              />
            </div>
          )}

          {/* Real-time Room Community Notice & Rules Banner */}
          {roomNotice && roomNotice.trim() !== '' && (
            <div
              id="communityNoticeBanner"
              className="w-full max-w-[580px] bg-amber-500/20 border border-amber-400/60 rounded-2xl p-3.5 flex items-start gap-3 backdrop-blur-md shadow-lg shadow-amber-500/10 text-left animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-200 text-sm">
                📢
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Room Notice & Rules</span>
                  {roomRules && (
                    <span className="text-[10px] text-amber-300 font-mono bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                      Min Rating: {roomRules.minimumRating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-100 leading-relaxed font-medium">{roomNotice}</p>
              </div>
            </div>
          )}

          {activeBoardGame === 'chess' && (
            <>
              {/* Universal Game & AI Options Control Panel */}
              <GameOptionsControlPanel
                playerCountOptions={[2]}
                playerCount={2}
                gameMode={gameMode}
                onGameModeChange={(m) => {
                  setGameMode(m);
                  resetGame();
                }}
                userColorId={orientation}
                onUserColorChange={(col) => {
                  setOrientation(col as 'w' | 'b');
                  resetGame();
                }}
                aiDifficulty={settings.aiDifficulty}
                onAiDifficultyChange={(diff) => {
                  setSettings((prev) => ({ ...prev, aiDifficulty: diff }));
                }}
                playerSlots={[
                  {
                    id: 'w',
                    name: 'White Pieces',
                    colorHex: '#f8fafc',
                    isAi: gameMode === 'ai' && orientation === 'b',
                    isUser: orientation === 'w',
                  },
                  {
                    id: 'b',
                    name: 'Black Pieces',
                    colorHex: '#1e293b',
                    isAi: gameMode === 'ai' && orientation === 'w',
                    isUser: orientation === 'b',
                  },
                ]}
                onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
                onResetGame={resetGame}
              />

              {/* Active Custom Variant Banner */}
              {activeCustomVariant && (
                <div className="w-full max-w-[580px] bg-gradient-to-r from-amber-950/60 via-stone-900/90 to-amber-950/60 border border-amber-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md shadow-xl shadow-amber-950/30 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300 font-extrabold">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-300">{activeCustomVariant.name}</span>
                        <span className="text-[9px] text-amber-200 font-mono bg-amber-500/25 px-1.5 py-0.2 rounded border border-amber-400/30 font-bold uppercase tracking-wider">
                          Custom Variant Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {activeCustomVariant.boardSize}x{activeCustomVariant.boardSize} Sandbox Setup • {activeCustomVariant.timeLimit}s Clock
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsCustomSandboxOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold transition flex items-center gap-1"
                      title="Open sandbox editor or switch variant"
                    >
                      <Sliders className="w-3 h-3 text-amber-400" />
                      <span>Sandbox / History</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetGame(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition"
                      title="Reset to classical 8x8 standard chess"
                    >
                      <span>Standard Chess</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Detected Opening Book Banner */}
              {detectedOpening && (
                <div className="w-full max-w-[580px] bg-slate-900/90 border border-indigo-400/30 rounded-2xl p-3 flex items-start gap-3 backdrop-blur-md shadow-lg shadow-black/40 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300 font-extrabold text-xs">
                    {detectedOpening.eco}
                  </div>
                  <div className="space-y-0.5 text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{detectedOpening.name}</span>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30 font-bold">
                        Opening Book
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{detectedOpening.description}</p>
                  </div>
                </div>
              )}

              {/* Review Mode Banner */}
              {isReviewMode && (
                <div className="w-full max-w-[580px] bg-indigo-500/15 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs py-2.5 px-4 rounded-2xl flex items-center justify-between shadow-lg">
                  <span>Viewing Move {currentMoveIndex + 1} history preview</span>
                  <button
                    onClick={() => handleSelectMoveIndex(moveRecords.length - 1)}
                    className="font-bold underline hover:text-white transition"
                  >
                    Jump to Live
                  </button>
                </div>
              )}

              {/* Chess Board & Real-Time Eval Meter */}
              <div className="flex items-center gap-2.5 sm:gap-4 w-full justify-center">
                {/* Real-time Engine Advantage Meter */}
                <EvalBar evalResult={evalResult} orientation={orientation} />

                <ChessBoard
                  chess={
                    isReviewMode
                      ? (() => {
                          const c = new Chess();
                          for (let i = 0; i <= currentMoveIndex; i++) {
                            const m = moveRecords[i];
                            if (m) c.move({ from: m.from as Square, to: m.to as Square, promotion: m.promotion });
                          }
                          return c;
                        })()
                      : chessRef.current
                  }
                  orientation={orientation}
                  boardTheme={settings.boardTheme}
                  onMove={executeMove}
                  showLegalMoves={settings.showLegalMoves && !isReviewMode}
                  showLastMove={settings.showLastMove}
                  lastMove={lastMove}
                  kingInCheckSquare={isReviewMode ? null : kingInCheckSquare}
                  readOnly={isReadOnlyBoard}
                  onFlipOrientation={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
                  onChangeTheme={(newTheme) => setSettings((prev) => ({ ...prev, boardTheme: newTheme }))}
                  onOpenMasterHub={() => setIsMasterHubOpen(true)}
                  onOpenQuests={() => setIsQuestsOpen(true)}
                  onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
                />
              </div>
            </>
          )}

          {activeBoardGame === 'checkers' && (
            <div className="w-full animate-fadeIn">
              <CheckersBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('checkers', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'backgammon' && (
            <div className="w-full animate-fadeIn">
              <BackgammonBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('backgammon', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'snakes' && (
            <div className="w-full animate-fadeIn">
              <SnakesAndLaddersBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('snakes', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ludo' && (
            <div className="w-full animate-fadeIn">
              <LudoBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ludo', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'gomoku' && (
            <div className="w-full animate-fadeIn">
              <GomokuBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('gomoku', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'reversi' && (
            <div className="w-full animate-fadeIn">
              <ReversiBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('reversi', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'connect4' && (
            <div className="w-full animate-fadeIn">
              <ConnectFourBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('connect4', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ultimatetictactoe' && (
            <div className="w-full animate-fadeIn">
              <UltimateTicTacToeBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ultimatetictactoe', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'dotsandboxes' && (
            <div className="w-full animate-fadeIn">
              <DotsAndBoxesBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('dotsandboxes', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'battleship' && (
            <div className="w-full animate-fadeIn">
              <BattleshipBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('battleship', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'sim' && (
            <div className="w-full animate-fadeIn">
              <SimBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('sim', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'uno' && (
            <div className="w-full animate-fadeIn">
              <UnoBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('uno', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'hearts' && (
            <div className="w-full animate-fadeIn">
              <HeartsBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('hearts', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ginrummy' && (
            <div className="w-full animate-fadeIn">
              <GinRummyBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ginrummy', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'speed' && (
            <div className="w-full animate-fadeIn">
              <SpeedBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('speed', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'carrom' && (
            <div className="w-full animate-fadeIn">
              <CarromBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('carrom', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'darts' && (
            <div className="w-full animate-fadeIn">
              <DartsBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('darts', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'pingpong' && (
            <div className="w-full animate-fadeIn">
              <PingPongBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('pingpong', w, reason)}
              />
            </div>
          )}

          {/* Action Row: Reset, Rules, Arcade Booth, 96 FX Hub & Motion Library */}
          <div className="w-full max-w-[580px] grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
            <button
              onClick={resetGame}
              className="py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-white/10 hover:border-amber-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-[#ffe89e] font-extrabold text-xs border border-[#f3ce6b]/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#f3ce6b]" />
              <span>📖 Rules</span>
            </button>

            <button
              onClick={() => setIsArcadeCanvasOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/30 via-red-500/30 to-amber-500/30 hover:from-amber-500/40 hover:to-red-500/40 text-amber-200 font-black text-xs border border-amber-400/50 shadow-lg shadow-amber-500/10 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>🕹️ Arcade</span>
            </button>

            <button
              onClick={() => setIsMasterHubOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-200 font-extrabold text-xs border border-emerald-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>96 FX</span>
            </button>

            <button
              onClick={() => setIsAnimationLibraryOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-200 font-extrabold text-xs border border-cyan-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
            >
              <Wand2 className="w-4 h-4 text-cyan-300" />
              <span>✨ VFX</span>
            </button>
          </div>

          {/* Dynamic Player Status Cards & Adaptive Control Deck */}
          <div className="w-full max-w-[580px] mt-2">
            <PlayerStatusCardDeck
              activeBoardGame={activeBoardGame}
              gameMode={gameMode}
              currentUser={currentUser}
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={activeTurn}
              isGameActive={isGameActive && gameResult.winner === null}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onResign={() => handleTimeout('w')}
              onOfferDraw={() => alert('Draw offer sent to opponent!')}
            />
          </div>
        </div>

        {/* Right Column: Clocks, Captured Pieces, Move History & Real-Time Chat */}
        <div className="flex flex-col gap-4 w-full">
          {/* Chess Clocks - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <ChessClock
              whitePlayer={settings.whitePlayer}
              blackPlayer={settings.blackPlayer}
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={activeTurn}
              isGameActive={isGameActive && gameResult.winner === null}
              isPaused={isPaused}
              isUntimed={isUntimed}
              onTimeout={handleTimeout}
              onTogglePause={() => setIsPaused(!isPaused)}
            />
          )}

          {/* Captured Pieces - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <CapturedPieces
              capturedByWhite={capturedPieces.white}
              capturedByBlack={capturedPieces.black}
            />
          )}

          {/* Real-Time Room Chat */}
          <ChatPanel
            roomId={activeRoomId}
            currentUserHandle={currentUser?.username || 'Guest'}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            disabled={!currentUser}
            socket={socketService.getSocket()}
            activeBoardGame={activeBoardGame}
            gameTitle="Chess Pro Arena"
            moveCount={moveRecords.length}
            gameResult={gameResult}
            stats={currentUser?.stats || null}
            communityNotice={roomNotice}
            allowChat={roomRules ? roomRules.allowChat : true}
          />

          {/* 3D Spatial Proximity Voice Lounge & AI Moderation Shield */}
          <VoiceProximityPanel
            currentUsername={currentUser?.username || 'Guest'}
            roomId={activeRoomId || 'default_lounge'}
          />

          {/* AI Strategic Coach Panel */}
          <CoachPanel
            activeGame={activeBoardGame}
            gameTitle="Chess Pro Arena"
            moveHistory={moveRecords.map((m) => m.san)}
          />

          {/* Move Log & Export - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <MoveHistory
              moves={moveRecords}
              currentMoveIndex={currentMoveIndex}
              onSelectMove={handleSelectMoveIndex}
              pgn={pgn}
              fen={fen}
            />
          )}
        </div>
      </main>

      {/* Pawn Promotion Dialog */}
      {pendingPromotion && (
        <PromotionModal
          color={activeTurn}
          onSelect={(piece) => {
            const { from, to } = pendingPromotion;
            setPendingPromotion(null);
            executeMove(from, to, piece);
          }}
        />
      )}

      {/* Game Over Dialog */}
      {gameResult.winner !== null && (
        <GameOverModal
          result={gameResult}
          gameType={activeBoardGame}
          userColor={gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation}
          whitePlayer={
            activeBoardGame === 'chess'
              ? settings.whitePlayer
              : { name: currentUser?.username || 'Player 1' }
          }
          blackPlayer={
            activeBoardGame === 'chess'
              ? settings.blackPlayer
              : { name: gameMode === 'ai' ? 'Computer' : 'Player 2' }
          }
          moveCount={moveRecords.length || 12}
          onNewGame={resetGame}
          onReviewBoard={() => setGameResult({ winner: null, reason: null })}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        user={currentUser}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPrivacyModalTab('privacy');
          setIsPrivacyModalOpen(true);
        }}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          socketService.authenticate(updatedUser.token);
          setIsAuthModalOpen(false);
          setPrivacyModalTab('privacy');
          setIsPrivacyModalOpen(true);
        }}
        onLogout={() => {
          clearStoredToken();
          fetchGuestAuth().then((guest) => {
            setCurrentUser(guest);
            socketService.authenticate(guest.token);
          });
          setIsAuthModalOpen(false);
        }}
        onOpenPrivacyTerms={(tab) => {
          setPrivacyModalTab(tab || 'privacy');
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Global Leaderboard Modal */}
      <LeaderboardModal
        activeBoardGame={activeBoardGame}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUserHandle={currentUser?.username}
      />

      {/* Global Real-Time User List Sidebar Ticker (All Menus) */}
      <GlobalUserListSidebar />

      {/* Global Real-Time Telemetry & Analytics Dashboard Modal */}
      <GlobalAnalyticsDashboardModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        username={currentUser?.username || 'Grandmaster'}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        gameType={activeBoardGame}
      />

      {/* Statistics & Match History Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onReplayMatch={handleReplayMatch}
      />

      {/* Matchmaking Modal */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        status={matchmakingStatus}
        createdRoomId={createdRoomCode}
        createdRoomNotice={roomNotice}
        createdRoomRules={roomRules || undefined}
        errorMessage={matchmakingError}
        onClose={() => setIsMatchmakingOpen(false)}
        onStartQuickMatch={() => {
          setMatchmakingError('');
          const socket = socketService.getSocket();
          socket?.emit('matchmaking:join');
        }}
        onCancelQuickMatch={() => {
          const socket = socketService.getSocket();
          socket?.emit('matchmaking:cancel');
          setMatchmakingStatus('idle');
        }}
        onCreatePrivateRoom={(config) => {
          setMatchmakingError('');
          if (config?.communityNotice !== undefined) {
            setRoomNotice(config.communityNotice);
          }
          if (config) {
            setRoomRules({
              minimumRating: config.minRating,
              allowChat: config.allowChat,
              maxPlayers: config.maxPlayers || 2,
            });
          }
          const socket = socketService.getSocket();
          socket?.emit('room:create', {
            title: config?.title,
            communityNotice: config?.communityNotice,
            roomRules: config
              ? {
                  minimumRating: config.minRating,
                  allowChat: config.allowChat,
                  maxPlayers: config.maxPlayers || 2,
                }
              : undefined,
          });
        }}
        onJoinPrivateRoom={(code, asSpectator) => {
          setMatchmakingError('');
          const socket = socketService.getSocket();
          socket?.emit('room:join', { roomId: code, asSpectator });
        }}
        onSendMessage={handleSendMessage}
      />

      {/* Settings Modal */}
      <GameSettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          if (newSettings.timeControl.preset !== settings.timeControl.preset) {
            setWhiteTime(newSettings.timeControl.initialSeconds);
            setBlackTime(newSettings.timeControl.initialSeconds);
          }
        }}
      />

      {/* Ask Gemini Modal */}
      <AskGeminiModal
        activeBoardGame={activeBoardGame}
        isOpen={isAskGeminiOpen}
        onClose={() => setIsAskGeminiOpen(false)}
        fen={fen}
        pgn={pgn}
        turn={activeTurn}
        legalMoves={
          chessRef.current
            ? chessRef.current.moves({ verbose: true }).map((m) => `${m.piece.toUpperCase()}${m.to}`)
            : []
        }
      />

      {/* Puzzle Tactics Trainer Modal */}
      <PuzzleModal
        activeBoardGame={activeBoardGame}
        isOpen={isPuzzleOpen}
        onClose={() => setIsPuzzleOpen(false)}
      />

      {/* Import Position FEN / PGN Modal */}
      <PositionEditorModal
        isOpen={isPositionEditorOpen}
        onClose={() => setIsPositionEditorOpen(false)}
        onLoadFen={(newFen) => {
          chessRef.current.load(newFen);
          setFen(newFen);
          setPgn(chessRef.current.pgn());
          setMoveRecords([]);
          setCurrentMoveIndex(-1);
          setLastMove(null);
          setIsGameActive(true);
          setGameResult({ winner: null, reason: null });
        }}
        onLoadPgn={(newPgn) => {
          chessRef.current.loadPgn(newPgn);
          setFen(chessRef.current.fen());
          setPgn(newPgn);
          const history = chessRef.current.history({ verbose: true });
          const tempMoves: MoveRecord[] = history.map((m, idx) => ({
            san: m.san,
            from: m.from,
            to: m.to,
            piece: m.piece,
            captured: m.captured,
            promotion: m.promotion,
            color: m.color,
            fen: '',
            moveNumber: Math.ceil((idx + 1) / 2),
          }));
          setMoveRecords(tempMoves);
          setCurrentMoveIndex(tempMoves.length - 1);
          setIsGameActive(true);
          setGameResult({ winner: null, reason: null });
        }}
      />

      {/* Custom Chess Variant Sandbox Modal */}
      <CustomChessVariantSandboxModal
        isOpen={isCustomSandboxOpen}
        onClose={() => setIsCustomSandboxOpen(false)}
        onApplyVariant={(variant) => {
          setActiveBoardGame('chess');
          setActiveCustomVariant({
            name: variant.name || 'Custom Chess Variant',
            boardSize: variant.boardSize,
            timeLimit: variant.timeLimit,
            layout: variant.layout,
            theme: variant.theme,
            fen: variant.fen,
          });

          if (variant.theme) {
            setSettings((prev) => ({ ...prev, boardTheme: variant.theme! }));
          }
          if (variant.timeLimit) {
            setSettings((prev) => ({
              ...prev,
              timeControl: {
                ...prev.timeControl,
                initialSeconds: variant.timeLimit,
              },
            }));
            setWhiteTime(variant.timeLimit);
            setBlackTime(variant.timeLimit);
          }

          if (variant.boardSize === 8) {
            const customFen = variant.fen || layoutToFen(variant.layout, 8);
            try {
              chessRef.current.load(customFen);
              setFen(chessRef.current.fen());
              setPgn('');
              setMoveRecords([]);
              setCurrentMoveIndex(-1);
              setLastMove(null);
              setIsGameActive(true);
              setIsPaused(false);
              setGameResult({ winner: null, reason: null });
            } catch (err) {
              console.warn('Custom layout applied to sandbox configuration.', err);
            }
          }
        }}
      />

      {/* Integrated Multi-Game Arena Hub Modal */}
      <MultiGameHubModal
        isOpen={isGameHubOpen}
        onClose={() => setIsGameHubOpen(false)}
        onSelectMode={(mode) => {
          setGameMode(mode);
          resetGame();
        }}
        onSelectGame={(game) => setActiveBoardGame(game)}
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenAskGemini={() => setIsAskGeminiOpen(true)}
        onOpenPositionEditor={() => setIsPositionEditorOpen(true)}
        onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        activeLobbyCount={lobbyUsers.length || 8}
      />

      {/* Rules & Strategy Modal */}
      <GameRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        activeGame={activeBoardGame}
      />

      {/* 2D Canvas Arcade Engine & Retro Booth Modal */}
      <ArcadeCanvasModal
        isOpen={isArcadeCanvasOpen}
        onClose={() => setIsArcadeCanvasOpen(false)}
        onLaunchFullGame={(game) => {
          setActiveBoardGame(game);
          setIsArcadeCanvasOpen(false);
        }}
        initialGame={activeBoardGame}
      />

      {/* Master Web Animation & Transition Library Modal */}
      <AnimationLibraryModal
        isOpen={isAnimationLibraryOpen}
        onClose={() => setIsAnimationLibraryOpen(false)}
        onOpenCinematicVfx={() => setIsCinematicVfxOpen(true)}
        onOpenMasterHub={() => setIsMasterHubOpen(true)}
      />

      {/* Cinematic Chess Animation & Particle FX Engine */}
      <CinematicChessShowcase
        isOpen={isCinematicVfxOpen}
        onClose={() => setIsCinematicVfxOpen(false)}
      />

      {/* 96-Item Master Customization Hub (Shop, Inventory & Sandbox) Modal */}
      <AnimationEffectsMasterHubModal
        isOpen={isMasterHubOpen}
        onClose={() => setIsMasterHubOpen(false)}
        onOpenCinematicShowcase={() => {
          setIsMasterHubOpen(false);
          setIsCinematicVfxOpen(true);
        }}
        onOpenDailyWheel={() => {
          setIsMasterHubOpen(false);
          setIsDailyWheelOpen(true);
        }}
        onOpenQuests={() => {
          setIsMasterHubOpen(false);
          setIsQuestsOpen(true);
        }}
      />

      {/* Daily Wheel of Rewards (24h Cooldown Spin) Modal */}
      <DailyWheelModal
        isOpen={isDailyWheelOpen}
        onClose={() => setIsDailyWheelOpen(false)}
        onOpenQuestsOrHatrick={() => {
          setIsDailyWheelOpen(false);
          setIsQuestsOpen(true);
        }}
      />

      {/* Simultaneous Hatrick Achievement Banner Toast */}
      {hatrickNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[160] animate-bounce max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-slate-950 p-4 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.6)] border-2 border-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shrink-0">
                🔥
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Hatrick Complete! 3 Consecutive Captures!
                </h4>
                <p className="text-xs font-bold text-slate-900/90">
                  +{(hatrickNotification.reward ?? 2000).toLocaleString()} PTS added to your wallet!
                </p>
              </div>
            </div>
            <button
              onClick={() => setHatrickNotification(null)}
              className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-slate-950"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy, Terms & Conditions & App Flow Modal */}
      <PrivacyTermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => {
          if (!isCompulsoryPrivacy) {
            setIsPrivacyModalOpen(false);
          }
        }}
        defaultTab={privacyModalTab}
        isCompulsory={isCompulsoryPrivacy}
        onAgree={() => {
          setIsCompulsoryPrivacy(false);
          setIsPrivacyModalOpen(false);
          trackGameOpened(activeBoardGame);
        }}
      />

      {/* Social, Community, Quests, Badges & Activity Feed Hub Modal */}
      <CommunitySocialModal
        isOpen={isSocialHubOpen}
        onClose={() => setIsSocialHubOpen(false)}
      />

      {/* Esports Tournament Bracket Arena Modal */}
      <TournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
      />

      {/* Daily Quests & Rank Progression Modal */}
      <QuestPanel
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
      />

      {/* Audio Soundpack & Board Texture Customizer Modal */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
      />

      {/* Real-Time Global Telemetry & Concurrency Analytics Modal */}
      <GlobalAnalyticsDashboardModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Google Account & Play Services Suite Modal */}
      <GoogleConnectModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        onRestoreLocalData={(cloudData) => {
          if (cloudData.localStorageDump) {
            Object.keys(cloudData.localStorageDump).forEach((key) => {
              localStorage.setItem(key, cloudData.localStorageDump[key]);
            });
          }
        }}
        getLocalDataToBackup={() => ({
          savedAt: new Date().toISOString(),
          localStorageDump: { ...localStorage },
          settings,
          gameMode
        })}
      />

      {/* Security Compromise Warning Modal */}
      {compromiseAlert && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
              Token Reuse Anomaly Detected
            </h3>
            <p className="text-xs text-red-200/80 leading-relaxed">
              {compromiseAlert}
            </p>
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-2xl text-[11px] text-white/70">
              The platform's Automated Breach Defense activated, revoking all active sessions across all devices for your protection.
            </div>
            <button
              onClick={() => {
                setCompromiseAlert(null);
                setIsAuthModalOpen(true);
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl transition shadow-lg"
            >
              Acknowledge & Re-authenticate
            </button>
          </div>
        </div>
      )}

      {/* Wheel of Luck Main 16-Game Catalog Modal */}
      <WheelOfLuckMainCatalog
        isOpen={isWheelCatalogOpen}
        onClose={() => setIsWheelCatalogOpen(false)}
        onSelectGameToLobby={(game) => {
          setSelectedWheelGame(game);
          setIsWheelGameLobbyOpen(true);
        }}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
      />

      {/* Wheel of Luck Game-Specific Matchmaking Lobby Modal */}
      <WheelOfLuckGameLobbyModal
        isOpen={isWheelGameLobbyOpen}
        onClose={() => setIsWheelGameLobbyOpen(false)}
        selectedGame={selectedWheelGame}
        currentUserUsername={currentUser?.username || 'Guest'}
        onTeleportToMatch={(gameId) => {
          setIsWheelGameLobbyOpen(false);
          setIsWheelCatalogOpen(false);
          setIsGameHubOpen(false);
          setActiveBoardGame(gameId);
          setGameMode('pvp');
          resetGame();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Comprehensive SEO Content & Footer Section */}
      <SEOFooter
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenGameHub={() => setIsGameHubOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenPrivacyTerms={(tab) => {
          setPrivacyModalTab(tab || 'privacy');
          setIsPrivacyModalOpen(true);
        }}
      />
    </div>
  );
}
