import { conversations, type Conversation, type InsertConversation, users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
}

export class MemStorage implements IStorage {
  private conversations: Map<number, Conversation>;
  private users: Map<number, User>;
  private currentConvId: number;
  private currentUserId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.conversations = new Map();
    this.users = new Map();
    this.currentConvId = 1;
    this.currentUserId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      id,
      username: user.username,
      password: user.password,
      createdAt: user.createdAt
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async addConversation(conv: InsertConversation): Promise<Conversation> {
    if (!conv.userId) {
      throw new Error("userId is required for conversations");
    }

    const id = this.currentConvId++;
    const conversation: Conversation = {
      id,
      userId: conv.userId,
      userInput: conv.userInput,
      aiResponse: conv.aiResponse,
      metadata: {
        type: conv.metadata?.type || "text",
        ...(conv.metadata?.codeSnippet && { codeSnippet: conv.metadata.codeSnippet }),
        ...(conv.metadata?.language && { language: conv.metadata.language }),
        ...(conv.metadata?.imageUrl && { imageUrl: conv.metadata.imageUrl })
      },
      timestamp: conv.timestamp
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
}

export const storage = new MemStorage();