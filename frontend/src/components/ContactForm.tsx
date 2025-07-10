import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Link, Users, Building2, User } from 'lucide-react'
import { api } from '@/services/api'

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
  contact?: any | null
}

interface FormData {
  name: string
  email: string
  company: string
  role: string
  linkedin_url: string
  contact_type: string
  notes: string
}

const initialFormData: FormData = {
  name: '',
  email: '',
  company: '',
  role: '',
  linkedin_url: '',
  contact_type: 'referral',
  notes: ''
}

export default function ContactForm({ isOpen, onClose, contact }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const isEditing = contact != null

  useEffect(() => {
    if (isEditing && contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        company: contact.company || '',
        role: contact.role || '',
        linkedin_url: contact.linkedin_url || '',
        contact_type: contact.contact_type || 'referral',
        notes: contact.notes || ''
      })
    } else {
      setFormData(initialFormData)
    }
  }, [contact, isEditing, isOpen])

  const createContactMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/contacts/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error creating contact:', error)
      alert('Failed to create contact. Please try again.')
    }
  })

  const updateContactMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/contacts/${contact.id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      handleClose()
    },
    onError: (error: any) => {
      console.error('Error updating contact:', error)
      alert('Failed to update contact. Please try again.')
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required'
    }

    if (formData.linkedin_url && !isValidUrl(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateContactMutation.mutateAsync(formData)
      } else {
        await createContactMutation.mutateAsync(formData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    setIsSubmitting(false)
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
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {isEditing ? 'Edit Contact' : 'Add New Contact'}
                  </h2>
                  <p className="text-neutral-600 text-sm">
                    {isEditing ? 'Update contact information' : 'Add a new professional contact'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200 focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`form-input ${errors.name ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="Full name"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-2">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`form-input pl-10 ${errors.email ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-2">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Professional Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className={`form-input ${errors.company ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="Company name"
                    />
                    {errors.company && (
                      <p className="text-red-600 text-sm mt-2">{errors.company}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="form-input"
                      placeholder="e.g., Senior Engineer, Recruiter"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Contact Type *
                  </label>
                  <select
                    value={formData.contact_type}
                    onChange={(e) => handleInputChange('contact_type', e.target.value)}
                    className="form-input"
                  >
                    <option value="referral">Referral</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Link className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Additional Information</h3>
                </div>
                
                <div>
                  <label className="form-label">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className={`form-input pl-10 ${errors.linkedin_url ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  {errors.linkedin_url && (
                    <p className="text-red-600 text-sm mt-2">{errors.linkedin_url}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="form-input resize-none"
                    placeholder="Additional notes about this contact..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary focus-ring"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary focus-ring relative min-w-[120px] disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-accent mr-2" />
                      <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                    </div>
                  ) : (
                    <span>
                      {isEditing ? 'Update Contact' : 'Add Contact'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 