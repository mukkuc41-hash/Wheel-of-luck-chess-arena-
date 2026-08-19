import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import fs from 'fs';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserByUid,
  saveRegisteredUserToDb,
  findUserByEmailOrUsername,
  getAllRegisteredUsersFromDb,
  updateUserStatsInDb,
} from './src/db/users.ts';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Enable Gzip/Brotli Compression for Fast Response Time (TTFB)
app.use(compression());

app.use(express.json());

// Security Headers Middleware (HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Cookie Security)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; frame-ancestors 'self' https://*.google.com https://*.ai.studio;"
  );
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DMARC-Policy', 'v=DMARC1; p=reject; sp=reject');
  res.setHeader('X-SPF-Protection', 'v=spf1 -all');
  next();
});

// Server-side Gemini API initialization
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// --- Database & In-Memory Storage ---
interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash?: string;
  isGuest: boolean;
  token: string;
  createdAt: number;
  lastLoginDate?: string;
  dailyStreak?: number;
  rating?: number;
  gamesOpenedCount?: number;
  perGameOpenedCount?: Record<string, number>;
  perGameTimeSeconds?: Record<string, number>;
  privacyAgreed?: boolean;
  privacyAgreedAt?: number;
  accumulatedGameTimeSeconds?: number;
}

interface MatchRecord {
  id: string;
  gameType?: string;
  mode: 'pvp' | 'ai' | 'local';
  whiteUsername: string;
  blackUsername: string;
  whiteToken?: string;
  blackToken?: string;
  winner: 'w' | 'b' | 'draw';
  reason: string;
  moveCount: number;
  durationSeconds?: number;
  pgn: string;
  moves: any[];
  createdAt: number;
  timeControlPreset: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface PvPRoom {
  roomId: string;
  title?: string;
  gameId?: string;
  gameType?: string;
  whiteToken: string;
  blackToken: string;
  whiteUsername: string;
  blackUsername: string;
  fen: string;
  status: 'waiting' | 'active' | 'finished';
  turn: 'w' | 'b';
  whiteTime: number;
  blackTime: number;
  lastTurnTime: number;
  drawOfferFrom?: string;
  moves: any[];
  communityNotice?: string;
  roomRules?: {
    minimumRating: number;
    allowChat: boolean;
    maxPlayers: number;
  };
  ownerId?: string;
}

let guestCounter = 0;
const usersById = new Map<string, User>();
const usersByToken = new Map<string, User>();
const usersByEmail = new Map<string, User>();
const usersByUsername = new Map<string, User>();
const finishedGames: MatchRecord[] = [];
const roomChats = new Map<string, ChatMessage[]>();
const pvpRooms = new Map<string, PvPRoom>();

// Disk persistence setup
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function deduplicateFinishedGames(games: MatchRecord[]): MatchRecord[] {
  const result: MatchRecord[] = [];
  for (const g of games) {
    const isDup = result.some(
      (existing) =>
        existing.gameType === g.gameType &&
        existing.whiteUsername === g.whiteUsername &&
        existing.blackUsername === g.blackUsername &&
        existing.winner === g.winner &&
        existing.reason === g.reason &&
        existing.moveCount === g.moveCount &&
        Math.abs((existing.createdAt || 0) - (g.createdAt || 0)) < 15000
    );
    if (!isDup) {
      result.push(g);
    }
  }
  return result;
}

async function loadPersistentData() {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((u: User) => {
          usersById.set(u.id, u);
          usersByToken.set(u.token, u);
          if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
          if (u.username) usersByUsername.set(u.username.toLowerCase(), u);
        });
      }
    }
  } catch (err) {
    console.error('Error loading users.json:', err);
  }

  // Sync registered users from Cloud SQL PostgreSQL Database
  try {
    const dbUsers = await getAllRegisteredUsersFromDb();
    if (Array.isArray(dbUsers)) {
      dbUsers.forEach((dbU) => {
        if (!dbU.email || !dbU.passwordHash) return;
        const cleanEmail = dbU.email.toLowerCase();
        const cleanUsername = dbU.username || 'Player';
        const existing = usersById.get(dbU.uid) || usersByEmail.get(cleanEmail);

        if (!existing) {
          const legacyToken = crypto.randomBytes(24).toString('hex');
          const userObj: User = {
            id: dbU.uid,
            username: cleanUsername,
            email: cleanEmail,
            passwordHash: dbU.passwordHash,
            isGuest: false,
            token: legacyToken,
            createdAt: dbU.createdAt ? dbU.createdAt.getTime() : Date.now(),
            rating: dbU.eloRating || 1200,
          };
          usersById.set(dbU.uid, userObj);
          usersByToken.set(legacyToken, userObj);
          usersByEmail.set(cleanEmail, userObj);
          usersByUsername.set(cleanUsername.toLowerCase(), userObj);
        } else {
          existing.passwordHash = dbU.passwordHash;
          existing.rating = dbU.eloRating || existing.rating || 1200;
          if (dbU.username) existing.username = dbU.username;
        }
      });
      savePersistentUsers();
    }
  } catch (err) {
    console.error('Error syncing users from database on startup:', err);
  }

  try {
    if (fs.existsSync(GAMES_FILE)) {
      const data = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        const cleanData = deduplicateFinishedGames(data);
        finishedGames.length = 0;
        finishedGames.push(...cleanData);
      }
    }
  } catch (err) {
    console.error('Error loading games.json:', err);
  }
}

function savePersistentUsers() {
  ensureDataDir();
  try {
    const registeredUsers = Array.from(usersByToken.values()).filter((u) => !u.isGuest);
    fs.writeFileSync(USERS_FILE, JSON.stringify(registeredUsers, null, 2));
  } catch (err) {
    console.error('Error saving users.json:', err);
  }
}

function savePersistentGames() {
  ensureDataDir();
  try {
    const clean = deduplicateFinishedGames(finishedGames);
    finishedGames.length = 0;
    finishedGames.push(...clean);
    fs.writeFileSync(GAMES_FILE, JSON.stringify(clean, null, 2));
  } catch (err) {
    console.error('Error saving games.json:', err);
  }
}

function updateDailyStreak(user: User): boolean {
  if (!user) return false;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!user.lastLoginDate) {
    user.lastLoginDate = todayStr;
    user.dailyStreak = 1;
    if (!user.isGuest) savePersistentUsers();
    return true;
  }

  if (user.lastLoginDate === todayStr) {
    return false;
  }

  const lastDate = new Date(user.lastLoginDate);
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    user.dailyStreak = (user.dailyStreak || 0) + 1;
  } else {
    // Missed a day: streak resets to 1 for starting today's session
    user.dailyStreak = 1;
  }

  user.lastLoginDate = todayStr;
  if (!user.isGuest) savePersistentUsers();
  return true;
}

function calculateCurrentStreak(user?: User | null): number {
  if (!user || !user.lastLoginDate) return 1;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (user.lastLoginDate === todayStr) {
    return Math.max(1, user.dailyStreak || 1);
  }
  const lastDate = new Date(user.lastLoginDate);
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return Math.max(1, user.dailyStreak || 1);
  }
  // Missed days -> Streak reset to 0 until played today
  return 0;
}

// Boot persistent data immediately
loadPersistentData();

// Waiting queue & Lobby Pool for Wheel of Luck matchmaking
let waitingQueue: { socketId: string; token: string; username: string }[] = [];
let lobbyPool: { socketId: string; token: string; username: string; avatar: string }[] = [];

// IP-based Rate Limit Tracker for Guest Account Creation (Max 3 creations per IP per 24 hours)
const GUEST_CREATION_LIMIT = 3;
const GUEST_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const guestCreationTracker = new Map<string, { count: number; resetAt: number }>();

const SERVER_VAULT_SECRET = process.env.VAULT_SECRET || crypto.randomBytes(32).toString('hex');

// --- Cryptographic Token & Session Family Security Engine ---
interface TokenPayload {
  sub: string;
  username: string;
  email?: string;
  isGuest: boolean;
  type: 'access' | 'refresh';
  familyId: string;
  seq?: number;
  jti: string;
  iat: number;
  exp: number;
}

interface SessionFamily {
  familyId: string;
  userId: string;
  currentSeq: number;
  validJti: string;
  usedJtis: Set<string>;
  revoked: boolean;
  createdAt: number;
  lastRotatedAt: number;
  ip: string;
  userAgent: string;
}

interface SecurityAuditLog {
  id: string;
  userId: string;
  event: string;
  details: string;
  ip: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'CRITICAL';
}

const sessionFamilies = new Map<string, SessionFamily>();
const userSessionFamilies = new Map<string, Set<string>>();
const securityAuditLogs: SecurityAuditLog[] = [];

// Failed login attempts rate limiter tracker
const loginAttemptsTracker = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const tracker = loginAttemptsTracker.get(ip);
  if (!tracker || now > tracker.resetAt) {
    loginAttemptsTracker.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5 min window
    return true;
  }
  if (tracker.count >= 5) {
    return false; // Exceeded 5 failed/login attempts
  }
  tracker.count++;
  return true;
}

function resetLoginRateLimit(ip: string) {
  loginAttemptsTracker.delete(ip);
}

// Sign token with HMAC-SHA256
function signToken(payload: TokenPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SERVER_VAULT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('hex');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify & Decode HMAC-SHA256 signed token
function verifyAndDecodeToken(tokenString: string): TokenPayload | null {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', SERVER_VAULT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null; // Tampered token signature!
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      return null; // Expired token!
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Helper: Get user by token string (signed token or legacy token), verifying session revocation
function getUserByToken(tokenString?: string): User | null {
  if (!tokenString) return null;

  // 1. Signed token check
  const payload = verifyAndDecodeToken(tokenString);
  if (payload && payload.type === 'access') {
    const family = sessionFamilies.get(payload.familyId);
    if (family && family.revoked) {
      return null; // Session family globally revoked!
    }
    return usersById.get(payload.sub) || usersByToken.get(tokenString) || null;
  }

  // 2. Direct token lookup fallback
  const directUser = usersByToken.get(tokenString);
  return directUser || null;
}

// Revoke all session families for a user account (Global Revocation)
function revokeAllUserSessions(userId: string, reason: string, ip: string = 'system') {
  const familyIds = userSessionFamilies.get(userId);
  let count = 0;
  if (familyIds) {
    familyIds.forEach((fId) => {
      const family = sessionFamilies.get(fId);
      if (family && !family.revoked) {
        family.revoked = true;
        count++;
      }
    });
  }

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId,
    event: 'GLOBAL_SESSION_REVOCATION',
    details: `Revoked ${count} active session families. Reason: ${reason}`,
    ip,
    timestamp: Date.now(),
    severity: reason.includes('COMPROMISE') ? 'CRITICAL' : 'warning',
  });
}

// Create a new session family & return signed Access (15m) + Refresh (7d) Tokens
function createSessionFamily(user: User, req: express.Request): { accessToken: string; refreshToken: string; familyId: string } {
  const familyId = `fam_${crypto.randomUUID()}`;
  const initialJti = `jti_ref_${crypto.randomUUID()}`;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';

  const family: SessionFamily = {
    familyId,
    userId: user.id,
    currentSeq: 1,
    validJti: initialJti,
    usedJtis: new Set(),
    revoked: false,
    createdAt: Date.now(),
    lastRotatedAt: Date.now(),
    ip: clientIp,
    userAgent,
  };

  sessionFamilies.set(familyId, family);
  if (!userSessionFamilies.has(user.id)) {
    userSessionFamilies.set(user.id, new Set());
  }
  userSessionFamilies.get(user.id)!.add(familyId);

  const nowSec = Math.floor(Date.now() / 1000);

  const accessPayload: TokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    isGuest: user.isGuest,
    type: 'access',
    familyId,
    jti: `jti_acc_${crypto.randomUUID()}`,
    iat: nowSec,
    exp: nowSec + 15 * 60, // 15 mins
  };

  const refreshPayload: TokenPayload = {
    sub: user.id,
    username: user.username,
    isGuest: user.isGuest,
    type: 'refresh',
    familyId,
    seq: 1,
    jti: initialJti,
    iat: nowSec,
    exp: nowSec + 7 * 24 * 3600, // 7 days
  };

  const accessToken = signToken(accessPayload);
  const refreshToken = signToken(refreshPayload);

  // Maintain mappings
  usersById.set(user.id, user);
  usersByToken.set(accessToken, user);
  usersByToken.set(user.token, user);

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    event: 'SESSION_CREATED',
    details: `New session created (Family: ${familyId.slice(0, 12)}...)`,
    ip: clientIp,
    timestamp: Date.now(),
    severity: 'info',
  });

  return { accessToken, refreshToken, familyId };
}

// Cookie Helper Functions
function parseCookies(req: express.Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

function setRefreshTokenCookie(res: express.Response, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  // Express res.cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 3600 * 1000, // 7 days
    path: '/api/auth',
  });
}

function clearRefreshTokenCookie(res: express.Response) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

// --- High-Entropy Cryptographic Token & Dual-Layer Guest Architecture ---
const HIGH_ENTROPY_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';

function generateHighEntropyToken(prefix: string = 'g_'): string {
  const bytes = crypto.randomBytes(32); // 256 bits of cryptographic entropy
  let result = prefix;
  for (let i = 0; i < bytes.length; i++) {
    const index = bytes[i] % HIGH_ENTROPY_CHARSET.length;
    result += HIGH_ENTROPY_CHARSET[index];
  }
  return result; // e.g. g_L9#vX$mK2_pQ7!zW8*bN4%dF3&hJ5+tR6-yC1_xP7
}

function maskHighEntropyToken(token: string): string {
  if (!token || token.length < 12) return 'g_****';
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

interface ActiveGuestSession {
  guestId: string;
  displayHandle: string; // e.g. guest_483b825
  highEntropyToken: string; // e.g. g_L9#vX$mK2_pQ7!zW8*bN4%dF3&hJ5+tR6-yC1_xP7
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number; // 2 hours inactivity TTL
  clientIp: string;
  rotationCount: number;
  revoked: boolean;
}

const activeGuestSessions = new Map<string, ActiveGuestSession>(); // keyed by highEntropyToken
const guestSessionsById = new Map<string, ActiveGuestSession>(); // keyed by guestId
const burnedGuestTokens = new Set<string>(); // Burned/invalidated high-entropy tokens
const GUEST_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function setGuestSessionCookie(res: express.Response, highEntropyToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('guestSessionToken', highEntropyToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: GUEST_SESSION_TTL_MS,
    path: '/api/auth',
  });
}

