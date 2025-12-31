
import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { t } from '../utils/translations';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [saved, setSaved] = useState(false);
  const lang = profile.language;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateProfile(profile);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload(); // Refresh to update language UI globally
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card title={t(lang, 'profile')}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
                label={t(lang, 'cycleLength_label')} 
                type="number" 
                value={profile.averageCycleLength} 
                onChange={(e) => setProfile({...profile, averageCycleLength: parseInt(e.target.value) || 28})} 
            />
            <Input 
                label={t(lang, 'periodLength_label')} 
                type="number" 
                value={profile.averagePeriodLength} 
                onChange={(e) => setProfile({...profile, averagePeriodLength: parseInt(e.target.value) || 5})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t(lang, 'language')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, language: 'en' })}
                className={`flex-1 py-3 px-3 rounded-xl border text-sm transition-all ${
                  profile.language === 'en' 
                    ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, language: 'zh' })}
                className={`flex-1 py-3 px-3 rounded-xl border text-sm transition-all ${
                  profile.language === 'zh' 
                    ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                中文
              </button>
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" fullWidth className="py-4 rounded-2xl shadow-lg">
              {saved ? t(lang, 'settingsSaved') : t(lang, 'save')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 text-center">
        <button 
          onClick={() => {
            if(confirm("Clear all data?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-xs text-red-400 hover:text-red-600 underline"
        >
          {t(lang, 'clearData')}
        </button>
      </div>
    </div>
  );
};

export default Profile;
