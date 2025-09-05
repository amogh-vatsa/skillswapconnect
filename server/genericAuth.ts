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

  // Demo login endpoint - automatically creates and logs in users
  app.post("/api/login", passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Simple demo login form
  app.get("/api/login", (req, res) => {
    res.send(`
      <html>
        <body>
          <h2>SkillSwapConnect Demo Login</h2>
          <form method="POST" action="/api/login">
            <input name="email" type="email" placeholder="Enter any email" required style="padding: 8px; margin: 4px; display: block;"><br>
            <input name="password" type="password" placeholder="Enter any password" required style="padding: 8px; margin: 4px; display: block;"><br>
            <button type="submit" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">Login</button>
          </form>
          <p><small>This is a demo - any email/password will work and create a user automatically.</small></p>
        </body>
      </html>
    `);
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
