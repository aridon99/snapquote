'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  FileText, 
  Upload,
  ExternalLink,
  RefreshCw,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Table,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface ContractorData {
  id: string
  business_name: string
  trade: string
  google_sheet_id?: string
  google_sheet_url?: string
}

interface PriceItem {
  id: string
  standard_item_id: string | null
  custom_description: string | null
  labor_cost: number | null
  material_cost: number | null
  total_price: number
  time_estimate_hours: number | null
  notes: string | null
  source: string
  standard_work_item?: {
    item_name: string
    category: string
    trade: string
    typical_time_hours: number
  }
}

interface StandardWorkItem {
  id: string
  item_name: string
  category: string
  trade: string
  description: string
  typical_time_hours: number
}

export default function ContractorPricing() {
  const [contractor, setContractor] = useState<ContractorData | null>(null)
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [standardItems, setStandardItems] = useState<StandardWorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItemForm, setNewItemForm] = useState({
    description: '',
    laborCost: '',
    materialCost: '',
    totalPrice: '',
    timeHours: '',
    notes: ''
  })
  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [activeTab, setActiveTab] = useState('table')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadContractorData()
  }, [])

  const loadContractorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get contractor data
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', user.email)
        .single()

      if (contractorData) {
        setContractor(contractorData)

        // Load price items
        const { data: priceItemsData } = await supabase
          .from('contractor_price_items')
          .select(`
            *,
            standard_work_item:standard_work_items(*)
          `)
          .eq('contractor_id', contractorData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (priceItemsData) {
          setPriceItems(priceItemsData)
        }

        // Load standard items for this trade
        const tradeFilter = contractorData.trade === 'both' 
          ? ['plumber', 'electrician', 'both']
          : [contractorData.trade, 'both']

        const { data: standardItemsData } = await supabase
          .from('standard_work_items')
          .select('*')
          .in('trade', tradeFilter)
          .order('category', { ascending: true })
          .order('item_name', { ascending: true })

        if (standardItemsData) {
          setStandardItems(standardItemsData)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load pricing data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoogleSheet = async () => {
    try {
      // In a real implementation, this would call Google Sheets API
      // For now, we'll simulate creating a sheet URL
      const sheetId = 'demo_' + Date.now()
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
      
      const { error } = await supabase
        .from('contractors')
        .update({
          google_sheet_id: sheetId,
          google_sheet_url: sheetUrl
        })
        .eq('id', contractor?.id)

      if (error) {
        throw error
      }

      // Update onboarding progress
      await supabase
        .from('contractor_onboarding_progress')
        .update({
          google_sheet_connected: true,
          google_sheet_connected_at: new Date().toISOString()
        })
        .eq('contractor_id', contractor?.id)

      setContractor(prev => prev ? { ...prev, google_sheet_id: sheetId, google_sheet_url: sheetUrl } : null)
      toast.success('Google Sheet created successfully!')
    } catch (error) {
      console.error('Error creating Google Sheet:', error)
      toast.error('Failed to create Google Sheet')
    }
  }

  const handleSaveItem = async (itemId: string, updates: Partial<PriceItem>) => {
    try {
      const { error } = await supabase
        .from('contractor_price_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setPriceItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      )
      
      setEditingItem(null)
      toast.success('Price updated successfully!')
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Failed to save changes')
    }
  }

  const handleAddNewItem = async () => {
    if (!newItemForm.description || !newItemForm.totalPrice) {
      toast.error('Description and total price are required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('contractor_price_items')
        .insert({
          contractor_id: contractor?.id,
          custom_description: newItemForm.description,
          labor_cost: parseFloat(newItemForm.laborCost) || null,
          material_cost: parseFloat(newItemForm.materialCost) || null,
          total_price: parseFloat(newItemForm.totalPrice),
          time_estimate_hours: parseFloat(newItemForm.timeHours) || null,
          notes: newItemForm.notes || null,
          source: 'manual'
        })
        .select()
        .single()

      if (error) throw error

      setPriceItems(prev => [data, ...prev])
      setNewItemForm({
        description: '',
        laborCost: '',
        materialCost: '',
        totalPrice: '',
        timeHours: '',
        notes: ''
      })
      setShowNewItemForm(false)
      toast.success('New price item added!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add new item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('contractor_price_items')
        .update({ is_active: false })
        .eq('id', itemId)

      if (error) throw error

      setPriceItems(prev => prev.filter(item => item.id !== itemId))
      toast.success('Item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount)
  }

  const getSourceBadge = (source: string) => {
    const sourceMap = {
      'manual': { label: 'Manual', color: 'bg-gray-500' },
      'invoice': { label: 'Invoice', color: 'bg-blue-500' },
      'csv': { label: 'CSV', color: 'bg-green-500' },
      'whatsapp': { label: 'WhatsApp', color: 'bg-purple-500' },
      'interview': { label: 'Interview', color: 'bg-orange-500' }
    }
    
    const config = sourceMap[source as keyof typeof sourceMap] || sourceMap.manual
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    )
  }

  const missingStandardItems = standardItems.filter(
    standard => !priceItems.some(price => price.standard_item_id === standard.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/contractor/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Price List Management</h1>
                <p className="text-sm text-gray-500">{priceItems.length} items configured</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="table">
                  <Table className="h-4 w-4 mr-2" />
                  Price Table
                </TabsTrigger>
                <TabsTrigger value="sheets">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Sheets
                </TabsTrigger>
                <TabsTrigger value="import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import/Export
                </TabsTrigger>
              </TabsList>
              
              {/* Price Table Tab */}
              <TabsContent value="table" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Price List</CardTitle>
                        <CardDescription>
                          Manage your service pricing for {contractor?.trade} work
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowNewItemForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Add New Item Form */}
                    {showNewItemForm && (
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-4">Add New Price Item</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Service Description</Label>
                            <Input
                              value={newItemForm.description}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Install kitchen faucet"
                            />
                          </div>
                          <div>
                            <Label>Labor Cost</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newItemForm.laborCost}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, laborCost: e.target.value }))}
                              placeholder="150.00"
                            />
                          </div>
                          <div>
                            <Label>Material Cost</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newItemForm.materialCost}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, materialCost: e.target.value }))}
                              placeholder="75.00"
                            />
                          </div>
                          <div>
                            <Label>Total Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newItemForm.totalPrice}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                              placeholder="225.00"
                              required
                            />
                          </div>
                          <div>
                            <Label>Time (Hours)</Label>
                            <Input
                              type="number"
                              step="0.25"
                              value={newItemForm.timeHours}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, timeHours: e.target.value }))}
                              placeholder="1.5"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Notes</Label>
                            <Input
                              value={newItemForm.notes}
                              onChange={(e) => setNewItemForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Includes basic installation..."
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleAddNewItem}>
                            <Save className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewItemForm(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Price Items Table */}
                    <div className="space-y-4">
                      {priceItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium">
                                  {item.standard_work_item?.item_name || item.custom_description}
                                </h3>
                                {getSourceBadge(item.source)}
                              </div>
                              
                              {editingItem === item.id ? (
                                <div className="grid grid-cols-4 gap-3 mt-3">
                                  <div>
                                    <Label className="text-xs">Labor</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={item.labor_cost || ''}
                                      placeholder="Labor cost"
                                      id={`labor-${item.id}`}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Material</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={item.material_cost || ''}
                                      placeholder="Material cost"
                                      id={`material-${item.id}`}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Total</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={item.total_price}
                                      placeholder="Total price"
                                      id={`total-${item.id}`}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Hours</Label>
                                    <Input
                                      type="number"
                                      step="0.25"
                                      defaultValue={item.time_estimate_hours || ''}
                                      placeholder="Time"
                                      id={`time-${item.id}`}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Labor:</span> {formatCurrency(item.labor_cost)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Material:</span> {formatCurrency(item.material_cost)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Total:</span> {formatCurrency(item.total_price)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Time:</span> {item.time_estimate_hours || 0}h
                                  </div>
                                </div>
                              )}
                              
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {editingItem === item.id ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      const labor = (document.getElementById(`labor-${item.id}`) as HTMLInputElement)?.value
                                      const material = (document.getElementById(`material-${item.id}`) as HTMLInputElement)?.value
                                      const total = (document.getElementById(`total-${item.id}`) as HTMLInputElement)?.value
                                      const time = (document.getElementById(`time-${item.id}`) as HTMLInputElement)?.value
                                      
                                      handleSaveItem(item.id, {
                                        labor_cost: labor ? parseFloat(labor) : null,
                                        material_cost: material ? parseFloat(material) : null,
                                        total_price: parseFloat(total),
                                        time_estimate_hours: time ? parseFloat(time) : null
                                      })
                                    }}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingItem(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingItem(item.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {priceItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No price items yet. Upload invoices or add items manually to get started.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Google Sheets Tab */}
              <TabsContent value="sheets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Google Sheets Integration</CardTitle>
                    <CardDescription>
                      Sync your price list with Google Sheets for easy editing and sharing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contractor?.google_sheet_url ? (
                      <>
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Your Google Sheet is connected and synced automatically.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-4">
                          <Button asChild className="w-full">
                            <a href={contractor.google_sheet_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Google Sheet
                            </a>
                          </Button>
                          
                          <Button variant="outline" className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Changes
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Connect Google Sheets to manage your price list in a familiar spreadsheet interface.
                          </AlertDescription>
                        </Alert>
                        
                        <Button onClick={handleCreateGoogleSheet} className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Create Google Sheet
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Import/Export Tab */}
              <TabsContent value="import" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Import & Export</CardTitle>
                    <CardDescription>
                      Import existing price lists or export your current pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Import Options</h3>
                      <div className="space-y-3">
                        <Button className="w-full justify-start" asChild>
                          <Link href="/contractor/invoices">
                            <FileText className="h-4 w-4 mr-2" />
                            Upload Invoice Images
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <Upload className="h-4 w-4 mr-2" />
                          Import CSV File (Coming Soon)
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Export Options</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV (Coming Soon)
                        </Button>
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Export to PDF (Coming Soon)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price List Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Items</span>
                    <span className="font-medium">{priceItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Coverage</span>
                      <span className="font-medium">{Math.min(Math.round((priceItems.length / 50) * 100), 100)}%</span>
                    </div>
                    <Progress value={Math.min((priceItems.length / 50) * 100, 100)} className="h-2" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Missing Standards</span>
                    <span className="font-medium text-orange-600">{missingStandardItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Completion</span>
                      <span className="font-medium">
                        {standardItems.length > 0 ? Math.round(((standardItems.length - missingStandardItems.length) / standardItems.length) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={standardItems.length > 0 ? ((standardItems.length - missingStandardItems.length) / standardItems.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Price</span>
                    <span className="font-medium">
                      {priceItems.length > 0 ? 
                        formatCurrency(priceItems.reduce((sum, item) => sum + item.total_price, 0) / priceItems.length) : 
                        '$0'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Items Card */}
            {missingStandardItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Missing Standard Items</CardTitle>
                  <CardDescription>
                    Common {contractor?.trade} services you haven't priced yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {missingStandardItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="text-sm p-2 bg-orange-50 rounded">
                        {item.item_name}
                      </div>
                    ))}
                    {missingStandardItems.length > 5 && (
                      <p className="text-sm text-gray-500">
                        +{missingStandardItems.length - 5} more items
                      </p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                    <Link href="/contractor/onboarding#interview">
                      Complete via WhatsApp
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}