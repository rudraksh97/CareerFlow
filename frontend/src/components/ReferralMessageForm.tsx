import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { 
  ReferralMessage, 
  ReferralMessageType, 
  ReferralMessageCreate,
  ReferralMessageUpdate
} from '@/types';

interface ReferralMessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingMessage?: ReferralMessage | null;
}

const ReferralMessageForm = ({ isOpen, onClose, editingMessage }: ReferralMessageFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    message_type: ReferralMessageType.COLD_OUTREACH,
    subject_template: '',
    message_template: '',
    target_company: '',
    target_position: '',
    is_active: true,
    notes: ''
  });

  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or editing message changes
  useEffect(() => {
    if (isOpen) {
      if (editingMessage) {
        setFormData({
          title: editingMessage.title,
          message_type: editingMessage.message_type,
          subject_template: editingMessage.subject_template || '',
          message_template: editingMessage.message_template,
          target_company: editingMessage.target_company || '',
          target_position: editingMessage.target_position || '',
          is_active: editingMessage.is_active,
          notes: editingMessage.notes || ''
        });
      } else {
        setFormData({
          title: '',
          message_type: ReferralMessageType.COLD_OUTREACH,
          subject_template: '',
          message_template: '',
          target_company: '',
          target_position: '',
          is_active: true,
          notes: ''
        });
      }
    }
  }, [isOpen, editingMessage]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ReferralMessageCreate) => api.post('/referral-messages/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReferralMessageUpdate }) => 
      api.put(`/referral-messages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-messages'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating template:', error);
      alert('Failed to update template. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message_template.trim()) {
      alert('Please fill in the required fields (Title and Message Template).');
      return;
    }

    if (editingMessage) {
      updateMutation.mutate({ id: editingMessage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatMessageType = (type: ReferralMessageType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSubmit} className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingMessage ? 'Edit Template' : 'Create New Template'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="form-label">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Cold Outreach - Software Engineer"
                  required
                />
              </div>

              {/* Message Type */}
              <div>
                <label className="form-label">
                  Message Type *
                </label>
                <select
                  value={formData.message_type}
                  onChange={(e) => handleChange('message_type', e.target.value as ReferralMessageType)}
                  className="input-field"
                  required
                >
                  {Object.values(ReferralMessageType).map(type => (
                    <option key={type} value={type}>
                      {formatMessageType(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message Template */}
            <div className="mt-6">
              <label className="form-label">
                Message Template *
              </label>
              <textarea
                value={formData.message_template}
                onChange={(e) => handleChange('message_template', e.target.value)}
                className="input-field h-48 resize-none"
                placeholder="Hi {contact_name},

I hope this message finds you well. My name is {your_name}, and I'm interested in..."
                required
              />
              <p className="text-xs text-neutral-500 mt-2">
                Use variables: {'{contact_name}'}, {'{company_name}'}, {'{position_title}'}, {'{your_name}'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Saving...' 
                  : editingMessage ? 'Update Template' : 'Create Template'
                }
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReferralMessageForm; 