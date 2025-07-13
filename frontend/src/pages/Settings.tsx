import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Key, 
  Eye,
  EyeOff,
  CheckCircle,
  Calendar,
  Mail,
  Link,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '@/services/api';
import ConnectGoogle from '../components/ConnectGoogle';

const Settings = () => {
  const queryClient = useQueryClient();
  
  // Core state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  // Google Integration state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Google integration status query
  const { data: googleStatusData, isLoading: googleLoading } = useQuery({
    queryKey: ['settings', 'google_status'],
    queryFn: () => api.get('/settings/google/status').then(res => res.data),
    retry: false,
  });

  useEffect(() => {
    if (googleStatusData) {
      setGoogleConnected(!!googleStatusData.google_connected);
      setLoading(false);
    }
  }, [googleStatusData]);

  useEffect(() => {
    if (setting && setting.value) {
      setApiKey(setting.value);
    }
  }, [setting]);

  useEffect(() => {
    setLoading(googleLoading);
  }, [googleLoading]);

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

  // Google OAuth connect handler
  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/settings/google/connect');
      if (!res.ok) throw new Error('Failed to get Google connect URL');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError('No auth URL returned from server.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    }
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

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (googleConnected === false) {
    return <ConnectGoogle message="Connect your Google account to enable email and calendar features." />;
  }

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
              Configure your API integrations for enhanced functionality
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

        {/* Google Integration Section */}
        <motion.div variants={itemVariants} className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Link className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Google Integration</h3>
              <p className="text-sm text-neutral-600">Connect Gmail and Google Calendar for automatic email and event syncing</p>
            </div>
          </div>
          
          {/* Overall Status */}
          <div className="flex items-center gap-4 mb-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${googleConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {googleConnected ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {googleConnected ? 'Fully Connected' : 'Not Connected'}
            </span>
          </div>

          {/* Detailed Service Status */}
          {googleStatusData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Mail className="h-5 w-5 text-neutral-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Gmail</p>
                  <p className="text-xs text-neutral-600">Email synchronization</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  googleStatusData.gmail_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {googleStatusData.gmail_connected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {googleStatusData.gmail_connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Calendar className="h-5 w-5 text-neutral-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Calendar</p>
                  <p className="text-xs text-neutral-600">Event synchronization</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  googleStatusData.calendar_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {googleStatusData.calendar_connected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {googleStatusData.calendar_connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          )}

          {/* Status Message */}
          {googleStatusData?.message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{googleStatusData.message}</p>
            </div>
          )}

          {/* Connect Button or Success Message */}
          {!googleConnected && (
            <button
              onClick={handleConnectGoogle}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Link className="h-4 w-4" /> Connect with Google
            </button>
          )}
          {googleConnected && (
            <div className="text-sm text-green-700 p-3 bg-green-50 rounded-lg">
              ✅ Both Gmail and Calendar are connected. You can now sync emails and calendar events from both services in one unified experience.
            </div>
          )}
        </motion.div>

        {/* Features Info */}
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <h4 className="text-sm font-medium text-neutral-900 mb-2">What this enables:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-neutral-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-neutral-800">Email Integration</p>
                <p className="text-xs text-neutral-600">Automatic filtering of hiring-related emails with AI analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-neutral-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-neutral-800">Calendar Sync</p>
                <p className="text-xs text-neutral-600">View upcoming interviews and job-related meetings</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
