import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';

const Settings = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const { data: setting, isLoading } = useQuery({
    queryKey: ['settings', 'openai_api_key'],
    queryFn: () => api.get('/settings/openai_api_key').then(res => res.data),
    onSuccess: (data) => {
      if (data) {
        setApiKey(data.value);
      }
    },
    retry: (failureCount, error: any) => {
        if (error.response?.status === 404) {
          return false; // Don't retry on 404
        }
        return failureCount < 3;
    }
  });

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
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(apiKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-1">Manage your application settings</p>
      </div>
      
      <div className="card max-w-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field"
              placeholder="Enter your OpenAI API Key"
              disabled={isLoading || mutation.isPending}
            />
            <p className="text-xs text-neutral-500 mt-2">
              Your API key is stored securely and is not exposed on the frontend.
            </p>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isLoading || mutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {notification.show && (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
            <AlertCircle className="h-5 w-5 mr-3" />
            {notification.message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Settings; 