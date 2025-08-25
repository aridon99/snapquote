'use client'

import { useState, useEffect } from 'react'
import { Contractor, ContractorMatchRequest } from '@/types/database'
import { ContractorCard } from './ContractorCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ContractorListProps {
  initialFilters?: Partial<ContractorMatchRequest>
  onContractorSelect?: (contractor: Contractor) => void
  showMatchForm?: boolean
}

export function ContractorList({ 
  initialFilters, 
  onContractorSelect,
  showMatchForm = true 
}: ContractorListProps) {
  const [contractors, setContractors] = useState<(Contractor & { matchScore?: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<ContractorMatchRequest>({
    projectType: initialFilters?.projectType || [],
    budgetRange: initialFilters?.budgetRange || '50-100k',
    serviceArea: initialFilters?.serviceArea || '',
    timeline: initialFilters?.timeline || 'planning'
  })

  const searchContractors = async () => {
    if (!filters.serviceArea.trim()) {
      toast.error('Please enter a service area')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/contractors/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch contractors')
      }

      const data = await response.json()
      setContractors(data.contractors || [])
      
      if (data.contractors?.length === 0) {
        toast.error('No contractors found matching your criteria')
      } else {
        toast.success(`Found ${data.contractors.length} matching contractors`)
      }
    } catch (error) {
      console.error('Error searching contractors:', error)
      toast.error('Failed to search contractors')
    } finally {
      setLoading(false)
    }
  }

  // Auto-search if initial filters are provided
  useEffect(() => {
    if (initialFilters?.serviceArea && initialFilters?.projectType?.length) {
      searchContractors()
    }
  }, []) // Only run on mount

  const PROJECT_TYPES = [
    'kitchen', 'bathroom', 'whole_house', 'addition', 'flooring',
    'electrical', 'plumbing', 'roofing', 'painting', 'landscaping', 'general'
  ]

  const handleProjectTypeChange = (type: string) => {
    const current = filters.projectType
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    setFilters(prev => ({ ...prev, projectType: updated }))
  }

  return (
    <div className="space-y-6">
      {showMatchForm && (
        <Card>
          <CardHeader>
            <CardTitle>Find Contractors</CardTitle>
            <CardDescription>
              Search for contractors that match your project requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serviceArea">Service Area (City)</Label>
              <Input
                id="serviceArea"
                value={filters.serviceArea}
                onChange={(e) => setFilters(prev => ({ ...prev, serviceArea: e.target.value }))}
                placeholder="e.g., San Francisco, Palo Alto"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Project Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {PROJECT_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center space-x-2 p-2 border rounded cursor-pointer text-sm ${
                      filters.projectType.includes(type)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-checkbox-wrapper
                  >
                    <Checkbox
                      checked={filters.projectType.includes(type)}
                      onCheckedChange={() => handleProjectTypeChange(type)}
                    />
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetRange">Budget Range</Label>
                <select
                  id="budgetRange"
                  value={filters.budgetRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, budgetRange: e.target.value }))}
                  className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="under-25k">Under $25,000</option>
                  <option value="25-50k">$25,000 - $50,000</option>
                  <option value="50-100k">$50,000 - $100,000</option>
                  <option value="100-250k">$100,000 - $250,000</option>
                  <option value="250k+">$250,000+</option>
                </select>
              </div>

              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <select
                  id="timeline"
                  value={filters.timeline}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="asap">ASAP</option>
                  <option value="3-months">Next 3 months</option>
                  <option value="6-months">Next 6 months</option>
                  <option value="planning">Planning ahead</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={searchContractors} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Contractors
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div>
        {contractors.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              Found {contractors.length} matching contractor{contractors.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-600">
              Contractors are sorted by match score based on your requirements
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {contractors.map((contractor) => (
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              onSelect={onContractorSelect}
            />
          ))}
        </div>

        {!loading && contractors.length === 0 && filters.serviceArea && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or expanding your service area.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}