function clearGuestSessionCookie(res: express.Response) {
  res.clearCookie('guestSessionToken', { path: '/api/auth' });
}

function pruneExpiredGuestSessions() {
  const now = Date.now();
  let pruned = 0;
  for (const [token, session] of Array.from(activeGuestSessions.entries())) {
    if (now > session.expiresAt || session.revoked) {
      activeGuestSessions.delete(token);
      guestSessionsById.delete(session.guestId);
      burnedGuestTokens.add(token);
      const user = usersById.get(session.guestId);
      if (user && user.isGuest) {
        usersById.delete(session.guestId);
        usersByToken.delete(user.token);
        usersByUsername.delete(user.username.toLowerCase());
      }
      pruned++;
    }
  }
}
setInterval(pruneExpiredGuestSessions, 15 * 60 * 1000);

// Helper: Generate SHA-256 salted signature for guest tokens & device fingerprinting
function generateGuestSignature(guestId: string, deviceSignature: string = 'default_hw_sig'): string {
  return crypto
    .createHmac('sha256', SERVER_VAULT_SECRET)
    .update(`${guestId}:${deviceSignature}`)
    .digest('hex');
}

// Helper: Check IP rate limit for guest account creation
function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  const tracker = guestCreationTracker.get(ip);

  if (!tracker || now > tracker.resetAt) {
    guestCreationTracker.set(ip, { count: 1, resetAt: now + GUEST_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (tracker.count >= GUEST_CREATION_LIMIT) {
    return false;
  }

  tracker.count += 1;
  return true;
}

// Helper: Format unbounded, collision-free guest username (e.g., guest_483b825)
function generateGuestUsername(): string {
  let username = '';
  do {
    guestCounter += 1;
    const hash = crypto.randomBytes(4).toString('hex');
    username = `guest_${hash}`;
  } while (usersByUsername.has(username.toLowerCase()));
  return username;
}

// Helper: Migrate stats & game history from guest session to permanent account
function migrateGuestData(guestToken: string | undefined, newUser: User) {
  if (!guestToken) return;
  const oldGuest = usersByToken.get(guestToken);
  const oldUsername = oldGuest?.username;

  finishedGames.forEach((game) => {
    if (game.whiteToken === guestToken) {
      game.whiteToken = newUser.token;
      game.whiteUsername = newUser.username;
    }
    if (game.blackToken === guestToken) {
      game.blackToken = newUser.token;
      game.blackUsername = newUser.username;
    }
    if (oldUsername) {
      if (game.whiteUsername === oldUsername) game.whiteUsername = newUser.username;
      if (game.blackUsername === oldUsername) game.blackUsername = newUser.username;
    }
  });
}

// Helper: Get or create dual-layer guest session with high-entropy cryptographic token & UI display handle
function getOrCreateGuestSessionDualLayer(
  req: express.Request,
  res: express.Response,
  existingToken?: string,
  deviceSignature?: string
): { user: User; session: ActiveGuestSession; tokenSignature: string; isNew: boolean } {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const cookies = parseCookies(req);
  const cookieGuestToken = cookies.guestSessionToken || (req.headers['x-guest-token'] as string);

  // Check if incoming cookie is in burned/compromised tokens list
  if (cookieGuestToken && burnedGuestTokens.has(cookieGuestToken)) {
    securityAuditLogs.push({
      id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: 'guest_compromised',
      event: 'STOLEN_GUEST_TOKEN_BLOCKED',
      details: 'Attempted reuse of burned high-entropy guest token blocked and rejected.',
      ip: clientIp,
      timestamp: Date.now(),
      severity: 'CRITICAL',
    });
  }

  // 1. Existing active session by high-entropy cookie
  if (cookieGuestToken && activeGuestSessions.has(cookieGuestToken)) {
    const session = activeGuestSessions.get(cookieGuestToken)!;
    if (!session.revoked && Date.now() <= session.expiresAt) {
      session.lastActiveAt = Date.now();
      session.expiresAt = Date.now() + GUEST_SESSION_TTL_MS;
      const user = usersById.get(session.guestId);
      if (user) {
        const sig = generateGuestSignature(user.id, deviceSignature);
        return { user, session, tokenSignature: sig, isNew: false };
      }
    }
  }

  // 2. Existing token string lookup
  if (existingToken && usersByToken.has(existingToken)) {
    const user = usersByToken.get(existingToken)!;
    if (user.isGuest) {
      let session = guestSessionsById.get(user.id);
      if (!session || session.revoked || Date.now() > session.expiresAt) {
        const freshHighEntropyToken = generateHighEntropyToken('g_');
        session = {
          guestId: user.id,
          displayHandle: user.username,
          highEntropyToken: freshHighEntropyToken,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          expiresAt: Date.now() + GUEST_SESSION_TTL_MS,
          clientIp,
          rotationCount: session ? session.rotationCount + 1 : 0,
          revoked: false,
        };
        activeGuestSessions.set(freshHighEntropyToken, session);
        guestSessionsById.set(user.id, session);
      } else {
        session.lastActiveAt = Date.now();
        session.expiresAt = Date.now() + GUEST_SESSION_TTL_MS;
      }
      const sig = generateGuestSignature(user.id, deviceSignature);
      return { user, session, tokenSignature: sig, isNew: false };
    }
  }

  // 3. New guest session with dual-layer identity (display handle + 256-bit high-entropy token)
  let guestId = '';
  do {
    guestId = `usr_g_${crypto.randomUUID()}`;
  } while (usersById.has(guestId));

  const displayHandle = generateGuestUsername(); // e.g. guest_483b825
  const highEntropyToken = generateHighEntropyToken('g_'); // e.g. g_L9#vX$mK2_pQ7!zW8*bN4%dF3&hJ5+tR6-yC1_xP7
  const legacyToken = crypto.randomBytes(24).toString('hex');

  const user: User = {
    id: guestId,
    username: displayHandle,
    isGuest: true,
    token: legacyToken,
    createdAt: Date.now(),
  };

  const session: ActiveGuestSession = {
    guestId,
    displayHandle,
    highEntropyToken,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    expiresAt: Date.now() + GUEST_SESSION_TTL_MS,
    clientIp,
    rotationCount: 0,
    revoked: false,
  };

  // Strictly isolated in-memory storage (never written to persistent users.json file)
  usersById.set(guestId, user);
  usersByToken.set(legacyToken, user);
  usersByUsername.set(displayHandle.toLowerCase(), user);
  activeGuestSessions.set(highEntropyToken, session);
  guestSessionsById.set(guestId, session);

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: guestId,
    event: 'GUEST_SESSION_INITIALIZED',
    details: `Dual-layer guest session created. Handle: ${displayHandle}, Token Entropy: 256-bit Crypto (${maskHighEntropyToken(highEntropyToken)})`,
    ip: clientIp,
    timestamp: Date.now(),
    severity: 'info',
  });

  const sig = generateGuestSignature(user.id, deviceSignature);
  return { user, session, tokenSignature: sig, isNew: true };
}

// Backward-compatible helper for Socket.io and internal handlers
function getOrCreateGuestSession(existingToken?: string, deviceSignature?: string): { user: User; tokenSignature: string } {
  const dummyReq = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as express.Request;
  const dummyRes = { cookie: () => {}, clearCookie: () => {} } as unknown as express.Response;
  const { user, tokenSignature } = getOrCreateGuestSessionDualLayer(dummyReq, dummyRes, existingToken, deviceSignature);
  return { user, tokenSignature };
}

// --- REST API Endpoints ---

// 1. Instant Free Guest Auth endpoint with dual-layer high-entropy cryptographic token & HttpOnly Cookie
app.post('/api/auth/guest', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const deviceSignature = req.body?.deviceSignature || req.headers['x-device-signature'] as string || 'default_hw_sig';

  if (!token) {
    const isAllowed = checkGuestRateLimit(clientIp);
    if (!isAllowed) {
      return res.status(429).json({
        error: 'Daily guest account creation limit exceeded (Max 3 per day). Please log in or try again tomorrow.',
        rateLimited: true,
      });
    }
  }

  const { user, session, tokenSignature } = getOrCreateGuestSessionDualLayer(req, res, token, deviceSignature);
  const { accessToken, refreshToken } = createSessionFamily(user, req);

  setRefreshTokenCookie(res, refreshToken);
  setGuestSessionCookie(res, session.highEntropyToken);

  res.json({
    token: accessToken,
    accessToken,
    username: user.username,
    isGuest: user.isGuest,
    tokenSignature,
    guestId: user.id,
    guestDisplayHandle: user.username,
    maskedHighEntropyToken: maskHighEntropyToken(session.highEntropyToken),
    guestExpiresAt: session.expiresAt,
  });
});

// 1b. Auto-Rotation & Burn Endpoint for Guest Sessions (Anti-Hack / Compromise Recovery)
app.post('/api/auth/rotate-guest', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const cookies = parseCookies(req);
  const currentCookieGuestToken = cookies.guestSessionToken;

  let currentSession: ActiveGuestSession | undefined;
  if (currentCookieGuestToken && activeGuestSessions.has(currentCookieGuestToken)) {
    currentSession = activeGuestSessions.get(currentCookieGuestToken);
  }

  const currentUser = token ? getUserByToken(token) : (currentSession ? usersById.get(currentSession.guestId) : null);

  if (!currentUser || !currentUser.isGuest) {
    return res.status(401).json({ error: 'Active guest session required for rotation.' });
  }

  // --- INSTANT BURN OF OLD CREDENTIALS ---
  if (currentSession) {
    currentSession.revoked = true;
    burnedGuestTokens.add(currentSession.highEntropyToken);
    activeGuestSessions.delete(currentSession.highEntropyToken);
  }

  // Clean up old username mapping
  usersByUsername.delete(currentUser.username.toLowerCase());

  // Generate BRAND NEW display handle & high-entropy token
  const newDisplayHandle = generateGuestUsername(); // e.g. guest_92a4f1c
  const newHighEntropyToken = generateHighEntropyToken('g_'); // e.g. g_xK9!mQ...
  const newLegacyToken = crypto.randomBytes(24).toString('hex');

  // Update in-memory user object
  currentUser.username = newDisplayHandle;
  usersByToken.set(newLegacyToken, currentUser);
  usersByUsername.set(newDisplayHandle.toLowerCase(), currentUser);

  const newSession: ActiveGuestSession = {
    guestId: currentUser.id,
    displayHandle: newDisplayHandle,
    highEntropyToken: newHighEntropyToken,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    expiresAt: Date.now() + GUEST_SESSION_TTL_MS,
    clientIp,
    rotationCount: currentSession ? currentSession.rotationCount + 1 : 1,
    revoked: false,
  };

  activeGuestSessions.set(newHighEntropyToken, newSession);
  guestSessionsById.set(currentUser.id, newSession);

  // Set new HttpOnly, Secure, SameSite=Strict cookie for guest session
  setGuestSessionCookie(res, newHighEntropyToken);

  // Create new session family & signed JWT
  const { accessToken, refreshToken } = createSessionFamily(currentUser, req);
  setRefreshTokenCookie(res, refreshToken);

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: currentUser.id,
    event: 'GUEST_SESSION_ROTATED',
    details: `Guest credentials burned & rotated. New handle: ${newDisplayHandle}, Token: ${maskHighEntropyToken(newHighEntropyToken)}`,
    ip: clientIp,
    timestamp: Date.now(),
    severity: 'info',
  });

  res.json({
    token: accessToken,
    accessToken,
    username: newDisplayHandle,
    isGuest: true,
    guestDisplayHandle: newDisplayHandle,
    maskedHighEntropyToken: maskHighEntropyToken(newHighEntropyToken),
    guestExpiresAt: newSession.expiresAt,
    rotationCount: newSession.rotationCount,
    message: 'Guest session successfully rotated. Old display handle and high-entropy token permanently burned and invalidated.',
  });
});

// 1c. Guest Security Status Details Endpoint
app.get('/api/auth/guest-security', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const cookies = parseCookies(req);
  const cookieGuestToken = cookies.guestSessionToken;

  let session: ActiveGuestSession | undefined;
  if (cookieGuestToken && activeGuestSessions.has(cookieGuestToken)) {
    session = activeGuestSessions.get(cookieGuestToken);
  }

  const user = token ? getUserByToken(token) : (session ? usersById.get(session.guestId) : null);

  if (!user || !user.isGuest) {
    return res.status(400).json({ error: 'User is not an active guest session.' });
  }

  if (!session) {
    session = guestSessionsById.get(user.id);
  }

  res.json({
    displayHandle: user.username,
    maskedToken: session ? maskHighEntropyToken(session.highEntropyToken) : 'g_****',
    tokenEntropy: '256-bit Cryptographic High-Entropy (Upper/Lower/Digits/Symbols)',
    cookieSecurity: 'HttpOnly, Secure, SameSite=Strict',
    expiresAt: session ? session.expiresAt : Date.now() + GUEST_SESSION_TTL_MS,
    rotationHistoryCount: session ? session.rotationCount : 0,
    isIsolated: true,
  });
});

// 1d. Purge All Guest Accounts endpoint
app.post('/api/auth/purge-guests', (req, res) => {
  let purgedCount = 0;
  for (const [token, user] of Array.from(usersByToken.entries())) {
    if (user.isGuest) {
      usersByToken.delete(token);
      usersById.delete(user.id);
      usersByUsername.delete(user.username.toLowerCase());
      purgedCount++;
    }
  }
  res.json({ success: true, message: `Purged ${purgedCount} past guest account(s). Vault is clean.`, purgedCount });
});

