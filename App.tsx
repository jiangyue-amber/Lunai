
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load pages to isolate dependencies (specifically AI)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Records = lazy(() => import('./pages/Records'));
const PregnancyCheck = lazy(() => import('./pages/PregnancyCheck'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Profile = lazy(() => import('./pages/Profile'));

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
            <Route path="/pregnancy-check" element={<PregnancyCheck />} />
            <Route path="/ai" element={<AIChat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;
