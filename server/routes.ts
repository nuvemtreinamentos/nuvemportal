import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { processUserInput, textToSpeech } from "./openai";
import { insertConversationSchema, context, coursePrompts } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { createPixPayment } from "./stripe";
import { eq, and } from 'drizzle-orm';
import { db } from './db';

export async function registerRoutes(app: Express) {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Course endpoints
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCourses(true); // Get only active courses
      res.json(courses);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/courses/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Course prompt endpoints
  app.get("/api/courses/:courseId/prompts", requireAuth, async (req: Request, res: Response) => {
    try {
      const prompts = await storage.getCoursePrompts(req.params.courseId);
      res.json(prompts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Context endpoints
  app.get("/api/context/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const contexts = await db
        .select()
        .from(context)
        .where(eq(context.studentId, req.user!.id))
        .orderBy(context.createdAt, "desc")
        .limit(1);

      if (contexts.length === 0) {
        return res.status(404).json({ error: "No context found" });
      }

      res.json(contexts[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/context", requireAuth, async (req: Request, res: Response) => {
    try {
      const contextData = await storage.createContext({
        coursePromptId: req.body.coursePromptId,
        studentId: req.user!.id,
        ack: false,
      });
      res.json(contextData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  app.patch("/api/context/:id/ack", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.updateContextAck(req.params.id, true);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Tutor endpoints
  app.get("/api/tutors", requireAuth, async (req: Request, res: Response) => {
    try {
      const tutors = await storage.getTutors(true); // Get only active tutors
      res.json(tutors);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Keep existing routes
  app.post("/api/login/google", async (req: Request, res: Response) => {
    try {
      let user = await storage.getUserByUsername(req.body.email);

      if (!user) {
        // Create a new user if they don't exist
        user = await storage.createUser({
          username: req.body.email,
          password: req.body.uid, // Use Firebase UID as password
          createdAt: new Date().toISOString(),
        });
      }

      req.login(user, (err) => {
        if (err) throw err;
        res.json(user);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/chat", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userInput } = req.body;
      const result = await processUserInput(userInput);

      const conversation = await storage.addConversation({
        userInput,
        aiResponse: result.response,
        metadata: {
          type: result.type,
          codeSnippet: result.codeSnippet,
          language: result.language,
          imageUrl: result.imageUrl
        },
        timestamp: new Date().toISOString(),
        userId: req.user!.id
      });

      res.json(conversation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/speech", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      const audioBuffer = await textToSpeech(text);

      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/learning-activities", requireAuth, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLearningActivities(req.user!.id);
      res.json(activities);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/create-payment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { planId, amount } = req.body;

      const paymentDetails = await createPixPayment(amount, planId, req.user!.id);

      // Store subscription intent
      await storage.addSubscription({
        userId: req.user!.id,
        planId,
        status: "pending",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        amount,
        paymentId: paymentDetails.paymentIntentId,
        createdAt: new Date().toISOString(),
      });

      res.json(paymentDetails);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Updated endpoint to process course prompt with LLM
  app.post("/api/process-prompt", requireAuth, async (req: Request, res: Response) => {
    try {
      const { contextId } = req.body;
      console.log('Processing prompt for context:', contextId);

      // Get the context and join with course_prompts to get the prompt text
      const result = await db
        .select({
          context: context,
          prompt: coursePrompts.prompt
        })
        .from(context)
        .innerJoin(
          coursePrompts,
          eq(context.coursePromptId, coursePrompts.id)
        )
        .where(
          and(
            eq(context.id, contextId),
            eq(context.studentId, req.user!.id)
          )
        );

      if (!result.length) {
        console.error('No context or prompt found for:', { contextId, userId: req.user!.id });
        return res.status(404).json({ error: "Context or prompt not found" });
      }

      const { prompt } = result[0];
      console.log('Found prompt:', prompt);

      // Process the prompt with LLM
      const llmResult = await processUserInput(prompt);
      console.log('LLM processing complete');

      // Convert LLM response to speech
      const audioBuffer = await textToSpeech(llmResult.response);
      console.log('Text-to-speech conversion complete');

      res.json({
        text: llmResult.response,
        audio: Buffer.from(audioBuffer).toString('base64')
      });
    } catch (error) {
      console.error('Error in process-prompt:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}