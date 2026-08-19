/**
 * Cinematic VFX & Animation Engine for Main Chess and Showcase
 * Handles piece-specific physics, particle explosions, shockwaves,
 * screen shake, evaluation badges, and synthesized Web Audio sound fx.
 */

export type MoveQuality = 'brilliant' | 'great' | 'best' | 'blunder' | 'checkmate' | 'check' | 'capture' | 'standard';

export interface VfxSettings {
  enabled: boolean;
  animSpeed: number; // 0.5, 1, 1.5, 2
  particleDensity: number; // 12 to 72
  screenShake: boolean;
  soundEnabled: boolean;
  vfxTheme: 'cyber' | 'royal' | 'inferno' | 'emerald';
  floatingBadges: boolean;
  piecePhysics: boolean;
  animStyleMode: 'dynamic' | 1 | 2 | 3 | 4;
}

const DEFAULT_VFX_SETTINGS: VfxSettings = {
  enabled: false,
  animSpeed: 1,
  particleDensity: 36,
  screenShake: false,
  soundEnabled: true,
  vfxTheme: 'cyber',
  floatingBadges: false,
  piecePhysics: false,
  animStyleMode: 'dynamic',
};

const STORAGE_KEY = 'chess_cinematic_vfx_settings';

export function loadVfxSettings(): VfxSettings {
  if (typeof window === 'undefined') return DEFAULT_VFX_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VFX_SETTINGS;
    return { ...DEFAULT_VFX_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VFX_SETTINGS;
  }
}

export function saveVfxSettings(settings: Partial<VfxSettings>): VfxSettings {
  const current = loadVfxSettings();
  const next = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('chess_vfx_settings_updated', { detail: next }));
    } catch {}
  }
  return next;
}

// Web Audio Synthesizer for high-energy cinematic sound fx
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playCinematicSound(
  type:
    | 'move'
    | 'capture'
    | 'brilliant'
    | 'blunder'
    | 'checkmate'
    | 'check'
    | 'leap'
    | 'whoosh'
    | 'cry'
    | 'cry_pawn'
    | 'cry_knight'
    | 'cry_bishop'
    | 'cry_rook'
    | 'cry_queen'
    | 'cry_king'
) {
  const settings = loadVfxSettings();
  if (!settings.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'cry_pawn' || type === 'cry') {
      // Pawn Despair Wail: micro-jitter acoustic warble sine-harmonic with weeping drop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(520, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'cry_knight') {
      // Knight War Cry: brassy rising trumpet/charge fanfare
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(330, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } else if (type === 'cry_bishop') {
      // Bishop Chant Echo: reverberant choral multi-tone interval
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.4); // E5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4); // C6
      gain2.gain.setValueAtTime(0.2, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } else if (type === 'cry_rook') {
      // Rook Siege Siren: deep sub-bass horn blast
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now); // A2
      osc.frequency.linearRampToValueAtTime(85, now + 0.6);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === 'cry_queen') {
      // Queen Sovereign Command: regal brilliance triple shimmer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.15);
      osc.frequency.setValueAtTime(1760, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.4);
      gain2.gain.setValueAtTime(0.2, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } else if (type === 'cry_king') {
      // King Imperial Decree: majestic low-octave coronation chord
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, now); // C3
      osc.frequency.setValueAtTime(164.81, now + 0.15); // E3
      osc.frequency.setValueAtTime(196.0, now + 0.3); // G3
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(261.63, now); // C4
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'leap') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'capture') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'brilliant') {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.55);
      osc2.stop(now + 0.65);
    } else if (type === 'checkmate') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, now); // C3
      osc.frequency.setValueAtTime(196.0, now + 0.15); // G3
      osc.frequency.setValueAtTime(261.63, now + 0.3); // C4
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (type === 'check') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'blunder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {}
}

export interface VfxParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'diamond';
}

