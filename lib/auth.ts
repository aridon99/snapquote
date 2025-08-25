import { createClient } from './supabase/server'
import { createClient as createBrowserClient } from './supabase/client'
import { createUserProfile } from './supabase/database'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getUserWithProfile() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('🔍 getUserWithProfile called')
  console.log('Auth error:', error)
  console.log('User from auth:', user ? { id: user.id, email: user.email } : 'null')
  
  if (error || !user) {
    console.log('❌ No user or auth error')
    return { user: null, profile: null }
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  console.log('Profile query error:', profileError)
  console.log('Profile data:', profile)
  
  return { user, profile }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  
  if (error) return { data: null, error }
  
  // Create profile if user was created
  if (data.user) {
    await createUserProfile({
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName,
      role: 'homeowner'
    })
  }
  
  return { data, error: null }
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function requireHomeowner() {
  const { user, profile } = await getUserWithProfile()
  
  console.log('🔍 requireHomeowner called')
  console.log('User:', user ? { id: user.id, email: user.email } : 'null')
  console.log('Profile:', profile ? { id: profile.id, role: profile.role, email: profile.email } : 'null')
  
  if (!user || !profile) {
    console.log('❌ No user or profile found, redirecting to login')
    redirect('/login')
  }
  
  if (profile.role !== 'homeowner' && profile.role !== 'admin') {
    console.log('❌ Invalid role:', profile.role, ', redirecting to unauthorized')
    redirect('/unauthorized')
  }
  
  console.log('✅ Auth successful, proceeding to dashboard')
  return { user, profile }
}