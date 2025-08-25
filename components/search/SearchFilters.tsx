'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  Briefcase
} from 'lucide-react'

export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
  type: 'projects' | 'contractors'
}

export interface SearchFilters {
  query: string
  location: string
  budgetRange: string[]
  projectTypes: string[]
  availability: string[]
  rating: number | null
  priceRange: string[]
  status: string[]
  dateRange: {
    from: string | null
    to: string | null
  }
}

const PROJECT_TYPES = [
  'Kitchen Renovation',
  'Bathroom Renovation',
  'Whole House',
  'Addition',
  'Flooring',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Painting',
  'Landscaping',
  'Other'
]

const BUDGET_RANGES = [
  'under-25k',
  '25-50k',
  '50-100k',
  '100-250k',
  '250k+'
]

const AVAILABILITY_OPTIONS = [
  'available',
  'busy_2_weeks',
  'busy_month',
  'unavailable'
]

const PROJECT_STATUSES = [
  'intake',
  'planning',
  'contractor_selection',
  'in_progress',
  'completed',
  'on_hold'
]

export function SearchFilters({ onFiltersChange, initialFilters, type }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters?.query || '',
    location: initialFilters?.location || '',
    budgetRange: initialFilters?.budgetRange || [],
    projectTypes: initialFilters?.projectTypes || [],
    availability: initialFilters?.availability || [],
    rating: initialFilters?.rating || null,
    priceRange: initialFilters?.priceRange || [],
    status: initialFilters?.status || [],
    dateRange: initialFilters?.dateRange || { from: null, to: null }
  })

  const [isOpen, setIsOpen] = useState(false)

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
  }

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[]
    const updated = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilters({ [key]: updated })
  }

  const clearFilters = () => {
    const cleared: SearchFilters = {
      query: '',
      location: '',
      budgetRange: [],
      projectTypes: [],
      availability: [],
      rating: null,
      priceRange: [],
      status: [],
      dateRange: { from: null, to: null }
    }
    setFilters(cleared)
    onFiltersChange(cleared)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.location) count++
    if (filters.budgetRange.length) count++
    if (filters.projectTypes.length) count++
    if (filters.availability.length) count++
    if (filters.rating) count++
    if (filters.priceRange.length) count++
    if (filters.status.length) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Search & Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search Query */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder={type === 'contractors' ? 'Search contractors...' : 'Search projects...'}
                value={filters.query}
                onChange={(e) => updateFilters({ query: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="City, State"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Budget Range */}
            <div>
              <Label className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Budget Range
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {BUDGET_RANGES.map((range) => (
                  <label
                    key={range}
                    className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                      filters.budgetRange.includes(range)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-checkbox-wrapper
                  >
                    <Checkbox
                      checked={filters.budgetRange.includes(range)}
                      onCheckedChange={() => toggleArrayFilter('budgetRange', range)}
                    />
                    <span className="text-sm">
                      {range === 'under-25k' ? 'Under $25,000' : 
                       range === '250k+' ? '$250,000+' : 
                       '$' + range.replace('k', ',000').replace('-', ' - $')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Project Types */}
            <div>
              <Label className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                Project Types
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                {PROJECT_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                      filters.projectTypes.includes(type)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-checkbox-wrapper
                  >
                    <Checkbox
                      checked={filters.projectTypes.includes(type)}
                      onCheckedChange={() => toggleArrayFilter('projectTypes', type)}
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {type === 'contractors' && (
              <>
                {/* Availability */}
                <div>
                  <Label className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Availability
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABILITY_OPTIONS.map((avail) => (
                      <label
                        key={avail}
                        className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                          filters.availability.includes(avail)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-checkbox-wrapper
                      >
                        <Checkbox
                          checked={filters.availability.includes(avail)}
                          onCheckedChange={() => toggleArrayFilter('availability', avail)}
                        />
                        <span className="text-sm capitalize">
                          {avail.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <Label className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Minimum Rating
                  </Label>
                  <div className="flex space-x-2 mt-2">
                    {[4, 4.5, 5].map((rating) => (
                      <label
                        key={rating}
                        className={`flex items-center space-x-1 p-2 border rounded cursor-pointer transition-colors ${
                          filters.rating === rating
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.rating === rating}
                          onChange={() => updateFilters({ rating })}
                          className="rounded"
                        />
                        <span className="text-sm">{rating}+</span>
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {type === 'projects' && (
              /* Project Status */
              <div>
                <Label>Project Status</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PROJECT_STATUSES.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                        filters.status.includes(status)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-checkbox-wrapper
                    >
                      <Checkbox
                        checked={filters.status.includes(status)}
                        onCheckedChange={() => toggleArrayFilter('status', status)}
                      />
                      <span className="text-sm capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div>
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="from-date" className="text-xs">From</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={filters.dateRange.from || ''}
                    onChange={(e) => updateFilters({ 
                      dateRange: { ...filters.dateRange, from: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="to-date" className="text-xs">To</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={filters.dateRange.to || ''}
                    onChange={(e) => updateFilters({ 
                      dateRange: { ...filters.dateRange, to: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}