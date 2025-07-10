import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, ExternalLink, Calendar, Building, Download, Edit, Trash2 } from 'lucide-react'
import { api } from '@/services/api'
import ApplicationForm from '@/components/ApplicationForm'

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
  const queryClient = useQueryClient()

  // Create a stable query key that doesn't change on every filter update
  const queryKey = useMemo(() => ['applications'], [])

  const { data: applications, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get('/applications/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const deleteApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => api.delete(`/applications/${applicationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (error: any) => {
      console.error('Error deleting application:', error)
      alert('Failed to delete application. Please try again.')
    }
  })

  // Filter applications client-side to prevent API calls on every filter change
  const filteredApplications = useMemo(() => {
    if (!applications) return []
    
    return applications.filter((application: any) => {
      const matchesSearch = !searchTerm || 
        application.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.job_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !statusFilter || application.status === statusFilter
      const matchesSource = !sourceFilter || application.source === sourceFilter
      
      return matchesSearch && matchesStatus && matchesSource
    })
  }, [applications, searchTerm, statusFilter, sourceFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      applied: { color: 'badge-primary', text: 'Applied' },
      interview: { color: 'badge-warning', text: 'Interview' },
      offer: { color: 'badge-success', text: 'Offer' },
      rejected: { color: 'badge-error', text: 'Rejected' },
      withdrawn: { color: 'badge-neutral', text: 'Withdrawn' },
      pending: { color: 'badge-neutral', text: 'Pending' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.applied
    return <span className={`badge ${config.color}`}>{config.text}</span>
  }

  const handleDownloadResume = async (applicationId: string, filename: string) => {
    try {
      const response = await api.get(`/applications/${applicationId}/resume`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Failed to download resume file.')
    }
  }

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('')
    setSourceFilter('')
  }, [])

  const handleAddApplication = useCallback(() => {
    setEditingApplication(null)
    setIsFormOpen(true)
  }, [])

  const handleEditApplication = useCallback((application: any) => {
    setEditingApplication(application)
    setIsFormOpen(true)
  }, [])

  const handleDeleteApplication = useCallback((applicationId: string) => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      deleteApplicationMutation.mutate(applicationId)
    }
  }, [deleteApplicationMutation])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingApplication(null)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
        <span className="ml-3 text-neutral-600">Loading applications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Applications</h1>
          <p className="text-neutral-600 mt-1">Track and manage your job applications</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAddApplication}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search companies, titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Sources</option>
            <option value="angelist">AngelList</option>
            <option value="yc">YC</option>
            <option value="company_website">Company Website</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="glassdoor">Glassdoor</option>
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

      {/* Applications List */}
      <div className="card overflow-hidden">
        {filteredApplications?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Date Applied</th>
                  <th>Source</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application: any) => (
                  <tr key={application.id} className="group">
                    <td>
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 mr-3">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {application.company_name}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {application.job_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-neutral-900">
                        {application.job_title}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(application.status)}
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-neutral-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(application.date_applied).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-600 capitalize">
                        {application.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {application.resume_filename && (
                        <button
                          onClick={() => handleDownloadResume(application.id, application.resume_filename)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          title="Download Resume"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {application.resume_filename.length > 20 
                            ? application.resume_filename.substring(0, 20) + '...'
                            : application.resume_filename
                          }
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {application.job_url && (
                          <a
                            href={application.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                            title="View Job"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button 
                          onClick={() => handleEditApplication(application)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit Application"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteApplication(application.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 rounded-full bg-neutral-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {applications?.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {applications?.length === 0 
                ? 'Start tracking your job applications to see them here.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {applications?.length === 0 && (
              <button 
                className="btn btn-primary"
                onClick={handleAddApplication}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Application
              </button>
            )}
          </div>
        )}
      </div>

      {/* Application Form Modal */}
      <ApplicationForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        editingApplication={editingApplication}
      />
    </div>
  )
} 