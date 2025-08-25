'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/stripe'
import { PaymentTransaction, PaymentTransactionStatus } from '@/types/database'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface PaymentTransactionListProps {
  projectId: string
  isAdmin?: boolean
}

const STATUS_COLORS: Record<PaymentTransactionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  held_escrow: 'bg-blue-100 text-blue-800',
  processing: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  pending: 'Pending',
  held_escrow: 'In Escrow',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
}

export default function PaymentTransactionList({
  projectId,
  isAdmin = false,
}: PaymentTransactionListProps) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [projectId])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/payments/escrow?projectId=${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setTransactions(data.transactions || [])
      } else {
        toast.error(data.error || 'Failed to load transactions')
      }
    } catch (error) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleReleasePayment = async (transactionId: string, amount: number) => {
    setReleasing(transactionId)

    try {
      const response = await fetch('/api/payments/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Payment released successfully')
        fetchTransactions() // Refresh list
      } else {
        toast.error(data.error || 'Failed to release payment')
      }
    } catch (error) {
      toast.error('Failed to release payment')
    } finally {
      setReleasing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading transactions...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No payment transactions found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {formatCurrency(transaction.amount)}
              </CardTitle>
              <Badge className={STATUS_COLORS[transaction.status]}>
                {STATUS_LABELS[transaction.status]}
              </Badge>
            </div>
            <CardDescription className="flex items-center justify-between">
              <span className="capitalize">
                {transaction.type.replace('_', ' ')}
              </span>
              <span>
                {format(new Date(transaction.created_at), 'MMM d, yyyy')}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {transaction.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {transaction.description}
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From:</span>
                <span className="ml-2 capitalize">{transaction.from_party}</span>
              </div>
              <div>
                <span className="text-muted-foreground">To:</span>
                <span className="ml-2 capitalize">
                  {transaction.to_party || 'Escrow'}
                </span>
              </div>
            </div>

            {transaction.processed_at && (
              <div className="text-sm text-muted-foreground mt-2">
                Processed: {format(new Date(transaction.processed_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}

            {isAdmin && transaction.status === 'held_escrow' && (
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={() => handleReleasePayment(transaction.id, transaction.amount)}
                  disabled={releasing === transaction.id}
                >
                  {releasing === transaction.id ? 'Releasing...' : 'Release Payment'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}