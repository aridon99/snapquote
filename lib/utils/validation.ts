import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')

export const phoneSchema = z.string().regex(
  /^\(\d{3}\) \d{3}-\d{4}$/,
  'Phone must be in format (123) 456-7890'
)

export const zipCodeSchema = z.string().regex(
  /^\d{5}(-\d{4})?$/,
  'Invalid ZIP code'
)

// Address validation
export const addressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: zipCodeSchema,
})

// Project validation
export const projectTypeSchema = z.array(z.string()).min(1, 'Select at least one project type')

export const budgetRangeSchema = z.enum(['under-25k', '25-50k', '50-100k', '100-250k', '250k+'])

export const timelineSchema = z.enum(['asap', '3-months', '6-months', 'planning'])

// Intake form validation
export const intakeFormSchema = z.object({
  title: z.string().min(5, 'Project title must be at least 5 characters'),
  projectType: projectTypeSchema,
  description: z.string().min(50, 'Please provide more detail about your project'),
  address: addressSchema,
  budgetRange: budgetRangeSchema,
  timeline: timelineSchema,
  photos: z.any().refine(
    (files) => files?.length >= 1 && files?.length <= 20,
    'Please upload 1-20 photos'
  ),
  additionalRequirements: z.string().optional(),
})

// Budget item validation
export const budgetItemSchema = z.object({
  category: z.enum(['labor', 'materials', 'permits', 'other']),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  budgeted_amount: z.number().positive('Amount must be positive').optional(),
  actual_amount: z.number().positive('Amount must be positive').optional(),
  notes: z.string().optional(),
})

// Message validation
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  is_action_item: z.boolean().default(false),
  mentions: z.array(z.string()).default([]),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    'Must be a valid file'
  ),
  category: z.enum(['photo', 'document', 'permit', 'warranty', 'receipt', 'other']),
  description: z.string().optional(),
})

// Utility functions
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function validatePhone(phone: string): boolean {
  try {
    phoneSchema.parse(phone)
    return true
  } catch {
    return false
  }
}

export function validateZipCode(zip: string): boolean {
  try {
    zipCodeSchema.parse(zip)
    return true
  } catch {
    return false
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
}