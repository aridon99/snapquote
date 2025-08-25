import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' || 'day'

    const supabase = await createClient()
    
    const startDate = new Date()
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    // Get leads from the specified time period
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Failed to get lead analytics:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve lead metrics' },
        { status: 500 }
      )
    }

    // Calculate metrics
    const totalLeads = leads.length
    const hotLeads = leads.filter(lead => lead.lead_quality === 'hot').length
    const warmLeads = leads.filter(lead => lead.lead_quality === 'warm').length
    const coldLeads = leads.filter(lead => lead.lead_quality === 'cold').length
    
    const contactedLeads = leads.filter(lead => 
      lead.status === 'contacted' || 
      lead.status === 'qualified' || 
      lead.status === 'converted'
    ).length
    
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length
    
    const contactedRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Lead source breakdown
    const bySource: Record<string, number> = {}
    leads.forEach(lead => {
      const source = lead.source || 'unknown'
      bySource[source] = (bySource[source] || 0) + 1
    })

    // Lead status breakdown
    const byStatus: Record<string, number> = {}
    leads.forEach(lead => {
      const status = lead.status || 'new'
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    // Project type breakdown
    const byProjectType: Record<string, number> = {}
    leads.forEach(lead => {
      if (lead.project_type) {
        byProjectType[lead.project_type] = (byProjectType[lead.project_type] || 0) + 1
      }
    })

    // Response time analysis (for contacted leads)
    const responseTimeData = leads
      .filter(lead => lead.contacted_at && lead.created_at)
      .map(lead => {
        const created = new Date(lead.created_at).getTime()
        const contacted = new Date(lead.contacted_at).getTime()
        return (contacted - created) / (1000 * 60 * 60) // Hours
      })

    const avgResponseTime = responseTimeData.length > 0 
      ? responseTimeData.reduce((sum, time) => sum + time, 0) / responseTimeData.length 
      : 0

    return NextResponse.json({
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      contactedRate,
      conversionRate,
      avgResponseTime,
      bySource,
      byStatus,
      byProjectType,
      timeRange,
      periodStart: startDate.toISOString(),
      periodEnd: new Date().toISOString()
    })

  } catch (error) {
    console.error('Lead analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve lead metrics' },
      { status: 500 }
    )
  }
}