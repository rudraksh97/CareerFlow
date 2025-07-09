import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Briefcase, 
  Users, 
  BarChart3,
  Settings,
  UserCircle,
  FileText,
  Menu, 
  X,
  ChevronRight,
  User,
  Github
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VersionDisplay from './VersionDisplay'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Cover Letters', href: '/cover-letters', icon: FileText },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: UserCircle },
]

function PatsLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
        <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 19V9h4.5a3.5 3.5 0 1 1 0 7H9" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="text-2xl font-extrabold text-neutral-800 tracking-tighter">PATS</span>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200/80">
            <PatsLogo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-neutral-500 hover:text-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-6 px-3">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                      }`} />
                      {item.name}
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <hr className="my-4 border-neutral-200/80" />
            <ul className="space-y-2">
              {secondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                      }`} />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 px-3">
              <VersionDisplay />
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-lg border-r border-neutral-200/80 px-4 pb-4">
          <div className="flex h-20 shrink-0 items-center px-2">
            <PatsLogo />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold leading-6 transition-all duration-200 ${
                          location.pathname === item.href
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            location.pathname === item.href ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {secondaryNavigation.map((item) => (
                     <li key={item.name}>
                     <Link
                       to={item.href}
                       className={`group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold leading-6 transition-all duration-200 ${
                         location.pathname === item.href
                           ? 'bg-primary-50 text-primary-700'
                           : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                       }`}
                     >
                       <item.icon
                         className={`h-5 w-5 shrink-0 ${
                          location.pathname === item.href ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                         }`}
                         aria-hidden="true"
                       />
                       {item.name}
                     </Link>
                   </li>
                  ))}
                </ul>
              </li>
            </ul>
            <div className="mt-4 px-2">
              <VersionDisplay />
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-white/80 backdrop-blur-lg px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-neutral-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            {/* Removed user avatar for minimalist look */}
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 flex-grow"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
        <footer className="py-6 px-4 sm:px-6 lg:px-8 text-right text-sm text-neutral-500">
          <div className="flex justify-between items-center">
            <VersionDisplay />
            <div>
              <a href="https://github.com/rudraksh97/PATS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
                <Github className="h-4 w-4" />
                Source Code
              </a>
              <span className="mx-2">·</span>
              <span>
                Created by{' '}
                <a href="https://github.com/rudraksh97" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-neutral-700 transition-colors">
                  rudraksh97
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 