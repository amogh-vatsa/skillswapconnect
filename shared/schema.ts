import { sql } from 'drizzle-orm';
import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
  text,
  int,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// Users table - mandatory for Replit Auth
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  bio: text("bio"),
  title: varchar("title", { length: 200 }),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Skills table
export const skills = mysqlTable("skills", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags"),
  level: varchar("level", { length: 50 }).notNull(), // beginner, intermediate, expert
  seeking: json("seeking"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Conversations table
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  participant1Id: varchar("participant1_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: varchar("participant2_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  conversationId: varchar("conversation_id", { length: 36 }).notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default('text'), // text, exchange_proposal, system
  metadata: json("metadata"), // for exchange proposals, file attachments, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Skill exchanges table
export const skillExchanges = mysqlTable("skill_exchanges", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  requesterId: varchar("requester_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: varchar("provider_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  requesterSkillId: varchar("requester_skill_id", { length: 36 }).references(() => skills.id),
  providerSkillId: varchar("provider_skill_id", { length: 36 }).references(() => skills.id),
  status: varchar("status", { length: 50 }).default('pending'), // pending, accepted, completed, cancelled
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// User ratings table
export const userRatings = mysqlTable("user_ratings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  raterId: varchar("rater_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratedUserId: varchar("rated_user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  exchangeId: varchar("exchange_id", { length: 36 }).references(() => skillExchanges.id),
  rating: int("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  skills: many(skills),
  sentMessages: many(messages),
  requestedExchanges: many(skillExchanges, { relationName: 'requesterExchanges' }),
  providedExchanges: many(skillExchanges, { relationName: 'providerExchanges' }),
  givenRatings: many(userRatings, { relationName: 'givenRatings' }),
  receivedRatings: many(userRatings, { relationName: 'receivedRatings' }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  user: one(users, {
    fields: [skills.userId],
    references: [users.id],
  }),
  requesterExchanges: many(skillExchanges, { relationName: 'requesterSkillExchanges' }),
  providerExchanges: many(skillExchanges, { relationName: 'providerSkillExchanges' }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
    relationName: 'participant1Conversations',
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
    relationName: 'participant2Conversations',
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const skillExchangesRelations = relations(skillExchanges, ({ one }) => ({
  requester: one(users, {
    fields: [skillExchanges.requesterId],
    references: [users.id],
    relationName: 'requesterExchanges',
  }),
  provider: one(users, {
    fields: [skillExchanges.providerId],
    references: [users.id],
    relationName: 'providerExchanges',
  }),
  requesterSkill: one(skills, {
    fields: [skillExchanges.requesterSkillId],
    references: [skills.id],
    relationName: 'requesterSkillExchanges',
  }),
  providerSkill: one(skills, {
    fields: [skillExchanges.providerSkillId],
    references: [skills.id],
    relationName: 'providerSkillExchanges',
  }),
}));

export const userRatingsRelations = relations(userRatings, ({ one }) => ({
  rater: one(users, {
    fields: [userRatings.raterId],
    references: [users.id],
    relationName: 'givenRatings',
  }),
  ratedUser: one(users, {
    fields: [userRatings.ratedUserId],
    references: [users.id],
    relationName: 'receivedRatings',
  }),
  exchange: one(skillExchanges, {
    fields: [userRatings.exchangeId],
    references: [skillExchanges.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertSkillExchangeSchema = createInsertSchema(skillExchanges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRatingSchema = createInsertSchema(userRatings).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertSkillExchange = z.infer<typeof insertSkillExchangeSchema>;
export type SkillExchange = typeof skillExchanges.$inferSelect;
export type InsertUserRating = z.infer<typeof insertUserRatingSchema>;
export type UserRating = typeof userRatings.$inferSelect;
