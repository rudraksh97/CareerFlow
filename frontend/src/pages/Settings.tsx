import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Settings as SettingsIcon, Key, Info, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import VersionDisplay from '@/components/VersionDisplay';
import { api } from '@/services/api';

const Settings = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const { data: setting, isLoading } = useQuery({
    queryKey: ['settings', 'openai_api_key'],
    queryFn: () => api.get('/settings/openai_api_key').then(res => res.data),
    retry: (failureCount, error: any) => {
      if (error.response?.status === 404) {
        return false; // Don't retry on 404
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (setting && setting.value) {
      setApiKey(setting.value);
    }
  }, [setting]);

  const mutation = useMutation({
    mutationFn: (newApiKey: string) => {
      return api.post('/settings/', { key: 'openai_api_key', value: newApiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'openai_api_key'] });
      setNotification({ show: true, message: 'API Key saved successfully!', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    },
    onError: () => {
      setNotification({ show: true, message: 'Failed to save API Key.', type: 'error' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(apiKey);
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

  return (
    <motion.div
      className='space-y-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants} className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold gradient-text flex items-center gap-3'>
          <SettingsIcon className='h-8 w-8 text-blue-600' />
          Settings
        </h1>
        <p className='text-neutral-600'>Manage your application settings and preferences</p>
      </motion.div>

      {/* API Key Configuration */}
      <motion.div variants={itemVariants} className='card max-w-2xl p-8'>
        <div className='mb-6'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-2 flex items-center gap-2'>
            <Key className='h-5 w-5 text-blue-600' />
            OpenAI Configuration
          </h2>
          <p className='text-neutral-600 text-sm'>
            Configure your OpenAI API key to enable AI-powered features like cover letter generation
            and message personalization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label htmlFor='apiKey' className='form-label'>
              OpenAI API Key
            </label>
            <div className='relative'>
              <input
                type='password'
                id='apiKey'
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className='form-input pr-12'
                placeholder='sk-...'
                disabled={isLoading || mutation.isPending}
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                <Key className='h-4 w-4 text-neutral-400' />
              </div>
            </div>
            <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-start gap-2'>
                <Info className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-blue-800'>
                  <p className='font-medium mb-1'>Security Note</p>
                  <p>
                    Your API key is encrypted and stored securely on the server. It's never exposed
                    in the frontend or logs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='flex justify-end pt-4 border-t border-neutral-200'>
            <motion.button
              type='submit'
              className={`btn-primary focus-ring ${
                isLoading || mutation.isPending ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || mutation.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className='h-4 w-4 mr-2' />
              {mutation.isPending ? 'Saving...' : 'Save Configuration'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Version Information */}
      <motion.div variants={itemVariants} className='card max-w-2xl p-8'>
        <div className='mb-6'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-2 flex items-center gap-2'>
            <Info className='h-5 w-5 text-blue-600' />
            Application Information
          </h2>
          <p className='text-neutral-600 text-sm'>
            Current version and build information for this application.
          </p>
        </div>
        <VersionDisplay showDetails={true} />
      </motion.div>

      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
          className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-xl border max-w-sm ${
            notification.type === 'success'
              ? 'bg-white border-green-200 text-green-800'
              : 'bg-white border-red-200 text-red-800'
          }`}
        >
          <div
            className={`p-1 rounded-full mr-3 ${
              notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className='h-4 w-4' />
            ) : (
              <X className='h-4 w-4' />
            )}
          </div>
          <span className='font-medium'>{notification.message}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Settings;
