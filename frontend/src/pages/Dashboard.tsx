import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  TrendingUp,
  Target,
  Plus,
  User,
  BarChart3,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../services/api';

interface DashboardStats {
  totalApplications: number;
  totalContacts: number;
  appliedThisWeek: number;
  interviewsScheduled: number;
  responseRate: number;
  averageResponseTime: number;
}

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  date_applied: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
}

const quickActions = [
  {
    name: 'Add Application',
    description: 'Track your next opportunity',
    href: '/applications',
    icon: Plus,
    color: 'text-blue-600',
  },
  {
    name: 'Add Contact',
    description: 'Expand your network',
    href: '/contacts',
    icon: User,
    color: 'text-green-600',
  },
  {
    name: 'View Analytics',
    description: 'Discover insights',
    href: '/analytics',
    icon: BarChart3,
    color: 'text-purple-600',
  },
  {
    name: 'Upload Resume',
    description: 'Perfect your story',
    href: '/resumes',
    icon: FileText,
    color: 'text-orange-600',
  },
];

// Clean Loading Component
const CleanLoader = () => (
  <motion.div
    className='flex items-center justify-center h-64'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className='loading-accent' />
    <span className='ml-3 text-neutral-600'>Loading dashboard...</span>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalContacts: 0,
    appliedThisWeek: 0,
    interviewsScheduled: 0,
    responseRate: 0,
    averageResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [applicationsRes, contactsRes] = await Promise.all([
          api.get('/applications/'),
          api.get('/contacts/'),
        ]);

        const applications: Application[] = applicationsRes.data;
        const contacts: Contact[] = contactsRes.data;

        const totalApps = applications.length;
        const totalContacts = contacts.length;

        if (totalApps > 0 || totalContacts > 0) {
          setHasData(true);
        }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const appliedThisWeek = applications.filter(
          (app: Application) => new Date(app.date_applied) >= oneWeekAgo,
        ).length;

        const interviewsScheduled = applications.filter(
          (app: Application) => app.status === 'interview',
        ).length;

        const responseCount = applications.filter(
          (app: Application) =>
            app.status === 'interview' || app.status === 'offer' || app.status === 'rejected',
        ).length;

        const responseRate = totalApps > 0 ? (responseCount / totalApps) * 100 : 0;
        const avgResponseTime = responseCount > 0 ? 5.2 : 0;

        setStats({
          totalApplications: totalApps,
          totalContacts,
          appliedThisWeek,
          interviewsScheduled,
          responseRate,
          averageResponseTime: avgResponseTime,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <CleanLoader />;
  }

  // Empty state when no data
  if (!hasData) {
    return (
      <motion.div
        className='max-w-4xl mx-auto py-12'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className='text-center space-y-8'
        >
          {/* Welcome Hero */}
          <motion.div
            className='space-y-6'
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
            }}
            initial='hidden'
            animate='show'
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                show: { opacity: 1, scale: 1 },
              }}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200'
            >
              <Activity className='h-4 w-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-700'>Welcome to CareerFlow</span>
            </motion.div>

            <motion.h1
              className='text-4xl lg:text-5xl font-bold text-neutral-900'
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              Take control of your
              <br />
              <span className='gradient-text'>career journey</span>
            </motion.h1>

            <motion.p
              className='text-lg text-neutral-600 max-w-2xl mx-auto'
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              Your AI-powered career intelligence platform. Transform job hunting from chaos to
              clarity.
            </motion.p>
          </motion.div>

          {/* Getting Started Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className='card p-8 max-w-3xl mx-auto'
          >
            <motion.div
              className='text-center mb-8'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className='text-xl lg:text-2xl font-semibold text-neutral-900 mb-2'>
                Get started with your first action
              </h2>
              <p className='text-neutral-600'>Choose how you'd like to begin</p>
            </motion.div>

            <motion.div
              className='grid grid-cols-1 md:grid-cols-2 gap-4'
              variants={{
                show: { transition: { staggerChildren: 0.1 } },
              }}
              initial='hidden'
              animate='show'
            >
              {quickActions.map(action => (
                <motion.a
                  key={action.name}
                  href={action.href}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className='action-card'
                  whileHover={{
                    scale: 1.02,
                    transition: { type: 'spring', stiffness: 400, damping: 25 },
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex items-center gap-4'>
                    <motion.div
                      className={`p-3 rounded-lg bg-neutral-100 ${action.color}`}
                      whileHover={{
                        scale: 1.1,
                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                      }}
                    >
                      <action.icon className='h-5 w-5' />
                    </motion.div>
                    <div className='flex-1 text-left'>
                      <div className='font-semibold text-neutral-900'>{action.name}</div>
                      <div className='text-sm text-neutral-600'>{action.description}</div>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <ArrowRight className='h-4 w-4 text-neutral-400' />
                    </motion.div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Dashboard with data
  const statCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: Briefcase,
      href: '/applications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Network Contacts',
      value: stats.totalContacts,
      icon: Users,
      href: '/contacts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Applied This Week',
      value: stats.appliedThisWeek,
      icon: TrendingUp,
      href: '/applications',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      icon: Target,
      href: '/applications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        className='max-w-6xl mx-auto py-8 space-y-8'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='text-center space-y-4'
        >
          <motion.div
            className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200'
            whileHover={{ scale: 1.05 }}
          >
            <Activity className='h-4 w-4 text-blue-600' />
            <span className='text-sm font-medium text-blue-700'>Career Dashboard</span>
          </motion.div>

          <motion.h1
            className='text-3xl lg:text-4xl font-bold text-neutral-900'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            Your career progress
          </motion.h1>

          <motion.p
            className='text-neutral-600 max-w-2xl mx-auto'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Track your journey to success with real-time insights
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className='grid grid-cols-2 lg:grid-cols-4 gap-6'
          variants={{
            show: { transition: { staggerChildren: 0.1 } },
          }}
          initial='hidden'
          animate='show'
        >
          {statCards.map((card, index) => (
            <motion.a
              key={card.title}
              href={card.href}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className='card-interactive'
              whileHover={{
                y: -4,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <motion.div
                    className={`p-2 rounded-lg ${card.bgColor}`}
                    whileHover={{
                      scale: 1.1,
                      transition: { type: 'spring', stiffness: 400, damping: 25 },
                    }}
                  >
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </motion.div>
                </div>
                <motion.div
                  className='text-3xl font-bold text-neutral-900 mb-2'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  {card.value}
                </motion.div>
                <div className='text-sm text-neutral-600 font-medium'>{card.title}</div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='card p-8'
        >
          <div className='text-center mb-8'>
            <motion.h2
              className='text-xl lg:text-2xl font-semibold text-neutral-900 mb-2'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Quick Actions
            </motion.h2>
            <motion.p
              className='text-neutral-600'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Common tasks to keep you moving forward
            </motion.p>
          </div>

          <motion.div
            className='grid grid-cols-1 md:grid-cols-2 gap-4'
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
            }}
            initial='hidden'
            animate='show'
          >
            {quickActions.map(action => (
              <motion.a
                key={action.name}
                href={action.href}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
                className='action-card'
                whileHover={{
                  scale: 1.02,
                  x: 4,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex items-center gap-4'>
                  <motion.div
                    className={`p-3 rounded-lg bg-neutral-100 ${action.color}`}
                    whileHover={{
                      scale: 1.1,
                      transition: { type: 'spring', stiffness: 400, damping: 25 },
                    }}
                  >
                    <action.icon className='h-4 w-4' />
                  </motion.div>
                  <div className='flex-1'>
                    <div className='font-semibold text-neutral-900 text-sm'>{action.name}</div>
                    <div className='text-xs text-neutral-600'>{action.description}</div>
                  </div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <ArrowRight className='h-4 w-4 text-neutral-400' />
                  </motion.div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
