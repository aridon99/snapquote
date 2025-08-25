'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft, DollarSign, TrendingDown, TrendingUp, AlertTriangle, Check, X, Plus } from 'lucide-react'
import { BudgetGauge } from '@/components/ui/enhanced-progress'

interface BudgetTransferRequest {
  id: string
  fromProjectId: string
  toProjectId: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  requestedAt: string
  fromProjectTitle: string
  toProjectTitle: string
  fromProjectRemaining: number
  toProjectRemaining: number
}

interface Project {
  id: string
  title: string
  allocated: number
  spent: number
  remaining: number
}

interface BudgetTransferWorkflowProps {
  projects: Project[]
  transfers?: BudgetTransferRequest[]
}

export function BudgetTransferWorkflow({ 
  projects, 
  transfers = [] 
}: BudgetTransferWorkflowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [fromProjectId, setFromProjectId] = useState('')
  const [toProjectId, setToProjectId] = useState('')

  // Mock pending transfers if none provided
  const mockTransfers: BudgetTransferRequest[] = [
    {
      id: '1',
      fromProjectId: '1',
      toProjectId: '2',
      amount: 5000,
      reason: 'Kitchen project came under budget, need funds for bathroom tile upgrade',
      status: 'pending',
      requestedBy: 'John Huang',
      requestedAt: '2 hours ago',
      fromProjectTitle: 'Kitchen Renovation',
      toProjectTitle: 'Master Bathroom',
      fromProjectRemaining: 52000,
      toProjectRemaining: 20000
    },
    {
      id: '2',
      fromProjectId: '2',
      toProjectId: '3',
      amount: 3000,
      reason: 'Permit delays freed up funds for guest bathroom fixtures',
      status: 'approved',
      requestedBy: 'John Huang',
      requestedAt: '1 day ago',
      fromProjectTitle: 'Master Bathroom',
      toProjectTitle: 'Guest Bathroom',
      fromProjectRemaining: 17000,
      toProjectRemaining: 18000
    }
  ]

  const displayTransfers = transfers.length > 0 ? transfers : mockTransfers

  const handleTransferRequest = () => {
    const amount = parseFloat(transferAmount)
    const fromProject = projects.find(p => p.id === fromProjectId)
    const toProject = projects.find(p => p.id === toProjectId)
    
    if (!amount || !fromProject || !toProject || !transferReason.trim()) {
      return
    }

    if (amount > fromProject.remaining) {
      alert(`Transfer amount cannot exceed remaining budget of $${fromProject.remaining.toLocaleString()}`)
      return
    }

    // Create transfer request (in real app, this would API call)
    console.log('Transfer request:', {
      fromProjectId,
      toProjectId,
      amount,
      reason: transferReason,
      fromProject: fromProject.title,
      toProject: toProject.title
    })

    // Reset form
    setTransferAmount('')
    setTransferReason('')
    setFromProjectId('')
    setToProjectId('')
    setIsDialogOpen(false)
  }

  const handleTransferAction = (transferId: string, action: 'approve' | 'reject') => {
    console.log(`${action} transfer:`, transferId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800' 
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with New Transfer Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Budget Transfers</h3>
          <p className="text-sm text-muted-foreground">
            Reallocate funds between projects as needs change
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Request Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Budget Transfer</DialogTitle>
              <DialogDescription>
                Move funds from one project to another to optimize budget allocation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-project">From Project</Label>
                <Select value={fromProjectId} onValueChange={setFromProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(p => p.remaining > 0)
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title} (${project.remaining.toLocaleString()} remaining)
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="to-project">To Project</Label>
                <Select value={toProjectId} onValueChange={setToProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(p => p.id !== fromProjectId)
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Transfer Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
                {fromProjectId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: ${projects.find(p => p.id === fromProjectId)?.remaining.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Reason for Transfer</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this transfer is needed..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTransferRequest}>
                  Request Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Allocated: ${project.allocated.toLocaleString()}</span>
                  <span>Spent: ${project.spent.toLocaleString()}</span>
                </div>
                <BudgetGauge 
                  allocated={project.allocated}
                  spent={project.spent}
                  size="sm"
                  showDetails={false}
                />
                <div className="text-center">
                  <span className="text-sm font-medium text-green-600">
                    ${project.remaining.toLocaleString()} remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transfer Requests */}
      <div className="space-y-4">
        <h4 className="font-medium">Recent Transfer Requests</h4>
        
        {displayTransfers.map((transfer) => (
          <Card key={transfer.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Transfer Visual */}
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{transfer.fromProjectTitle}</div>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm font-medium">{transfer.toProjectTitle}</div>
                  </div>
                  
                  {/* Amount */}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {transfer.amount.toLocaleString()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(transfer.status)}>
                    {transfer.status}
                  </Badge>
                  
                  {transfer.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTransferAction(transfer.id, 'approve')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTransferAction(transfer.id, 'reject')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Transfer Details */}
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">{transfer.reason}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Requested by {transfer.requestedBy}</span>
                  <span>{transfer.requestedAt}</span>
                </div>
                
                {/* Budget Impact Preview */}
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="w-3 h-3" />
                      <span className="font-medium">{transfer.fromProjectTitle}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${transfer.fromProjectRemaining.toLocaleString()} → ${(transfer.fromProjectRemaining - transfer.amount).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">{transfer.toProjectTitle}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${transfer.toProjectRemaining.toLocaleString()} → ${(transfer.toProjectRemaining + transfer.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {displayTransfers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ArrowRightLeft className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No budget transfers requested</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}