import React, { useState } from 'react';
import { UserSession } from '../types';
import { loginUser, registerUser, clearStoredToken, logoutAllDevices, rotateGuestSession } from '../utils/auth';
import { X, UserCheck, LogIn, UserPlus, ShieldAlert, LogOut, Shield, Lock, RefreshCw, Key, ShieldCheck, Crown } from 'lucide-react';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface AuthModalProps {
  isOpen: boolean;
  user: UserSession | null;
  onClose: () => void;
  onUserUpdated: (user: UserSession) => void;
  onLogout: () => void;
  onOpenPrivacyTerms?: (tab?: 'privacy' | 'terms' | 'appflow') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  onClose,
  onUserUpdated,
  onLogout,
  onOpenPrivacyTerms,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'login' | 'signup'>(
    user?.isGuest ? 'login' : 'info'
  );
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [rotatingGuest, setRotatingGuest] = useState(false);
  const [rotationMsg, setRotationMsg] = useState('');

  if (!isOpen) return null;

  const handleRotateGuest = async () => {
    setRotatingGuest(true);
    setRotationMsg('');
    setErrorMsg('');
    try {
      const newSession = await rotateGuestSession();
      onUserUpdated(newSession);
      setRotationMsg(`Session rotated! Display handle updated to ${newSession.username} & old credentials burned.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rotate guest session');
    } finally {
      setRotatingGuest(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const u = await loginUser(loginInput, loginPassword);
      onUserUpdated(u);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const u = await registerUser(signupEmail, signupUsername, signupPassword);
      onUserUpdated(u);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">User Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Handle Banner */}
        <div className={`p-4 border-b flex flex-col gap-3 transition-all ${
          isSiteOwner(user?.username)
            ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border-amber-500/40'
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${isSiteOwner(user?.username) ? 'text-amber-300' : 'text-indigo-300/70'}`}>
                {isSiteOwner(user?.username) ? '👑 Verified Site Owner Identity' : 'Active Identity'}
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5 flex-wrap">
                <span>{user?.username || 'Guest'}</span>
                {isSiteOwner(user?.username) ? (
                  <OwnerBadge username={user?.username} size="xs" label="SITE OWNER" showSparkle={true} />
                ) : user?.isGuest ? (
                  <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span>Free Instant Guest</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Registered Account
                  </span>
                )}
              </div>
            </div>

            {!user?.isGuest ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (confirm('Log out of ALL devices globally? All session tokens across all devices will be invalidated.')) {
                      await logoutAllDevices();
                      onLogout();
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-xl transition flex items-center gap-1"
                  title="Revoke all active tokens across all devices"
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Log Out All Devices</span>
                </button>

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 rounded-xl transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleRotateGuest}
                disabled={rotatingGuest}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                title="Instantly burn current guest credentials and issue new display handle + high-entropy token"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rotatingGuest ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`} />
                <span>Burn &amp; Rotate Session</span>
              </button>
            )}
          </div>

          {user?.isGuest && (
            <div className="p-3 rounded-xl bg-black/40 border border-indigo-500/20 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Security Token:</span>
                </span>
                <span className="font-mono text-indigo-300 font-bold">
                  {user.maskedHighEntropyToken || 'g_L9#vX...xP7'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Cookie Protection:</span>
                <span className="text-emerald-400 font-medium">HttpOnly · Secure · SameSite=Strict</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Keyspace Entropy:</span>
                <span className="text-gray-300 font-medium">256-bit Cryptographic Random</span>
              </div>
              {rotationMsg && (
                <div className="mt-1 p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{rotationMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-indigo-400 text-indigo-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'border-indigo-400 text-indigo-300 bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-indigo-200/70 font-semibold mb-1 block">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Enter email or username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-indigo-200/70 font-semibold mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50 disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Log In to Account'}
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative bg-slate-950 px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Or Play Instantly
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    onUserUpdated(user);
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-200 font-bold text-sm transition border border-amber-400/40 flex items-center justify-center gap-2 shadow-md"
              >
                <span>⚡ Continue as Guest (Next: Privacy Policy) &gt;</span>
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-xs text-indigo-200/90 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Permanent Cloud Account</div>
                  <div className="text-[10px] text-gray-300 mt-0.5 leading-relaxed">
                    Your credentials, Elo rating, and match history are stored permanently in the Cloud SQL database so you can log in from any browser, device, or location anytime.
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-indigo-200/70 font-semibold mb-1 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="grandmaster@chess.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-indigo-200/70 font-semibold mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="e.g. Kasparov99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-indigo-200/70 font-semibold mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50 disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Profile...' : 'Create Permanent Account'}
              </button>
            </form>
          )}

          {/* Privacy & Terms Footer Link */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span>By continuing, you agree to our</span>
            <button
              onClick={() => onOpenPrivacyTerms?.('privacy')}
              className="text-amber-300 hover:underline font-bold"
            >
              Privacy Policy &amp; Terms (May 2026)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
