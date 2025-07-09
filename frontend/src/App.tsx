import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Applications = React.lazy(() => import('./pages/Applications'))
const Contacts = React.lazy(() => import('./pages/Contacts'))
const Analytics = React.lazy(() => import('./pages/Analytics'))
const Settings = React.lazy(() => import('./pages/Settings'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Resumes = React.lazy(() => import('./pages/Resumes'))
const CoverLetters = React.lazy(() => import('./pages/CoverLetters'))

const queryClient = new QueryClient()

const App: React.FC = () => {
  return (
    <Layout>
      <Suspense>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/cover-letters" element={<CoverLetters />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App 