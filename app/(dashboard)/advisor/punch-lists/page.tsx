'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  DollarSign,
  Hammer,
  MessageSquare,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PunchListItem {
  id: string
  description: string
  item_text?: string  // fallback
  location?: string
  room?: string       // fallback
  category?: string
  trade?: string      // fallback
  priority: string
  status: string
  estimated_time?: string
  estimated_hours?: number
  material_cost?: number
  labor_cost?: number
  total_estimate?: number
  created_at: string
  voice_message?: {
    transcription: string
    created_at: string
  }
  project?: {
    title: string
    address: any
  }
  assignments?: {
    contractor?: {
      business_name: string
      phone: string
    }
    contractor_response?: string
  }[]
}

export default function PunchListDashboard() {
  const [punchLists, setPunchLists] = useState<PunchListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    completed: 0,
    totalEstimate: 0
  })

  useEffect(() => {
    fetchPunchLists()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('punch-lists')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'punch_list_items' },
        () => {
          fetchPunchLists()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPunchLists = async () => {
    try {
      const response = await fetch('/api/punch-lists')
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPunchLists(data.items || [])
      setStats({
        total: data.stats.total,
        pending: data.stats.pending,
        assigned: data.stats.assigned,
        completed: data.stats.completed,
        totalEstimate: data.stats.total_estimate
      })
    } catch (error) {
      console.error('Error fetching punch lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'assigned': return <Clock className="h-4 w-4 text-blue-500" />
      case 'extracted': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'extracted': return 'pending'
      case 'assigned': return 'assigned'
      case 'completed': return 'completed'
      default: return status
    }
  }

  const filteredItems = punchLists.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return item.status === 'extracted' || item.status === 'pending'
    return item.status === activeTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Punch List Dashboard</h1>
          <p className="text-muted-foreground">Real-time view of all voice-generated punch lists</p>
        </div>
        <Button variant="outline" onClick={fetchPunchLists}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All punch list items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEstimate.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All items combined</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({stats.assigned})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="all">All Items ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <CardTitle className="text-lg">{item.description || item.item_text}</CardTitle>
                        </div>
                        <CardDescription>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location || item.room || 'General'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hammer className="h-3 w-3" />
                              {item.category || item.trade || 'general'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.estimated_time || (item.estimated_hours + 'h') || '1h'}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline">
                          {getStatusDisplay(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Voice Transcription */}
                    {item.voice_message && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Original Voice Message:</p>
                            <p className="text-sm text-muted-foreground italic">
                              "{item.voice_message.transcription}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.voice_message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    {(item.material_cost || item.labor_cost) && (
                      <div className="grid grid-cols-3 gap-4 bg-muted/30 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Materials</p>
                          <p className="text-sm font-semibold">${item.material_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Labor</p>
                          <p className="text-sm font-semibold">${item.labor_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-semibold text-primary">
                            ${item.total_estimate?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Contractor Assignment */}
                    {item.assignments && item.assignments.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Assigned Contractor:</p>
                        {item.assignments.map((assignment, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span className="text-sm">{assignment.contractor?.business_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {assignment.contractor?.phone}
                              </span>
                            </div>
                            {assignment.contractor_response && (
                              <Badge variant={
                                assignment.contractor_response === 'accepted' ? 'default' : 'secondary'
                              }>
                                {assignment.contractor_response}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Project Info */}
                    {item.project && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                        <span>{item.project.title}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}