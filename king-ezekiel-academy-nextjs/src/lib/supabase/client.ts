import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null
let isCreating = false

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Prevent multiple simultaneous creations
  if (isCreating) {
    console.warn('Supabase client is being created, waiting for initialization...')
    // Wait for the client to be created
    const maxWait = 50 // 50ms max wait
    const startTime = Date.now()
    while (!supabaseClient && Date.now() - startTime < maxWait) {
      // Busy wait (not ideal but prevents multiple instances)
    }
    if (supabaseClient) return supabaseClient
  }

  isCreating = true

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    isCreating = false
    throw new Error('Missing Supabase environment variables')
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  isCreating = false
  
  return supabaseClient
}
