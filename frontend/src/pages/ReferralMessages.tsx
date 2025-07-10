import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  MessageSquare,
  Users,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { 
  ReferralMessage, 
  ReferralMessageType, 
  GenerateReferralMessageRequest,
  GeneratedReferralMessage
} from '@/types';
import ReferralMessageForm from '@/components/ReferralMessageForm';
import MessageGenerator from '@/components/MessageGenerator';

const ReferralMessages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReferralMessageType | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ReferralMessage | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<ReferralMessage | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedReferralMessage | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch referral messages
  const { data: messages, isLoading } = useQuery<ReferralMessage[]>({
    queryKey: ['referral-messages'],
    queryFn: () => api.get('/referral-messages/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.delete(`/referral-messages/${messageId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
    },
    onError: (error: any) => {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  });

  // Duplicate mutation
  const duplicateMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.post(`/referral-messages/${messageId}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
    },
    onError: (error: any) => {
      console.error('Error duplicating message:', error);
      alert('Failed to duplicate message. Please try again.');
    }
  });

  // Generate message mutation
  const generateMessageMutation = useMutation({
    mutationFn: (request: GenerateReferralMessageRequest) => 
      api.post('/referral-messages/generate', request).then(res => res.data),
    onSuccess: (data: GeneratedReferralMessage) => {
      setGeneratedResult(data);
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
    },
    onError: (error: any) => {
      console.error('Error generating message:', error);
      alert('Failed to generate message. Please try again.');
    }
  });

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    
    return messages.filter((message) => {
      const matchesSearch = !searchTerm || 
        message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message_template.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.target_company && message.target_company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = !typeFilter || message.message_type === typeFilter;
      const matchesActive = activeFilter === '' || message.is_active === activeFilter;
      
      return matchesSearch && matchesType && matchesActive;
    });
  }, [messages, searchTerm, typeFilter, activeFilter]);

  // Event handlers
  const handleAddMessage = useCallback(() => {
    setEditingMessage(null);
    setIsFormOpen(true);
  }, []);

  const handleEditMessage = useCallback((message: ReferralMessage) => {
    setEditingMessage(message);
    setIsFormOpen(true);
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (window.confirm('Are you sure you want to delete this referral message template?')) {
      deleteMessageMutation.mutate(messageId);
    }
  }, [deleteMessageMutation]);

  const handleDuplicateMessage = useCallback((messageId: string) => {
    duplicateMessageMutation.mutate(messageId);
  }, [duplicateMessageMutation]);

  const handleGenerateMessage = useCallback((message: ReferralMessage) => {
    setGeneratingMessage(message);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingMessage(null);
  }, []);

  const handleCloseGenerate = useCallback(() => {
    setGeneratingMessage(null);
    setGeneratedResult(null);
  }, []);

  // Format message type for display
  const formatMessageType = (type: ReferralMessageType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTypeColor = (type: ReferralMessageType) => {
    const colors = {
      [ReferralMessageType.COLD_OUTREACH]: 'text-blue-600 bg-blue-50 border-blue-200',
      [ReferralMessageType.WARM_INTRODUCTION]: 'text-green-600 bg-green-50 border-green-200',
      [ReferralMessageType.FOLLOW_UP]: 'text-orange-600 bg-orange-50 border-orange-200',
      [ReferralMessageType.THANK_YOU]: 'text-purple-600 bg-purple-50 border-purple-200',
      [ReferralMessageType.NETWORKING]: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
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
      <div className="flex items-center justify-center h-64">
        <div className="loading"></div>
        <span className="ml-3 text-neutral-600">Loading referral messages...</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Referral Messages</h1>
          <p className="text-neutral-600">Create and manage personalized referral message templates</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAddMessage}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ReferralMessageType | '')}
              className="input-field"
            >
              <option value="">All Types</option>
              {Object.values(ReferralMessageType).map(type => (
                <option key={type} value={type}>
                  {formatMessageType(type)}
                </option>
              ))}
            </select>
            <select 
              value={activeFilter.toString()}
              onChange={(e) => setActiveFilter(e.target.value === '' ? '' : e.target.value === 'true')}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Messages Grid */}
      <motion.div variants={itemVariants}>
        {filteredMessages.length === 0 ? (
          <div className="card p-12 text-center">
            <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No referral message templates</h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm || typeFilter || activeFilter !== '' 
                ? 'No templates match your current filters.' 
                : 'Create your first referral message template to get started.'}
            </p>
            {(!searchTerm && !typeFilter && activeFilter === '') && (
              <button onClick={handleAddMessage} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMessages.map((message) => (
              <motion.div
                key={message.id}
                variants={itemVariants}
                className={`card p-6 transition-all duration-200 hover:shadow-md ${
                  !message.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-neutral-900 truncate">{message.title}</h3>
                      {!message.is_active && <EyeOff className="h-4 w-4 text-neutral-400" />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(message.message_type)}`}>
                      {formatMessageType(message.message_type)}
                    </span>
                  </div>
                </div>

                {/* Message preview */}
                <div className="mb-4">
                  <p className="text-sm text-neutral-600 line-clamp-3">
                    {message.message_template.substring(0, 150)}
                    {message.message_template.length > 150 ? '...' : ''}
                  </p>
                </div>

                {/* Target info */}
                {(message.target_company || message.target_position) && (
                  <div className="mb-4 text-xs text-neutral-500">
                    {message.target_company && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{message.target_company}</span>
                      </div>
                    )}
                    {message.target_position && (
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{message.target_position}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage count */}
                <div className="text-xs text-neutral-500 mb-4">
                  Used {message.usage_count} times
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateMessage(message)}
                    className="flex-1 btn btn-primary text-xs py-2"
                    disabled={!message.is_active}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Generate
                  </button>
                  <button
                    onClick={() => handleEditMessage(message)}
                    className="btn btn-secondary p-2"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDuplicateMessage(message.id)}
                    className="btn btn-secondary p-2"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="btn btn-secondary p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ReferralMessageForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingMessage={editingMessage}
      />
      
      <MessageGenerator
        isOpen={!!generatingMessage}
        onClose={handleCloseGenerate}
        template={generatingMessage}
      />
    </motion.div>
  );
};

export default ReferralMessages; 