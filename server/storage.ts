import { conversations, type Conversation, type InsertConversation, users, type User, type InsertUser, subscriptions, type Subscription, type InsertSubscription } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  addConversation(conv: InsertConversation): Promise<Conversation>;
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;

  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;

  // Session store
  sessionStore: session.Store;

  // Subscription management
  addSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByUser(userId: number): Promise<Subscription[]>;
  updateSubscriptionStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        password: insertUser.password,
        createdAt: insertUser.createdAt
      })
      .returning();
    return user;
  }

  async addConversation(conv: InsertConversation): Promise<Conversation> {
    if (!conv.userId) {
      throw new Error("userId is required for conversations");
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: conv.userId,
        userInput: conv.userInput,
        aiResponse: conv.aiResponse,
        metadata: conv.metadata,
        timestamp: conv.timestamp
      })
      .returning();
    return conversation;
  }

  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async addSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getSubscriptionsByUser(userId: number): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id));
  }
}

export const storage = new DatabaseStorage();