
import React, { useState, Suspense, lazy } from 'react';
import { LayoutDashboard, Calendar, Baby, User, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { t, Language } from '../utils/translations';

// Lazy load FloatingChat to isolate AI dependency from main layout
const FloatingChat = lazy(() => import('./FloatingChat'));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [profile, setProfile] = useState(StorageService.getProfile());
  const location = useLocation();
  const currentPath = location.pathname;

  // If on onboarding page, return clean layout
  if (currentPath === '/onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {children}
      </div>
    );
  }

  const toggleLanguage = () => {
    const newLang: Language = profile.language === 'en' ? 'zh' : 'en';
    const newProfile = { ...profile, language: newLang };
    StorageService.updateProfile(newProfile);
    setProfile(newProfile);
    window.location.reload(); // Refresh to propagate translation changes
  };

  const navItems = [
    { name: t(profile.language, 'dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t(profile.language, 'records'), path: '/records', icon: Calendar },
    { name: t(profile.language, 'pregnancyCheck'), path: '/pregnancy-check', icon: Baby },
    { name: t(profile.language, 'profile'), path: '/profile', icon: User },
  ];

  const DesktopSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          {t(profile.language, 'appName')}
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 mx-4 mb-4">
         <button 
           onClick={toggleLanguage}
           className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
         >
           <Globe size={16} />
           <span>{profile.language === 'en' ? '中文' : 'English'}</span>
         </button>
      </div>
      <div className="p-6 text-xs text-slate-400">
        v1.4.1
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-100 h-screen sticky top-0">
        <DesktopSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0"> 
        {/* Mobile Header (Simplified) */}
        <div className="md:hidden flex items-center justify-center p-4 bg-white border-b border-slate-100 sticky top-0 z-30">
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {t(profile.language, 'appName')}
          </h1>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
          {children}
        </div>
        
        {/* Wrap FloatingChat in Suspense */}
        <Suspense fallback={null}>
          <FloatingChat />
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-pink-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon size={22} className={isActive ? 'fill-current' : ''} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
