import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Building,
  ExternalLink,
  BarChart3,
  FileText,
  Mail,
  User,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import ApplicationForm from '../components/ApplicationForm';
import { api } from '../services/api';
import { ApplicationPriority } from '../types';

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  job_id: string;
  job_url: string;
  portal_url?: string;
  status: string;
  priority: ApplicationPriority;
  date_applied: string;
  email_used: string;
  resume_filename?: string;
  cover_letter_filename?: string;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function Applications() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications/').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch =
        app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || app.status === statusFilter;
      const matchesPriority = !priorityFilter || app.priority === priorityFilter;
      const matchesSource = !sourceFilter || app.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [applications, searchTerm, statusFilter, priorityFilter, sourceFilter]);

  const handleAddApplication = () => {
    setEditingApplication(null);
    setIsFormOpen(true);
  };

  const handleEditApplication = (application: Application) => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const handleDeleteApplication = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApplicationMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'applied':
      return 'status-applied';
    case 'interview':
      return 'status-interview';
    case 'offer':
      return 'status-offer';
    case 'rejected':
      return 'status-rejected';
    case 'withdrawn':
      return 'status-pending';
    default:
      return 'status-applied';
    }
  };

  const getPriorityColor = (priority: ApplicationPriority) => {
    switch (priority) {
    case ApplicationPriority.HIGH:
      return 'text-red-700 bg-red-50 border-red-200';
    case ApplicationPriority.MEDIUM:
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case ApplicationPriority.LOW:
      return 'text-gray-700 bg-gray-50 border-gray-200';
    default:
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const getPriorityIcon = (priority: ApplicationPriority) => {
    switch (priority) {
    case ApplicationPriority.HIGH:
      return <ChevronUp className='h-3 w-3' />;
    case ApplicationPriority.MEDIUM:
      return <Minus className='h-3 w-3' />;
    case ApplicationPriority.LOW:
      return <ChevronDown className='h-3 w-3' />;
    default:
      return <Minus className='h-3 w-3' />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className='space-y-8'>
        <div className='space-y-4'>
          <div className='h-12 bg-neutral-200 rounded-lg animate-pulse' />
          <div className='h-6 bg-neutral-100 rounded-lg animate-pulse w-2/3' />
        </div>
        <div className='card p-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-12 bg-neutral-100 rounded-lg animate-pulse' />
            ))}
          </div>
          <div className='space-y-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-20 bg-neutral-50 rounded-lg animate-pulse' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className='space-y-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants} className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6'>
          <div className='space-y-3'>
            <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200'>
              <BarChart3 className='h-4 w-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-700'>Job Applications</span>
            </div>
            <h1 className='text-3xl lg:text-4xl font-bold text-neutral-900'>Applications</h1>
            <p className='text-lg text-neutral-600'>
              Track and manage your job applications with precision
            </p>
          </div>
          <motion.button
            className='btn-primary'
            onClick={handleAddApplication}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className='h-5 w-5 mr-2' />
            Add Application
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className='card p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-neutral-100'>
            <Filter className='h-5 w-5 text-neutral-600' />
          </div>
          <h3 className='text-lg font-semibold text-neutral-900'>Filters & Search</h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
            <input
              type='text'
              placeholder='Search companies, positions...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='form-input pl-10'
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='form-input'
          >
            <option value=''>All Statuses</option>
            <option value='applied'>Applied</option>
            <option value='interview'>Interview</option>
            <option value='offer'>Offer</option>
            <option value='rejected'>Rejected</option>
            <option value='withdrawn'>Withdrawn</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className='form-input'
          >
            <option value=''>All Priorities</option>
            <option value={ApplicationPriority.HIGH}>High</option>
            <option value={ApplicationPriority.MEDIUM}>Medium</option>
            <option value={ApplicationPriority.LOW}>Low</option>
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className='form-input'
          >
            <option value=''>All Sources</option>
            <option value='linkedin'>LinkedIn</option>
            <option value='indeed'>Indeed</option>
            <option value='company_website'>Company Website</option>
            <option value='referral'>Referral</option>
            <option value='other'>Other</option>
          </select>
          <div className='flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200'>
            <span className='text-sm font-medium text-neutral-700'>
              {filteredApplications.length} results
            </span>
            <BarChart3 className='h-4 w-4 text-neutral-500' />
          </div>
        </div>
      </motion.div>

      {/* Applications Table */}
      <motion.div variants={itemVariants}>
        {filteredApplications.length === 0 ? (
          <div className='card p-12 text-center'>
            <Building className='h-16 w-16 text-neutral-400 mx-auto mb-6' />
            <h3 className='text-xl font-semibold text-neutral-900 mb-2'>No applications found</h3>
            <p className='text-neutral-600 mb-6 max-w-md mx-auto'>
              {searchTerm || statusFilter || priorityFilter || sourceFilter
                ? 'Try adjusting your filters to see more results'
                : 'Start tracking your job applications to see them here'}
            </p>
            <button className='btn-primary mx-auto' onClick={handleAddApplication}>
              <Plus className='h-4 w-4 mr-2' />
              Add Your First Application
            </button>
          </div>
        ) : (
          <div className='card overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-neutral-200 bg-neutral-50'>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Company</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Role</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Resume</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Applied With</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Status</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Priority</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Notes</th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>
                      Referral Contact
                    </th>
                    <th className='text-left p-4 font-semibold text-neutral-900'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredApplications.map((application, index) => (
                      <motion.tr
                        key={application.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className='border-b border-neutral-100 hover:bg-neutral-50 transition-colors'
                      >
                        {/* Company */}
                        <td className='p-4'>
                          <div className='flex items-center gap-3'>
                            <div className='p-2 rounded-lg bg-blue-50'>
                              <Building className='h-4 w-4 text-blue-600' />
                            </div>
                            <div>
                              <div className='font-medium text-neutral-900'>
                                {application.company_name}
                              </div>
                              <div className='text-sm text-neutral-500'>
                                Applied {new Date(application.date_applied).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className='p-4'>
                          <div>
                            <div className='font-medium text-neutral-900 mb-1'>
                              {application.job_title}
                            </div>
                            {application.job_url && (
                              <a
                                href={application.job_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors'
                              >
                                <ExternalLink className='h-3 w-3' />
                                View Posting
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Resume */}
                        <td className='p-4'>
                          {application.resume_filename ? (
                            <a
                              href={`/api/applications/${application.id}/resume`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group'
                            >
                              <FileText className='h-4 w-4 group-hover:scale-110 transition-transform' />
                              <span
                                className='text-sm truncate max-w-32'
                                title={application.resume_filename}
                              >
                                {application.resume_filename}
                              </span>
                              <ExternalLink className='h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity' />
                            </a>
                          ) : (
                            <span className='text-sm text-neutral-400'>-</span>
                          )}
                        </td>

                        {/* Applied With */}
                        <td className='p-4'>
                          <div className='flex items-center gap-2'>
                            <Mail className='h-4 w-4 text-neutral-500' />
                            <span className='text-sm text-neutral-700'>
                              {application.email_used}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className='p-4'>
                          <span className={`${getStatusColor(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className='p-4'>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(application.priority)}`}
                          >
                            {getPriorityIcon(application.priority)}
                            <span>
                              {application.priority.charAt(0).toUpperCase() +
                                application.priority.slice(1)}
                            </span>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className='p-4'>
                          {application.notes ? (
                            <div
                              className='text-sm text-neutral-700 max-w-48 truncate'
                              title={application.notes}
                            >
                              {application.notes}
                            </div>
                          ) : (
                            <span className='text-sm text-neutral-400'>-</span>
                          )}
                        </td>

                        {/* Referral Contact */}
                        <td className='p-4'>
                          <div className='flex items-center gap-2 text-sm text-neutral-400'>
                            <User className='h-4 w-4' />
                            <span>-</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className='p-4'>
                          <div className='flex items-center gap-1'>
                            <motion.button
                              onClick={() => handleEditApplication(application)}
                              className='p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200'
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title='Edit application'
                            >
                              <Edit className='h-4 w-4' />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteApplication(application.id)}
                              className='p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200'
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title='Delete application'
                            >
                              <Trash2 className='h-4 w-4' />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Application Form Modal */}
      <ApplicationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApplication(null);
        }}
        editingApplication={editingApplication}
      />
    </motion.div>
  );
}