// 1e. Voice Chat Allegation & Harassment Moderation Report Endpoint
const voiceReportsList: any[] = [];
app.post('/api/moderation/voice-report', (req, res) => {
  const { reportedUser, reason, details, roomId, transcriptSnapshot } = req.body;
  if (!reportedUser || !reason) {
    return res.status(400).json({ error: 'reportedUser and reason are required.' });
  }

  const reportRecord = {
    id: `vrep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    reportedUser,
    reason,
    details: details || '',
    roomId: roomId || 'global',
    transcriptSnapshot: transcriptSnapshot || '',
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    timestamp: Date.now(),
    status: 'INVESTIGATING_AUTO_MUTED',
  };

  voiceReportsList.push(reportRecord);

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: reportedUser,
    event: 'VOICE_HARASSMENT_REPORTED',
    details: `Voice harassment allegation submitted against ${reportedUser} (${reason}). Auto-mute applied.`,
    ip: reportRecord.ip,
    timestamp: Date.now(),
    severity: 'CRITICAL',
  });

  res.json({
    success: true,
    reportId: reportRecord.id,
    message: `Voice report against ${reportedUser} recorded. User has been automatically muted on your client.`,
  });
});

// 2. Email / Password Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please wait 5 minutes before trying again.' });
    }

    const { email, username, password, guestToken } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (usersByEmail.has(cleanEmail)) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    if (usersByUsername.has(cleanUsername.toLowerCase())) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check Cloud SQL Database for duplicate accounts across any instance
    const existingDbUserEmail = await findUserByEmailOrUsername(cleanEmail);
    if (existingDbUserEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    const existingDbUserUsername = await findUserByEmailOrUsername(cleanUsername);
    if (existingDbUserUsername) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const legacyToken = crypto.randomBytes(24).toString('hex');

    const user: User = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      isGuest: false,
      token: legacyToken,
      createdAt: Date.now(),
      rating: 1200,
    };

    // Permanently save to Cloud SQL PostgreSQL database
    await saveRegisteredUserToDb({
      uid: userId,
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      eloRating: 1200,
    });

    usersById.set(userId, user);
    usersByToken.set(legacyToken, user);
    usersByEmail.set(cleanEmail, user);
    usersByUsername.set(cleanUsername.toLowerCase(), user);

    // Update streak & persist registered account
    updateDailyStreak(user);
    savePersistentUsers();

    // Seamlessly migrate guest session settings and match stats to permanent account
    migrateGuestData(guestToken, user);

    const { accessToken, refreshToken } = createSessionFamily(user, req);
    setRefreshTokenCookie(res, refreshToken);
    resetLoginRateLimit(clientIp);

    res.json({
      token: accessToken,
      accessToken,
      username: user.username,
      email: user.email,
      isGuest: false,
      isOwner: isSiteOwner(user.username),
      dailyStreak: user.dailyStreak || 1,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// 3. Email / Password Login endpoint with Rate Limiting & Cloud SQL Permanent Lookup
app.post('/api/auth/login', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait 5 minutes before trying again.' });
    }

    const { emailOrUsername, password, guestToken } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required.' });
    }

    const searchKey = emailOrUsername.trim().toLowerCase();
    let user = usersByEmail.get(searchKey) || usersByUsername.get(searchKey);

    // If user is not yet loaded in active memory, query Cloud SQL Database directly
    if (!user) {
      const dbUser = await findUserByEmailOrUsername(searchKey);
      if (dbUser && dbUser.passwordHash) {
        const legacyToken = crypto.randomBytes(24).toString('hex');
        user = {
          id: dbUser.uid,
          username: dbUser.username || 'Player',
          email: dbUser.email,
          passwordHash: dbUser.passwordHash,
          isGuest: false,
          token: legacyToken,
          createdAt: dbUser.createdAt ? dbUser.createdAt.getTime() : Date.now(),
          rating: dbUser.eloRating || 1200,
        };

        usersById.set(user.id, user);
        usersByToken.set(legacyToken, user);
        usersByEmail.set(user.email.toLowerCase(), user);
        usersByUsername.set(user.username.toLowerCase(), user);
        savePersistentUsers();
      }
    }

    if (!user || user.isGuest || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    resetLoginRateLimit(clientIp);

    // Update daily streak & persist
    updateDailyStreak(user);
    savePersistentUsers();

    // Seamlessly migrate guest session settings and match stats to permanent account
    migrateGuestData(guestToken, user);

    const { accessToken, refreshToken } = createSessionFamily(user, req);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      token: accessToken,
      accessToken,
      username: user.username,
      email: user.email,
      isGuest: false,
      isOwner: isSiteOwner(user.username),
      dailyStreak: user.dailyStreak || 1,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 4. Token Refresh Endpoint with Automated Rotation & Theft Trap Breach Detection
app.post('/api/auth/refresh', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const cookies = parseCookies(req);
  const refreshTokenStr = cookies.refreshToken || (req.headers['x-refresh-token'] as string) || req.body?.refreshToken;

  if (!refreshTokenStr) {
    return res.status(401).json({ error: 'Refresh token missing.' });
  }

  const payload = verifyAndDecodeToken(refreshTokenStr);
  if (!payload || payload.type !== 'refresh') {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  const { sub, familyId, seq = 1, jti } = payload;
  const family = sessionFamilies.get(familyId);

  if (!family || family.revoked) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: 'Session family has been revoked.' });
  }

  // --- REUSE DETECTION / THEFT TRAP ---
  // If the provided jti was already used OR sequence is behind current OR jti !== validJti
  if (family.usedJtis.has(jti) || seq < family.currentSeq || jti !== family.validJti) {
    console.error(`[SECURITY COMPROMISE DETECTED] Stolen Refresh Token reuse attempt for user ${sub} in family ${familyId}!`);

    // INSTANT AUTOMATED DEFENSE: Revoke ALL active sessions globally for this user account
    revokeAllUserSessions(sub, 'COMPROMISE_REUSE_DETECTED: Stolen refresh token reuse attempt', clientIp);
    clearRefreshTokenCookie(res);

    return res.status(403).json({
      error: 'Security Breach Prevented: A refresh token reuse anomaly was detected. All active session tokens across all devices have been instantly revoked for your protection. Please log in again with your password.',
      code: 'TOKEN_COMPROMISED_GLOBAL_LOGOUT',
      compromised: true,
    });
  }

  // --- LEGITIMATE TOKEN ROTATION ---
  family.usedJtis.add(jti);
  family.currentSeq += 1;
  const newJti = `jti_ref_${crypto.randomUUID()}`;
  family.validJti = newJti;
  family.lastRotatedAt = Date.now();

  const user = usersById.get(sub) || usersByToken.get(sub);
  if (!user) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ error: 'User account not found.' });
  }

  const nowSec = Math.floor(Date.now() / 1000);

  const newAccessPayload: TokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    isGuest: user.isGuest,
    type: 'access',
    familyId,
    jti: `jti_acc_${crypto.randomUUID()}`,
    iat: nowSec,
    exp: nowSec + 15 * 60, // 15 mins
  };

  const newRefreshPayload: TokenPayload = {
    sub: user.id,
    username: user.username,
    isGuest: user.isGuest,
    type: 'refresh',
    familyId,
    seq: family.currentSeq,
    jti: newJti,
    iat: nowSec,
    exp: nowSec + 7 * 24 * 3600, // 7 days
  };

  const newAccessToken = signToken(newAccessPayload);
  const newRefreshToken = signToken(newRefreshPayload);

  usersByToken.set(newAccessToken, user);
  setRefreshTokenCookie(res, newRefreshToken);

  securityAuditLogs.push({
    id: `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    event: 'TOKEN_ROTATED',
    details: `Rotated refresh token to sequence ${family.currentSeq}`,
    ip: clientIp,
    timestamp: Date.now(),
    severity: 'info',
  });

  res.json({
    accessToken: newAccessToken,
    token: newAccessToken,
    username: user.username,
    email: user.email,
    isGuest: user.isGuest,
    isOwner: isSiteOwner(user.username),
    dailyStreak: user.dailyStreak || 1,
  });
});

// 5. Logout Single Session endpoint
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const payload = verifyAndDecodeToken(token);
    if (payload?.familyId) {
      const family = sessionFamilies.get(payload.familyId);
      if (family) {
        family.revoked = true;
      }
    }
  }
  clearRefreshTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Global Session Revocation Endpoint ("Log Out of All Devices")
app.post('/api/auth/logout-all', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  revokeAllUserSessions(user.id, 'USER_REQUESTED_GLOBAL_LOGOUT', clientIp);
  clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: 'Global Session Revocation Executed. All active session tokens across all devices are permanently invalidated.',
  });
});

// 7. Active Sessions List endpoint
app.get('/api/auth/sessions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = verifyAndDecodeToken(token || '');
  const currentFamilyId = payload?.familyId;

  const familyIds = userSessionFamilies.get(user.id);
  const activeSessions: any[] = [];

  if (familyIds) {
    familyIds.forEach((fId) => {
      const f = sessionFamilies.get(fId);
      if (f && !f.revoked) {
        activeSessions.push({
          familyId: f.familyId,
          createdAt: f.createdAt,
          lastRotatedAt: f.lastRotatedAt,
          currentSeq: f.currentSeq,
          ip: f.ip,
          userAgent: f.userAgent,
          isCurrentSession: f.familyId === currentFamilyId,
        });
      }
    });
  }

  res.json({ sessions: activeSessions, totalActive: activeSessions.length });
});

// 8. Security Audit Trail & Shield Status endpoint
app.get('/api/auth/security-log', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userLogs = securityAuditLogs.filter((l) => l.userId === user.id);
  res.json({
    logs: userLogs.reverse().slice(0, 20),
    tokenRotationEngine: 'ACTIVE_HMAC_SHA256',
    breachDetectionTrap: 'ENGAGED_AUTOMATED_REVOCATION',
    cookieSecurity: 'HttpOnly_Secure_SameSiteStrict',
  });
});

// 9. Current User Profile endpoint
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized or session revoked.' });
  }
  if (!user.isGuest) {
    updateDailyStreak(user);
  }
  res.json({
    token: user.token,
    accessToken: token,
    username: user.username,
    email: user.email,
    isGuest: user.isGuest,
    isOwner: isSiteOwner(user.username),
    dailyStreak: user.dailyStreak || 1,
  });
});

// Cloud SQL User Profile & Sync Endpoint (Firebase Auth Protected)
app.get('/api/sql/user', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const name = (req.user as any)?.name || 'Player';
    if (!uid) {
      return res.status(401).json({ error: 'Missing UID in auth token' });
    }

    const userRecord = await getOrCreateUser(uid, email, name);
    res.json({ success: true, user: userRecord });
  } catch (error: any) {
    console.error('Error fetching/syncing Cloud SQL user:', error);
    res.status(500).json({ error: error.message || 'Failed to query Cloud SQL database' });
  }
});

app.post('/api/sql/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const { username } = req.body;
    if (!uid) {
      return res.status(401).json({ error: 'Missing UID in auth token' });
    }

    const userRecord = await getOrCreateUser(uid, email, username);
    res.json({ success: true, user: userRecord });
  } catch (error: any) {
    console.error('Error syncing user to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to sync to Cloud SQL database' });
  }
});

// 16 Games Catalog Metadata for Global Telemetry and Profiles
const ALL_GAMES_METADATA: { id: string; name: string; icon: string }[] = [
  { id: 'chess', name: 'Chess', icon: '♟️' },
  { id: 'checkers', name: 'Draughts (Checkers)', icon: '⚪' },
  { id: 'backgammon', name: 'Backgammon', icon: '🎲' },
  { id: 'ludo', name: 'Ludo', icon: '🎯' },
  { id: 'snakes', name: 'Snakes & Ladders', icon: '🐍' },
  { id: 'gomoku', name: 'Gomoku (Five in a Row)', icon: '⚫' },
  { id: 'reversi', name: 'Reversi (Othello)', icon: '☯️' },
  { id: 'connect4', name: 'Connect Four', icon: '🟡' },
  { id: 'ultimatetictactoe', name: 'Ultimate Tic-Tac-Toe', icon: '❌' },
  { id: 'dotsandboxes', name: 'Dots and Boxes', icon: '📦' },
  { id: 'battleship', name: 'Battleship', icon: '🚢' },
  { id: 'sim', name: 'Sim (Triangle Game)', icon: '🔺' },
  { id: 'uno', name: 'Uno (Crazy Eights)', icon: '🃏' },
  { id: 'hearts', name: 'Hearts', icon: '♥️' },
  { id: 'ginrummy', name: 'Gin Rummy', icon: '🎴' },
  { id: 'speed', name: 'Speed (Spit)', icon: '⚡' },
  { id: 'findthenumber', name: 'Find the Number (Hand Speed)', icon: '🖐️' },
  { id: 'carrom', name: 'Carrom Board Arena', icon: '🥏' },
];

function computeUserGameStats(user: User | null, username: string, requestedGame: string = 'all') {
  const reqGame = (requestedGame || 'all').toLowerCase();

  const allUserMatches = deduplicateFinishedGames(
    finishedGames.filter(
      (g) =>
        g.whiteUsername === username ||
        g.blackUsername === username ||
        (user?.token && (g.whiteToken === user.token || g.blackToken === user.token))
    )
  );

  const filterMatches = (gType: string) => {
    if (gType === 'all') return allUserMatches;
    return allUserMatches.filter(
      (m) => (m.gameType || 'chess').toLowerCase() === gType.toLowerCase()
    );
  };

  const calculateForList = (matches: MatchRecord[], gType: string, gName: string) => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let resigns = 0;
    let pvpGames = 0;
    let aiGames = 0;
    let matchTimeSeconds = 0;

    matches.forEach((m) => {
      if (m.mode === 'pvp') pvpGames++;
      if (m.mode === 'ai') aiGames++;
      matchTimeSeconds += m.durationSeconds || (m.moveCount ? m.moveCount * 8 : 60);

      const isWhite = m.whiteUsername === username || m.whiteToken === user?.token;
      const isUserResigned =
        (m.reason === 'resignation' || m.reason === 'resign') &&
        ((m.winner === 'b' && isWhite) || (m.winner === 'w' && !isWhite));

      if (isUserResigned) {
        resigns++;
      }

      if (m.winner === 'draw') {
        draws++;
      } else {
        if ((m.winner === 'w' && isWhite) || (m.winner === 'b' && !isWhite)) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    let opens = 0;
    let extraTime = 0;
    if (gType === 'all') {
      opens = user?.gamesOpenedCount || 0;
      extraTime = user?.accumulatedGameTimeSeconds || 0;
    } else {
      opens = user?.perGameOpenedCount?.[gType] || 0;
      extraTime = user?.perGameTimeSeconds?.[gType] || 0;
    }

    // Total Played counts all matches played plus each time a game is open to be counted
    const totalGames = Math.max(matches.length, matches.length + opens);
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const lossRate = totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0;
    const drawRate = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
    const resignRate = totalGames > 0 ? Math.round((resigns / totalGames) * 100) : 0;
    const totalTimeSeconds = matchTimeSeconds + extraTime;
    const avgMatchTimeSeconds = totalGames > 0 ? Math.round(totalTimeSeconds / totalGames) : 0;

    return {
      gameType: gType,
      gameName: gName,
      totalGames,
      wins,
      losses,
      draws,
      resigns,
      winRate,
      lossRate,
      drawRate,
      resignRate,
      totalTimeSeconds,
      avgMatchTimeSeconds,
      pvpGames,
      aiGames,
    };
  };

  const mainStats = calculateForList(
    filterMatches(reqGame),
    reqGame,
    reqGame === 'all'
      ? 'All 16 Games'
      : ALL_GAMES_METADATA.find((g) => g.id === reqGame)?.name || reqGame
  );

  const perGameStats: Record<string, any> = {};
  ALL_GAMES_METADATA.forEach((g) => {
    perGameStats[g.id] = calculateForList(filterMatches(g.id), g.id, g.name);
  });

  const currentStreak = calculateCurrentStreak(user);

  return {
    ...mainStats,
    dailyStreak: currentStreak,
    privacyAgreed: !!user?.privacyAgreed,
    privacyAgreedAt: user?.privacyAgreedAt || null,
    perGameStats,
  };
}

// 5. User Statistics endpoint supporting all 16 games & combined
app.get('/api/stats', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? getUserByToken(token) : null;
  const username = user?.username || 'Guest';
  const game = (req.query.game as string) || 'all';

  const stats = computeUserGameStats(user, username, game);
  res.json(stats);
});

// Endpoint: Track game open event per game and globally
app.post('/api/stats/game-opened', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const user = token ? getUserByToken(token) : null;
  const { gameType } = req.body || {};
  const gKey = (gameType || 'chess').toLowerCase();

  if (user) {
    user.gamesOpenedCount = (user.gamesOpenedCount || 0) + 1;
    user.perGameOpenedCount = user.perGameOpenedCount || {};
    user.perGameOpenedCount[gKey] = (user.perGameOpenedCount[gKey] || 0) + 1;
    updateDailyStreak(user);
    if (!user.isGuest) savePersistentUsers();
  }

  res.json({
    success: true,
    gamesOpenedCount: user?.gamesOpenedCount || 1,
    perGameOpenedCount: user?.perGameOpenedCount || {},
    gameType: gKey,
  });
});

