import { getUserPoints, spendPoints } from './pointsManager';
import { playCinematicSound } from './cinematicVfx';

export type MasterPieceType = 'Pawn' | 'Knight' | 'Bishop' | 'Rook' | 'Queen' | 'King';
export type MasterCategoryType =
  | 'Capture Animation'
  | 'Occupying Animation'
  | 'Capture Effect'
  | 'Occupying Effect'
  | 'Cry State';

export interface CatalogItem {
  id: string;
  piece: MasterPieceType;
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
  category: MasterCategoryType;
  variantIndex: number;
  name: string;
  desc: string;
  glowColor: string;
  secondaryColor: string;
  badgeType: 'red' | 'blue' | 'gold' | 'purple' | 'green' | 'cyan';
  animClass: string;
  price: number;
  isCryState?: boolean;
}

export const PIECES: { name: MasterPieceType; code: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'; symbol: string }[] = [
  { name: 'Pawn', code: 'P', symbol: '♟' },
  { name: 'Knight', code: 'N', symbol: '♞' },
  { name: 'Bishop', code: 'B', symbol: '♝' },
  { name: 'Rook', code: 'R', symbol: '♜' },
  { name: 'Queen', code: 'Q', symbol: '♛' },
  { name: 'King', code: 'K', symbol: '♚' },
];

export const CATEGORIES: { cat: MasterCategoryType; prefix: string; type: 'anim' | 'fx' | 'cry' }[] = [
  { cat: 'Capture Animation', prefix: 'cap-anim', type: 'anim' },
  { cat: 'Occupying Animation', prefix: 'occ-anim', type: 'anim' },
  { cat: 'Capture Effect', prefix: 'cap-fx', type: 'fx' },
  { cat: 'Occupying Effect', prefix: 'occ-fx', type: 'fx' },
  { cat: 'Cry State', prefix: 'cry-state', type: 'cry' },
];

const DETAILED_PIECE_DATA: Record<
  MasterPieceType,
  {
    capNames: [string, string, string, string];
    occNames: [string, string, string, string];
    fxCapNames: [string, string, string, string];
    fxOccNames: [string, string, string, string];
    cryName: string;
    cryDesc: string;
    cryColor: string;
  }
