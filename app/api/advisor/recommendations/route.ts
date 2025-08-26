import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advisorId = searchParams.get('advisor_id')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'pending'

    // For MVP testing - return mock data directly since database tables may not exist yet
    // TODO: Uncomment database logic once Supabase tables are created
    
    /*
    // Initialize Supabase client
    const supabase = await createClient()

    // Build query for agent recommendations
    let query = supabase
      .from('agent_recommendations')
      .select(`
        *,
        projects(title, address),
        profiles(full_name, email)
      `)
      .eq('approval_status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add priority filter if specified
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }

    const { data: recommendations, error } = await query

    if (error) {
      console.error('Error fetching recommendations:', error)
      // Fall back to mock data if database error
    } else if (recommendations && recommendations.length > 0) {
      // Return real data if available
      const priorityCounts = recommendations.reduce((acc: any, rec: any) => {
        acc[rec.priority] = (acc[rec.priority] || 0) + 1
        return acc
      }, {})

      return NextResponse.json({
        recommendations,
        total: recommendations.length,
        priority_counts: priorityCounts,
        status: 'success',
        source: 'database'
      })
    }
    */

    // Generate mock data for testing
      const mockRecommendations = [
        {
          id: 'mock-1',
          agent_name: 'Project Health Monitor',
          crew_name: 'morning_analysis',
          project_id: 'project-123',
          recommendation_type: 'risk_alert',
          title: 'Schedule Conflict - Smith Bathroom Timeline',
          description: 'Tile delivery delayed by 3 days due to supplier shortage. This affects electrical rough-in scheduled for Thursday and could delay project completion.',
          recommended_actions: [
            {
              type: 'reschedule',
              target: 'ABC Electric',
              action: 'Move electrical from Thursday to Monday',
              reason: 'Allow time for tile delivery'
            },
            {
              type: 'notify',
              target: 'homeowner',
              action: 'Send delay notification email',
              reason: 'Keep homeowner informed'
            },
            {
              type: 'procure',
              target: 'alternate_supplier',
              action: 'Order backup tiles for $150 premium',
              reason: 'Prevent further delays'
            }
          ],
          confidence_score: 0.87,
          priority: 'high',
          estimated_impact: {
            time_impact: 'Prevents 5-day delay, adds 1 day',
            cost_impact: 150,
            risk_level: 'medium'
          },
          supporting_data: {
            supplier_notification: '2024-01-15T08:23:00Z',
            contractor_availability: {
              'ABC Electric': ['Monday', 'Tuesday', 'Wednesday']
            },
            alternate_quotes: [
              { supplier: 'Home Depot', premium: 150, delivery: '2 days' }
            ]
          },
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          projects: {
            title: 'Smith Family Bathroom Remodel',
            address: { street: '123 Oak Street', city: 'San Francisco', state: 'CA' }
          }
        },
        {
          id: 'mock-2',
          agent_name: 'Emergency Coordinator',
          crew_name: 'emergency_response',
          project_id: 'project-456',
          recommendation_type: 'emergency',
          title: 'Water Leak - Johnson Kitchen',
          description: 'Water leak detected under kitchen sink. Immediate action required to prevent water damage to adjacent rooms and flooring.',
          recommended_actions: [
            {
              type: 'dispatch',
              target: 'emergency_plumber',
              action: 'Dispatch Mike\'s Emergency Plumbing',
              reason: 'Stop water damage immediately'
            },
            {
              type: 'notify',
              target: 'homeowner',
              action: 'Call homeowner immediately',
              reason: 'Emergency situation requires immediate notification'
            },
            {
              type: 'reschedule',
              target: 'other_contractors',
              action: 'Postpone electrical and tile work',
              reason: 'Allow access for plumbing repairs'
            }
          ],
          confidence_score: 0.95,
          priority: 'critical',
          estimated_impact: {
            time_impact: '2-4 hours for emergency repair',
            cost_impact: 500,
            risk_level: 'high'
          },
          supporting_data: {
            detection_time: new Date().toISOString(),
            moisture_level: 'critical',
            affected_areas: ['kitchen', 'adjacent_bathroom'],
            emergency_contacts: {
              plumber: { name: 'Mike\'s Plumbing', phone: '555-0123', eta: '30 min' }
            }
          },
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry for emergency
          projects: {
            title: 'Johnson Kitchen Renovation',
            address: { street: '456 Pine Avenue', city: 'San Francisco', state: 'CA' }
          }
        },
        {
          id: 'mock-3',
          agent_name: 'Material Procurement Specialist',
          crew_name: 'material_procurement',
          project_id: 'project-789',
          recommendation_type: 'procurement',
          title: 'Bulk Material Order - Brown Kitchen Cabinets',
          description: 'Opportunity to save 15% on cabinet order by combining with two other projects. Volume discount available if ordered by end of week.',
          recommended_actions: [
            {
              type: 'procure',
              target: 'supplier',
              action: 'Place bulk order with Home Depot Pro',
              reason: '15% volume discount expires Friday'
            },
            {
              type: 'coordinate',
              target: 'other_projects',
              action: 'Coordinate delivery schedules for 3 projects',
              reason: 'Optimize delivery logistics'
            },
            {
              type: 'approve',
              target: 'budget',
              action: 'Get budget approval for $8,550 total',
              reason: 'Bulk order requires upfront payment'
            }
          ],
          confidence_score: 0.82,
          priority: 'medium',
          estimated_impact: {
            time_impact: 'Standard 5-day delivery',
            cost_impact: -450, // Savings
            risk_level: 'low'
          },
          supporting_data: {
            volume_discount: 0.15,
            order_deadline: '2024-01-19T17:00:00Z',
            total_savings: 450,
            affected_projects: ['Brown Kitchen', 'Wilson Kitchen', 'Davis Kitchen']
          },
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          projects: {
            title: 'Brown Family Kitchen Remodel',
            address: { street: '789 Maple Drive', city: 'San Francisco', state: 'CA' }
          }
        }
      ]

    // Apply filters to mock data
    let filteredRecommendations = mockRecommendations

    // Filter by priority if specified
    if (priority && priority !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.priority === priority)
    }

    // Apply limit
    filteredRecommendations = filteredRecommendations.slice(0, limit)

    // Calculate priority counts for all mock data
    const priorityCounts = mockRecommendations.reduce((acc: any, rec: any) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      recommendations: filteredRecommendations,
      total: filteredRecommendations.length,
      priority_counts: priorityCounts,
      status: 'success',
      source: 'mock_data',
      message: 'Returning mock data for testing - database not configured yet'
    })

  } catch (error) {
    console.error('Unexpected error in recommendations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Temporarily disabled to unblock deployment - TODO: Fix Supabase client Promise issue
  return NextResponse.json(
    { error: 'POST method temporarily disabled for deployment' },
    { status: 501 }
  )
}