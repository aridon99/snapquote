'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Phone, 
  FileImage, 
  MessageSquare, 
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ContractorData {
  id: string
  business_name: string
  phone: string
  trade: string
  whatsapp_verified: boolean
  verification_code?: string
  onboarding_status: string
}

export default function ContractorOnboarding() {
  const [contractor, setContractor] = useState<ContractorData | null>(null)
  const [currentStep, setCurrentStep] = useState('whatsapp')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadContractorData()
    
    // Check for hash in URL to jump to specific step
    const hash = window.location.hash.replace('#', '')
    if (hash && ['whatsapp', 'upload', 'interview', 'complete'].includes(hash)) {
      setCurrentStep(hash)
    }
  }, [])

  const loadContractorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', user.email)
        .single()

      if (contractorData) {
        setContractor(contractorData)
        
        // If already verified, skip to next step
        if (contractorData.whatsapp_verified) {
          setCurrentStep('upload')
        }
        
        // If onboarding complete, redirect to dashboard
        if (contractorData.onboarding_status === 'completed') {
          router.push('/contractor/dashboard')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleManualVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setVerifying(true)
    
    try {
      // Simulate verification - in production this would check with WhatsApp
      const { error } = await supabase
        .from('contractors')
        .update({
          whatsapp_verified: true,
          whatsapp_opt_in_date: new Date().toISOString(),
          onboarding_status: 'phone_verified'
        })
        .eq('id', contractor?.id)
        .eq('verification_code', verificationCode)

      if (error) {
        toast.error('Invalid verification code')
      } else {
        toast.success('WhatsApp verified successfully!')
        setCurrentStep('upload')
        
        // Update onboarding progress
        await supabase
          .from('contractor_onboarding_progress')
          .update({
            phone_verified: true,
            phone_verified_at: new Date().toISOString()
          })
          .eq('contractor_id', contractor?.id)
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const completeOnboarding = async () => {
    try {
      await supabase
        .from('contractors')
        .update({
          onboarding_status: 'completed',
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', contractor?.id)

      toast.success('Onboarding complete! Welcome aboard!')
      router.push('/contractor/dashboard')
    } catch (error) {
      toast.error('Failed to complete onboarding')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const steps = [
    { id: 'whatsapp', title: 'WhatsApp Setup', icon: Phone },
    { id: 'upload', title: 'Upload Invoices', icon: FileImage },
    { id: 'interview', title: 'Price Interview', icon: MessageSquare },
    { id: 'complete', title: 'Complete', icon: CheckCircle2 }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">Welcome, {contractor?.business_name}!</h1>
                <p className="text-sm text-gray-500">Let's get your account set up</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/contractor/dashboard')}>
              Skip for Now
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        'border-gray-300 bg-white text-gray-400'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <Progress value={(currentStepIndex + 1) / steps.length * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          {currentStep === 'whatsapp' && (
            <>
              <CardHeader>
                <CardTitle>Link Your WhatsApp Account</CardTitle>
                <CardDescription>
                  Connect WhatsApp to receive job updates and manage your price list via messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contractor?.verification_code && !contractor?.whatsapp_verified ? (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        We've generated a verification code for your account. Send this code to our WhatsApp bot to link your phone number.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-medium mb-4">Option 1: Send Code via WhatsApp</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Your Verification Code</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="bg-white rounded-lg px-4 py-3 text-2xl font-mono font-bold text-blue-600 flex-1 text-center">
                              {contractor.verification_code}
                            </div>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => copyToClipboard(contractor.verification_code!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label>WhatsApp Number</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input value="+1 (555) 123-4567" readOnly />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => copyToClipboard('+15551234567')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Alert>
                          <Phone className="h-4 w-4" />
                          <AlertDescription>
                            Send a WhatsApp message with just your code (e.g., "{contractor.verification_code}") to the number above
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-medium mb-4">Option 2: Enter Code Manually</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Enter Verification Code</Label>
                          <Input
                            type="text"
                            placeholder="123456"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="font-mono text-lg"
                          />
                        </div>
                        <Button 
                          onClick={handleManualVerification}
                          disabled={verifying || verificationCode.length !== 6}
                          className="w-full"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify Code'
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : contractor?.whatsapp_verified ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      WhatsApp is already verified for your account!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No verification code found. Please contact support.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </>
          )}

          {currentStep === 'upload' && (
            <>
              <CardHeader>
                <CardTitle>Upload Past Invoices</CardTitle>
                <CardDescription>
                  Upload photos of your past invoices and we'll automatically extract your pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <FileImage className="h-4 w-4" />
                  <AlertDescription>
                    You can upload invoices in two ways:
                    <ul className="mt-2 ml-4 list-disc">
                      <li>Send photos directly to our WhatsApp bot</li>
                      <li>Upload files here on the website</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => router.push('/contractor/invoices')}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Invoices Now
                  </Button>
                  
                  <div className="text-center text-sm text-gray-500">
                    or send invoice photos to our WhatsApp bot
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'interview' && (
            <>
              <CardHeader>
                <CardTitle>Complete Your Price List</CardTitle>
                <CardDescription>
                  We'll ask you about common {contractor?.trade} services to complete your pricing profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    Check your WhatsApp for questions about missing price items. You can respond with:
                    <ul className="mt-2 ml-4 list-disc">
                      <li>Text messages with prices</li>
                      <li>Voice messages describing your rates</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium mb-4">Sample Questions You'll Receive:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white rounded p-3">
                      "What do you charge to install a standard toilet?"
                    </div>
                    <div className="bg-white rounded p-3">
                      "How much for replacing a kitchen faucet?"
                    </div>
                    <div className="bg-white rounded p-3">
                      "What's your rate for installing a GFCI outlet?"
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push('/contractor/pricing')}
                >
                  View & Edit Price List Manually
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 'complete' && (
            <>
              <CardHeader>
                <CardTitle>Setup Complete!</CardTitle>
                <CardDescription>
                  Your account is ready. You can now receive job requests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Congratulations! Your contractor account is set up and ready to receive job requests.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">What's Next?</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        Complete your business profile with insurance info
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        Review and adjust your price list
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        Set your availability preferences
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        Wait for job requests to come in!
                      </li>
                    </ul>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={completeOnboarding}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="px-6 pb-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const prevStep = steps[currentStepIndex - 1]
                if (prevStep) setCurrentStep(prevStep.id)
              }}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={() => {
                const nextStep = steps[currentStepIndex + 1]
                if (nextStep) setCurrentStep(nextStep.id)
              }}
              disabled={currentStepIndex === steps.length - 1}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}