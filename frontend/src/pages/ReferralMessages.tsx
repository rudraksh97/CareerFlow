import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Copy,
  Play,
  MessageSquare,
  Users,
  TrendingUp,
  CheckCircle,
  RotateCw,
  Download,
  X
} from 'lucide-react';
import { useState, useMemo } from 'react';

import MessageGenerator from '@/components/MessageGenerator';
import ReferralMessageForm from '@/components/ReferralMessageForm';
import { api } from '@/services/api';
import { ReferralMessage } from '@/types';

const ReferralMessages = () => {
  // Core state
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ReferralMessage | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<ReferralMessage | null>(null);
  
  // Tab and export state
  const [activeTab, setActiveTab] = useState<'templates' | 'messages' | 'stats'>('templates');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  const queryClient = useQueryClient();

  // Fetch referral messages
  const { data: messages = [], isLoading } = useQuery<ReferralMessage[]>({
    queryKey: ['referral-messages'],
    queryFn: () => api.get('/referral-messages/').then(res => res.data),
  });

  // Mutations
  const duplicateMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.post(`/referral-messages/${messageId}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
      setShowSuccessMessage('Template duplicated successfully');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message =>
      !searchTerm ||
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message_template.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalTemplates = messages.length;
    const activeTemplates = messages.filter(m => m.is_active).length;
    const totalUsage = messages.reduce((sum, m) => sum + parseInt(m.usage_count || '0'), 0);
    const mostUsedTemplate = messages.reduce((max, m) => 
      parseInt(m.usage_count || '0') > parseInt(max.usage_count || '0') ? m : max, 
      messages[0] || { usage_count: '0' }
    );

    return { totalTemplates, activeTemplates, totalUsage, mostUsedTemplate };
  }, [messages]);

  // Handlers
  const handleAddMessage = () => {
    setEditingMessage(null);
    setIsFormOpen(true);
  };

  const handleEditMessage = (message: ReferralMessage) => {
    setEditingMessage(message);
    setIsFormOpen(true);
  };

  const handleDuplicateMessage = (messageId: string) => {
    duplicateMessageMutation.mutate(messageId);
  };

  const handleGenerateMessage = (message: ReferralMessage) => {
    setGeneratingMessage(message);
  };

  const handleExport = () => {
    const dataToExport = filteredMessages.map(msg => ({
      title: msg.title,
      type: msg.message_type,
      active: msg.is_active,
      usageCount: msg.usage_count,
      createdAt: msg.created_at
    }));
    
    if (exportFormat === 'csv') {
      exportAsCSV(dataToExport);
    } else {
      exportAsJSON(dataToExport);
    }
    
    setShowExportModal(false);
    setShowSuccessMessage(`Successfully exported ${dataToExport.length} template(s)`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const exportAsCSV = (data: any[]) => {
    const headers = ['Title', 'Type', 'Active', 'Usage Count', 'Created'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.title}"`,
        `"${item.type}"`,
        `"${item.active}"`,
        `"${item.usageCount}"`,
        `"${item.createdAt}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referral-templates-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportAsJSON = (data: any[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referral-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const TabButton = ({ tab, label, count }: { tab: 'templates' | 'messages' | 'stats'; label: string; count?: number }) => (
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RotateCw className='h-6 w-6 animate-spin text-neutral-400' />
        <span className='ml-3 text-neutral-600'>Loading templates...</span>
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
              <h1 className='text-2xl font-bold text-neutral-900'>Referral Messages</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <MessageSquare className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Message Templates</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Create and manage personalized referral message templates
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
              onClick={handleAddMessage}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className='h-4 w-4' />
              Create Template
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex items-end gap-0 border-b border-neutral-200">
        <TabButton tab="templates" label="Templates" count={messages.length} />
        <TabButton tab="messages" label="Generated Messages" />
        <TabButton tab="stats" label="Analytics & Stats" />
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Search */}
          <div className='relative max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <input
              type='text'
              placeholder='Search templates...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='input-field pl-10'
            />
          </div>

          {/* Templates Grid */}
          {filteredMessages.length === 0 ? (
            <motion.div className='card p-12 text-center' variants={itemVariants}>
              <div className='p-4 rounded-full bg-neutral-100 w-fit mx-auto mb-6'>
                <MessageSquare className='h-12 w-12 text-neutral-400' />
              </div>
              <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                No templates found
              </h3>
              <p className='text-neutral-600 mb-6'>
                {searchTerm ? 'No templates match your search.' : 'Create your first referral message template.'}
              </p>
              <motion.button
                onClick={handleAddMessage}
                className='btn-primary'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className='h-4 w-4 mr-2' />
                Create Template
              </motion.button>
            </motion.div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`card-interactive group ${!message.is_active ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className='p-6 h-full flex flex-col'>
                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-lg text-neutral-900 truncate group-hover:text-blue-600 transition-colors mb-2'>
                            {message.title}
                          </h3>
                          <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200'>
                            {message.message_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {!message.is_active && (
                          <span className='text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded'>Inactive</span>
                        )}
                      </div>

                      <p className='text-sm text-neutral-600 line-clamp-3 mb-4'>
                        {message.message_template.substring(0, 120)}
                        {message.message_template.length > 120 ? '...' : ''}
                      </p>

                      <div className='text-xs text-neutral-500 mb-4 flex items-center gap-1'>
                        <Play className='h-3 w-3' />
                        Used {message.usage_count} times
                      </div>
                    </div>

                    <div className='flex items-center gap-2 pt-4 border-t border-neutral-100'>
                      <motion.button
                        onClick={() => handleGenerateMessage(message)}
                        className='flex-1 btn-primary text-sm py-2'
                        disabled={!message.is_active}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Play className='h-3 w-3 mr-1' />
                        Generate
                      </motion.button>
                      <motion.button
                        onClick={() => handleEditMessage(message)}
                        className='btn-secondary p-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Edit className='h-3 w-3' />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDuplicateMessage(message.id)}
                        className='btn-secondary p-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Copy className='h-3 w-3' />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'messages' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <motion.div className='card p-12 text-center' variants={itemVariants}>
            <div className='p-4 rounded-full bg-blue-100 w-fit mx-auto mb-6'>
              <MessageSquare className='h-12 w-12 text-blue-600' />
            </div>
            <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
              Generated Messages
            </h3>
            <p className='text-neutral-600 mb-6'>
              Your generated messages from templates will appear here. Use the "Generate" button on any template to create personalized messages.
            </p>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'stats' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Template Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Total Templates</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{analytics.totalTemplates}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Active Templates</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{analytics.activeTemplates}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Total Usage</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{analytics.totalUsage}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Most Used</p>
                    <p className="text-lg font-bold text-neutral-900 mt-1 truncate">
                      {analytics.mostUsedTemplate?.title || 'None'}
                    </p>
                    <p className="text-xs text-neutral-500">{analytics.mostUsedTemplate?.usage_count || 0} uses</p>
                  </div>
                  <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                <h3 className="text-lg font-semibold text-neutral-900">Export Templates</h3>
                <motion.button
                  onClick={() => setShowExportModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                  whileHover={{ scale: 1.1 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="space-y-4">
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
                    className="flex-1 btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ReferralMessageForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingMessage={editingMessage}
      />

      <MessageGenerator
        isOpen={!!generatingMessage}
        onClose={() => setGeneratingMessage(null)}
        template={generatingMessage}
      />
    </motion.div>
  );
};

export default ReferralMessages;
