import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Github,
  Linkedin,
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

// Profile Component
const ProfileSection = memo(({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-b border-neutral-200/80`}>
    <AnimatePresence mode='wait'>
      {!isCollapsed ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className='space-y-3'
        >
          {/* Profile Header */}
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full overflow-hidden border-2 border-neutral-200 bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center'>
              <img 
                src='https://github.com/rudraksh97.png'
                alt='Rudraksh Agarwal'
                className='w-full h-full object-cover'
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = img.nextElementSibling as HTMLElement;
                  img.style.display = 'none';
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <User className='w-4 h-4 text-white hidden' />
            </div>
            <div>
              <p className='text-sm font-medium text-neutral-900'>Rudraksh Agarwal</p>
            </div>
          </div>
          
          {/* Social Links */}
          <div className='flex items-center gap-2'>
            <motion.a
              href='https://www.linkedin.com/in/rudraksh97/'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors text-xs group'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Linkedin className='w-3 h-3' />
              <span>LinkedIn</span>
              <ExternalLink className='w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity' />
            </motion.a>
            
            <motion.a
              href='https://github.com/rudraksh97'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-700 transition-colors text-xs group'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github className='w-3 h-3' />
              <span>GitHub</span>
              <ExternalLink className='w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity' />
            </motion.a>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className='flex flex-col items-center gap-2'
        >
          <div className='w-8 h-8 rounded-full overflow-hidden border-2 border-neutral-200 bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center'>
                         <img 
               src='https://github.com/rudraksh97.png'
               alt='Rudraksh Agarwal'
               className='w-full h-full object-cover'
              onError={(e) => {
                const img = e.currentTarget;
                const fallback = img.nextElementSibling as HTMLElement;
                img.style.display = 'none';
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            <User className='w-4 h-4 text-white hidden' />
          </div>
          <div className='flex flex-col gap-1'>
            <motion.a
              href='https://www.linkedin.com/in/rudraksh97/'
              target='_blank'
              rel='noopener noreferrer'
              className='p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors relative group'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin className='w-3 h-3' />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                whileHover={{ opacity: 1, scale: 1, x: 0 }}
                className='absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-50 shadow-lg'
              >
                LinkedIn Profile
                <div className='absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900'></div>
              </motion.div>
            </motion.a>
            
            <motion.a
              href='https://github.com/rudraksh97'
              target='_blank'
              rel='noopener noreferrer'
              className='p-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-700 transition-colors relative group'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className='w-3 h-3' />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                whileHover={{ opacity: 1, scale: 1, x: 0 }}
                className='absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-50 shadow-lg'
              >
                GitHub Profile
                <div className='absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900'></div>
              </motion.div>
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

ProfileSection.displayName = 'ProfileSection';

// Memoized Logo Component
const CareerFlowLogo = memo(({ isCollapsed }: { isCollapsed?: boolean }) => (
  <motion.div
    className='flex items-center gap-3'
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <div className='relative'>
      <motion.div
        className='w-10 h-10 rounded-lg flex items-center justify-center relative bg-neutral-900 shadow-lg'
        whileHover={{ rotate: 2, scale: 1.05 }}
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
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            <motion.path
              d='M16 7H21V12'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </motion.div>
    </div>

    <AnimatePresence mode='wait'>
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
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
        group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative
        ${isCollapsed ? 'justify-center' : ''}
        ${
          isActive
            ? 'bg-gradient-to-r from-neutral-100 to-neutral-50 text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }
      `}
      title={isCollapsed ? item.name : undefined}
    >
      {/* Active indicator line */}
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neutral-800 to-neutral-600 rounded-r-full'
          layoutId='activeIndicatorLine'
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      
      <motion.div
        className={`
          p-1.5 rounded-md transition-all duration-200 relative
          ${
            isActive
              ? 'bg-neutral-900 text-white shadow-lg'
              : 'text-neutral-400 group-hover:text-neutral-600 group-hover:bg-neutral-100'
          }
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <item.icon className='h-4 w-4' />
        {/* Hover tooltip for collapsed mode */}
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            whileHover={{ opacity: 1, scale: 1, x: 0 }}
            className='absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-50 shadow-lg'
          >
            {item.name}
            <div className='absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900'></div>
          </motion.div>
        )}
      </motion.div>
      
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
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='w-2 h-2 bg-neutral-900 rounded-full shadow-sm'
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
const Sidebar = memo(({ 
  currentPath, 
  isOpen, 
  isCollapsed, 
  isMobile, 
  onClose 
}: { 
  currentPath: string; 
  isOpen: boolean; 
  isCollapsed: boolean; 
  isMobile: boolean;
  onClose: () => void;
}) => (
  <AnimatePresence mode='wait'>
    {isOpen && (
      <>
        {/* Mobile overlay */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden'
          />
        )}
        
        {/* Sidebar */}
        <motion.div
          className={`
            flex h-screen flex-col bg-white/95 backdrop-blur-xl border-r border-neutral-200/80 fixed inset-y-0 left-0 z-50 shadow-2xl
            ${isCollapsed ? 'w-20' : 'w-72'}
            ${isMobile ? 'shadow-2xl' : ''}
          `}
          initial={{ x: isCollapsed ? -80 : -288 }}
          animate={{ x: 0 }}
          exit={{ x: isCollapsed ? -80 : -288 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
        >
          {/* Header */}
          <motion.div
            className={`p-6 border-b border-neutral-200/80 ${isCollapsed ? 'px-4' : ''}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CareerFlowLogo isCollapsed={isCollapsed} />
          </motion.div>

          {/* Navigation */}
          <Navigation currentPath={currentPath} isCollapsed={isCollapsed} />

          {/* Footer */}
          <motion.div
            className='border-t border-neutral-200/80'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Profile Section */}
            <ProfileSection isCollapsed={isCollapsed} />
            
            {/* Version Display */}
            <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
              {!isCollapsed && <VersionDisplay />}
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
));

