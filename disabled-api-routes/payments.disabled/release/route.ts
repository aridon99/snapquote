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
    const { transactionId, amount, contractorId } = body

    // Validate required fields
    if (!transactionId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's tenant info and check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get transaction details
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*, projects!inner(tenant_id)')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'held_escrow') {
      return NextResponse.json(
        { error: 'Transaction not eligible for release' },
        { status: 400 }
      )
    }

    // Get contractor's Stripe account if needed
    let stripeAccountId = null
    if (contractorId) {
      const { data: contractor } = await supabase
        .from('contractors')
        .select('stripe_account_id')
        .eq('id', contractorId)
        .single()

      if (contractor?.stripe_account_id) {
        stripeAccountId = contractor.stripe_account_id
      }
    }

    // Release payment from escrow
    if (stripeAccountId && transaction.stripe_payment_intent_id) {
      try {
        const transfer = await StripeEscrow.releaseEscrowPayment({
          paymentIntentId: transaction.stripe_payment_intent_id,
          connectedAccountId: stripeAccountId,
          amount,
          platformFeeAmount: amount * 0.029, // 2.9% platform fee
        })

        // Update transaction status
        const { data: updatedTransaction, error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            escrow_release_approved_by: user.id,
            escrow_release_approved_at: new Date().toISOString(),
            to_party: contractorId ? 'contractor' : transaction.to_party,
          })
          .eq('id', transactionId)
          .select()
          .single()

        if (updateError) {
          console.error('Database update error:', updateError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          transaction: updatedTransaction,
          transfer: {
            id: transfer.id,
            amount: transfer.amount,
            destination: transfer.destination,
          },
        })
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        return NextResponse.json(
          { error: 'Payment release failed' },
          { status: 500 }
        )
      }
    } else {
      // Direct release without Stripe (for advisory fees, etc.)
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          escrow_release_approved_by: user.id,
          escrow_release_approved_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        transaction: updatedTransaction,
      })
    }
  } catch (error) {
    console.error('Release payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}