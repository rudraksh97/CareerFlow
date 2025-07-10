import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Zap, FileText, CheckCircle, Circle, Building, ClipboardList, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { api } from '../services/api';
import { ApplicationPriority } from '../types';

interface Application {
  id?: string;
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
}

interface ApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingApplication?: Application | null;
}

interface FormData {
  company_name: string;
  job_title: string;
  job_id: string;
  job_url: string;
  portal_url: string;
  status: string;
  priority: ApplicationPriority;
  date_applied: string;
  email_used: string;
  source: string;
  notes: string;
  resume: File | null;
  cover_letter: File | null;
}

interface FormErrors {
  company_name?: string;
  job_title?: string;
  job_id?: string;
  job_url?: string;
  portal_url?: string;
  status?: string;
  priority?: string;
  date_applied?: string;
  email_used?: string;
  source?: string;
  notes?: string;
  resume?: string;
  cover_letter?: string;
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
  cover_letter: null,
};

type TabType = 'basic' | 'details' | 'documents' | 'notes';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: (keyof FormData)[];
}

const tabs: Tab[] = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: Building,
    fields: ['company_name', 'job_title', 'job_id', 'job_url', 'email_used'],
  },
  {
    id: 'details',
    label: 'Details',
    icon: ClipboardList,
    fields: ['status', 'priority', 'date_applied', 'portal_url', 'source'],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    fields: ['resume', 'cover_letter'],
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: User,
    fields: ['notes'],
  },
];

