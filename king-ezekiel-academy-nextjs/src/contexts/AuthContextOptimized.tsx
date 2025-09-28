'use client'
import React, { useEffect, useState, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { secureLog } from '../utils/secureLogger';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase/client';
import TrialManager from '../utils/trialManager';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  authLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: PostgrestError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  onSignOut: (() => void) | null;
  setOnSignOut: (callback: (() => void) | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onSignOut, setOnSignOut] = useState<(() => void) | null>(null);
  const fetchProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);


  const fetchProfile = useCallback(async (userId?: string) => {
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        setAuthLoading(false);
        return;
      }
      
      // Ensure session is set when we have a valid session
      setSession(sessionData.session);
      
      let userToUse = userId || sessionData.session.user?.id;
      
      if (!userToUse) {
        setLoading(false);
        setAuthLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToUse)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        setAuthLoading(false);
        return;
      }

      setUser(data);
      
      const userIsAdmin = data.role === 'admin';
      setIsAdmin(userIsAdmin);
      
      setLoading(false);
      setAuthLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      setAuthLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const debouncedFetchProfile = useCallback((userId?: string) => {
    if (fetchProfileTimeoutRef.current) {
      clearTimeout(fetchProfileTimeoutRef.current);
    }
    
    if (isFetchingRef.current) {
      // console.log('fetchProfile already in progress, skipping');
      return;
    }
    
    fetchProfileTimeoutRef.current = setTimeout(() => {
      fetchProfile(userId);
    }, 300); // Increased delay to ensure Supabase client is ready
  }, [fetchProfile]);

  useEffect(() => {
    // Don't set an aggressive timeout that interferes with authentication
    // The session check will handle clearing loading states appropriately
    let timeout: any = null;
    
    const checkSession = async () => {
      if (hasInitializedRef.current) {
        return;
      }
      hasInitializedRef.current = true;
      
      try {
        // First try to get the current session
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        secureLog('Checking existing session on page refresh:', { 
          hasSession: !!session, 
          hasUser: !!session?.user, 
          error: error?.message 
        });
        
        if (session?.user) {
          // Restore user session state
          setSession(session);
          debouncedFetchProfile(session.user.id);
        } else {
          // No valid session, user is not authenticated
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setAuthLoading(false);
        }
      } catch (error) {
        secureLog('Session check failed:', error);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        setAuthLoading(false);
      } finally {
        clearTimeout(timeout);
      }
    };

    checkSession();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        secureLog('Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
        
        if (event === 'SIGNED_IN' && session?.user && !isFetchingRef.current && !user) {
          setSession(session);
          debouncedFetchProfile(session.user.id);
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          if (session?.user && !isFetchingRef.current && !user) {
            debouncedFetchProfile(session.user.id);
          } else if (session?.user && user) {
            setSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
          setAuthLoading(false);
          isFetchingRef.current = false;
          hasInitializedRef.current = false;
          
          if (onSignOut) {
            onSignOut();
          }
        } else if (event === 'INITIAL_SESSION' && session?.user && !user) {
          // This handles the case where Supabase restores session on page load
          secureLog('Initial session detected, restoring user session');
          setSession(session);
          debouncedFetchProfile(session.user.id);
        }
      }
    );

    return () => {
      if (timeout) clearTimeout(timeout);
      subscription.unsubscribe();
      if (fetchProfileTimeoutRef.current) {
        clearTimeout(fetchProfileTimeoutRef.current);
      }
    };
  }, [onSignOut, debouncedFetchProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (data.user && !error) {
      // Wait a moment for the user to be fully created in auth.users
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create profile in profiles table
      const { error: profileError } = await supabase.rpc('create_profile', {
        p_id: data.user.id,
        p_name: name,
        p_email: email,
        p_bio: null,
        p_role: 'student'
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        // console.log('Profile created successfully');
        
        // Initialize 7-day free trial for new user
        try {
          await TrialManager.createTrial(data.user.id);
          // console.log('✅ 7-day free trial initialized for new user');
        } catch (trialError) {
          console.error('Failed to initialize trial:', trialError);
          // Don't fail signup if trial initialization fails
        }
      }
    }

    return { user: data.user, session: data.session, error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // console.log('signIn called with email:', email);
      
      // Test Supabase connection first
      const { supabase } = await import('@/lib/supabase');
      const { data: testData, error: testError } = await supabase.auth.getSession();
      if (testError) {
        console.error('❌ Supabase connection test failed before signin:', testError.message);
        return { user: null, session: null, error: testError };
      }
      
      // Clear any cached auth data that might be stale
      try {
        localStorage.removeItem('supabase-auth-token');
        sessionStorage.removeItem('supabase-auth-token');
      } catch (storageError) {
        console.log('Could not clear cached auth data:', storageError);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // console.log('signIn result:', { user: data.user?.id, session: !!data.session, error: error?.message });
      
      // If sign in is successful, the profile will be fetched automatically
      // and admin status will be detected in the fetchProfile function
      if (data.user && !error) {
        // console.log('✅ Sign in successful! Checking for admin privileges...');
        
        // Ensure session is set immediately
        setSession(data.session);
      }
      
      return { user: data.user, session: data.session, error };
    } catch (catchError) {
      console.error('❌ Unexpected error during signin:', catchError);
      // Return null for error since we can't create a proper AuthError
      return { 
        user: null, 
        session: null, 
        error: null
      };
    }
  };

  const signOut = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // SECURITY: Clear all user data from all storage mechanisms
    try {
      const secureStorage = await import('../utils/secureStorage');
      secureStorage.default.clearAllUserData();
      
      // Clear remaining auth-related cache entries
      const additionalClearKeys = ['user_trial_status', 'user_subscription_data'];
      additionalClearKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      secureLog('🧹 Cleared all user session data for security');
    } catch (error) {
      console.error('Error clearing storage on logout:', error);
    }
    
    // Call the onSignOut callback if it exists
    if (onSignOut) {
      onSignOut();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: null };

    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    authLoading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    fetchProfile,
    updateProfile,
    resetPassword,
    onSignOut,
    setOnSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthProvider;