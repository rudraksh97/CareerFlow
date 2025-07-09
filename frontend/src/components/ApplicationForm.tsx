import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, ExternalLink, Building, User, Mail, FileText, Upload } from 'lucide-react'
import { api } from '@/services/api'

interface ApplicationFormProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  company_name: string
  job_title: string
  job_id: string
  job_url: string
  portal_url: string
  status: string
  date_applied: string
  email_used: string
  source: string
  notes: string
  max_applications: string
}

const initialFormData: FormData = {
  company_name: '',
  job_title: '',
  job_id: '',
  job_url: '',
  portal_url: '',
  status: 'applied',
  date_applied: new Date().toISOString().split('T')[0],
  email_used: '',
  source: 'company_website',
  notes: '',
  max_applications: ''
}

export default function ApplicationForm({ isOpen, onClose }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<FormData & { resume: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const queryClient = useQueryClient()

  const createApplicationMutation = useMutation({
    mutationFn: async (data: { formData: FormData; file: File }) => {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(data.formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value)
        }
      })
      
      // Add file
      formDataToSend.append('resume', data.file)
      
      return api.post('/applications/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error creating application:', error)
      alert('Failed to create application. Please try again.')
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData & { resume: string }> = {}

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required'
    }

    if (!formData.job_id.trim()) {
      newErrors.job_id = 'Job ID is required'
    }

    if (!formData.job_url.trim()) {
      newErrors.job_url = 'Job URL is required'
    } else if (!isValidUrl(formData.job_url)) {
      newErrors.job_url = 'Please enter a valid URL'
    }

    if (formData.portal_url && !isValidUrl(formData.portal_url)) {
      newErrors.portal_url = 'Please enter a valid URL'
    }

    if (!formData.email_used.trim()) {
      newErrors.email_used = 'Email is required'
    } else if (!isValidEmail(formData.email_used)) {
      newErrors.email_used = 'Please enter a valid email'
    }

    if (!resumeFile) {
      newErrors.resume = 'Resume file is required'
    }

    if (!formData.date_applied) {
      newErrors.date_applied = 'Date applied is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        setErrors(prev => ({ ...prev, resume: 'Please select a PDF, DOC, or DOCX file' }))
        return
      }
      
      setResumeFile(file)
      setResumeFileName(file.name)
      setErrors(prev => ({ ...prev, resume: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !resumeFile) return

    setIsSubmitting(true)
    try {
      await createApplicationMutation.mutateAsync({ formData, file: resumeFile })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    setIsSubmitting(false)
    setResumeFile(null)
    setResumeFileName('')
    onClose()
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 overflow-y-auto p-8 pb-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Add New Application</h2>
              <p className="text-neutral-600 mt-1">Track your job application details</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10" id="application-form">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-blue-100 bg-blue-50">
                  <Building className="h-4 w-4 text-blue-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Company Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className={`input-field ${errors.company_name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Google, Microsoft"
                  />
                  {errors.company_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.company_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className={`input-field ${errors.job_title ? 'border-red-500' : ''}`}
                    placeholder="e.g., Software Engineer"
                  />
                  {errors.job_title && (
                    <p className="mt-2 text-sm text-red-600">{errors.job_title}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-purple-100 bg-purple-50">
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Job Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Job ID *
                  </label>
                  <input
                    type="text"
                    value={formData.job_id}
                    onChange={(e) => handleInputChange('job_id', e.target.value)}
                    className={`input-field ${errors.job_id ? 'border-red-500' : ''}`}
                    placeholder="e.g., JOB-12345"
                  />
                  {errors.job_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.job_id}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Job URL *
                  </label>
                  <input
                    type="url"
                    value={formData.job_url}
                    onChange={(e) => handleInputChange('job_url', e.target.value)}
                    className={`input-field ${errors.job_url ? 'border-red-500' : ''}`}
                    placeholder="https://company.com/job-posting"
                  />
                  {errors.job_url && (
                    <p className="mt-2 text-sm text-red-600">{errors.job_url}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Portal URL
                  </label>
                  <input
                    type="url"
                    value={formData.portal_url}
                    onChange={(e) => handleInputChange('portal_url', e.target.value)}
                    className={`input-field ${errors.portal_url ? 'border-red-500' : ''}`}
                    placeholder="https://company.com/application-portal"
                  />
                  {errors.portal_url && (
                    <p className="mt-2 text-sm text-red-600">{errors.portal_url}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Source *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="input-field"
                  >
                    <option value="company_website">Company Website</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="glassdoor">Glassdoor</option>
                    <option value="angelist">AngelList</option>
                    <option value="yc">Y Combinator</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-emerald-100 bg-emerald-50">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Application Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date Applied *
                  </label>
                  <input
                    type="date"
                    value={formData.date_applied}
                    onChange={(e) => handleInputChange('date_applied', e.target.value)}
                    className={`input-field ${errors.date_applied ? 'border-red-500' : ''}`}
                  />
                  {errors.date_applied && (
                    <p className="mt-2 text-sm text-red-600">{errors.date_applied}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="input-field"
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-amber-100 bg-amber-50">
                  <User className="h-4 w-4 text-amber-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Contact Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Used *
                  </label>
                  <input
                    type="email"
                    value={formData.email_used}
                    onChange={(e) => handleInputChange('email_used', e.target.value)}
                    className={`input-field ${errors.email_used ? 'border-red-500' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email_used && (
                    <p className="mt-2 text-sm text-red-600">{errors.email_used}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Max Applications
                  </label>
                  <input
                    type="text"
                    value={formData.max_applications}
                    onChange={(e) => handleInputChange('max_applications', e.target.value)}
                    className="input-field"
                    placeholder="e.g., 5 per month"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-indigo-100 bg-indigo-50">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Resume</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Resume File *
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        errors.resume ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-600">
                          {resumeFileName ? resumeFileName : 'Click to upload resume (PDF, DOC, DOCX)'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Max file size: 10MB
                        </p>
                      </div>
                    </label>
                  </div>
                  {errors.resume && (
                    <p className="text-sm text-red-600">{errors.resume}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg ring-2 ring-gray-100 bg-gray-50">
                  <Mail className="h-4 w-4 text-gray-600" />
                </span>
                <span className="text-lg font-semibold text-neutral-900">Additional Notes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Any additional notes about this application..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-6 rounded-b-3xl">
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="application-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 