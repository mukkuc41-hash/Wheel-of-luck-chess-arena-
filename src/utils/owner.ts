/**
 * Site Owner Identity & Recognition Utility
 * User "ADITYA-OWNER" is recognized as the verified Site Owner & Platform Creator across the entire platform.
 */

export const OWNER_USERNAME = 'ADITYA-OWNER';
export const OWNER_TITLE = 'Site Owner & Creator';
export const OWNER_BADGE_LABEL = 'OWNER';

/**
 * Checks whether a given username or handle corresponds to the Site Owner (ADITYA-OWNER).
 * Case-insensitive comparison with whitespace and delimiter normalization.
 */
export function isSiteOwner(username?: string | null): boolean {
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

/**
 * Normalizes or returns the formal display format for the Site Owner.
 */
export function formatOwnerDisplayName(username?: string | null): string {
  if (isSiteOwner(username)) {
    return 'ADITYA-OWNER';
  }
  return username || 'Player';
}
