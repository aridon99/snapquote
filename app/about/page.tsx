'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Home,
  Users,
  Target,
  Heart,
  Shield,
  Lightbulb,
  Award,
  TrendingUp,
  Globe,
  Star,
  CheckCircle,
  MapPin,
  Calendar,
  Building,
  Zap
} from 'lucide-react'

export default function AboutPage() {
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
              <Link href="/about" className="text-blue-600 font-medium">About</Link>
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
              <Heart className="h-3 w-3 mr-1" />
              Our Story
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Making Home Renovation
              <span className="text-blue-600"> Simple & Trustworthy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We're on a mission to transform the home renovation industry by connecting homeowners 
              with trusted contractors through intelligent technology and transparent processes.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">2024</div>
                <div className="text-sm text-gray-600">Founded</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-sm text-gray-600">Projects Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Verified Contractors</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">4.9★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-blue-200 bg-blue-50/50 text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To make home renovation accessible, transparent, and successful for every homeowner 
                  by connecting them with the right contractors through intelligent technology.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50 text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  A world where every home renovation project is completed on time, on budget, 
                  and with exceptional quality through trusted professional relationships.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Transparency, trust, and technology drive everything we do. We believe in 
                  fair pricing, quality work, and building lasting relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Problem We're Solving
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Finding Trustworthy Contractors</h4>
                    <p className="text-gray-600">Homeowners struggle to find reliable contractors with verified credentials and quality work history.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Project Management Chaos</h4>
                    <p className="text-gray-600">Lack of organized communication, timeline tracking, and budget management leads to failed projects.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Payment Disputes & Risk</h4>
                    <p className="text-gray-600">Both homeowners and contractors face financial risks without proper payment protection and milestone tracking.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">Industry Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">73%</div>
                    <div className="text-sm text-gray-600">Of renovations go over budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">68%</div>
                    <div className="text-sm text-gray-600">Take longer than planned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">45%</div>
                    <div className="text-sm text-gray-600">Have payment disputes</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">RenovationAdvisor Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-gray-600">Projects completed on budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <div className="text-sm text-gray-600">Finished on or ahead of schedule</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-600">Customer satisfaction rate</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Solution
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Matching</h4>
                    <p className="text-gray-600">Our intelligent algorithm matches homeowners with verified contractors based on project requirements, budget, and location.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Comprehensive Project Management</h4>
                    <p className="text-gray-600">Built-in tools for communication, timeline tracking, budget management, and milestone completion.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Secure Payment Protection</h4>
                    <p className="text-gray-600">Escrow services and milestone-based payments protect both homeowners and contractors throughout the project.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">Experienced professionals passionate about transforming home renovation</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "CEO & Co-Founder",
                bio: "Former VP of Product at HomeAdvisor with 15 years in the home services industry. Stanford MBA.",
                avatar: "SC",
                background: "bg-blue-600"
              },
              {
                name: "Michael Rodriguez",
                role: "CTO & Co-Founder", 
                bio: "Ex-Google senior engineer specializing in AI and machine learning. MIT Computer Science graduate.",
                avatar: "MR",
                background: "bg-green-600"
              },
              {
                name: "Emily Johnson",
                role: "VP of Operations",
                bio: "20+ years managing large-scale construction projects. Former Operations Director at Lowe's.",
                avatar: "EJ",
                background: "bg-purple-600"
              }
            ].map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className={`h-20 w-20 ${member.background} rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold`}>
                    {member.avatar}
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-blue-600 font-medium">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">Key milestones in building the future of home renovation</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  date: "January 2024",
                  title: "Company Founded",
                  description: "RenovationAdvisor was founded with the mission to transform home renovation through technology.",
                  icon: Building
                },
                {
                  date: "March 2024",
                  title: "Platform Launch",
                  description: "Launched our MVP with 50 verified contractors across 5 major cities.",
                  icon: Zap
                },
                {
                  date: "June 2024",
                  title: "AI Matching Engine",
                  description: "Deployed our proprietary AI algorithm for intelligent contractor matching.",
                  icon: Target
                },
                {
                  date: "September 2024",
                  title: "1,000 Projects Completed",
                  description: "Reached our first major milestone with over 1,000 successful project completions.",
                  icon: Award
                },
                {
                  date: "December 2024",
                  title: "National Expansion",
                  description: "Expanded to 50+ cities nationwide with 500+ verified contractors on the platform.",
                  icon: Globe
                }
              ].map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <milestone.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-600 font-medium">{milestone.date}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recognition & Awards */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recognition & Awards</h2>
            <p className="text-xl text-gray-600">Industry recognition for innovation and excellence</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Best Construction Tech Startup",
                organization: "Construction Innovation Awards 2024",
                icon: Award
              },
              {
                title: "Top 10 PropTech Companies",
                organization: "TechCrunch 2024",
                icon: TrendingUp
              },
              {
                title: "Customer Choice Award",
                organization: "Home Improvement Industry 2024",
                icon: Star
              },
              {
                title: "Innovation in AI",
                organization: "Silicon Valley Tech Awards 2024",
                icon: Lightbulb
              }
            ].map((award, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <award.icon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">{award.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{award.organization}</p>
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
            Join Our Mission
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Whether you're a homeowner ready to renovate or a contractor looking to grow your business, 
            we're here to make your journey successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/intake">
                Start Your Project
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link href="/careers">
                Join Our Team
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