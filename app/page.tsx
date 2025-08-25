'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavigationHeader } from '@/components/layout/navigation-header'
import { Footer } from '@/components/layout/footer'
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget'
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Home,
  MessageSquare,
  Calendar,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Building,
  Hammer,
  PaintBucket,
  Wrench,
  Heart,
  TrendingUp,
  Award
} from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <NavigationHeader />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-brand-warm-white via-brand-cream to-brand-sand/30">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" style={{backgroundColor: '#7c9885', color: '#ffffff', border: '1px solid #95ad9e'}}>
                <Heart className="h-3 w-3 mr-1" />
                Trusted by 500+ Homeowners
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6" style={{color: '#2c3e50'}}>
                Your Dream Home,
                <span className="block mt-2" style={{color: '#c1414f'}}>Without the Stress</span>
              </h1>
              <p className="text-xl text-brand-stone leading-relaxed mb-8">
                Finally, a renovation experience that puts you first. 
                We handle the contractors, timelines, and budgets—so you can 
                focus on creating memories in your beautiful new space.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group text-white shadow-lg hover:shadow-xl transition-all px-8" style={{backgroundColor: '#c1414f'}} asChild>
                  <Link href="/intake">
                    Get Your Free Quote
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-brand-stone text-brand-navy hover:bg-brand-sand/50" asChild>
                  <Link href="#calculator">
                    Estimate Costs
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-brand-sage mr-2" />
                  <span className="text-sm text-brand-stone-dark">Free consultation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-brand-sage mr-2" />
                  <span className="text-sm text-brand-stone-dark">Licensed & insured</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-brand-sage mr-2" />
                  <span className="text-sm text-brand-stone-dark">100% satisfaction</span>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Hero image placeholder with overlay stats */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-brand-terracotta/10 via-brand-sage/10 to-brand-clay/10 p-8">
                  <img 
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop" 
                    alt="Beautiful renovated kitchen"
                    className="rounded-xl shadow-lg w-full h-auto"
                  />
                  {/* Floating stats cards */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-brand-sage" />
                        <span className="text-sm font-semibold text-brand-navy">$2.5M+</span>
                      </div>
                      <span className="text-xs text-brand-stone">Projects Managed</span>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-brand-clay" />
                        <span className="text-sm font-semibold text-brand-navy">95%</span>
                      </div>
                      <span className="text-xs text-brand-stone">On-Time Delivery</span>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-brand-navy">4.9/5</span>
                      </div>
                      <span className="text-xs text-brand-stone">Homeowner Rating</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Trust indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-stone">
                <ShieldCheck className="h-4 w-4 text-brand-sage" />
                <span>All contractors background checked & insured</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white border-y border-brand-sand/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-brand-stone">
            <span className="text-sm font-medium">As featured in:</span>
            <span className="text-lg font-serif text-brand-navy">San Francisco Chronicle</span>
            <span className="text-lg font-serif text-brand-navy">Better Homes & Gardens</span>
            <span className="text-lg font-serif text-brand-navy">This Old House</span>
            <span className="text-lg font-serif text-brand-navy">HGTV Magazine</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-brand-cream/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-brand-navy mb-4">
              Why Homeowners Love Working With Us
            </h2>
            <p className="text-xl text-brand-stone max-w-3xl mx-auto leading-relaxed">
              We've reimagined the renovation experience to be transparent, 
              stress-free, and actually enjoyable.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-brand-sand/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="h-12 w-12 bg-brand-terracotta/10 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-terracotta" />
                </div>
                <CardTitle className="font-serif text-xl text-brand-navy">Vetted Contractors You Can Trust</CardTitle>
                <CardDescription className="text-brand-stone">
                  Every contractor is background-checked, licensed, and carries $2M insurance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">5+ years minimum experience</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">References verified</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Quality guarantee on all work</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-sand/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="h-12 w-12 bg-brand-sage/10 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-brand-sage" />
                </div>
                <CardTitle className="font-serif text-xl text-brand-navy">Stay In Control, Every Step</CardTitle>
                <CardDescription className="text-brand-stone">
                  Real-time updates, photos, and direct messaging keep you informed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Daily progress photos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Direct contractor messaging</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Milestone notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brand-sand/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="h-12 w-12 bg-brand-clay/10 rounded-2xl flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-brand-clay" />
                </div>
                <CardTitle className="font-serif text-xl text-brand-navy">Fair, Transparent Pricing</CardTitle>
                <CardDescription className="text-brand-stone">
                  No surprises—know exactly where every dollar goes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Upfront detailed quotes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Secure escrow payments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-brand-sage mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-stone-dark">Change order approval</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-brand-warm-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-brand-navy mb-4">
              How We Make Renovation Simple
            </h2>
            <p className="text-xl text-brand-stone">
              From first call to final walkthrough—we're with you every step
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Share Your Project',
                description: 'Tell us about your renovation needs, budget, and timeline',
                icon: Home
              },
              {
                step: '2',
                title: 'Get Matched',
                description: 'Our AI matches you with pre-vetted contractors perfect for your project',
                icon: Users
              },
              {
                step: '3',
                title: 'Compare & Choose',
                description: 'Review proposals, portfolios, and ratings to select your contractor',
                icon: CheckCircle
              },
              {
                step: '4',
                title: 'Manage & Complete',
                description: 'Use our tools to manage your project from start to finish',
                icon: Star
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-terracotta text-white text-2xl font-bold mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-serif font-semibold mb-2 text-brand-navy">{item.title}</h3>
                  <p className="text-brand-stone">{item.description}</p>
                </div>
                {index < 3 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-brand-sand" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-brand-cream/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-brand-navy mb-4">
              Real Homeowners, Real Transformations
            </h2>
            <p className="text-xl text-brand-stone">
              See why families trust us with their most important investment
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah & Mark Johnson',
                location: 'San Francisco, CA',
                project: 'Dream Kitchen Makeover',
                review: 'After 15 years in our home, we finally got the kitchen we always wanted. RenovationAdvisor made what seemed impossible feel easy. Our contractor was amazing!',
                rating: 5,
                savings: '$8,000'
              },
              {
                name: 'Michael Chen',
                location: 'Palo Alto, CA',
                project: 'Master Bath Sanctuary',
                review: 'I was terrified of contractor horror stories, but RenovationAdvisor gave me complete peace of mind. Daily photos, clear communication—I felt in control the whole time.',
                rating: 5,
                savings: '$5,500'
              },
              {
                name: 'The Rodriguez Family',
                location: 'San Jose, CA',
                project: 'Whole Home Refresh',
                review: 'With three kids, we needed this project done RIGHT and ON TIME. They delivered on both. Our home feels like a completely new place, and the kids love it!',
                rating: 5,
                savings: '$12,000'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-brand-sand/20 shadow-lg hover:shadow-xl transition-all relative">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-brand-sage/10 text-brand-sage-dark border-brand-sage/20">
                      Saved {testimonial.savings}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-serif text-brand-navy">{testimonial.name}</CardTitle>
                  <CardDescription className="text-brand-stone">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {testimonial.location} • {testimonial.project}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-brand-stone-dark italic leading-relaxed">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-terracotta via-brand-terracotta-dark to-brand-navy relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20c-11.046 0-20-8.954-20-20z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-serif font-bold text-white mb-4">
            Ready to Love Your Home Again?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 500+ homeowners who chose the stress-free way to renovate. 
            Get your free quote in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group bg-white text-brand-terracotta hover:bg-brand-cream font-semibold px-8" asChild>
              <Link href="/intake">
                Get My Free Quote
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-6" asChild>
              <Link href="tel:1-800-RENOVATE">
                <Phone className="h-4 w-4 mr-2" />
                Call 1-800-RENOVATE
              </Link>
            </Button>
          </div>
          <p className="text-sm text-white/70 mt-4">Free consultation • No obligation • Licensed & insured</p>
        </div>
      </section>

      <Footer />

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </main>
  )
}