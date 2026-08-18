import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  Copy,
  Check,
  Users,
  Radio,
  Eye,
  Play,
  MessageSquare,
  AlertCircle,
  Sliders,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

interface ActiveRoomInfo {
  id: string;
  gameId: string;
  whiteUsername: string;
  blackUsername: string;
  status: string;
  moveCount: number;
  communityNotice?: string;
  roomRules?: {
    minimumRating: number;
    allowChat: boolean;
    maxPlayers: number;
  };
}

export interface CreateRoomConfig {
  title?: string;
  communityNotice: string;
  minRating: number;
  allowChat: boolean;
  maxPlayers?: number;
}

interface MatchmakingModalProps {
  isOpen: boolean;
  status: 'idle' | 'waiting' | 'error';
  createdRoomId: string | null;
  createdRoomNotice?: string;
  createdRoomRules?: { minimumRating: number; allowChat: boolean; maxPlayers: number };
  errorMessage?: string;
  onClose: () => void;
  onStartQuickMatch: () => void;
  onCancelQuickMatch: () => void;
  onCreatePrivateRoom: (config?: CreateRoomConfig) => void;
  onJoinPrivateRoom: (code: string, asSpectator?: boolean) => void;
  onSendMessage?: (text: string) => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  status,
  createdRoomId,
  createdRoomNotice,
  createdRoomRules,
  errorMessage,
  onClose,
  onStartQuickMatch,
  onCancelQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onSendMessage,
}) => {
  const [tab, setTab] = useState<'custom' | 'quick' | 'spectate'>('custom');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Room Owner Configuration Form State
  const [roomTitle, setRoomTitle] = useState<string>('');
  const [roomNotice, setRoomNotice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(1200);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [allowChat, setAllowChat] = useState<boolean>(true);

  // Active Lobby State
  const [isLobbyActive, setIsLobbyActive] = useState<boolean>(false);
  const [activeLobbyTitle, setActiveLobbyTitle] = useState<string>('Private Room');
  const [activeLobbyNotice, setActiveLobbyNotice] = useState<string>('');
  const [activeLobbyRules, setActiveLobbyRules] = useState<{
    minimumRating: number;
    maxPlayers: number;
    allowChat: boolean;
  }>({
    minimumRating: 1200,
    maxPlayers: 2,
    allowChat: true,
  });
  const [chatMessageText, setChatMessageText] = useState<string>('');
  const [roomChatFeed, setRoomChatFeed] = useState<
    Array<{ sender: string; text: string; timestamp: number; isSystem?: boolean }>
  >([]);

  // Sync active created room details from props if provided
  useEffect(() => {
    if (createdRoomId) {
      setIsLobbyActive(true);
      if (createdRoomNotice !== undefined) {
        setActiveLobbyNotice(createdRoomNotice);
      }
      if (createdRoomRules) {
        setActiveLobbyRules(createdRoomRules);
      }
    }
  }, [createdRoomId, createdRoomNotice, createdRoomRules]);

  // Expose publishPrivateRoom, loadActiveLobby, sendRoomMessage to window for script/DOM compatibility
  useEffect(() => {
    const handlePublish = () => {
      const nameInput = document.getElementById('roomName') as HTMLInputElement | null;
      const noticeInput = document.getElementById('roomNotice') as HTMLTextAreaElement | null;
      const minRatingInput = document.getElementById('minRating') as HTMLInputElement | null;
      const maxPlayersInput = document.getElementById('maxPlayers') as HTMLInputElement | null;
      const allowChatInput = document.getElementById('allowChat') as HTMLInputElement | null;

      const titleVal = (nameInput ? nameInput.value : roomTitle).trim() || 'Grandmaster Private Lounge';
      const noticeVal = (noticeInput ? noticeInput.value : roomNotice).trim();
      const minRatingVal = parseInt(
        (minRatingInput ? minRatingInput.value : String(minRating)) || '1200',
        10
      );
      const maxPlayersVal = parseInt(
        (maxPlayersInput ? maxPlayersInput.value : String(maxPlayers)) || '2',
        10
      );
      const allowChatVal = allowChatInput ? allowChatInput.checked : allowChat;

      const roomConfiguration = {
        title: titleVal,
        isPrivate: true,
        communityNotice: noticeVal,
        thresholdRules: {
          minimumRating: minRatingVal,
          maxPlayers: maxPlayersVal,
          allowChat: allowChatVal,
        },
        createdAt: new Date().toISOString(),
      };

      console.log('Published Private Room Config:', roomConfiguration);

      // Trigger loadActiveLobby DOM logic
      const lobbyElement = document.getElementById('roomLobby');
      if (lobbyElement) {
        lobbyElement.style.display = 'block';
      }

      const displayTitleElement = document.getElementById('displayRoomTitle');
      if (displayTitleElement) {
        displayTitleElement.innerText = `Active Lobby: ${roomConfiguration.title}`;
      }

      const bannerElement = document.getElementById('communityNoticeBanner');
      if (bannerElement) {
        if (roomConfiguration.communityNotice !== '') {
          bannerElement.innerText = `📢 Room Notice: ${roomConfiguration.communityNotice}`;
          bannerElement.style.display = 'block';
        } else {
          bannerElement.style.display = 'none';
        }
      }

      const chatSec = document.getElementById('chatSection');
      if (chatSec) {
        if (!roomConfiguration.thresholdRules.allowChat) {
          chatSec.style.display = 'none';
        } else {
          chatSec.style.display = 'block';
        }
      }

      // Sync React state
      setActiveLobbyTitle(roomConfiguration.title);
      setActiveLobbyNotice(roomConfiguration.communityNotice);
      setActiveLobbyRules(roomConfiguration.thresholdRules);
      setIsLobbyActive(true);
      setRoomChatFeed([
        {
          sender: 'System',
          text: `Private room "${roomConfiguration.title}" published with threshold rules: Min Rating ${minRatingVal}, Max Players ${maxPlayersVal}, Chat ${allowChatVal ? 'Enabled' : 'Disabled'}.`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);

      // Trigger socket/parent action
      onCreatePrivateRoom({
        title: roomConfiguration.title,
        communityNotice: roomConfiguration.communityNotice,
        minRating: minRatingVal,
        maxPlayers: maxPlayersVal,
        allowChat: allowChatVal,
      });
    };

    const handleSendMessage = () => {
      const input = document.getElementById('chatInput') as HTMLInputElement | null;
      const text = input ? input.value.trim() : chatMessageText.trim();
      if (!text) return;
      console.log('Room Broadcast Sent:', text);

      if (onSendMessage) {
        onSendMessage(text);
      }

      setRoomChatFeed((prev) => [
        ...prev,
        { sender: 'Host (You)', text, timestamp: Date.now() },
      ]);

      if (input) input.value = '';
      setChatMessageText('');
    };

    (window as any).publishPrivateRoom = handlePublish;
    (window as any).sendRoomMessage = handleSendMessage;

    return () => {
      delete (window as any).publishPrivateRoom;
      delete (window as any).sendRoomMessage;
    };
  }, [
    roomTitle,
    roomNotice,
    minRating,
    maxPlayers,
    allowChat,
    chatMessageText,
    onCreatePrivateRoom,
    onSendMessage,
  ]);

  useEffect(() => {
    if (isOpen && tab === 'spectate') {
      setLoadingRooms(true);
      fetch('/api/rooms/active')
        .then((res) => res.json())
        .then((data) => {
          setActiveRooms(data.rooms || []);
          setLoadingRooms(false);
        })
        .catch(() => {
          setLoadingRooms(false);
        });
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!createdRoomId) return;
    navigator.clipboard.writeText(createdRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publishPrivateRoom = () => {
    if ((window as any).publishPrivateRoom) {
      (window as any).publishPrivateRoom();
    }
  };

  const sendRoomMessage = () => {
    if ((window as any).sendRoomMessage) {
      (window as any).sendRoomMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-[#1e1e1e] border border-stone-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-black/90 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-[#161616] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-md shadow-emerald-950/40">
              <Swords className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Room Owner: Private Room Configuration
              </h2>
              <p className="text-xs text-stone-400">
                Configure threshold rules, notices, player limits &amp; live matchmaking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-[#141414] text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`flex-1 py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              tab === 'custom'
                ? 'border-emerald-500 text-emerald-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Private Room &amp; Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('quick')}
            className={`flex-1 py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              tab === 'quick'
                ? 'border-emerald-500 text-emerald-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Quick Match</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('spectate')}
            className={`flex-1 py-3 transition border-b-2 flex items-center justify-center gap-2 ${
              tab === 'spectate'
                ? 'border-emerald-500 text-emerald-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Spectate Live</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#181818]">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-6">
              {/* Room Owner Controls & Threshold Rules Form */}
              <div className="section p-4 sm:p-5 bg-[#2c2c2c] border border-stone-700/60 rounded-xl space-y-4 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between border-b border-stone-700/60 pb-2.5">
                  <h3 className="text-sm font-bold text-[#4CAF50] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#4CAF50]" />
                    <span>Threshold Rules &amp; Settings</span>
                  </h3>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                    Owner Controls
                  </span>
                </div>

                {/* 1. Room Title */}
                <div>
                  <label
                    htmlFor="roomName"
                    className="block text-xs font-bold text-[#b0bec5] mb-1.5 uppercase tracking-wide"
                  >
                    Room Title:
                  </label>
                  <input
                    type="text"
                    id="roomName"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="e.g., Grandmaster Private Lounge"
                    className="w-full p-2.5 sm:p-3 bg-[#1e1e1e] border border-[#444] focus:border-[#4CAF50] text-white rounded-lg text-xs sm:text-sm placeholder:text-stone-500 focus:outline-none transition shadow-inner"
                  />
                </div>

                {/* 2. Community Notice Banner */}
                <div>
                  <label
                    htmlFor="roomNotice"
                    className="block text-xs font-bold text-[#b0bec5] mb-1.5 uppercase tracking-wide"
                  >
                    Community Notice Banner:
                  </label>
                  <textarea
                    id="roomNotice"
                    rows={2}
                    value={roomNotice}
                    onChange={(e) => setRoomNotice(e.target.value)}
                    placeholder="Set your rules or welcome instructions for participants joining your room..."
                    className="w-full p-2.5 sm:p-3 bg-[#1e1e1e] border border-[#444] focus:border-[#4CAF50] text-white rounded-lg text-xs sm:text-sm placeholder:text-stone-500 focus:outline-none transition resize-vertical shadow-inner min-h-[65px]"
                  />
                </div>

                {/* 3. Rating & Max Players Thresholds */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="minRating"
                      className="block text-xs font-bold text-[#b0bec5] mb-1.5 uppercase tracking-wide"
                    >
                      Minimum Player Rating Threshold:
                    </label>
                    <input
                      type="number"
                      id="minRating"
                      value={minRating}
                      min="0"
                      onChange={(e) => setMinRating(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2.5 bg-[#1e1e1e] border border-[#444] focus:border-[#4CAF50] text-white rounded-lg text-xs sm:text-sm font-mono focus:outline-none transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxPlayers"
                      className="block text-xs font-bold text-[#b0bec5] mb-1.5 uppercase tracking-wide"
                    >
                      Maximum Player Count Threshold:
                    </label>
                    <input
                      type="number"
                      id="maxPlayers"
                      value={maxPlayers}
                      min="2"
                      max="10"
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 2)}
                      className="w-full p-2.5 bg-[#1e1e1e] border border-[#444] focus:border-[#4CAF50] text-white rounded-lg text-xs sm:text-sm font-mono focus:outline-none transition shadow-inner"
                    />
                  </div>
                </div>

                {/* 4. Live Chat Toggle */}
                <div className="checkbox-group flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="allowChat"
                    checked={allowChat}
                    onChange={(e) => setAllowChat(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-[#1e1e1e] border-[#444] cursor-pointer"
                  />
                  <label
                    htmlFor="allowChat"
                    className="text-xs font-bold text-[#b0bec5] cursor-pointer select-none"
                  >
                    Allow Live Chat in Room
                  </label>
                </div>

                {/* Publish Private Room Button */}
                <button
                  type="button"
                  onClick={publishPrivateRoom}
                  className="w-full py-3 px-5 rounded-lg bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold text-sm transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Users className="w-4 h-4" />
                  <span>Publish Private Room</span>
                </button>
              </div>

              {/* Active Room Lobby & Enforced Rules View */}
              <div
                id="roomLobby"
                className="section p-4 sm:p-5 bg-[#2c2c2c] border border-stone-700/80 rounded-xl space-y-4 shadow-xl transition-all"
                style={{ display: isLobbyActive || createdRoomId ? 'block' : 'none' }}
              >
                {/* Community Notice Banner View */}
                <div
                  id="communityNoticeBanner"
                  className="p-3.5 rounded-lg bg-[#ff9800] text-black text-xs sm:text-sm font-bold shadow-md flex items-start gap-2.5 animate-fadeIn"
                  style={{
                    display:
                      activeLobbyNotice && activeLobbyNotice.trim() !== '' ? 'block' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 shrink-0 text-black" />
                    <span>
                      📢 Room Notice:{' '}
                      {activeLobbyNotice || 'Welcome! Please adhere to room threshold rules.'}
                    </span>
                  </div>
                </div>

                {/* Lobby Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-700/60 pb-3">
                  <div>
                    <h3
                      id="displayRoomTitle"
                      className="text-base font-bold text-[#4CAF50] flex items-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Active Lobby: {activeLobbyTitle || 'Grandmaster Lounge'}
                    </h3>
                    <p id="roomStatus" className="text-xs text-[#aaa] mt-0.5">
                      Status: Room live. Enforcing owner thresholds...
                    </p>
                  </div>

                  {createdRoomId && (
                    <div className="flex items-center gap-2 self-start sm:self-auto bg-[#1e1e1e] border border-stone-600 px-3 py-1.5 rounded-lg">
                      <span className="text-[11px] text-stone-400 font-semibold">Code:</span>
                      <span className="text-xs font-mono font-extrabold text-emerald-400">
                        {createdRoomId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="ml-1 p-1 hover:bg-stone-700 rounded text-stone-300 hover:text-white transition"
                        title="Copy Room Code"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Threshold Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-[#1e1e1e] border border-[#444] rounded-lg">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">
                      Min Rating Threshold
                    </div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {activeLobbyRules.minimumRating} ELO+
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1e1e1e] border border-[#444] rounded-lg">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">
                      Max Players Cap
                    </div>
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      {activeLobbyRules.maxPlayers} Players
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1e1e1e] border border-[#444] rounded-lg col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">
                      Live Chat Status
                    </div>
                    <div
                      className={`font-semibold text-xs flex items-center gap-1 mt-0.5 ${
                        activeLobbyRules.allowChat ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{activeLobbyRules.allowChat ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                {/* Live Chat Section Controls */}
                <div
                  id="chatSection"
                  className="space-y-2.5 pt-2"
                  style={{ display: activeLobbyRules.allowChat ? 'block' : 'none' }}
                >
                  <label
                    htmlFor="chatInput"
                    className="block text-xs font-bold text-[#b0bec5] uppercase tracking-wide"
                  >
                    Room Chat Controls:
                  </label>

                  {/* Chat Feed Log */}
                  {roomChatFeed.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1.5 p-2.5 bg-[#1e1e1e] border border-[#444] rounded-lg text-xs custom-scrollbar">
                      {roomChatFeed.map((msg, i) => (
                        <div
                          key={i}
                          className={`${
                            msg.isSystem ? 'text-amber-300 italic' : 'text-stone-200'
                          }`}
                        >
                          <span className="font-bold text-emerald-400">{msg.sender}:</span>{' '}
                          {msg.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="chatInput"
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendRoomMessage();
                        }
                      }}
                      placeholder="Send announcement or message..."
                      className="flex-1 p-2.5 bg-[#1e1e1e] border border-[#444] focus:border-[#4CAF50] text-white rounded-lg text-xs focus:outline-none transition shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={sendRoomMessage}
                      className="w-[120px] py-2 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold text-xs rounded-lg transition shadow-md shrink-0 flex items-center justify-center gap-1.5 uppercase"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Join Existing Room via Code */}
              <div className="p-4 bg-[#252525] border border-stone-700/60 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Join Room by Code</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Player or Spectator
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. code_928123"
                    className="w-full bg-[#1e1e1e] border border-[#444] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-400 transition"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!joinCodeInput.trim()) return;
                        onJoinPrivateRoom(joinCodeInput.trim(), false);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Join as Player</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!joinCodeInput.trim()) return;
                        onJoinPrivateRoom(joinCodeInput.trim(), true);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Watch Spectator</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'quick' && (
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              {status === 'waiting' ? (
                <div className="space-y-4 my-2">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                    <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                      <Radio className="w-8 h-8 animate-pulse text-emerald-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Searching for Opponent...</h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Pairing you with an online player across all games
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelQuickMatch}
                    className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold border border-stone-600 transition"
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full max-w-md mx-auto">
                  <p className="text-xs text-stone-300">
                    Jump into instant online matchmaking. You will be paired with another guest or registered player.
                  </p>
                  <button
                    type="button"
                    onClick={onStartQuickMatch}
                    className="w-full py-3.5 rounded-lg bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold text-sm transition shadow-[0_0_20px_rgba(76,175,80,0.4)] border border-emerald-400/50 flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Find Quick PvP Match</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'spectate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-300">
                  Select an active PvP match to join and spectate live:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoadingRooms(true);
                    fetch('/api/rooms/active')
                      .then((res) => res.json())
                      .then((data) => {
                        setActiveRooms(data.rooms || []);
                        setLoadingRooms(false);
                      })
                      .catch(() => setLoadingRooms(false));
                  }}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Refresh List
                </button>
              </div>

              {loadingRooms ? (
                <div className="text-center py-8 text-xs text-stone-400">Loading live matches...</div>
              ) : activeRooms.length === 0 ? (
                <div className="p-6 bg-[#252525] border border-stone-700/60 rounded-xl text-center space-y-2">
                  <Eye className="w-8 h-8 text-stone-500 mx-auto" />
                  <div className="text-xs font-bold text-white">No Active Public Matches Right Now</div>
                  <p className="text-xs text-stone-400">
                    Host a private room above or enter a friend's room code to spectate them!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {activeRooms.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 bg-[#252525] border border-stone-700/60 hover:border-emerald-500/50 rounded-xl flex items-center justify-between transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white capitalize">{r.gameId}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                          </span>
                          {r.communityNotice && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono">
                              📢 Notice
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-300">
                          {r.whiteUsername} <span className="text-stone-500">vs</span> {r.blackUsername}
                        </div>
                        {r.communityNotice && (
                          <div className="text-[11px] text-amber-200/90 italic line-clamp-1 max-w-xs">
                            "{r.communityNotice}"
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onJoinPrivateRoom(r.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>Spectate</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
