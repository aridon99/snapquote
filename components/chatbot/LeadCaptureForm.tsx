'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LeadData } from './types'

interface LeadCaptureFormProps {
  onSubmit: (data: LeadData) => void
  onCancel: () => void
}

export function LeadCaptureForm({ onSubmit, onCancel }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Partial<LeadData>>({
    preferredTime: 'afternoon'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Track lead form submission attempt
      if (typeof window !== 'undefined') {
        const sessionId = sessionStorage.getItem('chatbot-session-id') || 'anonymous'
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          body: JSON.stringify({
            event_type: 'lead_form_submitted',
            event_data: {
              projectType: formData.projectType,
              hasProjectDetails: !!formData.projectDetails,
              source: 'chatbot'
            },
            session_id: sessionId
          })
        }).catch(() => {}) // Fire and forget
      }

      // Submit lead data to API
      const response = await fetch('/api/chatbot/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': typeof window !== 'undefined' ? 
            sessionStorage.getItem('chatbot-session-id') || 'anonymous' : 'server'
        },
        body: JSON.stringify({
          ...formData,
          source: 'chatbot',
          sessionId: typeof window !== 'undefined' ? 
            sessionStorage.getItem('chatbot-session-id') || 'anonymous' : 'server',
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit lead')
      }

      const result = await response.json()

      // Track successful lead capture
      if (typeof window !== 'undefined') {
        const sessionId = sessionStorage.getItem('chatbot-session-id') || 'anonymous'
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          body: JSON.stringify({
            event_type: 'lead_captured_success',
            event_data: {
              leadId: result.leadId,
              projectType: formData.projectType,
              source: 'chatbot'
            },
            session_id: sessionId,
            lead_id: result.leadId
          })
        }).catch(() => {}) // Fire and forget
      }

      onSubmit(formData as LeadData)
    } catch (error) {
      console.error('Lead submission error:', error)
      
      // Track failed lead capture
      if (typeof window !== 'undefined') {
        const sessionId = sessionStorage.getItem('chatbot-session-id') || 'anonymous'
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          body: JSON.stringify({
            event_type: 'lead_capture_failed',
            event_data: {
              error: error instanceof Error ? error.message : 'Unknown error',
              source: 'chatbot'
            },
            session_id: sessionId
          })
        }).catch(() => {}) // Fire and forget
      }
      
      setErrors({ submit: 'Failed to submit information. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof LeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-sm font-medium text-gray-900 mb-3">
        Great! I'd love to have one of our renovation advisors reach out. Could you share your contact information?
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm">Name *</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="Your full name"
          className="text-sm"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="your@email.com"
          className="text-sm"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => updateFormData('phone', e.target.value)}
          placeholder="(555) 123-4567"
          className="text-sm"
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-2" style={{ display: 'none' }}>
        <Label htmlFor="preferredTime" className="text-sm">Best time to call</Label>
        <Select 
          value={formData.preferredTime} 
          onValueChange={(value) => updateFormData('preferredTime', value as LeadData['preferredTime'])}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
            <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
            <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2" style={{ display: 'none' }}>
        <Label htmlFor="projectDetails" className="text-sm">
          Anything specific about your project? (optional)
        </Label>
        <Textarea
          id="projectDetails"
          value={formData.projectDetails || ''}
          onChange={(e) => updateFormData('projectDetails', e.target.value)}
          placeholder="Tell us about your renovation plans..."
          className="text-sm min-h-[60px]"
          rows={3}
        />
      </div>

      {errors.submit && (
        <p className="text-xs text-red-500 text-center">{errors.submit}</p>
      )}

      <div className="flex space-x-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 text-sm"
        >
          Not now
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-kurtis-accent hover:bg-kurtis-black text-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}