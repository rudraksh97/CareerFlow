import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { BarChart3 } from 'lucide-react'

// Type definitions for analytics data
interface DashboardData {
  total_applications: number
  applications_by_status: Record<string, number>
  applications_by_source: Record<string, number>
  success_rate: number
  recent_applications: number
  total_contacts: number
  contacts_by_type: Record<string, number>
  recent_interactions: number
}

interface SourceData {
  [key: string]: {
    total: number
    success_rate: number
  }
}

// Skeleton loading component
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-9 bg-neutral-200 rounded-lg w-32"></div>
        <div className="h-5 bg-neutral-200 rounded w-80"></div>
      </div>

      {/* Dashboard Overview skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-5 bg-neutral-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-neutral-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Source Effectiveness skeleton */}
      <div className="card mb-8 p-6">
        <div className="h-6 bg-neutral-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="h-4 bg-neutral-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-neutral-200 rounded w-32"></div>
              </div>
              <div className="text-right">
                <div className="h-5 bg-neutral-200 rounded w-12 mb-1"></div>
                <div className="h-3 bg-neutral-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution skeleton */}
      <div className="card p-6">
        <div className="h-6 bg-neutral-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-neutral-200 rounded w-20 mb-1 mx-auto"></div>
              <div className="h-6 bg-neutral-200 rounded w-12 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/dashboard/').then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const { data: sourceData, isLoading: sourceLoading, error: sourceError } = useQuery<SourceData>({
    queryKey: ['analytics-source'],
    queryFn: () => api.get('/analytics/applications/source-effectiveness/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })

  if (dashboardLoading || sourceLoading) {
    return <AnalyticsSkeleton />
  }

  if (dashboardError || sourceError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load analytics data</div>
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

  const hasData = dashboardData && dashboardData.total_applications > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
        <p className="text-neutral-600">Track your application performance and insights</p>
      </div>

      {!hasData ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-neutral-100 w-16 h-16 mb-4 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No analytics data yet</h3>
          <p className="text-neutral-600 mb-6">Add applications to see analytics and insights here.</p>
        </div>
      ) : (
        <>
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Applications</h3>
              <p className="text-3xl font-bold text-primary-600">{dashboardData.total_applications}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interviews</h3>
              <p className="text-3xl font-bold text-yellow-600">{dashboardData.applications_by_status?.interview || 0}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Offers</h3>
              <p className="text-3xl font-bold text-green-600">{dashboardData.applications_by_status?.offer || 0}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Success Rate</h3>
              <p className="text-3xl font-bold text-blue-600">{dashboardData.success_rate}%</p>
            </div>
          </div>

          {/* Source Effectiveness */}
          {sourceData && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Source Effectiveness</h2>
              <div className="space-y-4">
                {Object.entries(sourceData).map(([source, data]: [string, any]) => (
                  <div key={source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">{source.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-500">{data.total} applications</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">{data.success_rate}%</p>
                      <p className="text-sm text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Distribution */}
          {dashboardData?.applications_by_status && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Application Status Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardData.applications_by_status).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 capitalize mb-1">{status.replace('_', ' ')}</h3>
                    <p className="text-2xl font-bold text-primary-600">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 