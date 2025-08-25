'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import Link from 'next/link'

// Mock milestone data - in production this would come from the database
const mockMilestones = [
  {
    id: '1',
    projectId: 'proj-1',
    projectTitle: 'Kitchen Renovation',
    title: 'Demolition & Site Prep',
    dueDate: '2024-09-30',
    status: 'in_progress' as const,
    type: 'construction' as const
  },
  {
    id: '2',
    projectId: 'proj-1',
    projectTitle: 'Kitchen Renovation',
    title: 'Progress Payment (50%)',
    dueDate: '2024-10-25',
    status: 'upcoming' as const,
    type: 'payment' as const
  },
  {
    id: '3',
    projectId: 'proj-2',
    projectTitle: 'Bathroom Remodel',
    title: 'Permits & Approvals',
    dueDate: '2024-08-20',
    status: 'overdue' as const,
    type: 'permits' as const
  },
  {
    id: '4',
    projectId: 'proj-2',
    projectTitle: 'Bathroom Remodel',
    title: 'Initial Planning & Design',
    dueDate: '2024-08-15',
    status: 'completed' as const,
    type: 'planning' as const
  }
]

interface MilestoneOverviewProps {
  className?: string
}

export function MilestoneOverview({ className }: MilestoneOverviewProps) {
  const today = new Date()
  
  // Categorize milestones
  const upcomingMilestones = mockMilestones
    .filter(m => m.status === 'upcoming' && isBefore(new Date(m.dueDate), addDays(today, 7)))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  
  const overdueMilestones = mockMilestones
    .filter(m => m.status === 'overdue' || (m.status === 'upcoming' && isAfter(today, new Date(m.dueDate))))
  
  const inProgressMilestones = mockMilestones
    .filter(m => m.status === 'in_progress')
  
  const recentlyCompleted = mockMilestones
    .filter(m => m.status === 'completed')
    .slice(0, 3)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'permits':
        return 'bg-purple-100 text-purple-800'
      case 'construction':
        return 'bg-orange-100 text-orange-800'
      case 'inspection':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueMilestones.length}</div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{inProgressMilestones.length}</div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{upcomingMilestones.length}</div>
                <div className="text-xs text-gray-600">Due This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{recentlyCompleted.length}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Milestones
            </CardTitle>
            <Link href="/dashboard?tab=timeline">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingMilestones.length > 0 ? (
            <div className="space-y-3">
              {upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{milestone.title}</span>
                      <Badge className={getTypeColor(milestone.type)} variant="outline">
                        {milestone.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {milestone.projectTitle} • Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                    <Link href={`/projects/${milestone.projectId}?tab=timeline`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No upcoming milestones this week</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Milestones */}
      {overdueMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Overdue Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{milestone.title}</span>
                      <Badge className={getTypeColor(milestone.type)} variant="outline">
                        {milestone.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-red-600">
                      {milestone.projectTitle} • Was due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-800">
                      Overdue
                    </Badge>
                    <Link href={`/projects/${milestone.projectId}?tab=timeline`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Milestone Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentlyCompleted.length > 0 ? (
            <div className="space-y-3">
              {recentlyCompleted.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{milestone.title}</div>
                      <div className="text-xs text-gray-600">
                        {milestone.projectTitle} • Completed
                      </div>
                    </div>
                  </div>
                  <Link href={`/projects/${milestone.projectId}?tab=timeline`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recently completed milestones</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}