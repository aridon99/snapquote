export interface Tenant {
  id: string
  type: 'homeowner' | 'admin'
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  phone: string | null
  company: string | null
  role: 'homeowner' | 'admin'
  avatar_url: string | null
  trusted_for_autopay: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  tenant_id: string
  homeowner_id: string
  reference_code?: string | null
  campaign_id?: string | null
  title: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  project_type: string[]
  description: string | null
  budget_range: string | null
  timeline_preference: string | null
  status: 'intake' | 'planning' | 'contractor_selection' | 'in_progress' | 'completed' | 'on_hold' | 'payment_pending' | 'delayed'
  brief_url: string | null
  total_budget: number | null
  spent_amount: number
  material_budget: number | null
  material_spent: number
  advisory_fee: number | null
  escrow_balance: number
  start_date: string | null
  target_end_date: string | null
  actual_end_date: string | null
  permit_requirements: any | null
  chatbot_context: any | null
  last_viewed_by?: string | null
  last_viewed_at?: string | null
  // Enhanced budget fields
  budget_allocated: number
  budget_spent: number
  budget_committed: number
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface Contractor {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  license_number: string | null
  license_type: 'licensed' | 'handyman' | 'specialty' | null
  insurance_info: any | null
  insurance_expiry: string | null
  specialties: string[]
  service_areas: string[]
  price_range: 'budget' | 'mid-range' | 'premium'
  availability_status: 'available' | 'busy_2_weeks' | 'busy_month' | 'unavailable'
  rating: number | null
  completed_projects: number
  performance_score: number
  stripe_account_id: string | null
  notes: string | null
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProjectContractor {
  id: string
  project_id: string
  contractor_id: string
  status: 'proposed' | 'accepted' | 'declined' | 'hired'
  bid_amount: number | null
  notes: string | null
  introduced_at: string
  responded_at: string | null
  hired_at: string | null
}

export interface Message {
  id: string
  project_id: string
  sender_id: string
  content: string
  attachments: any[] | null
  mentions: string[]
  is_action_item: boolean
  is_read: boolean
  created_at: string
}

export interface ProjectSession {
  id: string
  project_id: string
  user_id: string
  user_role: 'owner' | 'advisor' | 'contractor'
  started_at: string
  last_activity: string
  is_active: boolean
}

export interface RenovationCampaign {
  id: string
  homeowner_id: string
  name: string
  description?: string | null
  total_budget: number
  start_date?: string | null
  target_end_date?: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ProjectBudgetAllocation {
  id: string
  project_id: string
  campaign_id?: string | null
  allocated_amount: number
  initial_allocation: number
  spent_amount: number
  committed_amount: number
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface BudgetTransfer {
  id: string
  campaign_id?: string | null
  from_project_id: string
  to_project_id: string
  amount: number
  reason?: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_by?: string | null
  approved_by?: string | null
  requested_at: string
  approved_at?: string | null
  from_project_remaining_before?: number | null
  from_project_remaining_after?: number | null
  to_project_remaining_before?: number | null
  to_project_remaining_after?: number | null
}

export interface ProjectMilestone {
  id: string
  project_id: string
  name: string
  description?: string | null
  target_date?: string | null
  completed_date?: string | null
  progress_percentage: number
  budgeted_cost?: number | null
  actual_cost?: number | null
  status: 'planned' | 'in_progress' | 'completed' | 'delayed'
  order_index: number
  is_critical_path: boolean
  created_at: string
  updated_at: string
}

export interface BudgetTransaction {
  id: string
  project_id: string
  milestone_id?: string | null
  type: 'expense' | 'allocation' | 'transfer_in' | 'transfer_out' | 'refund'
  amount: number
  description: string
  category?: string | null
  vendor?: string | null
  invoice_number?: string | null
  receipt_url?: string | null
  contractor_id?: string | null
  status: 'pending' | 'approved' | 'paid'
  approved_by?: string | null
  approved_at?: string | null
  transaction_date: string
  created_at: string
}

export interface BudgetItem {
  id: string
  project_id: string
  category: 'labor' | 'materials' | 'permits' | 'other'
  description: string
  budgeted_amount: number | null
  actual_amount: number | null
  contractor_id: string | null
  is_change_order: boolean
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  category: 'photo' | 'document' | 'permit' | 'warranty' | 'receipt' | 'other'
  description: string | null
  created_at: string
}

export interface IntakeForm {
  id: string
  project_id: string
  form_data: {
    title: string
    projectType: string[]
    description: string
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
    budgetRange: string
    timeline: string
    photos: File[]
    additionalRequirements?: string
  }
  completed_at: string
}

export interface PaymentTransaction {
  id: string
  project_id: string
  tenant_id: string
  type: 'material_deposit' | 'material_purchase' | 'milestone' | 'advisory_fee' | 'refund'
  status: 'pending' | 'held_escrow' | 'processing' | 'completed' | 'failed' | 'refunded'
  amount: number
  from_party: string
  to_party: string | null
  contractor_id: string | null
  stripe_payment_intent_id: string | null
  stripe_account_id: string | null
  escrow_release_approved_by: string | null
  escrow_release_approved_at: string | null
  description: string | null
  receipt_url: string | null
  created_at: string
  processed_at: string | null
}

export interface MaterialPurchase {
  id: string
  project_id: string
  tenant_id: string
  vendor_name: string
  purchase_date: string
  description: string
  quantity: number
  retail_price: number | null
  our_price: number
  savings_amount: number
  receipt_url: string | null
  delivery_date: string | null
  delivery_status: 'pending' | 'scheduled' | 'delivered'
  notes: string | null
  created_at: string
}

export interface ProjectMilestone {
  id: string
  project_id: string
  tenant_id: string
  name: string
  description: string | null
  target_date: string | null
  completion_date: string | null
  payment_percentage: number | null
  payment_amount: number | null
  contractor_id: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'paid'
  payment_status: 'not_due' | 'due' | 'overdue' | 'paid'
  auto_approve_payment: boolean
  photos: string[]
  completed_items: string[]
  created_at: string
}

export interface TrustCredential {
  id: string
  credential_type: 'bond' | 'insurance' | 'license' | 'certification' | 'membership'
  credential_name: string
  credential_number: string | null
  issuing_body: string | null
  issue_date: string | null
  expiry_date: string | null
  verification_url: string | null
  is_active: boolean
  display_order: number | null
  created_at: string
}

export interface CaseStudy {
  id: string
  title: string
  client_type: string | null
  location: string | null
  project_type: string | null
  challenge: string | null
  solution: string | null
  timeline_weeks: number | null
  budget_range: string | null
  roi_percentage: number | null
  testimonial: string | null
  testimonial_author: string | null
  before_photos: string[]
  after_photos: string[]
  featured: boolean
  published: boolean
  created_at: string
}

export interface PaymentReminder {
  id: string
  project_id: string
  milestone_id: string | null
  reminder_number: number | null
  sent_at: string | null
  response_received: boolean
  reminder_type: 'email' | 'sms' | 'phone' | 'in_app'
}

// Utility types
export type ProjectStatus = Project['status']
export type ContractorAvailability = Contractor['availability_status']
export type PriceRange = Contractor['price_range']
export type BudgetCategory = BudgetItem['category']
export type FileCategory = ProjectFile['category']
export type UserRole = Profile['role']
export type PaymentTransactionType = PaymentTransaction['type']
export type PaymentTransactionStatus = PaymentTransaction['status']
export type DeliveryStatus = MaterialPurchase['delivery_status']
export type MilestoneStatus = ProjectMilestone['status']
export type PaymentStatus = ProjectMilestone['payment_status']
export type CredentialType = TrustCredential['credential_type']
export type ReminderType = PaymentReminder['reminder_type']

// Form types
export interface IntakeFormData {
  title: string
  projectType: string[]
  description: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  budgetRange: '25-50k' | '50-100k' | '100-250k' | '250k+'
  timeline: 'asap' | '3-months' | '6-months' | 'planning'
  photos: FileList | File[]
  additionalRequirements?: string
}

export interface ContractorMatchRequest {
  projectType: string[]
  budgetRange: string
  serviceArea: string
  timeline: string
}

export interface ContractorMatchResponse {
  contractors: Contractor[]
  matchScore?: number
}

// Database response types
export type DatabaseResponse<T> = {
  data: T | null
  error: any | null
}

export type DatabaseArrayResponse<T> = {
  data: T[] | null
  error: any | null
}