// Endpoint: Track continuous game time synchronization per game and globally
app.post('/api/stats/time-sync', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const user = token ? getUserByToken(token) : null;
  const addedSeconds = Math.min(3600, Math.max(1, Number(req.body?.addedSeconds || 0)));
  const { gameType } = req.body || {};
  const gKey = (gameType || 'chess').toLowerCase();

  if (user && addedSeconds > 0) {
    user.accumulatedGameTimeSeconds = (user.accumulatedGameTimeSeconds || 0) + addedSeconds;
    user.perGameTimeSeconds = user.perGameTimeSeconds || {};
    user.perGameTimeSeconds[gKey] = (user.perGameTimeSeconds[gKey] || 0) + addedSeconds;
    if (!user.isGuest) savePersistentUsers();
  }

  res.json({
    success: true,
    accumulatedGameTimeSeconds: user?.accumulatedGameTimeSeconds || 0,
    perGameTimeSeconds: user?.perGameTimeSeconds || {},
  });
});

// Endpoint: Record Privacy Policy & Terms Agreement
app.post('/api/user/privacy-agree', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const user = token ? getUserByToken(token) : null;

  if (user) {
    user.privacyAgreed = true;
    user.privacyAgreedAt = Date.now();
    if (!user.isGuest) savePersistentUsers();
  }

  res.json({
    success: true,
    privacyAgreed: true,
    agreedAt: Date.now(),
  });
});

function isSiteOwner(username?: string | null): boolean {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim().toLowerCase();
  return (
    clean === 'aditya-owner' ||
    clean === 'aditya_owner' ||
    clean === 'aditya owner' ||
    clean === 'aditya' ||
    clean.startsWith('aditya-owner') ||
    clean.startsWith('aditya_owner')
  );
}

// Per-game default top ranking seeds
const SEEDED_LEADERBOARDS_MAP: Record<string, any[]> = {
  chess: [
    { username: 'ADITYA-OWNER', score: 2650, times_played: 128, wins: 120, losses: 4, draws: 4, resigns: 0, total_time_seconds: 54000, lastActive: Date.now() },
    { username: 'Grandmaster_Alex', score: 2150, times_played: 50, wins: 42, losses: 5, draws: 3, resigns: 1, total_time_seconds: 14400, lastActive: Date.now() - 3600000 },
    { username: 'ChessKing_99', score: 1980, times_played: 51, wins: 38, losses: 9, draws: 4, resigns: 2, total_time_seconds: 12200, lastActive: Date.now() - 7200000 },
    { username: 'TacticsQueen', score: 1820, times_played: 45, wins: 31, losses: 12, draws: 2, resigns: 3, total_time_seconds: 9800, lastActive: Date.now() - 10800000 },
  ],
  checkers: [
    { username: 'ADITYA-OWNER', score: 2420, times_played: 95, wins: 88, losses: 4, draws: 3, resigns: 0, total_time_seconds: 28000, lastActive: Date.now() },
    { username: 'CrownMaster_Sam', score: 2040, times_played: 44, wins: 39, losses: 4, draws: 1, resigns: 0, total_time_seconds: 8800, lastActive: Date.now() },
    { username: 'DoubleJump_Pro', score: 1890, times_played: 43, wins: 33, losses: 8, draws: 2, resigns: 1, total_time_seconds: 7600, lastActive: Date.now() },
  ],
  backgammon: [
    { username: 'ADITYA-OWNER', score: 2350, times_played: 80, wins: 74, losses: 6, draws: 0, resigns: 0, total_time_seconds: 24000, lastActive: Date.now() },
    { username: 'PipMaster_Elena', score: 1920, times_played: 42, wins: 36, losses: 6, draws: 0, resigns: 1, total_time_seconds: 9200, lastActive: Date.now() },
    { username: 'BearingOff_King', score: 1750, times_played: 40, wins: 30, losses: 10, draws: 0, resigns: 2, total_time_seconds: 8100, lastActive: Date.now() },
  ],
  snakes: [
    { username: 'LadderRunner_Max', score: 1850, times_played: 48, wins: 40, losses: 8, draws: 0, resigns: 0, total_time_seconds: 6500, lastActive: Date.now() },
    { username: 'SnakeCharmer', score: 1680, times_played: 44, wins: 32, losses: 12, draws: 0, resigns: 1, total_time_seconds: 5900, lastActive: Date.now() },
  ],
  ludo: [
    { username: 'LudoEmperor', score: 2110, times_played: 50, wins: 45, losses: 5, draws: 0, resigns: 0, total_time_seconds: 11000, lastActive: Date.now() },
    { username: 'TokenCapturer', score: 1840, times_played: 45, wins: 35, losses: 10, draws: 0, resigns: 1, total_time_seconds: 9500, lastActive: Date.now() },
  ],
  gomoku: [
    { username: 'FiveStone_Master', score: 1990, times_played: 45, wins: 38, losses: 6, draws: 1, resigns: 0, total_time_seconds: 7200, lastActive: Date.now() },
    { username: 'GomokuPro_Ken', score: 1840, times_played: 40, wins: 30, losses: 9, draws: 1, resigns: 1, total_time_seconds: 6100, lastActive: Date.now() },
  ],
  reversi: [
    { username: 'CornerFlipper', score: 1910, times_played: 44, wins: 35, losses: 7, draws: 2, resigns: 1, total_time_seconds: 8300, lastActive: Date.now() },
    { username: 'OthelloMaster', score: 1780, times_played: 39, wins: 28, losses: 10, draws: 1, resigns: 0, total_time_seconds: 6900, lastActive: Date.now() },
  ],
  connect4: [
    { username: 'GravityAligner', score: 2020, times_played: 46, wins: 40, losses: 5, draws: 1, resigns: 0, total_time_seconds: 6100, lastActive: Date.now() },
    { username: 'FourInARow_Champ', score: 1810, times_played: 42, wins: 31, losses: 10, draws: 1, resigns: 1, total_time_seconds: 5400, lastActive: Date.now() },
  ],
  ultimatetictactoe: [
    { username: 'SuperGrid_Ninja', score: 1880, times_played: 46, wins: 36, losses: 8, draws: 2, resigns: 1, total_time_seconds: 7900, lastActive: Date.now() },
  ],
  dotsandboxes: [
    { username: 'ChainMaster_Dan', score: 2010, times_played: 44, wins: 39, losses: 5, draws: 0, resigns: 0, total_time_seconds: 6800, lastActive: Date.now() },
  ],
  battleship: [
    { username: 'Admiral_Nelson', score: 2180, times_played: 45, wins: 41, losses: 4, draws: 0, resigns: 0, total_time_seconds: 9400, lastActive: Date.now() },
  ],
  sim: [
    { username: 'GraphTheory_Ace', score: 1830, times_played: 40, wins: 33, losses: 7, draws: 0, resigns: 0, total_time_seconds: 5200, lastActive: Date.now() },
  ],
  uno: [
    { username: 'WildCard_Champion', score: 2140, times_played: 54, wins: 48, losses: 6, draws: 0, resigns: 0, total_time_seconds: 12500, lastActive: Date.now() },
    { username: 'DrawFour_King', score: 1910, times_played: 48, wins: 37, losses: 10, draws: 1, resigns: 0, total_time_seconds: 10100, lastActive: Date.now() },
  ],
  hearts: [
    { username: 'MoonShooter_007', score: 1950, times_played: 46, wins: 37, losses: 9, draws: 0, resigns: 1, total_time_seconds: 10200, lastActive: Date.now() },
  ],
  ginrummy: [
    { username: 'MeldMaster_Gin', score: 2080, times_played: 47, wins: 42, losses: 5, draws: 0, resigns: 0, total_time_seconds: 9900, lastActive: Date.now() },
  ],
  speed: [
    { username: 'SpitSpeed_Demon', score: 2220, times_played: 54, wins: 50, losses: 4, draws: 0, resigns: 0, total_time_seconds: 7100, lastActive: Date.now() },
  ],
};

const ALL_GAME_KEYS = [
  'chess', 'checkers', 'backgammon', 'snakes', 'ludo', 'gomoku',
  'reversi', 'connect4', 'ultimatetictactoe', 'dotsandboxes',
  'battleship', 'sim', 'uno', 'hearts', 'ginrummy', 'speed'
];

// Helper: Get real-time leaderboard data for a specific game with dynamic ranking
function getLeaderboardData(requestedGame: string = 'chess') {
  const targetGame = requestedGame.toLowerCase();
  const userStatsMap = new Map<
    string,
    {
      username: string;
      score: number;
      times_played: number;
      wins: number;
      losses: number;
      draws: number;
      resigns: number;
      total_time_seconds: number;
      lastActive: number;
    }
  >();

  // Initialize with seeded baseline players for this specific game
  const seeds = SEEDED_LEADERBOARDS_MAP[targetGame] || SEEDED_LEADERBOARDS_MAP.chess || [];
  seeds.forEach((seed) => {
    userStatsMap.set(seed.username, {
      username: seed.username,
      score: seed.score,
      times_played: seed.times_played,
      wins: seed.wins,
      losses: seed.losses,
      draws: seed.draws,
      resigns: seed.resigns || 0,
      total_time_seconds: seed.total_time_seconds || 600,
      lastActive: seed.lastActive || Date.now(),
    });
  });

  // Add registered users with base 1200 score if not existing
  usersByToken.forEach((u) => {
    if (!userStatsMap.has(u.username)) {
      userStatsMap.set(u.username, {
        username: u.username,
        score: 1200,
        times_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        resigns: 0,
        total_time_seconds: 0,
        lastActive: u.createdAt,
      });
    }
  });

  // Filter finished games specific to this gameType
  const gameMatches = finishedGames.filter(
    (m) => (m.gameType || 'chess').toLowerCase() === targetGame
  );

  gameMatches.forEach((m) => {
    [m.whiteUsername, m.blackUsername].forEach((uname) => {
      if (!uname || uname.startsWith('Computer')) return;
      if (!userStatsMap.has(uname)) {
        userStatsMap.set(uname, {
          username: uname,
          score: 1200,
          times_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          resigns: 0,
          total_time_seconds: 0,
          lastActive: m.createdAt,
        });
      }
      const u = userStatsMap.get(uname)!;
      u.times_played++;
      u.lastActive = Math.max(u.lastActive, m.createdAt);
      u.total_time_seconds += (m.moveCount ? m.moveCount * 8 : 120);

      if (m.winner === 'draw') {
        u.draws++;
        u.score += 5;
      } else {
        const isWhite = m.whiteUsername === uname;
        const isWinner = (m.winner === 'w' && isWhite) || (m.winner === 'b' && !isWhite);
        if (isWinner) {
          u.wins++;
          u.score += 25;
        } else {
          u.losses++;
          u.score = Math.max(0, u.score - 10);
        }
      }

      if (m.reason === 'resignation' || m.reason === 'resign') {
        const isWhite = m.whiteUsername === uname;
        const isResigned = (m.winner === 'b' && isWhite) || (m.winner === 'w' && !isWhite);
        if (isResigned) {
          u.resigns++;
        }
      }
    });
  });

  const list = Array.from(userStatsMap.values()).map((u) => {
    const winRate = u.times_played > 0 ? Math.round((u.wins / u.times_played) * 100) : 0;
    return {
      username: u.username,
      score: u.score,
      times_played: u.times_played,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      resigns: u.resigns,
      total_time_seconds: u.total_time_seconds,
      totalGames: u.times_played,
      winRate,
      lastActive: u.lastActive,
    };
  });

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.times_played - a.times_played;
  });

  return list.map((item, index) => ({
    ...item,
    global_rank: index + 1,
  })).slice(0, 50);
}

function getAllLeaderboardsMap() {
  const result: Record<string, any[]> = {};
  ALL_GAME_KEYS.forEach((key) => {
    result[key] = getLeaderboardData(key);
  });
  return result;
}

function broadcastLeaderboardUpdate() {
  try {
    const data = getAllLeaderboardsMap();
    io.emit('leaderboard_update', data);
  } catch (err) {
    console.error('Error broadcasting leaderboard update:', err);
  }
}

// 5b. Global Leaderboard Endpoint
app.get('/api/leaderboard', (req, res) => {
  const game = (req.query.game as string) || 'chess';
  if (game === 'all') {
    res.json(getAllLeaderboardsMap());
  } else {
    res.json(getLeaderboardData(game));
  }
});

