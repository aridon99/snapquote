'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IntakeForm } from '@/components/forms/IntakeForm'
import { IntakeFormData } from '@/types/database'
import { toast } from 'react-hot-toast'

export default function IntakePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (data: IntakeFormData) => {
    console.log('Intake form submitted:', data)
    setIsSubmitting(true)
    
    try {
      // Since we don't have Supabase configured, we'll simulate the submission
      // In production, this would call the API endpoint
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo purposes, we'll just show success
      toast.success('Project submitted successfully! We\'ll be in touch soon.')
      
      // Redirect to a success page or dashboard
      setTimeout(() => {
        router.push('/')
      }, 2000)
      
      /* Production code would be:
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit project')
      }
      
      const result = await response.json()
      toast.success('Project submitted successfully! We\'ll be in touch soon.')
      
      // Redirect to the project page
      router.push(`/projects/${result.project.id}`)
      */
      
    } catch (error) {
      toast.error('Failed to submit project. Please try again.')
      console.error('Submission error:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Renovation Project
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us about your project and we'll connect you with the best contractors 
            in your area. This should take about 5-10 minutes to complete.
          </p>
        </div>
        
        <IntakeForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}