import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Account ID or Firebase UID
  email: text('email').notNull(),
  username: text('username'),
  passwordHash: text('password_hash'),
  eloRating: integer('elo_rating').default(1200),
  gamesPlayed: integer('games_played').default(0),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  draws: integer('draws').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'matches' table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  gameType: text('game_type').notNull().default('chess'),
  opponent: text('opponent'),
  winner: text('winner'),
  reason: text('reason'),
  movesCount: integer('moves_count').default(0),
  pgn: text('pgn'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'achievements' table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  badgeId: text('badge_id').notNull(),
  badgeTitle: text('badge_title').notNull(),
  xp: integer('xp').default(0),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  matches: many(matches),
  achievements: many(achievements),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));
