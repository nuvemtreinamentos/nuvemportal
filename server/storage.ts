import { 
  conversations, type Conversation, type InsertConversation,
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  coursePrompts, type CoursePrompt, type InsertCoursePrompt,
  context, type Context, type InsertContext,
  tutors, type Tutor, type InsertTutor,
  subscriptions, type Subscription, type InsertSubscription,
  learningActivities, type LearningActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Existing methods
  addConversation(conv: InsertConversation): Promise<Conversation>;
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  sessionStore: session.Store;

  // New methods for courses
  createCourse(course: InsertCourse): Promise<Course>;
  getCourses(activeOnly?: boolean): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;

  // Course prompts
  createCoursePrompt(prompt: InsertCoursePrompt): Promise<CoursePrompt>;
  getCoursePrompts(courseId: string): Promise<CoursePrompt[]>;
  getCoursePromptBySequence(courseId: string, sequence: number): Promise<CoursePrompt | undefined>;

  // Context
  createContext(ctx: InsertContext): Promise<Context>;
  updateContextAck(id: string, ack: boolean): Promise<void>;
  getContext(id: string): Promise<Context | undefined>;
  getLatestContext(coursePromptId: string): Promise<Context | undefined>;

  // Tutors
  createTutor(tutor: InsertTutor): Promise<Tutor>;
  getTutors(activeOnly?: boolean): Promise<Tutor[]>;
  getTutor(id: string): Promise<Tutor | undefined>;

  // Subscription management
  addSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByUser(userId: number): Promise<Subscription[]>;
  updateSubscriptionStatus(id: number, status: string): Promise<void>;

  // Learning activities
  getLearningActivities(userId: number): Promise<LearningActivity[]>;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Existing methods implementation
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
      .values(insertUser)
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

  // New methods implementation
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getCourses(activeOnly: boolean = true): Promise<Course[]> {
    const query = db.select().from(courses);
    if (activeOnly) {
      query.where(eq(courses.status, true));
    }
    return await query;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCoursePrompt(prompt: InsertCoursePrompt): Promise<CoursePrompt> {
    const [newPrompt] = await db.insert(coursePrompts).values(prompt).returning();
    return newPrompt;
  }

  async getCoursePrompts(courseId: string): Promise<CoursePrompt[]> {
    return await db
      .select()
      .from(coursePrompts)
      .where(eq(coursePrompts.courseId, courseId))
      .orderBy(coursePrompts.sequence);
  }

  async getCoursePromptBySequence(courseId: string, sequence: number): Promise<CoursePrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(coursePrompts)
      .where(
        and(
          eq(coursePrompts.courseId, courseId),
          eq(coursePrompts.sequence, sequence)
        )
      );
    return prompt;
  }

  async createContext(ctx: InsertContext): Promise<Context> {
    const [newContext] = await db.insert(context).values(ctx).returning();
    return newContext;
  }

  async updateContextAck(id: string, ack: boolean): Promise<void> {
    await db
      .update(context)
      .set({ ack })
      .where(eq(context.id, id));
  }

  async getContext(id: string): Promise<Context | undefined> {
    const [ctx] = await db.select().from(context).where(eq(context.id, id));
    return ctx;
  }

  async getLatestContext(coursePromptId: string): Promise<Context | undefined> {
    const [ctx] = await db
      .select()
      .from(context)
      .where(eq(context.coursePromptId, coursePromptId))
      .orderBy(context.createdAt, "desc")
      .limit(1);
    return ctx;
  }

  async createTutor(tutor: InsertTutor): Promise<Tutor> {
    const [newTutor] = await db.insert(tutors).values(tutor).returning();
    return newTutor;
  }

  async getTutors(activeOnly: boolean = true): Promise<Tutor[]> {
    const query = db.select().from(tutors);
    if (activeOnly) {
      query.where(eq(tutors.status, true));
    }
    return await query;
  }

  async getTutor(id: string): Promise<Tutor | undefined> {
    const [tutor] = await db.select().from(tutors).where(eq(tutors.id, id));
    return tutor;
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

  async getLearningActivities(userId: number): Promise<LearningActivity[]> {
    return await db
      .select()
      .from(learningActivities)
      .where(eq(learningActivities.userId, userId));
  }
}

export const storage = new DatabaseStorage();