import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, User, Linkedin, Edit, Trash2, Users } from 'lucide-react'
import { api } from '@/services/api'
import ContactForm from '@/components/ContactForm'
import { motion } from 'framer-motion'

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [contactTypeFilter, setContactTypeFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
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

  const companyOptions = useMemo(() => {
    if (!contacts) return []
    const companies = contacts.map((c: any) => c.company) as string[]
    return [...new Set(companies)].sort()
  }, [contacts])

  // Filter contacts client-side to prevent API calls on every filter change
  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    
    return contacts.filter((contact: any) => {
      const matchesSearch = !searchTerm || 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !contactTypeFilter || contact.contact_type === contactTypeFilter
      const matchesCompany = !companyFilter || contact.company === companyFilter
      
      return matchesSearch && matchesType && matchesCompany
    })
  }, [contacts, searchTerm, contactTypeFilter, companyFilter])

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
    ]
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[charCodeSum % colors.length]
  }

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-blue-100 text-blue-800'
      case 'recruiter':
        return 'bg-green-100 text-green-800'
      case 'hiring_manager':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setContactTypeFilter('')
    setCompanyFilter('')
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-accent"></div>
        <span className="ml-3 text-neutral-600">Loading contacts...</span>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Professional Network</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900">Contacts</h1>
          <p className="text-lg text-neutral-600">Manage your professional contacts and network connections</p>
        </div>
        <motion.button 
          className="btn-primary"
          onClick={handleAddContact}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-neutral-100">
            <Filter className="h-5 w-5 text-neutral-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">Search & Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={contactTypeFilter}
            onChange={(e) => setContactTypeFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="referral">Referral</option>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="other">Other</option>
          </select>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Companies</option>
            {companyOptions.map((company: string) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
          <button 
            className="btn-secondary"
            onClick={handleClearFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-sm font-medium text-neutral-700">
            {filteredContacts.length} contacts found
          </span>
          <Users className="h-4 w-4 text-neutral-500" />
        </div>
      </motion.div>

      {/* Contacts List */}
      <motion.div variants={itemVariants} className="card overflow-hidden">
        {filteredContacts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left font-semibold w-2/5">Contact</th>
                  <th className="table-cell text-left font-semibold">Company</th>
                  <th className="table-cell text-left font-semibold">Type</th>
                  <th className="table-cell text-left font-semibold">LinkedIn</th>
                  <th className="table-cell text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts?.map((contact: any) => (
                  <motion.tr 
                    key={contact.id} 
                    className="table-row group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ backgroundColor: 'rgb(250 250 250)' }}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm ${getAvatarColor(contact.name)}`}>
                          {contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-neutral-900 truncate">
                            {contact.name}
                          </div>
                          <div className="text-sm text-neutral-600 truncate">
                            {contact.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-neutral-900 font-medium">
                        {contact.company}
                      </div>
                      {contact.role && (
                        <div className="text-xs text-neutral-600">
                          {contact.role}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getContactTypeColor(contact.contact_type)}`}>
                        {contact.contact_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      {contact.linkedin_url ? (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="View LinkedIn Profile"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button 
                          onClick={() => handleEditContact(contact)}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Contact"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Contact"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="p-4 rounded-full bg-neutral-100 mb-6">
              <User className="h-12 w-12 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {contacts?.length === 0 ? 'No contacts yet' : 'No contacts match filters'}
            </h3>
            <p className="text-neutral-600 max-w-md mb-6">
              {contacts?.length === 0 
                ? 'Add your professional contacts to keep track of your network and build meaningful connections.'
                : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
              }
            </p>
            {contacts?.length === 0 && (
              <button 
                className="btn-primary"
                onClick={handleAddContact}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Contact Form Modal */}
      <ContactForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        contact={editingContact}
      />
    </motion.div>
  )
} 