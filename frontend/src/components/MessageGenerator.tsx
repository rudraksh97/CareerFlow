import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Copy,
  Mail,
  User,
  Building,
  Briefcase,
  CheckCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '@/services/api';
import { ReferralMessage, GenerateReferralMessageRequest, GeneratedReferralMessage } from '@/types';

interface MessageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ReferralMessage | null;
}

const MessageGenerator = ({ isOpen, onClose, template }: MessageGeneratorProps) => {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    position_title: '',
    your_name: '',
    your_background: '',
  });

  const [generatedMessage, setGeneratedMessage] = useState<GeneratedReferralMessage | null>(null);
  const [copied, setCopied] = useState<'subject' | 'message' | 'full' | null>(null);

  // Reset when modal opens/closes or template changes
  useEffect(() => {
    if (isOpen && template) {
      setStep('form');
      setFormData({
        contact_name: '',
        company_name: template.target_company || '',
        position_title: template.target_position || '',
        your_name: '',
        your_background: '',
      });
      setGeneratedMessage(null);
      setCopied(null);
    }
  }, [isOpen, template]);

  // Generate message mutation
  const generateMutation = useMutation({
    mutationFn: (request: GenerateReferralMessageRequest) =>
      api.post('/referral-messages/generate', request).then(res => res.data),
    onSuccess: (data: GeneratedReferralMessage) => {
      setGeneratedMessage(data);
      setStep('result');
    },
    onError: (error: any) => {
      console.error('Error generating message:', error);
      alert('Failed to generate message. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    const request: GenerateReferralMessageRequest = {
      template_id: template.id,
      contact_name: formData.contact_name.trim() || undefined,
      company_name: formData.company_name.trim() || undefined,
      position_title: formData.position_title.trim() || undefined,
      your_name: formData.your_name.trim() || undefined,
      your_background: formData.your_background.trim() || undefined,
    };

    generateMutation.mutate(request);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async (content: string, type: 'subject' | 'message' | 'full') => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const formatMessageType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleReset = () => {
    setStep('form');
    setGeneratedMessage(null);
    setCopied(null);
  };

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-neutral-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-50 to-white p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 border border-neutral-200">
                  <Sparkles className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Generate Personalized Message
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {formatMessageType(template.message_type)} • {template.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Personalization Details
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Fill in the details below to create a personalized message
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Contact Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <User className="h-4 w-4 text-neutral-500" />
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => handleChange('contact_name', e.target.value)}
                        className="form-input"
                        placeholder="Who are you reaching out to?"
                        required
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Building className="h-4 w-4 text-neutral-500" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        className="form-input"
                        placeholder="What company are you interested in?"
                        required
                      />
                    </div>

                    {/* Position Title */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Briefcase className="h-4 w-4 text-neutral-500" />
                        Position Title
                      </label>
                      <input
                        type="text"
                        value={formData.position_title}
                        onChange={(e) => handleChange('position_title', e.target.value)}
                        className="form-input"
                        placeholder="What role are you applying for?"
                        required
                      />
                    </div>

                    {/* Your Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <User className="h-4 w-4 text-neutral-500" />
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={formData.your_name}
                        onChange={(e) => handleChange('your_name', e.target.value)}
                        className="form-input"
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    {/* Your Background */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Your Background
                      </label>
                      <textarea
                        value={formData.your_background}
                        onChange={(e) => handleChange('your_background', e.target.value)}
                        className="form-input h-24 resize-none"
                        placeholder="Brief summary of your experience and skills relevant to this role..."
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={generateMutation.isPending}
                        className="btn-primary w-full group"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generateMutation.isPending ? 'Generating...' : 'Generate Message'}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6"
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        Message Generated Successfully!
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-600">
                      Your personalized message is ready to use
                    </p>
                  </div>

                  {generatedMessage && (
                    <div className="space-y-4">
                      {/* Subject */}
                      {generatedMessage.subject && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                              <Mail className="h-4 w-4 text-neutral-500" />
                              Email Subject
                            </label>
                            <button
                              onClick={() => handleCopy(generatedMessage.subject!, 'subject')}
                              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                copied === 'subject'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              {copied === 'subject' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1 inline" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1 inline" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
                            {generatedMessage.subject}
                          </div>
                        </div>
                      )}

                      {/* Message Body */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <MessageSquare className="h-4 w-4 text-neutral-500" />
                            Message Body
                          </label>
                          <button
                            onClick={() => handleCopy(generatedMessage.message, 'message')}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                              copied === 'message'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {copied === 'message' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1 inline" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1 inline" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {generatedMessage.message}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-6 bg-neutral-50">
            <div className="flex gap-3">
              {step === 'form' ? (
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReset}
                    className="btn-secondary"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => {
                      if (generatedMessage) {
                        const fullMessage = generatedMessage.subject
                          ? `Subject: ${generatedMessage.subject}\n\n${generatedMessage.message}`
                          : generatedMessage.message;
                        handleCopy(fullMessage, 'full');
                      }
                    }}
                    className={`btn-primary flex-1 ${
                      copied === 'full' ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
                  >
                    {copied === 'full' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied Complete Message!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Complete Message
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessageGenerator;
