import { createClient } from '@supabase/supabase-js'
import { secureLog, secureError } from '../utils/secureLogger';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw'

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
    // PWA-specific storage configuration
    storage: {
      getItem: (key: string) => {
        try {
          // Try localStorage first, fallback to sessionStorage
          const value = localStorage.getItem(key) || sessionStorage.getItem(key);
          return value;
        } catch (error) {
          console.log('Storage access error, using sessionStorage:', error);
          return sessionStorage.getItem(key);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Store in both localStorage and sessionStorage for PWA reliability
          localStorage.setItem(key, value);
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.log('Storage write error, using sessionStorage only:', error);
          sessionStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
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
