import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Building, Briefcase, Mail, Upload, Plus } from 'lucide-react';

import TemplateFileManager from '@/components/TemplateFileManager';
import { api } from '@/services/api';
import { Application } from '@/types';

interface ApplicationWithCoverLetter extends Application {
  cover_letter_filename?: string;
}

const fetchCoverLetters = async (): Promise<ApplicationWithCoverLetter[]> => {
  const { data } = await api.get('/cover-letters/');
  return data;
};

export default function CoverLetters() {
  const {
    data: applications,
    isLoading,
    error,
  } = useQuery<ApplicationWithCoverLetter[]>({
    queryKey: ['applications', 'cover-letters'],
    queryFn: fetchCoverLetters,
  });

  const coverLetterApplications = applications?.filter(app => app.cover_letter_filename) || [];

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
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const handleDownload = (applicationId: string) => {
    window.open(`${api.defaults.baseURL}/applications/${applicationId}/cover-letter`, '_blank');
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
          <Mail className='h-4 w-4 text-neutral-600' />
          <span className='text-sm font-medium text-neutral-700'>Cover Letter Library</span>
        </div>
        <h1 className='text-3xl lg:text-4xl font-bold gradient-text'>Cover Letters</h1>
        <p className='text-lg text-neutral-600'>Browse and download your submitted cover letters</p>
      </motion.div>

      {/* Cover Letter Management Interface */}
      <motion.div variants={itemVariants} className='space-y-6'>
        {/* Quick Actions */}
        <div className='card p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-neutral-900'>Cover Letter Management</h3>
            <div className='flex items-center gap-3'>
              <motion.a
                href='/applications'
                className='btn-secondary text-sm'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Application
              </motion.a>
            </div>
          </div>

          {coverLetterApplications &&
            coverLetterApplications.length === 0 &&
            !isLoading &&
            !error && (
            <div className='text-center py-8'>
              <div className='p-4 rounded-full bg-neutral-100 w-fit mx-auto mb-4'>
                <FileText className='h-8 w-8 text-neutral-400' />
              </div>
              <p className='text-neutral-600'>
                  Upload cover letters when you add job applications to track and manage them here.
              </p>
            </div>
          )}

          {coverLetterApplications && coverLetterApplications.length > 0 && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 rounded-lg bg-neutral-50 border border-neutral-200'>
                <div className='flex items-center gap-3 mb-2'>
                  <Upload className='h-5 w-5 text-neutral-600' />
                  <span className='font-medium text-neutral-900'>Upload with Application</span>
                </div>
                <p className='text-sm text-neutral-600'>
                  Add a new job application and upload your cover letter file to track it here.
                </p>
              </div>

              <div className='p-4 rounded-lg bg-neutral-50 border border-neutral-200'>
                <div className='flex items-center gap-3 mb-2'>
                  <FileText className='h-5 w-5 text-neutral-600' />
                  <span className='font-medium text-neutral-900'>Total Cover Letters</span>
                </div>
                <p className='text-sm text-neutral-600'>
                  {coverLetterApplications?.length || 0} cover letter
                  {(coverLetterApplications?.length || 0) !== 1 ? 's' : ''} uploaded
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cover Letter Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className='card p-6 animate-pulse'>
                <div className='h-5 bg-neutral-200 rounded w-3/4 mb-4' />
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
              Failed to load cover letters
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
        ) : coverLetterApplications.length > 0 ? (
          <motion.div
            className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {coverLetterApplications.map((app, index) => (
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
                          title={app.cover_letter_filename}
                        >
                          {app.cover_letter_filename}
                        </h3>
                      </div>
                    </div>

                    <div className='space-y-3 text-sm text-neutral-600'>
                      <div className='flex items-center gap-3'>
                        <Building className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                        <span className='truncate' title={app.company_name}>
                          {app.company_name}
                        </span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <Briefcase className='h-4 w-4 text-neutral-400 flex-shrink-0' />
                        <span className='truncate' title={app.job_title}>
                          {app.job_title}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleDownload(app.id)}
                    className='mt-6 w-full btn-primary'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Download Letter
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* Template Cover Letters Section */}
        <motion.div variants={itemVariants}>
          <TemplateFileManager fileType='cover_letter' title='Cover Letters' />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