export function getThemeColors(theme: 'cyber' | 'royal' | 'inferno' | 'emerald'): string[] {
  switch (theme) {
    case 'royal':
      return ['#ffd700', '#f59e0b', '#fbbf24', '#ffffff', '#eab308'];
    case 'inferno':
      return ['#ff4b1f', '#ff9068', '#ef4444', '#f97316', '#ffedd5'];
    case 'emerald':
      return ['#00ffd5', '#10b981', '#34d399', '#059669', '#a7f3d0'];
    case 'cyber':
    default:
      return ['#00f2fe', '#4facfe', '#00ffd5', '#38ef7d', '#ffffff'];
  }
}

export type PieceElementCode = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type PieceActionType = 'capturing' | 'occupying';

export interface VariationSpec {
  id: string;
  piece: PieceElementCode;
  pieceName: string;
  action: PieceActionType;
  styleIndex: 1 | 2 | 3 | 4;
  styleName: string;
  animationTitle: string;
  effectModifierTitle: string;
  cssSelector: string;
  animationName: string;
  effectFilter: string;
  speed: string;
  description: string;
  colorAccent: string;
  hardwareAcceleration: string;
}

// 96-State Matrix Engine: Full Piece Spectrum (Pawn, Knight, Bishop, Rook, Queen, King)
// 48 Animations + 48 Visual Effect Modifiers
// Capturing Styles: 1. Dissolve, 2. Spin Vortex, 3. Hyper Shatter, 4. Singularity Warp
// Occupying Styles: 1. Portal Arrival, 2. Golden Halo, 3. Solar Rift, 4. Flank Dash
export const VARIATIONS_96_MATRIX: VariationSpec[] = [
  // =========================================================================
  // --- 1. PAWN (P) ---
  // =========================================================================
  {
    id: 'P_cap_1',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'Pawn Obsidian Dissolve',
    effectModifierTitle: 'Monochrome Perimeter Shadow',
    cssSelector: '[data-piece="P"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 6px #94a3b8) grayscale(0.2)',
    speed: '0.5s',
    description: 'Pawn Dissolve Void Capture with soft perimeter shadow and optical fade',
    colorAccent: '#94a3b8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_occ_1',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'Pawn Quantum Portal Arrival',
    effectModifierTitle: 'Silver Dimensional Halo Flare',
    cssSelector: '[data-piece="P"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #94a3b8 (Silver Portal Beam)',
    speed: '0.5s',
    description: 'Pawn quantum baseline arrival with smooth dimensional scale landing',
    colorAccent: '#94a3b8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_cap_2',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'Pawn 720° Spin Vortex Dissipation',
    effectModifierTitle: 'Chromatic Cyan Hue Shift',
    cssSelector: '[data-piece="P"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'hue-rotate(45deg) drop-shadow(0 0 8px #38bdf8)',
    speed: '0.5s',
    description: 'Pawn rapid gyroscopic spin vortex with chromatic spectrum shift',
    colorAccent: '#38bdf8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_occ_2',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'Pawn Celestial Golden Halo Ingress',
    effectModifierTitle: 'Auric Radiance Pulse Ring',
    cssSelector: '[data-piece="P"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 10px #38bdf8)',
    speed: '0.5s',
    description: 'Pawn celestial gold halo crown touchdown with settling aura',
    colorAccent: '#38bdf8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_cap_3',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'Pawn Kinetic Hyper Shatter Strike',
    effectModifierTitle: 'Hyper-Saturated Amber Blast Wave',
    cssSelector: '[data-piece="P"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'saturate(2.2) drop-shadow(0 0 10px #f59e0b)',
    speed: '0.5s',
    description: 'Pawn explosive multi-axis shatter strike with saturated thermal burst',
    colorAccent: '#f59e0b',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_occ_3',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'Pawn Solar Rift Materialization',
    effectModifierTitle: 'Corona Thermal Flare Filter',
    cssSelector: '[data-piece="P"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'saturate(2) drop-shadow(0 0 12px #f59e0b)',
    speed: '0.5s',
    description: 'Pawn high-energy solar flare rift condensation onto target square',
    colorAccent: '#f59e0b',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_cap_4',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'Pawn Gravitational Singularity Warp',
    effectModifierTitle: 'Platinum Event Horizon Collapse',
    cssSelector: '[data-piece="P"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #cbd5e1; --fx-secondary: #64748b',
    speed: '0.5s',
    description: 'Pawn black-hole gravitational compression and event-horizon collapse',
    colorAccent: '#e2e8f0',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'P_occ_4',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'Pawn Kinetic Flank Dash Ingress',
    effectModifierTitle: 'Inertial Vector Motion Streak',
    cssSelector: '[data-piece="P"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 6px #e2e8f0)',
    speed: '0.5s',
    description: 'Pawn swift diagonal flank dash with instant momentum arrest',
    colorAccent: '#e2e8f0',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },

  // =========================================================================
  // --- 2. KNIGHT (N) ---
  // =========================================================================
  {
    id: 'N_cap_1',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'Knight Crimson Blade Dissolve',
    effectModifierTitle: 'Blood Ruby Perimeter Bloom',
    cssSelector: '[data-piece="N"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 8px #ef4444) brightness(1.2)',
    speed: '0.5s',
    description: 'Knight cleaving blade dissolution with luminous red perimeter glow',
    colorAccent: '#ef4444',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_occ_1',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'Knight Emerald Rift Portal Arrival',
    effectModifierTitle: 'Jade Dimensional Light Column',
    cssSelector: '[data-piece="N"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #ef4444',
    speed: '0.5s',
    description: 'Knight dimensional gate touchdown with parabolic arc recovery',
    colorAccent: '#ef4444',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_cap_2',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'Knight Gyroscopic 720° Spin Vortex',
    effectModifierTitle: 'Emerald Centrifugal Saturation',
    cssSelector: '[data-piece="N"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'drop-shadow(0 0 10px #22c55e) saturate(1.8)',
    speed: '0.5s',
    description: 'Knight hyper-rotational spin cleave with centrifugal vortex dispersion',
    colorAccent: '#22c55e',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_occ_2',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'Knight Celestial Golden Halo Descent',
    effectModifierTitle: 'Auric Equine Crown Glow',
    cssSelector: '[data-piece="N"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 12px #22c55e)',
    speed: '0.5s',
    description: 'Knight golden halo sovereign landing with radiant bounce',
    colorAccent: '#22c55e',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_cap_3',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'Knight Seismic Hyper Shatter Explosion',
    effectModifierTitle: 'High-Contrast Violet Kinetic Surge',
    cssSelector: '[data-piece="N"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'contrast(160%) drop-shadow(0 0 12px #a855f7)',
    speed: '0.5s',
    description: 'Knight high-torque kinetic shock shatter with violet fragmentation',
    colorAccent: '#a855f7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_occ_3',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'Knight Solar Flare Rift Ingress',
    effectModifierTitle: 'Purple Star Thermal Corona',
    cssSelector: '[data-piece="N"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'contrast(140%) drop-shadow(0 0 14px #a855f7)',
    speed: '0.5s',
    description: 'Knight 3D parabolic solar leap descending through thermal corona',
    colorAccent: '#a855f7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_cap_4',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'Knight Quantum Singularity Warp Collapse',
    effectModifierTitle: 'Cyan Warp Singularity Lens',
    cssSelector: '[data-piece="N"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #06b6d4; --fx-secondary: #3b82f6',
    speed: '0.5s',
    description: 'Knight cosmic singularity warp discharge erasing the captured piece',
    colorAccent: '#06b6d4',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'N_occ_4',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'Knight Swift L-Vector Flank Dash',
    effectModifierTitle: 'Cyan Corner Motion Streak',
    cssSelector: '[data-piece="N"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 8px #06b6d4)',
    speed: '0.5s',
    description: 'Knight lightning-fast L-pattern vector dash into destination square',
    colorAccent: '#06b6d4',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },

  // =========================================================================
  // --- 3. BISHOP (B) ---
  // =========================================================================
  {
    id: 'B_cap_1',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'Bishop Cerulean Sanctuary Dissolve',
    effectModifierTitle: 'Prismatic Blue Mirage Blur',
    cssSelector: '[data-piece="B"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 10px #0284c7) blur(0.5px)',
    speed: '0.5s',
    description: 'Bishop ethereal sanctuary diagonal dissolve with celestial soft blur',
    colorAccent: '#0284c7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_occ_1',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'Bishop Astral Prism Portal Arrival',
    effectModifierTitle: 'Azure Beam Teleportation Lens',
    cssSelector: '[data-piece="B"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #0284c7',
    speed: '0.5s',
    description: 'Bishop azure prism diagonal teleportation through celestial gateway',
    colorAccent: '#0284c7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_cap_2',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'Bishop Amber Relic Spin Vortex',
    effectModifierTitle: 'Sepia Sanctum Glint Filter',
    cssSelector: '[data-piece="B"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'drop-shadow(0 0 10px #d97706) brightness(1.3)',
    speed: '0.5s',
    description: 'Bishop ancient relic golden spin vortex with incandescent shine',
    colorAccent: '#d97706',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_occ_2',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'Bishop Sanctified Golden Halo Ingress',
    effectModifierTitle: 'Clerical Auric Bloom Radiance',
    cssSelector: '[data-piece="B"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 14px #d97706)',
    speed: '0.5s',
    description: 'Bishop divine golden halo descent with sanctified light rings',
    colorAccent: '#d97706',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_cap_3',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'Bishop Violet Crystal Hyper Shatter',
    effectModifierTitle: 'High-Saturation Amethyst Shards',
    cssSelector: '[data-piece="B"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'drop-shadow(0 0 12px #8b5cf6) saturate(1.7)',
    speed: '0.5s',
    description: 'Bishop crystalline diagonal fracture blast scattering luminous shards',
    colorAccent: '#8b5cf6',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_occ_3',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'Bishop Ether Focus Solar Rift Ingress',
    effectModifierTitle: 'Cosmic Magenta Solar Flare',
    cssSelector: '[data-piece="B"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'drop-shadow(0 0 15px #8b5cf6)',
    speed: '0.5s',
    description: 'Bishop ether concentration condensing through high-energy solar rift',
    colorAccent: '#8b5cf6',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_cap_4',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'Bishop Diagonal Singularity Warp Collapse',
    effectModifierTitle: 'Neon Pink Event Horizon Flare',
    cssSelector: '[data-piece="B"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #ec4899; --fx-secondary: #8b5cf6',
    speed: '0.5s',
    description: 'Bishop 45° angular singularity vortex swallowing the target piece',
    colorAccent: '#ec4899',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'B_occ_4',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'Bishop Precision Diagonal Flank Dash',
    effectModifierTitle: 'Laser Trajectory Streak Bloom',
    cssSelector: '[data-piece="B"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 10px #ec4899)',
    speed: '0.5s',
    description: 'Bishop rapid diagonal laser dash lock onto key board diagonals',
    colorAccent: '#ec4899',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },

  // =========================================================================
  // --- 4. ROOK (R) ---
  // =========================================================================
  {
    id: 'R_cap_1',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'Rook Heavy Obsidian Dissolve',
    effectModifierTitle: 'Volcanic Inversion Fade Shield',
    cssSelector: '[data-piece="R"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 10px #dc2626) invert(0.15)',
    speed: '0.5s',
    description: 'Rook fortress heavy phase dissolution with dark thermal inverse glow',
    colorAccent: '#dc2626',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_occ_1',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'Rook Fortress Bastion Portal Arrival',
    effectModifierTitle: 'Crimson Iron Gate Radiance',
    cssSelector: '[data-piece="R"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #dc2626',
    speed: '0.5s',
    description: 'Rook towering fortress bastion solidifying from dimensional portal',
    colorAccent: '#dc2626',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_cap_2',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'Rook High-Torque Battering Spin Vortex',
    effectModifierTitle: 'Cyan Centrifugal Hydro Vortex',
    cssSelector: '[data-piece="R"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'drop-shadow(0 0 12px #06b6d4) hue-rotate(180deg)',
    speed: '0.4s',
    description: 'Rook high-torque battering spin overdrive smashing target defenses',
    colorAccent: '#06b6d4',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_occ_2',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'Rook Bastion Golden Halo Lockdown',
    effectModifierTitle: 'Cyan-Gold Imperial Aegis',
    cssSelector: '[data-piece="R"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 14px #06b6d4)',
    speed: '0.4s',
    description: 'Rook heavy bastion golden halo anchor locking down rank and file',
    colorAccent: '#06b6d4',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_cap_3',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'Rook Fortress Siege Seismic Hyper Shatter',
    effectModifierTitle: 'Ruby Shockwave Impact Filter',
    cssSelector: '[data-piece="R"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'drop-shadow(0 0 14px #e11d48) brightness(1.4)',
    speed: '0.5s',
    description: 'Rook ground-shaking seismic impact annihilating the enemy piece',
    colorAccent: '#e11d48',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_occ_3',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'Rook Magma Bastion Solar Rift Ingress',
    effectModifierTitle: 'Thermal Molten Core Flare',
    cssSelector: '[data-piece="R"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'drop-shadow(0 0 16px #e11d48)',
    speed: '0.5s',
    description: 'Rook molten core eruption reforming into impenetrable fortress',
    colorAccent: '#e11d48',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_cap_4',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'Rook Amethyst Dimensional Singularity Warp',
    effectModifierTitle: 'Deep Violet Gravity Well',
    cssSelector: '[data-piece="R"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #9333ea; --fx-secondary: #4f46e5',
    speed: '0.5s',
    description: 'Rook royal amethyst dimensional breach crushing enemy into singularity',
    colorAccent: '#9333ea',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'R_occ_4',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'Rook Linear Rank & File Flank Dash',
    effectModifierTitle: 'Purple Heavy Motion Blur Trail',
    cssSelector: '[data-piece="R"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 10px #9333ea)',
    speed: '0.5s',
    description: 'Rook swift rectilinear charge across rows and columns to destination',
    colorAccent: '#9333ea',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },

  // =========================================================================
  // --- 5. QUEEN (Q) ---
  // =========================================================================
  {
    id: 'Q_cap_1',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'Queen Astral Eclipse Dissolve',
    effectModifierTitle: 'Magenta Luminous Crown Dissolution',
    cssSelector: '[data-piece="Q"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 15px #d946ef) brightness(1.3)',
    speed: '0.7s',
    description: 'Queen sovereign eclipse dissolve radiating regal magenta coronas',
    colorAccent: '#d946ef',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_occ_1',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'Queen Sovereign Supernova Portal Arrival',
    effectModifierTitle: 'Imperial Magenta Dimensional Cascade',
    cssSelector: '[data-piece="Q"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #d946ef',
    speed: '0.7s',
    description: 'Queen monarch warp rift sovereign entrance with majestic beam cascade',
    colorAccent: '#d946ef',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_cap_2',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'Queen Golden Astral Cyclone Spin Vortex',
    effectModifierTitle: '24K Auric Glint Particle Burst',
    cssSelector: '[data-piece="Q"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'drop-shadow(0 0 16px gold) saturate(2)',
    speed: '0.5s',
    description: 'Queen golden astral cyclone spin vortex obliterating enemy forces',
    colorAccent: '#eab308',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_occ_2',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'Queen Empress Radiance Golden Halo Descent',
    effectModifierTitle: 'Celestial Tiara Bloom Rings',
    cssSelector: '[data-piece="Q"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 20px gold) brightness(1.2)',
    speed: '0.5s',
    description: 'Queen radiant halo crown descent claiming total sovereignty over board',
    colorAccent: '#eab308',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_cap_3',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'Queen Prismatic Diamond Hyper Shatter',
    effectModifierTitle: 'Hyper-Luminescent Cyan Shockwave',
    cssSelector: '[data-piece="Q"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'drop-shadow(0 0 18px #38bdf8) brightness(1.6)',
    speed: '0.5s',
    description: 'Queen diamond-grade shattering burst with blinding chromatic wave',
    colorAccent: '#38bdf8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_occ_3',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'Queen Prismatic Stellar Solar Rift Ingress',
    effectModifierTitle: 'Stellar Fusion Cyan Corona',
    cssSelector: '[data-piece="Q"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'drop-shadow(0 0 20px #38bdf8)',
    speed: '0.5s',
    description: 'Queen stellar fusion materialization with high-energy radiant aura',
    colorAccent: '#38bdf8',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_cap_4',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'Queen Supernova Singularity Warp Erasure',
    effectModifierTitle: 'Ultraviolet Event Horizon Vortex',
    cssSelector: '[data-piece="Q"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #d946ef; --fx-secondary: #00f2fe',
    speed: '0.5s',
    description: 'Queen ultimate dimensional collapse erasing captured piece from reality',
    colorAccent: '#a855f7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'Q_occ_4',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'Queen Omnidirectional Sovereign Flank Dash',
    effectModifierTitle: 'Magenta Vector Warp Trail',
    cssSelector: '[data-piece="Q"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 14px #d946ef)',
    speed: '0.5s',
    description: 'Queen instant omnidirectional vector dash commanding the open board',
    colorAccent: '#a855f7',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },

  // =========================================================================
  // --- 6. KING (K) ---
  // =========================================================================
  {
    id: 'K_cap_1',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 1,
    styleName: 'Dissolve',
    animationTitle: 'King Royal Gold Dynasty Dissolve',
    effectModifierTitle: 'Gold Leaf Parchment Aura',
    cssSelector: '[data-piece="K"].piece-capturing.style-1',
    animationName: 'anim-cap-dissolve',
    effectFilter: 'drop-shadow(0 0 18px #ffd700) brightness(1.4)',
    speed: '0.8s',
    description: 'King historical parchment gold dissolve with grand royal brilliance',
    colorAccent: '#ffd700',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_occ_1',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 1,
    styleName: 'Portal Arrival',
    animationTitle: 'King Sovereign Gate Portal Arrival',
    effectModifierTitle: 'Holy Golden Ray Teleportation',
    cssSelector: '[data-piece="K"].piece-occupying.style-1',
    animationName: 'anim-occ-portal-arrival',
    effectFilter: '--fx-primary: #ffd700',
    speed: '0.8s',
    description: 'King sovereign golden portal arrival with coronation shockwave',
    colorAccent: '#ffd700',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_cap_2',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 2,
    styleName: 'Spin Vortex',
    animationTitle: 'King High-Contrast Cosmic Spin Vortex',
    effectModifierTitle: 'Amber Polar Gyro Dynamic Filter',
    cssSelector: '[data-piece="K"].piece-capturing.style-2',
    animationName: 'anim-cap-spin-vortex',
    effectFilter: 'drop-shadow(0 0 18px #f59e0b) saturate(2.5)',
    speed: '0.5s',
    description: 'King high-contrast polar spin collapse with concentrated amber brilliance',
    colorAccent: '#f59e0b',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_occ_2',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 2,
    styleName: 'Golden Halo',
    animationTitle: 'King Holy Crown Coronation Golden Halo',
    effectModifierTitle: 'Imperial Gold Scepter Radiance',
    cssSelector: '[data-piece="K"].piece-occupying.style-2',
    animationName: 'anim-occ-golden-halo',
    effectFilter: 'drop-shadow(0 0 24px #ffd700) brightness(1.5)',
    speed: '0.8s',
    description: 'King divine holy crown coronation touchdown with royal gold halo',
    colorAccent: '#ffd700',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_cap_3',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 3,
    styleName: 'Hyper Shatter',
    animationTitle: 'King Royal Checkmate Seismic Hyper Shatter',
    effectModifierTitle: 'High-Contrast Red Shock Resonance',
    cssSelector: '[data-piece="K"].piece-capturing.style-3',
    animationName: 'anim-cap-hyper-shatter',
    effectFilter: 'contrast(180%) drop-shadow(0 0 20px #ef4444)',
    speed: '0.8s',
    description: 'King checkmate seismic cleave shattering the adversary piece',
    colorAccent: '#ef4444',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_occ_3',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 3,
    styleName: 'Solar Rift',
    animationTitle: 'King Solar Dynasty Stellar Solar Rift Ingress',
    effectModifierTitle: 'Imperial Solar Corona Flare',
    cssSelector: '[data-piece="K"].piece-occupying.style-3',
    animationName: 'anim-occ-solar-rift',
    effectFilter: 'contrast(160%) drop-shadow(0 0 22px #ef4444)',
    speed: '0.5s',
    description: 'King sovereign stellar solar rift manifestating at destination square',
    colorAccent: '#ef4444',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_cap_4',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 4,
    styleName: 'Singularity Warp',
    animationTitle: 'King Sovereign Singularity Warp Erasure',
    effectModifierTitle: 'Golden Event Horizon Implosion',
    cssSelector: '[data-piece="K"].piece-capturing.style-4',
    animationName: 'anim-cap-singularity-warp',
    effectFilter: '--fx-primary: #ffd700; --fx-secondary: #ef4444',
    speed: '0.5s',
    description: 'King cosmic golden singularity collapse with final victory flash',
    colorAccent: '#b45309',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
  {
    id: 'K_occ_4',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 4,
    styleName: 'Flank Dash',
    animationTitle: 'King Castling Step Royal Flank Dash',
    effectModifierTitle: 'Golden Monarch Deceleration Trail',
    cssSelector: '[data-piece="K"].piece-occupying.style-4',
    animationName: 'anim-occ-flank-dash',
    effectFilter: 'drop-shadow(0 0 16px #ffd700)',
    speed: '0.5s',
    description: 'King dignified castle and tactical step with monarch gold deceleration',
    colorAccent: '#b45309',
    hardwareAcceleration: 'GPU transform3d + will-change',
  },
];

export interface CryStateSpec {
  id: string;
  piece: PieceElementCode;
  pieceName: string;
  name: string;
  animationTitle: string;
  effectModifierTitle: string;
  cssSelector: string;
  animationName: string;
  effectFilter: string;
  pointsValue: number;
  description: string;
  colorAccent: string;
  soundType: 'cry_pawn' | 'cry_knight' | 'cry_bishop' | 'cry_rook' | 'cry_queen' | 'cry_king';
}

export const CRY_STATES_MATRIX: CryStateSpec[] = [
  {
    id: 'cry_P',
    piece: 'P',
    pieceName: 'Pawn',
    name: 'Pawn Despair Wail',
    animationTitle: 'Pawn High-Frequency Despair Wail',
    effectModifierTitle: 'Amber Droplet Soundwave Pulse',
    cssSelector: '[data-piece="P"].piece-cry',
    animationName: 'anim-pawn-cry-despair-wail',
    effectFilter: 'drop-shadow(0 4px 8px rgba(211, 84, 0, 0.7)) drop-shadow(0 0 12px #d35400)',
    pointsValue: 100,
    description: 'Pawn dips downward (translateY 8px), vibrates with high-frequency micro-jitter, and emits a weeping amber droplet shadow (+100 PTS).',
    colorAccent: '#d35400',
    soundType: 'cry_pawn',
  },
  {
    id: 'cry_N',
    piece: 'N',
    pieceName: 'Knight',
    name: 'Knight War Cry',
    animationTitle: 'Knight Stallion High-Charge War Cry',
    effectModifierTitle: 'Crackling Electric Lightning Arcs',
    cssSelector: '[data-piece="N"].piece-cry',
    animationName: 'anim-knight-cry-war-cry',
    effectFilter: 'drop-shadow(0 0 16px #00d2ff) drop-shadow(0 0 24px #3b82f6) brightness(1.4)',
    pointsValue: 100,
    description: 'Knight horse head rears backward (rotate -25deg), scales up with aggressive hoof stamping and crackling electric blue voltage (+100 PTS).',
    colorAccent: '#00d2ff',
    soundType: 'cry_knight',
  },
  {
    id: 'cry_B',
    piece: 'B',
    pieceName: 'Bishop',
    name: 'Bishop Chant Echo',
    animationTitle: 'Bishop Sacred Harmonic Chant Echo',
    effectModifierTitle: 'Golden-Violet Cross Halo Field',
    cssSelector: '[data-piece="B"].piece-cry',
    animationName: 'anim-bishop-cry-chant-echo',
    effectFilter: 'drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 15px #8b5cf6) brightness(1.4)',
    pointsValue: 100,
    description: 'Bishop tilts side-to-side in rhythmic pendulum motion while expanding a radiant golden-violet cross-shaped halo aura (+100 PTS).',
    colorAccent: '#8b5cf6',
    soundType: 'cry_bishop',
  },
  {
    id: 'cry_R',
    piece: 'R',
    pieceName: 'Rook',
    name: 'Rook Siege Siren',
    animationTitle: 'Rook Citadel Fortress Siege Siren',
    effectModifierTitle: 'Volcanic Fissure Shockwave',
    cssSelector: '[data-piece="R"].piece-cry',
    animationName: 'anim-rook-cry-siege-siren',
    effectFilter: 'drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 14px #f97316) brightness(1.5)',
    pointsValue: 100,
    description: 'Rook castle battlements expand and contract horizontally (scaleX 1.15) simulating a deep horn blast over boiling magma pressure (+100 PTS).',
    colorAccent: '#ef4444',
    soundType: 'cry_rook',
  },
  {
    id: 'cry_Q',
    piece: 'Q',
    pieceName: 'Queen',
    name: 'Queen Sovereign Command',
    animationTitle: 'Queen Royal Supernova Sovereign Command',
    effectModifierTitle: 'Triple-Tier Shockwave Corona Flare',
    cssSelector: '[data-piece="Q"].piece-cry',
    animationName: 'anim-queen-cry-sovereign-command',
    effectFilter: 'drop-shadow(0 0 28px #ffd700) drop-shadow(0 0 18px #ffffff) brightness(1.8)',
    pointsValue: 100,
    description: 'Queen floats vertically upward (translateY -12px), discharging triple-tier shockwave ripple rings and blinding golden-white corona (+100 PTS).',
    colorAccent: '#ffd700',
    soundType: 'cry_queen',
  },
  {
    id: 'cry_K',
    piece: 'K',
    pieceName: 'King',
    name: 'King Imperial Decree',
    animationTitle: 'King Imperial Sovereign Coronation Decree',
    effectModifierTitle: 'Platinum-Gold Royal Shield Dominance',
    cssSelector: '[data-piece="K"].piece-cry',
    animationName: 'anim-king-cry-imperial-decree',
    effectFilter: 'drop-shadow(0 0 32px #ffd700) drop-shadow(0 0 20px #e2e8f0) brightness(1.7)',
    pointsValue: 100,
    description: 'King bows slightly before thrusting crown upward (translateY -8px, scale 1.15) unleashing a magnificent platinum-gold royal shield (+100 PTS).',
    colorAccent: '#fbbf24',
    soundType: 'cry_king',
  },
];

/**
 * Trigger an exclusive 100 PTS Cry State for a piece
 */
export function triggerPieceCryState(
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | string,
  square?: string
): { success: boolean; spec: CryStateSpec; pointsAwarded: number } {
  const code = (pieceCode || 'P').toUpperCase() as PieceElementCode;
  const spec = CRY_STATES_MATRIX.find((s) => s.piece === code) || CRY_STATES_MATRIX[0];

  // Play piece-specific synthesized cry audio
  playCinematicSound(spec.soundType);

  // Dispatch global custom event for board animations & UI alerts
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_piece_cry_triggered', {
        detail: {
          pieceCode: code,
          pieceName: spec.pieceName,
          name: spec.name,
          square: square || 'e4',
          pointsAwarded: spec.pointsValue,
          cssSelector: spec.cssSelector,
          colorAccent: spec.colorAccent,
        },
      })
    );
  }

  return {
    success: true,
    spec,
    pointsAwarded: spec.pointsValue,
  };
}

/**
 * Resolves the CSS classes and attributes to trigger any variation dynamically
 */
export function getVariationCSS(
  piece: string,
  action: 'capturing' | 'occupying',
  styleIndex: 1 | 2 | 3 | 4
): { dataPiece: string; className: string } {
  const pCode = piece.toUpperCase() as PieceElementCode;
  return {
    dataPiece: pCode,
    className: `piece-${action} style-${styleIndex}`,
  };
}


