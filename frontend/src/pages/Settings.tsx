import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Key, 
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '@/services/api';

const Settings = () => {
  const queryClient = useQueryClient();
  
  // Core state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  const { data: setting } = useQuery({
    queryKey: ['settings', 'openai_api_key'],
    queryFn: () => api.get('/settings/openai_api_key').then(res => res.data),
    retry: (failureCount, error: any) => {
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (setting && setting.value) {
      setApiKey(setting.value);
    }
  }, [setting]);

  const apiKeyMutation = useMutation({
    mutationFn: (newApiKey: string) => {
      return api.post('/settings/', { key: 'openai_api_key', value: newApiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'openai_api_key'] });
      setShowSuccessMessage('API Key saved successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
    onError: () => {
      setShowSuccessMessage('Failed to save API Key.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    },
  });

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiKeyMutation.mutate(apiKey);
  };

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

  return (
    <motion.div
      className='space-y-6'
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
              <h1 className='text-2xl font-bold text-neutral-900'>Settings</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <Key className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>API Configuration</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Configure your OpenAI API key for AI-powered features
            </p>
          </div>
        </div>
      </motion.div>

      {/* API Keys Content */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Key className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">OpenAI API Key</h3>
              <p className="text-sm text-neutral-600">Required for AI-powered cover letter and message generation</p>
            </div>
          </div>

          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Your API key is stored securely and only used for generating content. 
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-neutral-700 hover:text-neutral-900 underline ml-1"
                >
                  Get your API key from OpenAI
                </a>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={apiKeyMutation.isPending || !apiKey.trim()}
                className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: apiKeyMutation.isPending ? 1 : 1.02 }}
                whileTap={{ scale: apiKeyMutation.isPending ? 1 : 0.98 }}
              >
                <Save className="h-4 w-4" />
                {apiKeyMutation.isPending ? 'Saving...' : 'Save API Key'}
              </motion.button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <h4 className="text-sm font-medium text-neutral-900 mb-2">How is this used?</h4>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li>• Generate personalized cover letters based on job descriptions</li>
              <li>• Create professional referral messages for networking</li>
              <li>• Improve and optimize your existing content</li>
              <li>• All processing happens securely through OpenAI's API</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