export default function ApplicationForm({
  isOpen,
  onClose,
  editingApplication,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const queryClient = useQueryClient();

  const createApplicationMutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData = new FormData();
      formData.append('company_name', data.company_name);
      formData.append('job_title', data.job_title);
      formData.append('job_id', data.job_id);
      formData.append('job_url', data.job_url);
      if (data.portal_url) formData.append('portal_url', data.portal_url);
      formData.append('status', data.status);
      formData.append('priority', data.priority);
      formData.append('date_applied', data.date_applied);
      formData.append('email_used', data.email_used);
      formData.append('source', data.source);
      if (data.notes) formData.append('notes', data.notes);
      if (data.resume) formData.append('resume', data.resume);
      if (data.cover_letter) formData.append('cover_letter', data.cover_letter);

      return api.post('/applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating application:', error);
      let errorMessage = 'Failed to create application. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : 'Failed to create application. Please check your form data.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating application:', error);
      let errorMessage = 'Failed to update application. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : 'Failed to update application. Please check your form data.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    },
  });

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
        date_applied:
          editingApplication.date_applied?.split('T')[0] || new Date().toISOString().split('T')[0],
        email_used: editingApplication.email_used || '',
        source: editingApplication.source || 'linkedin',
        notes: editingApplication.notes || '',
        resume: null,
        cover_letter: null,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setActiveTab('basic');
  }, [editingApplication, isOpen]);

  // Helper function to get tab completion status
  const getTabCompletionStatus = (tab: Tab): 'complete' | 'incomplete' => {
    return tab.fields.every(field => {
      if (field === 'notes') return true; // Notes are optional
      if (field === 'cover_letter') return true; // Cover letter is optional
      if (field === 'portal_url') return true; // Portal URL is optional
      if (field === 'resume' && editingApplication) return true; // Resume optional for edits

      const value = formData[field as keyof FormData];
      return value !== '' && value !== null && value !== undefined;
    }) ? 'complete' : 'incomplete';
  };

  // Helper function to get tab button classes
  const getTabButtonClasses = (isActive: boolean, hasErrors: boolean): string => {
    if (isActive) {
      return 'bg-blue-600 text-white';
    }
    if (hasErrors) {
      return 'text-red-600 bg-red-50 border border-red-200';
    }
    return 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50';
  };

  // Helper function to get tab indicator classes
  const getTabIndicatorClasses = (
    isActive: boolean,
    isPast: boolean,
    completionStatus: string,
  ): string => {
    if (isActive) {
      return 'bg-blue-600 w-6';
    }
    if (isPast || completionStatus === 'complete') {
      return 'bg-green-500';
    }
    return 'bg-neutral-300';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required';
    }

    if (!formData.job_id.trim()) {
      newErrors.job_id = 'Job ID is required';
    }

    if (!formData.job_url.trim()) {
      newErrors.job_url = 'Job URL is required';
    } else if (!isValidUrl(formData.job_url)) {
      newErrors.job_url = 'Please enter a valid URL';
    }

    if (formData.portal_url && !isValidUrl(formData.portal_url)) {
      newErrors.portal_url = 'Please enter a valid URL';
    }

    if (!formData.email_used.trim()) {
      newErrors.email_used = 'Email is required';
    } else if (!isValidEmail(formData.email_used)) {
      newErrors.email_used = 'Please enter a valid email address';
    }

    if (!formData.date_applied) {
      newErrors.date_applied = 'Application date is required';
    }

    if (!editingApplication && !formData.resume) {
      newErrors.resume = 'Resume is required for new applications';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Find the first tab with errors and switch to it
      const tabsWithErrors = tabs.filter(tab =>
        tab.fields.some(field => errors[field]),
      );
      if (tabsWithErrors.length > 0) {
        setActiveTab(tabsWithErrors[0].id);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingApplication) {
        await updateApplicationMutation.mutateAsync({
          id: editingApplication.id!,
          data: {
            company_name: formData.company_name,
            job_title: formData.job_title,
            job_id: formData.job_id,
            job_url: formData.job_url,
            portal_url: formData.portal_url || null,
            status: formData.status,
            priority: formData.priority,
            date_applied: formData.date_applied,
            email_used: formData.email_used,
            source: formData.source,
            notes: formData.notes || null,
          },
        });
      } else {
        await createApplicationMutation.mutateAsync(formData);
      }
    } catch {
    // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setActiveTab('basic');
    onClose();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (field: 'resume' | 'cover_letter', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleParseJobUrl = async () => {
    if (!formData.job_url.trim()) return;

    setIsParsing(true);
    try {
      const response = await api.post('/parse-job-url/', {
        url: formData.job_url,
      });

      const parsedData = response.data;
      setFormData(prev => ({
        ...prev,
        company_name: parsedData.company_name || prev.company_name,
        job_title: parsedData.job_title || prev.job_title,
        job_id: parsedData.job_id || prev.job_id,
      }));
    } catch (error: any) {
      console.error('Error parsing job URL:', error);
      let errorMessage = 'Failed to parse job URL. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const navigateToNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const navigateToPrevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[600px] flex flex-col'
        >
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-neutral-200 flex-shrink-0'>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-xl bg-blue-100 border border-blue-200'>
                <Briefcase className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-neutral-900'>
                  {editingApplication ? 'Edit Application' : 'Add New Application'}
                </h2>
                <p className='text-neutral-600 text-sm'>
                  {editingApplication
                    ? 'Update your job application details'
                    : 'Track your job application journey'}
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={handleClose}
              className='p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200 focus-ring'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className='px-6 py-3 border-b border-neutral-100 flex-shrink-0'>
            <div className='flex space-x-1'>
              {tabs.map((tab) => {
                const completionStatus = getTabCompletionStatus(tab);
                const isActive = activeTab === tab.id;
                const hasErrors = tab.fields.some(field => errors[field]);

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${getTabButtonClasses(
                      isActive,
                      hasErrors,
                    )}`}
                  >
                    <tab.icon className='h-4 w-4' />
                    <span>{tab.label}</span>
                    {completionStatus === 'complete' && !hasErrors && (
                      <CheckCircle className='h-4 w-4 text-green-500' />
                    )}
                    {hasErrors && (
                      <Circle className='h-4 w-4 text-red-500' />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className='flex-1 flex flex-col min-h-0'>
            <div className='flex-1 overflow-y-auto p-6 min-h-[350px]'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className='h-full'
                >
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className='space-y-6 h-full'>
                      {/* URL Parser */}
                      <div className='p-4 rounded-lg bg-blue-50 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-3'>
                          <Zap className='h-5 w-5 text-blue-600' />
                          <label className='form-label mb-0 text-sm font-medium'>Smart Job URL Parser</label>
                        </div>
                        <div className='flex gap-3'>
                          <input
                            type='url'
                            value={formData.job_url}
                            onChange={e => handleInputChange('job_url', e.target.value)}
                            className={`form-input flex-1 text-sm ${errors.job_url ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder='https://company.com/careers/job-posting'
                          />
                          <button
                            type='button'
                            onClick={handleParseJobUrl}
                            disabled={isParsing || !formData.job_url.trim()}
                            className='btn-accent px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0'
                            title='Parse job details with AI'
                          >
                            {isParsing ? (
                              <div className='flex items-center gap-2'>
                                <div className='loading-accent' />
                                <span>Parsing...</span>
                              </div>
                            ) : (
                              <div className='flex items-center gap-2'>
                                <Zap className='h-4 w-4' />
                                <span>Parse</span>
                              </div>
                            )}
                          </button>
                        </div>
                        {errors.job_url && <p className='text-red-600 text-sm mt-2'>{errors.job_url}</p>}
                        <p className='text-neutral-600 text-sm mt-2'>
                          Paste a job URL and click "Parse" to auto-fill the form using AI
                        </p>
                      </div>

                      {/* Basic Form Fields */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='form-label text-sm font-medium'>Company Name *</label>
                          <input
                            type='text'
                            value={formData.company_name}
                            onChange={e => handleInputChange('company_name', e.target.value)}
                            className={`form-input text-sm ${errors.company_name ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder='Google, Microsoft'
                          />
                          {errors.company_name && (
                            <p className='text-red-600 text-sm mt-1'>{errors.company_name}</p>
                          )}
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Job Title *</label>
                          <input
                            type='text'
                            value={formData.job_title}
                            onChange={e => handleInputChange('job_title', e.target.value)}
                            className={`form-input text-sm ${errors.job_title ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder='Software Engineer'
                          />
                          {errors.job_title && (
                            <p className='text-red-600 text-sm mt-1'>{errors.job_title}</p>
                          )}
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Job ID *</label>
                          <input
                            type='text'
                            value={formData.job_id}
                            onChange={e => handleInputChange('job_id', e.target.value)}
                            className={`form-input text-sm ${errors.job_id ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder='REQ-2024-001 or unique identifier'
                          />
                          {errors.job_id && <p className='text-red-600 text-sm mt-1'>{errors.job_id}</p>}
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Email Used *</label>
                          <input
                            type='email'
                            value={formData.email_used}
                            onChange={e => handleInputChange('email_used', e.target.value)}
                            className={`form-input text-sm ${errors.email_used ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder='your.email@example.com'
                          />
                          {errors.email_used && (
                            <p className='text-red-600 text-sm mt-1'>{errors.email_used}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className='space-y-6 h-full'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='form-label text-sm font-medium'>Application Status</label>
                          <select
                            value={formData.status}
                            onChange={e => handleInputChange('status', e.target.value)}
                            className='form-input text-sm'
                          >
                            <option value='applied'>Applied</option>
                            <option value='interview'>Interview</option>
                            <option value='offer'>Offer</option>
                            <option value='rejected'>Rejected</option>
                            <option value='withdrawn'>Withdrawn</option>
                            <option value='pending'>Pending</option>
                          </select>
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Priority</label>
                          <select
                            value={formData.priority}
                            onChange={e =>
                              handleInputChange('priority', e.target.value as ApplicationPriority)
                            }
                            className='form-input text-sm'
                          >
                            <option value={ApplicationPriority.LOW}>Low</option>
                            <option value={ApplicationPriority.MEDIUM}>Medium</option>
                            <option value={ApplicationPriority.HIGH}>High</option>
                          </select>
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Date Applied *</label>
                          <input
                            type='date'
                            value={formData.date_applied}
                            onChange={e => handleInputChange('date_applied', e.target.value)}
                            className={`form-input text-sm ${errors.date_applied ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                          />
                          {errors.date_applied && (
                            <p className='text-red-600 text-sm mt-1'>{errors.date_applied}</p>
                          )}
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Application Source</label>
                          <select
                            value={formData.source}
                            onChange={e => handleInputChange('source', e.target.value)}
                            className='form-input text-sm'
                          >
                            <option value='linkedin'>LinkedIn</option>
                            <option value='indeed'>Indeed</option>
                            <option value='company_website'>Company Website</option>
                            <option value='angelist'>AngelList</option>
                            <option value='yc'>Y Combinator</option>
                            <option value='glassdoor'>Glassdoor</option>
                            <option value='other'>Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className='form-label text-sm font-medium'>Portal URL (Optional)</label>
                        <input
                          type='url'
                          value={formData.portal_url}
                          onChange={e => handleInputChange('portal_url', e.target.value)}
                          className={`form-input text-sm ${errors.portal_url ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                          placeholder='https://company.workday.com'
                        />
                        {errors.portal_url && (
                          <p className='text-red-600 text-sm mt-1'>{errors.portal_url}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div className='space-y-6 h-full'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <label className='form-label text-sm font-medium'>
                            Resume *{' '}
                            {editingApplication && (
                              <span className='text-sm text-neutral-500'>(optional for updates)</span>
                            )}
                          </label>
                          <div className='mt-2'>
                            <input
                              type='file'
                              accept='.pdf,.doc,.docx'
                              onChange={e => handleFileChange('resume', e.target.files?.[0] || null)}
                              className='hidden'
                              id='resume-upload'
                            />
                            <label
                              htmlFor='resume-upload'
                              className={`form-input cursor-pointer flex items-center justify-center gap-3 h-20 border-2 border-dashed hover:border-blue-300 hover:bg-blue-50/50 transition-colors ${
                                errors.resume ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                              }`}
                            >
                              <FileText className='h-5 w-5 text-neutral-400' />
                              <div className='text-center'>
                                <p className='text-sm text-neutral-600'>
                                  {formData.resume ? formData.resume.name : 'Choose resume file'}
                                </p>
                                <p className='text-xs text-neutral-500'>PDF, DOC, DOCX</p>
                              </div>
                            </label>
                            {errors.resume && (
                              <p className='text-red-600 text-sm mt-1'>{errors.resume}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className='form-label text-sm font-medium'>Cover Letter (Optional)</label>
                          <div className='mt-2'>
                            <input
                              type='file'
                              accept='.pdf,.doc,.docx'
                              onChange={e =>
                                handleFileChange('cover_letter', e.target.files?.[0] || null)
                              }
                              className='hidden'
                              id='cover-letter-upload'
                            />
                            <label
                              htmlFor='cover-letter-upload'
                              className='form-input cursor-pointer flex items-center justify-center gap-3 h-20 border-2 border-dashed border-neutral-300 hover:border-blue-300 hover:bg-blue-50/50 transition-colors'
                            >
                              <FileText className='h-5 w-5 text-neutral-400' />
                              <div className='text-center'>
                                <p className='text-sm text-neutral-600'>
                                  {formData.cover_letter
                                    ? formData.cover_letter.name
                                    : 'Choose cover letter'}
                                </p>
                                <p className='text-xs text-neutral-500'>PDF, DOC, DOCX</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className='h-full'>
                      <label className='form-label text-sm font-medium'>Notes (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={e => handleInputChange('notes', e.target.value)}
                        rows={10}
                        className='form-input resize-none text-sm w-full mt-2'
                        placeholder='Add any additional notes about this application, such as contact information, interview details, or follow-up reminders...'
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form Navigation & Actions */}
            <div className='p-6 border-t border-neutral-200 bg-neutral-50/50 flex-shrink-0'>
              <div className='flex items-center justify-between'>
                {/* Previous Button */}
                <button
                  type='button'
                  onClick={navigateToPrevTab}
                  disabled={activeTab === 'basic'}
                  className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2'
                >
                  Previous
                </button>

                {/* Tab Indicators */}
                <div className='flex items-center gap-3'>
                  {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTab;
                    const isPast = tabs.findIndex(t => t.id === activeTab) > index;
                    const completionStatus = getTabCompletionStatus(tab);

                    return (
                      <div
                        key={tab.id}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${getTabIndicatorClasses(isActive, isPast, completionStatus)}`}
                      />
                    );
                  })}
                </div>

                {/* Next/Submit Button */}
                <div className='flex items-center gap-3'>
                  <button type='button' onClick={handleClose} className='btn-secondary text-sm px-4 py-2'>
                    Cancel
                  </button>

                  {activeTab === 'notes' ? (
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='btn-primary relative min-w-[120px] disabled:opacity-75 disabled:cursor-not-allowed text-sm px-6 py-2'
                    >
                      {isSubmitting ? (
                        <div className='flex items-center justify-center'>
                          <div className='loading-accent mr-2' />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <span>{editingApplication ? 'Update Application' : 'Add Application'}</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={navigateToNextTab}
                      className='btn-primary text-sm px-6 py-2'
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
