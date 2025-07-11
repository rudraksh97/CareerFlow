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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Target,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Users,
  Sparkles,
  CalendarDays,
  X,
  Square,
  CheckSquare,
  Download,
  RotateCw,
  Table,
  ChevronLeft,
  ChevronRight,
  Columns,
  Check,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';

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

type SortField = 'company_name' | 'job_title' | 'date_applied' | 'status' | 'priority' | 'source' | 'email_used' | 'relevance';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function Applications() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Enhanced sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date_applied', direction: 'desc' });
  
  // Date range filtering state
  const [dateRange, setDateRange] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Bulk actions state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Enhanced export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>('filtered');
  const [exportColumns, setExportColumns] = useState({
    company: true,
    role: true,
    status: true,
    priority: true,
    dateApplied: true,
    email: true,
    source: true,
    notes: true,
    jobUrl: false,
    resumeFilename: false,
  });
  
  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'stats' | 'applications'>('applications');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    role: true,
    resume: true,
    appliedWith: true,
    status: true,
    priority: true,
    notes: true,
    referralContact: false,
    action: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

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

  // Bulk operations mutations
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const promises = ids.map(id => 
        api.put(`/applications/${id}`, { status })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplications(new Set());
      setShowBulkActions(false);
      setShowSuccessMessage(`Successfully updated ${variables.ids.length} application(s) to "${variables.status}" status`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  const bulkUpdatePriorityMutation = useMutation({
    mutationFn: async ({ ids, priority }: { ids: string[]; priority: ApplicationPriority }) => {
      const promises = ids.map(id => 
        api.put(`/applications/${id}`, { priority })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplications(new Set());
      setShowBulkActions(false);
      setShowSuccessMessage(`Successfully updated ${variables.ids.length} application(s) to "${variables.priority}" priority`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => api.delete(`/applications/${id}/`));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplications(new Set());
      setShowBulkActions(false);
      setShowSuccessMessage(`Successfully deleted ${ids.length} application(s)`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalApplications = applications.length;
    
    if (totalApplications === 0) {
      return {
        total: 0,
        successRate: 0,
        activeApplications: 0,
        thisMonth: 0,
        highPriority: 0,
        needsFollowup: 0,
        recentActivity: 0,
      };
    }

    // Success rate calculation (interviews + offers)
    const successfulApplications = applications.filter(app => 
      app.status === 'interview' || app.status === 'offer'
    ).length;
    const successRate = Math.round((successfulApplications / totalApplications) * 100);

    // Active applications (applied, interview, pending)
    const activeApplications = applications.filter(app => 
      app.status === 'applied' || app.status === 'interview' || app.status === 'pending'
    ).length;

    // Applications this month
    const thisMonth = new Date();
    const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const thisMonthApplications = applications.filter(app => 
      new Date(app.date_applied) >= firstDayOfMonth
    ).length;

    // High priority applications
    const highPriorityApplications = applications.filter(app => 
      app.priority === ApplicationPriority.HIGH
    ).length;

    // Applications that might need follow-up (applied status, older than 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const needsFollowup = applications.filter(app => 
      app.status === 'applied' && new Date(app.date_applied) < twoWeeksAgo
    ).length;

    // Recent activity (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivity = applications.filter(app => 
      new Date(app.date_applied) >= lastWeek
    ).length;

    return {
      total: totalApplications,
      successRate,
      activeApplications,
      thisMonth: thisMonthApplications,
      highPriority: highPriorityApplications,
      needsFollowup,
      recentActivity,
    };
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
        app.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !statusFilter || app.status === statusFilter;
      const matchesPriority = !priorityFilter || app.priority === priorityFilter;
      const matchesSource = !sourceFilter || app.source === sourceFilter;

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

      return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesDateRange;
    });

    // Then, sort the filtered applications
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
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
        case 'status':
          // Custom status priority: offer > interview > applied > pending > rejected > withdrawn
          const statusPriority = {
            offer: 6,
            interview: 5,
            applied: 4,
            pending: 3,
            rejected: 2,
            withdrawn: 1,
          };
          aValue = statusPriority[a.status as keyof typeof statusPriority] || 0;
          bValue = statusPriority[b.status as keyof typeof statusPriority] || 0;
          break;
        case 'priority':
          const priorityValues = {
            [ApplicationPriority.HIGH]: 3,
            [ApplicationPriority.MEDIUM]: 2,
            [ApplicationPriority.LOW]: 1,
          };
          aValue = priorityValues[a.priority] || 0;
          bValue = priorityValues[b.priority] || 0;
          break;
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        case 'email_used':
          aValue = a.email_used.toLowerCase();
          bValue = b.email_used.toLowerCase();
          break;
        case 'relevance':
          // Smart relevance scoring based on priority, status, and recency
          const getPriorityScore = (priority: ApplicationPriority) => {
            switch (priority) {
              case ApplicationPriority.HIGH: return 3;
              case ApplicationPriority.MEDIUM: return 2;
              case ApplicationPriority.LOW: return 1;
              default: return 0;
            }
          };
          
          const getStatusScore = (status: string) => {
            switch (status) {
              case 'offer': return 10;
              case 'interview': return 8;
              case 'applied': return 6;
              case 'pending': return 4;
              case 'rejected': return 2;
              case 'withdrawn': return 1;
              default: return 0;
            }
          };
          
          const getRecencyScore = (dateApplied: string) => {
            const daysSince = Math.floor((Date.now() - new Date(dateApplied).getTime()) / (1000 * 60 * 60 * 24));
            return Math.max(0, 30 - daysSince); // Higher score for more recent applications
          };
          
          aValue = getPriorityScore(a.priority) * 2 + getStatusScore(a.status) + getRecencyScore(a.date_applied);
          bValue = getPriorityScore(b.priority) * 2 + getStatusScore(b.status) + getRecencyScore(b.date_applied);
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
  }, [applications, searchTerm, statusFilter, priorityFilter, sourceFilter, sortConfig, dateRange, customDateFrom, customDateTo]);

  // Pagination logic
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedApplications.slice(startIndex, endIndex);
  }, [filteredAndSortedApplications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedApplications.length / itemsPerPage);

  // Reset pagination when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Handle column sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle quick filter clicks from stats cards
  const handleQuickFilter = (filterType: string) => {
    // Clear current filters first
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setSourceFilter('');
    resetPagination();
    
    switch (filterType) {
      case 'active':
        setStatusFilter('applied');
        break;
      case 'high-priority':
        setPriorityFilter(ApplicationPriority.HIGH);
        break;
      case 'needs-followup':
        setStatusFilter('applied');
        // Note: This would ideally also filter by date, but we'll rely on users to look at the dates
        break;
      case 'successful':
        setStatusFilter('interview');
        break;
    }
    
    // Switch to applications tab when filtering
    setActiveTab('applications');
  };

  // Handle date range changes
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (range !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
    resetPagination();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setSourceFilter('');
    setDateRange('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowCustomDatePicker(false);
    resetPagination();
  };

  // Column visibility toggle
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  // Close dropdown when clicking outside
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search and filter changes with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetPagination();
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    resetPagination();
  };

  const handleSourceFilterChange = (value: string) => {
    setSourceFilter(value);
    resetPagination();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter) count++;
    if (priorityFilter) count++;
    if (sourceFilter) count++;
    if (dateRange || customDateFrom || customDateTo) count++;
    return count;
  };

  // Get date range display text
  const getDateRangeDisplayText = () => {
    if (!dateRange && !customDateFrom && !customDateTo) return '';
    
    if (dateRange) {
      switch (dateRange) {
        case 'today': return 'Today';
        case 'week': return 'Last 7 days';
        case 'month': return 'This month';
        case 'quarter': return 'This quarter';
        case 'year': return 'This year';
        case 'last-30': return 'Last 30 days';
        case 'last-90': return 'Last 90 days';
        default: return '';
      }
    }
    
    if (customDateFrom && customDateTo) {
      return `${new Date(customDateFrom).toLocaleDateString()} - ${new Date(customDateTo).toLocaleDateString()}`;
    } else if (customDateFrom) {
      return `From ${new Date(customDateFrom).toLocaleDateString()}`;
    } else if (customDateTo) {
      return `Until ${new Date(customDateTo).toLocaleDateString()}`;
    }
    
    return '';
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedApplications.size === filteredAndSortedApplications.length) {
      setSelectedApplications(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(filteredAndSortedApplications.map(app => app.id));
      setSelectedApplications(allIds);
      setShowBulkActions(true);
    }
  };

  const handleSelectApplication = (id: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApplications(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkUpdateStatus = (status: string) => {
    if (selectedApplications.size === 0) return;
    
    const confirmMessage = `Are you sure you want to update ${selectedApplications.size} application(s) to "${status}" status?`;
    if (window.confirm(confirmMessage)) {
      bulkUpdateStatusMutation.mutate({ 
        ids: Array.from(selectedApplications), 
        status 
      });
    }
  };

  const handleBulkUpdatePriority = (priority: ApplicationPriority) => {
    if (selectedApplications.size === 0) return;
    
    const confirmMessage = `Are you sure you want to update ${selectedApplications.size} application(s) to "${priority}" priority?`;
    if (window.confirm(confirmMessage)) {
      bulkUpdatePriorityMutation.mutate({ 
        ids: Array.from(selectedApplications), 
        priority 
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedApplications.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedApplications.size} application(s)? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      bulkDeleteMutation.mutate(Array.from(selectedApplications));
    }
  };

  const handleBulkExport = () => {
    const selectedApps = filteredAndSortedApplications.filter(app => 
      selectedApplications.has(app.id)
    );
    
    const csvData = selectedApps.map(app => ({
      company: app.company_name,
      role: app.job_title,
      status: app.status,
      priority: app.priority,
      dateApplied: app.date_applied,
      email: app.email_used,
      source: app.source,
      notes: app.notes || ''
    }));
    
    const csvContent = [
      ['Company', 'Role', 'Status', 'Priority', 'Date Applied', 'Email', 'Source', 'Notes'],
      ...csvData.map(row => [
        row.company, row.role, row.status, row.priority, 
        row.dateApplied, row.email, row.source, row.notes
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Enhanced export functionality
  const handleEnhancedExport = async () => {
    let dataToExport: Application[] = [];
    
    switch (exportScope) {
      case 'all':
        dataToExport = applications;
        break;
      case 'filtered':
        dataToExport = filteredAndSortedApplications;
        break;
      case 'selected':
        dataToExport = filteredAndSortedApplications.filter(app => selectedApplications.has(app.id));
        break;
    }

    if (dataToExport.length === 0) {
      alert('No data to export. Please select applications or adjust your filters.');
      return;
    }

    const selectedFields = Object.entries(exportColumns)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field);

    if (selectedFields.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    setIsExporting(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (exportFormat === 'csv') {
        exportAsCSV(dataToExport, selectedFields);
      } else {
        exportAsJSON(dataToExport, selectedFields);
      }

      setShowSuccessMessage(`Successfully exported ${dataToExport.length} application(s) as ${exportFormat.toUpperCase()}`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
      setShowExportModal(false);
    } catch (error) {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = (data: Application[], fields: string[]) => {
    const fieldLabels = {
      company: 'Company',
      role: 'Role',
      status: 'Status',
      priority: 'Priority',
      dateApplied: 'Date Applied',
      email: 'Email Used',
      source: 'Source',
      notes: 'Notes',
      jobUrl: 'Job URL',
      resumeFilename: 'Resume File',
    };

    const headers = fields.map(field => fieldLabels[field as keyof typeof fieldLabels]);
    
    const rows = data.map(app => 
      fields.map(field => {
        switch (field) {
          case 'company': return app.company_name;
          case 'role': return app.job_title;
          case 'status': return app.status;
          case 'priority': return app.priority;
          case 'dateApplied': return app.date_applied;
          case 'email': return app.email_used;
          case 'source': return app.source;
          case 'notes': return app.notes || '';
          case 'jobUrl': return app.job_url || '';
          case 'resumeFilename': return app.resume_filename || '';
          default: return '';
        }
      }).map(value => `"${String(value).replace(/"/g, '""')}"`)
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${exportScope}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = (data: Application[], fields: string[]) => {
    const exportData = data.map(app => {
      const filteredApp: any = {};
      fields.forEach(field => {
        switch (field) {
          case 'company': filteredApp.company = app.company_name; break;
          case 'role': filteredApp.role = app.job_title; break;
          case 'status': filteredApp.status = app.status; break;
          case 'priority': filteredApp.priority = app.priority; break;
          case 'dateApplied': filteredApp.dateApplied = app.date_applied; break;
          case 'email': filteredApp.email = app.email_used; break;
          case 'source': filteredApp.source = app.source; break;
          case 'notes': filteredApp.notes = app.notes; break;
          case 'jobUrl': filteredApp.jobUrl = app.job_url; break;
          case 'resumeFilename': filteredApp.resumeFilename = app.resume_filename; break;
        }
      });
      return filteredApp;
    });

    const jsonContent = JSON.stringify({
      exportDate: new Date().toISOString(),
      exportScope,
      totalRecords: exportData.length,
      data: exportData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${exportScope}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Enhanced Export Modal Component
  const ExportModal = () => {
    if (!showExportModal) return null;

    const scopeCounts = {
      all: applications.length,
      filtered: filteredAndSortedApplications.length,
      selected: selectedApplications.size,
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div 
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Export Applications</h3>
            <button
              onClick={() => setShowExportModal(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Export Scope */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                What to export
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={(e) => setExportScope(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">All applications ({scopeCounts.all})</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="filtered"
                    checked={exportScope === 'filtered'}
                    onChange={(e) => setExportScope(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Filtered results ({scopeCounts.filtered})</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="selected"
                    checked={exportScope === 'selected'}
                    onChange={(e) => setExportScope(e.target.value as any)}
                    className="mr-2"
                    disabled={scopeCounts.selected === 0}
                  />
                  <span className={`text-sm ${scopeCounts.selected === 0 ? 'text-neutral-400' : ''}`}>
                    Selected applications ({scopeCounts.selected})
                  </span>
                </label>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">CSV (Excel compatible)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">JSON</span>
                </label>
              </div>
            </div>

            {/* Column Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Columns to include
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {Object.entries(exportColumns).map(([field, checked]) => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setExportColumns(prev => ({
                        ...prev,
                        [field]: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEnhancedExport}
              disabled={isExporting}
              className={`btn-primary ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Helper functions for calendar view
  const getStatusProgression = (status: string) => {
    const statuses = ['applied', 'interview', 'offer'];
    const rejectedStatuses = ['rejected', 'withdrawn'];
    
    if (rejectedStatuses.includes(status)) {
      return { current: status, progress: 0, isComplete: false, isRejected: true };
    }
    
    const currentIndex = statuses.indexOf(status);
    const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / statuses.length) * 100;
    
    return { 
      current: status, 
      progress, 
      isComplete: status === 'offer', 
      isRejected: false 
    };
  };

  // Calendar View Component
  const CalendarView = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [hoveredApp, setHoveredApp] = useState<{ app: Application; position: { x: number; y: number } } | null>(null);
    
    // Get the first day of the current month
    const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    
    // Get the first day of the calendar (might be from previous month)
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
    
    // Get the last day of the calendar (might be from next month)
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()));
    
    // Generate calendar days
    const calendarDays = [];
    const currentDate = new Date(firstDayOfCalendar);
    
    while (currentDate <= lastDayOfCalendar) {
      calendarDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group applications by date
    const applicationsByDate = useMemo(() => {
      const groups: { [key: string]: Application[] } = {};
      
      filteredAndSortedApplications.forEach(app => {
        const date = new Date(app.date_applied).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(app);
      });
      
      return groups;
    }, [filteredAndSortedApplications]);
    
    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(calendarDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      setCalendarDate(newDate);
    };
    
    const goToToday = () => {
      setCalendarDate(new Date());
    };
    
    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };
    
    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === calendarDate.getMonth();
    };
    
    const getDateApplications = (date: Date) => {
      return applicationsByDate[date.toDateString()] || [];
    };

    const handleMouseEnter = (app: Application, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredApp({
        app,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        }
      });
    };

      const handleMouseLeave = () => {
    setHoveredApp(null);
  };

    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              {calendarDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-neutral-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayApplications = getDateApplications(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                                                  <motion.div
                   key={index}
                   className={`relative border-r border-b border-neutral-200 min-h-20 sm:min-h-32 p-1 sm:p-2 cursor-pointer hover:bg-neutral-50 transition-colors overflow-hidden ${
                     !isCurrentMonthDay ? 'bg-neutral-50/50 text-neutral-400' : ''
                   } ${isTodayDate ? 'bg-blue-50' : ''}`}
                   onClick={() => setSelectedDate(selectedDate?.toDateString() === date.toDateString() ? null : date)}
                   whileHover={{ scale: 1.02 }}
                 >
                   <div className="flex items-center justify-between mb-1 sm:mb-2">
                     <span className={`text-xs sm:text-sm font-medium ${
                       isTodayDate ? 'text-blue-600' : 
                       isCurrentMonthDay ? 'text-neutral-900' : 'text-neutral-400'
                     }`}>
                       {date.getDate()}
                     </span>
                     {dayApplications.length > 0 && (
                       <span className="text-xs bg-blue-100 text-blue-600 px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0">
                         {dayApplications.length}
                       </span>
                     )}
                   </div>
                   
                   {/* Applications for this day */}
                   <div className="space-y-1 overflow-hidden">
                     {dayApplications.slice(0, 3).map((app, appIndex) => (
                       <div
                         key={app.id}
                         className={`text-xs px-2 py-1 rounded cursor-pointer hover:scale-105 transition-transform ${getStatusColor(app.status)} border border-opacity-20 overflow-hidden`}
                         onMouseEnter={(e) => handleMouseEnter(app, e)}
                         onMouseLeave={handleMouseLeave}
                       >
                         <div className="font-medium truncate leading-tight">{app.company_name}</div>
                       </div>
                     ))}
                     {dayApplications.length > 3 && (
                       <div className="text-xs text-neutral-500 text-center py-1">
                         +{dayApplications.length - 3} more
                       </div>
                     )}
                   </div>
                 </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
                             {getDateApplications(selectedDate).length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   {getDateApplications(selectedDate).map(app => {
                     const progression = getStatusProgression(app.status);
                     
                     return (
                       <div key={app.id} className="bg-neutral-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-100">
                              <Building className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-neutral-900">{app.company_name}</div>
                              <div className="text-xs text-neutral-600">{app.job_title}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditApplication(app)}
                              className="p-1 text-neutral-400 hover:text-blue-600 rounded transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-500">Status</span>
                            <span className={`text-xs font-medium ${progression.isRejected ? 'text-red-600' : progression.isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                progression.isRejected ? 'bg-red-500' : 
                                progression.isComplete ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progression.isRejected ? 100 : progression.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(app.priority)}`}>
                            {getPriorityIcon(app.priority)}
                            <span>{app.priority}</span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            {app.source}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No applications on this date</p>
                </div>
              )}
            </motion.div>
          )}
                 </AnimatePresence>

         {/* Application Tooltip */}
         <AnimatePresence>
           {hoveredApp && (
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 max-w-sm pointer-events-none"
               style={{
                 left: hoveredApp.position.x,
                 top: hoveredApp.position.y,
                 transform: 'translateX(-50%) translateY(-100%)'
               }}
             >
               <div className="space-y-3">
                 {/* Header */}
                 <div className="flex items-start justify-between">
                   <div>
                     <h4 className="font-semibold text-neutral-900">{hoveredApp.app.company_name}</h4>
                     <p className="text-sm text-neutral-600">{hoveredApp.app.job_title}</p>
                   </div>
                   <div className="p-1.5 rounded-lg bg-blue-50">
                     <Building className="h-4 w-4 text-blue-600" />
                   </div>
                 </div>

                 {/* Status and Priority */}
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-neutral-500">Status:</span>
                     <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(hoveredApp.app.status)}`}>
                       {hoveredApp.app.status.charAt(0).toUpperCase() + hoveredApp.app.status.slice(1)}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-neutral-500">Priority:</span>
                     <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(hoveredApp.app.priority)}`}>
                       {getPriorityIcon(hoveredApp.app.priority)}
                       <span>{hoveredApp.app.priority}</span>
                     </div>
                   </div>
                 </div>

                 {/* Details */}
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-neutral-500">Applied:</span>
                     <span className="text-neutral-900">
                       {new Date(hoveredApp.app.date_applied).toLocaleDateString('en-US', {
                         month: 'short',
                         day: 'numeric',
                         year: 'numeric'
                       })}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-neutral-500">Source:</span>
                     <span className="text-neutral-900 capitalize">{hoveredApp.app.source.replace('_', ' ')}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-neutral-500">Email:</span>
                     <span className="text-neutral-900 truncate ml-2">{hoveredApp.app.email_used}</span>
                   </div>
                 </div>

                 {/* Job URL */}
                 {hoveredApp.app.job_url && (
                   <div className="pt-2 border-t border-neutral-100">
                     <a
                       href={hoveredApp.app.job_url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                     >
                       <ExternalLink className="h-3 w-3" />
                       View Job Posting
                     </a>
                   </div>
                 )}

                 {/* Notes */}
                 {hoveredApp.app.notes && (
                   <div className="pt-2 border-t border-neutral-100">
                     <span className="text-xs text-neutral-500">Notes:</span>
                     <p className="text-sm text-neutral-700 mt-1 line-clamp-3">{hoveredApp.app.notes}</p>
                   </div>
                 )}
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     );
   };

  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 7;
      const halfVisible = Math.floor(maxVisiblePages / 2);

      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      if (currentPage > totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-neutral-300 rounded-md text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-neutral-600">per page</span>
          </div>
          <div className="text-sm text-neutral-600">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedApplications.length)} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedApplications.length)} of{' '}
            {filteredAndSortedApplications.length} results
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 text-sm border rounded-md ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Tab component
  const TabButton = ({ tab, label, count }: { tab: 'stats' | 'applications'; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
        activeTab === tab
          ? 'text-neutral-900 border-neutral-900 bg-neutral-50'
          : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {count !== undefined && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            activeTab === tab 
              ? 'bg-neutral-200 text-neutral-700' 
              : 'bg-neutral-100 text-neutral-500'
          }`}>
            {count}
          </span>
        )}
      </div>
    </button>
  );

  // Sortable header component
  const SortableHeader = ({ field, children, className = 'p-3' }: { field: SortField; children: React.ReactNode; className?: string }) => {
    const isActive = sortConfig.field === field;
    const direction = sortConfig.direction;

    return (
      <th 
        className={`text-left font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors select-none ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2 group">
          {children}
          <div className="flex flex-col">
            {isActive ? (
              direction === 'asc' ? (
                <ArrowUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            )}
          </div>
        </div>
      </th>
    );
  };

  // Stats card component
  const StatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    trend, 
    onClick,
    clickable = false 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
    trend?: string;
    onClick?: () => void;
    clickable?: boolean;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      orange: 'bg-orange-50 border-orange-200 text-orange-600',
      red: 'bg-red-50 border-red-200 text-red-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      gray: 'bg-gray-50 border-gray-200 text-gray-600',
    };

    return (
      <motion.div 
        className={`card p-6 ${clickable ? 'cursor-pointer hover:shadow-md' : ''} transition-all duration-200`}
        onClick={onClick}
        whileHover={clickable ? { scale: 1.02 } : {}}
        whileTap={clickable ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
              </div>
            </div>
            {trend && (
              <p className="text-sm text-neutral-500 mt-2">{trend}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

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
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200';
    case 'interview':
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'offer':
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200';
    case 'rejected':
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200';
    case 'withdrawn':
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200';
    default:
      return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200';
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-32 bg-neutral-100 rounded-lg animate-pulse' />
          ))}
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
      className='space-y-4'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants} className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-4 mb-2'>
              <h1 className='text-2xl font-bold text-neutral-900'>Applications</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <BarChart3 className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Job Applications</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Track and manage your job applications with precision
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
            <motion.button
              className='px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2'
              onClick={handleAddApplication}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className='h-4 w-4' />
              Add Application
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className='flex items-end gap-0 border-b border-neutral-200'>
        <TabButton tab="applications" label="Applications" count={filteredAndSortedApplications.length} />
        <TabButton tab="stats" label="Analytics & Stats" />
      </motion.div>

      {/* Stats Tab Content */}
      {activeTab === 'stats' && (
        <div className='space-y-4'>
          {/* Quick Stats Dashboard */}
          <motion.div variants={itemVariants} className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatsCard
              title="Total Applications"
              value={dashboardStats.total}
              icon={Building}
              color="blue"
              trend={dashboardStats.recentActivity > 0 ? `${dashboardStats.recentActivity} this week` : undefined}
            />
            <StatsCard
              title="Success Rate"
              value={`${dashboardStats.successRate}%`}
              icon={TrendingUp}
              color={dashboardStats.successRate > 20 ? 'green' : dashboardStats.successRate > 10 ? 'orange' : 'red'}
              trend={dashboardStats.successRate > 0 ? `${applications.filter(app => app.status === 'interview' || app.status === 'offer').length} interviews/offers` : undefined}
              onClick={() => handleQuickFilter('successful')}
              clickable={true}
            />
            <StatsCard
              title="Active Applications"
              value={dashboardStats.activeApplications}
              icon={Target}
              color="orange"
              trend="In progress"
              onClick={() => handleQuickFilter('active')}
              clickable={true}
            />
            <StatsCard
              title="This Month"
              value={dashboardStats.thisMonth}
              icon={Calendar}
              color="purple"
              trend="Applications submitted"
            />
          </motion.div>

          {/* Secondary Stats */}
          <motion.div variants={itemVariants} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <StatsCard
              title="High Priority"
              value={dashboardStats.highPriority}
              icon={AlertCircle}
              color="red"
              trend="Applications marked high priority"
              onClick={() => handleQuickFilter('high-priority')}
              clickable={true}
            />
            <StatsCard
              title="Needs Follow-up"
              value={dashboardStats.needsFollowup}
              icon={Users}
              color="gray"
              trend="Applied >14 days ago"
              onClick={() => handleQuickFilter('needs-followup')}
              clickable={true}
            />
            <StatsCard
              title="Recent Activity"
              value={dashboardStats.recentActivity}
              icon={Sparkles}
              color="green"
              trend="Applications in last 7 days"
            />
          </motion.div>

          {/* Source Effectiveness */}
          <motion.div variants={itemVariants} className='bg-white border border-neutral-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='p-1.5 rounded-lg bg-neutral-100'>
                  <TrendingUp className='h-4 w-4 text-neutral-600' />
                </div>
                <div>
                  <h3 className='text-base font-semibold text-neutral-900'>Source Effectiveness</h3>
                  <p className='text-xs text-neutral-600'>How well each application source performs</p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Object.entries(
                applications.reduce((acc, app) => {
                  const source = app.source;
                  if (!acc[source]) {
                    acc[source] = {
                      total: 0,
                      interviews: 0,
                      offers: 0,
                      rejected: 0,
                    };
                  }
                  acc[source].total += 1;
                  if (app.status === 'interview') acc[source].interviews += 1;
                  if (app.status === 'offer') acc[source].offers += 1;
                  if (app.status === 'rejected') acc[source].rejected += 1;
                  return acc;
                }, {} as Record<string, { total: number; interviews: number; offers: number; rejected: number }>)
              )
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([source, stats]) => {
                  const successRate = stats.total > 0 ? Math.round(((stats.interviews + stats.offers) / stats.total) * 100) : 0;
                  const interviewRate = stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0;
                  const offerRate = stats.total > 0 ? Math.round((stats.offers / stats.total) * 100) : 0;
                  
                  const getSourceColor = (rate: number) => {
                    if (rate >= 30) return 'text-green-700 bg-green-50 border-green-200';
                    if (rate >= 15) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
                    if (rate >= 5) return 'text-orange-700 bg-orange-50 border-orange-200';
                    return 'text-red-700 bg-red-50 border-red-200';
                  };

                  const getSourceIcon = (source: string) => {
                    switch (source) {
                      case 'linkedin': return '💼';
                      case 'indeed': return '🔍';
                      case 'company_website': return '🏢';
                      case 'referral': return '👥';
                      case 'glassdoor': return '🌟';
                      default: return '📝';
                    }
                  };

                  return (
                    <motion.div
                      key={source}
                      className='p-4 border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg'>{getSourceIcon(source)}</span>
                          <span className='font-medium text-neutral-900 capitalize'>
                            {source.replace('_', ' ')}
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(successRate)}`}>
                          {successRate}% success
                        </div>
                      </div>
                      
                      <div className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-neutral-600'>Total Applications</span>
                          <span className='font-medium text-neutral-900'>{stats.total}</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-neutral-600'>Interviews</span>
                          <span className='font-medium text-blue-600'>{stats.interviews} ({interviewRate}%)</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-neutral-600'>Offers</span>
                          <span className='font-medium text-green-600'>{stats.offers} ({offerRate}%)</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-neutral-600'>Rejected</span>
                          <span className='font-medium text-red-600'>{stats.rejected}</span>
                        </div>
                      </div>
                      
                      {/* Success Rate Bar */}
                      <div className='mt-3'>
                        <div className='w-full bg-neutral-200 rounded-full h-2'>
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              successRate >= 30 ? 'bg-green-500' : 
                              successRate >= 15 ? 'bg-yellow-500' : 
                              successRate >= 5 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(successRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* Recommendations */}
            {applications.length > 0 && (
              <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='flex items-start gap-3'>
                  <Sparkles className='h-5 w-5 text-blue-600 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-blue-900 mb-1'>💡 Recommendations</h4>
                    <div className='text-sm text-blue-700'>
                      {(() => {
                        const sourceStats = Object.entries(
                          applications.reduce((acc, app) => {
                            const source = app.source;
                            if (!acc[source]) {
                              acc[source] = { total: 0, success: 0 };
                            }
                            acc[source].total += 1;
                            if (app.status === 'interview' || app.status === 'offer') {
                              acc[source].success += 1;
                            }
                            return acc;
                          }, {} as Record<string, { total: number; success: number }>)
                        )
                          .map(([source, stats]) => ({
                            source,
                            rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
                            total: stats.total,
                          }))
                          .sort((a, b) => b.rate - a.rate);

                        const bestSource = sourceStats[0];
                        const worstSource = sourceStats[sourceStats.length - 1];

                        if (bestSource && worstSource && bestSource.rate > worstSource.rate) {
                          return (
                            <div className='space-y-1'>
                              <p>
                                <strong className='capitalize'>{bestSource.source.replace('_', ' ')}</strong> is your most effective source with a {bestSource.rate.toFixed(1)}% success rate.
                              </p>
                              {bestSource.rate > 20 && (
                                <p>Consider focusing more applications through this channel for better results.</p>
                              )}
                              {worstSource.rate < 10 && worstSource.total > 3 && (
                                <p>
                                  <strong className='capitalize'>{worstSource.source.replace('_', ' ')}</strong> has a lower success rate ({worstSource.rate.toFixed(1)}%). 
                                  Consider improving your approach or focusing on other sources.
                                </p>
                              )}
                            </div>
                          );
                        }

                        return <p>Apply to more positions to see effectiveness patterns and recommendations.</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Applications Tab Content */}
      {activeTab === 'applications' && (
        <div className='space-y-4'>
          {/* Filters */}
          <motion.div variants={itemVariants} className='bg-white border border-neutral-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='p-1.5 rounded-lg bg-neutral-100'>
                  <Filter className='h-4 w-4 text-neutral-600' />
                </div>
                <h3 className='text-base font-semibold text-neutral-900'>Filters & Search</h3>
                {getActiveFilterCount() > 0 && (
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-0.5 text-xs font-medium bg-neutral-200 text-neutral-700 rounded-full'>
                      {getActiveFilterCount()} active
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className='text-xs text-neutral-500 hover:text-red-600 transition-colors'
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              {/* View Toggle and Column Selector */}
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-neutral-200 text-neutral-900 border border-neutral-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  title='Table view'
                >
                  <Table className='h-4 w-4' />
                </button>

                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-neutral-200 text-neutral-900 border border-neutral-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  title='Calendar view'
                >
                  <Calendar className='h-4 w-4' />
                </button>
                
                {/* Column Selector - only show in table view */}
                {viewMode === 'table' && (
                  <div className="relative" ref={columnDropdownRef}>
                    <button
                      onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                      className="p-2 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all"
                      title="Select columns"
                    >
                      <Columns className="h-4 w-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showColumnDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 z-10"
                        >
                          <div className="px-3 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-100">
                            Show/Hide Columns
                          </div>
                          {[
                            { key: 'company', label: 'Company' },
                            { key: 'role', label: 'Role' },
                            { key: 'resume', label: 'Resume' },
                            { key: 'appliedWith', label: 'Applied With' },
                            { key: 'status', label: 'Status' },
                            { key: 'priority', label: 'Priority' },
                            { key: 'notes', label: 'Notes' },
                            { key: 'referralContact', label: 'Referral Contact' },
                            { key: 'action', label: 'Actions' },
                          ].map((column) => (
                            <button
                              key={column.key}
                              onClick={() => toggleColumn(column.key)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50 transition-colors"
                            >
                              <span className="text-neutral-700">{column.label}</span>
                              {visibleColumns[column.key as keyof typeof visibleColumns] && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Search and Filters Row */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4'>
              {/* Search */}
              <div className='relative lg:col-span-4'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                <input
                  type='text'
                  placeholder='Search companies, positions, notes...'
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                />
              </div>
              
              {/* Filter Dropdowns */}
              <div className='lg:col-span-2'>
                <select
                  value={statusFilter}
                  onChange={e => handleStatusFilterChange(e.target.value)}
                  className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                >
                  <option value=''>All Statuses</option>
                  <option value='applied'>Applied</option>
                  <option value='interview'>Interview</option>
                  <option value='offer'>Offer</option>
                  <option value='rejected'>Rejected</option>
                  <option value='withdrawn'>Withdrawn</option>
                </select>
              </div>
              
              <div className='lg:col-span-2'>
                <select
                  value={priorityFilter}
                  onChange={e => handlePriorityFilterChange(e.target.value)}
                  className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                >
                  <option value=''>All Priorities</option>
                  <option value={ApplicationPriority.HIGH}>High</option>
                  <option value={ApplicationPriority.MEDIUM}>Medium</option>
                  <option value={ApplicationPriority.LOW}>Low</option>
                </select>
              </div>
              
              <div className='lg:col-span-2'>
                <select
                  value={sourceFilter}
                  onChange={e => handleSourceFilterChange(e.target.value)}
                  className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                >
                  <option value=''>All Sources</option>
                  <option value='linkedin'>LinkedIn</option>
                  <option value='indeed'>Indeed</option>
                  <option value='company_website'>Company Website</option>
                  <option value='referral'>Referral</option>
                  <option value='other'>Other</option>
                </select>
              </div>
              
              {/* Results Count */}
              <div className='lg:col-span-2'>
                <div className='flex items-center justify-center h-full px-4 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200'>
                  <span className='text-sm font-medium text-neutral-700'>
                    {filteredAndSortedApplications.length} results
                  </span>
                  <BarChart3 className='h-4 w-4 text-neutral-500 ml-2' />
                </div>
              </div>
            </div>

            {/* Date Range and Sort Controls Row */}
            <div className='flex items-center justify-between'>
              {/* Date Range Controls */}
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                  <select
                    value={dateRange}
                    onChange={e => handleDateRangeChange(e.target.value)}
                    className='pl-10 pr-8 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                  >
                    <option value=''>All Time</option>
                    <option value='today'>Today</option>
                    <option value='week'>Last 7 days</option>
                    <option value='month'>This month</option>
                    <option value='quarter'>This quarter</option>
                    <option value='year'>This year</option>
                    <option value='last-30'>Last 30 days</option>
                    <option value='last-90'>Last 90 days</option>
                    <option value='custom'>Custom range</option>
                  </select>
                </div>
                
                {/* Custom date picker */}
                <AnimatePresence>
                  {showCustomDatePicker && (
                    <>
                      <motion.input
                        type='date'
                        value={customDateFrom}
                        onChange={e => setCustomDateFrom(e.target.value)}
                        className='py-2 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                        placeholder='From date'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      />
                      <motion.input
                        type='date'
                        value={customDateTo}
                        onChange={e => setCustomDateTo(e.target.value)}
                        className='py-2 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                        placeholder='To date'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      />
                    </>
                  )}
                </AnimatePresence>
                
                {/* Date range display */}
                {getDateRangeDisplayText() && (
                  <div className='flex items-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg'>
                    <CalendarDays className='h-4 w-4 text-neutral-600' />
                    <span className='text-sm font-medium text-neutral-700'>
                      {getDateRangeDisplayText()}
                    </span>
                    <button
                      onClick={() => {
                        setDateRange('');
                        setCustomDateFrom('');
                        setCustomDateTo('');
                        setShowCustomDatePicker(false);
                      }}
                      className='text-neutral-600 hover:text-neutral-800 transition-colors'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>

              {/* Sort Controls */}
              <div className='flex items-center gap-2'>
                <span className='text-sm text-neutral-600 mr-2'>Sort by:</span>
                <div className='flex gap-1'>
                  <button
                    onClick={() => handleSort('relevance')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      sortConfig.field === 'relevance'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Zap className='h-4 w-4 inline mr-1' />
                    Relevance
                  </button>
                  <button
                    onClick={() => handleSort('date_applied')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      sortConfig.field === 'date_applied'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Calendar className='h-4 w-4 inline mr-1' />
                    Date
                  </button>
                  <button
                    onClick={() => handleSort('priority')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      sortConfig.field === 'priority'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Target className='h-4 w-4 inline mr-1' />
                    Priority
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Applications Content */}
          <motion.div variants={itemVariants} className='bg-white border border-neutral-200 rounded-lg p-4'>
            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedApplications.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-lg'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-neutral-700'>
                      {selectedApplications.size} application{selectedApplications.size > 1 ? 's' : ''} selected
                    </span>
                    <div className='flex items-center gap-2'>
                      <select
                        onChange={e => handleBulkUpdateStatus(e.target.value)}
                        className='px-2 py-1 text-sm border border-neutral-300 rounded-md bg-white'
                        defaultValue=''
                      >
                        <option value=''>Update Status</option>
                        <option value='interview'>Interview</option>
                        <option value='offer'>Offer</option>
                        <option value='rejected'>Rejected</option>
                      </select>
                      <select
                        onChange={e => handleBulkUpdatePriority(e.target.value as ApplicationPriority)}
                        className='px-2 py-1 text-sm border border-neutral-300 rounded-md bg-white'
                        defaultValue=''
                      >
                        <option value=''>Update Priority</option>
                        <option value={ApplicationPriority.HIGH}>High</option>
                        <option value={ApplicationPriority.MEDIUM}>Medium</option>
                        <option value={ApplicationPriority.LOW}>Low</option>
                      </select>
                      <button
                        onClick={handleBulkExport}
                        className='px-2 py-1 text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors'
                      >
                        Export
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className='px-2 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className='overflow-x-auto'>
                <div className='inline-block min-w-full align-middle'>
                  <table className='min-w-full divide-y divide-neutral-200'>
                    <thead className='bg-neutral-50'>
                      <tr>
                        <th className='text-left p-3 font-semibold text-neutral-900'>
                          <button
                            onClick={handleSelectAll}
                            className='p-1 rounded hover:bg-neutral-200 transition-colors'
                            title={selectedApplications.size === filteredAndSortedApplications.length ? 'Deselect all' : 'Select all'}
                          >
                            {selectedApplications.size === filteredAndSortedApplications.length ? (
                              <CheckSquare className='h-4 w-4 text-blue-600' />
                            ) : selectedApplications.size > 0 ? (
                              <Minus className='h-4 w-4 text-blue-600' />
                            ) : (
                              <Square className='h-4 w-4 text-neutral-400' />
                            )}
                          </button>
                        </th>
                        {visibleColumns.company && <SortableHeader field='company_name'>Company</SortableHeader>}
                        {visibleColumns.role && <SortableHeader field='job_title'>Role</SortableHeader>}
                        {visibleColumns.resume && <th className='text-left p-3 font-semibold text-neutral-900'>Resume</th>}
                        {visibleColumns.appliedWith && <SortableHeader field='email_used'>Applied With</SortableHeader>}
                        {visibleColumns.status && <SortableHeader field='status'>Status</SortableHeader>}
                        {visibleColumns.priority && <SortableHeader field='priority'>Priority</SortableHeader>}
                        {visibleColumns.notes && <th className='text-left p-3 font-semibold text-neutral-900'>Notes</th>}
                        {visibleColumns.referralContact && <th className='text-left p-3 font-semibold text-neutral-900'>Referral Contact</th>}
                        {visibleColumns.action && <th className='text-left p-3 font-semibold text-neutral-900'>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {paginatedApplications.map((application, index) => (
                          <motion.tr
                            key={application.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                              selectedApplications.has(application.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className='p-3'>
                              <button
                                onClick={() => handleSelectApplication(application.id)}
                                className='p-1 rounded hover:bg-neutral-200 transition-colors'
                                title={selectedApplications.has(application.id) ? 'Deselect' : 'Select'}
                              >
                                {selectedApplications.has(application.id) ? (
                                  <CheckSquare className='h-4 w-4 text-blue-600' />
                                ) : (
                                  <Square className='h-4 w-4 text-neutral-400 hover:text-blue-600' />
                                )}
                              </button>
                            </td>
                            
                            {/* Company */}
                            {visibleColumns.company && (
                              <td className='p-3'>
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
                            )}

                            {/* Role */}
                            {visibleColumns.role && (
                              <td className='p-3'>
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
                            )}

                            {/* Resume */}
                            {visibleColumns.resume && (
                              <td className='p-3'>
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
                            )}

                            {/* Applied With */}
                            {visibleColumns.appliedWith && (
                              <td className='p-3'>
                                <div className='flex items-center gap-2'>
                                  <Mail className='h-4 w-4 text-neutral-500' />
                                  <span className='text-sm text-neutral-700'>
                                    {application.email_used}
                                  </span>
                                </div>
                              </td>
                            )}

                            {/* Status */}
                            {visibleColumns.status && (
                              <td className='p-3'>
                                <span className={getStatusColor(application.status)}>
                                  {application.status.charAt(0).toUpperCase() +
                                    application.status.slice(1)}
                                </span>
                              </td>
                            )}

                            {/* Priority */}
                            {visibleColumns.priority && (
                              <td className='p-3'>
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
                            )}

                            {/* Notes */}
                            {visibleColumns.notes && (
                              <td className='p-3'>
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
                            )}

                            {/* Referral Contact */}
                            {visibleColumns.referralContact && (
                              <td className='p-3'>
                                <div className='flex items-center gap-2 text-sm text-neutral-400'>
                                  <User className='h-4 w-4' />
                                  <span>-</span>
                                </div>
                              </td>
                            )}

                            {/* Actions */}
                            {visibleColumns.action && (
                              <td className='p-3'>
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
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            
            {/* Calendar View */}
            {viewMode === 'calendar' && <CalendarView />}
            
            {/* Pagination */}
            {viewMode !== 'calendar' && <PaginationComponent />}
          </motion.div>
        </div>
      )}

      {/* Application Form Modal */}
      <ApplicationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApplication(null);
        }}
        editingApplication={editingApplication}
      />

      {/* Enhanced Export Modal */}
      <ExportModal />

      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{showSuccessMessage}</span>
            <button
              onClick={() => setShowSuccessMessage('')}
              className="ml-2 text-green-100 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
