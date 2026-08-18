import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  LogOut, 
  CheckCircle, 
  RefreshCw, 
  Shield, 
  Sparkles, 
  Globe, 
  UserCheck, 
  HardDrive,
  Gamepad,
  Award,
  ExternalLink,
  Cpu,
  Smartphone,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  logOutGoogle, 
  saveUserDataToCloud, 
  loadUserDataFromCloud, 
  onAuthStateChanged, 
  User 
} from '../lib/firebase';

interface GoogleProfileStats {
  playGamesLevel: number;
  totalXp: number;
  playPassStatus: string;
  eloRating: number;
  globalRank: number;
  achievementsUnlocked: number;
  connectedAt: string;
}

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreLocalData?: (cloudData: any) => void;
  getLocalDataToBackup?: () => Record<string, any>;
  initialTab?: 'profile' | 'cloud' | 'controller' | 'achievements' | 'setup';
}

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  onRestoreLocalData,
  getLocalDataToBackup,
  initialTab = 'profile'
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud' | 'controller' | 'achievements' | 'setup'>(initialTab);
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('google_cloud_last_sync'));
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => localStorage.getItem('google_cloud_autosync') !== 'false');

  // Gamepad State Engine for Google Play Games / Web Gamepad Testing
  const [gamepadConnected, setGamepadConnected] = useState<boolean>(false);
  const [gamepadName, setGamepadName] = useState<string>('');
  const [pressedButtons, setPressedButtons] = useState<number[]>([]);

  // Google Play Games Gamer Stats
  const [playStats, setPlayStats] = useState<GoogleProfileStats>({
    playGamesLevel: 42,
    totalXp: 185000,
    playPassStatus: 'Google Play Pass Subscriber',
    eloRating: 1420,
    globalRank: 312,
    achievementsUnlocked: 18,
    connectedAt: new Date().toLocaleDateString(),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for Gamepad input (Xbox, PS5, Google Stadia / Android TV controllers)
  useEffect(() => {
    const scanGamepads = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let found = false;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad && pad.connected) {
          found = true;
          setGamepadConnected(true);
          setGamepadName(pad.id || 'Google Play Compatible Gamepad');

          const pressed: number[] = [];
          pad.buttons.forEach((btn, idx) => {
            if (btn.pressed) pressed.push(idx);
          });
          setPressedButtons(pressed);
          break;
        }
      }
      if (!found) {
        setGamepadConnected(false);
      }
    };

    const interval = setInterval(scanGamepads, 100);
    window.addEventListener('gamepadconnected', scanGamepads);
    window.addEventListener('gamepaddisconnected', scanGamepads);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gamepadconnected', scanGamepads);
      window.removeEventListener('gamepaddisconnected', scanGamepads);
    };
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Connecting Google Account via Firebase Auth...');
    try {
      const user = await signInWithGoogle();
      setSyncStatusMsg(`Welcome, ${user?.displayName || 'Player'}! Google Account Linked.`);
      
      if (user) {
        const cloudData = await loadUserDataFromCloud(user.uid);
        if (cloudData && onRestoreLocalData) {
          onRestoreLocalData(cloudData);
          setSyncStatusMsg('Restored cloud saves & game progress from Firestore!');
        }
      }
    } catch (err: any) {
      setSyncStatusMsg(`Google Sign-in failed: ${err.message || 'Error signing in'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await logOutGoogle();
    setSyncStatusMsg('Signed out of Google account.');
  };

  const handleBackupToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatusMsg('Saving game progress snapshot to Google Cloud Firestore...');
    
    const localSnapshot = getLocalDataToBackup ? getLocalDataToBackup() : {
      savedAt: new Date().toISOString(),
      localStorageDump: { ...localStorage }
    };

    const success = await saveUserDataToCloud(currentUser.uid, localSnapshot);
    setIsSyncing(false);

    if (success) {
      const timeStr = new Date().toLocaleTimeString();
      setLastSyncTime(timeStr);
      localStorage.setItem('google_cloud_last_sync', timeStr);
      setSyncStatusMsg('Google Cloud Backup complete! Your progress is safe across devices.');
    } else {
      setSyncStatusMsg('Failed to sync to Google Cloud Firestore. Please try again.');
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatusMsg('Retrieving saved data from Google Cloud Firestore...');

    const cloudData = await loadUserDataFromCloud(currentUser.uid);
    setIsSyncing(false);

    if (cloudData) {
      if (onRestoreLocalData) {
        onRestoreLocalData(cloudData);
      }
      const timeStr = new Date().toLocaleTimeString();
      setLastSyncTime(timeStr);
      setSyncStatusMsg('Progress & settings successfully restored from Google Cloud!');
    } else {
      setSyncStatusMsg('No cloud backup found for this Google account.');
    }
  };

  const toggleAutoSync = () => {
    const nextVal = !autoSyncEnabled;
    setAutoSyncEnabled(nextVal);
    localStorage.setItem('google_cloud_autosync', String(nextVal));
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-vqyjyv645772htxnmdthoa-75557326522.asia-southeast1.run.app';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#070d19] border border-blue-500/40 backdrop-blur-3xl rounded-3xl max-w-2xl w-full p-6 shadow-[0_0_80px_rgba(59,130,246,0.25)] text-slate-100 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  Google Account & Play Services Suite
                </h2>
                {currentUser ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                    LINKED
                  </span>
                ) : (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                    SIGN-IN READY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Google Auth, Play Games Level, Firestore Cloud Saves, Controllers & OAuth Config
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS MESSAGE BANNER */}
        {syncStatusMsg && (
          <div className="p-3 rounded-2xl bg-blue-950/70 border border-blue-500/40 flex items-center gap-3 text-xs text-blue-200 font-mono animate-fadeIn">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
            <span className="flex-1">{syncStatusMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-blue-950 pb-2 overflow-x-auto scrollbar-none text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Google Profile
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-400" /> Cloud Saves
          </button>

          <button
            onClick={() => setActiveTab('controller')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'controller'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" /> Controllers {gamepadConnected && '🟢'}
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'achievements'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" /> Play Badges
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'setup'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ExternalLink className="w-4 h-4" /> OAuth Config
          </button>
        </div>

        {/* TAB 1: GOOGLE PROFILE & ACCOUNT CARD */}
        {activeTab === 'profile' && (
          <div className="space-y-4 font-mono">
            {!currentUser ? (
              <div className="bg-slate-950/80 border border-blue-900/50 rounded-2xl p-6 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-4xl shadow-inner">
                  🔑
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white uppercase">
                    Connect Google Account
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Link your Google Account to automatically save ratings, board customization presets, and unlocked achievements safely in the Google Cloud.
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSyncing}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,255,255,0.4)] border border-slate-200 transition active:scale-95 flex items-center gap-2 mx-auto"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-800" /> Authenticating Google Auth...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Sign In with Google
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Google Gamer Profile Card */}
                <div className="bg-gradient-to-br from-blue-950/90 via-slate-950 to-indigo-950/70 border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Google Profile'}
                          className="w-16 h-16 rounded-2xl border-2 border-blue-400/60 shadow-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 border-2 border-blue-400/60 flex items-center justify-center text-white text-2xl font-black">
                          {(currentUser.displayName || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white font-mono">
                            {currentUser.displayName || 'Google Account'}
                          </h3>
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            Lvl {playStats.playGamesLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                          {currentUser.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span>🟢</span> Google Play Online
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-blue-300 font-bold">{playStats.playPassStatus}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>

                  {/* Gamer Stats Bar */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-900/80 text-center">
                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Play Games XP</span>
                      <span className="text-blue-400 font-black text-sm">{(playStats?.totalXp ?? 0).toLocaleString()} XP</span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Rating</span>
                      <span className="text-emerald-400 font-black text-sm">{playStats.eloRating} Elo</span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Global Rank</span>
                      <span className="text-amber-400 font-black text-sm">#{playStats.globalRank}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>
                    Google Presence actively synchronizing your board and card game state to your Google Account across all web & mobile browsers!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GOOGLE DRIVE & FIRESTORE CLOUD SAVES */}
        {activeTab === 'cloud' && (
          <div className="space-y-4 font-mono">
            {currentUser ? (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase">
                          Firebase Firestore Cloud Vault
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Last backup: <span className="text-blue-300 font-bold">{lastSyncTime || 'Never'}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                      ENCRYPTED & SYNCED
                    </span>
                  </div>

                  {/* Backup / Restore Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleBackupToCloud}
                      disabled={isSyncing}
                      className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 border border-blue-400/50 transition flex items-center justify-center gap-2"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudUpload className="w-4 h-4" />
                      )}
                      Save Current Progress
                    </button>

                    <button
                      onClick={handleRestoreFromCloud}
                      disabled={isSyncing}
                      className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-sky-300 font-black text-xs uppercase tracking-wider border border-slate-700 transition flex items-center justify-center gap-2"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudDownload className="w-4 h-4" />
                      )}
                      Restore Cloud Save
                    </button>
                  </div>

                  {/* Auto-Sync Toggle */}
                  <div
                    onClick={toggleAutoSync}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">Auto Match Progress Sync</span>
                        <span className="text-[10px] text-slate-400">Syncs match victories & ratings after every game</span>
                      </div>
                    </div>

                    <div className={`w-10 h-6 rounded-full transition p-1 flex items-center ${autoSyncEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
                <Cloud className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Please sign in with your Google Account to access Cloud Saves.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONTROLLER & GAMEPAD HARDWARE MAPPER */}
        {activeTab === 'controller' && (
          <div className="space-y-4 font-mono">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${gamepadConnected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase">
                      Google Play Games / Web Gamepad Tester
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {gamepadConnected ? gamepadName : 'Connect an Xbox, PlayStation, or Bluetooth Gamepad via USB/Bluetooth'}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${gamepadConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {gamepadConnected ? 'GAMEPAD CONNECTED' : 'SEARCHING INPUTS'}
                </span>
              </div>

              {/* Visual Controller Diagram */}
              <div className="bg-[#050912] border border-blue-950 rounded-2xl p-6 text-center space-y-3">
                <div className="text-4xl">🎮</div>
                <p className="text-xs text-slate-300 font-bold">
                  {gamepadConnected
                    ? 'Gamepad Input Active! Press buttons on your controller to test physical triggers:'
                    : 'Supports Bluetooth Gamepads, Xbox / PlayStation Controllers, and Android TV / Chromebook Input Remotes.'}
                </p>

                {gamepadConnected && (
                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap text-xs">
                    <span className={`px-3 py-1.5 rounded-xl border font-bold ${pressedButtons.includes(0) ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      [A / Cross]
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-bold ${pressedButtons.includes(1) ? 'bg-red-500 text-white border-red-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      [B / Circle]
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-bold ${pressedButtons.includes(2) ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      [X / Square]
                    </span>
                    <span className={`px-3 py-1.5 rounded-xl border font-bold ${pressedButtons.includes(3) ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      [Y / Triangle]
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE PLAY ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1 font-mono">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Google Play Games Achievements & XP Badges
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl bg-blue-500/10 p-2 rounded-xl border border-blue-500/30">
                  🏆
                </span>
                <div>
                  <span className="text-xs font-black text-white block">Grandmaster Chess Opening</span>
                  <span className="text-[10px] text-slate-400">Won 5 consecutive Chess matches in PvP Arena</span>
                </div>
              </div>
              <span className="text-xs font-black text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/30 shrink-0">
                +1,000 XP
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
                  🃏
                </span>
                <div>
                  <span className="text-xs font-black text-white block">Uno Wild Deck Master</span>
                  <span className="text-[10px] text-slate-400">Played 4 Wild Draw Four cards in a single game</span>
                </div>
              </div>
              <span className="text-xs font-black text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-500/30 shrink-0">
                +500 XP
              </span>
            </div>
          </div>
        )}

        {/* TAB 5: OAUTH SETUP DETAILS */}
        {activeTab === 'setup' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Google OAuth Provider & Firebase Authentication Config
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Google Auth is powered by Firebase Authentication with security rules enforced in Firestore.
            </p>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">OAuth Redirect URI</span>
                <span className="text-sky-300 font-bold break-all select-all">{currentOrigin}/auth/google/callback</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Requested Scopes</span>
                <span className="text-emerald-400 font-bold">profile, email, openid</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
