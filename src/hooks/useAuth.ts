import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: (Record<string, unknown> & { role?: string }) | null;
};

type RoleClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { role?: string } | null; error: { code?: string } | null }>;
      };
    };
  };
};

let authState: AuthState = {
  user: null,
  session: null,
  loading: true,
  userProfile: null,
};

let initialized = false;
let profileRequestUserId: string | null = null;
let profileInFlightUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const setAuthState = (next: Partial<AuthState>) => {
  authState = { ...authState, ...next };
  emit();
};

const fetchUserProfile = async (userId: string) => {
  if (profileRequestUserId === userId && authState.userProfile) return;
  if (profileInFlightUserId === userId) return;
  profileRequestUserId = userId;
  profileInFlightUserId = userId;

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    const { data: roleData, error: roleError } = await (supabase as unknown as RoleClient)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error fetching role:', roleError);
    }

    setAuthState({
      userProfile: {
        ...profileData,
        role: roleData?.role || 'traveler'
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    if (profileInFlightUserId === userId) profileInFlightUserId = null;
  }
};

const initAuth = () => {
  if (initialized) return;
  initialized = true;

  const applySession = (session: Session | null) => {
    const user = session?.user ?? null;
    const sameUser = user?.id && authState.user?.id === user.id;
    setAuthState({ session, user, loading: false, userProfile: user && sameUser ? authState.userProfile : null });
    if (user) void fetchUserProfile(user.id);
    else {
      profileRequestUserId = null;
      profileInFlightUserId = null;
    }
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => applySession(session)
  );

  supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

  window.addEventListener('beforeunload', () => subscription.unsubscribe(), { once: true });
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(() => {
    return authState;
  });

  useEffect(() => {
    const listener = () => setState(authState);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
    setAuthState({ userProfile: null, user: null, session: null, loading: false });
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    userProfile: state.userProfile,
    signOut,
    isAuthenticated: !!state.user,
    hasRole: (role: string) => state.userProfile?.role === role,
    isCreator: state.userProfile?.role === 'creator',
    isTraveler: state.userProfile?.role === 'traveler' || state.userProfile?.role === 'user',
    refreshProfile: () => state.user ? fetchUserProfile(state.user.id) : null,
  };
};

initAuth();