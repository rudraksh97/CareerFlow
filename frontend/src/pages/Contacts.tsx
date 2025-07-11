import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Linkedin, 
  Edit, 
  Trash2, 
  Users, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Square,
  CheckSquare,
  Check,
  Download,
  BarChart3,
  Calendar,
  Target,
  Building,
  ChevronLeft,
  ChevronRight,
  Columns,
  Table,
  Grid3X3,
  X,
  CheckCircle,
  RotateCw
} from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import ContactForm from '@/components/ContactForm';
import { api } from '@/services/api';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  role?: string;
  linkedin_url?: string;
  contact_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'company' | 'contact_type' | 'created_at' | 'email' | 'role' | 'relevance';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function Contacts() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  
  // Enhanced sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created_at', direction: 'desc' });
  
  // Date range filtering state
  const [dateRange, setDateRange] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Bulk actions state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  
  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Enhanced export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>('filtered');
  const [exportColumns, setExportColumns] = useState({
    name: true,
    email: true,
    company: true,
    role: true,
    contactType: true,
    linkedinUrl: false,
    notes: true,
    createdAt: false,
  });
  
  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'stats' | 'contacts'>('contacts');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    company: true,
    role: true,
    contactType: true,
    linkedin: true,
    notes: true,
    action: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts/').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Bulk operations mutations
  const bulkUpdateContactTypeMutation = useMutation({
    mutationFn: async ({ ids, contactType }: { ids: string[]; contactType: string }) => {
      const promises = ids.map(id => 
        api.put(`/contacts/${id}/`, { contact_type: contactType })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContacts(new Set());
      setShowSuccessMessage(`Successfully updated ${variables.ids.length} contact(s) to "${variables.contactType}" type`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => api.delete(`/contacts/${id}/`));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContacts(new Set());
      setShowSuccessMessage(`Successfully deleted ${ids.length} contact(s)`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalContacts = contacts.length;
    
    if (totalContacts === 0) {
      return {
        total: 0,
        byType: {} as Record<string, number>,
        topCompanies: [] as Array<{ company: string; count: number }>,
        recentContacts: 0,
        withLinkedIn: 0,
      };
    }

    // Contacts by type
    const byType = contacts.reduce((acc, contact) => {
      acc[contact.contact_type] = (acc[contact.contact_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top companies (top 5)
    const companyCount = contacts.reduce((acc, contact) => {
      acc[contact.company] = (acc[contact.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCompanies = Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    // Recent contacts (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentContacts = contacts.filter(contact => 
      new Date(contact.created_at) >= lastWeek
    ).length;

    // Contacts with LinkedIn
    const withLinkedIn = contacts.filter(contact => 
      contact.linkedin_url && contact.linkedin_url.trim() !== ''
    ).length;

    return {
      total: totalContacts,
      byType,
      topCompanies,
      recentContacts,
      withLinkedIn,
    };
  }, [contacts]);

  const companyOptions = useMemo(() => {
    if (!contacts) return [];
    const companies = contacts.map((c: Contact) => c.company) as string[];
    return [...new Set(companies)].sort();
  }, [contacts]);

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
  const filteredAndSortedContacts = useMemo(() => {
    // First, filter the contacts
    let filtered = contacts.filter(contact => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.role && contact.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = !contactTypeFilter || contact.contact_type === contactTypeFilter;
      const matchesCompany = !companyFilter || contact.company === companyFilter;

      // Date range filtering
      const dateRangeFilter = getDateRangeFilter();
      let matchesDateRange = true;
      if (dateRangeFilter) {
        const contactDate = new Date(contact.created_at);
        const { startDate, endDate } = dateRangeFilter;
        
        if (startDate && contactDate < startDate) {
          matchesDateRange = false;
        }
        if (endDate && contactDate > endDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesType && matchesCompany && matchesDateRange;
    });

    // Then, sort the filtered contacts
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = (a.role || '').toLowerCase();
          bValue = (b.role || '').toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'contact_type':
          // Custom contact type priority: referral > hiring_manager > recruiter > other
          const typePriority = {
            referral: 4,
            hiring_manager: 3,
            recruiter: 2,
            other: 1,
          };
          aValue = typePriority[a.contact_type as keyof typeof typePriority] || 0;
          bValue = typePriority[b.contact_type as keyof typeof typePriority] || 0;
          break;
        case 'relevance':
          // Smart relevance scoring based on contact type, LinkedIn presence, and recency
          const getTypeScore = (type: string) => {
            switch (type) {
              case 'referral': return 10;
              case 'hiring_manager': return 8;
              case 'recruiter': return 6;
              case 'other': return 4;
              default: return 0;
            }
          };
          
          const getLinkedInScore = (linkedinUrl?: string) => {
            return linkedinUrl && linkedinUrl.trim() !== '' ? 5 : 0;
          };
          
          const getRecencyScore = (createdAt: string) => {
            const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
            return Math.max(0, 30 - daysSince); // Higher score for more recent contacts
          };
          
          aValue = getTypeScore(a.contact_type) + getLinkedInScore(a.linkedin_url) + getRecencyScore(a.created_at);
          bValue = getTypeScore(b.contact_type) + getLinkedInScore(b.linkedin_url) + getRecencyScore(b.created_at);
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
  }, [contacts, searchTerm, contactTypeFilter, companyFilter, sortConfig, dateRange, customDateFrom, customDateTo]);

  // Pagination logic
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedContacts.slice(startIndex, endIndex);
  }, [filteredAndSortedContacts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage);

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
    ];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
    case 'referral':
      return 'bg-blue-100 text-blue-800';
    case 'recruiter':
      return 'bg-green-100 text-green-800';
    case 'hiring_manager':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
    }
  };



  const handleAddContact = useCallback(() => {
    setEditingContact(null);
    setIsFormOpen(true);
  }, []);

  const handleEditContact = useCallback((contact: any) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  }, []);

  const handleDeleteContact = useCallback(
    (contactId: string) => {
      if (window.confirm('Are you sure you want to delete this contact?')) {
        deleteContactMutation.mutate(contactId);
      }
    },
    [deleteContactMutation],
  );

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
    setContactTypeFilter('');
    setCompanyFilter('');
    resetPagination();
    
    switch (filterType) {
      case 'referrals':
        setContactTypeFilter('referral');
        break;
      case 'recruiters':
        setContactTypeFilter('recruiter');
        break;
      case 'hiring-managers':
        setContactTypeFilter('hiring_manager');
        break;
      case 'with-linkedin':
        // This would need custom filtering logic
        break;
    }
    
    // Switch to contacts tab when filtering
    setActiveTab('contacts');
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
    setContactTypeFilter('');
    setCompanyFilter('');
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

  const handleContactTypeFilterChange = (value: string) => {
    setContactTypeFilter(value);
    resetPagination();
  };

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value);
    resetPagination();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (contactTypeFilter) count++;
    if (companyFilter) count++;
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
    if (selectedContacts.size === filteredAndSortedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      const allIds = new Set(filteredAndSortedContacts.map(contact => contact.id));
      setSelectedContacts(allIds);
    }
  };

  const handleSelectContact = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  const handleBulkUpdateContactType = (contactType: string) => {
    if (selectedContacts.size === 0) return;
    
    const confirmMessage = `Are you sure you want to update ${selectedContacts.size} contact(s) to "${contactType}" type?`;
    if (window.confirm(confirmMessage)) {
      bulkUpdateContactTypeMutation.mutate({ 
        ids: Array.from(selectedContacts), 
        contactType 
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedContacts.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedContacts.size} contact(s)? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      bulkDeleteMutation.mutate(Array.from(selectedContacts));
    }
  };

  // Export functionality
  const handleEnhancedExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      let dataToExport: Contact[] = [];
      
      switch (exportScope) {
        case 'all':
          dataToExport = contacts;
          break;
        case 'filtered':
          dataToExport = filteredAndSortedContacts;
          break;
        case 'selected':
          dataToExport = contacts.filter(contact => selectedContacts.has(contact.id));
          break;
      }
      
      // Build the fields array based on selected columns
      const fields = Object.entries(exportColumns)
        .filter(([_, include]) => include)
        .map(([field, _]) => field);
      
      if (exportFormat === 'csv') {
        exportAsCSV(dataToExport, fields);
      } else {
        exportAsJSON(dataToExport, fields);
      }
      
      setShowExportModal(false);
      setShowSuccessMessage(`Successfully exported ${dataToExport.length} contact(s) as ${exportFormat.toUpperCase()}`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = (data: Contact[], fields: string[]) => {
    const fieldMapping: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      company: 'Company',
      role: 'Role',
      contactType: 'Contact Type',
      linkedinUrl: 'LinkedIn URL',
      notes: 'Notes',
      createdAt: 'Created Date',
    };
    
    const headers = fields.map(field => fieldMapping[field] || field);
    
    const csvData = data.map(contact => {
      return fields.map(field => {
        switch (field) {
          case 'name': return contact.name;
          case 'email': return contact.email;
          case 'company': return contact.company;
          case 'role': return contact.role || '';
          case 'contactType': return contact.contact_type.replace(/_/g, ' ');
          case 'linkedinUrl': return contact.linkedin_url || '';
          case 'notes': return contact.notes || '';
          case 'createdAt': return new Date(contact.created_at).toLocaleDateString();
          default: return '';
        }
      });
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsJSON = (data: Contact[], fields: string[]) => {
    const exportData = data.map(contact => {
      const exportContact: any = {};
      
      fields.forEach(field => {
        switch (field) {
          case 'name': exportContact.name = contact.name; break;
          case 'email': exportContact.email = contact.email; break;
          case 'company': exportContact.company = contact.company; break;
          case 'role': exportContact.role = contact.role; break;
          case 'contactType': exportContact.contactType = contact.contact_type; break;
          case 'linkedinUrl': exportContact.linkedinUrl = contact.linkedin_url; break;
          case 'notes': exportContact.notes = contact.notes; break;
          case 'createdAt': exportContact.createdAt = contact.created_at; break;
        }
      });
      
      return exportContact;
    });
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Modal Component
  const ExportModal = () => {
    if (!showExportModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Export Contacts</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      exportFormat === 'csv'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      exportFormat === 'json'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Export Scope */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Data to Export</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setExportScope('filtered')}
                    className={`w-full p-3 text-sm text-left rounded-lg border transition-colors ${
                      exportScope === 'filtered'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium">Filtered Results ({filteredAndSortedContacts.length})</div>
                    <div className="text-xs opacity-75">Export contacts matching current filters</div>
                  </button>
                  <button
                    onClick={() => setExportScope('selected')}
                    disabled={selectedContacts.size === 0}
                    className={`w-full p-3 text-sm text-left rounded-lg border transition-colors ${
                      exportScope === 'selected'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : selectedContacts.size === 0
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium">Selected Contacts ({selectedContacts.size})</div>
                    <div className="text-xs opacity-75">Export only selected contacts</div>
                  </button>
                  <button
                    onClick={() => setExportScope('all')}
                    className={`w-full p-3 text-sm text-left rounded-lg border transition-colors ${
                      exportScope === 'all'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium">All Contacts ({contacts.length})</div>
                    <div className="text-xs opacity-75">Export all contacts regardless of filters</div>
                  </button>
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Fields to Include</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-neutral-200 rounded-lg p-3">
                  {Object.entries(exportColumns).map(([key, checked]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setExportColumns(prev => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-neutral-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnhancedExport}
                disabled={isExporting || Object.values(exportColumns).every(v => !v)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isExporting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
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

  // Helper components
  const TabButton = ({ tab, label, count }: { tab: 'stats' | 'contacts'; label: string; count?: number }) => (
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

  const SortableHeader = ({ field, children, className = 'p-3' }: { field: SortField; children: React.ReactNode; className?: string }) => {
    const isActive = sortConfig.field === field;
    const direction = sortConfig.direction;

    return (
      <th className={`text-left font-semibold text-neutral-900 ${className}`}>
        <button
          onClick={() => handleSort(field)}
          className="flex items-center gap-2 hover:text-neutral-700 transition-colors group w-full text-left"
        >
          {children}
          <div className="flex flex-col">
            {isActive ? (
              direction === 'asc' ? (
                <ArrowUp className="h-3 w-3 text-neutral-900" />
              ) : (
                <ArrowDown className="h-3 w-3 text-neutral-900" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600" />
            )}
          </div>
        </button>
      </th>
    );
  };

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
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      gray: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    };

    const cardClass = `
      p-6 rounded-lg border-2 transition-all duration-200
      ${colorClasses[color]}
      ${clickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
    `;

    const CardContent = () => (
      <>
        <div className="flex items-center justify-between mb-3">
          <Icon className="h-6 w-6" />
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          {trend && (
            <div className="text-xs opacity-75 mt-1">{trend}</div>
          )}
        </div>
      </>
    );

    if (clickable && onClick) {
      return (
        <motion.button
          onClick={onClick}
          className={cardClass}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CardContent />
        </motion.button>
      );
    }

    return (
      <div className={cardClass}>
        <CardContent />
      </div>
    );
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
              <h1 className='text-2xl font-bold text-neutral-900'>Contacts</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <Users className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Professional Network</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Manage your professional contacts and network connections
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
              onClick={handleAddContact}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className='h-4 w-4' />
              Add Contact
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className='flex items-end gap-0 border-b border-neutral-200'>
        <TabButton tab="contacts" label="Contacts" count={filteredAndSortedContacts.length} />
        <TabButton tab="stats" label="Analytics & Stats" />
      </motion.div>

      {/* Stats Tab Content */}
      {activeTab === 'stats' && (
        <div className='space-y-4'>
          {/* Quick Stats Dashboard */}
          <motion.div variants={itemVariants} className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatsCard
              title="Total Contacts"
              value={dashboardStats.total}
              icon={Users}
              color="blue"
              trend={dashboardStats.recentContacts > 0 ? `${dashboardStats.recentContacts} this week` : undefined}
            />
            <StatsCard
              title="Referrals"
              value={dashboardStats.byType.referral || 0}
              icon={Target}
              color="green"
              trend="Primary contacts"
              onClick={() => handleQuickFilter('referrals')}
              clickable={true}
            />
            <StatsCard
              title="With LinkedIn"
              value={dashboardStats.withLinkedIn}
              icon={Linkedin}
              color="purple"
              trend={`${Math.round((dashboardStats.withLinkedIn / Math.max(dashboardStats.total, 1)) * 100)}% connected`}
            />
            <StatsCard
              title="Recent Additions"
              value={dashboardStats.recentContacts}
              icon={Calendar}
              color="orange"
              trend="Last 7 days"
            />
          </motion.div>

          {/* Contact Type Distribution */}
          <motion.div variants={itemVariants} className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white border border-neutral-200 rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 rounded-lg bg-blue-100'>
                  <BarChart3 className='h-5 w-5 text-blue-600' />
                </div>
                <h3 className='text-lg font-semibold text-neutral-900'>Contact Types</h3>
              </div>
              <div className='space-y-4'>
                {Object.entries(dashboardStats.byType).map(([type, count]) => {
                  const percentage = Math.round((count / Math.max(dashboardStats.total, 1)) * 100);
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'referral': return 'bg-green-500';
                      case 'recruiter': return 'bg-blue-500';
                      case 'hiring_manager': return 'bg-purple-500';
                      default: return 'bg-neutral-400';
                    }
                  };
                  
                  return (
                    <div key={type} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`} />
                        <span className='text-sm font-medium text-neutral-700 capitalize'>
                          {type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='w-24 bg-neutral-200 rounded-full h-2'>
                          <div 
                            className={`h-2 rounded-full ${getTypeColor(type)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className='text-sm font-bold text-neutral-900 w-12 text-right'>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Companies */}
            <div className='bg-white border border-neutral-200 rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 rounded-lg bg-orange-100'>
                  <Building className='h-5 w-5 text-orange-600' />
                </div>
                <h3 className='text-lg font-semibold text-neutral-900'>Top Companies</h3>
              </div>
              <div className='space-y-3'>
                {dashboardStats.topCompanies.length > 0 ? (
                  dashboardStats.topCompanies.map((company, index) => (
                    <div key={company.company} className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600'>
                          {index + 1}
                        </div>
                        <span className='font-medium text-neutral-900'>{company.company}</span>
                      </div>
                      <span className='text-sm font-bold text-neutral-700'>{company.count} contact{company.count > 1 ? 's' : ''}</span>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-8 text-neutral-500'>
                    <Building className='h-8 w-8 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>No companies yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className='space-y-4'>
                     {/* Enhanced Filters */}
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
               <div className='flex items-center gap-2'>
                 <div className='flex bg-neutral-100 rounded-lg p-1'>
                   <button
                     onClick={() => setViewMode('table')}
                     className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                       viewMode === 'table' 
                         ? 'bg-white text-neutral-900 shadow-sm' 
                         : 'text-neutral-600 hover:text-neutral-900'
                     }`}
                   >
                     <Table className='h-4 w-4' />
                   </button>
                   <button
                     onClick={() => setViewMode('cards')}
                     className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                       viewMode === 'cards' 
                         ? 'bg-white text-neutral-900 shadow-sm' 
                         : 'text-neutral-600 hover:text-neutral-900'
                     }`}
                   >
                     <Grid3X3 className='h-4 w-4' />
                   </button>
                 </div>
                 
                 {viewMode === 'table' && (
                   <div className='relative' ref={columnDropdownRef}>
                     <button
                       onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                       className='px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg transition-colors flex items-center gap-2'
                     >
                       <Columns className='h-4 w-4' />
                       Columns
                     </button>
                     {showColumnDropdown && (
                       <div className='absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 p-2'>
                         {Object.entries(visibleColumns).map(([key, visible]) => (
                           <button
                             key={key}
                             onClick={() => toggleColumn(key)}
                             className='w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50 rounded-md'
                           >
                             <span className='capitalize'>{key.replace(/([A-Z])/g, ' $1')}</span>
                             {visible ? (
                               <Check className='h-4 w-4 text-green-600' />
                             ) : (
                               <div className='h-4 w-4' />
                             )}
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
             
             <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4'>
               {/* Search */}
               <div className='relative lg:col-span-4'>
                 <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                 <input
                   type='text'
                   placeholder='Search name, company, email, role...'
                   value={searchTerm}
                   onChange={e => handleSearchChange(e.target.value)}
                   className='w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                 />
               </div>
               
               {/* Filter Dropdowns */}
               <div className='lg:col-span-2'>
                 <select
                   value={contactTypeFilter}
                   onChange={e => handleContactTypeFilterChange(e.target.value)}
                   className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                 >
                   <option value=''>All Types</option>
                   <option value='referral'>Referral</option>
                   <option value='recruiter'>Recruiter</option>
                   <option value='hiring_manager'>Hiring Manager</option>
                   <option value='other'>Other</option>
                 </select>
               </div>
               
               <div className='lg:col-span-2'>
                 <select
                   value={companyFilter}
                   onChange={e => handleCompanyFilterChange(e.target.value)}
                   className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                 >
                   <option value=''>All Companies</option>
                   {companyOptions.map((company: string) => (
                     <option key={company} value={company}>
                       {company}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* Date Range Filter */}
               <div className='lg:col-span-2'>
                 <select
                   value={dateRange}
                   onChange={e => handleDateRangeChange(e.target.value)}
                   className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
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
               
               {/* Sort Options */}
               <div className='lg:col-span-2'>
                 <select
                   value={`${sortConfig.field}-${sortConfig.direction}`}
                   onChange={e => {
                     const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                     setSortConfig({ field, direction });
                   }}
                   className='w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                 >
                   <option value='created_at-desc'>Newest first</option>
                   <option value='created_at-asc'>Oldest first</option>
                   <option value='name-asc'>Name A-Z</option>
                   <option value='name-desc'>Name Z-A</option>
                   <option value='company-asc'>Company A-Z</option>
                   <option value='company-desc'>Company Z-A</option>
                   <option value='contact_type-desc'>Type priority</option>
                   <option value='relevance-desc'>Most relevant</option>
                 </select>
               </div>
             </div>
             
             {/* Custom Date Range Picker */}
             {showCustomDatePicker && (
               <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-neutral-50 rounded-lg border'>
                 <div>
                   <label className='block text-sm font-medium text-neutral-700 mb-1'>From Date</label>
                   <input
                     type='date'
                     value={customDateFrom}
                     onChange={e => setCustomDateFrom(e.target.value)}
                     className='w-full py-2 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                   />
                 </div>
                 <div>
                   <label className='block text-sm font-medium text-neutral-700 mb-1'>To Date</label>
                   <input
                     type='date'
                     value={customDateTo}
                     onChange={e => setCustomDateTo(e.target.value)}
                     className='w-full py-2 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent'
                   />
                 </div>
               </div>
             )}
             
             {/* Active Filters Display */}
             {(getActiveFilterCount() > 0 || getDateRangeDisplayText()) && (
               <div className='flex flex-wrap items-center gap-2 mb-4'>
                 <span className='text-sm font-medium text-neutral-600'>Active filters:</span>
                 {searchTerm && (
                   <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
                     Search: "{searchTerm}"
                   </span>
                 )}
                 {contactTypeFilter && (
                   <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                     Type: {contactTypeFilter.replace(/_/g, ' ')}
                   </span>
                 )}
                 {companyFilter && (
                   <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
                     Company: {companyFilter}
                   </span>
                 )}
                 {getDateRangeDisplayText() && (
                   <span className='px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full'>
                     Date: {getDateRangeDisplayText()}
                   </span>
                 )}
               </div>
             )}
             
             {/* Results Summary */}
             <div className='flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200'>
               <span className='text-sm font-medium text-neutral-700'>
                 {filteredAndSortedContacts.length} contact{filteredAndSortedContacts.length !== 1 ? 's' : ''} found
                 {filteredAndSortedContacts.length !== contacts.length && (
                   <span className='text-neutral-500'> (filtered from {contacts.length} total)</span>
                 )}
               </span>
               <div className='flex items-center gap-2'>
                 <Users className='h-4 w-4 text-neutral-500' />
                 {selectedContacts.size > 0 && (
                   <span className='text-xs text-blue-600 font-medium'>
                     {selectedContacts.size} selected
                   </span>
                 )}
               </div>
                           </div>
            </motion.div>

            {/* Enhanced Contacts Table */}
            <motion.div variants={itemVariants} className='bg-white border border-neutral-200 rounded-lg p-4'>
              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedContacts.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className='mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-lg'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-neutral-700'>
                        {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
                      </span>
                      <div className='flex items-center gap-2'>
                        <select
                          onChange={e => handleBulkUpdateContactType(e.target.value)}
                          className='px-2 py-1 text-sm border border-neutral-300 rounded-md bg-white'
                          defaultValue=''
                        >
                          <option value=''>Update Type</option>
                          <option value='referral'>Referral</option>
                          <option value='recruiter'>Recruiter</option>
                          <option value='hiring_manager'>Hiring Manager</option>
                          <option value='other'>Other</option>
                        </select>
                        <button
                          onClick={handleBulkDelete}
                          className='px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-md transition-colors'
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                              title={selectedContacts.size === filteredAndSortedContacts.length ? 'Deselect all' : 'Select all'}
                            >
                              {selectedContacts.size === filteredAndSortedContacts.length ? (
                                <CheckSquare className='h-4 w-4 text-blue-600' />
                              ) : selectedContacts.size > 0 ? (
                                <Minus className='h-4 w-4 text-blue-600' />
                              ) : (
                                <Square className='h-4 w-4 text-neutral-400' />
                              )}
                            </button>
                          </th>
                          {visibleColumns.name && <SortableHeader field='name'>Contact</SortableHeader>}
                          {visibleColumns.company && <SortableHeader field='company'>Company</SortableHeader>}
                          {visibleColumns.role && <SortableHeader field='role'>Role</SortableHeader>}
                          {visibleColumns.contactType && <SortableHeader field='contact_type'>Type</SortableHeader>}
                          {visibleColumns.linkedin && <th className='text-left p-3 font-semibold text-neutral-900'>LinkedIn</th>}
                          {visibleColumns.notes && <th className='text-left p-3 font-semibold text-neutral-900'>Notes</th>}
                          {visibleColumns.action && <th className='text-right p-3 font-semibold text-neutral-900'>Actions</th>}
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-neutral-200'>
                        <AnimatePresence>
                          {paginatedContacts.map((contact) => (
                            <motion.tr
                              key={contact.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className='group hover:bg-neutral-50 transition-colors'
                            >
                              <td className='p-3'>
                                <button
                                  onClick={() => handleSelectContact(contact.id)}
                                  className='p-1 rounded hover:bg-neutral-200 transition-colors'
                                >
                                  {selectedContacts.has(contact.id) ? (
                                    <CheckSquare className='h-4 w-4 text-blue-600' />
                                  ) : (
                                    <Square className='h-4 w-4 text-neutral-400' />
                                  )}
                                </button>
                              </td>
                              {visibleColumns.name && (
                                <td className='p-3'>
                                  <div className='flex items-center gap-3'>
                                    <div
                                      className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm ${getAvatarColor(contact.name)}`}
                                    >
                                      {contact.name
                                        .split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                      <div className='font-semibold text-neutral-900 truncate'>
                                        {contact.name}
                                      </div>
                                      <div className='text-sm text-neutral-600 truncate'>{contact.email}</div>
                                    </div>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.company && (
                                <td className='p-3'>
                                  <div className='text-sm text-neutral-900 font-medium'>{contact.company}</div>
                                </td>
                              )}
                              {visibleColumns.role && (
                                <td className='p-3'>
                                  <div className='text-sm text-neutral-900'>{contact.role || '—'}</div>
                                </td>
                              )}
                              {visibleColumns.contactType && (
                                <td className='p-3'>
                                  <span
                                    className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getContactTypeColor(contact.contact_type)}`}
                                  >
                                    {contact.contact_type.replace(/_/g, ' ')}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.linkedin && (
                                <td className='p-3'>
                                  {contact.linkedin_url ? (
                                    <a
                                      href={contact.linkedin_url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-600 hover:text-blue-700 transition-colors'
                                      title='View LinkedIn Profile'
                                    >
                                      <Linkedin className='h-5 w-5' />
                                    </a>
                                  ) : (
                                    <span className='text-neutral-400'>—</span>
                                  )}
                                </td>
                              )}
                              {visibleColumns.notes && (
                                <td className='p-3'>
                                  <div className='text-sm text-neutral-600 truncate max-w-xs'>
                                    {contact.notes || '—'}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.action && (
                                <td className='p-3'>
                                  <div className='flex items-center justify-end gap-1'>
                                    <motion.button
                                      onClick={() => handleEditContact(contact)}
                                      className='p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200'
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title='Edit contact'
                                    >
                                      <Edit className='h-4 w-4' />
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleDeleteContact(contact.id)}
                                      className='p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200'
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title='Delete contact'
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

              {/* Card View */}
              {viewMode === 'cards' && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <AnimatePresence>
                    {paginatedContacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className='bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'
                      >
                        <div className='flex items-start justify-between mb-3'>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(contact.name)}`}
                            >
                              {contact.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <h3 className='font-semibold text-neutral-900 truncate'>{contact.name}</h3>
                              <p className='text-sm text-neutral-600 truncate'>{contact.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelectContact(contact.id)}
                            className='p-1 rounded hover:bg-neutral-100 transition-colors'
                          >
                            {selectedContacts.has(contact.id) ? (
                              <CheckSquare className='h-4 w-4 text-blue-600' />
                            ) : (
                              <Square className='h-4 w-4 text-neutral-400' />
                            )}
                          </button>
                        </div>
                        
                        <div className='space-y-2 mb-4'>
                          <div className='flex items-center gap-2'>
                            <Building className='h-4 w-4 text-neutral-400' />
                            <span className='text-sm text-neutral-900 font-medium'>{contact.company}</span>
                          </div>
                          {contact.role && (
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4 text-neutral-400' />
                              <span className='text-sm text-neutral-600'>{contact.role}</span>
                            </div>
                          )}
                          <div className='flex items-center gap-2'>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getContactTypeColor(contact.contact_type)}`}
                            >
                              {contact.contact_type.replace(/_/g, ' ')}
                            </span>
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:text-blue-700 transition-colors'
                                title='View LinkedIn Profile'
                              >
                                <Linkedin className='h-4 w-4' />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className='flex items-center justify-end gap-1'>
                          <motion.button
                            onClick={() => handleEditContact(contact)}
                            className='p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all'
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title='Edit contact'
                          >
                            <Edit className='h-4 w-4' />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteContact(contact.id)}
                            className='p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all'
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title='Delete contact'
                          >
                            <Trash2 className='h-4 w-4' />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty State */}
              {filteredAndSortedContacts.length === 0 && (
                <div className='flex flex-col items-center justify-center text-center py-16'>
                  <div className='p-4 rounded-full bg-neutral-100 mb-6'>
                    <User className='h-12 w-12 text-neutral-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                    {contacts?.length === 0 ? 'No contacts yet' : 'No contacts match filters'}
                  </h3>
                  <p className='text-neutral-600 max-w-md mb-6'>
                    {contacts?.length === 0
                      ? 'Add your professional contacts to keep track of your network and build meaningful connections.'
                      : "Try adjusting your search or filter criteria to find what you're looking for."}
                  </p>
                  {contacts?.length === 0 && (
                    <button className='px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2' onClick={handleAddContact}>
                      <Plus className='h-4 w-4' />
                      Add Your First Contact
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between mt-6 pt-6 border-t border-neutral-200'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-neutral-600'>Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className='px-3 py-1 border border-neutral-300 rounded-md text-sm'
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className='text-sm text-neutral-600'>per page</span>
                    </div>
                    <div className='text-sm text-neutral-600'>
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedContacts.length)} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredAndSortedContacts.length)} of{' '}
                      {filteredAndSortedContacts.length} results
                    </div>
                  </div>
                  
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className='px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:text-neutral-400 disabled:cursor-not-allowed'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    
                    <div className='flex items-center gap-1'>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              currentPage === page
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className='px-2 text-neutral-400'>...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              currentPage === totalPages
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className='px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:text-neutral-400 disabled:cursor-not-allowed'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Contact Form Modal */}
        <ContactForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          contact={editingContact}
        />

        {/* Export Modal */}
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
