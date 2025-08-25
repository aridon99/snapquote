'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload,
  FileImage,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
  ArrowLeft,
  Camera,
  Smartphone,
  Loader2,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface ContractorData {
  id: string
  business_name: string
  phone: string
  trade: string
}

interface Invoice {
  id: string
  file_url: string
  file_name: string | null
  upload_source: string
  processing_status: string
  extracted_data: any
  extracted_items_count: number | null
  processing_error: string | null
  processed_at: string | null
  created_at: string
}

export default function ContractorInvoices() {
  const [contractor, setContractor] = useState<ContractorData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadContractorData()
    
    // Polling for processing updates
    const interval = setInterval(() => {
      refreshProcessingStatus()
    }, 5000)
    
    return () => clearInterval(interval)
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

        // Load invoices
        const { data: invoicesData } = await supabase
          .from('contractor_invoices')
          .select('*')
          .eq('contractor_id', contractorData.id)
          .order('created_at', { ascending: false })

        if (invoicesData) {
          setInvoices(invoicesData)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load invoice data')
    } finally {
      setLoading(false)
    }
  }

  const refreshProcessingStatus = async () => {
    if (!contractor) return

    try {
      const { data: invoicesData } = await supabase
        .from('contractor_invoices')
        .select('*')
        .eq('contractor_id', contractor.id)
        .order('created_at', { ascending: false })

      if (invoicesData) {
        setInvoices(invoicesData)
      }
    } catch (error) {
      console.error('Error refreshing invoices:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !contractor) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`)
          continue
        }

        // Upload to Supabase storage
        const fileName = `invoices/${contractor.id}/${Date.now()}-${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contractor-files')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('contractor-files')
          .getPublicUrl(fileName)

        // Create invoice record
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('contractor_invoices')
          .insert({
            contractor_id: contractor.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
            upload_source: 'web',
            processing_status: 'pending'
          })
          .select()
          .single()

        if (invoiceError) {
          console.error('Invoice record error:', invoiceError)
          toast.error(`Failed to save ${file.name}`)
          continue
        }

        // Add to local state
        setInvoices(prev => [invoiceData, ...prev])

        // Process with GPT (simulate for now)
        setTimeout(async () => {
          await processInvoiceWithGPT(invoiceData.id)
        }, 2000)
      }

      toast.success(`${files.length} invoice(s) uploaded successfully!`)
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload invoices')
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const processInvoiceWithGPT = async (invoiceId: string) => {
    try {
      // Simulate GPT processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock extracted data
      const mockExtractedData = {
        items: [
          { description: 'Install kitchen faucet', amount: 125.00, category: 'plumbing' },
          { description: 'Replace bathroom toilet', amount: 200.00, category: 'plumbing' },
          { description: 'Fix leaky pipe', amount: 85.00, category: 'plumbing' }
        ],
        total: 410.00,
        confidence: 0.92
      }

      // Update invoice record
      const { error } = await supabase
        .from('contractor_invoices')
        .update({
          processing_status: 'completed',
          extracted_data: mockExtractedData,
          extracted_items_count: mockExtractedData.items.length,
          processed_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) {
        console.error('Error updating invoice:', error)
        return
      }

      // Update onboarding progress
      await supabase
        .from('contractor_onboarding_progress')
        .upsert({
          contractor_id: contractor?.id,
          invoices_uploaded: invoices.length + 1,
          first_invoice_at: invoices.length === 0 ? new Date().toISOString() : undefined,
          items_extracted: (await supabase
            .from('contractor_invoices')
            .select('extracted_items_count')
            .eq('contractor_id', contractor?.id)
            .then(({ data }) => data?.reduce((sum, inv) => sum + (inv.extracted_items_count || 0), 0) || 0))
        })

      // Create price items from extracted data
      for (const item of mockExtractedData.items) {
        await supabase
          .from('contractor_price_items')
          .insert({
            contractor_id: contractor?.id,
            custom_description: item.description,
            total_price: item.amount,
            source: 'invoice',
            confidence_score: mockExtractedData.confidence
          })
      }

      toast.success('Invoice processed successfully!')
      refreshProcessingStatus()
    } catch (error) {
      console.error('Error processing invoice:', error)
      
      // Mark as failed
      await supabase
        .from('contractor_invoices')
        .update({
          processing_status: 'failed',
          processing_error: 'GPT processing failed'
        })
        .eq('id', invoiceId)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Processing...', color: 'bg-yellow-500', icon: Clock },
      'processing': { label: 'Processing...', color: 'bg-blue-500', icon: Loader2 },
      'completed': { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
      'failed': { label: 'Failed', color: 'bg-red-500', icon: AlertCircle }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalItemsExtracted = invoices.reduce((sum, invoice) => 
    sum + (invoice.extracted_items_count || 0), 0
  )

  const completedInvoices = invoices.filter(inv => inv.processing_status === 'completed').length

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
                <h1 className="text-xl font-semibold">Invoice Management</h1>
                <p className="text-sm text-gray-500">
                  Upload invoices to automatically extract pricing
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Invoice Images</CardTitle>
                <CardDescription>
                  Upload photos of your past invoices to automatically extract service pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Two ways to upload:</strong>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>Upload files here on the website</li>
                      <li>Send photos directly to our WhatsApp bot</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 text-gray-400">
                        {uploading ? (
                          <Loader2 className="h-12 w-12 animate-spin" />
                        ) : (
                          <Upload className="h-12 w-12" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {uploading ? 'Uploading...' : 'Click to upload invoice images'}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG up to 10MB each. Multiple files supported.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* WhatsApp Alternative */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Smartphone className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-800">Upload via WhatsApp</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Send invoice photos directly to our WhatsApp bot: <strong>+1 (555) 123-4567</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Just send the photos - no message needed. We'll process them automatically!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Uploaded Invoices</CardTitle>
                    <CardDescription>
                      {invoices.length} invoice(s) uploaded, {completedInvoices} processed
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshProcessingStatus}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No invoices uploaded yet.</p>
                    <p className="text-sm mt-1">Upload your first invoice to get started extracting pricing data.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">
                                {invoice.file_name || 'Unnamed Invoice'}
                              </h3>
                              {getStatusBadge(invoice.processing_status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Uploaded:</span> {formatDate(invoice.created_at)}
                              </div>
                              <div>
                                <span className="font-medium">Source:</span> {
                                  invoice.upload_source === 'web' ? 'Website' : 'WhatsApp'
                                }
                              </div>
                              {invoice.extracted_items_count && (
                                <div>
                                  <span className="font-medium">Items:</span> {invoice.extracted_items_count} extracted
                                </div>
                              )}
                              {invoice.processed_at && (
                                <div>
                                  <span className="font-medium">Processed:</span> {formatDate(invoice.processed_at)}
                                </div>
                              )}
                            </div>
                            
                            {invoice.processing_error && (
                              <Alert className="mt-3 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  {invoice.processing_error}
                                </AlertDescription>
                              </Alert>
                            )}

                            {invoice.processing_status === 'processing' && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span>Processing with AI...</span>
                                </div>
                                <Progress value={65} className="h-2" />
                              </div>
                            )}
                            
                            {/* Show extracted items preview */}
                            {invoice.extracted_data && invoice.processing_status === 'completed' && (
                              <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                                <h4 className="font-medium text-green-800 mb-2">Extracted Items:</h4>
                                <div className="space-y-1">
                                  {invoice.extracted_data.items?.slice(0, 3).map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm text-green-700">
                                      <span>{item.description}</span>
                                      <span className="font-medium">${item.amount}</span>
                                    </div>
                                  ))}
                                  {(invoice.extracted_data.items?.length || 0) > 3 && (
                                    <p className="text-xs text-green-600">
                                      +{invoice.extracted_data.items.length - 3} more items
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Total Invoices</span>
                    <span className="font-medium">{invoices.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Processed</span>
                    <span className="font-medium text-green-600">{completedInvoices}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Items Extracted</span>
                    <span className="font-medium">{totalItemsExtracted}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Rate</span>
                    <span className="font-medium">
                      {invoices.length > 0 ? Math.round((completedInvoices / invoices.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/contractor/pricing">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Review Price List
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/contractor/onboarding#interview">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>✓ Use clear, well-lit photos</p>
                <p>✓ Include the entire invoice in the frame</p>
                <p>✓ Upload recent invoices for current pricing</p>
                <p>✓ Send multiple invoices for better accuracy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {selectedInvoice.file_name || 'Invoice Details'}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <img
                src={selectedInvoice.file_url}
                alt="Invoice"
                className="w-full rounded-lg border"
              />
              {selectedInvoice.extracted_data && (
                <div>
                  <h3 className="font-medium mb-3">Extracted Information:</h3>
                  <div className="space-y-2">
                    {selectedInvoice.extracted_data.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{item.description}</span>
                        <span className="font-medium">${item.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${selectedInvoice.extracted_data.total}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Confidence: {Math.round((selectedInvoice.extracted_data.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}