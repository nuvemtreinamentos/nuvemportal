import { pgTable, text, serial, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  planId: text("plan_id").notNull(),
  status: text("status").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  amount: integer("amount").notNull(),
  paymentId: text("payment_id"),
  createdAt: text("created_at").notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;