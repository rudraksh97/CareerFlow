import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Search,
  RefreshCw,
  Trash2,
  Building,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  Circle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Email, EmailStatus, EmailPriority, EmailCategory } from '@/types';
import ConnectGoogle from '../components/ConnectGoogle';

const EmailStatusColors = {
  [EmailStatus.UNREAD]: 'bg-blue-100 text-blue-800',
  [EmailStatus.READ]: 'bg-gray-100 text-gray-800',
  [EmailStatus.DISCARDED]: 'bg-red-100 text-red-800',
  [EmailStatus.ARCHIVED]: 'bg-green-100 text-green-800'
};

const CategoryColors = {
  [EmailCategory.JOB_APPLICATION]: 'bg-purple-100 text-purple-800',
  [EmailCategory.INTERVIEW_INVITATION]: 'bg-green-100 text-green-800',
  [EmailCategory.REJECTION]: 'bg-red-100 text-red-800',
  [EmailCategory.OFFER]: 'bg-yellow-100 text-yellow-800',
  [EmailCategory.RECRUITER_OUTREACH]: 'bg-blue-100 text-blue-800',
  [EmailCategory.FOLLOW_UP]: 'bg-orange-100 text-orange-800',
  [EmailCategory.OTHER]: 'bg-gray-100 text-gray-800'
};

