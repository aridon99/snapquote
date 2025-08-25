'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Home,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Tag,
  TrendingUp,
  Lightbulb,
  DollarSign,
  Shield,
  Hammer,
  PaintBucket,
  Building,
  Zap
} from 'lucide-react'

export default function BlogPage() {
  const categories = [
    "All Posts",
    "Renovation Tips",
    "Contractor Guides", 
    "Budget Planning",
    "Technology",
    "Industry News"
  ]

  const featuredPost = {
    title: "The Complete Guide to Planning Your Kitchen Renovation in 2024",
    excerpt: "From setting your budget to choosing the right contractor, this comprehensive guide covers everything you need to know for a successful kitchen remodel.",
    author: "Sarah Chen",
    date: "December 15, 2024",
    readTime: "12 min read",
    category: "Renovation Tips",
    image: "/blog/kitchen-renovation-guide.jpg",
    featured: true
  }

  const blogPosts = [
    {
      title: "How AI is Revolutionizing Contractor Matching",
      excerpt: "Discover how artificial intelligence is making it easier than ever to find the perfect contractor for your renovation project.",
      author: "Michael Rodriguez",
      date: "December 12, 2024",
      readTime: "8 min read",
      category: "Technology",
      image: "/blog/ai-contractor-matching.jpg"
    },
    {
      title: "5 Red Flags to Watch for When Hiring a Contractor",
      excerpt: "Protect yourself from unreliable contractors by learning to spot these warning signs before signing any contracts.",
      author: "Emily Johnson",
      date: "December 10, 2024",
      readTime: "6 min read",
      category: "Contractor Guides",
      image: "/blog/contractor-red-flags.jpg"
    },
    {
      title: "Budget Planning: How to Avoid Renovation Cost Overruns",
      excerpt: "Learn proven strategies to keep your renovation project on budget and avoid the common pitfalls that lead to cost overruns.",
      author: "David Park",
      date: "December 8, 2024",
      readTime: "10 min read",
      category: "Budget Planning",
      image: "/blog/budget-planning.jpg"
    },
    {
      title: "The Rise of Smart Home Technology in Renovations",
      excerpt: "Explore the latest smart home trends and how to incorporate them into your renovation for added convenience and value.",
      author: "Lisa Wang",
      date: "December 5, 2024",
      readTime: "7 min read",
      category: "Technology",
      image: "/blog/smart-home-tech.jpg"
    },
    {
      title: "Bathroom Renovation Trends: What's Hot in 2024",
      excerpt: "Stay ahead of the curve with the latest bathroom design trends that are dominating the renovation scene this year.",
      author: "Maria Garcia",
      date: "December 3, 2024",
      readTime: "9 min read",
      category: "Renovation Tips",
      image: "/blog/bathroom-trends-2024.jpg"
    },
    {
      title: "Understanding Home Renovation Permits: A Complete Guide",
      excerpt: "Navigate the complex world of building permits with this comprehensive guide to what you need and when you need it.",
      author: "James Thompson",
      date: "December 1, 2024",
      readTime: "11 min read",
      category: "Contractor Guides",
      image: "/blog/renovation-permits.jpg"
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Renovation Tips": return Hammer
      case "Contractor Guides": return User
      case "Budget Planning": return DollarSign
      case "Technology": return Zap
      case "Industry News": return TrendingUp
      default: return Lightbulb
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Renovation Tips": return "bg-blue-100 text-blue-800"
      case "Contractor Guides": return "bg-green-100 text-green-800"
      case "Budget Planning": return "bg-purple-100 text-purple-800"
      case "Technology": return "bg-orange-100 text-orange-800"
      case "Industry News": return "bg-gray-100 text-gray-800"
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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/blog" className="text-blue-600 font-medium">Blog</Link>
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
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Renovation
              <span className="text-blue-600"> Insights & Tips</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Expert advice, industry insights, and practical tips to help you navigate 
              your home renovation journey with confidence.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={category === "All Posts" ? "default" : "outline"}
                size="sm"
                className={category === "All Posts" ? "" : "hover:bg-blue-50"}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Featured Article</h2>
            <Card className="overflow-hidden border-blue-200 shadow-lg">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Hammer className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <div className="text-sm text-gray-600">Featured Article Image</div>
                  </div>
                </div>
                <div className="p-8">
                  <Badge className={getCategoryColor(featuredPost.category)} variant="secondary">
                    {featuredPost.category}
                  </Badge>
                  <CardTitle className="text-2xl mt-4 mb-4">{featuredPost.title}</CardTitle>
                  <CardDescription className="text-lg mb-6">{featuredPost.excerpt}</CardDescription>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  
                  <Button className="group" asChild>
                    <Link href="/blog/kitchen-renovation-guide-2024">
                      Read Full Article
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Latest Articles</h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center">
                  <div className="text-center">
                    {(() => {
                      const Icon = getCategoryIcon(post.category)
                      return <Icon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    })()}
                    <div className="text-sm text-gray-600">Article Image</div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <Badge className={getCategoryColor(post.category)} variant="secondary">
                    {post.category}
                  </Badge>
                  
                  <CardTitle className="mt-3 mb-3 line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="mb-4 line-clamp-3">{post.excerpt}</CardDescription>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{post.date}</span>
                    <Button variant="ghost" size="sm" className="group" asChild>
                      <Link href={`/blog/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                        Read More
                        <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated with Renovation Insights
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get the latest tips, guides, and industry news delivered to your inbox weekly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input 
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button>
                Subscribe
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              No spam, unsubscribe at any time. Join 10,000+ renovators getting our weekly insights.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Topics</h2>
            <p className="text-xl text-gray-600">Explore our most read content categories</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Hammer,
                title: "Kitchen Renovations",
                count: "45 articles",
                description: "Complete guides for kitchen remodeling projects"
              },
              {
                icon: PaintBucket,
                title: "Bathroom Renovations", 
                count: "32 articles",
                description: "Transform your bathroom with expert advice"
              },
              {
                icon: Building,
                title: "Whole House Projects",
                count: "28 articles", 
                description: "Large-scale renovation planning and execution"
              },
              {
                icon: DollarSign,
                title: "Budget & Finance",
                count: "38 articles",
                description: "Smart financial planning for renovations"
              },
              {
                icon: Shield,
                title: "Contractor Selection",
                count: "25 articles",
                description: "How to find and hire the right professionals"
              },
              {
                icon: Zap,
                title: "Technology & Tools",
                count: "22 articles",
                description: "Latest tech trends in home improvement"
              }
            ].map((topic, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <topic.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  <CardDescription className="text-blue-600 font-medium">{topic.count}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{topic.description}</p>
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
            Put your knowledge to work. Start your renovation project today with expert guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/intake">
                Start Your Project
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link href="/contractors">
                Find Contractors
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
                Expert insights and practical advice for successful home renovations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Categories</h4>
              <ul className="space-y-2">
                <li><Link href="/blog/category/renovation-tips" className="hover:text-white">Renovation Tips</Link></li>
                <li><Link href="/blog/category/contractor-guides" className="hover:text-white">Contractor Guides</Link></li>
                <li><Link href="/blog/category/budget-planning" className="hover:text-white">Budget Planning</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
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