import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Shield, 
  Calendar,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Contractor } from '@/types/database'

interface ContractorPageProps {
  params: Promise<{ id: string }>
}

export default async function ContractorPage({ params }: ContractorPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: contractor, error } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  
  if (error || !contractor) {
    notFound()
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy_2_weeks': return 'bg-yellow-100 text-yellow-800'
      case 'busy_month': return 'bg-orange-100 text-orange-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available Now'
      case 'busy_2_weeks': return 'Available in 2 weeks'
      case 'busy_month': return 'Available in 1 month'
      case 'unavailable': return 'Currently Unavailable'
      default: return status
    }
  }

  const getPriceRangeLabel = (range: string) => {
    switch (range) {
      case 'budget': return 'Budget-Friendly'
      case 'mid-range': return 'Mid-Range'
      case 'premium': return 'Premium'
      default: return range
    }
  }

  // Mock portfolio data
  const portfolioProjects = [
    {
      id: '1',
      title: 'Modern Kitchen Renovation',
      location: 'Palo Alto, CA',
      completedDate: '2024-01-15',
      budget: '75000',
      images: ['/placeholder-kitchen-1.jpg'],
      description: 'Complete kitchen renovation with custom cabinets and quartz countertops.'
    },
    {
      id: '2',
      title: 'Master Bathroom Remodel',
      location: 'Mountain View, CA',
      completedDate: '2023-11-20',
      budget: '45000',
      images: ['/placeholder-bathroom-1.jpg'],
      description: 'Luxury bathroom remodel with walk-in shower and heated floors.'
    }
  ]

  // Mock reviews
  const reviews = [
    {
      id: '1',
      rating: 5,
      comment: 'Excellent work! The team was professional, on-time, and delivered exactly what we wanted. Highly recommend!',
      author: 'Sarah M.',
      project: 'Kitchen Renovation',
      date: '2024-02-01'
    },
    {
      id: '2',
      rating: 5,
      comment: 'Outstanding quality and attention to detail. The project was completed ahead of schedule and within budget.',
      author: 'Michael R.',
      project: 'Bathroom Remodel',
      date: '2023-12-15'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/search" 
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contractor.business_name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge className={getAvailabilityColor(contractor.availability_status)}>
                    {getAvailabilityLabel(contractor.availability_status)}
                  </Badge>
                  <span className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 fill-current text-yellow-500" />
                    {contractor.rating || 'No rating'} ({contractor.completed_projects} projects)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Person</label>
                  <p className="text-sm text-gray-900">{contractor.contact_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${contractor.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {contractor.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${contractor.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {contractor.phone}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Service Areas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contractor.service_areas?.map((area: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contractor.license_number && (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm">
                      Licensed: {contractor.license_number}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm">Insured & Bonded</span>
                </div>
                
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm">Background Verified</span>
                </div>
                
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm">Platform Vetted</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projects Completed</span>
                  <span className="text-sm font-semibold">{contractor.completed_projects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm font-semibold">{contractor.rating || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Range</span>
                  <span className="text-sm font-semibold">{getPriceRangeLabel(contractor.price_range)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Years Active</span>
                  <span className="text-sm font-semibold">
                    {Math.ceil((new Date().getTime() - new Date(contractor.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Availability
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-6">
                  {/* About */}
                  <Card>
                    <CardHeader>
                      <CardTitle>About {contractor.business_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-700">
                          {contractor.notes || 
                            `${contractor.business_name} is a professional contractor specializing in various home improvement projects. With ${contractor.completed_projects} completed projects and a commitment to quality, we deliver exceptional results for every client.`
                          }
                        </p>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Specialties</h4>
                          <div className="flex flex-wrap gap-2">
                            {contractor.specialties?.map((specialty: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {contractor.tags && contractor.tags.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {contractor.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Portfolio</CardTitle>
                      <CardDescription>Recent completed projects and case studies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {portfolioProjects.map((project) => (
                          <Card key={project.id}>
                            <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <ExternalLink className="w-12 h-12 text-gray-400" />
                            </div>
                            <CardHeader>
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                              <CardDescription>{project.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Completed: {new Date(project.completedDate).toLocaleDateString()}
                                </span>
                                <span className="font-semibold">
                                  ${parseInt(project.budget).toLocaleString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Reviews</CardTitle>
                      <CardDescription>{reviews.length} reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating 
                                        ? 'text-yellow-500 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{review.comment}</p>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{review.author}</span>
                              <span className="mx-2">•</span>
                              <span>{review.project}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="availability" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability & Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Current Status</h4>
                          <Badge className={getAvailabilityColor(contractor.availability_status)}>
                            {getAvailabilityLabel(contractor.availability_status)}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Consultation Booking</h4>
                          <p className="text-gray-600 mb-4">
                            Schedule a free consultation to discuss your project requirements and get a detailed estimate.
                          </p>
                          <Button className="w-full sm:w-auto">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Free Consultation
                          </Button>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Project Timeline</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                              Typical project timelines vary based on scope and complexity. 
                              During your consultation, we'll provide a detailed timeline specific to your project.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}