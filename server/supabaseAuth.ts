import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured. Authentication endpoints will return fallback responses.');
  console.warn('📝 To enable Supabase authentication, set these environment variables:');
  console.warn('   - VITE_SUPABASE_URL');
  console.warn('   - SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for server-side operations
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

export async function setupAuth(app: Express) {
  // Health check for Supabase connection
  app.get('/api/auth/health', async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.json({ 
        status: 'Supabase not configured - using fallback auth', 
        timestamp: new Date().toISOString(),
        configured: false
      });
    }
    
    try {
      const { data, error } = await supabase.auth.getUser();
      res.json({ status: 'Supabase connection OK', timestamp: new Date().toISOString(), configured: true });
    } catch (error) {
      res.status(500).json({ status: 'Supabase connection failed', error: error.message, configured: true });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userWithStats = await storage.getUserWithStats(user.id);
      res.json(userWithStats);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Sign up endpoint
  app.post('/api/auth/signup', async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(503).json({ 
        error: 'Authentication service not configured. Please set up Supabase environment variables.' 
      });
    }
    
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password, firstName, lastName' 
        });
      }

      // Create user in Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) {
        console.error('Supabase signup error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      // Create user profile in our database
      const userProfile = await storage.upsertUser({
        id: authData.user.id,
        email: authData.user.email!,
        firstName,
        lastName,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        bio: null,
        title: null,
        isVerified: false
      });

      res.json({ 
        user: authData.user,
        profile: userProfile,
        message: 'User created successfully' 
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error during signup' });
    }
  });

  // Sign in endpoint
  app.post('/api/auth/signin', async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(503).json({ 
        error: 'Authentication service not configured. Please set up Supabase environment variables.' 
      });
    }
    
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase signin error:', error);
        return res.status(401).json({ error: error.message });
      }

      // Ensure user exists in our database
      const userProfile = await storage.getUser(data.user.id);
      if (!userProfile) {
        // Create profile if it doesn't exist (shouldn't happen normally)
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.first_name || 'User',
          lastName: data.user.user_metadata?.last_name || '',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          bio: null,
          title: null,
          isVerified: false
        });
      }

      res.json({ 
        user: data.user,
        session: data.session,
        message: 'Signed in successfully' 
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error during signin' });
    }
  });

  // Sign out endpoint
  app.post('/api/auth/signout', async (req, res) => {
    try {
      // Get JWT token from Authorization header
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Sign out from Supabase
        const { error } = await supabase.auth.admin.signOut(token);
        if (error) {
          console.error('Signout error:', error);
        }
      }

      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ error: 'Internal server error during signout' });
    }
  });

  // Password reset endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.protocol}://${req.get('host')}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error during password reset' });
    }
  });

  // Update password endpoint
  app.post('/api/auth/update-password', isAuthenticated, async (req: any, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'New password is required' });
      }

      const { data, error } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { password }
      );

      if (error) {
        console.error('Password update error:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: 'Internal server error during password update' });
    }
  });
}

// Middleware to verify JWT token from Supabase
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!isSupabaseConfigured) {
    // When Supabase is not configured, return an error for protected routes
    return res.status(503).json({ 
      message: "Authentication service not configured",
      error: "Please set up Supabase environment variables to enable authentication"
    });
  }
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase!.auth.getUser(token);
    
    if (error || !user) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      claims: { sub: user.id, email: user.email }
    };

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};
