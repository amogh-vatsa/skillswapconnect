import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
// import { storage } from "./storage"; // DISABLED - NO DATABASE ACCESS
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

  // Demo data seeding endpoint - DISABLED (database-free mode)
  app.post('/api/seed-demo', (req, res) => {
    console.log('📊 Demo seeding skipped - database-free mode');
    res.json({ message: 'Demo data seeding skipped (database-free mode)' });
  });

  // Root health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes - 100% DATABASE-FREE, BULLETPROOF VERSION
  app.get('/api/auth/user', (req: any, res) => {
    console.log('📊 DATABASE-FREE AUTH ENDPOINT HIT');
    
    // Check if user is authenticated (session-based only)
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ message: "Authorization token required" });
    }
    
    console.log('✅ User is authenticated, returning session data');
    
    // ALWAYS return success with session data - NEVER touch database
    const user = req.user || {};
    const claims = user.claims || user;
    
    const sessionUser = {
      id: claims.sub || user.id || 'session-user-' + Date.now(),
      email: claims.email || user.email || 'demo@skillswap.local',
      firstName: claims.firstName || user.firstName || "Demo",
      lastName: claims.lastName || user.lastName || "User",
      profileImageUrl: claims.profileImageUrl || user.profileImageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      bio: claims.bio || user.bio || "SkillSwap member (database-free mode)",
      title: claims.title || user.title || "Member",
      isVerified: claims.isVerified || user.isVerified || false,
      createdAt: claims.createdAt || user.createdAt || new Date().toISOString(),
      updatedAt: claims.updatedAt || user.updatedAt || new Date().toISOString(),
      avgRating: 0,
      totalExchanges: 0,
      skillsCount: 0
    };
    
    console.log(`🎉 SUCCESS: Returning user ${sessionUser.firstName} ${sessionUser.lastName}`);
    return res.status(200).json(sessionUser);
  });

  // Skills routes - DATABASE-FREE VERSION
  app.get('/api/skills', (req, res) => {
    console.log('📊 Skills endpoint hit - returning empty array (database-free mode)');
    res.json([]); // Always return empty array - no database
  });

  app.get('/api/skills/user/:userId', (req, res) => {
    console.log('📊 User skills endpoint hit - returning empty array (database-free mode)');
    res.json([]); // Always return empty array - no database
  });

  app.post('/api/skills', (req: any, res) => {
    console.log('📊 Create skill endpoint - disabled (database-free mode)');
    res.status(200).json({ message: 'Skill creation disabled in database-free mode' });
  });

  app.put('/api/skills/:id', (req: any, res) => {
    console.log('📊 Update skill endpoint - disabled (database-free mode)');
    res.status(200).json({ message: 'Skill updates disabled in database-free mode' });
  });

  app.delete('/api/skills/:id', (req: any, res) => {
    console.log('📊 Delete skill endpoint - disabled (database-free mode)');
    res.status(200).json({ message: 'Skill deletion disabled in database-free mode' });
  });

  // Conversations routes - DATABASE-FREE VERSION
  app.get('/api/conversations', (req: any, res) => {
    console.log('📊 Conversations endpoint hit - returning empty array (database-free mode)');
    res.json([]); // Always return empty array - no database
  });

  // ALL REMAINING ENDPOINTS - DATABASE-FREE VERSION
  app.post('/api/conversations', (req: any, res) => {
    console.log('📊 Create conversation - disabled (database-free mode)');
    res.json({ message: 'Conversations disabled in database-free mode' });
  });

  app.get('/api/conversations/:conversationId/messages', (req: any, res) => {
    console.log('📊 Messages - returning empty array (database-free mode)');
    res.json([]);
  });

  app.post('/api/conversations/:conversationId/messages', (req: any, res) => {
    console.log('📊 Send message - disabled (database-free mode)');
    res.json({ message: 'Messaging disabled in database-free mode' });
  });

  app.get('/api/exchanges', (req: any, res) => {
    console.log('📊 Exchanges - returning empty array (database-free mode)');
    res.json([]);
  });

  app.post('/api/exchanges', (req: any, res) => {
    console.log('📊 Create exchange - disabled (database-free mode)');
    res.json({ message: 'Exchanges disabled in database-free mode' });
  });

  app.put('/api/exchanges/:id/status', (req: any, res) => {
    console.log('📊 Update exchange - disabled (database-free mode)');
    res.json({ message: 'Exchange updates disabled in database-free mode' });
  });

  app.get('/api/users/:userId/ratings', (req, res) => {
    console.log('📊 Ratings - returning empty array (database-free mode)');
    res.json([]);
  });

  app.post('/api/ratings', (req: any, res) => {
    console.log('📊 Create rating - disabled (database-free mode)');
    res.json({ message: 'Ratings disabled in database-free mode' });
  });

  app.get('/api/users/:userId', (req, res) => {
    console.log('📊 User profile - returning demo data (database-free mode)');
    const { userId } = req.params;
    res.json({
      id: userId,
      email: 'demo@skillswap.local',
      firstName: 'Demo',
      lastName: 'User',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      bio: 'Demo user profile (database-free mode)',
      title: 'Member',
      isVerified: false,
      avgRating: 0,
      totalExchanges: 0,
      skillsCount: 0
    });
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
