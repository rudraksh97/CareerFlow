import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Applications = React.lazy(() => import('./pages/Applications'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const ReferralMessages = React.lazy(() => import('./pages/ReferralMessages'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Resumes = React.lazy(() => import('./pages/Resumes'));
const CoverLetters = React.lazy(() => import('./pages/CoverLetters'));
const Resources = React.lazy(() => import('./pages/Resources'));

const App: React.FC = () => {
  return (
    <Layout>
      <Suspense>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/applications' element={<Applications />} />
          <Route path='/contacts' element={<Contacts />} />
          <Route path='/referral-messages' element={<ReferralMessages />} />
          <Route path='/resources' element={<Resources />} />
          <Route path='/analytics' element={<Analytics />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/resumes' element={<Resumes />} />
          <Route path='/cover-letters' element={<CoverLetters />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
