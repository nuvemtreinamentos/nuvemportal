import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { processUserInput, textToSpeech } from "./openai";
import { insertConversationSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { createPixPayment } from "./stripe";

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

  const httpServer = createServer(app);
  return httpServer;
}