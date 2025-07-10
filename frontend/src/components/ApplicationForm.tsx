import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Briefcase, Zap, Upload, FileText } from 'lucide-react'
import { api } from '../services/api'
import { ApplicationPriority } from '../types'

interface Application {
  id?: string
  company_name: string
  job_title: string
  job_id: string
  job_url: string
  portal_url?: string
  status: string
  priority: ApplicationPriority
  date_applied: string
  email_used: string
  resume_filename?: string
  cover_letter_filename?: string
  source: string
  notes?: string
}

interface ApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  editingApplication?: Application | null
}

interface FormData {
  company_name: string
  job_title: string
  job_id: string
  job_url: string
  portal_url: string
  status: string
  priority: ApplicationPriority
  date_applied: string
  email_used: string
  source: string
  notes: string
  resume: File | null
  cover_letter: File | null
}

interface FormErrors {
  company_name?: string
  job_title?: string
  job_id?: string
  job_url?: string
  portal_url?: string
  status?: string
  priority?: string
  date_applied?: string
  email_used?: string
  source?: string
  notes?: string
  resume?: string
  cover_letter?: string
}

const initialFormData: FormData = {
  company_name: '',
  job_title: '',
  job_id: '',
  job_url: '',
  portal_url: '',
  status: 'applied',
  priority: ApplicationPriority.MEDIUM,
  date_applied: new Date().toISOString().split('T')[0],
  email_used: '',
  source: 'linkedin',
  notes: '',
  resume: null,
  cover_letter: null
}

