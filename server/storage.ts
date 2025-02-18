import { conversations, type Conversation, type InsertConversation } from "@shared/schema";

export interface IStorage {
  addConversation(conv: InsertConversation): Promise<Conversation>;
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
}

export class MemStorage implements IStorage {
  private conversations: Map<number, Conversation>;
  private currentId: number;

  constructor() {
    this.conversations = new Map();
    this.currentId = 1;
  }

  async addConversation(conv: InsertConversation): Promise<Conversation> {
    const id = this.currentId++;
    const conversation: Conversation = {
      id,
      userInput: conv.userInput,
      aiResponse: conv.aiResponse,
      metadata: conv.metadata ?? {
        type: "text"
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