'use client'

import { SearchFilters } from '@/components/search/SearchFilters'
import { ContractorList } from '@/components/contractors/ContractorList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Users, Home } from 'lucide-react'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Search className="w-6 h-6 mr-3" />
              Search & Discover
            </h1>
            <p className="text-gray-600 mt-1">
              Find contractors, explore projects, and discover renovation inspiration
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="contractors" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="contractors" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Find Contractors
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Browse Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contractors">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <SearchFilters
                  type="contractors"
                  onFiltersChange={(filters) => {
                    console.log('Contractor filters changed:', filters)
                    // TODO: Implement filtering logic
                  }}
                />
              </div>

              {/* Results */}
              <div className="lg:col-span-3">
                <ContractorList showMatchForm={false} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <SearchFilters
                  type="projects"
                  onFiltersChange={(filters) => {
                    console.log('Project filters changed:', filters)
                    // TODO: Implement filtering logic
                  }}
                />
              </div>

              {/* Results */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Gallery</CardTitle>
                    <CardDescription>
                      Explore completed renovation projects for inspiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                      <p>Project gallery and case studies will be available soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}