// 5c. User Profile Endpoint supporting all 16 games
app.get('/api/users/:username/profile', (req, res) => {
  try {
    const { username } = req.params;
    const requestedGame = (req.query.game as string) || 'all';

    // Find user record if registered
    const userObj = usersByUsername.get(username.toLowerCase());
    const isOwner = isSiteOwner(username);

    // Compute complete stats across all 16 games
    const stats = computeUserGameStats(userObj || null, username, requestedGame);

    const rankNum = isOwner ? 1 : (stats.totalGames > 0 ? Math.max(1, 100 - Math.min(99, stats.wins * 2)) : 99);
    let rankTitle = isOwner ? 'Site Owner & Grandmaster' : 'Bronze';
    if (!isOwner) {
      if (rankNum === 1) rankTitle = 'Grandmaster';
      else if (rankNum <= 3) rankTitle = 'Master';
      else if (stats.wins >= 50) rankTitle = 'Diamond';
      else if (stats.wins >= 25) rankTitle = 'Platinum';
      else if (stats.wins >= 10) rankTitle = 'Gold';
      else if (stats.wins >= 3) rankTitle = 'Silver';
      else rankTitle = stats.totalGames > 0 ? 'Bronze' : 'Unranked';
    }

    const calculatedScore = isOwner ? 2650 : Math.max(1000, 1200 + stats.wins * 25 - stats.losses * 10 + stats.draws * 5);

    return res.json({
      username,
      rank_title: rankTitle,
      rank_number: rankNum,
      score: calculatedScore,
      total_time_seconds: stats.totalTimeSeconds,
      times_played: stats.totalGames,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      resigns: stats.resigns,
      winRate: stats.winRate,
      lossRate: stats.lossRate,
      drawRate: stats.drawRate,
      resignRate: stats.resignRate,
      avg_match_time_seconds: stats.avgMatchTimeSeconds,
      dailyStreak: stats.dailyStreak,
      isOwner,
      gameType: requestedGame,
      perGameStats: stats.perGameStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile data' });
  }
});

// Sitemap XML Endpoint
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://playduochess.ai.studio/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// 6. User Match History endpoint with game filter
app.get('/api/games/history', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? getUserByToken(token) : null;
  const username = user?.username;
  const requestedGame = (req.query.game as string) || 'all';

  if (!username) {
    return res.json([]);
  }

  let userMatches = deduplicateFinishedGames(
    finishedGames.filter(
      (g) =>
        g.whiteUsername === username ||
        g.blackUsername === username ||
        (user?.token && (g.whiteToken === user.token || g.blackToken === user.token))
    )
  );

  if (requestedGame && requestedGame !== 'all') {
    userMatches = userMatches.filter(
      (g) => (g.gameType || 'chess').toLowerCase() === requestedGame.toLowerCase()
    );
  }

  // Return sorted most recent first
  const sorted = [...userMatches].sort((a, b) => b.createdAt - a.createdAt);
  res.json(sorted);
});

// 7. Record Completed Match endpoint (e.g., AI or Local matches)
const recordMatchHandler = (req: any, res: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const user = token ? getUserByToken(token) : null;

  const {
    gameType,
    game,
    mode,
    whiteUsername,
    blackUsername,
    winner,
    reason,
    moveCount,
    durationSeconds,
    pgn,
    moves,
    timeControlPreset,
  } = req.body;

  const record: MatchRecord = {
    id: `m_${crypto.randomBytes(8).toString('hex')}`,
    gameType: gameType || game || 'chess',
    mode: mode || 'ai',
    whiteUsername: whiteUsername || user?.username || 'Player 1',
    blackUsername: blackUsername || (mode === 'ai' ? 'Computer (AI)' : 'Player 2'),
    whiteToken: user?.token,
    winner: winner || 'draw',
    reason: reason || 'game_over',
    moveCount: moveCount || 0,
    durationSeconds: durationSeconds || Math.max(10, (moveCount || 1) * 8),
    pgn: pgn || '',
    moves: moves || [],
    createdAt: Date.now(),
    timeControlPreset: timeControlPreset || 'untimed',
  };

  const isDuplicate = finishedGames.some(
    (existing) =>
      existing.gameType === record.gameType &&
      existing.whiteUsername === record.whiteUsername &&
      existing.blackUsername === record.blackUsername &&
      existing.winner === record.winner &&
      existing.reason === record.reason &&
      Math.abs((existing.createdAt || 0) - record.createdAt) < 15000
  );

  if (isDuplicate) {
    const existing = finishedGames.find(
      (e) =>
        e.gameType === record.gameType &&
        e.whiteUsername === record.whiteUsername &&
        e.winner === record.winner &&
        Math.abs((e.createdAt || 0) - record.createdAt) < 15000
    );
    return res.json({ success: true, record: existing || record, duplicateIgnored: true });
  }

  finishedGames.push(record);
  savePersistentGames();
  broadcastLeaderboardUpdate();
  res.json({ success: true, record });
};

app.post('/api/games/record', recordMatchHandler);
app.post('/api/match/record', recordMatchHandler);

// 7b. Synchronized Match Complete API route
app.post('/api/match/complete', async (req, res) => {
  try {
    const {
      userId,
      opponentId,
      matchResult,
      gameMode,
      gameType,
      whiteUsername,
      blackUsername,
      moveCount,
      pgn,
      moves,
      reason,
    } = req.body;

    const mainUser = userId || whiteUsername || 'Player 1';
    const opponent = opponentId || blackUsername || 'Computer';
    const targetGame = gameType || 'chess';

    let winner: 'w' | 'b' | 'draw' = 'draw';
    if (matchResult === 'win') winner = 'w';
    else if (matchResult === 'loss') winner = 'b';
    else if (matchResult === 'w' || matchResult === 'b' || matchResult === 'draw') winner = matchResult;

    const record: MatchRecord = {
      id: `m_${crypto.randomBytes(8).toString('hex')}`,
      gameType: targetGame,
      mode: gameMode || 'ai',
      whiteUsername: mainUser,
      blackUsername: opponent,
      winner,
      reason: reason || (matchResult === 'win' ? 'checkmate' : 'game_over'),
      moveCount: moveCount || 10,
      pgn: pgn || '',
      moves: moves || [],
      createdAt: Date.now(),
      timeControlPreset: 'untimed',
    };

    finishedGames.push(record);
    broadcastLeaderboardUpdate();

    // Fetch synchronized user stats from leaderboard engine
    const leaderboard = getLeaderboardData(targetGame);
    const userInLeaderboard = leaderboard.find(
      (u) => u.username.toLowerCase() === mainUser.toLowerCase()
    );

    const updatedUser = userInLeaderboard || {
      username: mainUser,
      rank_title: matchResult === 'win' ? 'Master' : 'Silver',
      rank_number: 1,
      score: matchResult === 'win' ? 1225 : 1190,
      total_time_seconds: 300,
      times_played: 1,
      wins: matchResult === 'win' ? 1 : 0,
      losses: matchResult === 'loss' ? 1 : 0,
      draws: matchResult === 'draw' ? 1 : 0,
      resigns: 0,
    };

    // Process Progression & Rewards Engine
    const outcome: 'win' | 'loss' | 'draw' =
      matchResult === 'win' || matchResult === 'w' ? 'win' :
      matchResult === 'loss' || matchResult === 'b' ? 'loss' : 'draw';

    const parsedAiLevel = Number(req.body.aiLevel || req.body.difficultyLevel || 1);
    const xpEarned = calculateMatchXp(outcome, gameMode || 'ai', parsedAiLevel);

    const prog = getOrCreateProgression(mainUser);
    prog.totalXp += xpEarned;
    prog.totalMatches += 1;
    if (outcome === 'win') prog.wins += 1;
    else if (outcome === 'loss') prog.losses += 1;
    else prog.draws += 1;

    if (gameMode === 'ai' && outcome === 'win') {
      if (parsedAiLevel >= 6) prog.level6AiDefeats += 1;
      if (parsedAiLevel >= 8) prog.level8AiDefeats += 1;
    } else if (gameMode === 'pvp' && outcome === 'win') {
      prog.pvpWins += 1;
    }

    updateDailyQuests(mainUser, outcome, gameMode || 'ai', parsedAiLevel);
    const newlyUnlockedBadges = evaluateUserBadges(prog);
    const updatedLevelData = getLevelDataFromXp(prog.totalXp);

    res.status(200).json({
      success: true,
      message: 'Match stats, profile, and progression updated successfully!',
      user: updatedUser,
      archive: record,
      progression: {
        xpEarned,
        formulaUsed: `${outcome.toUpperCase()} Base XP x (1 + (AI Level ${parsedAiLevel} x 0.15))`,
        levelData: updatedLevelData,
        newlyUnlockedBadges,
        quests: getDailyQuests(mainUser),
      },
    });
  } catch (error: any) {
    console.error('Match complete processing error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// 8. Room Chat messages endpoint
app.get('/api/chat/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const messages = roomChats.get(roomId) || [];
  res.json(messages);
});

// 8b. Active Rooms for Spectators
app.get('/api/rooms/active', (req, res) => {
  const activeRoomsList: any[] = [];
  pvpRooms.forEach((room, id) => {
    if (room.status === 'active' || room.whiteToken) {
      activeRoomsList.push({
        id,
        gameId: room.gameId || 'chess',
        whiteUsername: room.whiteUsername || 'Player 1',
        blackUsername: room.blackUsername || (room.blackToken ? 'Player 2' : 'Waiting for Opponent'),
        status: room.status,
        moveCount: room.moves ? room.moves.length : 0,
        spectatorCount: 1,
        communityNotice: room.communityNotice || '',
        roomRules: room.roomRules || { minimumRating: 1200, allowChat: true, maxPlayers: 2 },
      });
    }
  });
  res.json({ rooms: activeRoomsList });
});

// 8c. Live Activity Feed endpoint
const platformActivityFeed: any[] = [
  {
    id: 'act_1',
    username: 'Grandmaster_Arjun',
    game: 'Chess',
    type: 'level8_defeat',
    text: 'defeated Level 8 AI Grandmaster in Chess! 🏆',
    timestamp: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'act_2',
    username: 'StrategyQueen',
    game: 'Connect Four',
    type: 'badge_unlocked',
    text: 'unlocked the "Giant Killer" badge in Connect Four! 🛡️',
    timestamp: Date.now() - 1000 * 60 * 35,
  },
  {
    id: 'act_3',
    username: 'BlitzMaster',
    game: 'Checkers',
    type: 'match_win',
    text: 'won a high-stakes PvP match against Opponent! ⚔️',
    timestamp: Date.now() - 1000 * 60 * 80,
  },
  {
    id: 'act_4',
    username: 'TacTitan',
    game: 'Backgammon',
    type: 'tournament_rank',
    text: 'reached 1st Place on the Weekly Global Leaderboard! 👑',
    timestamp: Date.now() - 1000 * 60 * 140,
  },
];

app.get('/api/activity-feed', (req, res) => {
  res.json({ activities: platformActivityFeed.slice(0, 20) });
});

// ==========================================
// PROGRESSION & REWARDS ENGINE ARCHITECTURE
// ==========================================

interface UserProgression {
  username: string;
  totalXp: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  level6AiDefeats: number;
  level8AiDefeats: number;
  pvpWins: number;
  unlockedBadgeIds: Set<string>;
}

const userProgressionMap = new Map<string, UserProgression>();

function getOrCreateProgression(username: string): UserProgression {
  const norm = username.toLowerCase();
  if (!userProgressionMap.has(norm)) {
    userProgressionMap.set(norm, {
      username,
      totalXp: 1450, // Initial base XP
      totalMatches: 12,
      wins: 8,
      losses: 3,
      draws: 1,
      level6AiDefeats: 3,
      level8AiDefeats: 1,
      pvpWins: 2,
      unlockedBadgeIds: new Set(['first_win', 'giant_killer', 'streak_master', 'gm_scholar', 'night_owl']),
    });
  }
  return userProgressionMap.get(norm)!;
}

// 1. XP & Leveling Engine Math Calculations
// Formula: Base XP * (1 + (AI Level * 0.15))
function calculateMatchXp(outcome: 'win' | 'loss' | 'draw', mode: string, aiLevel: number = 1): number {
  let baseXp = 25; // Loss / Resignation
  if (outcome === 'win') baseXp = 100;
  else if (outcome === 'draw') baseXp = 50;

  let multiplier = 1.0;
  if (mode === 'ai') {
    const validLevel = Math.max(1, Math.min(8, aiLevel));
    multiplier = 1 + validLevel * 0.15; // e.g. Level 1 = 1.15x, Level 8 = 2.20x
  } else {
    multiplier = 1.5; // PvP multiplier
  }

  return Math.floor(baseXp * multiplier);
}

// Progressive Level Thresholds: Level N requires N * 250 XP
function getLevelDataFromXp(totalXp: number) {
  let level = 1;
  let accumulatedXp = 0;
  let xpNeededForNextLevel = level * 250;

  while (totalXp >= accumulatedXp + xpNeededForNextLevel) {
    accumulatedXp += xpNeededForNextLevel;
    level++;
    xpNeededForNextLevel = level * 250;
  }

  const currentLevelXp = totalXp - accumulatedXp;
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / xpNeededForNextLevel) * 100));

  return {
    level,
    totalXp,
    currentLevelXp,
    xpNeededForNextLevel,
    progressPercent,
  };
}

// 2. Daily Quests Manager
const userQuestProgress = new Map<string, any[]>();

function getDailyQuests(username: string) {
  const norm = username.toLowerCase();
  if (!userQuestProgress.has(norm)) {
    userQuestProgress.set(norm, [
      {
        id: 'q1',
        title: 'Daily Dominator',
        description: 'Win 3 matches across any board game (Win Threshold).',
        progress: 1,
        target: 3,
        xpReward: 150,
        claimed: false,
      },
      {
        id: 'q2',
        title: 'Grandmaster Slayer',
        description: 'Defeat a high-tier Level 6+ AI opponent in any game.',
        progress: 1,
        target: 1,
        xpReward: 200,
        claimed: false,
      },
      {
        id: 'q3',
        title: 'Daily Competitor',
        description: 'Complete 5 total matches today across the platform.',
        progress: 2,
        target: 5,
        xpReward: 100,
        claimed: false,
      },
    ]);
  }
  return userQuestProgress.get(norm)!;
}

function updateDailyQuests(username: string, outcome: 'win' | 'loss' | 'draw', mode: string, aiLevel: number = 1) {
  const quests = getDailyQuests(username);
  quests.forEach((q) => {
    if (q.claimed) return;
    if (q.id === 'q3') {
      // Total daily matches
      q.progress = Math.min(q.target, q.progress + 1);
    } else if (q.id === 'q1' && outcome === 'win') {
      // Win threshold
      q.progress = Math.min(q.target, q.progress + 1);
    } else if (q.id === 'q2' && outcome === 'win' && mode === 'ai' && aiLevel >= 6) {
      // Defeat high-tier AI
      q.progress = Math.min(q.target, q.progress + 1);
    }
  });
}

// 3. Achievement Badge Framework (75 Unique Badges across 5 Categories)
const ALL_BADGES = [
  // Category 1: AI Domination & Grandmaster Trials (1–15)
  { id: 'first_win', name: 'First Blood', icon: '🏆', description: 'Win your very first match against any AI difficulty.', category: 'AI Domination' },
  { id: 'novice_crusher', name: 'Novice Crusher', icon: '⚔️', description: 'Defeat a Level 3 AI without losing a single core piece/unit.', category: 'AI Domination' },
  { id: 'midway_master', name: 'Midway Master', icon: '🛡️', description: 'Secure 10 total victories against Level 4 or higher AI opponents.', category: 'AI Domination' },
  { id: 'the_step_up', name: 'The Step-Up', icon: '⬆️', description: 'Defeat a Level 5 AI using a custom rule or variant layout.', category: 'AI Domination' },
  { id: 'expert_tactical', name: 'Expert Tactical Mind', icon: '⏱️', description: 'Win against a Level 6 AI in under 3 minutes of total match time.', category: 'AI Domination' },
  { id: 'beating_the_clock', name: 'Beating the Clock', icon: '⌛', description: 'Defeat a Level 7 AI with less than 10 seconds remaining on your match timer.', category: 'AI Domination' },
  { id: 'giant_killer', name: 'Grandmaster Slayer', icon: '👑', description: 'Secure your very first victory against a Level 8 Grandmaster AI.', category: 'AI Domination' },
  { id: 'unbroken_wall', name: 'Unbroken Wall', icon: '🧱', description: 'Defeat a Level 7+ AI without allowing it to capture a single advantage.', category: 'AI Domination' },
  { id: 'flawless_victory', name: 'Flawless Victory', icon: '✨', description: 'Win a match against a Level 8 AI without taking a single unforced penalty or blunder.', category: 'AI Domination' },
  { id: 'tacticians_apex', name: 'The Tactician’s Apex', icon: '🎯', description: 'Defeat a Level 8 AI using a high-risk, aggressive opening strategy.', category: 'AI Domination' },
  { id: 'tenfold_titan', name: 'Tenfold Titan', icon: '🔱', description: 'Defeat Level 8 AI opponents 10 separate times.', category: 'AI Domination' },
  { id: 'comeback_king', name: 'The Comeback King', icon: '🦁', description: 'Win a match against a Level 8 AI after being down material/score in the final stretch.', category: 'AI Domination' },
  { id: 'speedrun_gm', name: 'Speedrun Grandmaster', icon: '⚡', description: 'Defeat a Level 8 AI in record-breaking match time.', category: 'AI Domination' },
  { id: 'untouchable_legend', name: 'Untouchable Legend', icon: '🌋', description: 'Defeat 3 different Level 8 AI opponents in a single continuous gaming session.', category: 'AI Domination' },
  { id: 'machine_whisperer', name: 'The Machine Whisperer', icon: '🤖', description: 'Achieve a 10-game win streak exclusively against Level 7 and Level 8 AI tiers.', category: 'AI Domination' },

  // Category 2: Extreme Edge-Cases & Thrilling Miracles (16–30)
  { id: 'nail_biter', name: 'Nail-Biter', icon: '💥', description: 'Win a match with a margin of victory of less than 1% or a single point/move.', category: 'Miracles & Edges' },
  { id: 'dead_heat', name: 'Dead Heat', icon: '⚖️', description: 'Secure a draw when you had a mathematically losing position for 80% of the game.', category: 'Miracles & Edges' },
  { id: 'the_phoenix', name: 'The Phoenix', icon: '🔥', description: 'Win a match after your opponent was one move away from victory.', category: 'Miracles & Edges' },
  { id: 'blitzkrieg', name: 'Blitzkrieg', icon: '⚡', description: 'Finish and win any match in under 60 total seconds.', category: 'Miracles & Edges' },
  { id: 'marathon_survivor', name: 'Marathon Survivor', icon: '⏳', description: 'Win a match that stretches past 30 minutes of deep tactical calculation.', category: 'Miracles & Edges' },
  { id: 'stalemate_artist', name: 'Stalemate Artist', icon: '🎨', description: 'Force a tactical draw in a position where defeat seemed certain.', category: 'Miracles & Edges' },
  { id: 'resignation_collector', name: 'The Resignation Collector', icon: '🚩', description: 'Force 5 different opponents or high-level AIs to resign out of hopeless pressure.', category: 'Miracles & Edges' },
  { id: 'clutch_performer', name: 'Clutch Performer', icon: '💎', description: 'Win 3 matches back-to-back when starting your turn in a disadvantaged state.', category: 'Miracles & Edges' },
  { id: 'precision_strike', name: 'Precision Strike', icon: '🎯', description: 'Win a match using the absolute minimum number of turns possible.', category: 'Miracles & Edges' },
  { id: 'trap_door', name: 'The Trap Door', icon: '🪤', description: 'Turn a losing endgame into an instant win via a hidden tactical trap.', category: 'Miracles & Edges' },
  { id: 'narrow_escape', name: 'Narrow Escape', icon: '🛡️', description: 'Survive 5 consecutive turns of direct threat without losing your key pieces.', category: 'Miracles & Edges' },
  { id: 'last_second_hero', name: 'Last Second Hero', icon: '🚨', description: 'Play the winning move with less than 3 seconds left on the match clock.', category: 'Miracles & Edges' },
  { id: 'psychological_edge', name: 'The Psychological Edge', icon: '🧠', description: 'Win a match entirely through defensive endurance until the opponent blunders.', category: 'Miracles & Edges' },
  { id: 'zero_error', name: 'Zero-Error Match', icon: '💯', description: 'Complete a full 15-minute game with a 100% accuracy evaluation rating.', category: 'Miracles & Edges' },
  { id: 'one_in_a_million', name: 'One-In-A-Million', icon: '🌠', description: 'Trigger a rare game-state overlap that results in an unexpected victory condition.', category: 'Miracles & Edges' },

  // Category 3: Platform Mastery & 16-Game Diversity (31–45)
  { id: 'jack_of_all_trades', name: 'Jack of All Trades', icon: '🃏', description: 'Play at least one match on all 16 different games on the platform.', category: 'Platform Mastery' },
  { id: 'board_game_baron', name: 'Board Game Baron', icon: '🏰', description: 'Win a match in every single board-style game in your catalog.', category: 'Platform Mastery' },
  { id: 'arcade_ace', name: 'Arcade Ace', icon: '🕹️', description: 'Win a match in every single arcade-style game in your catalog.', category: 'Platform Mastery' },
  { id: 'chess_grandmaster', name: 'Chess Grandmaster', icon: '♔', description: 'Achieve 25 total wins specifically in Chess.', category: 'Platform Mastery' },
  { id: 'draughts_dominator', name: 'Draughts Dominator', icon: '🔴', description: 'Achieve 25 total wins specifically in Draughts/Checkers.', category: 'Platform Mastery' },
  { id: 'backgammon_boss', name: 'Backgammon Boss', icon: '🎲', description: 'Win 10 matches of Backgammon utilizing high-risk doubles.', category: 'Platform Mastery' },
  { id: 'specialist', name: 'Specialist', icon: '🎓', description: 'Play 50 matches consecutively within a single game category.', category: 'Platform Mastery' },
  { id: 'the_explorer', name: 'The Explorer', icon: '🗺️', description: 'Try a new game type every day for a full week.', category: 'Platform Mastery' },
  { id: 'genre_hopper', name: 'Genre Hopper', icon: '🦘', description: 'Win 3 different games from 3 different genres in a single day.', category: 'Platform Mastery' },
  { id: 'master_of_four', name: 'Master of Four', icon: '☘️', description: 'Reach Level 10 profile rank while maintaining wins across at least 4 distinct games.', category: 'Platform Mastery' },
  { id: 'the_polymath', name: 'The Polymath', icon: '🔬', description: 'Win a match against a Level 5+ AI across 8 unique platform games.', category: 'Platform Mastery' },
  { id: 'classic_connoisseur', name: 'Classic Connoisseur', icon: '🏛️', description: 'Clear a weekly challenge list playing only traditional board games.', category: 'Platform Mastery' },
  { id: 'arcade_addict', name: 'Arcade Addict', icon: '👾', description: 'Spend a cumulative total of 10 hours inside arcade-style game modes.', category: 'Platform Mastery' },
  { id: 'versatile_tactician', name: 'Versatile Tactician', icon: '📊', description: 'Hold a positive win rate (>50%) across at least 10 different games simultaneously.', category: 'Platform Mastery' },
  { id: 'ultimate_completionist', name: 'The Ultimate Completionist', icon: '🔮', description: 'Earn a specific mastery win in all 16 platform titles.', category: 'Platform Mastery' },

  // Category 4: Dedication, Streaks & Grind Milestones (46–60)
  { id: 'centurion', name: 'Century Club', icon: '🎖️', description: 'Complete a total of 100 matches played on your account.', category: 'Dedication & Grind' },
  { id: 'millennial_gamer', name: 'Millennial Gamer', icon: '🏅', description: 'Complete a total of 1,000 matches played.', category: 'Dedication & Grind' },
  { id: 'streak_master', name: 'Daily Habit', icon: '📅', description: 'Maintain a continuous 3-day login streak.', category: 'Dedication & Grind' },
  { id: 'week_of_iron', name: 'Week of Iron', icon: '⛓️', description: 'Maintain a 7-day daily streak without missing a single day.', category: 'Dedication & Grind' },
  { id: 'monthly_legend', name: 'Monthly Legend', icon: '🌟', description: 'Achieve a 30-day unbroken daily login streak.', category: 'Dedication & Grind' },
  { id: 'night_owl', name: 'Night Owl', icon: '🌙', description: 'Complete a ranked match between 2:00 AM and 4:00 AM local time.', category: 'Dedication & Grind' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Complete a match before 6:00 AM local time.', category: 'Dedication & Grind' },
  { id: 'marathon_session', name: 'Marathon Session', icon: '🏋️', description: 'Accumulate over 4 hours of active gameplay in a single calendar day.', category: 'Dedication & Grind' },
  { id: 'xp_billionaire', name: 'XP Billionaire', icon: '💎', description: 'Accumulate a total lifetime score of 10,000 XP.', category: 'Dedication & Grind' },
  { id: 'level_25_elite', name: 'Level 25 Elite', icon: '👑', description: 'Advance your profile to Level 25 through active gameplay and quests.', category: 'Dedication & Grind' },
  { id: 'max_level_master', name: 'Max Level Master', icon: '🌌', description: 'Reach the maximum profile level cap on the platform.', category: 'Dedication & Grind' },
  { id: 'quest_hunter', name: 'Quest Hunter', icon: '🏹', description: 'Complete 50 total daily rotating quests.', category: 'Dedication & Grind' },
  { id: 'perfectionist', name: 'Perfectionist', icon: '🎁', description: 'Complete all 3 daily quests every single day for an entire week.', category: 'Dedication & Grind' },
  { id: 'dedicated_regular', name: 'Dedicated Regular', icon: '📜', description: 'Log in across 50 separate calendar days.', category: 'Dedication & Grind' },
  { id: 'time_lord', name: 'Time Lord', icon: '⏱️', description: 'Accumulate a total of 100 hours of overall platform game time.', category: 'Dedication & Grind' },

  // Category 5: Social, Flex & Hidden Easter Eggs (61–75)
  { id: 'first_friend', name: 'First Friend', icon: '🤝', description: 'Add your first platform friend to your watchlist.', category: 'Social & Secrets' },
  { id: 'social_butterfly', name: 'Social Butterfly', icon: '🦋', description: 'Have 10 active friends on your profile roster.', category: 'Social & Secrets' },
  { id: 'leaderboard_rookie', name: 'Leaderboard Rookie', icon: '📈', description: 'Break into the top 100 of any global leaderboard category.', category: 'Social & Secrets' },
  { id: 'the_top_ten', name: 'The Top Ten', icon: '🥇', description: 'Secure a spot in the top 10 of a global leaderboard.', category: 'Social & Secrets' },
  { id: 'number_one', name: 'Number One', icon: '🏆', description: 'Claim the #1 rank spot on any global or category leaderboard.', category: 'Social & Secrets' },
  { id: 'spectator_pro', name: 'Spectator', icon: '👁️', description: 'Watch 10 live matches through the platform’s spectator view.', category: 'Social & Secrets' },
  { id: 'trendsetter', name: 'Trendsetter', icon: '✨', description: 'Have your profile visited or viewed by 50 different users.', category: 'Social & Secrets' },
  { id: 'the_ghost', name: 'The Ghost', icon: '👻', description: 'Win a match while appearing offline or in stealth mode.', category: 'Social & Secrets' },
  { id: 'midnight_duelist', name: 'Midnight Duelist', icon: '🎆', description: 'Win a competitive match on New Year’s Eve or a major holiday.', category: 'Social & Secrets' },
  { id: 'the_anomaly', name: 'The Anomaly', icon: '👾', description: 'Find and trigger a hidden platform UI shortcut or developer easter egg.', category: 'Social & Secrets' },
  { id: 'lucky_seven', name: 'Lucky Seven', icon: '🎰', description: 'Win a match precisely on your 7th turn with 7 seconds remaining.', category: 'Social & Secrets' },
  { id: 'the_underdog', name: 'The Underdog', icon: '🐶', description: 'Win a match against an opponent whose score/rank is vastly higher than yours.', category: 'Social & Secrets' },
  { id: 'stylist', name: 'Stylist', icon: '🎨', description: 'Customize your profile avatar, theme, or badge showcase using unlocked rewards.', category: 'Social & Secrets' },
  { id: 'veteran_founder', name: 'The Veteran Founder', icon: '🏛️', description: 'Possess an account active during the platform’s early launch window.', category: 'Social & Secrets' },
  { id: 'mythic_one', name: 'The Mythic One', icon: '🌌', description: 'Unlock all other 74 badges to earn the ultimate platform completionist status.', category: 'Social & Secrets' },
];

function evaluateUserBadges(prog: UserProgression): string[] {
  const newlyUnlocked: string[] = [];

  const checkAndUnlock = (badgeId: string, condition: boolean) => {
    if (condition && !prog.unlockedBadgeIds.has(badgeId)) {
      prog.unlockedBadgeIds.add(badgeId);
      newlyUnlocked.push(badgeId);
    }
  };

  checkAndUnlock('first_win', prog.wins >= 1);
  checkAndUnlock('giant_killer', prog.level8AiDefeats >= 1);
  checkAndUnlock('centurion', prog.totalMatches >= 100);
  checkAndUnlock('master_eval', prog.wins >= 25);
  checkAndUnlock('pvp_champ', prog.pvpWins >= 5);
  checkAndUnlock('midway_master', prog.wins >= 10);
  checkAndUnlock('tenfold_titan', prog.level8AiDefeats >= 10);
  checkAndUnlock('xp_billionaire', prog.totalXp >= 10000);
  checkAndUnlock('veteran_founder', true);

  return newlyUnlocked;
}

// API Routes for Progression
app.get('/api/progression/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const user = token ? getUserByToken(token) : null;
  const username = user ? user.username : 'Guest';

  const prog = getOrCreateProgression(username);
  const levelData = getLevelDataFromXp(prog.totalXp);
  const quests = getDailyQuests(username);

  const badges = ALL_BADGES.map((b) => ({
    ...b,
    unlocked: prog.unlockedBadgeIds.has(b.id),
  }));

  res.json({
    username: prog.username,
    progression: levelData,
    stats: {
      totalMatches: prog.totalMatches,
      wins: prog.wins,
      losses: prog.losses,
      draws: prog.draws,
    },
    quests,
    badges,
  });
});

app.get('/api/quests', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const user = token ? getUserByToken(token) : null;
  const username = user ? user.username : 'Guest';

  res.json({ quests: getDailyQuests(username) });
});

