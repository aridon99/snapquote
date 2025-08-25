'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Home,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Heart,
  Lightbulb,
  TrendingUp,
  Zap,
  Globe,
  Shield,
  Award,
  Coffee,
  Plane,
  GraduationCap,
  Building,
  Code,
  Palette,
  BarChart3,
  Headphones
} from 'lucide-react'

export default function CareersPage() {
  const jobOpenings = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      experience: "5+ years",
      description: "Join our engineering team to build the future of home renovation technology. Work with React, Node.js, and AI/ML systems.",
      requirements: [
        "5+ years of full-stack development experience",
        "Proficiency in React, Node.js, TypeScript",
        "Experience with cloud platforms (AWS, GCP)",
        "Knowledge of AI/ML systems is a plus"
      ],
      salary: "$140,000 - $180,000"
    },
    {
      title: "Product Manager - AI & Matching",
      department: "Product",
      location: "San Francisco, CA / Remote",
      type: "Full-time", 
      experience: "3+ years",
      description: "Lead product strategy for our AI-powered contractor matching system. Define requirements and roadmap for ML features.",
      requirements: [
        "3+ years of product management experience",
        "Experience with AI/ML products",
        "Strong analytical and data-driven mindset",
        "Background in marketplace or matching platforms preferred"
      ],
      salary: "$120,000 - $160,000"
    },
    {
      title: "UX/UI Designer",
      department: "Design",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      experience: "3+ years",
      description: "Design intuitive experiences for homeowners and contractors. Create beautiful, functional interfaces that simplify complex workflows.",
      requirements: [
        "3+ years of UX/UI design experience",
        "Proficiency in Figma, Sketch, or similar tools",
        "Strong portfolio demonstrating user-centered design",
        "Experience with design systems and component libraries"
      ],
      salary: "$100,000 - $140,000"
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Austin, TX / Remote",
      type: "Full-time",
      experience: "2+ years",
      description: "Help contractors and homeowners succeed on our platform. Build relationships, provide support, and drive customer satisfaction.",
      requirements: [
        "2+ years in customer success or account management",
        "Excellent communication and relationship building skills",
        "Experience with SaaS platforms",
        "Construction or home services background preferred"
      ],
      salary: "$70,000 - $90,000"
    },
    {
      title: "Data Scientist - ML Engineering",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      experience: "4+ years",
      description: "Build and improve our AI matching algorithms. Work with large datasets to optimize contractor-homeowner matching accuracy.",
      requirements: [
        "4+ years of data science/ML engineering experience",
        "Proficiency in Python, TensorFlow/PyTorch",
        "Experience with recommendation systems",
        "PhD in relevant field preferred"
      ],
      salary: "$130,000 - $170,000"
    },
    {
      title: "Sales Development Representative",
      department: "Sales",
      location: "Remote",
      type: "Full-time",
      experience: "1+ years",
      description: "Generate new business opportunities by reaching out to contractors and building our contractor network nationwide.",
      requirements: [
        "1+ years of sales or business development experience",
        "Strong communication and interpersonal skills",
        "Experience with CRM systems (Salesforce, HubSpot)",
        "Construction industry knowledge is a plus"
      ],
      salary: "$50,000 - $70,000 + commission"
    }
  ]

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance. Mental health support and wellness stipend."
    },
    {
      icon: Plane,
      title: "Flexible Time Off",
      description: "Unlimited PTO policy with encouraged minimum vacation time. Paid parental leave for new parents."
    },
    {
      icon: GraduationCap,
      title: "Learning & Development", 
      description: "$2,000 annual learning budget for courses, conferences, and professional development."
    },
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Market-rate salaries with equity participation. Annual performance bonuses and salary reviews."
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Flexible working hours and remote-first culture. Home office setup stipend."
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Work with passionate, talented people who care about making a difference in the industry."
    }
  ]

  const values = [
    {
      icon: Heart,
      title: "Customer Obsession",
      description: "We put homeowners and contractors at the center of everything we do."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We constantly push boundaries to solve complex problems with simple solutions."
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We build trust through honest communication and transparent processes."
    },
    {
      icon: TrendingUp,
      title: "Continuous Growth",
      description: "We embrace learning, feedback, and continuous improvement in all we do."
    }
  ]

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "Engineering": return Code
      case "Product": return Lightbulb
      case "Design": return Palette
      case "Customer Success": return Headphones
      case "Sales": return BarChart3
      default: return Building
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Engineering": return "bg-blue-100 text-blue-800"
      case "Product": return "bg-green-100 text-green-800"
      case "Design": return "bg-purple-100 text-purple-800"
      case "Customer Success": return "bg-orange-100 text-orange-800"
      case "Sales": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

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
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
              <Link href="/careers" className="text-blue-600 font-medium">Careers</Link>
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
              <Users className="h-3 w-3 mr-1" />
              Join Our Team
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Build the Future of
              <span className="text-blue-600"> Home Renovation</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join a passionate team dedicated to transforming how homeowners and contractors 
              connect, collaborate, and create amazing spaces together.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">$12M</div>
                <div className="text-sm text-gray-600">Series A Raised</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Remote Friendly</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">4.8★</div>
                <div className="text-sm text-gray-600">Glassdoor Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-blue-200">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why You'll Love Working Here</h2>
            <p className="text-xl text-gray-600">Comprehensive benefits and perks for our team</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <benefit.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Join our growing team and make an impact</p>
          </div>
          
          <div className="space-y-6">
            {jobOpenings.map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const Icon = getDepartmentIcon(job.department)
                            return <Icon className="h-5 w-5 text-blue-600" />
                          })()}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                          <Badge className={getDepartmentColor(job.department)} variant="secondary">
                            {job.department}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{job.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Requirements:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {job.requirements.slice(0, 2).map((req, reqIndex) => (
                            <li key={reqIndex} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {job.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {job.type} • {job.experience}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {job.salary}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <Button className="w-full" asChild>
                        <Link href={`/careers/apply?position=${encodeURIComponent(job.title)}`}>
                          Apply Now
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/careers/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Don't see a position that fits? We're always looking for talented people.
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Send Us Your Resume
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Culture */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Life at RenovationAdvisor
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Collaborative Environment</h4>
                    <p className="text-gray-600">Work closely with talented teammates across all functions in a supportive, inclusive environment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                    <p className="text-gray-600">Rapid career advancement opportunities as we scale. Take on new challenges and expand your skillset.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Remote-First Culture</h4>
                    <p className="text-gray-600">Work from anywhere with quarterly team meetups in amazing locations around the country.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">Team Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">95%</div>
                    <div className="text-sm text-gray-600">Employee satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">15+</div>
                    <div className="text-sm text-gray-600">Countries represented</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">92%</div>
                    <div className="text-sm text-gray-600">Would recommend as workplace</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Hiring Process</h2>
            <p className="text-xl text-gray-600">Transparent, efficient, and designed to get to know you</p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Application Review",
                description: "We review your application and resume within 3 business days",
                duration: "1-3 days"
              },
              {
                step: "2", 
                title: "Initial Interview",
                description: "30-minute video call with hiring manager to discuss your background",
                duration: "30 minutes"
              },
              {
                step: "3",
                title: "Technical Assessment",
                description: "Role-specific evaluation (coding challenge, case study, or portfolio review)",
                duration: "1-2 hours"
              },
              {
                step: "4",
                title: "Final Interviews",
                description: "Meet the team and leadership. Cultural fit and final evaluation",
                duration: "2-3 hours"
              }
            ].map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white text-lg font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {step.duration}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{step.description}</p>
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
            Ready to Join Our Mission?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Help us transform the home renovation industry and make a meaningful impact 
            on how people improve their spaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="#open-positions">
                View Open Positions
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link href="/about">
                Learn About Us
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
                Join us in transforming home renovation through technology and innovation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Open Roles</h4>
              <ul className="space-y-2">
                <li><Link href="/careers#engineering" className="hover:text-white">Engineering</Link></li>
                <li><Link href="/careers#product" className="hover:text-white">Product</Link></li>
                <li><Link href="/careers#design" className="hover:text-white">Design</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-white">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 RenovationAdvisor. All rights reserved. | Equal Opportunity Employer</p>
          </div>
        </div>
      </footer>
    </main>
  )
}