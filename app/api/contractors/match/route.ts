import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContractorMatchRequest } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { projectType, budgetRange, serviceArea, timeline }: ContractorMatchRequest = await request.json()

    // Basic validation
    if (!projectType || !budgetRange || !serviceArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build contractor matching query
    let query = supabase
      .from('contractors')
      .select('*')
      .eq('is_active', true)

    // Filter by specialties (if contractor specializes in any of the project types)
    if (projectType.length > 0) {
      query = query.overlaps('specialties', projectType.map(type => 
        type.toLowerCase().replace(/\s+/g, '_').replace('renovation', '').trim()
      ))
    }

    // Filter by service area (extract city from address for matching)
    const city = serviceArea.toLowerCase()
    query = query.overlaps('service_areas', [city])

    // Sort by rating (highest first) and availability
    query = query.order('rating', { ascending: false })

    const { data: contractors, error } = await query.limit(5)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      )
    }

    // Apply additional scoring/filtering logic
    const scoredContractors = contractors?.map(contractor => {
      let score = 0
      
      // Base score from rating
      score += (contractor.rating || 0) * 20
      
      // Availability bonus
      if (contractor.availability_status === 'available') score += 25
      else if (contractor.availability_status === 'busy_2_weeks') score += 15
      else if (contractor.availability_status === 'busy_month') score += 5
      
      // Budget range matching
      const priceRangeScore: Record<string, number> = {
        'budget': budgetRange === '25-50k' ? 20 : budgetRange === '50-100k' ? 10 : 0,
        'mid-range': budgetRange === '50-100k' ? 20 : budgetRange === '100-250k' ? 15 : budgetRange === '25-50k' ? 10 : 0,
        'premium': budgetRange === '100-250k' ? 20 : budgetRange === '250k+' ? 25 : 0
      }
      score += priceRangeScore[contractor.price_range] || 0
      
      // Timeline matching bonus
      if (timeline === 'asap' && contractor.availability_status === 'available') score += 10
      
      return {
        ...contractor,
        matchScore: score
      }
    }) || []

    // Sort by match score and return top matches
    scoredContractors.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      contractors: scoredContractors,
      message: `Found ${scoredContractors.length} matching contractors`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}