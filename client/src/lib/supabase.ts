import { createClient } from '@supabase/supabase-js'
import { secureLog, secureError } from './secureLogger';

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
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'king-ezekiel-academy'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

secureLog('✅ Supabase client initialized successfully')
