import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// Initialize Stripe with API version for Custom Connect
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Stripe Custom Connect for escrow functionality
export class StripeEscrow {
  /**
   * Create a connected account for a contractor
   */
  static async createConnectedAccount(contractorData: {
    businessName: string
    email: string
    country?: string
    type?: Stripe.AccountCreateParams.Type
  }): Promise<Stripe.Account> {
    const { businessName, email, country = 'US', type = 'custom' } = contractorData

    return await stripe.accounts.create({
      type,
      country,
      email,
      business_profile: {
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      tos_acceptance: {
        service_agreement: 'full',
      },
    })
  }

  /**
   * Create a payment intent that holds funds in escrow
   */
  static async createEscrowPayment({
    amount,
    currency = 'usd',
    projectId,
    description,
    metadata = {},
  }: {
    amount: number
    currency?: string
    projectId: string
    description: string
    metadata?: Record<string, string>
  }): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        project_id: projectId,
        type: 'escrow',
        ...metadata,
      },
      // Hold funds without immediate transfer
      capture_method: 'manual',
    })
  }

  /**
   * Release escrow funds to connected account (contractor)
   */
  static async releaseEscrowPayment({
    paymentIntentId,
    connectedAccountId,
    amount,
    platformFeeAmount = 0,
  }: {
    paymentIntentId: string
    connectedAccountId: string
    amount: number
    platformFeeAmount?: number
  }): Promise<Stripe.Transfer> {
    // First capture the payment intent
    await stripe.paymentIntents.capture(paymentIntentId)

    // Then transfer to connected account
    return await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: connectedAccountId,
      source_transaction: paymentIntentId,
      ...(platformFeeAmount > 0 && {
        application_fee_amount: Math.round(platformFeeAmount * 100),
      }),
    })
  }

  /**
   * Refund an escrow payment
   */
  static async refundEscrowPayment({
    paymentIntentId,
    amount,
    reason = 'requested_by_customer',
  }: {
    paymentIntentId: string
    amount?: number
    reason?: Stripe.RefundCreateParams.Reason
  }): Promise<Stripe.Refund> {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount && { amount: Math.round(amount * 100) }),
      reason,
    })
  }

  /**
   * Get account balance for escrow tracking
   */
  static async getBalance(): Promise<Stripe.Balance> {
    return await stripe.balance.retrieve()
  }

  /**
   * List transactions for audit trail
   */
  static async getTransactions({
    limit = 10,
    startingAfter,
    created,
  }: {
    limit?: number
    startingAfter?: string
    created?: Stripe.RangeQueryParam | number
  } = {}): Promise<Stripe.BalanceTransaction[]> {
    const transactions = await stripe.balanceTransactions.list({
      limit,
      ...(startingAfter && { starting_after: startingAfter }),
      ...(created && { created }),
    })
    
    return transactions.data
  }

  /**
   * Create a milestone payment setup for automated releases
   */
  static async createMilestonePayment({
    amount,
    projectId,
    milestoneId,
    description,
    autoRelease = false,
  }: {
    amount: number
    projectId: string
    milestoneId: string
    description: string
    autoRelease?: boolean
  }): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description,
      metadata: {
        project_id: projectId,
        milestone_id: milestoneId,
        type: 'milestone',
        auto_release: autoRelease.toString(),
      },
      capture_method: 'manual', // Hold in escrow
    })
  }
}

// Payment webhook handlers
export class StripeWebhooks {
  /**
   * Handle Stripe webhooks for escrow events
   */
  static async handleWebhook(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  }

  /**
   * Process payment intent succeeded events
   */
  static async processPaymentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    
    // Update payment_transactions table
    console.log('Payment succeeded:', paymentIntent.id, paymentIntent.metadata)
  }

  /**
   * Process transfer events for escrow releases
   */
  static async processTransferCreated(event: Stripe.Event): Promise<void> {
    const transfer = event.data.object as Stripe.Transfer
    
    // Update payment_transactions table
    console.log('Transfer created:', transfer.id, transfer.metadata)
  }
}

// Utility functions
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const calculatePlatformFee = (amount: number, feePercentage = 0.029): number => {
  return amount * feePercentage
}