import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Application } from '@/types'
import { motion } from 'framer-motion'
import { FileText, Download, Building, Briefcase } from 'lucide-react'

const fetchCoverLetters = async (): Promise<Application[]> => {
  const { data } = await api.get('/cover-letters/')
  return data
}

export default function CoverLetters() {
  const { data: applications, isLoading, error } = useQuery<Application[]>({
    queryKey: ['applications', 'cover-letters'],
    queryFn: fetchCoverLetters,
  })

  const coverLetterApplications = applications?.filter(app => app.cover_letter_filename) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  }

  const handleDownload = (applicationId: string, filename: string) => {
    window.open(`${api.defaults.baseURL}/applications/${applicationId}/cover-letter`, '_blank');
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Cover Letters</h1>
          <p className="text-neutral-600 mt-1">
            Browse and download your submitted cover letters.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-neutral-200 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-neutral-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load cover letters. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && (
        coverLetterApplications.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {coverLetterApplications.map((app) => (
              <motion.div 
                key={app.id} 
                className="bg-white p-5 rounded-2xl border border-neutral-200 hover:shadow-lg hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
                variants={itemVariants}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800 truncate" title={app.cover_letter_filename!}>
                        {app.cover_letter_filename}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-neutral-600">
                     <div className="flex items-center gap-2">
                      <Building size={14} className="text-neutral-400" />
                      <span className="truncate" title={app.company_name}>{app.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-neutral-400" />
                      <span className="truncate" title={app.job_title}>{app.job_title}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(app.id, app.cover_letter_filename!)}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <FileText className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-semibold text-neutral-800">No cover letters found</h3>
            <p className="mt-1 text-neutral-600">
              When you upload cover letters with your applications, they will appear here.
            </p>
          </div>
        )
      )}
    </motion.div>
  )
} 