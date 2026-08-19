import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Smartphone, Mail, Globe, Lock, PlayCircle, Image as ImageIcon, ArrowRight, AlertTriangle } from 'lucide-react';
import { agreePrivacyPolicy, hasAgreedPrivacyPolicy } from '../utils/auth';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'appflow';
  isCompulsory?: boolean;
  onAgree?: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
  isCompulsory = false,
  onAgree,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'appflow'>(defaultTab);
  const [isAgreed, setIsAgreed] = useState<boolean>(!isCompulsory && hasAgreedPrivacyPolicy());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setIsAgreed(hasAgreedPrivacyPolicy());
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleAgreeAndProceed = async () => {
    if (!isAgreed) {
      alert('You must read and agree to all terms and conditions and privacy policy before entering the platform.');
      return;
    }
    await agreePrivacyPolicy();
    if (onAgree) {
      onAgree();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
      onClick={(e) => {
        if (!isCompulsory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-950 border border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/90 flex flex-col text-white">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>Chess.pro Legal &amp; User Agreement</span>
                {isCompulsory ? (
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full font-bold">
                    Mandatory Agreement Required
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-semibold">
                    Official Terms &amp; Policy
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {isCompulsory
                  ? 'Compulsory user agreement: You must accept all terms to access matches & track statistics'
                  : 'Official Privacy Policy, Terms of Service & App Architecture'}
              </p>
            </div>
          </div>
          {!isCompulsory && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Compulsory Notification Notice if needed */}
        {isCompulsory && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Welcome! To ensure security, privacy compliance, and accurate telemetry time tracking, please agree to the terms below to unlock your first game.
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900/60 p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms &amp; Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('appflow')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'appflow'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Flow &amp; Tour (Pages 1 &amp; 2)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 leading-relaxed text-slate-300 text-sm">
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Welcome to Chess.pro Privacy Guarantee</h3>
                  <p>
                    Welcome to Chess.pro (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are highly committed to protecting your personal information and your right to privacy. If you have any questions, concerns, or feedback regarding this privacy notice or our data handling practices, please contact us at <a href="mailto:mukkuc41@gmail.com" className="text-amber-300 underline font-bold">mukkuc41@gmail.com</a>.
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">01.</span> Information We Collect
                </h3>
                <p className="text-xs text-slate-300">
                  We only collect information that you directly provide to us, or data that is automatically generated when you browse our platform:
                </p>
                <ul className="space-y-2 text-xs list-disc list-inside text-slate-300 pl-2">
                  <li>
                    <strong className="text-white">Voluntary Communication Data:</strong> If you contact us directly via email for support, content inquiries, or feedback, we collect your email address and any text or attachments you choose to send.
                  </li>
                  <li>
                    <strong className="text-white">Usage and Log Data:</strong> Our web hosting servers automatically record standard internet log data when you access Chess.pro. This includes your device&apos;s anonymized IP address, browser type, operating system, referring pages, and the specific timestamps of your visits.
                  </li>
                  <li>
                    <strong className="text-white">Cookies:</strong> We use basic browser cookies to enhance performance, save user interface preferences, and analyze generalized, aggregated traffic patterns.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">02.</span> How We Use Your Information
                </h3>
                <p className="text-xs text-slate-300">
                  The details we collect are used strictly to:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-amber-400 font-bold block mb-1">⚙️ Platform Maintenance</span>
                    Maintain, secure, optimize, and improve the Chess.pro platform.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-indigo-400 font-bold block mb-1">💬 Direct Support</span>
                    Respond to user inquiries and provide support via email.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-emerald-400 font-bold block mb-1">📊 Server Stability</span>
                    Monitor site traffic trends to ensure backend server stability and smooth performance.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-red-400 font-bold block mb-1">🛡️ Anti-Abuse Protection</span>
                    Protect our website against cyber threats, automated spam, and abuse.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">03.</span> Data Protection and Sharing
                </h3>
                <p className="text-xs text-slate-300">
                  We implement industry-standard security practices to keep your data safe. Chess.pro does not sell, rent, trade, or share your personal information with third-party companies.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">04.</span> Third-Party Links &amp; Integrations
                </h3>
                <p className="text-xs text-slate-300">
                  As a platform exploring chess strategies and tools, our website may contain links to external websites, databases, or media services. We do not control or operate these third-party platforms, and we strongly recommend reviewing their respective privacy policies when visiting them.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">05.</span> Updates to This Policy
                </h3>
                <p className="text-xs text-slate-300">
                  We reserve the right to update this Privacy Policy at any time. Any changes will be updated on this page with a revised &quot;Last Updated&quot; date (May 2026).
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 text-xs flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Terms &amp; Conditions (Rules &amp; Regulations)</h3>
                  <p>
                    Please read these Terms &amp; Conditions carefully before using the website operated by Chess.pro (the &quot;Service&quot;). By accessing or using our website, you agree to be bound by these rules. If you disagree with any part of these terms, you do not have permission to access the Service.
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">01.</span> Intellectual Property Rights
                </h3>
                <p className="text-xs text-slate-300">
                  The Service and its original features, custom web tools, code architecture, written content, UI design, and platform imagery are the exclusive property of Chess.pro and its creators. Unauthorized duplication, modification, web scraping, or commercial distribution of our platform assets is strictly prohibited without explicit written consent.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">02.</span> Prohibited User Conduct
                </h3>
                <p className="text-xs text-slate-300">
                  To ensure a secure environment for all users, you agree not to engage in any of the following activities:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl">
                    <strong className="text-red-300 block mb-0.5">🚫 Automated Scraping:</strong>
                    Using scrapers, crawlers, bots, or custom automated scripts to extract data, media, or content from Chess.pro.
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl">
                    <strong className="text-red-300 block mb-0.5">🚫 Infrastructure Abuse:</strong>
                    Flooding our servers with excessive queries, DDOS attempts, or actions that intentionally slow down site performance.
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl">
                    <strong className="text-red-300 block mb-0.5">🚫 Malicious Injections:</strong>
                    Attempting to upload or inject malicious code, scripts, viruses, or trojans into the website interface or backend.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">03.</span> Disclaimer of Warranties
                </h3>
                <p className="text-xs text-slate-300">
                  The tools, information, and features on Chess.pro are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Chess.pro makes no warranties, expressed or implied, regarding the absolute accuracy, completeness, or reliability of any data, content, or external links hosted on the platform. You utilize the platform&apos;s resources entirely at your own risk.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">04.</span> Limitation of Liability
                </h3>
                <p className="text-xs text-slate-300">
                  In no event shall Chess.pro, its creators, or its affiliates be held liable for any direct, indirect, incidental, or consequential damages resulting from your access to, use of, or inability to access our platform or tools.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">05.</span> Governing Law
                </h3>
                <p className="text-xs text-slate-300">
                  These Terms shall be governed and construed in accordance with the laws of <strong className="text-white">Rajasthan, India</strong>, without regard to its conflict of law provisions. Any legal actions or disputes related to Chess.pro must be filed exclusively in the courts located within that jurisdiction.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">06.</span> Contact Us
                </h3>
                <p className="text-xs text-slate-300">
                  For any clarifications regarding these Terms and Conditions or the Privacy Policy, please reach out to us at <a href="mailto:mukkuc41@gmail.com" className="text-amber-300 underline font-bold">mukkuc41@gmail.com</a>.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'appflow' && (
            <div className="space-y-6">


              {/* Page 1: Image & Video Overview of App */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Page 1: Multi-Game Visual Tour &amp; Architecture</h3>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-bold">
                    Page 1 Explanation
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Page 1 introduces users to the 5 core board game arenas built into Chess.pro: Chess, Draughts (Checkers), Backgammon, Snakes &amp; Ladders, and Ludo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>♔ Master Chess &amp; Draughts Engine</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Real-time Stockfish AI evaluation, opening book recognition (Ruy Lopez, Sicilian Defense), 3D piece rendering, and custom board themes.
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>🎲 Backgammon &amp; Casual Board Hub</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Interactive pip count calculators, 3D dice physics, snakes &amp; ladders tile animations, and Ludo token home corridors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Page 2: Video & Real-Time Security Explanation */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Page 2: Secure Guest Authentication &amp; Video Walkthrough</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                    Page 2 Explanation
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Page 2 details the cryptographic guest security vault and real-time WebSocket room architecture behind Chess.pro.
                </p>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300">Key Security &amp; Infrastructure Specifications:</h4>
                  <ul className="space-y-1.5 text-[11px] text-gray-300 list-disc list-inside">
                    <li><strong className="text-white">Collision-Free UUID v4:</strong> Unbounded, guaranteed unique guest sessions.</li>
                    <li><strong className="text-white">Hardware Binding:</strong> Salted SHA-256 signatures tying guest profiles to local storage vault.</li>
                    <li><strong className="text-white">Rate Limit Defense:</strong> Max 3 guest creations per 24-hour IP window against bot attacks.</li>
                    <li><strong className="text-white">Pure Guest Purge:</strong> One-click instant purge of stale guest accounts.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-semibold select-none">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-400 bg-white/10 border-white/20 cursor-pointer"
            />
            <span>I have read and agree to all terms &amp; conditions and privacy policy</span>
          </label>

          <button
            onClick={handleAgreeAndProceed}
            disabled={!isAgreed}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>I Agree &amp; Proceed to Main Platform &gt;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
