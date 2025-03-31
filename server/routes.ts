import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertUserSchema, updateUserSchema, 
  insertUserLanguageSchema, updateUserLanguageSchema,
  insertCallSchema, LANGUAGE_OPTIONS
} from "@shared/schema";
import { ZodError } from "zod";
import * as ws from "ws";
import axios from "axios";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../uploads");
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Helper function to handle validation errors
const handleError = (error: any, res: Response) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.errors,
    });
  }
  console.error(error);
  return res.status(500).json({
    message: "Internal server error",
  });
};

// Helper function for authentication (simple version)
const authenticate = async (req: Request, res: Response, next: Function) => {
  const userId = req.headers["user-id"];
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket direct API route for message passing
  // We'll use a REST API endpoint instead of WebSockets to avoid conflicts with Vite
  const clients = new Map<number, { lastPoll: number, messages: any[] }>();
  
  // Cleanup stale clients - run every minute
  setInterval(() => {
    const now = Date.now();
    for (const [userId, client] of clients.entries()) {
      // Remove clients that haven't polled in 5 minutes
      if (now - client.lastPoll > 5 * 60 * 1000) {
        clients.delete(userId);
      }
    }
  }, 60 * 1000);
  
  // Get or create a client state
  const getOrCreateClient = (userId: number) => {
    if (!clients.has(userId)) {
      clients.set(userId, { lastPoll: Date.now(), messages: [] });
    }
    return clients.get(userId)!;
  };
  
  // Register for messaging
  app.post("/api/messaging/register", authenticate, (req, res) => {
    const userId = (req as any).user.id;
    getOrCreateClient(userId).lastPoll = Date.now();
    return res.json({ success: true });
  });
  
  // Send a message
  app.post("/api/messaging/send", authenticate, (req, res) => {
    try {
      const senderId = (req as any).user.id;
      const { to, type, payload } = req.body;
      
      if (!to || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const recipientClient = getOrCreateClient(Number(to));
      const message = {
        type,
        from: senderId,
        ...payload
      };
      
      recipientClient.messages.push(message);
      
      // Keep only the last 100 messages
      if (recipientClient.messages.length > 100) {
        recipientClient.messages.shift();
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Message sending error:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Poll for new messages
  app.get("/api/messaging/poll", authenticate, (req, res) => {
    const userId = (req as any).user.id;
    const client = getOrCreateClient(userId);
    
    client.lastPoll = Date.now();
    
    const messages = [...client.messages];
    client.messages = [];
    
    return res.json({ messages });
  });

  // User Routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(userData);
      return res.status(201).json(user);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUserWithLanguages(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.patch("/api/users/:id", authenticate, upload.single("profilePicture"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is modifying their own profile
      if ((req as any).user.id !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Handle file upload
      let userData = req.body;
      if (req.file) {
        userData.profilePicture = `/uploads/${req.file.filename}`;
      }
      
      // Parse and validate
      const validatedData = updateUserSchema.parse(userData);
      
      // Update user
      const updatedUser = await storage.updateUser(id, validatedData);
      return res.json(updatedUser);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  // User Languages Routes
  app.get("/api/users/:userId/languages", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const languages = await storage.getUserLanguages(userId);
      return res.json(languages);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.post("/api/users/:userId/languages", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user is adding to their own profile
      if ((req as any).user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const languageData = {
        ...req.body,
        userId
      };
      
      const validatedData = insertUserLanguageSchema.parse(languageData);
      
      // Check if language already exists for user
      const userLanguages = await storage.getUserLanguages(userId);
      const languageExists = userLanguages.some(
        (lang) => lang.language === validatedData.language
      );
      
      if (languageExists) {
        return res.status(400).json({ message: "Language already added for user" });
      }
      
      const language = await storage.addUserLanguage(validatedData);
      return res.status(201).json(language);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.patch("/api/user-languages/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // First get all user languages
      const allUserLanguages = await storage.getUserLanguages((req as any).user.id);
      const language = allUserLanguages.find(lang => lang.id === id);
      
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Check if user is modifying their own language
      if ((req as any).user.id !== language.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = updateUserLanguageSchema.parse(req.body);
      const updatedLanguage = await storage.updateUserLanguage(id, validatedData);
      
      return res.json(updatedLanguage);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.delete("/api/user-languages/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // First get all user languages
      const allUserLanguages = await storage.getUserLanguages((req as any).user.id);
      const language = allUserLanguages.find(lang => lang.id === id);
      
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Check if user is deleting their own language
      if ((req as any).user.id !== language.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteUserLanguage(id);
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  // Call Routes
  app.get("/api/users/:userId/calls", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user is viewing their own calls
      if ((req as any).user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const calls = await storage.getCalls(userId);
      return res.json(calls);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.post("/api/calls", authenticate, async (req, res) => {
    try {
      const callData = insertCallSchema.parse(req.body);
      
      // Check if initiator is the authenticated user
      if ((req as any).user.id !== callData.initiatorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const call = await storage.createCall(callData);
      return res.status(201).json(call);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  app.patch("/api/calls/:id/end", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { duration } = req.body;
      
      if (typeof duration !== "number" || duration < 0) {
        return res.status(400).json({ message: "Invalid duration" });
      }
      
      const call = await storage.getCallById(id);
      
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }
      
      // Check if user is part of the call
      const userId = (req as any).user.id;
      if (call.initiatorId !== userId && call.receiverId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const endTime = new Date();
      const updatedCall = await storage.updateCall(id, endTime, duration);
      
      return res.json(updatedCall);
    } catch (error) {
      return handleError(error, res);
    }
  });
  
  // Language options route
  app.get("/api/languages", (req, res) => {
    res.json(LANGUAGE_OPTIONS);
  });
  
  // Translation APIs (proxied)
  app.post("/api/translate", authenticate, async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      
      if (!text || !targetLang) {
        return res.status(400).json({ message: "Text and target language are required" });
      }
      
      // Proxy to DeepL API
      const apiKey = process.env.DEEPL_API_KEY || "";
      const response = await axios.post(
        "https://api-free.deepl.com/v2/translate",
        {
          text: [text],
          target_lang: targetLang.toUpperCase()
        },
        {
          headers: {
            "Authorization": `DeepL-Auth-Key ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      return res.json({
        translatedText: response.data.translations[0].text
      });
    } catch (error) {
      console.error("Translation error:", error);
      return res.status(500).json({ message: "Translation service error" });
    }
  });
  
  // Speech-to-text endpoint (AssemblyAI)
  app.post("/api/speech-to-text", authenticate, async (req, res) => {
    try {
      const { audioUrl } = req.body;
      
      if (!audioUrl) {
        return res.status(400).json({ message: "Audio URL is required" });
      }
      
      // Proxy to AssemblyAI API
      const apiKey = process.env.ASSEMBLYAI_API_KEY || "";
      const response = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        {
          audio_url: audioUrl,
          language_code: "en" // Can be made dynamic
        },
        {
          headers: {
            "Authorization": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
      
      // AssemblyAI returns an ID that needs to be polled for results
      return res.json({
        transcriptionId: response.data.id
      });
    } catch (error) {
      console.error("Speech-to-text error:", error);
      return res.status(500).json({ message: "Speech-to-text service error" });
    }
  });
  
  // Get transcription results
  app.get("/api/speech-to-text/:id", authenticate, async (req, res) => {
    try {
      const transcriptionId = req.params.id;
      
      // Proxy to AssemblyAI API to get results
      const apiKey = process.env.ASSEMBLYAI_API_KEY || "";
      const response = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptionId}`,
        {
          headers: {
            "Authorization": apiKey
          }
        }
      );
      
      return res.json(response.data);
    } catch (error) {
      console.error("Transcription retrieval error:", error);
      return res.status(500).json({ message: "Transcription retrieval error" });
    }
  });

  app.get("/api/agora/token", authenticate, async (req, res) => {
    try {
      const { channelName, uid } = req.query;
      
      if (!channelName) {
        return res.status(400).json({ message: "Channel name is required" });
      }
      
      // In a real implementation, you would generate an Agora token here
      // For demo purposes, we'll return a mock token
      const appId = process.env.AGORA_APP_ID || "";
      
      return res.json({
        appId,
        channelName,
        token: "demo-token-for-agora",
        uid: uid || 0
      });
    } catch (error) {
      console.error("Agora token error:", error);
      return res.status(500).json({ message: "Failed to generate token" });
    }
  });

  return httpServer;
}
