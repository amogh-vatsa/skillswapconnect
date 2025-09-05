import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { nanoid } from "nanoid";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
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
        await storage.upsertUser({
          id: userId,
          email: email,
          firstName: email.split('@')[0],
          lastName: 'User',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        });
        
        const user = { 
          id: userId, 
          email: email,
          claims: { sub: userId, email: email }
        };
        
        return done(null, user);
      } catch (error) {
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

  // API endpoint for checking auth status
  app.post("/api/login", async (req, res) => {
    try {
      // For demo, auto-create user with any credentials
      const { email } = req.body;
      const userId = nanoid();
      
      await storage.upsertUser({
        id: userId,
        email: email || `demo-${Date.now()}@skillswap.demo`,
        firstName: email?.split('@')[0] || 'Demo',
        lastName: 'User',
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      });
      
      const user = { 
        id: userId, 
        email: email,
        claims: { sub: userId, email: email }
      };
      
      req.login(user, (err) => {
        if (err) {
          res.status(500).json({ error: 'Login failed' });
        } else {
          res.json({ success: true, user: req.user });
        }
      });
    } catch (error) {
      console.error('API login error:', error);
      res.status(500).json({ error: 'Login failed' });
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
