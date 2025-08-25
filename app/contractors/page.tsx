'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  CheckCircle, 
  Home,
  Star,
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  MessageSquare,
  Shield,
  Award,
  Zap,
  Target,
  Phone,
  Mail,
  Building,
  Hammer,
  PaintBucket,
  Wrench,
  Clock,
  BarChart3
} from 'lucide-react'

export default function ContractorsPage() {
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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/contractors" className="text-blue-600 font-medium">For Contractors</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/login">Contractor Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup?type=contractor">Join as Contractor</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Briefcase className="h-3 w-3 mr-1" />
                For Professional Contractors
              </Badge>
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Grow Your Business with
                <span className="text-blue-600"> Quality Leads</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect with serious homeowners, manage projects efficiently, and build your reputation 
                on the platform contractors trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="group" asChild>
                  <Link href="/signup?type=contractor">
                    Join as Contractor
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#how-it-works">
                    How It Works
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Active Contractors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">$2.5M+</div>
                  <div className="text-sm text-gray-600">Projects Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">4.8★</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Why Contractors Choose Us</CardTitle>
                    <CardDescription>Join the professionals building success</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Pre-qualified leads only</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span>Secure milestone payments</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span>Insurance & license verification</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Business growth analytics</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Top Contractors Choose RenovationAdvisor
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop chasing leads and start building your business with homeowners who are serious about their projects
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Qualified Leads Only</CardTitle>
                <CardDescription>
                  No more tire kickers. Every lead is pre-qualified with budget, timeline, and project details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Budget verification required before matching</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Detailed project requirements and photos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Realistic timeline expectations set upfront</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Secure Payment System</CardTitle>
                <CardDescription>
                  Get paid on time with our milestone-based payment system and escrow protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Milestone payments protect your cash flow</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Escrow service ensures payment security</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Automated invoicing and payment processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Grow Your Business</CardTitle>
                <CardDescription>
                  Build your reputation, track performance, and scale your business with our tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Portfolio showcase and customer reviews</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Business analytics and performance insights</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Lead conversion tracking and optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How RenovationAdvisor Works for Contractors
            </h2>
            <p className="text-xl text-gray-600">
              Simple, efficient process to grow your business
            </p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Profile',
                description: 'Showcase your work, specialties, service areas, and get verified',
                icon: Building
              },
              {
                step: '2',
                title: 'Receive Quality Matches',
                description: 'Our AI matches you with projects that fit your expertise and availability',
                icon: Target
              },
              {
                step: '3',
                title: 'Connect & Propose',
                description: 'Communicate with homeowners and submit detailed project proposals',
                icon: MessageSquare
              },
              {
                step: '4',
                title: 'Complete & Get Paid',
                description: 'Manage the project through completion and receive secure payments',
                icon: Award
              }
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contractor Tools */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tools Built for Contractors</h2>
            <p className="text-xl text-gray-600">Everything you need to manage projects professionally</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Project Management",
                description: "Track milestones, deadlines, and deliverables in one dashboard"
              },
              {
                icon: MessageSquare,
                title: "Client Communication",
                description: "Built-in messaging, file sharing, and video calls with clients"
              },
              {
                icon: DollarSign,
                title: "Invoicing & Payments",
                description: "Automated invoicing with milestone-based payment collection"
              },
              {
                icon: BarChart3,
                title: "Business Analytics",
                description: "Track your performance, lead conversion, and business growth"
              },
              {
                icon: Star,
                title: "Review Management",
                description: "Build your reputation with verified customer reviews and ratings"
              },
              {
                icon: Shield,
                title: "License Verification",
                description: "Display verified credentials to build trust with homeowners"
              }
            ].map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <tool.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contractor Success Stories</h2>
            <p className="text-xl text-gray-600">See how contractors are growing their business with us</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                name: "Mike's Construction",
                location: "San Francisco, CA",
                specialty: "Kitchen & Bath Remodeling",
                growth: "300% revenue increase",
                testimonial: "RenovationAdvisor transformed my business. The quality of leads is incredible - homeowners are serious and have realistic budgets. I've tripled my revenue in 18 months.",
                avatar: "MC"
              },
              {
                name: "Elite Home Services",
                location: "Austin, TX", 
                specialty: "Whole House Renovations",
                growth: "50+ projects completed",
                testimonial: "The platform makes project management so much easier. Communication with clients is streamlined, and the payment system gives everyone peace of mind.",
                avatar: "EH"
              },
              {
                name: "Precision Plumbing",
                location: "Denver, CO",
                specialty: "Plumbing & HVAC",
                growth: "25 new clients/month",
                testimonial: "I love that I only get matched with projects that fit my specialty and schedule. No more wasted time on unqualified leads. The AI matching really works!",
                avatar: "PP"
              }
            ].map((story, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {story.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{story.name}</CardTitle>
                      <CardDescription>{story.location} • {story.specialty}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit bg-green-100 text-green-800">
                    {story.growth}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{story.testimonial}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing for Contractors */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Contractor Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your business</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/signup?type=contractor&plan=basic">Start Basic Plan</Link>
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Up to 10 project matches/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic project management tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Client messaging & file sharing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Secure payment processing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic business analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For growing businesses</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/signup?type=contractor&plan=professional">Start Professional Plan</Link>
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited project matches</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced project management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Video consultations with clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Priority customer support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced business analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Marketing tools & portfolio builder</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Grow Your Contracting Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful contractors who've found their ideal clients through RenovationAdvisor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/signup?type=contractor">
                Join as Contractor
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link href="/contact">
                Contact Sales
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
                Connecting contractors with quality renovation projects.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Contractors</h4>
              <ul className="space-y-2">
                <li><Link href="/contractors" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/signup?type=contractor" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/contractor-success" className="hover:text-white">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/webinars" className="hover:text-white">Webinars</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  1-800-CONTRACTORS
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  contractors@renovationadvisor.com
                </li>
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