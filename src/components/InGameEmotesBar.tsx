import React, { useState, useEffect } from 'react';
import { Smile, GripVertical, Send, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlyingEmote {
  id: string;
  emote: string;
  sender: string;
  x: number;
}

interface InGameEmotesBarProps {
  roomId?: string;
  socket?: any;
  currentUsername?: string;
  onSendMessage?: (text: string) => void;
}

const QUICK_EMOTES = ['🔥', '🏆', '👏', '💡', '🎯', '⚡', '👑', '😱', '😂', '🎉', '💀', '🤖'];
const QUICK_PHRASES = [
  'Good Game! 👏',
  'Well Played! 👍',
  'Nice move! 🎯',
  'Brilliant strategy! 💡',
  'Oops! 😅',
  'Thanks for the game! 🤝',
  'Checkmate incoming! ♟️',
  'Thinking... 🧠',
];

export const InGameEmotesBar: React.FC<InGameEmotesBarProps> = ({
  roomId,
  socket,
  currentUsername = 'You',
  onSendMessage,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [flyingEmotes, setFlyingEmotes] = useState<FlyingEmote[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleEmoteReceived = (data: { emote: string; sender: string }) => {
      const newEmote: FlyingEmote = {
        id: `em_${Date.now()}_${Math.random()}`,
        emote: data.emote,
        sender: data.sender,
        x: Math.random() * 60 + 20, // 20% to 80% horizontal position
      };
      setFlyingEmotes((prev) => [...prev, newEmote]);

      setTimeout(() => {
        setFlyingEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
      }, 2500);
    };

    socket.on('game:emote_received', handleEmoteReceived);
    return () => {
      socket.off('game:emote_received', handleEmoteReceived);
    };
  }, [socket]);

  const triggerEmote = (text: string) => {
    // Socket real-time broadcast
    if (socket && roomId) {
      socket.emit('game:emote', { roomId, emote: text, sender: currentUsername });
    } else {
      // Local fallback for flying emote effect
      const newEmote: FlyingEmote = {
        id: `em_${Date.now()}_${Math.random()}`,
        emote: text,
        sender: currentUsername,
        x: Math.random() * 60 + 20,
      };
      setFlyingEmotes((prev) => [...prev, newEmote]);
      setTimeout(() => {
        setFlyingEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
      }, 2500);
    }

    // Also send phrase/emote to chat if callback provided
    if (onSendMessage) {
      onSendMessage(text);
    }

    setShowMenu(false);
  };

  return (
    <>
      {/* Flying Floating Emotes Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {flyingEmotes.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 120, scale: 0.5 }}
              animate={{ opacity: 1, y: -200, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2.3, ease: 'easeOut' }}
              style={{ left: `${e.x}%` }}
              className="absolute bottom-24 flex flex-col items-center gap-1 bg-slate-900/90 border border-amber-400/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl shadow-amber-500/20 text-white font-bold"
            >
              <span className="text-3xl">{e.emote}</span>
              <span className="text-[10px] text-amber-300 font-mono tracking-tight">{e.sender}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Movable & Draggable Emote Bar */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="relative inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-amber-400/30 backdrop-blur-xl shadow-xl shadow-black/50 z-30 touch-none group/drag select-none"
        title="Drag to move emote bar anywhere on screen"
      >
        {/* Drag Handle */}
        <div
          className="p-1 text-amber-400/50 hover:text-amber-300 transition cursor-grab active:cursor-grabbing flex items-center justify-center rounded-lg hover:bg-white/5"
          title="Click & Drag to reposition"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Smiley Trigger Button (matches custom yellow smiley aesthetic) */}
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-xl bg-[#121936] hover:bg-[#1c2652] border border-amber-400/40 hover:border-amber-400/80 text-amber-400 transition flex items-center justify-center shadow-md group relative"
          title="Send Reaction Emote or Chat Phrase"
        >
          <div className="w-6 h-6 rounded-full border-2 border-amber-400/90 flex items-center justify-center bg-amber-400/10 group-hover:bg-amber-400/20 transition-all">
            <Smile className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        {/* Quick Popover Menu */}
        {showMenu && (
          <div className="absolute top-full mt-2 right-0 z-50 bg-slate-950/95 border border-amber-400/30 backdrop-blur-2xl p-3.5 rounded-2xl shadow-2xl w-64 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Reactions & Phrases</span>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="text-white/40 hover:text-white transition p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                Quick Emojis
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_EMOTES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerEmote(emoji)}
                    className="p-2 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 rounded-xl text-xl transition transform hover:scale-110 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                Chat Phrases
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {QUICK_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => triggerEmote(phrase)}
                    className="w-full text-left px-2.5 py-1.5 bg-white/5 hover:bg-indigo-500/20 text-white text-xs rounded-lg transition truncate border border-white/5 hover:border-indigo-400/30 flex items-center justify-between group"
                  >
                    <span>{phrase}</span>
                    <Send className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 text-[9px] text-white/40 text-center italic border-t border-white/5">
              💡 Tip: Click & hold handle to drag this bar anywhere
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};
