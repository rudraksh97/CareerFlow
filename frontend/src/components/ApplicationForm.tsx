import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, ExternalLink, Building, User, Mail, FileText, Upload, Globe, Wand2 } from 'lucide-react'
import { api } from '@/services/api'

interface ApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  editingApplication?: any
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
  notes: ''
}

export default function ApplicationForm({ isOpen, onClose, editingApplication }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<FormData & { resume: string, cover_letter: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null)
  const [coverLetterFileName, setCoverLetterFileName] = useState<string>('')
  const queryClient = useQueryClient()
  const [isFetchingCompanyInfo, setIsFetchingCompanyInfo] = useState(false);
  const [urlToParse, setUrlToParse] = useState<string>('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string>('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

  // Set form data when editing application
  useEffect(() => {
    if (editingApplication) {
      setFormData({
        company_name: editingApplication.company_name || '',
        job_title: editingApplication.job_title || '',
        job_id: editingApplication.job_id || '',
        job_url: editingApplication.job_url || '',
        portal_url: editingApplication.portal_url || '',
        status: editingApplication.status || 'applied',
        date_applied: editingApplication.date_applied ? editingApplication.date_applied.split('T')[0] : new Date().toISOString().split('T')[0],
        email_used: editingApplication.email_used || '',
        source: editingApplication.source || 'company_website',
        notes: editingApplication.notes || ''
      })
      setResumeFileName(editingApplication.resume_filename || '')
      setCoverLetterFileName(editingApplication.cover_letter_filename || '')
    } else {
      setFormData(initialFormData)
      setResumeFileName('')
      setCoverLetterFileName('')
    }
  }, [editingApplication])

  const createApplicationMutation = useMutation({
    mutationFn: async (data: { formData: FormData; resumeFile: File; coverLetterFile: File | null }) => {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(data.formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value)
        }
      })
      
      // Add files
      formDataToSend.append('resume', data.resumeFile)
      if (data.coverLetterFile) {
        formDataToSend.append('cover_letter', data.coverLetterFile)
      }
      
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

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: { formData: FormData; resumeFile?: File; coverLetterFile?: File | null; applicationId: string }) => {
      // For updates, we use a different approach since backend expects form data for creation
      // but JSON for updates. We'll need to check if files are updated and handle accordingly.
      
      const updateData = {
        company_name: data.formData.company_name,
        job_title: data.formData.job_title,
        job_id: data.formData.job_id,
        job_url: data.formData.job_url,
        portal_url: data.formData.portal_url || null,
        status: data.formData.status,
        date_applied: data.formData.date_applied,
        email_used: data.formData.email_used,
        source: data.formData.source,
        notes: data.formData.notes || null
      }

      return api.put(`/applications/${data.applicationId}`, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error updating application:', error)
      alert('Failed to update application. Please try again.')
    }
  })

  // Debounce hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedCompanyName = useDebounce(formData.company_name, 500);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (debouncedCompanyName.trim().length > 2) {
        setIsFetchingCompanyInfo(true);
        try {
          const { data } = await api.get(`/applications/company-info/?company_name=${encodeURIComponent(debouncedCompanyName)}`);
          if (data) {
            setFormData(prev => ({
              ...prev,
              portal_url: data.portal_url || prev.portal_url,
              source: data.source || prev.source,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch company info", error);
        } finally {
          setIsFetchingCompanyInfo(false);
        }
      }
    };
    fetchCompanyInfo();
  }, [debouncedCompanyName]);

  const parseJobUrl = async () => {
    if (!urlToParse.trim()) {
      setParseError('Please enter a URL to parse')
      return
    }

    if (!isValidUrl(urlToParse)) {
      setParseError('Please enter a valid URL')
      return
    }

    setIsParsing(true)
    setParseError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('url', urlToParse)

      const response = await api.post('/applications/parse-url/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const jobData = response.data

      // Auto-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        company_name: jobData.company_name || prev.company_name,
        job_title: jobData.job_title || prev.job_title,
        job_id: jobData.job_id || prev.job_id,
        job_url: jobData.job_url || urlToParse,
      }))

      // Clear URL input after successful parse
      setUrlToParse('')
      
    } catch (error: any) {
      console.error('Error parsing URL:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.detail || 'Unable to parse the job URL'
        
        // Check if it's an API key issue and show the modal
        if (errorMessage.includes('API key')) {
          setShowApiKeyModal(true)
          setParseError('')
        } else {
          // Enhanced error message for parsing failures
          if (errorMessage.includes('JavaScript') || errorMessage.includes('dynamic')) {
            setParseError('This job page uses dynamic content that cannot be automatically parsed. You can manually enter the job details below.')
          } else {
            setParseError(errorMessage)
          }
        }
      } else {
        setParseError('An error occurred while parsing the URL. Please try again.')
      }
    } finally {
      setIsParsing(false)
    }
  }

  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('Please enter an API key')
      return
    }

    setIsSavingApiKey(true)
    setApiKeyError('')

    try {
      const response = await api.post('/settings/', {
        key: 'openai_api_key',
        value: apiKeyInput.trim()
      })

      if (response.status === 200) {
        setShowApiKeyModal(false)
        setApiKeyInput('')
        setApiKeyError('')
        
        // Try parsing the URL again after saving the API key
        if (urlToParse.trim()) {
          parseJobUrl()
        }
      }
    } catch (error: any) {
      console.error('Error saving API key:', error)
      setApiKeyError('Failed to save API key. Please try again.')
    } finally {
      setIsSavingApiKey(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData & { resume: string, cover_letter: string }> = {}

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

    if (!resumeFile && !editingApplication) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'cover_letter') => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        setErrors(prev => ({ ...prev, [fileType]: 'Please select a PDF, DOC, or DOCX file' }))
        return
      }
      
      if (fileType === 'resume') {
        setResumeFile(file)
        setResumeFileName(file.name)
      } else {
        setCoverLetterFile(file)
        setCoverLetterFileName(file.name)
      }
      setErrors(prev => ({ ...prev, [fileType]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    // For new applications, resume is required
    if (!editingApplication && !resumeFile) return

    setIsSubmitting(true)
    try {
      if (editingApplication) {
        // Update existing application
        await updateApplicationMutation.mutateAsync({ 
          formData, 
          resumeFile: resumeFile || undefined,
          coverLetterFile: coverLetterFile || undefined,
          applicationId: editingApplication.id
        })
      } else {
        // Create new application
        if (!resumeFile) return
        await createApplicationMutation.mutateAsync({ 
          formData, 
          resumeFile, 
          coverLetterFile 
        })
      }
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
    setCoverLetterFile(null)
    setCoverLetterFileName('')
    setUrlToParse('')
    setParseError('')
    setIsParsing(false)
    setShowApiKeyModal(false)
    setApiKeyInput('')
    setApiKeyError('')
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
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingApplication ? 'Edit Application' : 'Add New Application'}
              </h2>
              <p className="text-neutral-600 mt-1">
                {editingApplication ? 'Update your job application details' : 'Track your job application details'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* URL Parsing Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Auto-fill from Job URL</h3>
                <p className="text-sm text-neutral-600">Paste a job posting URL to automatically extract details</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={urlToParse}
                    onChange={(e) => {
                      setUrlToParse(e.target.value)
                      if (parseError) setParseError('')
                    }}
                    className="input-field"
                    placeholder="https://company.com/careers/software-engineer"
                    disabled={isParsing}
                  />
                </div>
                <button
                  type="button"
                  onClick={parseJobUrl}
                  disabled={isParsing || !urlToParse.trim()}
                  className="btn btn-primary px-4 py-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Parse URL
                    </>
                  )}
                </button>
              </div>
              
              {parseError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {parseError}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" id="application-form">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className={`input-field ${errors.company_name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Google, Microsoft"
                  />
                  {isFetchingCompanyInfo && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400"></div>
                    </div>
                  )}
                </div>
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

            {/* Job Details */}
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

            {/* Application Details */}
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

            {/* Contact Information */}
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
            </div>

            {/* Resume & Cover Letter Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Resume File {editingApplication ? '' : '*'}
                </label>
                {editingApplication && editingApplication.resume_filename && (
                  <p className="text-xs text-neutral-600 mb-2">
                    Current file: {editingApplication.resume_filename}
                  </p>
                )}
                <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'resume')}
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
                          {resumeFileName ? resumeFileName : (editingApplication ? 'Click to upload new resume' : 'Click to upload resume')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          (PDF, DOC, DOCX)
                        </p>
                      </div>
                    </label>
                  </div>
                  {errors.resume && (
                    <p className="mt-2 text-sm text-red-600">{errors.resume}</p>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cover Letter File
                </label>
                {editingApplication && editingApplication.cover_letter_filename && (
                  <p className="text-xs text-neutral-600 mb-2">
                    Current file: {editingApplication.cover_letter_filename}
                  </p>
                )}
                <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'cover_letter')}
                      className="hidden"
                      id="cover-letter-upload"
                    />
                    <label
                      htmlFor="cover-letter-upload"
                      className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        errors.cover_letter ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-600">
                          {coverLetterFileName ? coverLetterFileName : (editingApplication ? 'Click to upload new cover letter' : 'Click to upload cover letter')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          (Optional)
                        </p>
                      </div>
                    </label>
                  </div>
                  {errors.cover_letter && (
                    <p className="mt-2 text-sm text-red-600">{errors.cover_letter}</p>
                  )}
              </div>
            </div>

            {/* Notes */}
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
              {isSubmitting 
                ? (editingApplication ? 'Updating...' : 'Creating...') 
                : (editingApplication ? 'Update Application' : 'Create Application')
              }
            </button>
          </div>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowApiKeyModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Configure OpenAI API Key</h3>
                <p className="text-sm text-neutral-600">Enter your OpenAI API key to enable URL parsing</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  OpenAI API Key *
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value)
                    if (apiKeyError) setApiKeyError('')
                  }}
                  className={`input-field ${apiKeyError ? 'border-red-500' : ''}`}
                  placeholder="sk-..."
                  disabled={isSavingApiKey}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Your API key is stored securely and used only for parsing job URLs.
                </p>
                {apiKeyError && (
                  <p className="mt-2 text-sm text-red-600">{apiKeyError}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="btn btn-secondary"
                  disabled={isSavingApiKey}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveApiKey}
                  className="btn btn-primary"
                  disabled={isSavingApiKey || !apiKeyInput.trim()}
                >
                  {isSavingApiKey ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save & Parse URL'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 