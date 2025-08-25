'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { intakeFormSchema } from '@/lib/utils/validation'
import { IntakeFormData } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Upload, X, Image, CheckCircle } from 'lucide-react'

interface IntakeFormProps {
  onSubmit: (data: IntakeFormData) => void
}

const PROJECT_TYPES = [
  'Kitchen Renovation',
  'Bathroom Renovation', 
  'Whole House',
  'Addition',
  'Flooring',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Painting',
  'Landscaping',
  'Other'
]

const BUDGET_RANGES = [
  { value: 'under-25k', label: 'Under $25,000' },
  { value: '25-50k', label: '$25,000 - $50,000' },
  { value: '50-100k', label: '$50,000 - $100,000' },
  { value: '100-250k', label: '$100,000 - $250,000' },
  { value: '250k+', label: '$250,000+' }
] as const

const TIMELINES = [
  { value: 'asap', label: 'ASAP (Within 4 weeks)' },
  { value: '3-months', label: 'Next 3 months' },
  { value: '6-months', label: 'Next 6 months' },
  { value: 'planning', label: 'Planning ahead (6+ months)' }
] as const

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{ file: File; url: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema) as any,
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      title: '',
      projectType: [],
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      budgetRange: '50-100k',
      timeline: 'planning',
      photos: [],
      additionalRequirements: ''
    }
  })

  const watchedProjectType = form.watch('projectType') || []

  const handleProjectTypeChange = (type: string) => {
    const current = watchedProjectType
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    form.setValue('projectType', updated)
  }

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    let invalidCount = 0
    let oversizedCount = 0
    
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnder10MB = file.size <= 10 * 1024 * 1024
      
      if (!isImage) invalidCount++
      else if (!isUnder10MB) oversizedCount++
      
      return isImage && isUnder10MB
    })

    // Show warnings if files were rejected
    if (invalidCount > 0 || oversizedCount > 0) {
      const warnings = []
      if (invalidCount > 0) warnings.push(`${invalidCount} non-image file(s) skipped`)
      if (oversizedCount > 0) warnings.push(`${oversizedCount} file(s) over 10MB skipped`)
      // You could add a toast notification here to inform the user
      console.warn(warnings.join(', '))
    }

    // Limit to 20 files total
    const totalFiles = [...selectedFiles, ...validFiles].slice(0, 20)
    setSelectedFiles(totalFiles)
    form.setValue('photos', totalFiles as any)

    // Create previews for new files
    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }))
    
    setFilePreviews(prev => [...prev, ...newPreviews].slice(0, 20))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    form.setValue('photos', newFiles as any)
    
    // Clean up preview URL and remove from previews
    URL.revokeObjectURL(filePreviews[index].url)
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url)
      })
    }
  }, [])

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: string[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'projectType']
        break
      case 2:
        fieldsToValidate = ['description', 'address.street', 'address.city', 'address.state', 'address.zip']
        break
      case 3:
        fieldsToValidate = ['budgetRange', 'timeline']
        break
    }
    
    console.log(`Validating step ${currentStep} fields:`, fieldsToValidate)
    const isValid = await form.trigger(fieldsToValidate as any)
    console.log(`Step ${currentStep} validation result:`, isValid)
    
    if (!isValid) {
      console.log('Validation errors:', form.formState.errors)
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Kitchen Renovation in Palo Alto"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your project a descriptive title that includes location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <FormDescription>
                    Select all that apply to your renovation project
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {PROJECT_TYPES.map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="projectType"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type}
                              className={`flex flex-row items-center space-x-3 space-y-0 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                                watchedProjectType.includes(type)
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              data-checkbox-wrapper
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value: string) => value !== type
                                          )
                                        )
                                  }}
                                  className="border-gray-400"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-medium cursor-pointer flex-1">
                                {type}
                              </FormLabel>
                              {watchedProjectType.includes(type) && (
                                <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                              )}
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your project in detail. Include current condition, desired outcomes, any specific requirements or preferences..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>
                      The more details you provide, the better we can match you with the right contractors
                    </FormDescription>
                    <span className={`text-sm ${
                      (field.value?.length || 0) >= 50 
                        ? 'text-green-600' 
                        : (field.value?.length || 0) > 0 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                    }`}>
                      {field.value?.length || 0}/50 characters {(field.value?.length || 0) < 50 && (field.value?.length || 0) > 0 ? '(minimum 50)' : ''}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel className="text-base">Project Address</FormLabel>
              
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Palo Alto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="94301" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">Budget Range</FormLabel>
                  <FormDescription>
                    Select your approximate budget range for this project
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      {BUDGET_RANGES.map((range) => (
                        <div key={range.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem 
                            value={range.value} 
                            id={`budget-${range.value}`}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`budget-${range.value}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {range.label}
                            </label>
                          </div>
                          {field.value === range.value && (
                            <Badge variant="secondary" className="ml-auto">
                              Selected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">Timeline Preference</FormLabel>
                  <FormDescription>
                    When would you like to start this project?
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      {TIMELINES.map((timeline) => (
                        <div key={timeline.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem 
                            value={timeline.value} 
                            id={`timeline-${timeline.value}`}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`timeline-${timeline.value}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {timeline.label}
                            </label>
                          </div>
                          {field.value === timeline.value && (
                            <Badge variant="secondary" className="ml-auto">
                              Selected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="photos">Project Photos</Label>
              <div className="mt-2">
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200 relative
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`mx-auto h-12 w-12 transition-colors duration-200 ${
                    isDragging ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <div className="mt-4">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {isDragging ? 'Drop your photos here' : 'Upload photos of your space'}
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Click to browse or drag and drop
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB each. Minimum 1, maximum 20 photos.
                    </p>
                    {selectedFiles.length > 0 && (
                      <p className="mt-2 text-sm font-medium text-blue-600">
                        {selectedFiles.length} of 20 photos selected
                      </p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {/* Thumbnail Previews */}
              {filePreviews.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected photos ({filePreviews.length}/20)
                    </p>
                    {filePreviews.length < 20 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUploadClick}
                      >
                        Add More Photos
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden bg-gray-100 w-20 h-20">
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="mt-1">
                          <p className="text-[10px] text-gray-600 truncate" title={preview.file.name}>
                            {preview.file.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {(preview.file.size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State for No Photos */}
              {filePreviews.length === 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <Image className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-600">
                      <strong>Required:</strong> Please upload 1-20 photos to help contractors better understand your project.
                    </p>
                  </div>
                </div>
              )}
              
              {form.formState.errors.photos && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.photos.message}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="additionalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific materials, timeline constraints, or other requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>
                      Optional: Include any special requirements or preferences for your project
                    </FormDescription>
                    <span className="text-sm text-gray-500">
                      {field.value?.length || 0} characters
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Project Intake Form</CardTitle>
        <CardDescription>
          Step {currentStep} of 4 - Tell us about your renovation project
        </CardDescription>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(
            (data) => {
              console.log('Form submission successful:', data)
              onSubmit(data)
            },
            (errors) => {
              console.log('Form validation errors:', errors)
            }
          )} className="space-y-6">
            {renderStep()}

            {/* Show validation errors for current step */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                <ul className="space-y-1">
                  {Object.entries(form.formState.errors).map(([field, error]) => {
                    // Handle nested address errors more specifically
                    if (field === 'address' && typeof error === 'object' && error !== null) {
                      const addressErrors = error as any
                      return Object.entries(addressErrors).map(([subField, subError]: [string, any]) => (
                        <li key={`${field}.${subField}`} className="text-sm">
                          <strong style={{ color: '#b91c1c' }} className="font-bold">
                            {subField === 'zip' ? 'ZIP Code' : 
                             subField === 'street' ? 'Street Address' :
                             subField === 'city' ? 'City' :
                             subField === 'state' ? 'State' : subField}:
                          </strong> <span style={{ color: '#dc2626' }}>{subError?.message || 'Invalid value'}</span>
                        </li>
                      ))
                    }
                    
                    // Handle regular field errors
                    return (
                      <li key={field} className="text-sm">
                        <strong style={{ color: '#b91c1c' }} className="font-bold">{field}:</strong> <span style={{ color: '#dc2626' }}>{error?.message || 'Invalid value'}</span>
                      </li>
                    )
                  })}
                </ul>
                {currentStep < 4 && (
                  <div className="mt-3 text-sm text-red-600">
                    Please complete all required fields before proceeding to the next step.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="flex items-center gap-2"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Project
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}