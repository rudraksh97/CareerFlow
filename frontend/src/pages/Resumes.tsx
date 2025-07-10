import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Building, Briefcase, Calendar, FileText } from 'lucide-react';

import TemplateFileManager from '@/components/TemplateFileManager';
import { api } from '@/services/api';

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  date_applied: string;
  resume_filename: string;
}

const Resumes = () => {
  const {
    data: applications,
    isLoading,
    error,
  } = useQuery<Application[]>({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes/').then(res => res.data),
  });

  const handleDownloadResume = async (applicationId: string, filename: string) => {
    try {
      const response = await api.get(`/applications/${applicationId}/resume`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume file.');
    }
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
      <motion.div variants={itemVariants} className='space-y-3'>
        <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200'>
          <FileText className='h-4 w-4 text-neutral-600' />
          <span className='text-sm font-medium text-neutral-700'>Resume Library</span>
        </div>
        <h1 className='text-3xl lg:text-4xl font-bold gradient-text'>Resumes</h1>
        <p className='text-lg text-neutral-600'>View and manage all your submitted resumes</p>
      </motion.div>

      {/* Template Resumes Section */}
      <motion.div variants={itemVariants}>
        <TemplateFileManager fileType='resume' title='Resume Templates' />
      </motion.div>

      {/* Resume Grid */}
      {applications && applications.length > 0 && (
        <motion.div variants={itemVariants} className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-neutral-900'>Application Resumes</h3>
            <span className='text-sm text-neutral-600'>
              {applications.length} resume{applications.length !== 1 ? 's' : ''} from applications
            </span>
          </div>

          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className='card p-6 animate-pulse'>
                  <div className='h-5 bg-neutral-200 rounded w-3/4 mb-4' />
                  <div className='h-4 bg-neutral-100 rounded w-1/2 mb-3' />
                  <div className='h-4 bg-neutral-100 rounded w-1/2 mb-3' />
                  <div className='h-4 bg-neutral-100 rounded w-1/2 mb-6' />
                  <div className='h-10 bg-neutral-200 rounded-lg w-full' />
                </div>
              ))}
            </div>
          ) : error ? (
            <motion.div className='card p-12 text-center' variants={itemVariants}>
              <div className='p-4 rounded-full bg-red-100 w-fit mx-auto mb-6'>
                <FileText className='h-12 w-12 text-red-500' />
              </div>
              <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                Failed to load resumes
              </h3>
              <p className='text-neutral-600 mb-6'>
                Please try refreshing the page or contact support if the problem persists.
              </p>
              <motion.button
                onClick={() => window.location.reload()}
                className='btn-primary'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Refresh Page
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              variants={containerVariants}
              initial='hidden'
              animate='visible'
            >
              {applications.map((app, index) => (
                <motion.div
                  key={app.id}
                  className='card-interactive group'
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className='p-6 h-full flex flex-col'>
                    <div className='flex-1'>
                      <div className='flex items-start gap-3 mb-4'>
                        <div className='p-2 rounded-lg bg-neutral-100 flex-shrink-0'>
                          <FileText className='h-5 w-5 text-neutral-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3
                            className='font-semibold text-lg text-neutral-900 truncate group-hover:text-blue-600 transition-colors'
                            title={app.resume_filename}
                          >
                            {app.resume_filename}
                          </h3>
                        </div>
                      </div>

                      <div className='space-y-3 text-sm text-neutral-600'>
                        <div className='flex items-center gap-3'>
                          <Briefcase className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                          <span className='truncate'>{app.job_title}</span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Building className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                          <span className='truncate'>{app.company_name}</span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Calendar className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                          <span>Applied {new Date(app.date_applied).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => handleDownloadResume(app.id, app.resume_filename)}
                      className='mt-6 w-full btn-primary'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className='h-4 w-4 mr-2' />
                      Download Resume
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Resumes;
