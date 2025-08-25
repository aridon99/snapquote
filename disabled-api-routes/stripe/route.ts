import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StripeWebhooks } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      )
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const event = await StripeWebhooks.handleWebhook(body, signature, endpointSecret)

    const supabase = await createClient()

    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update payment transaction status
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'held_escrow',
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (updateError) {
          console.error('Failed to update payment transaction:', updateError)
        }

        console.log('Payment succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update payment transaction status
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (updateError) {
          console.error('Failed to update payment transaction:', updateError)
        }

        console.log('Payment failed:', paymentIntent.id)
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer

        // Find and update the corresponding transaction
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', transfer.source_transaction as string)

        if (updateError) {
          console.error('Failed to update transfer transaction:', updateError)
        }

        console.log('Transfer created:', transfer.id)
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute

        // Handle dispute - notify administrators
        console.log('Dispute created:', dispute.id, dispute.reason)
        
        // TODO: Send notification to admin team
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        // Update contractor account status if needed
        if (account.charges_enabled && account.payouts_enabled) {
          const { error: updateError } = await supabase
            .from('contractors')
            .update({
              stripe_account_id: account.id,
            })
            .eq('stripe_account_id', account.id)

          if (updateError) {
            console.error('Failed to update contractor account:', updateError)
          }
        }

        console.log('Account updated:', account.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle preflight CORS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'stripe-signature, content-type',
    },
  })
}