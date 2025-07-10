import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  MessageSquare
} from 'lucide-react'
import VersionDisplay from './VersionDisplay'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Cover Letters', href: '/cover-letters', icon: FileText },
  { name: 'Referral Messages', href: '/referral-messages', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Clean Professional Logo Component
const CareerFlowLogo = () => (
  <motion.div 
    className="flex items-center gap-3"
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <div className="relative">
      <motion.div 
        className="w-10 h-10 rounded-lg flex items-center justify-center relative bg-neutral-900"
        whileHover={{ rotate: 2 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Simple, clean logo icon */}
        <div className="relative z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
            <motion.path
              d="M3 17L9 11L13 15L21 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <motion.path
              d="M16 7H21V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </div>
    
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h1 className="text-lg font-semibold text-neutral-900">
        CareerFlow
      </h1>
      <p className="text-xs text-neutral-500">
        AI Career Intelligence
      </p>
    </motion.div>
  </motion.div>
)

export default function Layout({ children }: LayoutProps) {
  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Clean sidebar */}
      <motion.div 
        className="flex h-screen flex-col bg-white border-r border-neutral-200 fixed inset-y-0 left-0 w-72 z-10"
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Header */}
        <motion.div 
          className="p-6 border-b border-neutral-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CareerFlowLogo />
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item, index) => {
            const isActive = currentPath === item.href
            return (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-neutral-100 text-neutral-900' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }
                `}
                whileHover={{ 
                  x: 4,
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    ${isActive 
                      ? 'bg-neutral-900 text-white' 
                      : 'text-neutral-400 group-hover:text-neutral-600'
                    }
                  `}
                  whileHover={{ 
                    scale: isActive ? 1 : 1.05
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <item.icon className="h-4 w-4" />
                </motion.div>
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 bg-neutral-900 rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.a>
            )
          })}
        </nav>

        {/* Footer */}
        <motion.div 
          className="p-4 border-t border-neutral-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <VersionDisplay />
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '288px' }}>
        {/* Clean top bar */}
        <motion.div 
          className="bg-white border-b border-neutral-200 px-6 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Breadcrumb or page title could go here */}
        </motion.div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-neutral-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 