import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import TrialManager from '../utils/trialManager';
import { secureLog, secureError, criticalLog } from '../utils/secureLogger';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onSignOut, setOnSignOut] = useState<(() => void) | null>(null);
  const fetchProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Debounced fetchProfile to prevent multiple rapid calls
  const fetchProfile = useCallback(async (userId?: string) => {
    if (isFetchingRef.current) {
      secureLog('fetchProfile already in progress, skipping');
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      secureLog('fetchProfile called');
      
      let userToUse = userId;
      
      // If no userId provided, try to get it from the current session
      if (!userToUse) {
        secureLog('No userId provided, checking current session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          userToUse = session?.user?.id;
          secureLog('Session user ID:', userToUse);
        } catch (sessionError) {
          secureError('Error getting session:', sessionError);
          setLoading(false);
          return;
        }
      }
      
      if (!userToUse) {
        secureLog('No user ID available');
        setLoading(false);
        return;
      }
      
      secureLog('Using user ID:', userToUse);
      secureLog('About to query profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToUse)
        .single();

      secureLog('Query result:', { data, error });

      if (error) {
        secureError('Error fetching profile:', error);
        secureError('Error details:', { code: error.code, message: error.message, details: error.details });
        
        // Handle JWT expired error
        if (error.code === 'PGRST303' || error.message?.includes('JWT expired')) {
          secureLog('JWT expired, attempting to refresh session...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              secureError('Failed to refresh session:', refreshError);
              // If refresh fails, sign out the user
              await supabase.auth.signOut();
              setUser(null);
              setIsAdmin(false);
              setLoading(false);
              return;
            }
            if (refreshData.session) {
              secureLog('Session refreshed successfully, retrying profile fetch...');
              // Retry the profile fetch with the new session
              setTimeout(() => {
                if (isFetchingRef.current) {
                  isFetchingRef.current = false;
                }
                debouncedFetchProfile(userId);
              }, 1000);
              return;
            }
          } catch (refreshError) {
            secureError('Error during session refresh:', refreshError);
            // If refresh fails, sign out the user
            await supabase.auth.signOut();
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }
        }
        
        // Handle network connectivity issues
        if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          secureLog('Network connectivity issue detected, will retry in 5 seconds...');
          setTimeout(() => {
            if (isFetchingRef.current) {
              isFetchingRef.current = false;
            }
            debouncedFetchProfile(userId);
          }, 5000);
          return;
        }
        
        // Don't clear the user state on database errors
        // Just log the error and keep the existing user data if available
        if (error.code === 'PGRST116') {
          secureLog('Profile not found, this might be a new user');
        } else {
          secureLog('Database error, but keeping user logged in');
        }
        setLoading(false);
        return;
      }

      secureLog('Profile data fetched:', data);
      setUser(data);
      
      // Check if user is admin
      const userIsAdmin = data.role === 'admin';
      setIsAdmin(userIsAdmin);
      
      if (userIsAdmin) {
        secureLog('🎉 User is ADMIN! Granting admin privileges...');
      } else {
        secureLog('User role:', data.role);
      }
      
      setLoading(false);
      setAuthLoading(false);
    } catch (error) {
      secureError('Error fetching profile:', error);
      secureError('Full error object:', error);
      // Don't clear user state on errors, just set loading to false
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
      secureLog('fetchProfile already in progress, skipping');
      return;
    }
    
    fetchProfileTimeoutRef.current = setTimeout(() => {
      fetchProfile(userId);
    }, 300); // Increased delay to ensure Supabase client is ready
  }, [fetchProfile]);

  useEffect(() => {
    // Initial session check - only run once
    const checkSession = async () => {
      if (hasInitializedRef.current) {
        secureLog('Already initialized, skipping initial session check');
        return;
      }
      
      hasInitializedRef.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        secureLog('Initial session check:', session?.user?.id);
        
        if (session?.user && !user) {
          secureLog('Initial session found, fetching profile...');
          
          // Check if session is about to expire (within 5 minutes)
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;
          
          if (timeUntilExpiry < 300) { // 5 minutes = 300 seconds
            secureLog('Session expiring soon, refreshing...');
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                secureError('Failed to refresh session:', refreshError);
              } else if (refreshData.session) {
                secureLog('Session refreshed proactively');
              }
            } catch (refreshError) {
              secureError('Error during proactive session refresh:', refreshError);
            }
          }
          
          debouncedFetchProfile(session.user.id);
        } else if (session?.user && user) {
          secureLog('Initial session found, but user data already exists, skipping profile fetch');
          setLoading(false);
          setAuthLoading(false);
        } else {
          secureLog('No initial session found');
          setLoading(false);
          setAuthLoading(false);
        }
      } catch (error) {
        secureError('Error checking initial session:', error);
        setLoading(false);
        setAuthLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        secureLog(`Auth state change: ${event} - User ID: ${session?.user?.id || 'None'}`);
        
        if (event === 'SIGNED_IN') {
          if (session?.user && !isFetchingRef.current && !user) {
            secureLog('User signed in, fetching profile...');
            debouncedFetchProfile(session.user.id);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Only fetch profile on token refresh if we don't have user data yet
          if (session?.user && !isFetchingRef.current && !user) {
            secureLog('Token refreshed, fetching profile...');
            debouncedFetchProfile(session.user.id);
          } else {
            secureLog('Token refreshed, but user data already exists, skipping profile fetch');
          }
        } else if (event === 'SIGNED_OUT') {
          secureLog('User signed out, clearing state');
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setAuthLoading(false);
          isFetchingRef.current = false;
          hasInitializedRef.current = false;
          
          // Call the onSignOut callback if it exists
          if (onSignOut) {
            onSignOut();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (fetchProfileTimeoutRef.current) {
        clearTimeout(fetchProfileTimeoutRef.current);
      }
    };
  }, [onSignOut, debouncedFetchProfile, user]);

  const signUp = async (email: string, password: string, name: string) => {
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
        secureError('Error creating profile:', profileError);
      } else {
        secureLog('Profile created successfully');
        
        // Initialize 7-day free trial for new user
        try {
          await TrialManager.initializeTrial(data.user.id);
          secureLog('✅ 7-day free trial initialized for new user');
        } catch (trialError) {
          secureError('Failed to initialize trial:', trialError);
          // Don't fail signup if trial initialization fails
        }
      }
    }

    return { user: data.user, session: data.session, error };
  };

  const signIn = async (email: string, password: string) => {
    secureLog('signIn called with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    secureLog('signIn result:', { user: data.user?.id, session: !!data.session, error });
    
    // If sign in is successful, the profile will be fetched automatically
    // and admin status will be detected in the fetchProfile function
    if (data.user && !error) {
      secureLog('✅ Sign in successful! Checking for admin privileges...');
    }
    
    return { user: data.user, session: data.session, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // Call the onSignOut callback if it exists
    if (onSignOut) {
      onSignOut();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: null };

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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
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