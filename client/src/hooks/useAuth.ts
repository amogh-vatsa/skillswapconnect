import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const queryClient = useQueryClient();

  // Get user profile data from our API (works with both Supabase and generic auth)
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log('Checking auth status...');
      const response = await fetch('/api/auth/user', {
        credentials: 'include', // Include cookies for session-based auth
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });
      
      console.log('Auth check response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated');
          return null; // User not authenticated
        }
        throw new Error('Failed to fetch user profile');
      }
      
      const user = await response.json();
      console.log('User authenticated:', user);
      setAuthChecked(true);
      return user;
    },
    retry: (failureCount, error: any) => {
      // Only retry if we haven't checked auth yet and it's not a 401
      return !authChecked && failureCount < 3 && error?.status !== 401;
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    
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
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  };

  return {
    user: userProfile,
    session,
    isLoading: loading || profileLoading,
    // User is authenticated if we have user profile data (works with both auth systems)
    isAuthenticated: !!userProfile,
    signOut,
  };
}
