import {
  users,
  skills,
  conversations,
  messages,
  skillExchanges,
  userRatings,
  type User,
  type UpsertUser,
  type InsertSkill,
  type Skill,
  type InsertConversation,
  type Conversation,
  type InsertMessage,
  type Message,
  type InsertSkillExchange,
  type SkillExchange,
  type InsertUserRating,
  type UserRating,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<(User & { avgRating: number; totalExchanges: number; skillsCount: number }) | undefined>;
  
  // Skill operations
  createSkill(skill: InsertSkill): Promise<Skill>;
  getSkillsByUserId(userId: string): Promise<Skill[]>;
  getAllSkills(category?: string, search?: string): Promise<(Skill & { user: User })[]>;
  updateSkill(id: string, updates: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: string): Promise<void>;
  
  // Conversation operations
  getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<(Conversation & { participant1: User; participant2: User; lastMessage?: Message })[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<(Message & { sender: User })[]>;
  
  // Exchange operations
  createSkillExchange(exchange: InsertSkillExchange): Promise<SkillExchange>;
  getExchangesByUserId(userId: string): Promise<(SkillExchange & { requester: User; provider: User; requesterSkill?: Skill; providerSkill?: Skill })[]>;
  updateExchangeStatus(id: string, status: string, completedAt?: Date): Promise<SkillExchange | undefined>;
  
  // Rating operations
  createUserRating(rating: InsertUserRating): Promise<UserRating>;
  getRatingsByUserId(userId: string): Promise<(UserRating & { rater: User; exchange?: SkillExchange })[]>;
  getUserAverageRating(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          bio: userData.bio,
          title: userData.title,
          isVerified: userData.isVerified,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithStats(id: string): Promise<(User & { avgRating: number; totalExchanges: number; skillsCount: number }) | undefined> {
    const [result] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        title: users.title,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        avgRating: sql<number>`COALESCE(AVG(${userRatings.rating}), 0)`,
        totalExchanges: sql<number>`COUNT(DISTINCT CASE WHEN ${skillExchanges.status} = 'completed' THEN ${skillExchanges.id} END)`,
        skillsCount: sql<number>`COUNT(DISTINCT ${skills.id})`,
      })
      .from(users)
      .leftJoin(userRatings, eq(userRatings.ratedUserId, users.id))
      .leftJoin(skillExchanges, or(eq(skillExchanges.requesterId, users.id), eq(skillExchanges.providerId, users.id)))
      .leftJoin(skills, eq(skills.userId, users.id))
      .where(eq(users.id, id))
      .groupBy(users.id);

    return result;
  }

  // Skill operations
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async getSkillsByUserId(userId: string): Promise<Skill[]> {
    return await db.select().from(skills).where(and(eq(skills.userId, userId), eq(skills.isActive, true)));
  }

  async getAllSkills(category?: string, search?: string): Promise<(Skill & { user: User })[]> {
    let query = db
      .select({
        id: skills.id,
        userId: skills.userId,
        title: skills.title,
        description: skills.description,
        category: skills.category,
        tags: skills.tags,
        level: skills.level,
        seeking: skills.seeking,
        isActive: skills.isActive,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        user: users,
      })
      .from(skills)
      .innerJoin(users, eq(skills.userId, users.id))
      .where(eq(skills.isActive, true));

    if (category) {
      query = query.where(eq(skills.category, category));
    }

    if (search) {
      query = query.where(
        or(
          ilike(skills.title, `%${search}%`),
          ilike(skills.description, `%${search}%`)
        )
      );
    }

    return await query.orderBy(desc(skills.createdAt));
  }

  async updateSkill(id: string, updates: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [updatedSkill] = await db
      .update(skills)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning();
    return updatedSkill;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.update(skills).set({ isActive: false }).where(eq(skills.id, id));
  }

  // Conversation operations
  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    // Check if conversation already exists
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
          and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
        )
      );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        participant1Id,
        participant2Id,
      })
      .returning();

    return newConversation;
  }

  async getConversationsByUserId(userId: string): Promise<(Conversation & { participant1: User; participant2: User; lastMessage?: Message })[]> {
    const result = await db
      .select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        participant1: users,
        participant2: sql<User>`p2`,
        lastMessage: sql<Message>`lm`,
      })
      .from(conversations)
      .innerJoin(users, eq(conversations.participant1Id, users.id))
      .innerJoin(sql`users p2`, sql`${conversations.participant2Id} = p2.id`)
      .leftJoin(
        sql`LATERAL (
          SELECT * FROM messages 
          WHERE conversation_id = ${conversations.id} 
          ORDER BY created_at DESC 
          LIMIT 1
        ) lm`,
        sql`true`
      )
      .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)))
      .orderBy(desc(conversations.lastMessageAt));

    return result as any;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async getMessagesByConversationId(conversationId: string): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        metadata: messages.metadata,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  // Exchange operations
  async createSkillExchange(exchange: InsertSkillExchange): Promise<SkillExchange> {
    const [newExchange] = await db.insert(skillExchanges).values(exchange).returning();
    return newExchange;
  }

  async getExchangesByUserId(userId: string): Promise<(SkillExchange & { requester: User; provider: User; requesterSkill?: Skill; providerSkill?: Skill })[]> {
    return await db
      .select({
        id: skillExchanges.id,
        requesterId: skillExchanges.requesterId,
        providerId: skillExchanges.providerId,
        requesterSkillId: skillExchanges.requesterSkillId,
        providerSkillId: skillExchanges.providerSkillId,
        status: skillExchanges.status,
        scheduledAt: skillExchanges.scheduledAt,
        completedAt: skillExchanges.completedAt,
        notes: skillExchanges.notes,
        createdAt: skillExchanges.createdAt,
        updatedAt: skillExchanges.updatedAt,
        requester: sql<User>`requester`,
        provider: sql<User>`provider`,
        requesterSkill: sql<Skill>`rs`,
        providerSkill: sql<Skill>`ps`,
      })
      .from(skillExchanges)
      .innerJoin(sql`users requester`, sql`${skillExchanges.requesterId} = requester.id`)
      .innerJoin(sql`users provider`, sql`${skillExchanges.providerId} = provider.id`)
      .leftJoin(sql`skills rs`, sql`${skillExchanges.requesterSkillId} = rs.id`)
      .leftJoin(sql`skills ps`, sql`${skillExchanges.providerSkillId} = ps.id`)
      .where(or(eq(skillExchanges.requesterId, userId), eq(skillExchanges.providerId, userId)))
      .orderBy(desc(skillExchanges.createdAt)) as any;
  }

  async updateExchangeStatus(id: string, status: string, completedAt?: Date): Promise<SkillExchange | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (completedAt) {
      updates.completedAt = completedAt;
    }

    const [updatedExchange] = await db
      .update(skillExchanges)
      .set(updates)
      .where(eq(skillExchanges.id, id))
      .returning();
    return updatedExchange;
  }

  // Rating operations
  async createUserRating(rating: InsertUserRating): Promise<UserRating> {
    const [newRating] = await db.insert(userRatings).values(rating).returning();
    return newRating;
  }

  async getRatingsByUserId(userId: string): Promise<(UserRating & { rater: User; exchange?: SkillExchange })[]> {
    return await db
      .select({
        id: userRatings.id,
        raterId: userRatings.raterId,
        ratedUserId: userRatings.ratedUserId,
        exchangeId: userRatings.exchangeId,
        rating: userRatings.rating,
        review: userRatings.review,
        createdAt: userRatings.createdAt,
        rater: users,
        exchange: skillExchanges,
      })
      .from(userRatings)
      .innerJoin(users, eq(userRatings.raterId, users.id))
      .leftJoin(skillExchanges, eq(userRatings.exchangeId, skillExchanges.id))
      .where(eq(userRatings.ratedUserId, userId))
      .orderBy(desc(userRatings.createdAt));
  }

  async getUserAverageRating(userId: string): Promise<number> {
    const [result] = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(${userRatings.rating}), 0)`,
      })
      .from(userRatings)
      .where(eq(userRatings.ratedUserId, userId));

    return result?.avgRating || 0;
  }
}

export const storage = new DatabaseStorage();
