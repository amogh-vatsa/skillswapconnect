import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a placeholder client if Supabase is not configured
const createSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Using fallback authentication.');
    // Return a mock client for fallback
    return null as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

export const supabase = createSupabaseClient();
