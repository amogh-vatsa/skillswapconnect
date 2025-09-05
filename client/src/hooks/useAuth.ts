import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get user profile data from our API
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!session?.access_token) return null;
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    enabled: !!session?.access_token,
    retry: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setLoading(false);
        
        // Invalidate queries when auth state changes
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
        } else if (event === 'SIGNED_IN' && session) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user: userProfile,
    session,
    isLoading: loading || profileLoading,
    isAuthenticated: !!session && !!userProfile,
    signOut,
  };
}
