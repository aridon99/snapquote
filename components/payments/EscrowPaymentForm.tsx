'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/stripe'
import { PaymentTransactionType } from '@/types/database'
import toast from 'react-hot-toast'

interface EscrowPaymentFormProps {
  projectId: string
  onSuccess?: (transaction: any) => void
  onError?: (error: string) => void
}

const PAYMENT_TYPES: { value: PaymentTransactionType; label: string; description: string }[] = [
  {
    value: 'material_deposit',
    label: 'Material Deposit',
    description: 'Secure deposit for materials procurement'
  },
  {
    value: 'advisory_fee',
    label: 'Advisory Fee',
    description: 'Project advisory and management fee'
  },
  {
    value: 'milestone',
    label: 'Milestone Payment',
    description: 'Payment for completed project milestone'
  },
]

export default function EscrowPaymentForm({
  projectId,
  onSuccess,
  onError,
}: EscrowPaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentTransactionType>('material_deposit')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe not loaded')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    setLoading(true)

    try {
      // Create payment intent on server
      const response = await fetch('/api/payments/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
          type: paymentType,
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'requires_capture') {
        toast.success('Payment secured in escrow')
        onSuccess?.(data.transaction)
        
        // Reset form
        setAmount('')
        setDescription('')
        cardElement.clear()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedPaymentType = PAYMENT_TYPES.find(t => t.value === paymentType)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Secure Escrow Payment</CardTitle>
        <CardDescription>
          Funds are held securely and released upon approval
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="payment-type">Payment Type</Label>
            <Select
              value={paymentType}
              onValueChange={(value: string) => setPaymentType(value as PaymentTransactionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {amount && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(parseFloat(amount))} will be held in escrow
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={`Describe the ${selectedPaymentType?.label.toLowerCase()}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <div className="border rounded-md p-3 bg-background">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '14px',
                      color: 'hsl(var(--foreground))',
                      '::placeholder': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !stripe}
          >
            {loading ? 'Processing...' : `Pay ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}