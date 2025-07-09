import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, User, Linkedin } from 'lucide-react'
import { api } from '@/services/api'
import ContactForm from '@/components/ContactForm'

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [contactTypeFilter, setContactTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const queryClient = useQueryClient()

  // Create a stable query key that doesn't change on every filter update
  const queryKey = useMemo(() => ['contacts'], [])

  const { data: contacts, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get('/contacts/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => api.delete(`/contacts/${contactId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: (error: any) => {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact. Please try again.')
    }
  })

  // Filter contacts client-side to prevent API calls on every filter change
  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    
    return contacts.filter((contact: any) => {
      const matchesSearch = !searchTerm || 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !contactTypeFilter || contact.contact_type === contactTypeFilter
      
      return matchesSearch && matchesType
    })
  }, [contacts, searchTerm, contactTypeFilter])

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-blue-100 text-blue-800'
      case 'recruiter':
        return 'bg-green-100 text-green-800'
      case 'hiring_manager':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setContactTypeFilter('')
  }, [])

  const handleAddContact = useCallback(() => {
    setEditingContact(null)
    setIsFormOpen(true)
  }, [])

  const handleEditContact = useCallback((contact: any) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }, [])

  const handleDeleteContact = useCallback((contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(contactId)
    }
  }, [deleteContactMutation])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
        <span className="ml-3 text-neutral-600">Loading contacts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Contacts</h1>
          <p className="text-neutral-600">Manage your professional contacts</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAddContact}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={contactTypeFilter}
            onChange={(e) => setContactTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Types</option>
            <option value="referral">Referral</option>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="other">Other</option>
          </select>
          <button 
            className="btn btn-secondary"
            onClick={handleClearFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="card overflow-hidden">
        {filteredContacts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>LinkedIn</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts?.map((contact: any) => (
                  <tr key={contact.id} className="group">
                    <td>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {contact.name}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {contact.email}
                          </div>
                          {contact.role && (
                            <div className="text-sm text-neutral-400">
                              {contact.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-neutral-900">
                        {contact.company}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContactTypeColor(contact.contact_type)}`}>
                        {contact.contact_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {contact.linkedin_url ? (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View LinkedIn Profile"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditContact(contact)}
                          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-neutral-100 w-16 h-16 mb-4 flex items-center justify-center">
              <User className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {contacts?.length === 0 ? 'No contacts found' : 'No contacts match your filters'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {contacts?.length === 0 
                ? 'Start adding your professional contacts to see them here.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {contacts?.length === 0 && (
              <button 
                className="btn btn-primary"
                onClick={handleAddContact}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      <ContactForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        contact={editingContact}
      />
    </div>
  )
} 