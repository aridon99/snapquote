'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Shield,
  Star,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface ContractorData {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  trade: string
  license_number?: string
  license_type?: string
  insurance_info?: any
  insurance_expiry?: string
  service_areas?: string[]
  notes?: string
  is_active: boolean
  price_range: string
  availability_status: string
  rating?: number
  completed_projects: number
}

export default function ContractorProfile() {
  const [contractor, setContractor] = useState<ContractorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    phone: '',
    license_number: '',
    license_type: 'licensed',
    insurance_expiry: '',
    service_areas: '',
    notes: '',
    availability_status: 'available',
    price_range: 'mid-range'
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadContractorProfile()
  }, [])

  const loadContractorProfile = async () => {
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
        setFormData({
          business_name: contractorData.business_name || '',
          contact_name: contractorData.contact_name || '',
          phone: contractorData.phone || '',
          license_number: contractorData.license_number || '',
          license_type: contractorData.license_type || 'licensed',
          insurance_expiry: contractorData.insurance_expiry || '',
          service_areas: contractorData.service_areas?.join(', ') || '',
          notes: contractorData.notes || '',
          availability_status: contractorData.availability_status || 'available',
          price_range: contractorData.price_range || 'mid-range'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!contractor) return

    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('contractors')
        .update({
          business_name: formData.business_name,
          contact_name: formData.contact_name,
          phone: formData.phone.replace(/\D/g, ''),
          license_number: formData.license_number || null,
          license_type: formData.license_type,
          insurance_expiry: formData.insurance_expiry || null,
          service_areas: formData.service_areas.split(',').map(area => area.trim()).filter(Boolean),
          notes: formData.notes || null,
          availability_status: formData.availability_status,
          price_range: formData.price_range,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractor.id)

      if (error) throw error

      // Update onboarding progress if profile is now complete
      const isProfileComplete = !!(
        formData.business_name &&
        formData.contact_name &&
        formData.phone &&
        (formData.license_number || formData.license_type === 'handyman')
      )

      if (isProfileComplete) {
        await supabase
          .from('contractor_onboarding_progress')
          .upsert({
            contractor_id: contractor.id,
            profile_complete: true,
            profile_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      setContractor(prev => prev ? { 
        ...prev, 
        ...formData,
        service_areas: formData.service_areas.split(',').map(area => area.trim()).filter(Boolean)
      } : null)
      toast.success('Profile updated successfully!')
      
      // Refresh the page data
      await loadContractorProfile()
      
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile changes')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateProfileCompletion = () => {
    const fields = [
      formData.business_name,
      formData.contact_name, 
      formData.phone,
      formData.license_number || (formData.license_type === 'handyman'),
      formData.service_areas,
      formData.notes
    ]
    
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }

  const profileCompletion = calculateProfileCompletion()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/contractor/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Business Profile</h1>
                <p className="text-sm text-gray-500">Manage your business information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Profile Completion Alert */}
        <Card className={`mb-8 ${profileCompletion === 100 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profileCompletion === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              Profile Completion
            </CardTitle>
            <CardDescription>
              {profileCompletion === 100 ? 
                'Your business profile is complete!' : 
                'Complete your profile to improve your visibility to customers'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Profile Progress</span>
                <span className={`font-medium ${profileCompletion === 100 ? 'text-green-700' : 'text-orange-700'}`}>
                  {profileCompletion}%
                </span>
              </div>
              <Progress value={profileCompletion} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Core details about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      placeholder="Your Business LLC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '')
                        let formatted = ''
                        if (digits.length > 0) {
                          if (digits.length <= 3) {
                            formatted = `(${digits}`
                          } else if (digits.length <= 6) {
                            formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                          } else {
                            formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
                          }
                        }
                        handleChange('phone', formatted)
                      }}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={contractor?.email || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="trade">Trade</Label>
                  <Input
                    id="trade"
                    value={contractor?.trade === 'both' ? 'Plumber & Electrician' : 
                           contractor?.trade === 'plumber' ? 'Plumber' : 'Electrician'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* License & Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  License & Insurance
                </CardTitle>
                <CardDescription>
                  Professional credentials and insurance information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_type">License Type</Label>
                    <select
                      id="license_type"
                      value={formData.license_type}
                      onChange={(e) => handleChange('license_type', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="licensed">Licensed Contractor</option>
                      <option value="handyman">Handyman</option>
                      <option value="specialty">Specialty License</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => handleChange('license_number', e.target.value)}
                      placeholder="123456789"
                      disabled={formData.license_type === 'handyman'}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => handleChange('insurance_expiry', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Business Details
                </CardTitle>
                <CardDescription>
                  Service areas and additional information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_range">Price Range</Label>
                    <select
                      id="price_range"
                      value={formData.price_range}
                      onChange={(e) => handleChange('price_range', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="budget">Budget-Friendly</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="availability_status">Availability</Label>
                    <select
                      id="availability_status"
                      value={formData.availability_status}
                      onChange={(e) => handleChange('availability_status', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="available">Available Now</option>
                      <option value="busy_2_weeks">Busy - 2 weeks</option>
                      <option value="busy_month">Busy - 1 month</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="service_areas">Service Areas</Label>
                  <Input
                    id="service_areas"
                    value={formData.service_areas}
                    onChange={(e) => handleChange('service_areas', e.target.value)}
                    placeholder="San Francisco, Oakland, Berkeley"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple areas with commas
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="notes">Business Description</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Tell customers about your business, experience, and specialties..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Complete</span>
                  <Badge variant={profileCompletion === 100 ? 'default' : 'secondary'}>
                    {profileCompletion}%
                  </Badge>
                </div>
                
                {contractor && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {contractor.rating?.toFixed(1) || 'New'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Projects</span>
                      <span className="text-sm font-medium">{contractor.completed_projects}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant={contractor.is_active ? 'default' : 'secondary'}>
                        {contractor.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/contractor/pricing">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Pricing
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/contractor/invoices">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Invoices
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/contractor/dashboard">
                    <Building className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Profile Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>✓ Complete all fields for better visibility</p>
                <p>✓ Keep license information current</p>
                <p>✓ List all service areas you cover</p>
                <p>✓ Write a detailed business description</p>
                <p>✓ Update availability status regularly</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}