import React, { useState } from 'react';
import { Trophy, Dices, Brain, Swords, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon, BookOpen, Gamepad2 } from 'lucide-react';

interface SEOFooterProps {
  onOpenWheelLobby?: () => void;
  onOpenLeaderboard: () => void;
  onOpenPuzzles: () => void;
  onOpenStats: () => void;
  onOpenMatchmaking: () => void;
  onOpenGameHub?: () => void;
  onOpenPrivacyTerms?: (tab?: 'privacy' | 'terms' | 'appflow') => void;
}

export const SEOFooter: React.FC<SEOFooterProps> = ({
  onOpenWheelLobby,
  onOpenLeaderboard,
  onOpenPuzzles,
  onOpenStats,
  onOpenMatchmaking,
  onOpenGameHub,
  onOpenPrivacyTerms,
}) => {
  const [showFaq, setShowFaq] = useState(false);

  return (
    <footer className="w-full mt-12 bg-[#0a0806]/95 border-t border-[#f3ce6b]/30 text-[#e0e0e0] py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main SEO Heading & Description */}
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#ffe89e] font-serif tracking-wide uppercase">
            Chess.pro Multiplayer Arena — Play Online Games
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed max-w-4xl">
            Welcome to <strong>Chess.pro Arena</strong>, the premier online platform for playing 
            <strong> multiplayer board and strategy games</strong>. Match with active players, participate in live rated multiplayer rooms, solve daily tactical puzzles, 
            and analyze positions using Google Gemini AI and evaluation engines.
          </p>
        </div>

        {/* Internal Links Navigation SEO */}
        <div className="bg-[#14100c]/80 border border-[#f3ce6b]/30 rounded-2xl p-5 backdrop-blur-md">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#f3ce6b] mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#f3ce6b]" />
            <span>Arena Navigation &amp; Quick Access</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {onOpenGameHub && (
              <button
                onClick={onOpenGameHub}
                className="p-3 rounded-xl bg-[#f3ce6b]/20 hover:bg-[#f3ce6b]/30 border border-[#f3ce6b]/40 text-[#ffe89e] transition font-bold flex items-center gap-2 text-left shadow-lg shadow-[#f3ce6b]/10"
              >
                <Gamepad2 className="w-4 h-4 text-[#f3ce6b] shrink-0" />
                <span>Multi-Game Hub</span>
              </button>
            )}

            {onOpenWheelLobby && (
              <button
                onClick={onOpenWheelLobby}
                className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 transition font-extrabold flex items-center gap-2 text-left shadow-lg shadow-amber-500/10"
              >
                <Dices className="w-4 h-4 text-amber-400 shrink-0" />
                <span>🎰 Wheel of Luck</span>
              </button>
            )}

            <button
              onClick={onOpenLeaderboard}
              className="p-3 rounded-xl bg-white/5 hover:bg-[#f3ce6b]/20 border border-white/10 hover:border-[#f3ce6b]/50 text-amber-200 transition font-bold flex items-center gap-2 text-left"
            >
              <Trophy className="w-4 h-4 text-[#f3ce6b] shrink-0" />
              <span>Global Leaderboard</span>
            </button>

            <button
              onClick={onOpenMatchmaking}
              className="p-3 rounded-xl bg-white/5 hover:bg-[#f3ce6b]/20 border border-white/10 hover:border-[#f3ce6b]/50 text-amber-200 transition font-bold flex items-center gap-2 text-left"
            >
              <Swords className="w-4 h-4 text-[#f3ce6b] shrink-0" />
              <span>Multiplayer Matchmaking</span>
            </button>

            <button
              onClick={onOpenPuzzles}
              className="p-3 rounded-xl bg-white/5 hover:bg-[#f3ce6b]/20 border border-white/10 hover:border-[#f3ce6b]/50 text-amber-200 transition font-bold flex items-center gap-2 text-left"
            >
              <Brain className="w-4 h-4 text-[#f3ce6b] shrink-0" />
              <span>Tactical Puzzles</span>
            </button>

            <button
              onClick={onOpenStats}
              className="p-3 rounded-xl bg-white/5 hover:bg-[#f3ce6b]/20 border border-white/10 hover:border-[#f3ce6b]/50 text-amber-200 transition font-bold flex items-center gap-2 text-left"
            >
              <BookOpen className="w-4 h-4 text-[#f3ce6b] shrink-0" />
              <span>Analytics &amp; Match History</span>
            </button>
          </div>
        </div>

        {/* Rich SEO Content Volume Section: Features & Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-300">
          <div className="bg-[#14100c]/60 border border-white/10 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-[#ffe89e] uppercase font-serif">
              ⚔️ Real-Time Matchmaking
            </h3>
            <p className="leading-relaxed">
              Experience dynamic pair matching! Join live online lobbies with instant queue balancing, rating calculation, and automated turn clocks.
            </p>
          </div>

          <div className="bg-[#14100c]/60 border border-white/10 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-[#ffe89e] uppercase font-serif">
              🤖 Gemini AI Strategy Tutor
            </h3>
            <p className="leading-relaxed">
              Stuck on a tricky position? Ask the integrated Google Gemini AI engine for real-time move analysis, 
              opening explanations, and tactical recommendations.
            </p>
          </div>

          <div className="bg-[#14100c]/60 border border-white/10 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-[#ffe89e] uppercase font-serif">
              🏆 Elite Leaderboard &amp; Rankings
            </h3>
            <p className="leading-relaxed">
              Climb through Platinum, Gold, Silver, and Bronze tiers on our global real-time leaderboard. 
              Track win rates, total matches, move accuracy, and opening delta performance.
            </p>
          </div>
        </div>

        {/* Collapsible FAQ Section */}
        <div className="bg-[#14100c]/80 border border-[#f3ce6b]/30 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[#ffe89e] hover:bg-white/5 transition"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#f3ce6b]" />
              <span>Frequently Asked Questions (FAQ)</span>
            </span>
            {showFaq ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFaq && (
            <div className="p-4 border-t border-white/10 space-y-4 text-xs text-gray-300">
              <div>
                <h4 className="font-extrabold text-[#f3ce6b]">Q: How does Multiplayer Matchmaking work?</h4>
                <p className="mt-1">
                  A: Select PvP Online or Quick Match in the arena header. You will automatically be paired with active online opponents.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-[#f3ce6b]">Q: Can I play against AI or friends locally?</h4>
                <p className="mt-1">
                  A: Yes! You can play solo against the AI engine with multiple difficulty levels, 
                  play local pass-and-play games with a friend, or compete online in live socket rooms.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-[#f3ce6b]">Q: Is registration required?</h4>
                <p className="mt-1">
                  A: No registration is required to play! Instant guest accounts are assigned automatically, 
                  or you can register/login to persist your win streak across sessions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span>&copy; {new Date().getFullYear()} <strong>Chess.pro Arena</strong>. All rights reserved.</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-stone-300 font-semibold">
              <span className="text-amber-400">👑</span> Owner: <strong className="text-white">Aditya</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-stone-200">
              <span className="text-xs">🇮🇳</span> Made in India
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => onOpenPrivacyTerms?.('privacy')}
              className="text-[#f3ce6b] hover:underline font-bold"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenPrivacyTerms?.('terms')}
              className="text-[#f3ce6b] hover:underline font-bold"
            >
              Terms &amp; Conditions
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenPrivacyTerms?.('appflow')}
              className="text-amber-300 hover:underline font-bold"
            >
              App Tour (Pages 1 &amp; 2)
            </button>
            <span>•</span>
            <span className="text-gray-500">Contact: mukkuc41@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
