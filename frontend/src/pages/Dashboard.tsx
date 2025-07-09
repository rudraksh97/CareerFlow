import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Building, Activity, Plus, ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Type definitions for analytics data
interface AnalyticsData {
  total_applications: number
  applications_by_status: Record<string, number>
  applications_by_source: Record<string, number>
  success_rate: number
  recent_applications: number
  total_contacts: number
  contacts_by_type: Record<string, number>
  recent_interactions: number
}

interface Application {
  id: string
  company_name: string
  job_title: string
  status: string
  date_applied: string
}

// Skeleton loading component
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-9 bg-neutral-200 rounded-lg w-48"></div>
        <div className="h-5 bg-neutral-200 rounded w-80"></div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-neutral-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center p-4 rounded-xl border border-neutral-200">
                <div className="w-11 h-11 bg-neutral-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-neutral-200 rounded w-48"></div>
                </div>
                <div className="w-4 h-4 bg-neutral-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            <div className="flex items-center p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="w-8 h-8 bg-neutral-200 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-neutral-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['dashboard-analytics'],
    queryFn: () => api.get('/analytics/dashboard/').then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const { data: recentActivity, isLoading: activityLoading } = useQuery<Application[]>({
    queryKey: ['recent-applications'],
    queryFn: () => api.get('/applications/recent/').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load dashboard data</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      name: 'Total Applications',
      value: analytics?.total_applications || 0,
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Interviews',
      value: analytics?.applications_by_status?.interview || 0,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      name: 'Offers',
      value: analytics?.applications_by_status?.offer || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      name: 'Success Rate',
      value: `${analytics?.success_rate || 0}%`,
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ]

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const quickActions = [
    {
      name: 'Add Application',
      description: 'Track a new job application',
      href: '/applications',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Add Contact',
      description: 'Add a new professional contact',
      href: '/contacts',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      name: 'View Analytics',
      description: 'Detailed insights and trends',
      href: '/analytics',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <motion.div
      key="dashboard-content"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Track your job search progress and insights</p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <motion.div variants={itemVariants} key={metric.name} className="card p-6 hover:card-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${metric.bgColor} ${metric.borderColor} border`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions & Recent Activity */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="card p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group flex items-center p-4 rounded-xl border border-neutral-200/80 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                >
                  <div className={`p-2.5 rounded-lg ${action.bgColor} border ${action.borderColor} mr-4`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-neutral-500">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-500 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="card p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Recent Activity</h2>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="animate-pulse w-8 h-8 bg-neutral-200 rounded-lg mr-4"></div>
                    <div className="flex-1 space-y-2">
                      <div className="animate-pulse h-4 bg-neutral-200 rounded w-3/4"></div>
                      <div className="animate-pulse h-3 bg-neutral-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((app) => (
                  <div key={app.id} className="flex items-center p-4 rounded-xl bg-neutral-50/70 border border-neutral-200/80">
                    <div className="p-2 bg-white rounded-lg border border-neutral-200 mr-4">
                      <Building className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-800">{app.job_title}</p>
                      <p className="text-sm text-neutral-500">{app.company_name} - <span className="capitalize">{app.status}</span></p>
                    </div>
                    <div className="text-sm text-neutral-500">{new Date(app.date_applied).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-neutral-500">No recent activity.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
  )
} 