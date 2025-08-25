'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Home,
  MessageSquare,
  DollarSign,
  Star,
  Clock,
  Search,
  FileText,
  Camera,
  CreditCard,
  Bell,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Bot,
  Smartphone,
  Mail,
  Video,
  Download,
  Upload,
  Lock,
  Award
} from 'lucide-react'

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">RenovationAdvisor</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/features" className="text-blue-600 font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/contractors" className="text-gray-600 hover:text-gray-900">For Contractors</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/intake">Start Your Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Complete Platform Features
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Everything You Need for
              <span className="text-blue-600"> Successful Renovations</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Our comprehensive platform combines AI-powered matching, project management, 
              communication tools, and financial protection to make your renovation seamless.
            </p>
            <Button size="lg" className="group" asChild>
              <Link href="/intake">
                Start Free Today
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Platform Features</h2>
            <p className="text-xl text-gray-600">The tools you need for renovation success</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <CardTitle>AI-Powered Contractor Matching</CardTitle>
                <CardDescription>
                  Our advanced AI analyzes your project and finds the perfect contractors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Smart matching algorithm considers project type, budget, timeline, and location</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Verified licenses, insurance, and portfolio analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Real-time availability and scheduling optimization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Match confidence scoring and reasoning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Real-Time Communication Hub</CardTitle>
                <CardDescription>
                  Stay connected with all project stakeholders in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">In-app messaging with file and photo sharing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Video calls and screen sharing for consultations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Email and SMS notifications for all updates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Project timeline and milestone updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Smart Budget Management</CardTitle>
                <CardDescription>
                  Track every dollar with transparent pricing and secure payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Detailed cost breakdowns and line-item tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Milestone-based payment system with escrow protection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Change order management and approval workflow</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Real-time budget tracking and expense reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Feature Set</h2>
            <p className="text-xl text-gray-600">Every tool you need, all in one platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Multi-Step Intake Form",
                description: "Comprehensive project capture with PDF generation for contractor proposals"
              },
              {
                icon: Search,
                title: "Advanced Search & Filters",
                description: "Find contractors by specialty, availability, rating, and service area"
              },
              {
                icon: Camera,
                title: "Photo & File Management",
                description: "Upload, organize, and share project photos and documents securely"
              },
              {
                icon: Calendar,
                title: "Project Timeline",
                description: "Visual timeline with milestones, dependencies, and progress tracking"
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                description: "Customizable alerts via email, SMS, and push notifications"
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Project insights, contractor performance, and budget analytics"
              },
              {
                icon: Shield,
                title: "Contractor Verification",
                description: "License validation, insurance verification, and background checks"
              },
              {
                icon: CreditCard,
                title: "Secure Payments",
                description: "Escrow services, milestone payments, and financial protection"
              },
              {
                icon: Smartphone,
                title: "Mobile Responsive",
                description: "Full functionality on all devices with native app experience"
              },
              {
                icon: Video,
                title: "Video Consultations",
                description: "Built-in video calls for project discussions and progress reviews"
              },
              {
                icon: Download,
                title: "Document Generation",
                description: "Auto-generated contracts, invoices, and project documentation"
              },
              {
                icon: Lock,
                title: "Data Security",
                description: "Enterprise-grade security with encryption and privacy protection"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Feature */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Bot className="h-3 w-3 mr-1" />
                AI-Powered Assistant
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Meet Emma, Your Renovation AI Assistant
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our intelligent chatbot helps capture leads, answer questions, and guide homeowners 
                through the renovation process 24/7.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Natural Language Processing</h4>
                    <p className="text-gray-600">Understands complex renovation questions and provides intelligent responses</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Lead Qualification</h4>
                    <p className="text-gray-600">Automatically captures and qualifies leads with smart conversation flows</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">24/7 Availability</h4>
                    <p className="text-gray-600">Never miss a lead with round-the-clock AI assistance</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Emma AI Assistant</CardTitle>
                      <CardDescription>Online now</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">Hi! I'm Emma, your renovation assistant. I can help you plan your project, find contractors, and answer any questions you have. What type of renovation are you considering?</p>
                    </div>
                    <div className="bg-blue-600 text-white rounded-lg p-3 ml-8">
                      <p className="text-sm">I'm thinking about a kitchen remodel. Where do I start?</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm">Great choice! Kitchen remodels are one of our most popular projects. I'll help you get started with our intake form to capture your vision, budget, and timeline. Would you like to begin now?</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600">Connect with the tools you already use</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Email Integration",
                description: "Sync with Gmail, Outlook, and other email providers",
                icon: Mail
              },
              {
                title: "SMS Notifications",
                description: "Real-time updates via text message",
                icon: Smartphone
              },
              {
                title: "Payment Processing",
                description: "Secure integration with Stripe and PayPal",
                icon: CreditCard
              },
              {
                title: "Document Storage",
                description: "Connect with Google Drive and Dropbox",
                icon: Upload
              }
            ].map((integration, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <integration.icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">{integration.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience All These Features?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start your renovation project today and discover why thousands of homeowners trust RenovationAdvisor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/intake">
                Start Free Project
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Home className="h-6 w-6 text-blue-400" />
                <span className="font-bold text-xl text-white">RenovationAdvisor</span>
              </div>
              <p className="text-sm">
                Making home renovation simple, transparent, and successful.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/contractors" className="hover:text-white">For Contractors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 RenovationAdvisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}