'use client'

import { useState, useEffect } from 'react'
import { BudgetItem } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit2, Trash2, AlertTriangle, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/validation'
import { toast } from 'react-hot-toast'

interface BudgetTrackerProps {
  projectId: string
  totalBudget?: number
  onBudgetUpdate?: (spent: number, total: number) => void
}

interface BudgetItemForm {
  category: 'labor' | 'materials' | 'permits' | 'other'
  description: string
  budgeted_amount: number | null
  actual_amount: number | null
  notes: string
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor', color: 'bg-blue-100 text-blue-800' },
  { value: 'materials', label: 'Materials', color: 'bg-green-100 text-green-800' },
  { value: 'permits', label: 'Permits', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
]

export function BudgetTracker({ projectId, totalBudget = 0, onBudgetUpdate }: BudgetTrackerProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [formData, setFormData] = useState<BudgetItemForm>({
    category: 'labor',
    description: '',
    budgeted_amount: null,
    actual_amount: null,
    notes: ''
  })
  const supabase = createClient()

  useEffect(() => {
    loadBudgetItems()
  }, [projectId])

  const loadBudgetItems = async () => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setBudgetItems(data || [])
    } catch (error) {
      console.error('Error loading budget items:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load budget items'
      setError(errorMessage)
      toast.error('Failed to load budget items')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const budgetedTotal = budgetItems.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0)
    const actualTotal = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
    return { budgetedTotal, actualTotal }
  }

  const { budgetedTotal, actualTotal } = calculateTotals()

  // Notify parent of budget updates
  useEffect(() => {
    if (onBudgetUpdate) {
      onBudgetUpdate(actualTotal, totalBudget)
    }
  }, [actualTotal, totalBudget, onBudgetUpdate])

  const resetForm = () => {
    setFormData({
      category: 'labor',
      description: '',
      budgeted_amount: null,
      actual_amount: null,
      notes: ''
    })
    setEditingItem(null)
  }

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('budget_items')
          .update({
            category: formData.category,
            description: formData.description,
            budgeted_amount: formData.budgeted_amount,
            actual_amount: formData.actual_amount,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) throw error
        toast.success('Budget item updated')
      } else {
        // Create new item
        const { error } = await supabase
          .from('budget_items')
          .insert({
            project_id: projectId,
            category: formData.category,
            description: formData.description,
            budgeted_amount: formData.budgeted_amount,
            actual_amount: formData.actual_amount,
            notes: formData.notes
          })

        if (error) throw error
        toast.success('Budget item added')
      }

      loadBudgetItems()
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error saving budget item:', error)
      toast.error('Failed to save budget item')
    }
  }

  const handleEdit = (item: BudgetItem) => {
    setFormData({
      category: item.category,
      description: item.description,
      budgeted_amount: item.budgeted_amount,
      actual_amount: item.actual_amount,
      notes: item.notes || ''
    })
    setEditingItem(item)
    setShowAddDialog(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      loadBudgetItems()
      toast.success('Budget item deleted')
    } catch (error) {
      console.error('Error deleting budget item:', error)
      toast.error('Failed to delete budget item')
    }
  }

  const getBudgetHealthColor = () => {
    if (totalBudget === 0) return 'text-gray-600'
    const percentage = (actualTotal / totalBudget) * 100
    if (percentage < 70) return 'text-green-600'
    if (percentage < 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBudgetHealthIcon = () => {
    if (totalBudget === 0) return <DollarSign className="w-5 h-5" />
    const percentage = (actualTotal / totalBudget) * 100
    if (percentage < 90) return <TrendingUp className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Budget Overview Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-8 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </CardContent>
        </Card>

        {/* Budget Items Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Budget</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBudgetItems}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Budget Overview</span>
            <div className={`flex items-center space-x-2 ${getBudgetHealthColor()}`}>
              {getBudgetHealthIcon()}
              <span className="font-semibold">
                {totalBudget > 0 ? `${((actualTotal / totalBudget) * 100).toFixed(1)}%` : 'No Budget Set'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(budgetedTotal)}</div>
              <div className="text-sm text-blue-600">Budgeted Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{formatCurrency(actualTotal)}</div>
              <div className="text-sm text-green-600">Actual Spent</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getBudgetHealthColor()}`}>
                {formatCurrency(totalBudget - actualTotal)}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
          
          {totalBudget > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    (actualTotal / totalBudget) * 100 < 70 ? 'bg-green-500' :
                    (actualTotal / totalBudget) * 100 < 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((actualTotal / totalBudget) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Budget utilization: {((actualTotal / totalBudget) * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Budget Items</CardTitle>
              <CardDescription>Track individual costs and expenses</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update the budget item details' : 'Add a new line item to your budget'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Kitchen cabinets installation"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgeted">Budgeted Amount</Label>
                      <Input
                        id="budgeted"
                        type="number"
                        value={formData.budgeted_amount || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          budgeted_amount: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actual">Actual Amount</Label>
                      <Input
                        id="actual"
                        type="number"
                        value={formData.actual_amount || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          actual_amount: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional details or notes..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingItem ? 'Update' : 'Add'} Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {budgetItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No budget items yet. Add your first item to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetItems.map((item) => {
                const category = CATEGORIES.find(cat => cat.value === item.category)
                const variance = (item.actual_amount || 0) - (item.budgeted_amount || 0)
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={category?.color}>{category?.label}</Badge>
                        <h4 className="font-medium">{item.description}</h4>
                        {variance > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            +{formatCurrency(variance)} over
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Budgeted</div>
                        <div className="font-medium">
                          {item.budgeted_amount ? formatCurrency(item.budgeted_amount) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Actual</div>
                        <div className="font-medium">
                          {item.actual_amount ? formatCurrency(item.actual_amount) : 'N/A'}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}