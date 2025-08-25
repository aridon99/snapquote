'use client'

// Demo contractor dashboard showing the visual enhancements
// Access this at /demo/contractor-dashboard to see the new UI elements

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Circle, 
  Phone, 
  FileImage, 
  MessageSquare, 
  DollarSign,
  BarChart3,
  Settings,
  Upload,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Clock,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function DemoContractorDashboard() {
  // Mock data to demonstrate visual enhancements
  const mockContractor = {
    business_name: 'Demo Plumbing & Electric Co',
    contact_name: 'Demo Contractor',
    phone: '+1234567890',
    trade: 'both',
    whatsapp_verified: true,
    onboarding_status: 'phone_verified'
  }

  const mockProgress = {
    phone_verified: true,
    invoices_uploaded: 3,
    items_extracted: 12,
    items_manually_added: 5,
    interview_questions_total: 15,
    interview_questions_answered: 8,
    google_sheet_connected: false,
    profile_complete: false
  }

  const priceItemsCount = 17

  const calculateOnboardingProgress = () => {
    let completed = 0
    const steps = [
      mockProgress.phone_verified, // 1
      mockProgress.invoices_uploaded > 0, // 2
      mockProgress.items_extracted > 0 || mockProgress.items_manually_added > 0, // 3
      mockProgress.interview_questions_answered >= mockProgress.interview_questions_total * 0.8, // 4
      mockProgress.google_sheet_connected, // 5
      mockProgress.profile_complete // 6
    ]
    
    steps.forEach(step => {
      if (step) completed++
    })
    
    return Math.round((completed / steps.length) * 100)
  }

  const onboardingSteps = [
    {
      title: 'Verify WhatsApp',
      description: 'Link your WhatsApp for easy updates',
      completed: mockContractor?.whatsapp_verified || false,
      action: '/contractor/onboarding#whatsapp',
      icon: Phone
    },
    {
      title: 'Upload Invoices',
      description: 'Upload past invoices to extract pricing',
      completed: (mockProgress?.invoices_uploaded || 0) > 0,
      action: '/contractor/invoices',
      icon: FileImage
    },
    {
      title: 'Complete Price List',
      description: `${priceItemsCount} items in your price list`,
      completed: priceItemsCount >= 20,
      action: '/contractor/pricing',
      icon: DollarSign
    },
    {
      title: 'Answer Questions',
      description: `${mockProgress?.interview_questions_answered || 0}/${mockProgress?.interview_questions_total || 0} answered`,
      completed: (mockProgress?.interview_questions_answered || 0) >= (mockProgress?.interview_questions_total || 1) * 0.8,
      action: '/contractor/onboarding#interview',
      icon: MessageSquare
    },
    {
      title: 'Connect Google Sheets',
      description: 'Sync your price list with Google Sheets',
      completed: mockProgress?.google_sheet_connected || false,
      action: '/contractor/pricing#sheets',
      icon: BarChart3
    },
    {
      title: 'Complete Profile',
      description: 'Add business details and insurance info',
      completed: mockProgress?.profile_complete || false,
      action: '/contractor/profile',
      icon: Settings
    }
  ]

  const onboardingProgress = calculateOnboardingProgress()
  const isOnboardingComplete = onboardingProgress === 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Notice */}
      <div className="bg-blue-600 text-white text-center py-2 px-4">
        <p className="text-sm">
          🎨 <strong>DEMO:</strong> Visual enhancements preview - This shows the enhanced contractor dashboard with progress indicators
        </p>
      </div>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">{mockContractor?.business_name || 'Contractor Portal'}</h1>
                <p className="text-sm text-gray-500">
                  {mockContractor?.trade === 'both' ? 'Plumber & Electrician' : 
                   mockContractor?.trade === 'plumber' ? 'Plumbing Services' : 'Electrical Services'}
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="outline">Price List</Button>
              <Button variant="outline">Invoices</Button>
              <Button variant="outline">Profile</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Alert */}
        {!isOnboardingComplete && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Complete Your Setup
              </CardTitle>
              <CardDescription>
                Finish setting up your account to start receiving job requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Setup Progress</span>
                    <span className="font-medium text-yellow-700">{onboardingProgress}% Complete</span>
                  </div>
                  <Progress value={onboardingProgress} className="h-3" />
                </div>
                
                {/* Quick progress indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className={`flex items-center gap-2 ${mockContractor?.whatsapp_verified ? 'text-green-600' : 'text-gray-400'}`}>
                    {mockContractor?.whatsapp_verified ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    WhatsApp
                  </div>
                  <div className={`flex items-center gap-2 ${(mockProgress?.invoices_uploaded || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {(mockProgress?.invoices_uploaded || 0) > 0 ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    Invoices
                  </div>
                  <div className={`flex items-center gap-2 ${priceItemsCount >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                    {priceItemsCount >= 20 ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    Price List
                  </div>
                </div>
                
                <Button className="w-full sm:w-auto">
                  Continue Setup ({Math.ceil((100 - onboardingProgress) / 16)} steps left)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-2">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price List Coverage
                  </CardDescription>
                  <CardTitle className="text-2xl">{priceItemsCount}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">{Math.min(Math.round((priceItemsCount / 50) * 100), 100)}%</span>
                    </div>
                    <Progress value={Math.min((priceItemsCount / 50) * 100, 100)} className="h-2" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {priceItemsCount < 50 ? `${50 - priceItemsCount} more items recommended for full coverage` : '✅ Excellent coverage!'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Invoice Processing
                  </CardDescription>
                  <CardTitle className="text-2xl">{mockProgress?.invoices_uploaded || 0}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Items Extracted</span>
                      <span className="font-medium">{mockProgress?.items_extracted || 0}</span>
                    </div>
                    <Progress 
                      value={mockProgress?.invoices_uploaded ? Math.min(((mockProgress.items_extracted || 0) / (mockProgress.invoices_uploaded * 3)) * 100, 100) : 0} 
                      className="h-2" 
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {(mockProgress?.items_extracted || 0) > 0 ? 
                      `Average ${Math.round((mockProgress?.items_extracted || 0) / Math.max(mockProgress?.invoices_uploaded || 1, 1))} items per invoice` : 
                      'Upload invoices to extract pricing'
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Interview Progress
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {mockProgress?.interview_questions_total ? 
                      Math.round((mockProgress.interview_questions_answered / mockProgress.interview_questions_total) * 100) : 0}%
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Answered</span>
                      <span className="font-medium">
                        {mockProgress?.interview_questions_answered || 0}/{mockProgress?.interview_questions_total || 0}
                      </span>
                    </div>
                    <Progress 
                      value={mockProgress?.interview_questions_total ? 
                        (mockProgress.interview_questions_answered / mockProgress.interview_questions_total) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {mockProgress?.interview_questions_total ? 
                      `${(mockProgress.interview_questions_total - mockProgress.interview_questions_answered)} questions remaining` :
                      'No interview questions yet'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Update Prices
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest updates and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Account created</p>
                      <p className="text-gray-500">Welcome to RenovationAdvisor!</p>
                    </div>
                  </div>
                  {mockProgress?.phone_verified && (
                    <div className="flex items-center gap-4 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">WhatsApp verified</p>
                        <p className="text-gray-500">You can now receive updates via WhatsApp</p>
                      </div>
                    </div>
                  )}
                  {(mockProgress?.invoices_uploaded || 0) > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <FileImage className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{mockProgress?.invoices_uploaded} invoices uploaded</p>
                        <p className="text-gray-500">{mockProgress?.items_extracted} price items extracted</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Checklist */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Setup Progress</CardTitle>
                <CardDescription>Complete these steps to get started</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Circular Progress Visual */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-24 h-24">
                    {/* Background circle */}
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Progress circle */}
                      <path
                        className={`${onboardingProgress === 100 ? 'text-green-500' : 'text-blue-500'} transition-colors duration-500`}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={`${onboardingProgress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{
                          transition: 'stroke-dasharray 0.5s ease-in-out'
                        }}
                      />
                    </svg>
                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg font-bold ${onboardingProgress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {onboardingProgress}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {onboardingSteps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="mt-0.5">
                          {step.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${step.completed ? 'text-gray-500 line-through' : ''}`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                        </div>
                        <Icon className="h-4 w-4 text-gray-400" />
                      </div>
                    )
                  })}
                </div>
                
                {isOnboardingComplete && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">
                      Setup Complete! 
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You're ready to receive job requests
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Help Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Navigation */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-blue-900">Visual Enhancements Demonstrated</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Progress Bars in Stats Cards
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Circular SVG Progress Indicator
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Color-Coded Status Cards
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Enhanced Visual Feedback
                </div>
              </div>
              <p className="text-xs text-blue-600">
                To use the real contractor dashboard, sign up as a contractor or navigate to <code>/contractor/dashboard</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}