export default function ApplicationForm({ isOpen, onClose, editingApplication }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  
  const queryClient = useQueryClient()

  const createApplicationMutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData = new FormData()
      formData.append('company_name', data.company_name)
      formData.append('job_title', data.job_title)
      formData.append('job_id', data.job_id)
      formData.append('job_url', data.job_url)
      if (data.portal_url) formData.append('portal_url', data.portal_url)
      formData.append('status', data.status)
      formData.append('priority', data.priority)
      formData.append('date_applied', data.date_applied)
      formData.append('email_used', data.email_used)
      formData.append('source', data.source)
      if (data.notes) formData.append('notes', data.notes)
      if (data.resume) formData.append('resume', data.resume)
      if (data.cover_letter) formData.append('cover_letter', data.cover_letter)
      
      return api.post('/applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error creating application:', error)
      let errorMessage = 'Failed to create application. Please try again.'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : 'Failed to create application. Please check your form data.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    },
  })

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error updating application:', error)
      let errorMessage = 'Failed to update application. Please try again.'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : 'Failed to update application. Please check your form data.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    },
  })

  useEffect(() => {
    if (editingApplication) {
      setFormData({
        company_name: editingApplication.company_name || '',
        job_title: editingApplication.job_title || '',
        job_id: editingApplication.job_id || '',
        job_url: editingApplication.job_url || '',
        portal_url: editingApplication.portal_url || '',
        status: editingApplication.status || 'applied',
        priority: editingApplication.priority || ApplicationPriority.MEDIUM,
        date_applied: editingApplication.date_applied?.split('T')[0] || new Date().toISOString().split('T')[0],
        email_used: editingApplication.email_used || '',
        source: editingApplication.source || 'linkedin',
        notes: editingApplication.notes || '',
        resume: null,
        cover_letter: null
      })
    } else {
      setFormData(initialFormData)
    }
    setErrors({})
  }, [editingApplication, isOpen])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

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

    if (!formData.date_applied) {
      newErrors.date_applied = 'Application date is required'
    }

    if (!formData.email_used.trim()) {
      newErrors.email_used = 'Email used is required'
    } else if (!isValidEmail(formData.email_used)) {
      newErrors.email_used = 'Please enter a valid email'
    }

    if (!editingApplication && !formData.resume) {
      newErrors.resume = 'Resume file is required'
    }

    if (formData.portal_url && !isValidUrl(formData.portal_url)) {
      newErrors.portal_url = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (editingApplication?.id) {
        // For updates, use JSON data (different endpoint logic)
        const submitData = {
          company_name: formData.company_name.trim(),
          job_title: formData.job_title.trim(),
          job_id: formData.job_id.trim(),
          job_url: formData.job_url.trim(),
          portal_url: formData.portal_url.trim() || null,
          status: formData.status,
          date_applied: new Date(formData.date_applied).toISOString(),
          email_used: formData.email_used.trim(),
          source: formData.source,
          notes: formData.notes.trim() || null
        }
        await updateApplicationMutation.mutateAsync({ id: editingApplication.id, data: submitData })
      } else {
        await createApplicationMutation.mutateAsync(formData)
      }
    } catch (error) {
      // Error handling is now done in mutation onError callbacks
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileChange = (field: 'resume' | 'cover_letter', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }))
    // Clear error when user selects file
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleParseJobUrl = async () => {
    if (!formData.job_url.trim()) {
      alert('Please enter a job URL first')
      return
    }

    if (!isValidUrl(formData.job_url)) {
      alert('Please enter a valid URL')
      return
    }

    setIsParsing(true)
    try {
      // Send as form data, not JSON
      const formDataToSend = new FormData()
      formDataToSend.append('url', formData.job_url.trim())
      
      const response = await api.post('/applications/parse-url/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const jobDetails = response.data
      
      // Auto-fill form fields with parsed data
      setFormData(prev => ({
        ...prev,
        company_name: jobDetails.company || prev.company_name,
        job_title: jobDetails.position || prev.job_title,
        // Generate job_id from company and position if not provided
        job_id: jobDetails.job_id || `${(jobDetails.company || prev.company_name).toLowerCase().replace(/\s+/g, '-')}-${(jobDetails.position || prev.job_title).toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` || prev.job_id,
      }))

      // Clear any errors for fields that were populated
      setErrors(prev => {
        const newErrors = { ...prev }
        if (jobDetails.company) delete newErrors.company_name
        if (jobDetails.position) delete newErrors.job_title
        return newErrors
      })

    } catch (error: any) {
      console.error('Error parsing job URL:', error)
      let errorMessage = 'Failed to parse job URL. Please try again.'
      
      // Properly extract error message
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
        >
          <form onSubmit={handleSubmit} className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {editingApplication ? 'Edit Application' : 'Add New Application'}
                  </h2>
                  <p className="text-neutral-600 text-sm">
                    {editingApplication ? 'Update your job application details' : 'Track your job application journey'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200 focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* URL Parser */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <label className="form-label mb-0">Job Posting URL *</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.job_url}
                    onChange={(e) => handleInputChange('job_url', e.target.value)}
                    className={`form-input flex-1 ${errors.job_url ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="https://company.com/careers/job-posting"
                  />
                  <button
                    type="button"
                    onClick={handleParseJobUrl}
                    disabled={isParsing || !formData.job_url.trim()}
                    className="btn-accent px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Parse job details with AI"
                  >
                    {isParsing ? (
                      <div className="flex items-center gap-2">
                        <div className="loading-accent" />
                        <span>Parsing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Parse</span>
                      </div>
                    )}
                  </button>
                </div>
                {errors.job_url && (
                  <p className="text-red-600 text-sm mt-1">{errors.job_url}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  Paste a job URL and click "Parse" to auto-fill the form using AI
                </p>
              </div>

              {/* Main Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className={`form-input ${errors.company_name ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Google, Microsoft"
                  />
                  {errors.company_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className={`form-input ${errors.job_title ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Software Engineer"
                  />
                  {errors.job_title && (
                    <p className="text-red-600 text-sm mt-1">{errors.job_title}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Job ID *
                  </label>
                  <input
                    type="text"
                    value={formData.job_id}
                    onChange={(e) => handleInputChange('job_id', e.target.value)}
                    className={`form-input ${errors.job_id ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="REQ-2024-001 or unique identifier"
                  />
                  {errors.job_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.job_id}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Email Used *
                  </label>
                  <input
                    type="email"
                    value={formData.email_used}
                    onChange={(e) => handleInputChange('email_used', e.target.value)}
                    className={`form-input ${errors.email_used ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email_used && (
                    <p className="text-red-600 text-sm mt-1">{errors.email_used}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Application Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="form-input"
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value as ApplicationPriority)}
                    className="form-input"
                  >
                    <option value={ApplicationPriority.LOW}>Low</option>
                    <option value={ApplicationPriority.MEDIUM}>Medium</option>
                    <option value={ApplicationPriority.HIGH}>High</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Date Applied *
                  </label>
                  <input
                    type="date"
                    value={formData.date_applied}
                    onChange={(e) => handleInputChange('date_applied', e.target.value)}
                    className={`form-input ${errors.date_applied ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {errors.date_applied && (
                    <p className="text-red-600 text-sm mt-1">{errors.date_applied}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    Portal URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.portal_url}
                    onChange={(e) => handleInputChange('portal_url', e.target.value)}
                    className={`form-input ${errors.portal_url ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="https://company.workday.com"
                  />
                  {errors.portal_url && (
                    <p className="text-red-600 text-sm mt-1">{errors.portal_url}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Application Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="form-input"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="company_website">Company Website</option>
                    <option value="angelist">AngelList</option>
                    <option value="yc">Y Combinator</option>
                    <option value="glassdoor">Glassdoor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Document Upload
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Resume * {editingApplication && <span className="text-sm text-neutral-500">(optional for updates)</span>}
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('resume', e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className={`form-input cursor-pointer flex items-center justify-center gap-3 h-20 border-2 border-dashed hover:border-blue-300 hover:bg-blue-50/50 transition-colors ${
                          errors.resume ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                        }`}
                      >
                        <FileText className="h-6 w-6 text-neutral-400" />
                        <div className="text-center">
                          <p className="text-sm text-neutral-600">
                            {formData.resume ? formData.resume.name : 'Choose resume file'}
                          </p>
                          <p className="text-xs text-neutral-500">PDF, DOC, DOCX</p>
                        </div>
                      </label>
                      {errors.resume && (
                        <p className="text-red-600 text-sm mt-1">{errors.resume}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">
                      Cover Letter (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('cover_letter', e.target.files?.[0] || null)}
                        className="hidden"
                        id="cover-letter-upload"
                      />
                      <label
                        htmlFor="cover-letter-upload"
                        className="form-input cursor-pointer flex items-center justify-center gap-3 h-20 border-2 border-dashed border-neutral-300 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                      >
                        <FileText className="h-6 w-6 text-neutral-400" />
                        <div className="text-center">
                          <p className="text-sm text-neutral-600">
                            {formData.cover_letter ? formData.cover_letter.name : 'Choose cover letter'}
                          </p>
                          <p className="text-xs text-neutral-500">PDF, DOC, DOCX</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Additional notes about this application..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary focus-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary focus-ring relative min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-accent mr-2" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>
                    {editingApplication ? 'Update Application' : 'Add Application'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 