> = {
  Pawn: {
    capNames: ['Pawn Dissolve Collapse', 'Pawn Spiral Sink', 'Pawn Dust Shatter', 'Pawn Fade Vacuum'],
    occNames: ['Pawn Rise Materialization', 'Pawn Pop Bounce', 'Pawn Slide Glide', 'Pawn Spin Lock'],
    fxCapNames: ['Pawn Amber Spark', 'Pawn Emerald Haze', 'Pawn Ruby Glint', 'Pawn Cobalt Edge'],
    fxOccNames: ['Pawn Silver Beacon', 'Pawn Solar Sparkle', 'Pawn Radiant Flare', 'Pawn Prism Ring'],
    cryName: 'Pawn Despair Wail',
    cryDesc: 'Pawn dips downward with high-frequency micro-jitter and weeping amber soundwave rings (+5,000 PTS).',
    cryColor: '#d35400',
  },
  Knight: {
    capNames: ['Knight L-Vault Vanish', 'Knight Spin Vortex', 'Knight Impact Crater', 'Knight Portal Snap'],
    occNames: ['Knight Vault Entry', 'Knight Orbital Sweep', 'Knight Kinetic Charge', 'Knight Stride Lock'],
    fxCapNames: ['Knight Electric Arc', 'Knight Bronze Shield', 'Knight Neon Cyan Pulse', 'Knight Crimson Surge'],
    fxOccNames: ['Knight Storm Aura', 'Knight Gallop Surge', 'Knight Blue Plasma', 'Knight Golden Hoof'],
    cryName: 'Knight War Cry',
    cryDesc: 'Knight stallion rears backward with aggressive hoof stamping and crackling electric blue voltage (+5,000 PTS).',
    cryColor: '#00d2ff',
  },
  Bishop: {
    capNames: ['Bishop Diagonal Slicing', 'Bishop Prism Refraction', 'Bishop Diagonal Sweep', 'Bishop Mystic Implosion'],
    occNames: ['Bishop Diagonal Glide', 'Bishop Divine Beam Drop', 'Bishop Tilt Materialize', 'Bishop Aura Expand'],
    fxCapNames: ['Bishop Holy Gold Aura', 'Bishop Mystic Purple Mist', 'Bishop Celestial White Flare', 'Bishop Emerald Ray'],
    fxOccNames: ['Bishop Sanctuary Glow', 'Bishop Celestial Beam', 'Bishop Astral Veil', 'Bishop Golden Cross'],
    cryName: 'Bishop Chant Echo',
    cryDesc: 'Bishop tilts in sacred pendulum cadence while expanding radiant golden-violet cross fields (+5,000 PTS).',
    cryColor: '#8b5cf6',
  },
  Rook: {
    capNames: ['Rook Fortress Demolition', 'Rook Laser Grid Erasure', 'Rook Heavy Impact Smash', 'Rook Structural Collapse'],
    occNames: ['Rook Orthogonal Slide', 'Rook Fortress Rise', 'Rook Solid Anchor Drop', 'Rook Modular Assembly'],
    fxCapNames: ['Rook Steel Armor', 'Rook Magma Core', 'Rook Titanium Chrome', 'Rook Obsidian Dark'],
    fxOccNames: ['Rook Citadel Bastion', 'Rook Seismic Tremor', 'Rook Molten Foundry', 'Rook Aegis Ward'],
    cryName: 'Rook Siege Siren',
    cryDesc: 'Rook battlements expand with deep resonant sub-bass horn blasts over boiling magma shockwaves (+5,000 PTS).',
    cryColor: '#ef4444',
  },
  Queen: {
    capNames: ['Queen Imperial Disintegration', 'Queen Royal Vortex', 'Queen Singularity Warp', 'Queen Royal Shockwave'],
    occNames: ['Queen Majestic Descent', 'Queen Sovereign Expansion', 'Queen Omnidirectional Glide', 'Queen Crown Emergence'],
    fxCapNames: ['Queen Sovereign Gold', 'Queen Imperial Amethyst', 'Queen Diamond Prism', 'Queen Solar Flare'],
    fxOccNames: ['Queen Supernova Ray', 'Queen Celestial Tiara', 'Queen Prismatic Radiance', 'Queen Royal Corona'],
    cryName: 'Queen Sovereign Command',
    cryDesc: 'Queen levitates vertically discharging triple-tier shockwave ripple rings and brilliant solar corona (+5,000 PTS).',
    cryColor: '#ffd700',
  },
  King: {
    capNames: ['King Throne Collapse', 'King Imperial Shatter', 'King Golden Fadeout', 'King Realm Seal'],
    occNames: ['King Royal Portal Arrival', 'King Throne Summon', 'King Sovereign Step', 'King Divine Coronation'],
    fxCapNames: ['King Imperial Gold Crown', 'King Platinum Sovereign', 'King Mystic Ruby Sovereign', 'King Eternal Realm'],
    fxOccNames: ['King Monarch Scepter', 'King Sovereign Aegis', 'King Golden Standard', 'King Imperial Diadem'],
    cryName: 'King Imperial Decree',
    cryDesc: 'King thrusts royal crown upward unleashing magnificent platinum-gold sovereign shield dominance (+5,000 PTS).',
    cryColor: '#fbbf24',
  },
};

const COLOR_MAPPING: Record<string, { primary: string; secondary: string; badge: 'red' | 'blue' | 'gold' | 'purple' | 'green' | 'cyan' }> = {
  'Pawn-1': { primary: '#ef4444', secondary: '#f97316', badge: 'red' },
  'Pawn-2': { primary: '#06b6d4', secondary: '#3b82f6', badge: 'cyan' },
  'Pawn-3': { primary: '#eab308', secondary: '#f59e0b', badge: 'gold' },
  'Pawn-4': { primary: '#10b981', secondary: '#059669', badge: 'green' },

  'Knight-1': { primary: '#f59e0b', secondary: '#d97706', badge: 'gold' },
  'Knight-2': { primary: '#00d2ff', secondary: '#3b82f6', badge: 'blue' },
  'Knight-3': { primary: '#a855f7', secondary: '#9333ea', badge: 'purple' },
  'Knight-4': { primary: '#ec4899', secondary: '#f43f5e', badge: 'red' },

  'Bishop-1': { primary: '#a855f7', secondary: '#6366f1', badge: 'purple' },
  'Bishop-2': { primary: '#06b6d4', secondary: '#0284c7', badge: 'cyan' },
  'Bishop-3': { primary: '#f1c40f', secondary: '#e67e22', badge: 'gold' },
  'Bishop-4': { primary: '#10b981', secondary: '#14b8a6', badge: 'green' },

  'Rook-1': { primary: '#3b82f6', secondary: '#1d4ed8', badge: 'blue' },
  'Rook-2': { primary: '#ef4444', secondary: '#dc2626', badge: 'red' },
  'Rook-3': { primary: '#f97316', secondary: '#ea580c', badge: 'gold' },
  'Rook-4': { primary: '#c084fc', secondary: '#9333ea', badge: 'purple' },

  'Queen-1': { primary: '#f43f5e', secondary: '#e11d48', badge: 'red' },
  'Queen-2': { primary: '#38bdf8', secondary: '#0284c7', badge: 'cyan' },
  'Queen-3': { primary: '#facc15', secondary: '#eab308', badge: 'gold' },
  'Queen-4': { primary: '#d946ef', secondary: '#a21caf', badge: 'purple' },

  'King-1': { primary: '#38bdf8', secondary: '#0369a1', badge: 'cyan' },
  'King-2': { primary: '#00d2ff', secondary: '#2563eb', badge: 'blue' },
  'King-3': { primary: '#fbbf24', secondary: '#d97706', badge: 'gold' },
  'King-4': { primary: '#c084fc', secondary: '#7e22ce', badge: 'purple' },
};

