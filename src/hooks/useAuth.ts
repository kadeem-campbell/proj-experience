import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch user profile when authenticated
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      // Fetch role from user_roles table (roles are stored separately for security)
      // Using type assertion since types may not be regenerated yet
      const { data: roleData, error: roleError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching role:', roleError);
      }

      // Combine profile with role
      setUserProfile({
        ...profileData,
        role: roleData?.role || 'traveler'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
    setUserProfile(null);
  };

  return {
    user,
    session,
    loading,
    userProfile,
    signOut,
    isAuthenticated: !!user,
    hasRole: (role: string) => userProfile?.role === role,
    isCreator: userProfile?.role === 'creator',
    isTraveler: userProfile?.role === 'traveler' || userProfile?.role === 'user',
    refreshProfile: () => user ? fetchUserProfile(user.id) : null,
  };
};