Sidebar.displayName = 'Sidebar';

// Breadcrumb component for when sidebar is hidden
const Breadcrumb = memo(({ currentPath }: { currentPath: string }) => {
  const currentPage = navigation.find(item => item.href === currentPath);
  
  if (!currentPage) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className='flex items-center gap-2 text-sm text-neutral-600'
    >
      <currentPage.icon className='h-4 w-4' />
      <span>{currentPage.name}</span>
    </motion.div>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+B or Ctrl+B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      // Cmd+Shift+B or Ctrl+Shift+B to toggle collapse
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        if (!sidebarOpen) {
          setSidebarOpen(true);
        }
        setSidebarCollapsed(!sidebarCollapsed);
      }
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, sidebarCollapsed, isMobile]);
  
  // Memoize the current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => location.pathname, [location.pathname]);

  // Calculate main content margin based on sidebar state
  const mainContentMargin = useMemo(() => {
    if (isMobile) return '0px';
    return sidebarOpen ? (sidebarCollapsed ? '80px' : '288px') : '0px';
  }, [sidebarOpen, sidebarCollapsed, isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  const toggleSidebarCollapse = useCallback(() => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarOpen, sidebarCollapsed]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className='min-h-screen flex bg-neutral-50'>
      {/* Sidebar */}
      <Sidebar 
        currentPath={currentPath} 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onClose={closeSidebar}
      />

      {/* Main content */}
      <motion.div 
        className='flex-1 flex flex-col min-h-screen'
        style={{ marginLeft: mainContentMargin }}
        animate={{ marginLeft: mainContentMargin }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Enhanced top bar */}
        <motion.header
          className='bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex items-center gap-4'>
            {/* Sidebar controls */}
            <div className='flex items-center gap-2'>
              {/* Main toggle button */}
              <motion.button
                onClick={toggleSidebar}
                className='p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 relative group'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`${sidebarOpen ? 'Hide' : 'Show'} sidebar (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+B)`}
              >
                <motion.div
                  animate={{ rotate: sidebarOpen ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  {sidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
                </motion.div>
              </motion.button>

              {/* Collapse toggle button */}
              <AnimatePresence>
                {sidebarOpen && !isMobile && (
                  <motion.button
                    onClick={toggleSidebarCollapse}
                    className='p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 relative group'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`${sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Shift+B)`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <motion.div
                      transition={{ duration: 0.2 }}
                    >
                      {sidebarCollapsed ? <ChevronRight className='h-5 w-5' /> : <ChevronLeft className='h-5 w-5' />}
                    </motion.div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Breadcrumb when sidebar is hidden */}
            <AnimatePresence>
              {!sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className='border-l border-neutral-200 pl-4'
                >
                  <Breadcrumb currentPath={currentPath} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyboard shortcuts hint */}
          <motion.div
            className='hidden md:flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <kbd className='px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-xs'>
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <span>+</span>
            <kbd className='px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-xs'>B</kbd>
            <span>Toggle sidebar</span>
          </motion.div>
        </motion.header>

        {/* Page content */}
        <main className='flex-1 p-6 lg:p-8 overflow-y-auto bg-neutral-50'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className='max-w-7xl mx-auto'
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
