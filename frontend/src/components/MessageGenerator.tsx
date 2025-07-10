import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Play, Copy, Mail, User, Building, Briefcase, Lightbulb, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { 
  ReferralMessage, 
  GenerateReferralMessageRequest,
  GeneratedReferralMessage
} from '@/types';

interface MessageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ReferralMessage | null;
}

const MessageGenerator = ({ isOpen, onClose, template }: MessageGeneratorProps) => {
  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    position_title: '',
    your_name: '',
    your_background: ''
  });
  
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedReferralMessage | null>(null);
  const [copied, setCopied] = useState<'subject' | 'message' | null>(null);

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (isOpen && template) {
      setFormData({
        contact_name: '',
        company_name: template.target_company || '',
        position_title: template.target_position || '',
        your_name: '',
        your_background: ''
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
    },
    onError: (error: any) => {
      console.error('Error generating message:', error);
      alert('Failed to generate message. Please try again.');
    }
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
      your_background: formData.your_background.trim() || undefined
    };

    generateMutation.mutate(request);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async (content: string, type: 'subject' | 'message') => {
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
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="modal-content max-w-6xl max-h-[95vh] overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Play className="h-6 w-6 text-primary-600" />
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Generate Personalized Message</h2>
                  <p className="text-sm text-neutral-600">Using template: {template.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input Form */}
              <div className="space-y-6">
                <div className="card p-4 bg-neutral-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-neutral-700">Template Info</span>
                  </div>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p><strong>Type:</strong> {formatMessageType(template.message_type)}</p>
                    {template.target_company && <p><strong>Target Company:</strong> {template.target_company}</p>}
                    {template.target_position && <p><strong>Target Position:</strong> {template.target_position}</p>}
                    <p><strong>Used:</strong> {template.usage_count} times</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Personalization Details</h3>
                  
                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                      className="input-field"
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Google"
                    />
                  </div>

                  {/* Position Title */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Position Title
                    </label>
                    <input
                      type="text"
                      value={formData.position_title}
                      onChange={(e) => handleChange('position_title', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  {/* Your Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.your_name}
                      onChange={(e) => handleChange('your_name', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Jane Doe"
                    />
                  </div>

                  {/* Your Background */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Your Background/Experience
                    </label>
                    <textarea
                      value={formData.your_background}
                      onChange={(e) => handleChange('your_background', e.target.value)}
                      className="input-field h-24 resize-none"
                      placeholder="e.g., full-stack development with 5+ years experience in React and Node.js"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="btn btn-primary w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {generateMutation.isPending ? 'Generating...' : 'Generate Message'}
                  </button>
                </form>
              </div>

              {/* Right Column - Generated Message */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Generated Message</h3>
                
                {generatedMessage ? (
                  <div className="space-y-4">
                    {/* Subject */}
                    {generatedMessage.subject && (
                      <div className="card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-neutral-700">
                            <Mail className="h-4 w-4 inline mr-1" />
                            Email Subject
                          </label>
                          <button
                            onClick={() => handleCopy(generatedMessage.subject!, 'subject')}
                            className={`btn btn-secondary text-xs py-1 px-2 ${copied === 'subject' ? 'bg-green-50 text-green-700' : ''}`}
                          >
                            {copied === 'subject' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg text-sm">
                          {generatedMessage.subject}
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          Message Body
                        </label>
                        <button
                          onClick={() => handleCopy(generatedMessage.message, 'message')}
                          className={`btn btn-secondary text-xs py-1 px-2 ${copied === 'message' ? 'bg-green-50 text-green-700' : ''}`}
                        >
                          {copied === 'message' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {generatedMessage.message}
                      </div>
                    </div>

                    {/* Variables Used */}
                    <div className="card p-4 bg-blue-50">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Variables Used</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {Object.entries(generatedMessage.variables_used).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-blue-700 font-mono">{`{${key}}`}</span>
                            <span className="text-blue-600 truncate ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center text-neutral-500">
                    <Play className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                    <p>Fill in the details and click "Generate Message" to create your personalized referral message.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>
              {generatedMessage && (
                <button
                  onClick={() => {
                    const fullMessage = generatedMessage.subject 
                      ? `Subject: ${generatedMessage.subject}\n\n${generatedMessage.message}`
                      : generatedMessage.message;
                    handleCopy(fullMessage, 'message');
                  }}
                  className="btn btn-primary"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Full Message
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MessageGenerator; 