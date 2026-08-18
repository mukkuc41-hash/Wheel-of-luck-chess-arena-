import { db } from './index.ts';
import { users, matches, achievements } from './schema.ts';
import { eq, or, sql } from 'drizzle-orm';

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  username: string | null;
  passwordHash: string | null;
  eloRating: number | null;
  gamesPlayed: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function saveRegisteredUserToDb(data: {
  uid: string;
  email: string;
  username: string;
  passwordHash: string;
  eloRating?: number;
}): Promise<DbUserRecord | null> {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash: data.passwordHash,
        eloRating: data.eloRating ?? 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email.toLowerCase(),
          username: data.username,
          passwordHash: data.passwordHash,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database error in saveRegisteredUserToDb:', error);
    return null;
  }
}

export async function findUserByEmailOrUsername(searchKey: string): Promise<DbUserRecord | null> {
  try {
    const cleanKey = searchKey.trim().toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          sql`LOWER(${users.email}) = ${cleanKey}`,
          sql`LOWER(${users.username}) = ${cleanKey}`
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Database error in findUserByEmailOrUsername:', error);
    return null;
  }
}

export async function getAllRegisteredUsersFromDb(): Promise<DbUserRecord[]> {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database error in getAllRegisteredUsersFromDb:', error);
    return [];
  }
}

export async function updateUserStatsInDb(
  uid: string,
  stats: {
    eloRating?: number;
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    draws?: number;
  }
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid));
    return true;
  } catch (error) {
    console.error('Database error in updateUserStatsInDb:', error);
    return false;
  }
}

export async function getOrCreateUser(uid: string, email: string, username?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        username: username || 'Player',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(username ? { username } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database error in getOrCreateUser:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Database error in getUserByUid:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserMatches(userId: number) {
  try {
    return await db.select().from(matches).where(eq(matches.userId, userId));
  } catch (error) {
    console.error("Database error in getUserMatches:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
