import { notFound, redirect } from 'next/navigation'
import { requireHomeowner } from '@/lib/auth'
import { getProject } from '@/lib/supabase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageThread } from '@/components/projects/MessageThread'
import { BudgetTracker } from '@/components/projects/BudgetTracker'
import { FileUpload } from '@/components/projects/FileUpload'
import { ContractorList } from '@/components/contractors/ContractorList'
import { ProjectTimeline } from '@/components/projects/ProjectTimeline'
import { GanttChart } from '@/components/projects/GanttChart'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Home,
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { formatDateRelative } from '@/lib/utils/date'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const { user, profile } = await requireHomeowner()
  
  const { data: project, error } = await getProject(id)
  
  if (error || !project) {
    notFound()
  }
  
  // Verify user owns this project
  if (project.homeowner_id !== user.id) {
    redirect('/dashboard')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'intake': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'contractor_selection': return 'bg-orange-100 text-orange-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'intake': return 'Project Intake'
      case 'planning': return 'Planning Phase'
      case 'contractor_selection': return 'Selecting Contractor'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'on_hold': return 'On Hold'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-800">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <span className="text-gray-600 text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {project.address?.city}, {project.address?.state}
                  </span>
                  <span className="text-gray-600 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDateRelative(project.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Download Brief
              </Button>
              <Button size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-sm text-gray-900">
                    {project.address?.street}<br />
                    {project.address?.city}, {project.address?.state} {project.address?.zip}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Type</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.project_type?.map((type: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Budget Range</label>
                  <p className="text-sm text-gray-900">{project.budget_range || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Timeline</label>
                  <p className="text-sm text-gray-900">{project.timeline_preference || 'Flexible'}</p>
                </div>

                {project.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {project.target_end_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Target Completion</label>
                    <p className="text-sm text-gray-900">
                      {new Date(project.target_end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="text-sm font-semibold">
                    {project.total_budget ? `$${project.total_budget.toLocaleString()}` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Spent</span>
                  <span className="text-sm font-semibold">
                    ${(project.spent_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="text-sm font-semibold">
                    ${((project.total_budget || 0) - (project.spent_amount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days Active</span>
                  <span className="text-sm font-semibold">
                    {Math.ceil((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Schedule Site Visit
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Request Payment
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Set Milestone
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="budget" className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Budget
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="contractors" className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Contractors
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-6">
                  {/* Project Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {project.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest updates and milestones</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="font-medium text-sm">Project created</div>
                            <div className="text-xs text-gray-600">
                              {formatDateRelative(project.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {project.updated_at !== project.created_at && (
                          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-sm">Project updated</div>
                              <div className="text-xs text-gray-600">
                                {formatDateRelative(project.updated_at)}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-center py-4 text-gray-500 text-sm">
                          More activity will appear as your project progresses
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <div className="space-y-6">
                    <ProjectTimeline 
                      projectId={project.id}
                      canEdit={true}
                    />
                    <GanttChart 
                      milestones={[]}
                      startDate={project.start_date}
                      endDate={project.target_end_date}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="messages">
                  <MessageThread 
                    projectId={project.id}
                    currentUserId={user.id}
                  />
                </TabsContent>

                <TabsContent value="budget">
                  <BudgetTracker 
                    projectId={project.id}
                    totalBudget={project.total_budget || 0}
                  />
                </TabsContent>

                <TabsContent value="files">
                  <FileUpload projectId={project.id} />
                </TabsContent>

                <TabsContent value="contractors">
                  <ContractorList 
                    initialFilters={{
                      projectType: project.project_type || [],
                      budgetRange: project.budget_range || '50-100k',
                      serviceArea: project.address?.city || '',
                      timeline: project.timeline_preference || 'planning'
                    }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}