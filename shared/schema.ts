import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userInput: text("user_input").notNull(),
  aiResponse: text("ai_response").notNull(),
  metadata: jsonb("metadata").$type<{
    type: "code" | "image" | "text";
    codeSnippet?: string;
    language?: string;
    imageUrl?: string;
  }>(),
  timestamp: text("timestamp").notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