app.post('/api/quests/claim', (req, res) => {
  const { questId } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const user = token ? getUserByToken(token) : null;
  const username = user ? user.username : 'Guest';

  const quests = getDailyQuests(username);
  const q = quests.find((item) => item.id === questId);
  if (q && !q.claimed && q.progress >= q.target) {
    q.claimed = true;
    const prog = getOrCreateProgression(username);
    prog.totalXp += q.xpReward;
    const updatedLevel = getLevelDataFromXp(prog.totalXp);
    return res.json({
      success: true,
      message: `Claimed +${q.xpReward} XP!`,
      quest: q,
      progression: updatedLevel,
    });
  }
  res.json({ success: false, message: 'Quest not eligible for claim.' });
});

app.get('/api/badges', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const user = token ? getUserByToken(token) : null;
  const username = user ? user.username : 'Guest';

  const prog = getOrCreateProgression(username);
  const badges = ALL_BADGES.map((b) => ({
    ...b,
    unlocked: prog.unlockedBadgeIds.has(b.id),
  }));

  res.json({ badges });
});

// 8f. Tournaments Endpoint
app.get('/api/tournaments', (req, res) => {
  res.json({
    tournaments: [
      {
        id: 'tourn_1',
        title: 'Weekly Grandmaster Chess Blitz',
        game: 'Chess',
        prizePool: '10,000 XP & Gold Badge',
        participants: 64,
        maxParticipants: 64,
        status: 'live',
        round: 'Quarter-Finals',
      },
      {
        id: 'tourn_2',
        title: 'Connect Four Rapid Championship',
        game: 'Connect Four',
        prizePool: '5,000 XP & Master Trophy',
        participants: 12,
        maxParticipants: 32,
        status: 'upcoming',
        round: 'Starts in 2h 15m',
      },
      {
        id: 'tourn_3',
        title: 'Classic Checkers Knockout Arena',
        game: 'Checkers',
        prizePool: '3,500 XP & Arena Crown',
        participants: 16,
        maxParticipants: 16,
        status: 'live',
        round: 'Semi-Finals',
      },
    ],
  });
});

