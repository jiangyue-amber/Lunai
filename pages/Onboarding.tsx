
import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { StorageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { t } from '../utils/translations';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  // Read default language from storage to decide initial UI language, 
  // but form will save to profile later.
  const tempProfile = StorageService.getProfile();
  const lang = tempProfile.language;

  const [name, setName] = useState('');
  const [cycleLen, setCycleLen] = useState('28');
  const [periodLen, setPeriodLen] = useState('7'); // Default set to 7
  const [language, setLanguage] = useState<'en' | 'zh'>(lang);

  const handleSave = () => {
    const profile = StorageService.getProfile();
    StorageService.updateProfile({
      ...profile,
      name: name || (language === 'zh' ? '用户' : 'User'),
      language: language,
      averageCycleLength: parseInt(cycleLen) || 28,
      averagePeriodLength: parseInt(periodLen) || 7,
      onboardingCompleted: true
    });
    // Reload to apply language settings globally if changed, 
    // but first navigate effectively. 
    // Using window.location to force full refresh is safer for language switch.
    window.location.href = '#/dashboard';
    window.location.reload(); 
  };

  return (
    <div className="flex items-center justify-center p-4 w-full">
      <Card className="w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <Droplets size={32} />
           </div>
           <h1 className="text-2xl font-bold text-slate-800">{t(language, 'onboarding_welcome')}</h1>
           <p className="text-slate-500 mt-2 text-sm">{t(language, 'onboarding_desc')}</p>
        </div>
        
        <div className="space-y-6">
           {/* Language Selector */}
           <div className="flex gap-2 justify-center mb-6">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('zh')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${language === 'zh' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                中文
              </button>
           </div>

           <Input 
             label={t(language, 'onboarding_name')} 
             value={name} 
             onChange={e => setName(e.target.value)} 
             placeholder={language === 'zh' ? '您的昵称' : 'Your Name'} 
             autoFocus
           />
           
           <div className="space-y-2">
               <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label={t(language, 'cycleLength_label')} 
                    type="number" 
                    value={cycleLen} 
                    onChange={e => setCycleLen(e.target.value)} 
                  />
                  <Input 
                    label={t(language, 'periodLength_label')} 
                    type="number" 
                    value={periodLen} 
                    onChange={e => setPeriodLen(e.target.value)} 
                  />
               </div>
               <p className="text-xs text-slate-400 text-center leading-relaxed px-2">
                 {t(language, 'onboarding_note')}
               </p>
           </div>

           <div className="pt-4">
             <Button fullWidth onClick={handleSave} className="py-3 rounded-2xl shadow-lg shadow-pink-200">
               {t(language, 'getStarted')}
             </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
