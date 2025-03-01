import { pgTable, text, serial, jsonb, integer, date, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

export const courses = pgTable("courses", {
  id: uuid("uid").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: boolean("status").notNull().default(true),
});

export const coursePrompts = pgTable("course_prompts", {
  id: uuid("uid").defaultRandom().primaryKey(),
  courseId: uuid("course_id").references(() => courses.id),
  prompt: text("prompt").notNull(),
  sequence: integer("sequence").notNull(),
});

export const context = pgTable("context", {
  id: uuid("uid").defaultRandom().primaryKey(),
  coursePromptId: uuid("course_prompt_id").references(() => coursePrompts.id),
  studentId: serial("student_id").references(() => users.id),
  ack: boolean("ack").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutors = pgTable("tutors", {
  id: uuid("uid").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  style: text("style").notNull(),
  status: boolean("status").notNull().default(true),
  profilePicUrl: text("profilepic_url"),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  prompts: many(coursePrompts),
}));

export const coursePromptsRelations = relations(coursePrompts, ({ one, many }) => ({
  course: one(courses, {
    fields: [coursePrompts.courseId],
    references: [courses.id],
  }),
  contexts: many(context),
}));

export const contextRelations = relations(context, ({ one }) => ({
  coursePrompt: one(coursePrompts, {
    fields: [context.coursePromptId],
    references: [coursePrompts.id],
  }),
  student: one(users, {
    fields: [context.studentId],
    references: [users.id],
  }),
}));

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertCoursePromptSchema = createInsertSchema(coursePrompts).omit({
  id: true,
});

export const insertContextSchema = createInsertSchema(context).omit({
  id: true,
});

export const insertTutorSchema = createInsertSchema(tutors).omit({
  id: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCoursePrompt = z.infer<typeof insertCoursePromptSchema>;
export type CoursePrompt = typeof coursePrompts.$inferSelect;
export type InsertContext = z.infer<typeof insertContextSchema>;
export type Context = typeof context.$inferSelect;
export type InsertTutor = z.infer<typeof insertTutorSchema>;
export type Tutor = typeof tutors.$inferSelect;

// Keep existing subscription and learning activity schemas
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

export const learningActivities = pgTable("learning_activities", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(),
  activityDate: date("activity_date").notNull(),
  progress: integer("progress").notNull(),
  details: jsonb("details").$type<{
    topic: string;
    timeSpent: number;
    completed: boolean;
  }>(),
  createdAt: text("created_at").notNull(),
});

export const insertLearningActivitySchema = createInsertSchema(learningActivities).omit({
  id: true,
});

export type InsertLearningActivity = z.infer<typeof insertLearningActivitySchema>;
export type LearningActivity = typeof learningActivities.$inferSelect;