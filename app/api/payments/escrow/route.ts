import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StripeEscrow } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, amount, type, description } = body

    // Validate required fields
    if (!projectId || !amount || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's tenant info
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify project belongs to user's tenant
    const { data: project } = await supabase
      .from('projects')
      .select('id, tenant_id, total_budget')
      .eq('id', projectId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create escrow payment intent
    const paymentIntent = await StripeEscrow.createEscrowPayment({
      amount,
      projectId,
      description,
      metadata: {
        tenant_id: profile.tenant_id,
        user_id: user.id,
        payment_type: type,
      },
    })

    // Record transaction in database
    const { data: transaction, error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        project_id: projectId,
        tenant_id: profile.tenant_id,
        type,
        status: 'pending',
        amount,
        from_party: 'homeowner',
        to_party: type === 'advisory_fee' ? 'advisor' : 'escrow',
        stripe_payment_intent_id: paymentIntent.id,
        description,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
      transaction,
    })
  } catch (error) {
    console.error('Escrow payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      )
    }

    // Get user's tenant info
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get payment transactions for project
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}