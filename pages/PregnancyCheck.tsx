
import React, { useState } from 'react';
import Card from '../components/Card';
import { StorageService } from '../services/storageService';
import { addDays, formatDate, diffInDays } from '../utils/dateHelpers';
import { AlertTriangle, Clock, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../components/Button';
import { t } from '../utils/translations';

const PregnancyCheck: React.FC = () => {
  const profile = StorageService.getProfile();
  const cycles = StorageService.getCycles();
  const sexLogs = StorageService.getSexLogs();
  const lang = profile.language;

  // Filter logs in last 45 days
  const recentLogs = sexLogs.filter(log => diffInDays(new Date(), new Date(log.date)) <= 45);
  
  // State for Accordion: Default to the first (most recent) log being open
  const [expandedId, setExpandedId] = useState<string | null>(recentLogs.length > 0 ? recentLogs[0].id : null);

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t(lang, 'pregnancyCheck')}</h2>
        <p className="text-slate-500 text-sm">Timeline based on medical consensus for detection accuracy.</p>
      </div>

      {recentLogs.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Info size={32} />
          </div>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">{t(lang, 'noRecentActivity')}</p>
          <a href="#/records">
            <Button variant="outline">{t(lang, 'logSex')}</Button>
          </a>
        </Card>
      ) : (
        <div className="space-y-4">
          {recentLogs.map(log => {
            const sexDate = new Date(log.date);
            
            // --- Risk Assessment Logic ---
            // 1. Check if a period started AFTER this sex log
            const periodAfter = cycles.find(c => new Date(c.startDate) > sexDate);
            
            let riskStatus: 'High' | 'Low' = 'High';
            let riskReasonKey = 'riskReason_unprotected';

            if (periodAfter) {
                riskStatus = 'Low';
                riskReasonKey = 'riskReason_period';
            } else if (log.protection === 'Protected') {
                riskStatus = 'Low';
                riskReasonKey = 'riskReason_protected';
            }

            // --- Timeline Logic ---
            const earlyDate = addDays(sexDate, 10);
            const standardDate = addDays(sexDate, 14);
            const confirmDate = addDays(sexDate, 21);
            const today = new Date();
            const getStageStatus = (targetDate: Date) => {
                const diff = diffInDays(today, targetDate);
                if (diff >= 0) return 'ready'; 
                return 'waiting'; 
            };

            const stages = [
                {
                    key: 'earlyTest',
                    date: earlyDate,
                    status: getStageStatus(earlyDate),
                    accuracy: '60-70%',
                    color: 'text-amber-600',
                    bg: 'bg-amber-100'
                },
                {
                    key: 'standardTest',
                    date: standardDate,
                    status: getStageStatus(standardDate),
                    accuracy: '90-95%',
                    color: 'text-blue-600',
                    bg: 'bg-blue-100'
                },
                {
                    key: 'confirmatoryTest',
                    date: confirmDate,
                    status: getStageStatus(confirmDate),
                    accuracy: '>99%',
                    color: 'text-green-600',
                    bg: 'bg-green-100'
                }
            ];

            const isExpanded = expandedId === log.id;

            return (
              <Card key={log.id} className={`relative overflow-hidden transition-all duration-300 ${riskStatus === 'High' && !periodAfter ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-green-400'}`}>
                
                {/* Header (Always Visible) */}
                <div 
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">{t(lang, 'logSex')}: {formatDate(log.date)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.protection === 'Unprotected' ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                            {t(lang, log.protection === 'Protected' ? 'protected' : 'unprotected' as any)}
                        </span>
                    </div>
                    {/* Compact Status Preview when collapsed */}
                    {!isExpanded && (
                        <p className={`text-xs ${riskStatus === 'High' ? 'text-red-500' : 'text-slate-500'}`}>
                            {t(lang, riskReasonKey as any)}
                        </p>
                    )}
                  </div>
                  <div className="p-2 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="mt-6 space-y-6 relative animate-in slide-in-from-top-2 fade-in duration-200">
                        {/* Risk Explanation Box */}
                        <div className={`p-3 rounded-lg text-sm border ${riskStatus === 'High' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                            <div className="flex gap-2 items-start">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <span>{t(lang, riskReasonKey as any)}</span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative space-y-6">
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>
                            {stages.map((stage) => {
                                const isReady = stage.status === 'ready';
                                return (
                                    <div key={stage.key} className={`flex items-start gap-4 ${!isReady ? 'opacity-50 grayscale' : ''}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 ${isReady ? stage.bg : 'bg-slate-100'}`}>
                                            {isReady ? <CheckCircle2 size={20} className={stage.color} /> : <Clock size={20} className="text-slate-400" />}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className={`font-semibold ${isReady ? 'text-slate-800' : 'text-slate-500'}`}>{t(lang, stage.key as any)}</h4>
                                                <span className={`text-xs font-mono font-bold ${isReady ? stage.color : 'text-slate-400'}`}>
                                                    {formatDate(stage.date)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-1">{t(lang, `${stage.key}Desc` as any)}</p>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100">
                                                <AlertTriangle size={10} />
                                                {t(lang, 'accuracy', [stage.accuracy])}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
              </Card>
            );
          })}
          
          <p className="text-xs text-slate-400 text-center italic py-4">
            {t(lang, 'disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PregnancyCheck;
