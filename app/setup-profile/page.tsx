'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function SetupProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndProfile()
  }, [])

  const checkUserAndProfile = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        setProfile(existingProfile)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'homeowner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        toast.error(`Failed to create profile: ${error.message}`)
      } else {
        toast.success('Profile created successfully!')
        setProfile(data)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('Something went wrong')
    } finally {
      setIsCreating(false)
    }
  }

  const updateProfileRole = async () => {
    if (!user || !profile) return
    
    setIsCreating(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role: 'homeowner',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        toast.error(`Failed to update profile: ${error.message}`)
      } else {
        toast.success('Profile updated successfully!')
        setProfile(data)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('Something went wrong')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking profile status...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-96 mx-auto">
        <Card className="shadow-lg border border-gray-200">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Profile Setup</CardTitle>
          <CardDescription className="text-gray-600">
            Let's set up your profile to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">✓ Logged in as:</p>
                <p className="text-lg font-semibold text-blue-900">{user.email}</p>
                <p className="text-xs text-blue-600 mt-1">User ID: {user.id}</p>
              </div>

              {profile ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-3">✓ Profile exists!</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-green-800">{profile.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className={`font-medium ${profile.role === 'homeowner' ? 'text-green-600' : 'text-orange-600'}`}>{profile.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-green-800">{new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {profile.role !== 'homeowner' && profile.role !== 'admin' ? (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 mb-3">
                        ⚠️ Your role needs to be updated to access the dashboard
                      </p>
                      <Button 
                        onClick={updateProfileRole}
                        disabled={isCreating}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isCreating ? 'Updating...' : 'Update Role to Homeowner'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-green-800 mb-3">
                        🎉 Your profile is ready!
                      </p>
                      <Button 
                        onClick={() => {
                          console.log('🚀 Redirecting to dashboard...')
                          console.log('Current profile:', profile)
                          console.log('Current user:', user)
                          router.push('/dashboard')
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Go to Dashboard →
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      📝 No profile found in database
                    </p>
                    <p className="text-xs text-yellow-700">
                      We need to create a profile for you to access the dashboard
                    </p>
                  </div>
                  <Button 
                    onClick={createProfile}
                    disabled={isCreating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? 'Creating Profile...' : 'Create Profile ✨'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-red-800 mb-2">🔒 Not logged in</p>
              <p className="text-xs text-red-700 mb-3">Please log in first to continue</p>
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Go to Login →
              </Button>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  )
}