// Master Catalog: 96 Matrix Variations + 6 Exclusive Cry States
export const MASTER_96_CATALOG: CatalogItem[] = (() => {
  const catalog: CatalogItem[] = [];
  let counter = 1;

  PIECES.forEach((p) => {
    const data = DETAILED_PIECE_DATA[p.name];

    // 1. Capture Animations (4)
    for (let i = 1; i <= 4; i++) {
      const theme = COLOR_MAPPING[`${p.name}-${i}`] || { primary: '#38bdf8', secondary: '#6366f1', badge: 'blue' };
      const animClass = ['anim-core-dissolve', 'anim-core-spin-out', 'anim-core-shatter', 'anim-core-portal-out'][i - 1];
      catalog.push({
        id: `item-${counter++}`,
        piece: p.name,
        pieceCode: p.code,
        category: 'Capture Animation',
        variantIndex: i,
        name: data.capNames[i - 1],
        desc: `Level ${i} dynamic capture animation engineered specifically for the ${p.name} element.`,
        glowColor: theme.primary,
        secondaryColor: theme.secondary,
        badgeType: theme.badge,
        animClass: animClass,
        price: 5000,
      });
    }

    // 2. Occupying Animations (4)
    for (let i = 1; i <= 4; i++) {
      const theme = COLOR_MAPPING[`${p.name}-${i}`] || { primary: '#38bdf8', secondary: '#6366f1', badge: 'blue' };
      const animClass = ['anim-core-emerge', 'anim-core-spin-in', 'anim-core-assemble', 'anim-core-portal-in'][i - 1];
      catalog.push({
        id: `item-${counter++}`,
        piece: p.name,
        pieceCode: p.code,
        category: 'Occupying Animation',
        variantIndex: i,
        name: data.occNames[i - 1],
        desc: `Level ${i} arrival sequence with spatial calibration for the ${p.name} square touchdown.`,
        glowColor: theme.primary,
        secondaryColor: theme.secondary,
        badgeType: theme.badge,
        animClass: animClass,
        price: 5000,
      });
    }

    // 3. Capture Effects (4)
    for (let i = 1; i <= 4; i++) {
      const theme = COLOR_MAPPING[`${p.name}-${i}`] || { primary: '#38bdf8', secondary: '#6366f1', badge: 'blue' };
      catalog.push({
        id: `item-${counter++}`,
        piece: p.name,
        pieceCode: p.code,
        category: 'Capture Effect',
        variantIndex: i,
        name: data.fxCapNames[i - 1],
        desc: `Level ${i} visual filter modifier and luminous perimeter resonance for ${p.name} strikes.`,
        glowColor: theme.primary,
        secondaryColor: theme.secondary,
        badgeType: theme.badge,
        animClass: `style-${i}`,
        price: 5000,
      });
    }

    // 4. Occupying Effects (4)
    for (let i = 1; i <= 4; i++) {
      const theme = COLOR_MAPPING[`${p.name}-${i}`] || { primary: '#38bdf8', secondary: '#6366f1', badge: 'blue' };
      catalog.push({
        id: `item-${counter++}`,
        piece: p.name,
        pieceCode: p.code,
        category: 'Occupying Effect',
        variantIndex: i,
        name: data.fxOccNames[i - 1],
        desc: `Level ${i} optical landing halo and kinetic aura displacement for ${p.name}.`,
        glowColor: theme.primary,
        secondaryColor: theme.secondary,
        badgeType: theme.badge,
        animClass: `style-${i}`,
        price: 5000,
      });
    }

    // 5. Exclusive Cry State (Style 9 - 5,000 PTS)
    catalog.push({
      id: `item-cry-${p.code}`,
      piece: p.name,
      pieceCode: p.code,
      category: 'Cry State',
      variantIndex: 9,
      name: data.cryName,
      desc: data.cryDesc,
      glowColor: data.cryColor,
      secondaryColor: '#ffffff',
      badgeType: 'gold',
      animClass: 'piece-cry',
      price: 5000,
      isCryState: true,
    });
  });

  return catalog;
})();

const STORAGE_INVENTORY_KEY = 'chess_master_hub_inventory';
const STORAGE_EQUIPPED_KEY = 'chess_master_hub_equipped';

