import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSkillSchema, insertMessageSchema, insertSkillExchangeSchema, insertUserRatingSchema } from "@shared/schema";
import { z } from "zod";

// Import auth systems with fallback
import { setupAuth as setupSupabaseAuth, isAuthenticated as supabaseIsAuthenticated } from "./supabaseAuth";
import { setupAuth as setupGenericAuth, isAuthenticated as genericIsAuthenticated } from "./genericAuth";

// Check if Supabase is configured with real values (not placeholders)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey && 
  supabaseUrl.includes('.supabase.co') && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseServiceKey.includes('your_supabase'));

// Log authentication system status
if (isSupabaseConfigured) {
  console.log('✅ Using Supabase authentication system');
} else {
  console.log('⚠️  Supabase not configured - falling back to generic authentication');
  console.log('📝 To enable Supabase authentication, set these environment variables:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
}

const { setupAuth, isAuthenticated } = isSupabaseConfigured 
  ? { setupAuth: setupSupabaseAuth, isAuthenticated: supabaseIsAuthenticated }
  : { setupAuth: setupGenericAuth, isAuthenticated: genericIsAuthenticated };

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Demo data seeding endpoint (for matching original Replit content)
  app.post('/api/seed-demo', async (req, res) => {
    try {
      const { seedDemoData } = await import('./seedDemoData');
      await seedDemoData();
      res.json({ message: 'Demo data seeded successfully' });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ error: 'Failed to seed demo data' });
    }
  });

  // Root health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Skills routes
  app.get('/api/skills', async (req, res) => {
    try {
      const { category, search } = req.query;
      const skills = await storage.getAllSkills(
        category as string,
        search as string
      );
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.get('/api/skills/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const skills = await storage.getSkillsByUserId(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching user skills:", error);
      res.status(500).json({ message: "Failed to fetch user skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skillData = insertSkillSchema.parse({ ...req.body, userId });
      const skill = await storage.createSkill(skillData);
      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill data", errors: error.errors });
      }
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.put('/api/skills/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify skill belongs to user
      const existingSkills = await storage.getSkillsByUserId(userId);
      const skillExists = existingSkills.some(skill => skill.id === id);
      
      if (!skillExists) {
        return res.status(404).json({ message: "Skill not found or unauthorized" });
      }

      const updates = insertSkillSchema.partial().parse(req.body);
      const skill = await storage.updateSkill(id, updates);
      res.json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill data", errors: error.errors });
      }
      console.error("Error updating skill:", error);
      res.status(500).json({ message: "Failed to update skill" });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify skill belongs to user
      const existingSkills = await storage.getSkillsByUserId(userId);
      const skillExists = existingSkills.some(skill => skill.id === id);
      
      if (!skillExists) {
        return res.status(404).json({ message: "Skill not found or unauthorized" });
      }

      await storage.deleteSkill(id);
      res.json({ message: "Skill deleted successfully" });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // Conversations routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantId } = req.body;
      
      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }

      const conversation = await storage.getOrCreateConversation(userId, participantId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Messages routes
  app.get('/api/conversations/:conversationId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:conversationId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.claims.sub;
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        senderId: userId
      });
      
      const message = await storage.createMessage(messageData);
      
      // Broadcast message via WebSocket
      broadcastMessage(conversationId, message);
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Exchanges routes
  app.get('/api/exchanges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchanges = await storage.getExchangesByUserId(userId);
      res.json(exchanges);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ message: "Failed to fetch exchanges" });
    }
  });

  app.post('/api/exchanges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeData = insertSkillExchangeSchema.parse({
        ...req.body,
        requesterId: userId
      });
      
      const exchange = await storage.createSkillExchange(exchangeData);
      res.json(exchange);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exchange data", errors: error.errors });
      }
      console.error("Error creating exchange:", error);
      res.status(500).json({ message: "Failed to create exchange" });
    }
  });

  app.put('/api/exchanges/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify user is part of the exchange
      const exchanges = await storage.getExchangesByUserId(userId);
      const exchange = exchanges.find(ex => ex.id === id);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found or unauthorized" });
      }

      const completedAt = status === 'completed' ? new Date() : undefined;
      const updatedExchange = await storage.updateExchangeStatus(id, status, completedAt);
      res.json(updatedExchange);
    } catch (error) {
      console.error("Error updating exchange status:", error);
      res.status(500).json({ message: "Failed to update exchange status" });
    }
  });

  // Ratings routes
  app.get('/api/users/:userId/ratings', async (req, res) => {
    try {
      const { userId } = req.params;
      const ratings = await storage.getRatingsByUserId(userId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ratingData = insertUserRatingSchema.parse({
        ...req.body,
        raterId: userId
      });
      
      const rating = await storage.createUserRating(ratingData);
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // User profile routes
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserWithStats(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { userId } = message;
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId)!.add(ws);
          console.log(`User ${userId} joined WebSocket`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove this websocket from all user sets
      for (const [userId, userSockets] of clients.entries()) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clients.delete(userId);
        }
      }
      console.log('WebSocket connection closed');
    });
  });

  // Function to broadcast messages
  function broadcastMessage(conversationId: string, message: any) {
    // In a real app, you'd get conversation participants and send to their websockets
    // For now, broadcast to all connected clients
    for (const [userId, userSockets] of clients.entries()) {
      for (const socket of userSockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'new_message',
            conversationId,
            message
          }));
        }
      }
    }
  }

  return httpServer;
}
