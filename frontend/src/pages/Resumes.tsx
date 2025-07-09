import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { Download, Building, Briefcase, Calendar, FileText } from 'lucide-react';

interface Application {
    id: string;
    company_name: string;
    job_title: string;
    date_applied: string;
    resume_filename: string;
}

const Resumes = () => {
    const { data: applications, isLoading } = useQuery<Application[]>({
        queryKey: ['resumes'],
        queryFn: () => api.get('/resumes/').then(res => res.data),
    });

    const handleDownloadResume = async (applicationId: string, filename: string) => {
        try {
          const response = await api.get(`/applications/${applicationId}/resume`, {
            responseType: 'blob'
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Resumes</h1>
                <p className="text-neutral-600 mt-1">View and manage all your submitted resumes</p>
            </div>
            
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl border border-neutral-200 animate-pulse">
                            <div className="h-5 bg-neutral-200 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-6"></div>
                            <div className="h-10 bg-neutral-200 rounded-lg w-full"></div>
                        </div>
                    ))}
                </div>
            ) : applications && applications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.map(app => (
                        <motion.div 
                            key={app.id}
                            className="bg-white p-6 rounded-2xl border border-neutral-200 hover:shadow-lg hover:border-blue-500 transition-all duration-300 flex flex-col justify-between"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div>
                                <h3 className="font-bold text-lg text-neutral-800 truncate mb-3" title={app.resume_filename}>
                                    {app.resume_filename}
                                </h3>
                                <div className="space-y-2 text-sm text-neutral-600">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-neutral-400" />
                                        <span>{app.job_title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-neutral-400" />
                                        <span>{app.company_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-neutral-400" />
                                        <span>{new Date(app.date_applied).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDownloadResume(app.id, app.resume_filename)}
                                className="mt-6 w-full flex items-center justify-center gap-2 text-sm bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Download size={16} />
                                <span>Download</span>
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                    <FileText className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-4 text-lg font-semibold text-neutral-800">No resumes found</h3>
                    <p className="mt-1 text-neutral-600">
                        When you upload resumes with your applications, they will appear here.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default Resumes; 