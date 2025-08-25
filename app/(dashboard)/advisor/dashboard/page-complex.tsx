'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectProvider, useProjectContext } from '@/lib/providers/project-context'
import { ProjectSwitcher } from '@/components/dashboard/ProjectSwitcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  Home,
  Hammer,
  BarChart3,
  Activity,
  Phone,
  Mail,
  ChevronRight,
  Target,
  Zap,
  Shield,
  Award,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getShortReferenceCode } from '@/lib/utils/project-reference'

interface ProjectOverview {
  id: string
  title: string
  status: string
  progress: number
  budget_used: number
  total_budget: number
  homeowner: {
    full_name: string
    email: string
    phone: string
  }
  next_milestone?: string
  issues_count: number
  messages_unread: number
  last_activity: string
}

interface ContractorPerformance {
  id: string
  business_name: string
  completion_rate: number
  on_time_rate: number
  rating: number
  active_projects: number
  total_projects: number
}

function AdvisorDashboardContent() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [projects, setProjects] = useState<ProjectOverview[]>([])
  const [contractors, setContractors] = useState<ContractorPerformance[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    avgProjectValue: 0,
    completionRate: 0,
    clientSatisfaction: 0,
    pendingApprovals: 0,
    upcomingMeetings: 0,
    overdueTasksCount: 0
  })

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscriptions
    const projectSubscription = supabase
      .channel('advisor-projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      projectSubscription.unsubscribe()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_homeowner_id_fkey (full_name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Process projects data
      const processedProjects = projectsData?.map(project => ({
        id: project.id,
        title: project.title,
        status: project.status,
        progress: calculateProgress(project),
        budget_used: project.budget_used || 0,
        total_budget: project.total_budget || 0,
        homeowner: project.profiles,
        next_milestone: project.next_milestone,
        issues_count: 0, // Would need to fetch from issues table
        messages_unread: 0, // Would need to fetch from messages table
        last_activity: project.updated_at
      })) || []

      setProjects(processedProjects)

      // Fetch contractors
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('contractors')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10)

      if (contractorsError) throw contractorsError
      
      setContractors(contractorsData?.map(contractor => ({
        id: contractor.id,
        business_name: contractor.business_name,
        completion_rate: contractor.completion_rate || 85,
        on_time_rate: contractor.on_time_rate || 90,
        rating: contractor.rating || 4.5,
        active_projects: contractor.active_projects || 0,
        total_projects: contractor.total_projects || 0
      })) || [])

      // Calculate stats
      const activeProjects = processedProjects.filter(p => p.status !== 'completed')
      const totalRevenue = processedProjects.reduce((sum, p) => sum + p.total_budget, 0)
      
      setStats({
        totalProjects: processedProjects.length,
        activeProjects: activeProjects.length,
        totalRevenue,
        monthlyRevenue: totalRevenue / 12, // Simplified calculation
        avgProjectValue: totalRevenue / (processedProjects.length || 1),
        completionRate: 85, // Would need actual calculation
        clientSatisfaction: 4.7, // Would need actual data
        pendingApprovals: 3, // Would need actual count
        upcomingMeetings: 5, // Would need calendar integration
        overdueTasksCount: 2 // Would need task management integration
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (project: any) => {
    // Simplified progress calculation
    if (project.status === 'completed') return 100
    if (project.status === 'in_progress') return 60
    if (project.status === 'planning') return 20
    return 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'planning': return 'text-yellow-600'
      case 'on_hold': return 'text-gray-600'
      default: return 'text-gray-500'
    }
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
                <p className="text-gray-600">Manage all renovation projects and contractors</p>
              </div>
              {/* <ProjectSwitcher userRole="advisor" /> */}
            </div>
            <div className="flex gap-2">
              <Link href="/advisor/punch-lists">
                <Button variant="outline">
                  <Hammer className="w-4 h-4 mr-2" />
                  Punch Lists
                </Button>
              </Link>
              <Link href="/intake">
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalProjects} total projects
              </p>
              <Progress value={(stats.activeProjects / stats.totalProjects) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">
                ${(stats.monthlyRevenue / 1000).toFixed(0)}K/month avg
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">On-time delivery</p>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientSatisfaction}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
              <div className="flex mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(stats.clientSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Pending Approvals</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
              <Link href="/advisor/approvals">
                <Button variant="link" className="p-0 text-yellow-600">
                  Review now <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming Meetings</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingMeetings}</div>
              <Link href="/advisor/calendar">
                <Button variant="link" className="p-0 text-blue-600">
                  View calendar <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Overdue Tasks</CardTitle>
                <Clock className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasksCount}</div>
              <Link href="/advisor/tasks">
                <Button variant="link" className="p-0 text-red-600">
                  Address now <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Project Overview</TabsTrigger>
            <TabsTrigger value="contractors">Contractor Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Projects Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Monitor and manage all ongoing renovation projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {projects.filter(p => p.status !== 'completed').map((project) => (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                {project.id && (
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {project.id.slice(0, 8)}
                                  </Badge>
                                )}
                                <CardTitle className="text-lg">{project.title}</CardTitle>
                              </div>
                              <CardDescription>
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {project.homeowner.full_name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {project.homeowner.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {project.homeowner.phone}
                                  </span>
                                </div>
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} />
                          </div>

                          {/* Budget Usage */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Budget Used</span>
                              <span>${project.budget_used.toLocaleString()} / ${project.total_budget.toLocaleString()}</span>
                            </div>
                            <Progress 
                              value={(project.budget_used / project.total_budget) * 100} 
                              className={`${(project.budget_used / project.total_budget) > 0.9 ? 'bg-red-100' : ''}`}
                            />
                          </div>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Issues</div>
                              <div className="text-lg font-semibold text-yellow-600">{project.issues_count}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Unread</div>
                              <div className="text-lg font-semibold text-blue-600">{project.messages_unread}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Last Activity</div>
                              <div className="text-sm">{formatDistanceToNow(new Date(project.last_activity), { addSuffix: true })}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/projects/${project.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            <Link href={`/projects/${project.id}/messages`} className="flex-1">
                              <Button size="sm" className="w-full">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Messages
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contractor Performance Tab */}
          <TabsContent value="contractors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Contractors</CardTitle>
                <CardDescription>Monitor contractor performance and reliability metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {contractors.map((contractor) => (
                      <Card key={contractor.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{contractor.business_name}</CardTitle>
                              <CardDescription>
                                {contractor.active_projects} active / {contractor.total_projects} total projects
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-semibold">{contractor.rating}</span>
                              <span className="text-yellow-400">★</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Completion Rate</span>
                                <span>{contractor.completion_rate}%</span>
                              </div>
                              <Progress value={contractor.completion_rate} />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>On-Time Delivery</span>
                                <span>{contractor.on_time_rate}%</span>
                              </div>
                              <Progress value={contractor.on_time_rate} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Link href={`/contractors/${contractor.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View Profile
                              </Button>
                            </Link>
                            <Button size="sm" className="flex-1">
                              Assign Project
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Planning', 'In Progress', 'On Hold', 'Completed'].map((status) => {
                      const count = projects.filter(p => 
                        p.status.toLowerCase().replace('_', ' ') === status.toLowerCase()
                      ).length
                      const percentage = (count / projects.length) * 100
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{status}</span>
                            <span>{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Efficiency Score</span>
                      </div>
                      <span className="text-lg font-semibold">92%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Quality Score</span>
                      </div>
                      <span className="text-lg font-semibold">88%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Response Time</span>
                      </div>
                      <span className="text-lg font-semibold">2.4h avg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Projects Completed</span>
                      </div>
                      <span className="text-lg font-semibold">12 this month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AdvisorDashboard() {
  return <AdvisorDashboardContent />
}