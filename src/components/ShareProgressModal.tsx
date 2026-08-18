import React, { useState } from 'react';
import { X, Share2, Copy, Check, Twitter, MessageCircle, Send, Trophy, Flame, Swords, Sparkles, Gamepad2 } from 'lucide-react';
import { ActiveBoardGame, UserStats, GameResult } from '../types';

interface ShareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBoardGame?: ActiveBoardGame;
  gameTitle?: string;
  moveCount?: number;
  gameResult?: GameResult | null;
  stats?: UserStats | null;
  roomId?: string | null;
  username?: string;
}

export const ShareProgressModal: React.FC<ShareProgressModalProps> = ({
  isOpen,
  onClose,
  activeBoardGame = 'chess',
  gameTitle = 'Chess Pro Arena',
  moveCount = 0,
  gameResult,
  stats,
  roomId,
  username = 'Player',
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'career'>('match');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  // Build match progress text
  let resultText = 'Playing an intense match!';
  if (gameResult?.winner) {
    if (gameResult.winner === 'draw') {
      resultText = `Drew a match (${gameResult.reason || 'Draw'})`;
    } else {
      resultText = `Won the match! 🏆 (${gameResult.reason || 'Victory'})`;
    }
  }

  const matchShareText = `🎮 ${gameTitle} Progress Update!\n👤 Player: ${username}\n⚔️ ${resultText}\n♟️ Moves: ${moveCount}${roomId ? `\n🔑 Room ID: ${roomId}` : ''}\n\nPlay with me on Chess Pro Arena: ${appUrl}`;

  const careerShareText = `🏆 My Game Career Progress on Chess Pro Arena!\n👤 Player: ${username}\n🔥 Streak: ${stats?.dailyStreak || 1} Days\n🎯 Win Rate: ${stats?.winRate || 0}%\n⚔️ Total Games Played: ${stats?.totalGames || 0} (${stats?.wins || 0} Wins)\n\nJoin the challenge: ${appUrl}`;

  const currentShareText = activeTab === 'match' ? matchShareText : careerShareText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chess Pro Arena - Game Progress',
          text: currentShareText,
          url: appUrl,
        });
      } catch (err) {
        console.log('Share canceled or error', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(currentShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-3xl max-w-md w-full overflow-hidden shadow-2xl shadow-indigo-500/10 flex flex-col relative">
        {/* Top Accent */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Share Progress</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-200/60">Broadcast your game state and stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-white/5 border-b border-white/10 flex gap-2">
          <button
            onClick={() => setActiveTab('match')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'match'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Match Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'career'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Career Stats</span>
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-purple-950/60 border border-indigo-500/30 shadow-inner space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{activeTab === 'match' ? 'Active Match Card' : 'Career Progression Summary'}</span>
              </span>
              <span className="text-[10px] text-white/40 font-mono">{new Date().toLocaleDateString()}</span>
            </div>

            {activeTab === 'match' ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-white">
                  <span className="text-gray-400">Game Mode:</span>
                  <span className="font-bold text-indigo-300">{gameTitle}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-gray-400">Player:</span>
                  <span className="font-medium text-emerald-300">{username}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-bold text-amber-300">{resultText}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-gray-400">Moves Played:</span>
                  <span className="font-mono text-indigo-200">{moveCount}</span>
                </div>
                {roomId && (
                  <div className="flex justify-between items-center text-white">
                    <span className="text-gray-400">Room Code:</span>
                    <span className="font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      {roomId}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Daily Streak</span>
                  </span>
                  <span className="text-lg font-black text-amber-400 mt-0.5">
                    {stats?.dailyStreak || 1} Days
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-emerald-400" />
                    <span>Win Rate</span>
                  </span>
                  <span className="text-lg font-black text-emerald-300 mt-0.5">
                    {stats?.winRate || 0}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Swords className="w-3 h-3 text-indigo-400" />
                    <span>Total Matches</span>
                  </span>
                  <span className="text-lg font-black text-white mt-0.5">
                    {stats?.totalGames || 0}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[10px] text-gray-400">Total Wins</span>
                  <span className="text-lg font-black text-indigo-300 mt-0.5">
                    {stats?.wins || 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Social Quick Share Buttons */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Direct Social Share
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleTwitterShare}
                className="py-2.5 px-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Twitter className="w-4 h-4" />
                <span>X / Twitter</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleTelegramShare}
                className="py-2.5 px-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="pt-2 flex gap-2">
            {'share' in navigator && (
              <button
                onClick={handleWebShare}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via App</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Progress Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text Card</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
