import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ActiveBoardGame, UserStats, GameResult } from '../types';
import { MessageSquare, Send, Smile, Mic, MicOff, ShieldAlert, Share2, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { InGameEmotesBar } from './InGameEmotesBar';
import { ShareProgressModal } from './ShareProgressModal';
import { VoiceReportModal } from './VoiceReportModal';
import { PlatformVoiceEngine } from '../utils/voiceEngine';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface ChatPanelProps {
  roomId: string | null;
  currentUserHandle: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  socket?: any;
  activeBoardGame?: ActiveBoardGame;
  gameTitle?: string;
  moveCount?: number;
  gameResult?: GameResult | null;
  stats?: UserStats | null;
  communityNotice?: string;
  allowChat?: boolean;
}

const QUICK_PHRASES = ['Good luck!', 'Nice move!', 'Good game!', 'Thanks!', 'Oof!'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  roomId,
  currentUserHandle,
  messages,
  onSendMessage,
  disabled = false,
  socket,
  activeBoardGame = 'chess',
  gameTitle = 'Chess Pro Arena',
  moveCount = 0,
  gameResult,
  stats,
  communityNotice,
  allowChat = true,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatActuallyDisabled = disabled || allowChat === false;

  // Voice Dictation Writing Engine
  const [isDictating, setIsDictating] = useState(false);
  const voiceEngineRef = useRef<PlatformVoiceEngine | null>(null);

  useEffect(() => {
    voiceEngineRef.current = new PlatformVoiceEngine(
      (transcript, isFinal) => {
        if (isFinal) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      },
      (command) => {
        if (command === 'toggle_account_modal') {
          console.log('Voice Command: Account Modal requested');
        }
      }
    );

    return () => {
      voiceEngineRef.current?.stopListening();
    };
  }, []);

  const toggleDictation = () => {
    if (!voiceEngineRef.current) return;
    if (isDictating) {
      voiceEngineRef.current.stopListening();
      setIsDictating(false);
    } else {
      voiceEngineRef.current.startListening();
      setIsDictating(true);
    }
  };

  // Voice Chat Room States
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportedUsers, setReportedUsers] = useState<Set<string>>(new Set());

  // Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reportModalUser, setReportModalUser] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice activity simulation/mic capture indicator
  useEffect(() => {
    let interval: any;
    if (isVoiceActive && !isMuted) {
      interval = setInterval(() => {
        setIsSpeaking(Math.random() > 0.6);
      }, 800);
    } else {
      setIsSpeaking(false);
    }
    return () => clearInterval(interval);
  }, [isVoiceActive, isMuted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    if (disabled) return;
    onSendMessage(phrase);
  };

  const toggleVoice = () => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      setIsMuted(false);
    } else {
      setIsVoiceActive(false);
      setIsMuted(false);
      setIsSpeaking(false);
    }
  };

  const handleReportSubmitted = (userToMute: string) => {
    setReportedUsers((prev) => new Set(prev).add(userToMute.toLowerCase()));
  };

  // Find other players in chat messages to allow reporting
  const otherSenders = Array.from(
    new Set(
      messages
        .filter((m) => !m.isSystem && m.sender.toLowerCase() !== currentUserHandle.toLowerCase())
        .map((m) => m.sender)
    )
  );

  return (
    <div className="w-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl relative overflow-visible">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between rounded-t-2xl gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">
            Live Chat
          </h3>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-1.5">
          {/* Share Progress Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 transition text-[10px] font-bold flex items-center gap-1"
            title="Share Game Progress & Stats"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline">Share Progress</span>
          </button>

          {/* Draggable Emote & Reaction Widget */}
          <InGameEmotesBar
            roomId={roomId || undefined}
            socket={socket}
            currentUsername={currentUserHandle}
            onSendMessage={onSendMessage}
          />

          {roomId ? (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full shrink-0">
              Room: {roomId}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
              Local
            </span>
          )}
        </div>
      </div>

      {/* Community Notice Banner */}
      {communityNotice && communityNotice.trim() !== '' && (
        <div
          id="communityNoticeBanner"
          className="px-3 py-2 bg-amber-500/15 border-b border-amber-400/40 text-amber-200 text-xs flex items-start gap-2"
        >
          <span className="text-sm shrink-0">📢</span>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Room Notice</span>
            <p className="text-amber-100 text-[11px] leading-tight break-words">{communityNotice}</p>
          </div>
        </div>
      )}

      {/* Voice Chat Status Bar */}
      <div className="px-3 py-2 bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isVoiceActive
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
            title={isVoiceActive ? 'Disconnect Voice' : 'Connect Voice Room'}
          >
            {isVoiceActive ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Voice Live</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-gray-400" />
                <span>Join Voice</span>
              </>
            )}
          </button>

          {isVoiceActive && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-xl border transition ${
                isMuted
                  ? 'bg-red-500/20 border-red-400/40 text-red-300'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          )}

          {isVoiceActive && (
            <div className="flex items-center gap-1 text-[10px]">
              {isSpeaking ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Volume2 className="w-3 h-3" />
                  <span>Speaking...</span>
                </span>
              ) : isMuted ? (
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <VolumeX className="w-3 h-3" />
                  <span>Muted</span>
                </span>
              ) : (
                <span className="text-gray-400 italic">Listening...</span>
              )}
            </div>
          )}
        </div>

        {/* Allegation / Report Harassment Button */}
        <button
          onClick={() => {
            const target = otherSenders[0] || (roomId ? `Opponent_${roomId}` : 'VoiceUser');
            setReportModalUser(target);
          }}
          className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 text-[10px] font-bold transition flex items-center gap-1"
          title="Report Voice Harassment or Misconduct"
        >
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span>Report Voice</span>
        </button>
      </div>

      {/* Message List */}
      <div className="p-3 h-48 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 italic gap-1">
            <Smile className="w-5 h-5 text-indigo-400/50" />
            <span>No messages yet. Say hello!</span>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className="text-center text-[10px] italic text-indigo-200/60 bg-indigo-500/10 py-1 px-2.5 rounded-lg border border-indigo-400/20 my-1"
                >
                  {msg.text}
                </div>
              );
            }

            const isMe = msg.sender.toLowerCase() === currentUserHandle.toLowerCase();
            const isMutedUser = reportedUsers.has(msg.sender.toLowerCase());

            if (isMutedUser) {
              return (
                <div
                  key={msg.id}
                  className="text-center text-[10px] text-red-300/60 bg-red-500/10 py-1 px-2.5 rounded-lg border border-red-400/20 my-1 italic"
                >
                  Message hidden (User reported &amp; muted)
                </div>
              );
            }

            const isOwnerSender = isSiteOwner(msg.sender);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span
                    className={`font-bold text-[10px] flex items-center gap-1 ${
                      isOwnerSender
                        ? 'text-amber-300 font-extrabold'
                        : isMe
                        ? 'text-indigo-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {msg.sender}
                    {isOwnerSender && (
                      <OwnerBadge username={msg.sender} size="xs" label="OWNER" />
                    )}
                  </span>
                  <span className="text-[9px] text-white/30">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!isMe && !isOwnerSender && (
                    <button
                      onClick={() => setReportModalUser(msg.sender)}
                      className="text-[9px] text-red-400/60 hover:text-red-400 transition ml-1"
                      title={`Report ${msg.sender}`}
                    >
                      Report
                    </button>
                  )}
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words ${
                    isOwnerSender
                      ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 text-amber-100 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : isMe
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-white/10 text-white/90 border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Phrases */}
      <div className="px-3 py-1.5 bg-black/20 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => handleQuickPhrase(phrase)}
            disabled={disabled}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-200 border border-white/10 whitespace-nowrap transition disabled:opacity-30 shrink-0"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Message Input */}
      {allowChat === false ? (
        <div className="p-2.5 bg-black/40 border-t border-white/10 text-center text-xs text-amber-300/80 font-medium">
          🔒 Room owner has disabled real-time chat for this match.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-2.5 bg-black/30 border-t border-white/10 flex items-center gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={disabled ? 'Chat disabled' : isDictating ? 'Listening to voice...' : 'Type or dictate message...'}
              disabled={isChatActuallyDisabled}
              className={`w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50 ${
                isDictating ? 'border-red-400/50 bg-red-500/10' : ''
              }`}
              maxLength={150}
            />
            <button
              type="button"
              onClick={toggleDictation}
              disabled={isChatActuallyDisabled}
              className={`absolute right-1.5 p-1 rounded-lg transition ${
                isDictating
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              title={isDictating ? 'Stop Voice Dictation' : 'Start Voice Writing / Dictation'}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isChatActuallyDisabled || !inputText.trim()}
            className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition disabled:opacity-30 shrink-0 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Modals */}
      <ShareProgressModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeBoardGame={activeBoardGame}
        gameTitle={gameTitle}
        moveCount={moveCount}
        gameResult={gameResult}
        stats={stats}
        roomId={roomId}
        username={currentUserHandle}
      />

      <VoiceReportModal
        isOpen={!!reportModalUser}
        onClose={() => setReportModalUser(null)}
        reportedUser={reportModalUser || ''}
        roomId={roomId || undefined}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
};
