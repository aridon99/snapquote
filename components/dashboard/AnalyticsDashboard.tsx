'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, TrendingUp, Target, Clock, Phone, Mail, Star } from 'lucide-react'

interface AnalyticsData {
  totalConversations: number
  leadsGenerated: number
  conversionRate: number
  avgDuration: number
  avgMessages: number
  timeRange: string
  periodStart: string
  periodEnd: string
}

interface ConversationMetrics {
  byCategory: Record<string, number>
  bySource: Record<string, number>
  byUrgency: Record<string, number>
  byLeadQuality: Record<string, number>
}

interface LeadMetrics {
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  contactedRate: number
  conversionRate: number
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [conversationMetrics, setConversationMetrics] = useState<ConversationMetrics | null>(null)
  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [analyticsRes, metricsRes, leadsRes] = await Promise.all([
        fetch(`/api/analytics?timeRange=${timeRange}`),
        fetch(`/api/analytics/conversations?timeRange=${timeRange}`),
        fetch(`/api/analytics/leads?timeRange=${timeRange}`)
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalyticsData(data)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setConversationMetrics(data)
      }

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeadMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getConversionColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Chatbot Analytics</h1>
        <Select value={timeRange} onValueChange={(value: 'day' | 'week' | 'month') => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">24 Hours</SelectItem>
            <SelectItem value="week">7 Days</SelectItem>
            <SelectItem value="month">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange === 'day' ? '24 hours' : timeRange === 'week' ? '7 days' : '30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.leadsGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              {leadMetrics?.hotLeads || 0} hot, {leadMetrics?.warmLeads || 0} warm, {leadMetrics?.coldLeads || 0} cold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConversionColor(analyticsData?.conversionRate || 0)}`}>
              {analyticsData?.conversionRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 15%+ for excellent performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analyticsData?.avgDuration || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.avgMessages || 0} messages average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="leads">Lead Quality</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversationMetrics?.byCategory ? Object.entries(conversationMetrics.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="capitalize text-sm">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Urgency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversationMetrics?.byUrgency ? Object.entries(conversationMetrics.byUrgency).map(([urgency, count]) => (
                    <div key={urgency} className="flex justify-between items-center">
                      <span className="capitalize text-sm">{urgency}</span>
                      <Badge 
                        variant={urgency === 'immediate' ? 'destructive' : urgency === 'planning' ? 'default' : 'secondary'}
                      >
                        {count}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-red-500" />
                  Hot Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{leadMetrics?.hotLeads || 0}</div>
                <p className="text-sm text-gray-600">High-value prospects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  Warm Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{leadMetrics?.warmLeads || 0}</div>
                <p className="text-sm text-gray-600">Interested prospects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Cold Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{leadMetrics?.coldLeads || 0}</div>
                <p className="text-sm text-gray-600">Early-stage inquiries</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Follow-up Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Contacted Rate</p>
                  <p className="text-2xl font-bold">{leadMetrics?.contactedRate?.toFixed(1) || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{leadMetrics?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Lead Capture Rate</span>
                      <span className={getConversionColor(analyticsData?.conversionRate || 0)}>
                        {analyticsData?.conversionRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-kurtis-accent h-2 rounded-full" 
                        style={{ width: `${Math.min(analyticsData?.conversionRate || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Engagement</span>
                      <span>{analyticsData?.avgMessages || 0} messages</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((analyticsData?.avgMessages || 0) * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(analyticsData?.conversionRate || 0) < 10 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      🚨 Low conversion rate. Consider improving lead capture prompts.
                    </div>
                  )}
                  {(analyticsData?.avgMessages || 0) < 3 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      ⚠️ Short conversations. Users may need more engagement.
                    </div>
                  )}
                  {(analyticsData?.conversionRate || 0) >= 15 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      ✅ Excellent conversion rate! Chatbot is performing well.
                    </div>
                  )}
                  {conversationMetrics?.byUrgency?.immediate && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      📞 {conversationMetrics.byUrgency.immediate} urgent leads need immediate follow-up.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}