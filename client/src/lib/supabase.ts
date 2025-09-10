import { createClient } from '@supabase/supabase-js'
import { secureLog, secureError } from '../utils/secureLogger';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

secureLog('🔧 Supabase Config Debug:')
secureLog('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
secureLog('Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  secureError('❌ Missing Supabase environment variables:')
  secureError('REACT_APP_SUPABASE_URL:', supabaseUrl)
  secureError('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
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

secureLog('✅ Supabase client initialized successfully')

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    secureError('❌ Supabase connection test failed:', error.message)
  } else {
    secureLog('✅ Supabase connection test successful')
  }
}).catch((error) => {
  secureError('❌ Supabase connection test error:', error.message)
})
