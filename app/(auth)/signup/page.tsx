'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'react-hot-toast'
import { AlertCircle, Phone, Briefcase } from 'lucide-react'

function SignupForm() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: searchParams.get('type') === 'contractor' ? 'contractor' : 'homeowner',
    phone: '',
    businessName: '',
    trade: '',
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      return false
    }
    
    // Contractor-specific validation
    if (formData.userType === 'contractor') {
      if (!formData.phone.trim()) {
        setError('Phone number is required for contractors')
        return false
      }
      
      // Basic phone validation (10 digits)
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 10) {
        setError('Please enter a valid 10-digit phone number')
        return false
      }
      
      if (!formData.businessName.trim()) {
        setError('Business name is required for contractors')
        return false
      }
      
      if (!formData.trade) {
        setError('Please select your trade specialty')
        return false
      }
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return false
    }
    
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.userType,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        toast.error('Signup failed. Please try again.')
        return
      }

      if (authData?.user) {
        // Create profile in the database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.userType,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // If contractor, create contractor record
        if (formData.userType === 'contractor') {
          // Generate verification code
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
          
          const { error: contractorError } = await supabase
            .from('contractors')
            .insert({
              business_name: formData.businessName,
              contact_name: formData.fullName,
              email: formData.email,
              phone: formData.phone.replace(/\D/g, ''),
              trade: formData.trade,
              verification_code: verificationCode,
              verification_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
              onboarding_status: 'pending',
              is_active: true,
              specialties: formData.trade === 'both' ? ['plumber', 'electrician'] : [formData.trade],
              price_range: 'mid-range',
              availability_status: 'available'
            })

          if (contractorError) {
            console.error('Contractor creation error:', contractorError)
          }

          // Create onboarding progress record
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('id')
            .eq('email', formData.email)
            .single()

          if (contractorData) {
            await supabase
              .from('contractor_onboarding_progress')
              .insert({
                contractor_id: contractorData.id
              })
          }
        }

        toast.success('Account created! Please check your email to verify your account.')
        router.push('/login')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        toast.error('Google signup failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-96 mx-auto">
        <Card className="shadow-lg border border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Start your renovation journey today
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userType">I am a...</Label>
              <select
                id="userType"
                value={formData.userType}
                onChange={(e) => handleChange('userType', e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="homeowner">Homeowner</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            
            {/* Contractor-specific fields */}
            {formData.userType === 'contractor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="ABC Plumbing Services"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number (Required for WhatsApp)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => {
                      // Format phone number as user types
                      const digits = e.target.value.replace(/\D/g, '')
                      let formatted = ''
                      if (digits.length > 0) {
                        if (digits.length <= 3) {
                          formatted = `(${digits}`
                        } else if (digits.length <= 6) {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                        } else {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
                        }
                      }
                      handleChange('phone', formatted)
                    }}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">We'll use this to verify your account via WhatsApp</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trade">Trade Specialty</Label>
                  <select
                    id="trade"
                    value={formData.trade}
                    onChange={(e) => handleChange('trade', e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select your trade...</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="both">Both Plumber & Electrician</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Must be at least 6 characters</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-start space-x-3 p-2" data-checkbox-wrapper>
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleChange('agreeToTerms', checked)}
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-relaxed cursor-pointer select-none"
              >
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !formData.agreeToTerms}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#ea4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        
        <CardFooter>
          <p className="text-sm text-gray-600 text-center w-full">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  )
}