import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { nanoid } from "nanoid";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store for demo (in production, you'd use a proper session store)
  return session({
    secret: process.env.SESSION_SECRET || 'demo-session-secret-change-in-production',
    resave: false,
    saveUninitialized: true, // Allow creating sessions for new users
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for now to ensure cookies work
      maxAge: sessionTtl,
      sameSite: 'lax' // Allow cross-site requests
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple demo authentication - create/login users automatically
  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        // For demo purposes, create user if doesn't exist
        const userId = nanoid();
        const emailPrefix = email?.split('@')[0] || 'Demo';
        const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toUpperCase();
        
        const userData = {
          id: userId,
          email: email,
          firstName: firstName,
          lastName: 'USER',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          bio: `${firstName} is exploring SkillSwap`,
          title: 'New Member',
          isVerified: false
        };
        
        // Try to save to database, but continue if it fails
        try {
          await storage.upsertUser(userData);
        } catch (dbError) {
          console.warn('Database save failed, continuing with session-only auth:', dbError.message);
        }
        
        const user = { 
          id: userId, 
          email: email,
          claims: { sub: userId, email: email }
        };
        
        return done(null, user);
      } catch (error) {
        console.error('Passport strategy error:', error);
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Auto-login endpoint for demo - creates a demo user automatically
  app.get("/api/login", async (req, res) => {
    try {
      // Create a demo user automatically
      const demoEmail = `demo-${Date.now()}@skillswap.demo`;
      const userId = nanoid();
      
      await storage.upsertUser({
        id: userId,
        email: demoEmail,
        firstName: 'Demo',
        lastName: 'User',
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoEmail}`,
      });
      
      const user = { 
        id: userId, 
        email: demoEmail,
        claims: { sub: userId, email: demoEmail }
      };
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          res.redirect('/?error=login_failed');
        } else {
          res.redirect('/');
        }
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.redirect('/?error=demo_login_failed');
    }
  });

  // API endpoint for login using passport
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
      }
      
      if (!user) {
        console.error('Authentication failed - no user');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        console.log('User logged in successfully:', user.email);
        res.json({ success: true, user: user });
      });
    })(req, res, next);
  });

  // Get current authenticated user
  app.get("/api/auth/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user from database:", error);
      
      // If database fails, return user data from session
      if (req.user) {
        const fallbackUser = {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.email?.split('@')[0]?.toUpperCase() || 'USER',
          lastName: 'DEMO',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user.email}`,
          bio: 'Exploring SkillSwap',
          title: 'New Member',
          isVerified: false,
          avgRating: 0,
          totalExchanges: 0,
          skillsCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log('Returning fallback user data:', fallbackUser.firstName);
        return res.json(fallbackUser);
      }
      
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized - Please login first" });
  }
  return next();
};
