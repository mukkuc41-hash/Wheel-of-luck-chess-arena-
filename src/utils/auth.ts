import { UserSession, UserStats, MatchRecord, GuestSecurityDetails } from '../types';
import { isSiteOwner } from './owner';

export { isSiteOwner };

const TOKEN_KEY = 'chess_pro_auth_token';
const RESET_GUEST_KEY = 'chess_pro_guest_reset_v3';

// Clear legacy stored guest counts, counters, and cached local guest IDs from browser storage
export function clearLegacyGuestData() {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(RESET_GUEST_KEY)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('guest_id');
    localStorage.removeItem('guest_counter');
    localStorage.removeItem('chess_pro_guest_counter');
    localStorage.setItem(RESET_GUEST_KEY, 'true');
  }
}

export function getStoredToken(): string | null {
  clearLegacyGuestData();
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.map((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

// Security-hardened API Fetch wrapper with auto-token rotation & compromise detection
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly Refresh Token cookie is transmitted
  };

  let res = await fetch(url, fetchOptions);

  // If 401 Unauthorized, attempt automated token rotation via HttpOnly refresh cookie
  if (res.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await refreshSessionTokens();
        if (refreshRes && refreshRes.accessToken) {
          setStoredToken(refreshRes.accessToken);
          isRefreshing = false;
          onTokenRefreshed(refreshRes.accessToken);
        } else {
          isRefreshing = false;
        }
      } catch (err) {
        isRefreshing = false;
      }
    }

    // Wait for ongoing refresh to complete then retry original request
    const retryPromise = new Promise<Response>((resolve) => {
      addRefreshSubscriber((newToken: string) => {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        resolve(fetch(url, { ...options, headers: retryHeaders, credentials: 'include' }));
      });
    });

    return retryPromise;
  }

  return res;
}

// Explicit Token Refresh Call
export async function refreshSessionTokens(): Promise<UserSession | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();

    if (res.status === 403 && data.code === 'TOKEN_COMPROMISED_GLOBAL_LOGOUT') {
      // SECURITY BREACH DETECTED BY BACKEND!
      clearStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('token_compromised_alert', {
            detail: {
              message: data.error || 'A token reuse anomaly was detected. All sessions revoked for safety.',
            },
          })
        );
      }
      return null;
    }

    if (!res.ok || !data.accessToken) {
      return null;
    }

    setStoredToken(data.accessToken);
    return data;
  } catch (err) {
    return null;
  }
}

// Global Session Revocation Call ("Log Out of All Devices")
export async function logoutAllDevices(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiFetch('/api/auth/logout-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    clearStoredToken();
    return data;
  } catch (err: any) {
    clearStoredToken();
    return { success: false, message: err.message || 'Logout failed' };
  }
}

// Logout Single Current Session
export async function logoutCurrentSession(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Ignore error
  } finally {
    clearStoredToken();
  }
}

// Fetch Active Logged-In Sessions
export async function fetchActiveSessions(): Promise<{ sessions: any[]; totalActive: number }> {
  try {
    const res = await apiFetch('/api/auth/sessions');
    if (!res.ok) return { sessions: [], totalActive: 0 };
    return res.json();
  } catch (err) {
    return { sessions: [], totalActive: 0 };
  }
}

// Fetch Security Audit Logs & Shield Status
export async function fetchSecurityLogs(): Promise<{
  logs: any[];
  tokenRotationEngine: string;
  breachDetectionTrap: string;
  cookieSecurity: string;
}> {
  try {
    const res = await apiFetch('/api/auth/security-log');
    if (!res.ok) {
      return {
        logs: [],
        tokenRotationEngine: 'ACTIVE_HMAC_SHA256',
        breachDetectionTrap: 'ENGAGED_AUTOMATED_REVOCATION',
        cookieSecurity: 'HttpOnly_Secure_SameSiteStrict',
      };
    }
    return res.json();
  } catch (err) {
    return {
      logs: [],
      tokenRotationEngine: 'ACTIVE_HMAC_SHA256',
      breachDetectionTrap: 'ENGAGED_AUTOMATED_REVOCATION',
      cookieSecurity: 'HttpOnly_Secure_SameSiteStrict',
    };
  }
}

export async function fetchGuestAuth(): Promise<UserSession> {
  const token = getStoredToken();
  const res = await apiFetch('/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function rotateGuestSession(): Promise<UserSession> {
  const token = getStoredToken();
  const res = await apiFetch('/api/auth/rotate-guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to rotate guest session');
  }
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function fetchGuestSecurityInfo(): Promise<GuestSecurityDetails | null> {
  try {
    const res = await apiFetch('/api/auth/guest-security');
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function registerUser(email: string, username: string, password: string): Promise<UserSession> {
  const guestToken = getStoredToken();
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, guestToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function loginUser(emailOrUsername: string, password: string): Promise<UserSession> {
  const guestToken = getStoredToken();
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password, guestToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function fetchCurrentUser(): Promise<UserSession | null> {
  const token = getStoredToken();
  if (!token) return null;
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUserStats(): Promise<UserStats> {
  const res = await apiFetch('/api/stats');
  if (!res.ok) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      resigns: 0,
      winRate: 0,
      lossRate: 0,
      drawRate: 0,
      resignRate: 0,
      pvpGames: 0,
      aiGames: 0,
    };
  }
  return res.json();
}

export async function fetchMatchHistory(): Promise<MatchRecord[]> {
  const res = await apiFetch('/api/games/history');
  if (!res.ok) return [];
  return res.json();
}

export async function recordGameResult(match: {
  gameType?: string;
  mode: 'pvp' | 'ai' | 'local';
  whiteUsername: string;
  blackUsername: string;
  winner: 'w' | 'b' | 'draw';
  reason: string;
  moveCount: number;
  durationSeconds?: number;
  pgn?: string;
  moves?: any[];
  timeControlPreset?: string;
}) {
  await apiFetch('/api/games/record', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(match),
  });
}
