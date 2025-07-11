import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Building, 
  Briefcase, 
  Calendar, 
  FileText, 
  Search, 
  Filter, 
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  Table,
  Grid3X3,
  X,
  CheckCircle,
  RotateCw,
  TrendingUp
} from 'lucide-react';
import { useState, useMemo } from 'react';

import TemplateFileManager from '@/components/TemplateFileManager';
import { api } from '@/services/api';

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  date_applied: string;
  resume_filename: string;
  created_at: string;
  updated_at: string;
  status?: string;
  notes?: string;
}

type SortField = 'date_applied' | 'company_name' | 'job_title' | 'resume_filename' | 'created_at' | 'relevance';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const Resumes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  
  // Enhanced sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date_applied', direction: 'desc' });
  
  // Date range filtering state
  const [dateRange, setDateRange] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Bulk actions state
  const [selectedResumes, setSelectedResumes] = useState<Set<string>>(new Set());
  
  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Enhanced export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>('filtered');
  const [exportColumns, setExportColumns] = useState({
    filename: true,
    company: true,
    jobTitle: true,
    dateApplied: true,
    status: false,
    notes: false,
    createdAt: false,
  });
  
  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'templates' | 'resumes' | 'stats'>('resumes');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Column visibility state
  const [visibleColumns] = useState({
    filename: true,
    company: true,
    jobTitle: true,
    dateApplied: true,
    status: false,
    notes: true,
    action: true,
  });

  const { data: applications = [], isLoading, error } = useQuery<Application[]>({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes/').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });



  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalResumes = applications.length;
    
    if (totalResumes === 0) {
      return {
        total: 0,
        byCompany: {} as Record<string, number>,
        topJobTitles: [] as Array<{ title: string; count: number }>,
        recentUploads: 0,
        uniqueCompanies: 0,
      };
    }

    // Resumes by company
    const byCompany = applications.reduce((acc, app) => {
      acc[app.company_name] = (acc[app.company_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top job titles (top 5)
    const jobTitleCount = applications.reduce((acc, app) => {
      acc[app.job_title] = (acc[app.job_title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topJobTitles = Object.entries(jobTitleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));

    // Recent uploads (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentUploads = applications.filter(app => 
      new Date(app.date_applied) >= lastWeek
    ).length;

    // Unique companies
    const uniqueCompanies = new Set(applications.map(app => app.company_name)).size;

    return {
      total: totalResumes,
      byCompany,
      topJobTitles,
      recentUploads,
      uniqueCompanies,
    };
  }, [applications]);

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    if (!applications) return [];
    const companies = [...new Set(applications.map(app => app.company_name))];
    return companies.sort();
  }, [applications]);

  // Get unique job titles for filter dropdown
  const uniqueJobTitles = useMemo(() => {
    if (!applications) return [];
    const jobTitles = [...new Set(applications.map(app => app.job_title))];
    return jobTitles.sort();
  }, [applications]);

  // Date range filtering logic
  const getDateRangeFilter = () => {
    if (!dateRange && !customDateFrom && !customDateTo) return null;
    
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (dateRange) {
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          endDate = now;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case 'last-30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'last-90':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
      }
    }

    // Custom date range
    if (customDateFrom || customDateTo) {
      if (customDateFrom) {
        startDate = new Date(customDateFrom);
      }
      if (customDateTo) {
        endDate = new Date(customDateTo);
        endDate.setHours(23, 59, 59); // End of day
      }
    }

    return { startDate, endDate };
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedApplications = useMemo(() => {
    // First, filter the applications
    let filtered = applications.filter(app => {
      const matchesSearch =
        app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.resume_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCompany = !companyFilter || app.company_name === companyFilter;
      const matchesJobTitle = !jobTitleFilter || app.job_title === jobTitleFilter;

      // Date range filtering
      const dateRangeFilter = getDateRangeFilter();
      let matchesDateRange = true;
      if (dateRangeFilter) {
        const appDate = new Date(app.date_applied);
        const { startDate, endDate } = dateRangeFilter;
        
        if (startDate && appDate < startDate) {
          matchesDateRange = false;
        }
        if (endDate && appDate > endDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesCompany && matchesJobTitle && matchesDateRange;
    });

    // Then, sort the filtered applications
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'resume_filename':
          aValue = a.resume_filename.toLowerCase();
          bValue = b.resume_filename.toLowerCase();
          break;
        case 'company_name':
          aValue = a.company_name.toLowerCase();
          bValue = b.company_name.toLowerCase();
          break;
        case 'job_title':
          aValue = a.job_title.toLowerCase();
          bValue = b.job_title.toLowerCase();
          break;
        case 'date_applied':
          aValue = new Date(a.date_applied).getTime();
          bValue = new Date(b.date_applied).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || a.date_applied).getTime();
          bValue = new Date(b.created_at || b.date_applied).getTime();
          break;
        case 'relevance':
          // Smart relevance scoring based on recency and company frequency
          const getRecencyScore = (dateApplied: string) => {
            const daysSince = Math.floor((Date.now() - new Date(dateApplied).getTime()) / (1000 * 60 * 60 * 24));
            return Math.max(0, 30 - daysSince); // Higher score for more recent
          };
          
          const getCompanyFrequencyScore = (companyName: string) => {
            return dashboardStats.byCompany[companyName] || 1;
          };
          
          aValue = getRecencyScore(a.date_applied) + getCompanyFrequencyScore(a.company_name);
          bValue = getRecencyScore(b.date_applied) + getCompanyFrequencyScore(b.company_name);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [applications, searchTerm, companyFilter, jobTitleFilter, sortConfig, dateRange, customDateFrom, customDateTo, dashboardStats]);

  // Pagination logic
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedApplications.slice(startIndex, endIndex);
  }, [filteredAndSortedApplications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedApplications.length / itemsPerPage);



  // Helper functions
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedResumes.size === paginatedApplications.length) {
      setSelectedResumes(new Set());
    } else {
      const allIds = new Set(paginatedApplications.map(app => app.id));
      setSelectedResumes(allIds);
    }
  };

  const handleSelectResume = (id: string) => {
    const newSelected = new Set(selectedResumes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedResumes(newSelected);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('');
    setJobTitleFilter('');
    setDateRange('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSortConfig({ field: 'date_applied', direction: 'desc' });
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateRange('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowCustomDatePicker(false);
  };

  const handleDownloadResume = async (applicationId: string, filename: string) => {
    try {
      const response = await api.get(`/applications/${applicationId}/resume`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume file.');
    }
  };

  // Bulk download handler
  const handleBulkDownload = async () => {
    const selectedApps = filteredAndSortedApplications.filter(app => selectedResumes.has(app.id));
    for (const app of selectedApps) {
      await handleDownloadResume(app.id, app.resume_filename);
    }
    setSelectedResumes(new Set());
    setShowSuccessMessage(`Successfully downloaded ${selectedApps.length} resume(s)`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  // Export functionality
  const handleExport = () => {
    let dataToExport: Application[] = [];
    
    switch (exportScope) {
      case 'all':
        dataToExport = applications;
        break;
      case 'filtered':
        dataToExport = filteredAndSortedApplications;
        break;
      case 'selected':
        dataToExport = filteredAndSortedApplications.filter(app => selectedResumes.has(app.id));
        break;
    }

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'csv') {
        // Create CSV
        const headers = [];
        if (exportColumns.filename) headers.push('Filename');
        if (exportColumns.company) headers.push('Company');
        if (exportColumns.jobTitle) headers.push('Job Title');
        if (exportColumns.dateApplied) headers.push('Date Applied');
        if (exportColumns.status) headers.push('Status');
        if (exportColumns.notes) headers.push('Notes');
        if (exportColumns.createdAt) headers.push('Created At');

        const csvContent = [
          headers.join(','),
          ...dataToExport.map(app => {
            const row = [];
            if (exportColumns.filename) row.push(`"${app.resume_filename}"`);
            if (exportColumns.company) row.push(`"${app.company_name}"`);
            if (exportColumns.jobTitle) row.push(`"${app.job_title}"`);
            if (exportColumns.dateApplied) row.push(`"${app.date_applied}"`);
            if (exportColumns.status) row.push(`"${app.status || 'N/A'}"`);
            if (exportColumns.notes) row.push(`"${app.notes || 'N/A'}"`);
            if (exportColumns.createdAt) row.push(`"${app.created_at || app.date_applied}"`);
            return row.join(',');
          })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumes-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Create JSON
        const jsonData = dataToExport.map(app => {
          const obj: any = {};
          if (exportColumns.filename) obj.filename = app.resume_filename;
          if (exportColumns.company) obj.company = app.company_name;
          if (exportColumns.jobTitle) obj.jobTitle = app.job_title;
          if (exportColumns.dateApplied) obj.dateApplied = app.date_applied;
          if (exportColumns.status) obj.status = app.status || 'N/A';
          if (exportColumns.notes) obj.notes = app.notes || 'N/A';
          if (exportColumns.createdAt) obj.createdAt = app.created_at || app.date_applied;
          return obj;
        });

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setShowSuccessMessage(`Successfully exported ${dataToExport.length} resume(s)`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper Components
  const TabButton = ({ tab, label, count }: { tab: 'templates' | 'resumes' | 'stats'; label: string; count?: number }) => (
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

  const SortableHeader = ({ 
    field, 
    children, 
    className = '' 
  }: { 
    field: SortField; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <motion.button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-2 font-medium text-neutral-700 hover:text-neutral-900 transition-colors ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      {children}
      {sortConfig.field === field && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-neutral-500"
        >
          {sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </motion.div>
      )}
    </motion.button>
  );

  const StatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'neutral',
    onClick,
    subtitle
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: 'neutral' | 'blue' | 'green' | 'purple' | 'orange';
    onClick?: () => void;
    subtitle?: string;
  }) => {
    const colorClasses = {
      neutral: 'border-neutral-200 bg-neutral-50 text-neutral-600',
      blue: 'border-blue-200 bg-blue-50 text-blue-600',
      green: 'border-green-200 bg-green-50 text-green-600',
      purple: 'border-purple-200 bg-purple-50 text-purple-600',
      orange: 'border-orange-200 bg-orange-50 text-orange-600',
    };

    return (
      <motion.div
        className={`${onClick ? 'cursor-pointer' : ''} card-interactive`}
        onClick={onClick}
        whileHover={onClick ? { y: -2 } : {}}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">{title}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </motion.div>
    );
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

  return (
    <motion.div
      className='space-y-8'
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
              <h1 className='text-2xl font-bold text-neutral-900'>Resumes</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <FileText className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Resume Library</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              View and manage all your submitted resumes
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
        <TabButton tab="templates" label="Template Resumes" />
        <TabButton tab="resumes" label="Resumes" count={applications.length} />
        <TabButton tab="stats" label="Analytics & Stats" />
      </motion.div>

            {/* Tab Content */}
      {activeTab === 'templates' && (
        /* Template Resumes Tab */
        <motion.div variants={itemVariants} className="space-y-6">
          <TemplateFileManager fileType='resume' title='Resume Templates' />
        </motion.div>
      )}

      {activeTab === 'stats' && (
        /* Analytics Dashboard */
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Overview Stats */}
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Resume Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Resumes"
                value={dashboardStats.total}
                icon={FileText}
                color="blue"
                onClick={() => {
                  setActiveTab('resumes');
                  clearFilters();
                }}
              />
              <StatsCard
                title="Companies Applied"
                value={dashboardStats.uniqueCompanies}
                icon={Building}
                color="green"
                onClick={() => {
                  setActiveTab('resumes');
                  clearFilters();
                }}
              />
              <StatsCard
                title="Recent Uploads"
                value={dashboardStats.recentUploads}
                icon={TrendingUp}
                color="purple"
                subtitle="Last 7 days"
                onClick={() => {
                  setActiveTab('resumes');
                  setDateRange('week');
                }}
              />
              <StatsCard
                title="Total Job Roles"
                value={dashboardStats.topJobTitles.length}
                icon={Briefcase}
                color="orange"
              />
            </div>
          </div>

          {/* Top Companies */}
          {Object.keys(dashboardStats.byCompany).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-neutral-600" />
                  Resumes by Company
                </h4>
                <div className="space-y-3">
                  {Object.entries(dashboardStats.byCompany)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([company, count]) => {
                      const percentage = ((count / dashboardStats.total) * 100).toFixed(1);
                      return (
                        <motion.div
                          key={company}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                          onClick={() => {
                            setActiveTab('resumes');
                            setCompanyFilter(company);
                          }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="font-medium text-neutral-900 truncate">{company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <span>{count} resume{count !== 1 ? 's' : ''}</span>
                            <span className="text-xs text-neutral-500">({percentage}%)</span>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              {/* Top Job Titles */}
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-neutral-600" />
                  Most Applied Job Titles
                </h4>
                <div className="space-y-3">
                  {dashboardStats.topJobTitles.slice(0, 8).map((job, index) => {
                    const percentage = ((job.count / dashboardStats.total) * 100).toFixed(1);
                    return (
                      <motion.div
                        key={job.title}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={() => {
                          setActiveTab('resumes');
                          setJobTitleFilter(job.title);
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' : 
                            index === 1 ? 'bg-blue-500' : 
                            index === 2 ? 'bg-purple-500' : 'bg-neutral-400'
                          }`} />
                          <span className="font-medium text-neutral-900 truncate">{job.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <span>{job.count} resume{job.count !== 1 ? 's' : ''}</span>
                          <span className="text-xs text-neutral-500">({percentage}%)</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'resumes' && (
        <motion.div variants={itemVariants} className="space-y-6">

          {/* Application Resumes Section */}
          {applications && applications.length > 0 && (
            <div className='space-y-6'>
              {/* Section Header with Stats and Actions */}
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-xl font-semibold text-neutral-900'>Application Resumes</h3>
                  <p className='text-sm text-neutral-600'>
                    Showing {paginatedApplications.length} of {filteredAndSortedApplications.length} resumes
                    {filteredAndSortedApplications.length !== applications.length && 
                      ` (${applications.length} total)`
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex border border-neutral-200 rounded-lg p-1">
                    <motion.button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded ${viewMode === 'cards' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded ${viewMode === 'table' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Table className="h-4 w-4" />
                    </motion.button>
                  </div>


                </div>
              </div>

              {/* Enhanced Filters */}
              <div className='card p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Filter className='h-4 w-4 text-neutral-600' />
                  <h4 className='font-medium text-neutral-900'>Advanced Filters</h4>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4'>
                  {/* Enhanced Search */}
                  <div className='relative lg:col-span-2'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                    <input
                      type='text'
                      placeholder='Search filename, company, job title...'
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

                  {/* Job Title Filter */}
                  <select
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    className='input-field'
                  >
                    <option value=''>All Job Titles</option>
                    {uniqueJobTitles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <div className='flex gap-2'>
                    <select
                      value={sortConfig.field}
                      onChange={(e) => handleSort(e.target.value as SortField)}
                      className='input-field flex-1'
                    >
                      <option value='date_applied'>Date Applied</option>
                      <option value='company_name'>Company</option>
                      <option value='job_title'>Job Title</option>
                      <option value='resume_filename'>Filename</option>
                      <option value='relevance'>Relevance</option>
                      <option value='created_at'>Upload Date</option>
                    </select>
                    <motion.button
                      onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                      className='btn-secondary px-3'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sortConfig.direction === 'asc' ? 
                        <ArrowUp className='h-4 w-4' /> : 
                        <ArrowDown className='h-4 w-4' />
                      }
                    </motion.button>
                  </div>
                </div>

                {/* Date Range Filters */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                  <select
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value);
                      if (e.target.value !== 'custom') {
                        setShowCustomDatePicker(false);
                        setCustomDateFrom('');
                        setCustomDateTo('');
                      } else {
                        setShowCustomDatePicker(true);
                      }
                    }}
                    className='input-field'
                  >
                    <option value=''>All Time</option>
                    <option value='today'>Today</option>
                    <option value='week'>Past Week</option>
                    <option value='month'>This Month</option>
                    <option value='last-30'>Last 30 Days</option>
                    <option value='quarter'>This Quarter</option>
                    <option value='last-90'>Last 90 Days</option>
                    <option value='year'>This Year</option>
                    <option value='custom'>Custom Range</option>
                  </select>

                  {showCustomDatePicker && (
                    <>
                      <input
                        type='date'
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className='input-field'
                        placeholder='From date'
                      />
                      <input
                        type='date'
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className='input-field'
                        placeholder='To date'
                      />
                    </>
                  )}
                </div>

                {/* Active Filters & Clear */}
                {(searchTerm || companyFilter || jobTitleFilter || dateRange || customDateFrom || customDateTo || sortConfig.field !== 'date_applied' || sortConfig.direction !== 'desc') && (
                  <div className='flex items-center gap-2 pt-4 border-t border-neutral-200'>
                    <span className='text-sm text-neutral-600'>Active filters:</span>
                    {searchTerm && (
                      <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1'>
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm('')}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {companyFilter && (
                      <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1'>
                        Company: {companyFilter}
                        <button onClick={() => setCompanyFilter('')}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {jobTitleFilter && (
                      <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1'>
                        Job Title: {jobTitleFilter}
                        <button onClick={() => setJobTitleFilter('')}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {dateRange && (
                      <span className='px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1'>
                        Date: {dateRange}
                        <button onClick={clearDateFilter}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {(customDateFrom || customDateTo) && (
                      <span className='px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1'>
                        Custom: {customDateFrom || 'Start'} - {customDateTo || 'End'}
                        <button onClick={clearDateFilter}>
                          <X className="h-3 w-3" />
                        </button>
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

              {/* Bulk Actions Bar */}
              {selectedResumes.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedResumes.size} resume{selectedResumes.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={handleBulkDownload}
                        className="btn-secondary text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download All
                      </motion.button>

                      <motion.button
                        onClick={() => setSelectedResumes(new Set())}
                        className="text-sm text-neutral-600 hover:text-neutral-900"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Content Area */}
              {isLoading ? (
                <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {Array.from({ length: 6 }).map((_, index) => (
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
                    Failed to load resumes
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
                    No resumes found
                  </h3>
                  <p className='text-neutral-600 mb-6'>
                    Try adjusting your filters or search terms to find more resumes.
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
                <div className="space-y-6">
                  {/* Resumes Display */}
                  {viewMode === 'cards' ? (
                    <motion.div
                      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      variants={containerVariants}
                      initial='hidden'
                      animate='visible'
                    >
                      {paginatedApplications.map((app, index) => (
                        <motion.div
                          key={app.id}
                          className='card-interactive group relative'
                          variants={itemVariants}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -4 }}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                            <motion.button
                              onClick={() => handleSelectResume(app.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedResumes.has(app.id)
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-neutral-300 bg-white hover:border-neutral-400'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {selectedResumes.has(app.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </motion.button>
                          </div>

                          <div className='p-6 h-full flex flex-col'>
                            <div className='flex-1'>
                              <div className='flex items-start gap-3 mb-4'>
                                <div className='p-2 rounded-lg bg-neutral-100 flex-shrink-0'>
                                  <FileText className='h-5 w-5 text-neutral-600' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <h3
                                    className='font-semibold text-lg text-neutral-900 truncate group-hover:text-blue-600 transition-colors'
                                    title={app.resume_filename}
                                  >
                                    {app.resume_filename}
                                  </h3>
                                </div>
                              </div>

                              <div className='space-y-3 text-sm text-neutral-600'>
                                <div className='flex items-center gap-3'>
                                  <Briefcase className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                                  <span className='truncate' title={app.job_title}>{app.job_title}</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                  <Building className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                                  <span className='truncate' title={app.company_name}>{app.company_name}</span>
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
                              onClick={() => handleDownloadResume(app.id, app.resume_filename)}
                              className='mt-6 w-full btn-primary'
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Download className='h-4 w-4 mr-2' />
                              Download Resume
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    /* Table View */
                    <div className="card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                              <th className="px-6 py-3 text-left">
                                <motion.button
                                  onClick={handleSelectAll}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    selectedResumes.size === paginatedApplications.length && paginatedApplications.length > 0
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : selectedResumes.size > 0
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-neutral-300 bg-white hover:border-neutral-400'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {selectedResumes.size === paginatedApplications.length && paginatedApplications.length > 0 ? (
                                    <Check className="h-3 w-3" />
                                  ) : selectedResumes.size > 0 ? (
                                    <Minus className="h-3 w-3" />
                                  ) : null}
                                </motion.button>
                              </th>
                              {visibleColumns.filename && (
                                <th className="px-6 py-3 text-left">
                                  <SortableHeader field="resume_filename">
                                    Filename
                                  </SortableHeader>
                                </th>
                              )}
                              {visibleColumns.company && (
                                <th className="px-6 py-3 text-left">
                                  <SortableHeader field="company_name">
                                    Company
                                  </SortableHeader>
                                </th>
                              )}
                              {visibleColumns.jobTitle && (
                                <th className="px-6 py-3 text-left">
                                  <SortableHeader field="job_title">
                                    Job Title
                                  </SortableHeader>
                                </th>
                              )}
                              {visibleColumns.dateApplied && (
                                <th className="px-6 py-3 text-left">
                                  <SortableHeader field="date_applied">
                                    Date Applied
                                  </SortableHeader>
                                </th>
                              )}
                              {visibleColumns.action && (
                                <th className="px-6 py-3 text-right">
                                  Actions
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {paginatedApplications.map((app) => (
                              <motion.tr
                                key={app.id}
                                className="hover:bg-neutral-50 transition-colors"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <td className="px-6 py-4">
                                  <motion.button
                                    onClick={() => handleSelectResume(app.id)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      selectedResumes.has(app.id)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-neutral-300 bg-white hover:border-neutral-400'
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {selectedResumes.has(app.id) && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </motion.button>
                                </td>
                                {visibleColumns.filename && (
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-neutral-100">
                                        <FileText className="h-4 w-4 text-neutral-600" />
                                      </div>
                                      <span className="font-medium text-neutral-900 truncate" title={app.resume_filename}>
                                        {app.resume_filename}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.company && (
                                  <td className="px-6 py-4">
                                    <span className="text-neutral-700" title={app.company_name}>
                                      {app.company_name}
                                    </span>
                                  </td>
                                )}
                                {visibleColumns.jobTitle && (
                                  <td className="px-6 py-4">
                                    <span className="text-neutral-700" title={app.job_title}>
                                      {app.job_title}
                                    </span>
                                  </td>
                                )}
                                {visibleColumns.dateApplied && (
                                  <td className="px-6 py-4">
                                    <span className="text-neutral-700">
                                      {new Date(app.date_applied).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </td>
                                )}
                                {visibleColumns.action && (
                                  <td className="px-6 py-4 text-right">
                                    <motion.button
                                      onClick={() => handleDownloadResume(app.id, app.resume_filename)}
                                      className="btn-secondary text-sm"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </motion.button>
                                  </td>
                                )}
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-neutral-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedApplications.length)} of {filteredAndSortedApplications.length} results
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="input-field w-auto"
                        >
                          <option value={5}>5 per page</option>
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                          whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </motion.button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <motion.button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'bg-neutral-900 text-white'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {pageNum}
                              </motion.button>
                            );
                          })}
                        </div>

                        <motion.button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                          whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
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
                <h3 className="text-lg font-semibold text-neutral-900">Export Resumes</h3>
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
                      { value: 'all', label: `All resumes (${applications.length})` },
                      { value: 'filtered', label: `Filtered resumes (${filteredAndSortedApplications.length})` },
                      { value: 'selected', label: `Selected resumes (${selectedResumes.size})` },
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

                {/* Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Columns to Include
                  </label>
                  <div className="space-y-2">
                    {Object.entries({
                      filename: 'Filename',
                      company: 'Company',
                      jobTitle: 'Job Title',
                      dateApplied: 'Date Applied',
                      status: 'Status',
                      notes: 'Notes',
                      createdAt: 'Created At',
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportColumns[key as keyof typeof exportColumns]}
                          onChange={(e) =>
                            setExportColumns(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))
                          }
                          className="rounded border-neutral-300"
                        />
                        <span className="text-sm text-neutral-700">{label}</span>
                      </label>
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
};

export default Resumes;
