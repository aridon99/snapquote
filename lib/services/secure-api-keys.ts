// Secure API Key Service - Retrieves encrypted keys from Supabase Vault
import { createClient } from '@/lib/supabase/server'

interface TwilioCredentials {
  account_sid: string
  auth_token: string
}

// Cache for API keys to avoid repeated database calls
const keyCache = new Map<string, { value: any, expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedKey<T>(keyName: string): T | null {
  const cached = keyCache.get(keyName)
  if (cached && Date.now() < cached.expires) {
    return cached.value as T
  }
  return null
}

function setCachedKey<T>(keyName: string, value: T): void {
  keyCache.set(keyName, {
    value,
    expires: Date.now() + CACHE_TTL
  })
}

export async function getTwilioCredentials(): Promise<TwilioCredentials> {
  // Check cache first
  const cached = getCachedKey<TwilioCredentials>('twilio_credentials')
  if (cached) {
    return cached
  }

  try {
    const supabase = await createClient()
    
    // Call the secure function to get Twilio credentials
    const { data, error } = await supabase.rpc('get_twilio_credentials')
    
    if (error) {
      console.error('Error retrieving Twilio credentials:', error)
      throw new Error('Failed to retrieve Twilio credentials')
    }

    if (!data || !data.account_sid || !data.auth_token) {
      throw new Error('Twilio credentials not properly configured in Supabase Vault')
    }

    const credentials: TwilioCredentials = {
      account_sid: data.account_sid,
      auth_token: data.auth_token
    }

    // Cache the result
    setCachedKey('twilio_credentials', credentials)
    
    return credentials
  } catch (error) {
    console.error('Error getting Twilio credentials:', error)
    
    // Fallback to environment variables if Supabase Vault fails
    const fallback = {
      account_sid: process.env.TWILIO_ACCOUNT_SID || '',
      auth_token: process.env.TWILIO_AUTH_TOKEN || ''
    }
    
    if (fallback.account_sid && fallback.auth_token) {
      console.warn('Using fallback Twilio credentials from environment variables')
      return fallback
    }
    
    throw new Error('Twilio credentials not available')
  }
}

export async function getOpenAIKey(): Promise<string> {
  // Check cache first
  const cached = getCachedKey<string>('openai_key')
  if (cached) {
    return cached
  }

  try {
    const supabase = await createClient()
    
    // Call the secure function to get OpenAI key
    const { data, error } = await supabase.rpc('get_openai_key')
    
    if (error) {
      console.error('Error retrieving OpenAI key:', error)
      throw new Error('Failed to retrieve OpenAI key')
    }

    if (!data) {
      throw new Error('OpenAI API key not configured in Supabase Vault')
    }

    // Cache the result
    setCachedKey('openai_key', data)
    
    return data
  } catch (error) {
    console.error('Error getting OpenAI key:', error)
    
    // Fallback to environment variable if Supabase Vault fails
    const fallback = process.env.OPENAI_API_KEY
    
    if (fallback) {
      console.warn('Using fallback OpenAI key from environment variables')
      return fallback
    }
    
    throw new Error('OpenAI API key not available')
  }
}

// Helper function to initialize Twilio client securely
export async function createTwilioClient() {
  const credentials = await getTwilioCredentials()
  
  // Dynamic import to avoid loading Twilio if not needed
  const twilio = (await import('twilio')).default
  
  return twilio(credentials.account_sid, credentials.auth_token)
}

// Helper function to initialize OpenAI client securely
export async function createOpenAIClient() {
  const apiKey = await getOpenAIKey()
  
  // Dynamic import to avoid loading OpenAI if not needed
  const { OpenAI } = await import('openai')
  
  return new OpenAI({ apiKey })
}

// Clear cache (useful for key rotation)
export function clearApiKeyCache(): void {
  keyCache.clear()
}