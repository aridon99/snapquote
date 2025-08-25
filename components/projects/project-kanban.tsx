'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedProgress, BudgetGauge, StatusIndicator } from '@/components/ui/enhanced-progress'
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  AlertCircle, 
  DollarSign,
  Users,
  Clock,
  MoreVertical
} from 'lucide-react'
// Removed dropdown imports for simplicity
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProjectTask {
  id: string
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours?: number
  actualHours?: number
  attachments?: number
  comments?: number
}

interface KanbanProject {
  id: string
  referenceCode: string
  title: string
  status: 'planning' | 'in_progress' | 'waiting' | 'completed'
  allocated: number
  spent: number
  progress: number
  location: string
  homeowner: string
  dueDate: string
  lastActivity: string
  urgentIssues: number
  pendingApprovals: number
  tasks: ProjectTask[]
  milestones: {
    label: string
    value: number
    completed: boolean
    date: string
  }[]
}

interface ProjectKanbanProps {
  projects: KanbanProject[]
  view?: 'kanban' | 'list' | 'timeline'
}

const statusColumns = {
  planning: {
    title: 'Planning',
    color: 'border-blue-200 bg-blue-50',
    icon: '📋',
    description: 'Projects in planning phase'
  },
  in_progress: {
    title: 'In Progress', 
    color: 'border-green-200 bg-green-50',
    icon: '🔨',
    description: 'Active construction work'
  },
  waiting: {
    title: 'Waiting',
    color: 'border-yellow-200 bg-yellow-50', 
    icon: '⏳',
    description: 'Pending approvals or materials'
  },
  completed: {
    title: 'Completed',
    color: 'border-gray-200 bg-gray-50',
    icon: '✅',
    description: 'Finished projects'
  }
}

function ProjectCard({ 
  project
}: { 
  project: KanbanProject
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {project.referenceCode}
            </Badge>
            {project.urgentIssues > 0 && (
              <Badge variant="destructive" className="text-xs">
                {project.urgentIssues} urgent
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {statusColumns[project.status].icon} {statusColumns[project.status].title}
          </Badge>
        </div>
        
        <CardTitle className="text-base leading-tight">{project.title}</CardTitle>
        <CardDescription className="text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.homeowner}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due {project.dueDate}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Section */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <EnhancedProgress 
            value={project.progress}
            milestones={project.milestones}
            size="sm"
            showPercentage={false}
            color={project.progress > 80 ? 'success' : project.progress > 40 ? 'default' : 'warning'}
          />
        </div>

        {/* Budget Section */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Budget</span>
            <span className="font-medium">
              ${project.spent.toLocaleString()} / ${project.allocated.toLocaleString()}
            </span>
          </div>
          <BudgetGauge 
            allocated={project.allocated}
            spent={project.spent}
            size="sm"
            showDetails={false}
          />
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500">Tasks</div>
            <div className="text-sm font-semibold">{project.tasks.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Issues</div>
            <div className={cn(
              "text-sm font-semibold",
              project.urgentIssues > 0 ? "text-red-600" : "text-gray-900"
            )}>
              {project.urgentIssues}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Messages</div>
            <div className="text-sm font-semibold text-blue-600">
              {project.tasks.reduce((sum, task) => sum + (task.comments || 0), 0)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1">
          <Link href={`/projects/${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Details
            </Button>
          </Link>
          <Link href={`/projects/${project.id}/messages`}>
            <Button size="sm" className="text-xs">
              <MessageSquare className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Last Activity */}
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last activity: {project.lastActivity}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ 
  status, 
  projects, 
  config
}: { 
  status: keyof typeof statusColumns
  projects: KanbanProject[]
  config: typeof statusColumns[keyof typeof statusColumns]
}) {
  const projectCount = projects.length
  
  return (
    <div className="flex-1">
      <div className={cn(
        "rounded-lg border-2 border-solid p-4 h-full",
        config.color
      )}>
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{config.title}</h3>
              <p className="text-xs text-gray-500">{config.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {projectCount}
          </Badge>
        </div>

        {/* Projects in Column */}
        <div className="space-y-3 min-h-[500px]">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
            />
          ))}
          
          {/* Add New Project Card */}
          {status === 'planning' && projects.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-lg p-6 text-center">
              <Link href="/intake">
                <Button variant="ghost" className="text-gray-500 hover:text-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Project
                </Button>
              </Link>
            </div>
          )}
          
          {/* Empty state message */}
          {projects.length === 0 && status !== 'planning' && (
            <div className="text-center text-gray-400 text-sm py-8">
              No projects in {config.title.toLowerCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectKanban({ projects, view = 'kanban' }: ProjectKanbanProps) {
  // Group projects by status
  const projectsByStatus = {
    planning: projects.filter(p => p.status === 'planning'),
    in_progress: projects.filter(p => p.status === 'in_progress'), 
    waiting: projects.filter(p => p.status === 'waiting'),
    completed: projects.filter(p => p.status === 'completed')
  }

  // Calculate summary stats
  const totalBudget = projects.reduce((sum, p) => sum + p.allocated, 0)
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0)
  const avgProgress = projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0
  const urgentIssues = projects.reduce((sum, p) => sum + p.urgentIssues, 0)

  if (view === 'kanban') {
    return (
      <div className="space-y-6">
        {/* Summary Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-xl font-bold">${totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Progress</p>
                  <p className="text-xl font-bold">{Math.round(avgProgress)}%</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-xl font-bold">{projectsByStatus.in_progress.length}</p>
                </div>
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent Issues</p>
                  <p className="text-xl font-bold text-red-600">{urgentIssues}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[700px]">
          {Object.entries(statusColumns).map(([status, config]) => (
            <KanbanColumn
              key={status}
              status={status as keyof typeof statusColumns}
              projects={projectsByStatus[status as keyof typeof projectsByStatus]}
              config={config}
            />
          ))}
        </div>
      </div>
    )
  }

  // List View
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {project.referenceCode}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {statusColumns[project.status].icon} {statusColumns[project.status].title}
                    </Badge>
                    <h3 className="font-semibold">{project.title}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Progress: {project.progress}%</div>
                    <div>Budget: ${project.spent.toLocaleString()}/${project.allocated.toLocaleString()}</div>
                    <div>Due: {project.dueDate}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Timeline View
  if (view === 'timeline') {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline View</h3>
          <p className="text-gray-500">
            Timeline view with project schedules and milestones coming soon!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This will show projects on a calendar timeline with dependencies and critical path analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-500">View not found</p>
    </div>
  )
}