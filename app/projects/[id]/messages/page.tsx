import { notFound, redirect } from 'next/navigation'
import { requireHomeowner } from '@/lib/auth'
import { getProject } from '@/lib/supabase/database'
import { MessageThread } from '@/components/projects/MessageThread'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDateRelative } from '@/lib/utils/date'

interface ProjectMessagesPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectMessagesPage({ params }: ProjectMessagesPageProps) {
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
              <Link 
                href={`/projects/${project.id}`} 
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Messages</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-lg font-medium text-gray-700">{project.title}</span>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {project.address?.city}, {project.address?.state}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Created {formatDateRelative(project.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong>Response Time:</strong>
                  <p className="text-gray-600">We aim to respond within 2-4 hours during business days.</p>
                </div>
                
                <div>
                  <strong>Action Items:</strong>
                  <p className="text-gray-600">Mark messages as action items to ensure important tasks are tracked.</p>
                </div>
                
                <div>
                  <strong>File Sharing:</strong>
                  <p className="text-gray-600">Upload photos, documents, and other files directly in the chat.</p>
                </div>

                <div>
                  <strong>Urgent Issues:</strong>
                  <p className="text-gray-600">For urgent matters, please call our support line at (555) 123-4567.</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong>Project Type:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.project_type?.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Budget Range:</strong>
                  <p className="text-gray-600">{project.budget_range || 'Not specified'}</p>
                </div>

                <div>
                  <strong>Timeline:</strong>
                  <p className="text-gray-600">{project.timeline_preference || 'Flexible'}</p>
                </div>

                <div className="pt-3 border-t">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Full Project Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <div className="lg:col-span-3">
            <MessageThread 
              projectId={project.id}
              currentUserId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}