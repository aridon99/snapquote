import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock pricing data for testing
const MOCK_PRICING = {
  plumber: { hourly: 125, materials_markup: 1.25 },
  electrician: { hourly: 110, materials_markup: 1.20 },
  tile: { hourly: 85, materials_markup: 1.15 },
  painter: { hourly: 75, materials_markup: 1.20 },
  general: { hourly: 65, materials_markup: 1.15 },
  carpenter: { hourly: 70, materials_markup: 1.15 },
  hvac: { hourly: 135, materials_markup: 1.30 },
  drywall: { hourly: 70, materials_markup: 1.15 },
  flooring: { hourly: 80, materials_markup: 1.15 }
}

// Mock material costs for common items
const MOCK_MATERIALS = {
  'toilet': 350,
  'faucet': 175,
  'sink': 250,
  'tile': 5.50, // per sq ft
  'paint': 35, // per gallon
  'outlet': 15,
  'switch': 12,
  'door': 150,
  'cabinet': 200,
  'flooring': 4.50 // per sq ft
}

function estimateCosts(item: any) {
  const trade = item.category || item.trade || 'general'
  const pricing = MOCK_PRICING[trade as keyof typeof MOCK_PRICING] || MOCK_PRICING.general
  const hours = parseFloat(item.estimated_time?.replace('h', '')) || item.estimated_hours || 2
  
  // Calculate labor cost
  const laborCost = pricing.hourly * hours
  
  // Estimate material cost based on keywords in item text
  let materialCost = 0
  const itemText = (item.description || item.item_text || '').toLowerCase()
  
  // Check for materials in the text
  if (itemText.includes('toilet')) materialCost += MOCK_MATERIALS.toilet
  if (itemText.includes('faucet') || itemText.includes('tap')) materialCost += MOCK_MATERIALS.faucet
  if (itemText.includes('sink')) materialCost += MOCK_MATERIALS.sink
  if (itemText.includes('tile')) {
    // Estimate 100 sq ft for a typical bathroom
    const sqft = item.measurements?.square_feet || 100
    materialCost += MOCK_MATERIALS.tile * sqft * 1.1 // 10% waste
  }
  if (itemText.includes('paint')) {
    // Estimate 2 gallons for a typical room
    const gallons = item.measurements?.gallons || 2
    materialCost += MOCK_MATERIALS.paint * gallons
  }
  if (itemText.includes('outlet')) materialCost += MOCK_MATERIALS.outlet
  if (itemText.includes('switch')) materialCost += MOCK_MATERIALS.switch
  if (itemText.includes('door')) materialCost += MOCK_MATERIALS.door
  if (itemText.includes('cabinet')) materialCost += MOCK_MATERIALS.cabinet
  if (itemText.includes('floor')) {
    const sqft = item.measurements?.square_feet || 200
    materialCost += MOCK_MATERIALS.flooring * sqft * 1.1
  }
  
  // Apply markup
  materialCost = materialCost * pricing.materials_markup
  
  const totalEstimate = laborCost + materialCost
  
  return {
    labor_cost: parseFloat(laborCost.toFixed(2)),
    material_cost: parseFloat(materialCost.toFixed(2)),
    total_estimate: parseFloat(totalEstimate.toFixed(2))
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch punch list items with related data
    const { data: items, error } = await supabase
      .from('punch_list_items')
      .select(`
        *,
        voice_message:voice_messages(audio_url, created_at),
        project:projects(title, address),
        assignments:punch_list_assignments(
          contractor_response,
          contractor:contractors(business_name, phone)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Add cost estimates to each item
    const itemsWithEstimates = items?.map(item => {
      const estimates = estimateCosts(item)
      return {
        ...item,
        ...estimates
      }
    }) || []
    
    // Calculate summary statistics
    const stats = {
      total: itemsWithEstimates.length,
      pending: itemsWithEstimates.filter(item => item.status === 'extracted' || item.status === 'pending').length,
      assigned: itemsWithEstimates.filter(item => item.status === 'assigned').length,
      completed: itemsWithEstimates.filter(item => item.status === 'completed').length,
      total_estimate: itemsWithEstimates.reduce((sum, item) => sum + item.total_estimate, 0)
    }
    
    return NextResponse.json({
      items: itemsWithEstimates,
      stats,
      pricing_info: {
        note: 'Using mock pricing data for testing',
        trades: MOCK_PRICING
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch punch lists' },
      { status: 500 }
    )
  }
}

// Update a punch list item status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, contractor_id } = await request.json()
    
    // Update the punch list item
    const { data, error } = await supabase
      .from('punch_list_items')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // If assigning to contractor, create assignment record
    if (status === 'assigned' && contractor_id) {
      await supabase
        .from('punch_list_assignments')
        .insert({
          punch_list_item_id: id,
          contractor_id,
          project_id: data.project_id,
          assignment_method: 'manual',
          assignment_reason: 'Manual assignment via dashboard'
        })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update punch list item' },
      { status: 500 }
    )
  }
}