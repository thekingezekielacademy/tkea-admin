import { createClient } from '@supabase/supabase-js'
import { secureLog, secureError } from '../utils/secureLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // iOS Safari and PWA-specific storage configuration
    storage: {
      getItem: (key: string) => {
        try {
          // Check if we're in browser environment
          if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
            return null;
          }
          // iOS Safari storage priority: sessionStorage first (more reliable), then localStorage
          const value = sessionStorage.getItem(key) || localStorage.getItem(key);
          return value;
        } catch (error) {
          console.log('Storage access error, trying alternative storage:', error);
          // Fallback to memory storage for iOS Safari
          try {
            if (typeof window !== 'undefined') {
              return (window as any).__tempStorage?.[key] || null;
            }
            return null;
          } catch {
            return null;
          }
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Check if we're in browser environment
          if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
            return;
          }
          // iOS Safari: Store in sessionStorage first (more reliable)
          sessionStorage.setItem(key, value);
          localStorage.setItem(key, value);
          
          // Also store in memory as fallback for iOS Safari
          if (!(window as any).__tempStorage) {
            (window as any).__tempStorage = {};
          }
          (window as any).__tempStorage[key] = value;
        } catch (error) {
          console.log('Storage write error, using memory storage:', error);
          // Fallback to memory storage
          if (typeof window !== 'undefined') {
            if (!(window as any).__tempStorage) {
              (window as any).__tempStorage = {};
            }
            (window as any).__tempStorage[key] = value;
          }
        }
      },
      removeItem: (key: string) => {
        try {
          // Check if we're in browser environment
          if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
            return;
          }
          sessionStorage.removeItem(key);
          localStorage.removeItem(key);
          // Also remove from memory storage
          if ((window as any).__tempStorage) {
            delete (window as any).__tempStorage[key];
          }
        } catch (error) {
          console.log('Storage remove error:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'king-ezekiel-academy',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// Supabase client initialized successfully