const Emails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState<Email | null>(null);
  const [discardReason, setDiscardReason] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [googleNotConnected, setGoogleNotConnected] = useState(false);

  const queryClient = useQueryClient();

  // Calculate date for last month filter
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthDateString = lastMonthDate.toISOString().split('T')[0];

  // Fetch emails
  const { data: emails = [], isLoading, refetch, error } = useQuery({
    queryKey: ['emails', { search: searchTerm, status: statusFilter, date_from: lastMonthDateString }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      // Always filter to last month
      params.append('date_from', lastMonthDateString);
      
      console.log('Emails query URL:', `/emails/?${params.toString()}`);
      
      try {
        const response = await api.get(`/emails/?${params.toString()}`);
        console.log('Emails response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Emails query error:', error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3,
  });

  // Update email status mutation
  const updateEmailStatusMutation = useMutation({
    mutationFn: ({ emailId, status }: { emailId: string; status: EmailStatus }) => 
      api.put(`/emails/${emailId}/status?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setShowSuccessMessage('Email status updated successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setShowSuccessMessage(`Failed to update status: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setShowSuccessMessage(''), 5000);
    }
  });

  // Update email priority mutation
  const updateEmailPriorityMutation = useMutation({
    mutationFn: ({ emailId, priority }: { emailId: string; priority: EmailPriority }) => 
      api.put(`/emails/${emailId}`, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setShowSuccessMessage('Email marked as important!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setShowSuccessMessage(`Failed to update priority: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setShowSuccessMessage(''), 5000);
    }
  });

  // Sync emails mutation
  const syncEmailsMutation = useMutation({
    mutationFn: () => api.post('/emails/sync'),
    onSuccess: () => {
      setShowSuccessMessage('Email sync started successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      // Refetch after a delay to get updated data
      setTimeout(() => refetch(), 2000);
    },
    onError: (error: any) => {
      setShowSuccessMessage(`Sync failed: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setShowSuccessMessage(''), 5000);
    }
  });

  // Discard email mutation
  const discardEmailMutation = useMutation({
    mutationFn: ({ emailId, reason }: { emailId: string; reason?: string }) => 
      api.post(`/emails/${emailId}/discard`, reason ? { reason } : {}),
    onSuccess: () => {
      setShowSuccessMessage('Email discarded successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      setShowDiscardModal(null);
      setDiscardReason('');
      refetch();
    },
    onError: (error: any) => {
      setShowSuccessMessage(`Failed to discard email: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setShowSuccessMessage(''), 5000);
    }
  });

  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const res = await api.get('/settings/google/status');
        setGoogleNotConnected(!res.data.google_connected);
      } catch (e: any) {
        setGoogleNotConnected(true);
      }
    };
    checkGoogleConnection();
  }, []);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    // Mark as read when opening
    if (email.status === EmailStatus.UNREAD) {
      updateEmailStatusMutation.mutate({ emailId: email.id, status: EmailStatus.READ });
    }
  };

  const handleToggleImportant = (email: Email, event: React.MouseEvent) => {
    event.stopPropagation();
    const newPriority = email.priority === EmailPriority.HIGH ? EmailPriority.MEDIUM : EmailPriority.HIGH;
    updateEmailPriorityMutation.mutate({ emailId: email.id, priority: newPriority });
  };

  const handleDiscardEmail = () => {
    if (showDiscardModal) {
      discardEmailMutation.mutate({ 
        emailId: showDiscardModal.id, 
        reason: discardReason.trim() || undefined 
      });
    }
  };

  const handleSyncEmails = () => {
    setSyncing(true);
    syncEmailsMutation.mutate();
    setTimeout(() => setSyncing(false), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (googleNotConnected) {
    return <ConnectGoogle message="To use email features, please connect your Google account." />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-neutral-900">Emails</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200">
              <Mail className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Gmail Integration</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            All emails from the last month from your Gmail account
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSyncEmails}
            disabled={syncing || syncEmailsMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: syncing ? 1 : 1.02 }}
            whileTap={{ scale: syncing ? 1 : 0.98 }}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Emails'}
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
          >
            <option value="">All Statuses</option>
            <option value={EmailStatus.UNREAD}>Unread</option>
            <option value={EmailStatus.READ}>Read</option>
            <option value={EmailStatus.DISCARDED}>Discarded</option>
            <option value={EmailStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load emails</p>
            <p className="text-sm text-neutral-500 mb-4">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-8 w-8 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">No emails found</p>
            <p className="text-sm text-neutral-500">
              No emails from the last month match your current filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {emails.map((email: Email) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-neutral-50 cursor-pointer ${email.status === EmailStatus.UNREAD ? 'bg-blue-50' : ''}`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Blue dot for unread emails */}
                      {email.status === EmailStatus.UNREAD && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                      <h3 className="font-medium text-neutral-900 truncate">{email.subject}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${EmailStatusColors[email.status]}`}>
                          {email.status.toLowerCase()}
                        </span>
                        {email.priority === EmailPriority.HIGH && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            important
                          </span>
                        )}
                        {email.category && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${CategoryColors[email.category]}`}>
                            {email.category.replace('_', ' ').toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {email.sender_name || email.sender_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(email.date_received)}
                      </div>
                      {email.company_name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {email.company_name}
                        </div>
                      )}
                    </div>
                    
                    {email.body_text && (
                      <p className="text-sm text-neutral-500 line-clamp-2">
                        {email.body_text.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {email.status !== EmailStatus.DISCARDED && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDiscardModal(email);
                        }}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    )}
                    {email.priority === EmailPriority.HIGH && (
                      <motion.button
                        onClick={(e) => handleToggleImportant(email, e)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star className="h-4 w-4" />
                      </motion.button>
                    )}
                    {email.priority === EmailPriority.MEDIUM && (
                      <motion.button
                        onClick={(e) => handleToggleImportant(email, e)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Circle className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Email Detail Modal */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedEmail.status === EmailStatus.UNREAD && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                      <h2 className="text-xl font-semibold text-neutral-900">{selectedEmail.subject}</h2>
                      {selectedEmail.priority === EmailPriority.HIGH && (
                        <Star className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span>From: {selectedEmail.sender_name || selectedEmail.sender_email}</span>
                      <span>To: {selectedEmail.recipient_email}</span>
                      <span>{formatDate(selectedEmail.date_received)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => handleToggleImportant(selectedEmail, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedEmail.priority === EmailPriority.HIGH
                          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                          : 'text-neutral-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {selectedEmail.priority === EmailPriority.HIGH ? (
                        <Star className="h-5 w-5 fill-current" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </motion.button>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {selectedEmail.body_text && (
                  <div className="prose max-w-none">
                    <div className="text-sm text-neutral-700 leading-relaxed space-y-4">
                      {selectedEmail.body_text.split('\n\n').map((paragraph, index) => {
                        const trimmedParagraph = paragraph.trim();
                        
                        // Skip empty paragraphs
                        if (!trimmedParagraph) return null;
                        
                        // Handle job titles and company names (often at the start)
                        if (index < 3 && (trimmedParagraph.includes('Engineer') || trimmedParagraph.includes('Developer') || trimmedParagraph.includes('Software'))) {
                          return (
                            <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                              <h3 className="font-semibold text-blue-900 text-base">
                                {trimmedParagraph.split('\n')[0]}
                              </h3>
                              {trimmedParagraph.split('\n').slice(1).map((line, lineIndex) => (
                                <p key={lineIndex} className="text-blue-700 mt-1">
                                  {line}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        
                        // Handle URLs with better formatting
                        if (trimmedParagraph.includes('http')) {
                          const lines = trimmedParagraph.split('\n');
                          return (
                            <div key={index} className="bg-gray-50 p-3 rounded border">
                              {lines.map((line, lineIndex) => {
                                if (line.includes('http')) {
                                  const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                                  if (urlMatch) {
                                    const url = urlMatch[1];
                                    const beforeUrl = line.substring(0, line.indexOf(url));
                                    const afterUrl = line.substring(line.indexOf(url) + url.length);
                                    
                                    return (
                                      <div key={lineIndex} className="mb-2">
                                        {beforeUrl && <span>{beforeUrl}</span>}
                                        <div className="bg-white p-2 rounded border-l-2 border-blue-400 my-2">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-xs break-all"
                                          >
                                            View Job Posting →
                                          </a>
                                        </div>
                                        {afterUrl && <span>{afterUrl}</span>}
                                      </div>
                                    );
                                  }
                                }
                                return <p key={lineIndex} className="mb-1">{line}</p>;
                              })}
                            </div>
                          );
                        }
                        
                        // Handle job listings with separators
                        if (trimmedParagraph.includes('---')) {
                          const cleanContent = trimmedParagraph.replace(/---+/g, '').trim();
                          if (!cleanContent) return null;
                          
                          return (
                            <div key={index} className="border-t-2 border-neutral-200 pt-4 mt-6">
                              <div className="bg-gradient-to-r from-neutral-50 to-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-neutral-500" />
                                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Additional Opportunity</span>
                                </div>
                                <div className="whitespace-pre-wrap text-neutral-700">
                                  {cleanContent}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Handle location information
                        if (trimmedParagraph.match(/\b(Seattle|San Francisco|New York|Austin|Boston|Denver|Remote)\b/i)) {
                          return (
                            <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Location & Details</span>
                              </div>
                              <p className="whitespace-pre-wrap text-green-800">
                                {trimmedParagraph}
                              </p>
                            </div>
                          );
                        }
                        
                        // Regular paragraph
                        return (
                          <p key={index} className="whitespace-pre-wrap leading-relaxed">
                            {trimmedParagraph}
                          </p>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDiscardModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Discard Email</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Are you sure you want to discard this email? This will mark it as non-relevant for hiring purposes.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  placeholder="Why is this email not relevant?"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDiscardModal(null)}
                  className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscardEmail}
                  disabled={discardEmailMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {discardEmailMutation.isPending ? 'Discarding...' : 'Discard'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Emails; 