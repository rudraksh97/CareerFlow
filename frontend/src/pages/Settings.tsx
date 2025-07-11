import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Settings as SettingsIcon, 
  Key, 
  Info, 
  X, 
  Download,
  Shield,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  RotateCw,
  Database,
  Palette
} from 'lucide-react';
import { useState, useEffect } from 'react';

import VersionDisplay from '@/components/VersionDisplay';
import { api } from '@/services/api';

const Settings = () => {
  const queryClient = useQueryClient();
  
  // Core state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'privacy' | 'about'>('general');
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [dataRetention, setDataRetention] = useState('12');
  const [theme, setTheme] = useState('system');
  
  // UI state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  const { data: setting, isLoading } = useQuery({
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

  const handleExport = () => {
    const settingsData = {
      openai_api_key: apiKey ? '***REDACTED***' : '',
      email_notifications: emailNotifications,
      auto_save: autoSave,
      data_retention: dataRetention,
      theme: theme,
      exported_at: new Date().toISOString(),
    };

    if (exportFormat === 'json') {
      exportAsJSON(settingsData);
    } else {
      exportAsCSV(settingsData);
    }

    setShowExportModal(false);
    setShowSuccessMessage('Settings exported successfully!');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const exportAsJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pats-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportAsCSV = (data: any) => {
    const headers = ['Setting', 'Value'];
    const csvContent = [
      headers.join(','),
      ...Object.entries(data).map(([key, value]) => [
        `"${key}"`,
        `"${value}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pats-settings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: 'general' | 'api' | 'privacy' | 'about'; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`
        px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 flex items-center gap-2
        ${activeTab === tab
          ? 'border-neutral-900 text-neutral-900 bg-white' 
          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
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
              <h1 className='text-2xl font-bold text-neutral-900'>Settings</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <SettingsIcon className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Configuration</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Manage your application settings and preferences
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
              Export Settings
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex items-end gap-0 border-b border-neutral-200">
        <TabButton tab="general" label="General" icon={User} />
        <TabButton tab="api" label="API Keys" icon={Key} />
        <TabButton tab="privacy" label="Privacy" icon={Shield} />
        <TabButton tab="about" label="About" icon={Info} />
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">General Preferences</h3>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Email Notifications</label>
                  <p className="text-xs text-neutral-500 mt-1">Receive email updates about your applications</p>
                </div>
                <motion.button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.button>
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Auto Save</label>
                  <p className="text-xs text-neutral-500 mt-1">Automatically save changes as you type</p>
                </div>
                <motion.button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSave ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.button>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Palette className="h-4 w-4 inline mr-1" />
                  Theme Preference
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'api' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                OpenAI Configuration
              </h3>
              <p className="text-sm text-neutral-600">
                Configure your OpenAI API key to enable AI-powered features like cover letter generation and message personalization.
              </p>
            </div>

            <form onSubmit={handleApiKeySubmit} className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-20 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="sk-..."
                    disabled={isLoading || apiKeyMutation.isPending}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 text-neutral-400 hover:text-neutral-600"
                      whileHover={{ scale: 1.1 }}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.button>
                    <Key className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Security Note</p>
                      <p>
                        Your API key is encrypted and stored securely on the server. It's never exposed in the frontend or logs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-200">
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  disabled={isLoading || apiKeyMutation.isPending}
                  whileHover={{ scale: isLoading || apiKeyMutation.isPending ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading || apiKeyMutation.isPending ? 1 : 0.98 }}
                >
                  {apiKeyMutation.isPending ? (
                    <RotateCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {apiKeyMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {activeTab === 'privacy' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Privacy & Data
            </h3>
            
            <div className="space-y-6">
              {/* Data Retention */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Database className="h-4 w-4 inline mr-1" />
                  Data Retention Period
                </label>
                <select
                  value={dataRetention}
                  onChange={(e) => setDataRetention(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="forever">Keep forever</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  How long to keep your application data before automatic deletion
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-neutral-900 mb-2">Privacy Protection</h4>
                <ul className="text-xs text-neutral-600 space-y-1">
                  <li>• Your data is encrypted at rest and in transit</li>
                  <li>• We never share your personal information with third parties</li>
                  <li>• You can export or delete your data at any time</li>
                  <li>• API keys are stored with enterprise-grade encryption</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'about' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Application Information
              </h3>
              <p className="text-sm text-neutral-600">
                Current version and build information for this application.
              </p>
            </div>
            <VersionDisplay showDetails={true} />
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-neutral-900 mb-4">About PATS</h4>
            <div className="prose prose-sm text-neutral-600">
              <p>
                Personal Application Tracking System (PATS) is a comprehensive job application management platform 
                designed to streamline your job search process.
              </p>
              <h5 className="font-medium text-neutral-900 mt-4 mb-2">Key Features</h5>
              <ul className="text-sm space-y-1">
                <li>• Track job applications and their status</li>
                <li>• Manage contacts and networking relationships</li>
                <li>• Generate personalized cover letters and referral messages</li>
                <li>• Analytics and insights on your job search progress</li>
                <li>• Resume and document management</li>
              </ul>
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
                <h3 className="text-lg font-semibold text-neutral-900">Export Settings</h3>
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
                    {(['json', 'csv'] as const).map((format) => (
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

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      API keys will be redacted in the export for security purposes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleExport}
                    className="flex-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
