import { Contractor } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Star, MapPin, Phone, Mail, Clock, Award, Verified, TrendingUp } from 'lucide-react'

interface ContractorCardProps {
  contractor: Contractor & { matchScore?: number }
  onSelect?: (contractor: Contractor) => void
}

export function ContractorCard({ contractor, onSelect }: ContractorCardProps) {
  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available Now</Badge>
      case 'busy_2_weeks':
        return <Badge className="bg-yellow-100 text-yellow-800">Available in 2 weeks</Badge>
      case 'busy_month':
        return <Badge className="bg-orange-100 text-orange-800">Available in 1 month</Badge>
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getPriceRangeBadge = (range: string) => {
    switch (range) {
      case 'budget':
        return <Badge variant="outline">Budget Friendly</Badge>
      case 'mid-range':
        return <Badge variant="outline">Mid Range</Badge>
      case 'premium':
        return <Badge variant="outline">Premium</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 group">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={(contractor as any).avatar_url} alt={contractor.business_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {contractor.business_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{contractor.business_name}</CardTitle>
              {(contractor as any).verified_at && (
                <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <CardDescription className="flex items-center gap-2 mb-2">
              <span>{contractor.contact_name}</span>
              {contractor.matchScore && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {contractor.matchScore}% match
                </Badge>
              )}
            </CardDescription>

            {/* Rating with Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {contractor.rating?.toFixed(1) || 'N/A'}
                </span>
              </div>
              
              {contractor.rating && (
                <div className="flex-1 max-w-[100px]">
                  <Progress value={(contractor.rating / 5) * 100} className="h-2" />
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                <span>{contractor.completed_projects} projects</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Specialties */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Specialties</h4>
          <div className="flex flex-wrap gap-1">
            {contractor.specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>Serves: {contractor.service_areas.join(', ')}</span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            <span>{contractor.phone}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            <span>{contractor.email}</span>
          </div>
        </div>

        {/* Availability and Price Range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            {getAvailabilityBadge(contractor.availability_status)}
          </div>
          {getPriceRangeBadge(contractor.price_range)}
        </div>

        {/* License Info */}
        {contractor.license_number && (
          <div className="text-xs text-gray-500">
            License: {contractor.license_number}
          </div>
        )}

        {/* Notes */}
        {contractor.notes && (
          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
            {contractor.notes}
          </div>
        )}

        {/* Action Button */}
        {onSelect && (
          <Button 
            onClick={() => onSelect(contractor)}
            className="w-full"
            disabled={contractor.availability_status === 'unavailable'}
          >
            {contractor.availability_status === 'unavailable' 
              ? 'Currently Unavailable' 
              : 'Select Contractor'
            }
          </Button>
        )}
      </CardContent>
    </Card>
  )
}