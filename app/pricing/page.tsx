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
  Zap,
  Crown,
  Users,
  MessageSquare,
  DollarSign,
  Shield,
  Bot,
  Calendar,
  Phone,
  Headphones,
  X
} from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "Always",
      description: "Perfect for exploring the platform and small projects",
      icon: Home,
      color: "gray",
      features: [
        "Create 1 project",
        "AI contractor matching",
        "Basic messaging",
        "Project timeline",
        "Photo uploads (up to 10)",
        "Email notifications",
        "Community support"
      ],
      limitations: [
        "Limited to 1 active project",
        "Basic contractor search only",
        "No video calls",
        "No priority support"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "Everything you need for successful renovations",
      icon: Star,
      color: "blue",
      features: [
        "Unlimited projects",
        "Advanced AI matching",
        "Real-time messaging",
        "Video consultations", 
        "Unlimited photo/file uploads",
        "Budget tracking & escrow",
        "Change order management",
        "Email & SMS notifications",
        "Priority email support",
        "Project analytics",
        "Document generation"
      ],
      limitations: [],
      cta: "Start 14-Day Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "Contact us",
      description: "For property managers and large-scale operations",
      icon: Crown,
      color: "purple",
      features: [
        "Everything in Professional",
        "Multi-property management",
        "Team collaboration tools",
        "Custom integrations",
        "Advanced analytics & reporting",
        "White-label options",
        "Dedicated account manager",
        "24/7 phone support",
        "SLA guarantees",
        "Custom onboarding",
        "API access"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ]

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100'
      case 'purple': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getBorderColor = (color: string, popular: boolean) => {
    if (popular) return 'border-blue-500 shadow-lg'
    switch (color) {
      case 'blue': return 'border-blue-200'
      case 'purple': return 'border-purple-200'
      default: return 'border-gray-200'
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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-blue-600 font-medium">Pricing</Link>
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
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Simple, Transparent
              <span className="text-blue-600"> Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that fits your renovation needs. Start free, upgrade anytime, 
              cancel whenever you want.
            </p>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-600">14-day free trial</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-600">No setup fees</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-600">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${getBorderColor(plan.color, plan.popular)}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`h-12 w-12 ${getIconColor(plan.color)} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== "Always" && plan.period !== "Contact us" && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                    {plan.period === "Always" && (
                      <span className="text-gray-600 ml-1 text-lg">{plan.period}</span>
                    )}
                    {plan.period === "Contact us" && (
                      <span className="text-gray-600 ml-1 text-lg">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                      {plan.cta}
                    </Link>
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start">
                            <X className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Plans</h2>
            <p className="text-xl text-gray-600">See what's included in each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium text-gray-900">Features</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Starter</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900 bg-blue-50">Professional</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: "Active Projects", starter: "1", professional: "Unlimited", enterprise: "Unlimited" },
                  { feature: "AI Contractor Matching", starter: "✓", professional: "✓", enterprise: "✓" },
                  { feature: "Real-time Messaging", starter: "Basic", professional: "✓", enterprise: "✓" },
                  { feature: "Video Consultations", starter: "✗", professional: "✓", enterprise: "✓" },
                  { feature: "Budget Tracking", starter: "✗", professional: "✓", enterprise: "✓" },
                  { feature: "Escrow Protection", starter: "✗", professional: "✓", enterprise: "✓" },
                  { feature: "Document Generation", starter: "✗", professional: "✓", enterprise: "✓" },
                  { feature: "Multi-property Management", starter: "✗", professional: "✗", enterprise: "✓" },
                  { feature: "Team Collaboration", starter: "✗", professional: "✗", enterprise: "✓" },
                  { feature: "API Access", starter: "✗", professional: "✗", enterprise: "✓" },
                  { feature: "Support", starter: "Community", professional: "Email", enterprise: "24/7 Phone" }
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4 text-gray-900">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.starter}</td>
                    <td className="py-4 px-4 text-center text-gray-900 bg-blue-50">{row.professional}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Get answers to common pricing questions</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              {
                question: "Is there really a free plan?",
                answer: "Yes! Our Starter plan is completely free forever. You can create one project, get AI contractor matches, and experience the platform with no time limits or credit card required."
              },
              {
                question: "What happens during the 14-day free trial?",
                answer: "You get full access to Professional plan features for 14 days. No credit card required to start. After the trial, you can choose to continue with Professional, downgrade to Starter, or cancel."
              },
              {
                question: "Can I change my plan anytime?",
                answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
              },
              {
                question: "Do contractors pay to use the platform?",
                answer: "Contractors have their own subscription plans to access the platform and receive project matches. Homeowners and contractors are billed separately."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover) and PayPal. Enterprise customers can also pay by invoice."
              },
              {
                question: "Is there a setup fee?",
                answer: "No setup fees, ever. You only pay the monthly subscription fee for your chosen plan."
              },
              {
                question: "Can I get a refund?",
                answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
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
            Ready to Start Your Renovation?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of homeowners who've successfully completed their projects with RenovationAdvisor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/intake">
                Start Free Today
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