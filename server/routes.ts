import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { processUserInput, textToSpeech } from "./openai";
import { insertConversationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  app.post("/api/chat", async (req: Request, res: Response) => {
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
        timestamp: new Date().toISOString()
      });

      res.json(conversation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/speech", async (req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}