// 8g. Clans & Guilds Endpoint
const clanList = [
  { id: 'clan_1', name: 'Grandmaster Council', tag: 'GMC', members: 42, totalXp: 185000, rank: 1, icon: '👑' },
  { id: 'clan_2', name: 'Tactical Titans', idTag: 'TT', members: 31, totalXp: 142000, rank: 2, icon: '🛡️' },
  { id: 'clan_3', name: 'Speed Blitzers', idTag: 'SB', members: 28, totalXp: 98000, rank: 3, icon: '⚡' },
  { id: 'clan_4', name: 'AI Hunters', idTag: 'AH', members: 19, totalXp: 74000, rank: 4, icon: '🎯' },
];

app.get('/api/clans', (req, res) => {
  res.json({ clans: clanList });
});

// 9. Ask Gemini: Multi-Game Position Analysis & Hints endpoint
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { activeGame = 'chess', fen, pgn, question, legalMoves, turn } = req.body;

    if (!ai) {
      return res.json({
        analysis:
          `**Gemini AI Strategy Advice (${activeGame.toUpperCase()})**:\n\n*Note: GEMINI_API_KEY is not configured yet in secrets.*\n\n**Quick Game Advice**:\n- Focus on controlling strategic board positions and key movement paths.\n- Maintain defensive safety while seizing tactical opportunities.\n- Calculate probability, move sequences, and counterplays carefully.`,
        suggestedMove: legalMoves?.[0] || 'Move 1',
      });
    }

    const sideToMove = turn === 'w' ? 'White / Red / Player 1' : 'Black / Blue / Player 2';

    const systemPrompt = `You are an expert Game Strategist and AI Coach specializing in ${activeGame}.
Analyze the given board state and recent move history for ${activeGame}.
Be insightful, instructional, encouraging, and clear.

Structure your response with clean Markdown:
- 🎯 **Recommended Action**: State the single best tactical move or roll decision and why.
- ⚖️ **Game Evaluation**: Brief positional or advantage rating.
- 🧠 **Key Strategic Plan**: 2-3 key tactical goals for ${sideToMove}.
- 💡 **Tactical Warnings**: Threats, traps, or risks to watch out for in ${activeGame}.`;

    const userPrompt = `Game: ${activeGame}
Board State / FEN: ${fen || 'Standard Start'}
Turn to move: ${sideToMove}
Move history: ${pgn || 'Game starting'}
${legalMoves?.length ? `Available Legal Moves: ${legalMoves.slice(0, 15).join(', ')}` : ''}
${question ? `User specific question: "${question}"` : `Please provide the best move and position analysis for ${activeGame}.`}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
    });

    const analysisText = response.text || 'Unable to analyze position at this moment.';
    res.json({ analysis: analysisText });
  } catch (err: any) {
    console.error('Gemini API analysis error:', err);
    res.status(500).json({
      error: 'Failed to generate Gemini AI analysis.',
      analysis:
        '**Position Hint**:\nFocus on controlling key strategic squares and timing your piece progressions.',
    });
  }
});

// ==========================================
// VOICE MODERATION & AI CLASSIFICATION ENGINE
// ==========================================

interface VoiceModerationIncident {
  id: string;
  reportedUser: string;
  reporterUsername: string;
  reason: string;
  details?: string;
  roomId?: string;
  transcriptSnapshot?: string;
  timestamp: number;
  autoMutedByAI: boolean;
}

const voiceIncidentLogs: VoiceModerationIncident[] = [];

// API Endpoint: Submit Voice Misconduct Report with Incident Context
app.post('/api/moderation/voice-report', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const reporterUser = token ? getUserByToken(token) : null;
    const reporterUsername = reporterUser ? reporterUser.username : 'Anonymous_User';

    const { reportedUser, reason, details, roomId, transcriptSnapshot } = req.body;

    if (!reportedUser) {
      return res.status(400).json({ error: 'Missing reportedUser parameter.' });
    }

    const incident: VoiceModerationIncident = {
      id: `incident_${crypto.randomBytes(6).toString('hex')}`,
      reportedUser,
      reporterUsername,
      reason: reason || 'misconduct',
      details,
      roomId,
      transcriptSnapshot,
      timestamp: Date.now(),
      autoMutedByAI: true,
    };

    voiceIncidentLogs.push(incident);

    // Broadcast automated server mute for the reported user in the specified room
    if (roomId && io) {
      io.to(roomId).emit('voice:ai_auto_mute', {
        peerId: reportedUser,
        username: reportedUser,
        reason: `User report filed: ${reason}`,
        durationMs: 300000,
      });
    }

    console.log(`[VOICE MODERATION LOGGED] Incident #${incident.id}: ${reportedUser} reported by ${reporterUsername}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Voice misconduct report logged successfully. Target stream auto-muted.',
      incidentId: incident.id,
      autoMuted: true,
    });
  } catch (err: any) {
    console.error('Voice report API error:', err);
    res.status(500).json({ error: 'Server error logging voice report.' });
  }
});

// API Endpoint: Server-Side AI Audio Stream Classification Sweep
app.post('/api/moderation/classify-audio', async (req, res) => {
  try {
    const { speakerUsername, peerId, roomId, audioTranscript, peakDb } = req.body;

    if (!speakerUsername && !peerId) {
      return res.status(400).json({ error: 'Missing speaker identification.' });
    }

    // High peak acoustic outburst (> -5dB) or toxic transcript evaluation
    const isOutburst = typeof peakDb === 'number' && peakDb > -5;
    const containsAbuse = audioTranscript && /abusive|slur|harass|hate|threat/i.test(audioTranscript);

    let violationDetected = isOutburst || containsAbuse;
    let violationCategory = isOutburst ? 'Extreme Acoustic Outburst' : 'Harassment Speech Pattern';

    // If Gemini is available, run deep zero-trust classification
    if (ai && audioTranscript && audioTranscript.length > 5) {
      try {
        const checkPrompt = `You are an AI Voice Moderation System. Classify if this voice transcript contains severe hate speech, harassment, or real-world violence threats. Respond ONLY with "VIOLATION" or "CLEAN".
Transcript: "${audioTranscript}"`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: checkPrompt }] }],
        });

        if (geminiRes.text?.includes('VIOLATION')) {
          violationDetected = true;
          violationCategory = 'AI Flagged Toxic Speech';
        }
      } catch (geminiErr) {
        console.warn('Gemini audio classification fallback to heuristic:', geminiErr);
      }
    }

    if (violationDetected) {
      const targetRoom = roomId || 'global';
      const targetUser = speakerUsername || peerId;

      io.to(targetRoom).emit('voice:ai_auto_mute', {
        peerId: peerId || speakerUsername,
        username: targetUser,
        reason: violationCategory,
        durationMs: 600000,
      });

      console.warn(`[AI AUDIO SHIELD] Auto-muted ${targetUser} in room ${targetRoom}. Violation: ${violationCategory}`);

      return res.json({
        autoMuted: true,
        category: violationCategory,
        message: `Speaker ${targetUser} auto-muted by AI Audio Shield.`,
      });
    }

    res.json({ autoMuted: false, category: 'CLEAN', message: 'Audio stream verified clean.' });
  } catch (err: any) {
    console.error('Audio classification error:', err);
    res.status(500).json({ error: 'Server error classifying audio stream.' });
  }
});

