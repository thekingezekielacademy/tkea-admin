import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { linkGuestPurchases } from '../utils/courseAccess';

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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
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

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let sessionInitialized = false;
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && !sessionInitialized) {
        console.warn('Auth initialization timeout - setting loading to false');
        console.warn('This usually means Supabase connection failed. Check network tab for errors.');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Use onAuthStateChange which fires immediately with current session
    // This is more reliable than getSession() which can hang
    console.log('Setting up auth state listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Only process the initial session, ignore subsequent changes during init
      if (!sessionInitialized) {
        sessionInitialized = true;
        clearTimeout(timeoutId);
        console.log('Initial auth state:', event, session ? 'User logged in' : 'No session');
      } else {
        console.log('Auth state changed:', event, session ? 'User logged in' : 'No session');
      }
      
      try {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
          // Link any guest purchases to the user account
          if (session.user.email) {
            try {
              const result = await linkGuestPurchases(session.user.id, session.user.email);
              if (result.linked > 0) {
                console.log(`✅ Linked ${result.linked} guest purchase(s) to your account`);
              }
            } catch (error) {
              console.error('Error linking guest purchases:', error);
              // Don't block the auth flow if linking fails
            }
          }
        } else {
          setUser(null);
          if (sessionInitialized) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (sessionInitialized) {
          setLoading(false);
        }
      }
    });

    // Also try getSession as a backup, but don't wait for it
    // This helps in case onAuthStateChange doesn't fire immediately
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted || sessionInitialized) return;
        
        console.log('getSession backup completed');
        clearTimeout(timeoutId);
        sessionInitialized = true;
        
        if (error) {
          console.error('Error in getSession backup:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted || sessionInitialized) return;
        console.error('Error in getSession backup:', error);
        // Don't set loading to false here, let onAuthStateChange handle it
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const startTime = Date.now();
    console.log('Fetching user profile for:', userId);
    
    try {
      // Add timeout to prevent hanging
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timeout after 8 seconds'));
        }, 8000);
      });

      const { data, error } = await Promise.race([
        profileQuery,
        timeoutPromise,
      ]) as any;

      const duration = Date.now() - startTime;
      console.log(`Profile fetch completed in ${duration}ms`);

      if (error) {
        console.error('Error fetching user profile:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (data) {
        console.log('User profile loaded:', data.email);
        setUser(data as UserProfile);
      } else {
        console.warn('No profile data returned');
        throw new Error('No profile data returned');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Error fetching user profile after ${duration}ms:`, error);
      console.error('Error message:', error?.message);
      
      // If it's a timeout, log it but still throw so loading stops
      if (error?.message?.includes('timeout')) {
        console.error('⚠️ Profile fetch timed out - check Network tab for pending requests to profiles table');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user.id);
      // Link any guest purchases to the user account
      if (data.user.email) {
        const result = await linkGuestPurchases(data.user.id, data.user.email);
        if (result.linked > 0) {
          console.log(`✅ Linked ${result.linked} guest purchase(s) to your account`);
        }
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

