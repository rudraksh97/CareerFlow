import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Mail, Phone, Link } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className={`input-field ${errors.company ? 'border-red-500' : ''}`}
                    placeholder="Company name"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="input-field"
                    placeholder="e.g., Senior Engineer, Recruiter"
                  />
                </div>
              </div>

              {/* LinkedIn URL */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <Link className="absolute left-3 top-9 h-4 w-4 text-blue-500 pointer-events-none" />
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  className={`input-field pl-10 ${errors.linkedin_url ? 'border-red-500' : ''}`}
                  placeholder="https://linkedin.com/in/username"
                  style={{ marginTop: 0 }}
                />
                {errors.linkedin_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.linkedin_url}</p>
                )}
              </div>

              {/* Contact Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Type *
                </label>
                <select
                  value={formData.contact_type}
                  onChange={(e) => handleInputChange('contact_type', e.target.value)}
                  className="input-field"
                >
                  <option value="referral">Referral</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Additional notes about this contact..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-8">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 