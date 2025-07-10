import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { api } from '@/services/api';

// Type definitions for analytics data
interface DashboardData {
  total_applications: number;
  applications_by_status: Record<string, number>;
  applications_by_source: Record<string, number>;
  success_rate: number;
  recent_applications: number;
  total_contacts: number;
  contacts_by_type: Record<string, number>;
  recent_interactions: number;
}

interface SourceEffectiveness {
  source: string;
  total_applications: number;
  success_rate: number;
  status_breakdown: Record<string, number>;
}

interface SourceData {
  source_effectiveness: SourceEffectiveness[];
}

// Skeleton loading component
function AnalyticsSkeleton() {
  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header skeleton */}
      <div className='flex flex-col gap-2'>
        <div className='h-9 bg-neutral-200 rounded-lg w-32 animate-pulse' />
        <div className='h-5 bg-neutral-200 rounded w-80 animate-pulse' />
      </div>

      {/* Dashboard Overview skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='card p-6 animate-pulse'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='h-4 bg-neutral-200 rounded w-24 mb-2' />
                <div className='h-8 bg-neutral-200 rounded w-16' />
              </div>
              <div className='w-12 h-12 bg-neutral-200 rounded-xl' />
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Source Effectiveness skeleton */}
        <div className='card lg:col-span-2 p-6 animate-pulse'>
          <div className='h-6 bg-neutral-200 rounded w-48 mb-6' />
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-4 bg-neutral-50 rounded-lg'
              >
                <div>
                  <div className='h-4 bg-neutral-200 rounded w-24 mb-1' />
                  <div className='h-3 bg-neutral-200 rounded w-32' />
                </div>
                <div className='text-right'>
                  <div className='h-5 bg-neutral-200 rounded w-12 mb-1' />
                  <div className='h-3 bg-neutral-200 rounded w-20' />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution skeleton */}
        <div className='card p-6 animate-pulse'>
          <div className='h-6 bg-neutral-200 rounded w-48 mb-6' />
          <div className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg'
              >
                <div className='h-4 bg-neutral-200 rounded w-20' />
                <div className='h-6 bg-neutral-200 rounded w-12' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      className='card-interactive p-6 group'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-neutral-600 mb-1 group-hover:text-neutral-700 transition-colors duration-200'>
            {title}
          </p>
          <p className='text-2xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors duration-200'>
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-xl ${bgColor} border transition-all duration-200 group-hover:scale-105`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<DashboardData>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/dashboard/').then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: sourceData,
    isLoading: sourceLoading,
    error: sourceError,
  } = useQuery<SourceData>({
    queryKey: ['analytics-source'],
    queryFn: () => api.get('/analytics/applications/source-effectiveness/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  if (dashboardLoading || sourceLoading) {
    return <AnalyticsSkeleton />;
  }

  if (dashboardError || sourceError) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='text-red-500 mb-4 flex items-center justify-center gap-2'>
            <AlertTriangle className='h-6 w-6' />
            <span className='font-medium'>Failed to load analytics data</span>
          </div>
          <p className='text-neutral-600 mb-4'>
            There was an error loading your analytics. Please try again.
          </p>
          <button onClick={() => window.location.reload()} className='btn-primary'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = dashboardData && dashboardData.total_applications > 0;

  const metrics = [
    {
      name: 'Total Applications',
      value: dashboardData?.total_applications || 0,
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    {
      name: 'Interviews',
      value: dashboardData?.applications_by_status?.interview || 0,
      icon: Users,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-100 border-neutral-200',
    },
    {
      name: 'Offers',
      value: dashboardData?.applications_by_status?.offer || 0,
      icon: TrendingUp,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-100 border-neutral-200',
    },
    {
      name: 'Success Rate',
      value: `${dashboardData?.success_rate || 0}%`,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
  ];

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
      <motion.div variants={itemVariants} className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold gradient-text'>Analytics</h1>
        <p className='text-neutral-600'>Track your application performance and insights</p>
      </motion.div>

      {!hasData ? (
        <motion.div
          variants={itemVariants}
          className='card flex flex-col items-center justify-center py-16 text-center'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className='p-4 rounded-full bg-neutral-100 border-4 border-neutral-50 mb-6'>
            <BarChart3 className='h-12 w-12 text-neutral-400' />
          </div>
          <h3 className='text-lg font-semibold text-neutral-700 mb-2'>No analytics data yet</h3>
          <p className='text-neutral-500 max-w-md'>
            Add applications to see analytics and insights here. Track your progress, success rates,
            and identify the most effective job sources.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Dashboard Overview */}
          <motion.div
            variants={itemVariants}
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
          >
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MetricCard
                  title={metric.name}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  bgColor={metric.bgColor}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Source Effectiveness */}
            <motion.div
              className='card p-6 lg:col-span-2'
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className='text-xl font-semibold text-neutral-900 mb-6 flex items-center gap-2'>
                <Activity className='h-5 w-5 text-blue-600' />
                Source Effectiveness
              </h2>
              <div className='space-y-4'>
                {sourceData?.source_effectiveness.length === 0 ? (
                  <div className='text-center py-8'>
                    <p className='text-neutral-500'>No source data available yet</p>
                  </div>
                ) : (
                  sourceData?.source_effectiveness.map((source, index) => (
                    <motion.div
                      key={source.source}
                      className='flex items-center justify-between p-4 bg-neutral-50 rounded-lg border hover:bg-neutral-100 transition-colors duration-200'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <div>
                        <h3 className='font-semibold text-neutral-800 capitalize'>
                          {source.source.replace(/_/g, ' ')}
                        </h3>
                        <p className='text-sm text-neutral-500'>
                          {source.total_applications} applications
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-blue-600'>{source.success_rate}%</p>
                        <p className='text-sm text-neutral-500'>success rate</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Status Distribution */}
            {dashboardData?.applications_by_status && (
              <motion.div
                className='card p-6'
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className='text-xl font-semibold text-neutral-900 mb-6 flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5 text-blue-600' />
                  Status Distribution
                </h2>
                <div className='space-y-4'>
                  {Object.entries(dashboardData.applications_by_status).map(
                    ([status, count], index) => (
                      <motion.div
                        key={status}
                        className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg border hover:bg-neutral-100 transition-colors duration-200'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <h3 className='font-medium text-neutral-700 capitalize'>
                          {status.replace('_', ' ')}
                        </h3>
                        <p className='text-lg font-bold text-neutral-900'>{count as number}</p>
                      </motion.div>
                    ),
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
