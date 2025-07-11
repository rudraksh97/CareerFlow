import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Building, 
  Briefcase, 
  Mail, 
  Calendar, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  TrendingUp,
  CheckCircle,
  RotateCw,
  X
} from 'lucide-react';
import { useState, useMemo } from 'react';

import TemplateFileManager from '@/components/TemplateFileManager';
import { api } from '@/services/api';
import { Application } from '@/types';

interface ApplicationWithCoverLetter extends Application {
  cover_letter_filename?: string;
}

type SortField = 'date_applied' | 'company_name' | 'job_title' | 'cover_letter_filename';
type SortDirection = 'asc' | 'desc';

const fetchCoverLetters = async (): Promise<ApplicationWithCoverLetter[]> => {
  const { data } = await api.get('/cover-letters/');
  return data;
};

export default function CoverLetters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date_applied');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Enhanced export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');
  const [isExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'templates' | 'letters' | 'stats'>('letters');

  const {
    data: applications,
    isLoading,
    error,
  } = useQuery<ApplicationWithCoverLetter[]>({
    queryKey: ['applications', 'cover-letters'],
    queryFn: fetchCoverLetters,
  });

  const coverLetterApplications = applications?.filter(app => app.cover_letter_filename) || [];

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    if (!coverLetterApplications) return [];
    const companies = [...new Set(coverLetterApplications.map(app => app.company_name))];
    return companies.sort();
  }, [coverLetterApplications]);

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    if (!coverLetterApplications) return [];

    let filtered = coverLetterApplications.filter(app => {
      const matchesSearch = 
        app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.cover_letter_filename && app.cover_letter_filename.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCompany = !companyFilter || app.company_name === companyFilter;
      
      const matchesDate = !dateFilter || (() => {
        const appDate = new Date(app.date_applied);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'week': return daysAgo <= 7;
          case 'month': return daysAgo <= 30;
          case 'quarter': return daysAgo <= 90;
          case 'year': return daysAgo <= 365;
          default: return true;
        }
      })();

      return matchesSearch && matchesCompany && matchesDate;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'date_applied':
          aVal = new Date(a.date_applied).getTime();
          bVal = new Date(b.date_applied).getTime();
          break;
        case 'company_name':
          aVal = a.company_name.toLowerCase();
          bVal = b.company_name.toLowerCase();
          break;
        case 'job_title':
          aVal = a.job_title.toLowerCase();
          bVal = b.job_title.toLowerCase();
          break;
        case 'cover_letter_filename':
          aVal = (a.cover_letter_filename || '').toLowerCase();
          bVal = (b.cover_letter_filename || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [coverLetterApplications, searchTerm, companyFilter, dateFilter, sortField, sortDirection]);

  const clearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('');
    setDateFilter('');
    setSortField('date_applied');
    setSortDirection('desc');
  };

  const handleDownload = (applicationId: string) => {
    window.open(`${api.defaults.baseURL}/applications/${applicationId}/cover-letter`, '_blank');
  };

  const handleExport = () => {
    const dataToExport = exportScope === 'all' ? coverLetterApplications : filteredAndSortedApplications;
    
    if (exportFormat === 'csv') {
      exportAsCSV(dataToExport);
    } else {
      exportAsJSON(dataToExport);
    }
    
    setShowExportModal(false);
    setShowSuccessMessage(`Successfully exported ${dataToExport.length} cover letter(s)`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const exportAsCSV = (data: ApplicationWithCoverLetter[]) => {
    const headers = ['Filename', 'Company', 'Job Title', 'Date Applied'];
    const csvContent = [
      headers.join(','),
      ...data.map(app => [
        `"${app.cover_letter_filename || ''}"`,
        `"${app.company_name}"`,
        `"${app.job_title}"`,
        `"${app.date_applied}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cover-letters-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportAsJSON = (data: ApplicationWithCoverLetter[]) => {
    const exportData = data.map(app => ({
      filename: app.cover_letter_filename,
      company: app.company_name,
      jobTitle: app.job_title,
      dateApplied: app.date_applied
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cover-letters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const TabButton = ({ tab, label, count }: { tab: 'templates' | 'letters' | 'stats'; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`
        px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200
        ${activeTab === tab
          ? 'border-neutral-900 text-neutral-900 bg-white' 
          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`
          ml-2 px-2 py-0.5 text-xs rounded-full font-medium
          ${activeTab === tab 
            ? 'bg-neutral-100 text-neutral-700' 
            : 'bg-neutral-200 text-neutral-600'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );

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
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className='space-y-4'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {showSuccessMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-4 mb-2'>
              <h1 className='text-2xl font-bold text-neutral-900'>Cover Letters</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <Mail className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Cover Letter Library</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Browse and download your submitted cover letters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className='h-4 w-4' />
              Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex items-end gap-0 border-b border-neutral-200">
        <TabButton tab="templates" label="Template Letters" />
        <TabButton tab="letters" label="Cover Letters" count={coverLetterApplications.length} />
        <TabButton tab="stats" label="Analytics & Stats" />
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <TemplateFileManager fileType='cover_letter' title='Cover Letter Templates' />
        </motion.div>
      )}

      {activeTab === 'stats' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Cover Letter Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Total Letters</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{coverLetterApplications.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                    <Mail className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Companies</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{uniqueCompanies.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-600">
                    <Building className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">This Month</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {coverLetterApplications.filter(app => {
                        const appDate = new Date(app.date_applied);
                        const now = new Date();
                        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Recent</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {coverLetterApplications.filter(app => {
                        const appDate = new Date(app.date_applied);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return appDate >= weekAgo;
                      }).length}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Last 7 days</p>
                  </div>
                  <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'letters' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Application Cover Letters Section */}
          {applications && coverLetterApplications.length > 0 && (
            <div className='space-y-6'>
              {/* Section Header with Stats */}
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-xl font-semibold text-neutral-900'>Application Cover Letters</h3>
                  <p className='text-sm text-neutral-600'>
                    Showing {filteredAndSortedApplications.length} of {coverLetterApplications.length} cover letters
                  </p>
                </div>
              </div>

              {/* Filters and Search */}
              <div className='card p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Filter className='h-4 w-4 text-neutral-600' />
                  <h4 className='font-medium text-neutral-900'>Filter & Search</h4>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                  {/* Search */}
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                    <input
                      type='text'
                      placeholder='Search cover letters...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='input-field pl-10'
                    />
                  </div>

                  {/* Company Filter */}
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className='input-field'
                  >
                    <option value=''>All Companies</option>
                    {uniqueCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>

                  {/* Date Filter */}
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className='input-field'
                  >
                    <option value=''>All Time</option>
                    <option value='week'>Past Week</option>
                    <option value='month'>Past Month</option>
                    <option value='quarter'>Past 3 Months</option>
                    <option value='year'>Past Year</option>
                  </select>

                  {/* Sort */}
                  <div className='flex gap-2'>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className='input-field flex-1'
                    >
                      <option value='date_applied'>Date Applied</option>
                      <option value='company_name'>Company</option>
                      <option value='job_title'>Job Title</option>
                      <option value='cover_letter_filename'>Filename</option>
                    </select>
                    <motion.button
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className='btn-secondary px-3'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sortDirection === 'asc' ? 
                        <SortAsc className='h-4 w-4' /> : 
                        <SortDesc className='h-4 w-4' />
                      }
                    </motion.button>
                  </div>
                </div>

                {/* Active Filters & Clear */}
                {(searchTerm || companyFilter || dateFilter || sortField !== 'date_applied' || sortDirection !== 'desc') && (
                  <div className='flex items-center gap-2 pt-4 border-t border-neutral-200'>
                    <span className='text-sm text-neutral-600'>Active filters:</span>
                    {searchTerm && (
                      <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
                        Search: {searchTerm}
                      </span>
                    )}
                    {companyFilter && (
                      <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                        Company: {companyFilter}
                      </span>
                    )}
                    {dateFilter && (
                      <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
                        Date: {dateFilter}
                      </span>
                    )}
                    <motion.button
                      onClick={clearFilters}
                      className='text-xs text-neutral-600 hover:text-neutral-900 underline ml-auto'
                      whileHover={{ scale: 1.02 }}
                    >
                      Clear all
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Cover Letter Grid */}
              {isLoading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className='card p-6 animate-pulse'>
                      <div className='h-5 bg-neutral-200 rounded w-3/4 mb-4' />
                      <div className='h-4 bg-neutral-100 rounded w-1/2 mb-3' />
                      <div className='h-4 bg-neutral-100 rounded w-1/2 mb-3' />
                      <div className='h-4 bg-neutral-100 rounded w-1/2 mb-6' />
                      <div className='h-10 bg-neutral-200 rounded-lg w-full' />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <motion.div className='card p-12 text-center' variants={itemVariants}>
                  <div className='p-4 rounded-full bg-red-100 w-fit mx-auto mb-6'>
                    <FileText className='h-12 w-12 text-red-500' />
                  </div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                    Failed to load cover letters
                  </h3>
                  <p className='text-neutral-600 mb-6'>
                    Please try refreshing the page or contact support if the problem persists.
                  </p>
                  <motion.button
                    onClick={() => window.location.reload()}
                    className='btn-primary'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Refresh Page
                  </motion.button>
                </motion.div>
              ) : filteredAndSortedApplications.length === 0 ? (
                <motion.div className='card p-12 text-center' variants={itemVariants}>
                  <div className='p-4 rounded-full bg-neutral-100 w-fit mx-auto mb-6'>
                    <Search className='h-12 w-12 text-neutral-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                    No cover letters found
                  </h3>
                  <p className='text-neutral-600 mb-6'>
                    Try adjusting your filters or search terms to find more cover letters.
                  </p>
                  <motion.button
                    onClick={clearFilters}
                    className='btn-secondary'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear Filters
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {filteredAndSortedApplications.map((app, index) => (
                    <motion.div
                      key={app.id}
                      className='card-interactive group'
                      variants={itemVariants}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className='p-6 h-full flex flex-col'>
                        <div className='flex-1'>
                          <div className='flex items-start gap-3 mb-4'>
                            <div className='p-2 rounded-lg bg-neutral-100 flex-shrink-0'>
                              <FileText className='h-5 w-5 text-neutral-600' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h3
                                className='font-semibold text-lg text-neutral-900 truncate group-hover:text-blue-600 transition-colors'
                                title={app.cover_letter_filename}
                              >
                                {app.cover_letter_filename}
                              </h3>
                            </div>
                          </div>

                          <div className='space-y-3 text-sm text-neutral-600'>
                            <div className='flex items-center gap-3'>
                              <Briefcase className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                              <span className='truncate' title={app.job_title}>
                                {app.job_title}
                              </span>
                            </div>
                            <div className='flex items-center gap-3'>
                              <Building className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                              <span className='truncate' title={app.company_name}>
                                {app.company_name}
                              </span>
                            </div>
                            <div className='flex items-center gap-3'>
                              <Calendar className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                              <span className='font-medium text-neutral-700'>
                                {new Date(app.date_applied).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => handleDownload(app.id)}
                          className='mt-6 w-full btn-primary'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download className='h-4 w-4 mr-2' />
                          Download Letter
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Export Cover Letters</h3>
                <motion.button
                  onClick={() => setShowExportModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                  whileHover={{ scale: 1.1 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['csv', 'json'] as const).map((format) => (
                      <motion.button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`p-3 rounded-lg border text-center ${
                          exportFormat === format
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {format.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Export Scope */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    What to Export
                  </label>
                  <div className="space-y-2">
                    {([
                      { value: 'all', label: `All letters (${coverLetterApplications.length})` },
                      { value: 'filtered', label: `Filtered letters (${filteredAndSortedApplications.length})` },
                    ] as const).map(({ value, label }) => (
                      <motion.button
                        key={value}
                        onClick={() => setExportScope(value)}
                        className={`w-full p-3 rounded-lg border text-left ${
                          exportScope === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isExporting ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
