import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, AlertCircle, User, Mail, Linkedin, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '@/services/api';

const Profile = () => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    headline: '',
    linkedin_url: '',
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile/').then(res => res.data),
  });

  useEffect(() => {
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        headline: data.headline || '',
        linkedin_url: data.linkedin_url || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (updatedProfile: typeof profile) => {
      return api.post('/profile/', updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setNotification({ show: true, message: 'Profile saved successfully!', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    },
    onError: () => {
      setNotification({ show: true, message: 'Failed to save profile.', type: 'error' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(profile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-neutral-900'>Profile</h1>
        <p className='text-neutral-600 mt-1'>Manage your personal information</p>
      </div>

      <div className='card max-w-2xl p-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 gap-6'>
            <div>
              <label
                htmlFor='full_name'
                className='block text-sm font-medium text-neutral-700 mb-2'
              >
                Full Name
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <User className='h-4 w-4 text-neutral-400' />
                </span>
                <input
                  type='text'
                  name='full_name'
                  id='full_name'
                  className='form-input pl-10'
                  value={profile.full_name}
                  onChange={handleInputChange}
                  placeholder='e.g., John Doe'
                />
              </div>
            </div>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-neutral-700 mb-2'>
                Email
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Mail className='h-4 w-4 text-neutral-400' />
                </span>
                <input
                  type='email'
                  name='email'
                  id='email'
                  className='form-input pl-10'
                  value={profile.email}
                  onChange={handleInputChange}
                  placeholder='e.g., john.doe@email.com'
                />
              </div>
            </div>
            <div>
              <label htmlFor='headline' className='block text-sm font-medium text-neutral-700 mb-2'>
                Headline
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Briefcase className='h-4 w-4 text-neutral-400' />
                </span>
                <input
                  type='text'
                  name='headline'
                  id='headline'
                  className='form-input pl-10'
                  value={profile.headline}
                  onChange={handleInputChange}
                  placeholder='e.g., Senior Software Engineer'
                />
              </div>
            </div>
            <div>
              <label
                htmlFor='linkedin_url'
                className='block text-sm font-medium text-neutral-700 mb-2'
              >
                LinkedIn URL
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Linkedin className='h-4 w-4 text-neutral-400' />
                </span>
                <input
                  type='url'
                  name='linkedin_url'
                  id='linkedin_url'
                  className='form-input pl-10'
                  value={profile.linkedin_url}
                  onChange={handleInputChange}
                  placeholder='e.g., https://linkedin.com/in/johndoe'
                />
              </div>
            </div>
          </div>
          <div className='flex justify-end'>
            <button
              type='submit'
              className='btn-primary'
              disabled={isLoading || mutation.isPending}
            >
              <Save className='h-4 w-4 mr-2' />
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
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
          <AlertCircle className='h-5 w-5 mr-3' />
          {notification.message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Profile;
