
import React, { useState, Suspense, lazy } from 'react';
import { Bot, X, Loader2 } from 'lucide-react';
import { t } from '../utils/translations';
import { StorageService } from '../services/storageService';

// Lazy load the AI Chat page/component
const AIChat = lazy(() => import('../pages/AIChat'));

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const profile = StorageService.getProfile();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-full shadow-lg shadow-purple-200 hover:scale-105 transition-transform flex items-center gap-2 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Bot size={24} />
        <span className="font-semibold text-sm hidden md:inline">{t(profile.language, 'askAi')}</span>
      </button>

      {/* Modal / Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-0 md:items-end md:justify-end md:inset-auto md:bottom-24 md:right-6">
          <div className="bg-white w-full md:w-[400px] h-[80vh] md:h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Bot size={18} className="text-pink-500"/>
                Luna AI
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-50">
               <Suspense fallback={
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                   <Loader2 className="animate-spin" />
                   <span className="text-xs">Connecting to Luna...</span>
                 </div>
               }>
                 <AIChat />
               </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
