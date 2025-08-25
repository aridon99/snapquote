// Quote System Types

export interface Quote {
  id: string
  contractor_id: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  customer_address: string
  project_description: string
  status: 'draft' | 'review' | 'sent' | 'accepted' | 'rejected'
  version: number
  total_amount: number
  valid_until: Date
  created_at: Date
  updated_at: Date
  sent_at?: Date
  viewed_at?: Date
  accepted_at?: Date
}

export interface QuoteItem {
  id: string
  quote_id: string
  item_code?: string
  description: string
  quantity: number
  unit: 'each' | 'hour' | 'sqft' | 'lf' | 'job'
  unit_price: number
  total_price: number
  category: 'labor' | 'material' | 'equipment' | 'other'
  notes?: string
  display_order: number
}

export interface QuoteEdit {
  id: string
  quote_id: string
  version_from: number
  version_to: number
  edit_type: 'price_change' | 'add_item' | 'remove_item' | 'description_change' | 'quantity_change'
  voice_transcript?: string
  changes_json: any
  confidence_score: number
  created_at: Date
}

export interface QuoteTemplate {
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  license_number?: string
  insurance_info?: string
  logo_url?: string
  terms_and_conditions: string
  payment_terms: string
  warranty_info?: string
}

export interface VoiceEditCommand {
  type: 'CHANGE_PRICE' | 'ADD_ITEM' | 'REMOVE_ITEM' | 'CHANGE_QUANTITY' | 'BULK_CHANGE'
  target?: string // Item description or identifier
  value?: number // New price or quantity
  description?: string // For new items
  operation?: 'add_percentage' | 'subtract_percentage' | 'set_total'
  scope?: 'all' | 'labor' | 'material' | string // For bulk operations
  confidence: number
}

export interface QuoteReviewSession {
  quote_id: string
  contractor_id: string
  state: 'INITIAL' | 'REVIEWING_QUOTE' | 'CONFIRMING_CHANGES' | 'FINALIZED'
  current_version: number
  pending_changes?: VoiceEditCommand[]
  whatsapp_thread_id: string
  started_at: Date
  last_activity: Date
}