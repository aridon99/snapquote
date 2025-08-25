'use client'

import { useState, useEffect } from 'react'
import { ProjectProvider, useProjectContext } from '@/lib/providers/project-context'
import { ProjectSwitcher } from '@/components/dashboard/ProjectSwitcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MilestoneOverview } from '@/components/dashboard/MilestoneOverview'
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Users, 
  Hammer,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Home,
  Bell,
  ChevronRight,
  Star,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getShortReferenceCode } from '@/lib/utils/project-reference'

interface Project {
  id: string
  title: string
  status: string
  progress?: number
  budget_range: string
  total_budget: number
  budget_used?: number
  created_at: string
  start_date?: string
  target_end_date?: string
  actual_end_date?: string
  project_type: string[]
  address: any
  contractors?: any[]
  next_milestone?: {
    title: string
    due_date: string
  }
  recent_activity?: {
    type: string
    description: string
    timestamp: string
  }[]
  unread_messages?: number
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  read: boolean
}

function DashboardPageContent() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    upcomingMilestones: 0,
    unreadMessages: 0,
    pendingDecisions: 0
  })

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscriptions
    const projectSubscription = supabase
      .channel('homeowner-projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    const notificationSubscription = supabase
      .channel('homeowner-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      projectSubscription.unsubscribe()
      notificationSubscription.unsubscribe()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      if (profileError) throw profileError
      setUserProfile(profile)

      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          contractors:project_contractors(contractor:contractors(*))
        `)
        .eq('homeowner_id', user?.id)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Process projects with calculated progress
      const processedProjects = projectsData?.map(project => ({
        ...project,
        progress: calculateProjectProgress(project),
        unread_messages: 0 // Would fetch from messages table
      })) || []

      setProjects(processedProjects)

      // Calculate stats
      const activeProjects = processedProjects.filter(p => p.status !== 'completed')
      const totalBudget = processedProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0)
      const totalSpent = processedProjects.reduce((sum, p) => sum + (p.budget_used || 0), 0)

      setStats({
        totalProjects: processedProjects.length,
        activeProjects: activeProjects.length,
        totalBudget,
        totalSpent,
        upcomingMilestones: 3, // Would calculate from milestones
        unreadMessages: 5, // Would calculate from messages
        pendingDecisions: 2 // Would calculate from approvals needed
      })

      // Get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!notificationsError) {
        setNotifications(notificationsData || [])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProjectProgress = (project: any) => {
    if (project.status === 'completed') return 100
    if (project.status === 'in_progress') {
      // Calculate based on time elapsed
      if (project.start_date && project.target_end_date) {
        const start = new Date(project.start_date).getTime()
        const end = new Date(project.target_end_date).getTime()
        const now = new Date().getTime()
        const progress = ((now - start) / (end - start)) * 100
        return Math.min(Math.max(progress, 0), 95) // Cap at 95% until marked complete
      }
      return 50
    }
    if (project.status === 'planning') return 15
    return 0
  }

  const activeProjects = projects?.filter(p => p.status !== 'completed') || []
  const completedProjects = projects?.filter(p => p.status === 'completed') || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {userProfile?.full_name || 'there'}!
                </h1>
                <p className="text-gray-600">
                  Manage your renovation projects and connect with contractors
                </p>
              </div>
              {/* <ProjectSwitcher userRole="owner" /> */}
            </div>
            <Link href="/intake">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications Bar */}
        {notifications.filter(n => !n.read).length > 0 && (
          <div className="mb-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-sm">Recent Notifications</CardTitle>
                  </div>
                  <Badge variant="secondary">{notifications.filter(n => !n.read).length} new</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-24">
                  <div className="space-y-2">
                    {notifications.filter(n => !n.read).slice(0, 3).map(notification => (
                      <div key={notification.id} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/contractors">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Find Contractors</CardTitle>
                    <CardDescription className="text-xs">Browse verified professionals</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/intake">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Start New Project</CardTitle>
                    <CardDescription className="text-xs">Get AI-powered planning</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/advisor/punch-lists">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Hammer className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Voice Punch Lists</CardTitle>
                    <CardDescription className="text-xs">WhatsApp voice management</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalProjects} total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.totalSpent / 1000).toFixed(0)}K
              </div>
              <Progress 
                value={(stats.totalSpent / stats.totalBudget) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingMilestones}</div>
              <p className="text-xs text-muted-foreground">milestones</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">unread</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        {stats.pendingDecisions > 0 && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-sm">Action Required</CardTitle>
                  </div>
                  <Badge variant="destructive">{stats.pendingDecisions} pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You have {stats.pendingDecisions} decisions waiting for your approval
                </p>
                <Button variant="link" className="p-0 text-orange-600 mt-2">
                  Review now <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestone Overview */}
        {activeProjects.length > 0 && (
          <div className="mb-8">
            <MilestoneOverview />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Projects</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="overview" className="mt-6 space-y-8">
          {/* Active Projects */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
              {activeProjects.length === 0 && (
                <Link href="/intake">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Your First Project
                  </Button>
                </Link>
              )}
            </div>

            {activeProjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
                  <p className="text-gray-600 mb-4">
                    Start your renovation journey by creating your first project.
                  </p>
                  <Link href="/intake">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {project.reference_code && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {project.reference_code}
                              </Badge>
                            )}
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                          </div>
                          {project.contractors && project.contractors.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {project.contractors.map((c: any) => c.contractor?.business_name).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant={
                          project.status === 'in_progress' ? 'default' :
                          project.status === 'planning' ? 'secondary' : 
                          'outline'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>
                        {project.address?.city}, {project.address?.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Progress Bar */}
                      {project.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{project.progress?.toFixed(0)}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {project.budget_range || 'Not set'}
                          </span>
                        </div>
                        {project.start_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Timeline:</span>
                            <span>
                              {formatDistanceToNow(new Date(project.target_end_date || project.start_date), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span>{project.project_type?.join(', ') || 'General'}</span>
                        </div>
                        
                        {/* Next Milestone */}
                        {project.next_milestone && (
                          <div className="pt-2 mt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Next: {project.next_milestone.title}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Link href={`/projects/${project.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/messages`}>
                          <Button size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Projects</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <Card key={project.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {project.reference_code && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {project.reference_code}
                              </Badge>
                            )}
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                          </div>
                          {project.contractors && project.contractors.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {project.contractors.map((c: any) => c.contractor?.business_name).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      <CardDescription>
                        {project.address?.city}, {project.address?.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completed:</span>
                          <span>{project.actual_end_date ? formatDistanceToNow(new Date(project.actual_end_date), { addSuffix: true }) : 'Recently'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Final Budget:</span>
                          <span className="font-medium">
                            ${project.total_budget?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="mt-6">
            {activeProjects.length > 0 ? (
              <MilestoneOverview />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active milestones</h3>
                  <p className="text-gray-600">
                    Milestones will appear here when you have active projects.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Updates from your projects and contractors</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Project {project.status === 'completed' ? 'completed' : `is ${project.status.replace('_', ' ')}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                    
                    {projects.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardPageContent />
}