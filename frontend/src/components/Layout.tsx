import React, { memo, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';

import VersionDisplay from './VersionDisplay';

interface LayoutProps {
  children: React.ReactNode;
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
];

// Memoized Logo Component
const CareerFlowLogo = memo(({ isCollapsed }: { isCollapsed?: boolean }) => (
  <motion.div
    className='flex items-center gap-3'
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <div className='relative'>
      <motion.div
        className='w-10 h-10 rounded-lg flex items-center justify-center relative bg-neutral-900'
        whileHover={{ rotate: 2 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Simple, clean logo icon */}
        <div className='relative z-10'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' className='text-white'>
            <motion.path
              d='M3 17L9 11L13 15L21 7'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <motion.path
              d='M16 7H21V12'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
      </motion.div>
    </div>

    <AnimatePresence mode='wait'>
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className='text-lg font-semibold text-neutral-900'>CareerFlow</h1>
          <p className='text-xs text-neutral-500'>AI Career Intelligence</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
));

CareerFlowLogo.displayName = 'CareerFlowLogo';

// Memoized Navigation Item Component
const NavigationItem = memo(({ item, index, isActive, isCollapsed }: {
  item: typeof navigation[0];
  index: number;
  isActive: boolean;
  isCollapsed: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 * index + 0.3 }}
  >
    <Link
      to={item.href}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
        ${isCollapsed ? 'justify-center' : ''}
        ${
          isActive
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }
      `}
      title={isCollapsed ? item.name : undefined}
    >
      <div
        className={`
          p-1.5 rounded-md transition-all duration-200
          ${
            isActive
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-400 group-hover:text-neutral-600'
          }
        `}
      >
        <item.icon className='h-4 w-4' />
      </div>
      <AnimatePresence mode='wait'>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className='flex-1'
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && !isCollapsed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className='w-1.5 h-1.5 bg-neutral-900 rounded-full'
          layoutId='activeIndicator'
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  </motion.div>
));

NavigationItem.displayName = 'NavigationItem';

// Memoized Navigation Component
const Navigation = memo(({ currentPath, isCollapsed }: { currentPath: string; isCollapsed: boolean }) => {
  return (
    <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
      {navigation.map((item, index) => {
        const isActive = currentPath === item.href;
        return (
          <NavigationItem
            key={item.name}
            item={item}
            index={index}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
        );
      })}
    </nav>
  );
});

Navigation.displayName = 'Navigation';

// Memoized Sidebar Component
const Sidebar = memo(({ currentPath, isOpen, isCollapsed }: { currentPath: string; isOpen: boolean; isCollapsed: boolean }) => (
  <AnimatePresence mode='wait'>
    {isOpen && (
      <motion.div
        className={`flex h-screen flex-col bg-white border-r border-neutral-200 fixed inset-y-0 left-0 z-10 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        initial={{ x: isCollapsed ? -80 : -288 }}
        animate={{ x: 0 }}
        exit={{ x: isCollapsed ? -80 : -288 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Header */}
        <motion.div
          className={`p-6 border-b border-neutral-200 ${isCollapsed ? 'px-4' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CareerFlowLogo isCollapsed={isCollapsed} />
        </motion.div>

        {/* Navigation */}
        <Navigation currentPath={currentPath} isCollapsed={isCollapsed} />

        {/* Footer */}
        <motion.div
          className={`p-4 border-t border-neutral-200 ${isCollapsed ? 'px-2' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {!isCollapsed && <VersionDisplay />}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

Sidebar.displayName = 'Sidebar';

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar preferences from localStorage
  useEffect(() => {
    const savedSidebarOpen = localStorage.getItem('sidebarOpen');
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    
    if (savedSidebarOpen !== null) {
      setSidebarOpen(JSON.parse(savedSidebarOpen));
    }
    if (savedSidebarCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarCollapsed));
    }
  }, []);

  // Save sidebar preferences to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  // Memoize the current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => location.pathname, [location.pathname]);

  // Calculate main content margin based on sidebar state
  const mainContentMargin = sidebarOpen ? (sidebarCollapsed ? '80px' : '288px') : '0px';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className='min-h-screen flex bg-neutral-50'>
      {/* Memoized sidebar */}
      <Sidebar 
        currentPath={currentPath} 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed}
      />

      {/* Main content */}
      <motion.div 
        className='flex-1 flex flex-col min-h-screen transition-all duration-300'
        style={{ marginLeft: mainContentMargin }}
        animate={{ marginLeft: mainContentMargin }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Clean top bar with toggle buttons */}
        <motion.div
          className='bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex items-center gap-3'>
            {/* Sidebar toggle button */}
            <motion.button
              onClick={toggleSidebar}
              className='p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </motion.button>

            {/* Collapse toggle button (only when sidebar is open) */}
            {sidebarOpen && (
              <motion.button
                onClick={toggleSidebarCollapse}
                className='p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <motion.div
                  animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width='20' height='20' viewBox='0 0 24 24' fill='none' className='text-current'>
                    <path
                      d='M15 18L9 12L15 6'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </motion.div>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Page content */}
        <main className='flex-1 p-6 lg:p-8 overflow-y-auto bg-neutral-50'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='max-w-7xl mx-auto'
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