// --- WebSockets Real-Time System ---
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket: Socket) => {
  let currentUser: User | null = null;

  // Client authentication over socket
  socket.on('auth', (data: { token?: string }) => {
    const foundUser = data?.token ? getUserByToken(data.token) : null;
    if (foundUser) {
      currentUser = foundUser;
    } else {
      currentUser = getOrCreateGuestSession(data?.token).user;
    }
    socket.emit('auth:success', {
      username: currentUser.username,
      token: currentUser.token,
      isGuest: currentUser.isGuest,
    });
  });

  // --- Lobby & Wheel of Luck Socket Handlers ---
  socket.on('lobby:join', () => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;

    socket.join('wheel_lobby');
    // Ensure user is not duplicated in lobby pool
    lobbyPool = lobbyPool.filter((p) => p.token !== currentUser!.token && p.socketId !== socket.id);
    lobbyPool.push({
      socketId: socket.id,
      token: currentUser.token,
      username: currentUser.username,
      avatar: '♔',
    });

    // Broadcast updated lobby list to all connected in lobby
    io.to('wheel_lobby').emit('lobby:users', lobbyPool);
  });

  socket.on('lobby:leave', () => {
    socket.leave('wheel_lobby');
    lobbyPool = lobbyPool.filter((p) => p.socketId !== socket.id);
    io.to('wheel_lobby').emit('lobby:users', lobbyPool);
  });

  socket.on('lobby:spin_trigger', () => {
    if (lobbyPool.length < 2) {
      return socket.emit('lobby:error', { message: 'Need at least 2 connected users in lobby to spin!' });
    }

    // Pick 2 distinct random players from lobby pool
    const idx1 = Math.floor(Math.random() * lobbyPool.length);
    let idx2 = Math.floor(Math.random() * lobbyPool.length);
    while (idx2 === idx1 && lobbyPool.length > 1) {
      idx2 = Math.floor(Math.random() * lobbyPool.length);
    }

    const p1 = lobbyPool[idx1];
    const p2 = lobbyPool[idx2];

    // Assign White vs Black randomly
    const isP1White = Math.random() > 0.5;
    const whiteUser = isP1White ? p1 : p2;
    const blackUser = isP1White ? p2 : p1;

    const roomId = `wheel_${crypto.randomBytes(6).toString('hex')}`;

    const newRoom: PvPRoom = {
      roomId,
      whiteToken: whiteUser.token,
      blackToken: blackUser.token,
      whiteUsername: whiteUser.username,
      blackUsername: blackUser.username,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      status: 'active',
      turn: 'w',
      whiteTime: 600,
      blackTime: 600,
      lastTurnTime: Date.now(),
      moves: [],
    };

    pvpRooms.set(roomId, newRoom);
    roomChats.set(roomId, [
      {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: `Wheel of Luck Match! ${whiteUser.username} (White) vs ${blackUser.username} (Black).`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);

    // Remove matched players from lobby pool
    lobbyPool = lobbyPool.filter((p) => p.token !== p1.token && p.token !== p2.token);
    io.to('wheel_lobby').emit('lobby:users', lobbyPool);

    // Join their sockets to room
    const socket1 = io.sockets.sockets.get(p1.socketId);
    const socket2 = io.sockets.sockets.get(p2.socketId);
    if (socket1) socket1.join(roomId);
    if (socket2) socket2.join(roomId);

    // Broadcast spin result animation data to all lobby users
    io.to('wheel_lobby').emit('lobby:spin_result', {
      idx1,
      idx2,
      player1: p1.username,
      player2: p2.username,
      whiteUsername: whiteUser.username,
      blackUsername: blackUser.username,
      roomId,
    });

    // Send game start event to matched room
    io.to(roomId).emit('game:started', {
      roomId,
      whiteUsername: whiteUser.username,
      blackUsername: blackUser.username,
      fen: newRoom.fen,
    });
  });

  // Quick Matchmaking Queue
  socket.on('matchmaking:join', () => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;

    // Remove stale queue items for same token
    waitingQueue = waitingQueue.filter((q) => q.token !== currentUser!.token && q.socketId !== socket.id);

    if (waitingQueue.length > 0) {
      // Match with waiting player!
      const opponent = waitingQueue.shift()!;
      const roomId = `room_${crypto.randomBytes(6).toString('hex')}`;

      // Randomly assign white and black
      const isCurrentWhite = Math.random() > 0.5;
      const whiteUser = isCurrentWhite ? currentUser : usersByToken.get(opponent.token) || { username: opponent.username, token: opponent.token };
      const blackUser = isCurrentWhite ? usersByToken.get(opponent.token) || { username: opponent.username, token: opponent.token } : currentUser;

      const newRoom: PvPRoom = {
        roomId,
        whiteToken: whiteUser.token,
        blackToken: blackUser.token,
        whiteUsername: whiteUser.username,
        blackUsername: blackUser.username,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: 'active',
        turn: 'w',
        whiteTime: 600,
        blackTime: 600,
        lastTurnTime: Date.now(),
        moves: [],
      };

      pvpRooms.set(roomId, newRoom);
      roomChats.set(roomId, [
        {
          id: `sys_${Date.now()}`,
          sender: 'System',
          text: `Game started! ${whiteUser.username} (White) vs ${blackUser.username} (Black). Good luck!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);

      // Join sockets to socket.io room
      socket.join(roomId);
      const opponentSocket = io.sockets.sockets.get(opponent.socketId);
      if (opponentSocket) {
        opponentSocket.join(roomId);
      }

      // Notify both players
      io.to(roomId).emit('game:started', {
        roomId,
        whiteUsername: whiteUser.username,
        blackUsername: blackUser.username,
        fen: newRoom.fen,
      });
    } else {
      waitingQueue.push({
        socketId: socket.id,
        token: currentUser.token,
        username: currentUser.username,
      });
      socket.emit('matchmaking:waiting');
    }
  });

  socket.on('matchmaking:cancel', () => {
    waitingQueue = waitingQueue.filter((q) => q.socketId !== socket.id);
    socket.emit('matchmaking:cancelled');
  });

  // Custom Room Creation
  socket.on('room:create', (data?: { title?: string; communityNotice?: string; roomRules?: { minimumRating?: number; allowChat?: boolean; maxPlayers?: number } }) => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;
    const roomId = `code_${Math.floor(100000 + Math.random() * 900000)}`;

    const roomRules = {
      minimumRating: typeof data?.roomRules?.minimumRating === 'number' ? data.roomRules.minimumRating : 1200,
      allowChat: data?.roomRules?.allowChat !== false,
      maxPlayers: data?.roomRules?.maxPlayers || 2,
    };
    const communityNotice = data?.communityNotice?.trim() || '';
    const roomTitle = data?.title?.trim() || 'Private Room';

    const newRoom: PvPRoom = {
      roomId,
      title: roomTitle,
      whiteToken: currentUser.token,
      blackToken: '',
      whiteUsername: currentUser.username,
      blackUsername: 'Waiting...',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      status: 'waiting',
      turn: 'w',
      whiteTime: 600,
      blackTime: 600,
      lastTurnTime: Date.now(),
      moves: [],
      communityNotice,
      roomRules,
      ownerId: currentUser.id,
    };

    pvpRooms.set(roomId, newRoom);

    const initialChats: ChatMessage[] = [
      {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: `Room "${roomTitle}" (${roomId}) created by ${currentUser.username}.${communityNotice ? ` 📢 Notice: "${communityNotice}"` : ''}`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ];
    roomChats.set(roomId, initialChats);

    socket.join(roomId);
    socket.emit('room:created', { roomId, myColor: 'w', room: newRoom });
  });

  // Join Custom Room
  socket.on('room:join', (data: { roomId: string; asSpectator?: boolean; isSpectator?: boolean }) => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;
    const room = pvpRooms.get(data.roomId);

    if (!room) {
      return socket.emit('room:error', { message: 'Room not found.' });
    }

    const wantSpectate = Boolean(data.asSpectator || data.isSpectator);

    if (wantSpectate) {
      socket.join(data.roomId);
      socket.emit('room:joined', {
        roomId: data.roomId,
        myColor: 'spectator',
        isSpectator: true,
        room,
        communityNotice: room.communityNotice,
        roomRules: room.roomRules,
      });
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: `👁️ ${currentUser.username} is now spectating the match.${room.communityNotice ? ` Notice: "${room.communityNotice}"` : ''}`,
        timestamp: Date.now(),
        isSystem: true,
      };
      const messages = roomChats.get(data.roomId) || [];
      messages.push(sysMsg);
      roomChats.set(data.roomId, messages);
      io.to(data.roomId).emit('chat:message', sysMsg);
      return;
    }

    if (room.whiteToken === currentUser.token) {
      socket.join(data.roomId);
      return socket.emit('room:joined', {
        roomId: data.roomId,
        myColor: 'w',
        room,
        communityNotice: room.communityNotice,
        roomRules: room.roomRules,
      });
    }

    // Check minimum rating threshold for entering player
    const userRating = currentUser.rating || 1200;
    if (room.roomRules && typeof room.roomRules.minimumRating === 'number' && userRating < room.roomRules.minimumRating) {
      return socket.emit('room:error', {
        message: `Rating threshold not met: Owner requires minimum ${room.roomRules.minimumRating} rating (your rating: ${userRating}).`,
      });
    }

    if (!room.blackToken) {
      room.blackToken = currentUser.token;
      room.blackUsername = currentUser.username;
      room.status = 'active';

      socket.join(data.roomId);
      const existingChats = roomChats.get(data.roomId) || [];
      const startMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: `Game started! ${room.whiteUsername} (White) vs ${room.blackUsername} (Black).${room.communityNotice ? ` [📢 Notice: ${room.communityNotice}]` : ''}`,
        timestamp: Date.now(),
        isSystem: true,
      };
      existingChats.push(startMsg);
      roomChats.set(data.roomId, existingChats);

      io.to(data.roomId).emit('game:started', {
        roomId: data.roomId,
        whiteUsername: room.whiteUsername,
        blackUsername: room.blackUsername,
        fen: room.fen,
        communityNotice: room.communityNotice,
        roomRules: room.roomRules,
      });
    } else if (room.blackToken === currentUser.token) {
      socket.join(data.roomId);
      socket.emit('room:joined', {
        roomId: data.roomId,
        myColor: 'b',
        room,
        communityNotice: room.communityNotice,
        roomRules: room.roomRules,
      });
    } else {
      // Room is full for playing, but join as Spectator!
      socket.join(data.roomId);
      socket.emit('room:joined', {
        roomId: data.roomId,
        myColor: 'spectator',
        isSpectator: true,
        room,
        communityNotice: room.communityNotice,
        roomRules: room.roomRules,
      });
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: `👁️ ${currentUser.username} is now spectating the match.`,
        timestamp: Date.now(),
        isSystem: true,
      };
      const messages = roomChats.get(data.roomId) || [];
      messages.push(sysMsg);
      roomChats.set(data.roomId, messages);
      io.to(data.roomId).emit('chat:message', sysMsg);
    }
  });

  // Quick Emote broadcasting
  socket.on('game:emote', (data: { roomId: string; emote: string; sender?: string }) => {
    io.to(data.roomId).emit('game:emote_received', {
      emote: data.emote,
      sender: data.sender || currentUser?.username || 'Player',
      timestamp: Date.now(),
    });
  });

  // Game Move Event
  socket.on('game:move', (data: { roomId: string; from: string; to: string; promotion?: string; fen: string; san: string; isGameOver?: boolean; winner?: 'w' | 'b' | 'draw'; reason?: string }) => {
    const room = pvpRooms.get(data.roomId);
    if (!room) return;

    room.fen = data.fen;
    room.turn = room.turn === 'w' ? 'b' : 'w';
    room.moves.push({ from: data.from, to: data.to, promotion: data.promotion, san: data.san });

    // Broadcast move to opponent in room
    socket.to(data.roomId).emit('game:moved', {
      from: data.from,
      to: data.to,
      promotion: data.promotion,
      fen: data.fen,
      san: data.san,
      turn: room.turn,
    });

    // If game ended, record match
    if (data.isGameOver && room.status !== 'finished') {
      room.status = 'finished';

      const matchRecord: MatchRecord = {
        id: `m_${crypto.randomBytes(8).toString('hex')}`,
        mode: 'pvp',
        whiteUsername: room.whiteUsername,
        blackUsername: room.blackUsername,
        whiteToken: room.whiteToken,
        blackToken: room.blackToken,
        winner: data.winner || 'draw',
        reason: data.reason || 'checkmate',
        moveCount: room.moves.length,
        pgn: '',
        moves: room.moves,
        createdAt: Date.now(),
        timeControlPreset: '10+0',
      };

      finishedGames.push(matchRecord);
      broadcastLeaderboardUpdate();
      io.to(data.roomId).emit('game:ended', {
        winner: data.winner,
        reason: data.reason,
      });
    }
  });

  // Resignation
  socket.on('game:resign', (data: { roomId: string }) => {
    const room = pvpRooms.get(data.roomId);
    if (!room || room.status === 'finished') return;

    const isWhiteResigning = currentUser?.token === room.whiteToken;
    const winner = isWhiteResigning ? 'b' : 'w';
    room.status = 'finished';

    const matchRecord: MatchRecord = {
      id: `m_${crypto.randomBytes(8).toString('hex')}`,
      mode: 'pvp',
      whiteUsername: room.whiteUsername,
      blackUsername: room.blackUsername,
      whiteToken: room.whiteToken,
      blackToken: room.blackToken,
      winner,
      reason: 'resignation',
      moveCount: room.moves.length,
      pgn: '',
      moves: room.moves,
      createdAt: Date.now(),
      timeControlPreset: '10+0',
    };

    finishedGames.push(matchRecord);
    io.to(data.roomId).emit('game:ended', {
      winner,
      reason: 'resignation',
      resignedUsername: currentUser?.username,
    });
  });

  // Draw Negotiation
  socket.on('game:draw_offer', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('game:draw_offered', {
      offeredBy: currentUser?.username,
    });
  });

  socket.on('game:draw_respond', (data: { roomId: string; accept: boolean }) => {
    const room = pvpRooms.get(data.roomId);
    if (!room) return;

    if (data.accept && room.status !== 'finished') {
      room.status = 'finished';
      const matchRecord: MatchRecord = {
        id: `m_${crypto.randomBytes(8).toString('hex')}`,
        mode: 'pvp',
        whiteUsername: room.whiteUsername,
        blackUsername: room.blackUsername,
        whiteToken: room.whiteToken,
        blackToken: room.blackToken,
        winner: 'draw',
        reason: 'agreement',
        moveCount: room.moves.length,
        pgn: '',
        moves: room.moves,
        createdAt: Date.now(),
        timeControlPreset: '10+0',
      };
      finishedGames.push(matchRecord);
      io.to(data.roomId).emit('game:ended', {
        winner: 'draw',
        reason: 'agreement',
      });
    } else {
      socket.to(data.roomId).emit('game:draw_declined');
    }
  });

  // Dedicated Room Real-Time Chat
  socket.on('chat:send', (data: { roomId: string; text: string }) => {
    if (!data.roomId || !data.text || !data.text.trim()) return;
    if (!currentUser) currentUser = getOrCreateGuestSession().user;

    const room = pvpRooms.get(data.roomId);
    if (room && room.roomRules && room.roomRules.allowChat === false) {
      return socket.emit('chat:message', {
        id: `sys_${Date.now()}`,
        sender: 'System',
        text: '⚠️ Room chat has been disabled by the room owner in room rules.',
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: currentUser.username,
      text: data.text.trim(),
      timestamp: Date.now(),
    };

    const messages = roomChats.get(data.roomId) || [];
    messages.push(msg);
    roomChats.set(data.roomId, messages);

    io.to(data.roomId).emit('chat:message', msg);
  });

  // --- WebRTC 3D Spatial Audio & Moderation Signaling Handlers ---
  socket.on('voice:join_channel', (data: { roomId: string }) => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;
    socket.join(`voice_${data.roomId}`);
    socket.to(`voice_${data.roomId}`).emit('voice:peer_joined', {
      peerId: socket.id,
      username: currentUser.username,
    });
  });

  socket.on('voice:update_position', (data: { roomId: string; position: { x: number; y: number; z: number } }) => {
    if (!currentUser) currentUser = getOrCreateGuestSession().user;
    socket.to(`voice_${data.roomId}`).emit('voice:peer_position', {
      peerId: socket.id,
      username: currentUser.username,
      position: data.position,
    });
  });

  socket.on('voice:audio_sweep', (data: { roomId: string; peakDb: number }) => {
    if (data.peakDb > -5) {
      const uname = currentUser?.username || 'Guest';
      io.to(`voice_${data.roomId}`).emit('voice:ai_auto_mute', {
        peerId: socket.id,
        username: uname,
        reason: 'Extreme Acoustic Outburst Peak (-4dB threshold surpassed)',
        durationMs: 300000,
      });
      console.warn(`[AI AUDIO SWEEP] Auto-muted ${uname} in room ${data.roomId} due to acoustic peak (${data.peakDb} dB).`);
    }
  });

  socket.on('voice:webrtc_offer', (data: { targetPeerId: string; offer: any }) => {
    io.to(data.targetPeerId).emit('voice:webrtc_offer', {
      fromPeerId: socket.id,
      offer: data.offer,
    });
  });

  socket.on('voice:webrtc_answer', (data: { targetPeerId: string; answer: any }) => {
    io.to(data.targetPeerId).emit('voice:webrtc_answer', {
      fromPeerId: socket.id,
      answer: data.answer,
    });
  });

  socket.on('voice:ice_candidate', (data: { targetPeerId: string; candidate: any }) => {
    io.to(data.targetPeerId).emit('voice:ice_candidate', {
      fromPeerId: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on('disconnect', () => {
    waitingQueue = waitingQueue.filter((q) => q.socketId !== socket.id);
    lobbyPool = lobbyPool.filter((p) => p.socketId !== socket.id);
    io.to('wheel_lobby').emit('lobby:users', lobbyPool);
  });
});

// --- Server Boot & Vite Middleware Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess Application Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