export function getMasterInventory(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getEquippedMasterEffects(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_EQUIPPED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Convert chess piece type (p, n, b, r, q, k or P, N, B, R, Q, K) to MasterPieceType
export function normalizePieceName(pieceTypeOrCode: string): MasterPieceType {
  const code = pieceTypeOrCode.toLowerCase();
  switch (code) {
    case 'p': return 'Pawn';
    case 'n': return 'Knight';
    case 'b': return 'Bishop';
    case 'r': return 'Rook';
    case 'q': return 'Queen';
    case 'k': return 'King';
    default: return 'Pawn';
  }
}

/**
 * ONLY return a CatalogItem if:
 * 1. An item is assigned in the equipped slot for this piece
 * 2. AND the item is purchased / owned in user inventory
 * Otherwise returns null (no animation/effect applies).
 */
export function getEquippedItemForPiece(pieceTypeOrCode: string): CatalogItem | null {
  const pieceName = normalizePieceName(pieceTypeOrCode);
  const equipped = getEquippedMasterEffects();
  const itemId = equipped[pieceName];
  if (!itemId) return null;

  const inventory = getMasterInventory();
  if (!inventory[itemId]) {
    // Not purchased/owned - cannot be applied
    return null;
  }

  const found = MASTER_96_CATALOG.find((item) => item.id === itemId);
  return found || null;
}

export function notifyEquippedEffectsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chess_equipped_effects_updated'));
  }
}

export function findCatalogItem(
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | string,
  action: 'capturing' | 'occupying' | 'cry',
  styleIndex?: 1 | 2 | 3 | 4 | number
): CatalogItem | undefined {
  const pName = normalizePieceName(pieceCode);
  if (action === 'cry') {
    return MASTER_96_CATALOG.find((item) => item.piece === pName && item.category === 'Cry State');
  }
  const catName: MasterCategoryType = action === 'capturing' ? 'Capture Animation' : 'Occupying Animation';
  return MASTER_96_CATALOG.find(
    (item) => item.piece === pName && item.category === catName && item.variantIndex === (styleIndex || 1)
  );
}

export function isVariationPurchased(
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | string,
  action: 'capturing' | 'occupying' | 'cry',
  styleIndex?: 1 | 2 | 3 | 4 | number
): boolean {
  const item = findCatalogItem(pieceCode, action, styleIndex);
  if (!item) return false;
  const inv = getMasterInventory();
  return Boolean(inv[item.id]);
}

export function purchaseCatalogItem(itemId: string): { success: boolean; message: string; item?: CatalogItem } {
  const inv = getMasterInventory();
  const item = MASTER_96_CATALOG.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, message: 'Item not found in catalog.' };
  }

  if (inv[itemId]) {
    return { success: true, message: `${item.name} is already owned in your inventory!`, item };
  }

  const price = item.price || 5000;
  const currentPts = getUserPoints();
  if (currentPts < price) {
    return {
      success: false,
      message: `Insufficient points! You need ${price.toLocaleString()} PTS (Current balance: ${currentPts.toLocaleString()} PTS). Complete daily quests or spin the wheel to earn more!`,
      item,
    };
  }

  const spent = spendPoints(price, `Purchased ${item.name}`);
  if (!spent) {
    return { success: false, message: 'Points deduction failed.', item };
  }

  inv[itemId] = true;
  try {
    localStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(inv));
  } catch (err) {
    console.error('Failed to save inventory to storage', err);
  }

  // Automatically equip to that piece
  equipCatalogItem(item.piece, item.id);

  notifyEquippedEffectsUpdated();
  playCinematicSound('brilliant');
  return {
    success: true,
    message: `🎉 Successfully unlocked and equipped ${item.name} for ${price.toLocaleString()} PTS!`,
    item,
  };
}

export function equipCatalogItem(piece: MasterPieceType, itemId: string): boolean {
  const inv = getMasterInventory();
  if (!inv[itemId]) return false;

  const equipped = getEquippedMasterEffects();
  equipped[piece] = itemId;
  try {
    localStorage.setItem(STORAGE_EQUIPPED_KEY, JSON.stringify(equipped));
  } catch (err) {
    console.error('Failed to save equipped item', err);
  }
  notifyEquippedEffectsUpdated();
  return true;
}

export function unequipCatalogItem(piece: MasterPieceType): void {
  const equipped = getEquippedMasterEffects();
  delete equipped[piece];
  try {
    localStorage.setItem(STORAGE_EQUIPPED_KEY, JSON.stringify(equipped));
  } catch (err) {
    console.error('Failed to update equipped item', err);
  }
  notifyEquippedEffectsUpdated();
}

export function getPurchasedItemsCount(): number {
  const inv = getMasterInventory();
  return Object.values(inv).filter(Boolean).length;
}
