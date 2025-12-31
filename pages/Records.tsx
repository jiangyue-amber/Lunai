
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { StorageService } from '../services/storageService';
import { toISODate, formatDate, diffInDays, addDays } from '../utils/dateHelpers';
import { Droplets, Heart, Pencil, Trash2, ChevronLeft, ChevronRight, Check, FileText } from 'lucide-react';
import { t } from '../utils/translations';
import { CycleLog, SexLog, DailyLog } from '../types';

const Records: React.FC = () => {
  const [profile] = useState(StorageService.getProfile());
  const [activeTab, setActiveTab] = useState<'period' | 'sex'>('period');
  const lang = profile.language;
  
  // Data State
  const [historyCycles, setHistoryCycles] = useState<CycleLog[]>([]);
  const [historySex, setHistorySex] = useState<SexLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});

  // Period Logging State (Calendar)
  const [calendarDate, setCalendarDate] = useState(new Date());
  // periodDays tracks visual "Red" cycle days
  const [periodDays, setPeriodDays] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
  
  // Details for the selected date
  const [currentFlow, setCurrentFlow] = useState<'Light' | 'Medium' | 'Heavy' | undefined>(undefined);
  const [currentNote, setCurrentNote] = useState('');
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([]);

  // Sex Form State
  const [sexDate, setSexDate] = useState(toISODate(new Date()));
  const [protection, setProtection] = useState<'Protected' | 'Unprotected'>('Protected');
  const [editingSexId, setEditingSexId] = useState<string | null>(null);

  const SYMPTOMS_LIST = [
    'cramps', 'breastPain', 'headache', 'bloating', 
    'spotting', 'acne', 'moodSwings', 'fatigue'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cycles = StorageService.getCycles();
    setHistoryCycles(cycles);
    setHistorySex(StorageService.getSexLogs());
    setDailyLogs(StorageService.getDailyLogs());

    const days = new Set<string>();
    cycles.forEach(cycle => {
      const start = new Date(cycle.startDate);
      let end = cycle.endDate ? new Date(cycle.endDate) : new Date();
      // Visual cap for ongoing to prevent rendering infinite
      if (diffInDays(end, start) > 60) end = addDays(start, 60);

      const curr = new Date(start);
      while (curr <= end) {
        days.add(toISODate(curr));
        curr.setDate(curr.getDate() + 1);
      }
    });
    setPeriodDays(days);
  };

  // --- Calendar Logic ---

  const handlePeriodDayToggle = (isoDate: string) => {
    const newDays = new Set<string>(periodDays);
    if (newDays.has(isoDate)) {
      newDays.delete(isoDate);
    } else {
      newDays.add(isoDate);
    }
    setPeriodDays(newDays);
    setSelectedDate(isoDate);
    // When toggling period day, we update the Cycles structure
    saveCycleStructure(newDays);
  };

  const saveCycleStructure = (currentDays: Set<string>) => {
    const sortedDays = Array.from(currentDays).sort();
    const newCycles: CycleLog[] = [];
    if (sortedDays.length > 0) {
      let currentStart = sortedDays[0];
      let currentPrev = sortedDays[0];

      for (let i = 1; i < sortedDays.length; i++) {
        const day = sortedDays[i];
        const prev = new Date(currentPrev);
        const curr = new Date(day);
        
        if (diffInDays(curr, prev) === 1) {
          currentPrev = day; 
        } else {
          newCycles.push({
            id: `cycle-${currentStart}`,
            startDate: currentStart,
            endDate: currentPrev,
          });
          currentStart = day;
          currentPrev = day;
        }
      }
      newCycles.push({
        id: `cycle-${currentStart}`,
        startDate: currentStart,
        endDate: currentPrev,
      });
    }

    // Preserve IDs if start date matches (simple heuristic)
    const mergedCycles = newCycles.map(nc => {
      const old = historyCycles.find(oc => oc.startDate === nc.startDate);
      if (old) {
        return { ...nc, id: old.id };
      }
      return nc;
    });

    StorageService.saveCycles(mergedCycles);
    setHistoryCycles(mergedCycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
  };

  // --- Detail Panel Logic (DAILY LOG) ---
  const handleDetailUpdate = (field: 'flow' | 'notes' | 'symptoms', value: any) => {
    if (!selectedDate) return;

    // We no longer update the cycle. We update the Daily Log.
    const newLog: DailyLog = {
        date: selectedDate,
        flow: currentFlow,
        notes: currentNote,
        symptoms: currentSymptoms
    };

    // Update specific field
    if (field === 'flow') newLog.flow = value;
    if (field === 'notes') newLog.notes = value;
    if (field === 'symptoms') newLog.symptoms = value;

    StorageService.saveDailyLog(newLog);
    
    // Update local state
    setDailyLogs(prev => ({...prev, [selectedDate]: newLog}));
    if (field === 'flow') setCurrentFlow(value);
    if (field === 'notes') setCurrentNote(value);
    if (field === 'symptoms') setCurrentSymptoms(value);

    // If flow is set and it's not a period day, toggle it on? 
    // Usually if flow exists, it's a period day.
    if (value && field === 'flow' && !periodDays.has(selectedDate)) {
        handlePeriodDayToggle(selectedDate);
    }
  };

  const toggleSymptom = (symptom: string) => {
      const newSymptoms = currentSymptoms.includes(symptom)
          ? currentSymptoms.filter(s => s !== symptom)
          : [...currentSymptoms, symptom];
      handleDetailUpdate('symptoms', newSymptoms);
  };

  const toggleFlow = (flow: 'Light' | 'Medium' | 'Heavy') => {
      const newFlow = currentFlow === flow ? undefined : flow;
      handleDetailUpdate('flow', newFlow);
  };

  // When selected date changes, load that day's log
  useEffect(() => {
    if (selectedDate) {
        const log = dailyLogs[selectedDate];
        if (log) {
            setCurrentFlow(log.flow);
            setCurrentNote(log.notes || '');
            setCurrentSymptoms(log.symptoms || []);
        } else {
            setCurrentFlow(undefined);
            setCurrentNote('');
            setCurrentSymptoms([]);
        }
    }
  }, [selectedDate, dailyLogs]);


  // --- Calendar Render Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isoDate = toISODate(dateObj);
      const isPeriod = periodDays.has(isoDate);
      const isSelected = selectedDate === isoDate;
      const isToday = isoDate === toISODate(new Date());
      const hasDailyInfo = dailyLogs[isoDate] && (dailyLogs[isoDate].notes || (dailyLogs[isoDate].symptoms && dailyLogs[isoDate].symptoms!.length > 0));

      days.push(
        <button
          key={d}
          onClick={() => setSelectedDate(isoDate)} 
          title={hasDailyInfo ? t(lang, 'notes') : ''}
          className={`h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 relative
            ${isPeriod ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'text-slate-600 hover:bg-slate-100'}
            ${isSelected ? 'ring-2 ring-pink-300 ring-offset-2' : ''}
            ${!isPeriod && isToday ? 'bg-slate-200 font-bold' : ''}
          `}
          onDoubleClick={() => handlePeriodDayToggle(isoDate)}
        >
          {d}
          {/* Small gray dot for notes/symptoms */}
          {hasDailyInfo && (
              <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isPeriod ? 'bg-white/70' : 'bg-slate-400'}`}></span>
          )}
          {isPeriod && isSelected && <Check size={12} className="absolute top-0 right-0 -mr-1 -mt-1 bg-white text-pink-500 rounded-full p-0.5" />}
        </button>
      );
    }
    return days;
  };

  // --- Sex Logging Handlers ---
  const handleSexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sexData: SexLog = {
      id: editingSexId || Date.now().toString(),
      date: sexDate,
      protection: protection,
    };
    if (editingSexId) {
      StorageService.updateSexLog(sexData);
    } else {
      StorageService.addSexLog(sexData);
    }
    loadData();
    resetSexForm();
  };

  const resetSexForm = () => {
    setEditingSexId(null);
    setSexDate(toISODate(new Date()));
    setProtection('Protected');
  };

  const onDeleteSex = (id: string) => {
    if (confirm(t(lang, 'confirmDelete'))) {
        StorageService.deleteSexLog(id);
        loadData();
    }
  };

  const onEditSex = (log: SexLog) => {
      setEditingSexId(log.id);
      setSexDate(log.date);
      setProtection(log.protection);
      window.scrollTo({top:0, behavior:'smooth'});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('period')}
          className={`flex-1 py-4 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'period' ? 'bg-pink-500 text-white shadow-lg shadow-pink-100' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Droplets size={18} />
          <span>{t(lang, 'logPeriod')}</span>
        </button>
        <button
          onClick={() => setActiveTab('sex')}
          className={`flex-1 py-4 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'sex' ? 'bg-purple-500 text-white shadow-lg shadow-purple-100' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Heart size={18} />
          <span>{t(lang, 'logSex')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* === PERIOD TAB CONTENT === */}
        {activeTab === 'period' && (
          <>
            {/* Calendar Logger */}
            <div className="md:col-span-2">
               <Card title={t(lang, 'logPeriod')} className="min-h-[400px]">
                 <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ChevronLeft size={24}/>
                    </button>
                    <span className="text-lg font-bold text-slate-800">
                        {calendarDate.toLocaleDateString(profile.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ChevronRight size={24}/>
                    </button>
                 </div>

                 <p className="text-center text-sm text-slate-400 mb-4">{t(lang, 'tapToLog')}</p>

                 <div className="grid grid-cols-7 gap-y-4 mb-4">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-slate-300 uppercase">{d}</div>
                    ))}
                    {renderCalendar()}
                 </div>

                 {/* Details Panel */}
                 <div className="mt-8 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800">{t(lang, 'detailsFor', [formatDate(selectedDate)])}</h4>
                        {/* Toggle Period Status Button for selected date */}
                        <button 
                            onClick={() => handlePeriodDayToggle(selectedDate)}
                            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                                periodDays.has(selectedDate)
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {periodDays.has(selectedDate) ? 'Remove Period' : 'Mark as Period'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Flow */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t(lang, 'flow')}</label>
                            <div className="flex gap-2">
                                {['Light', 'Medium', 'Heavy'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => toggleFlow(f as any)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                                    currentFlow === f 
                                        ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold' 
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {t(lang, f.toLowerCase() as any)}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t(lang, 'symptoms')}</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {SYMPTOMS_LIST.map((sym) => (
                                    <button
                                        key={sym}
                                        onClick={() => toggleSymptom(sym)}
                                        className={`py-2 px-2 rounded-lg text-xs border transition-all truncate ${
                                            currentSymptoms.includes(sym)
                                            ? 'border-pink-400 bg-pink-100 text-pink-800 font-medium'
                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {t(lang, `sym_${sym}` as any)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t(lang, 'notes')}</label>
                            <input 
                                type="text" 
                                value={currentNote}
                                onChange={(e) => handleDetailUpdate('notes', e.target.value)}
                                placeholder={t(lang, 'addNote')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 text-sm"
                            />
                        </div>
                    </div>
                 </div>
               </Card>
            </div>

            {/* History List */}
            <div className="md:col-span-1">
                 <Card title={t(lang, 'history')} className="h-full max-h-[600px] flex flex-col">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                        {historyCycles.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">{t(lang, 'noRecords')}</p>}
                        {historyCycles.slice(0, 20).map(c => {
                             const duration = c.endDate ? diffInDays(new Date(c.endDate), new Date(c.startDate)) + 1 : 1;
                             return (
                                <div key={c.id} className="flex justify-between items-start text-sm border-b border-slate-50 pb-3">
                                    <div>
                                        <span className="text-slate-800 font-medium block">{formatDate(c.startDate)}</span>
                                        {c.endDate ? (
                                            <span className="text-xs text-slate-400">→ {formatDate(c.endDate)}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">→ {t(lang, 'activePeriod', [diffInDays(new Date(), new Date(c.startDate)) + 1])}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">{duration} {t(lang, 'days')}</span>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                 </Card>
            </div>
          </>
        )}

        {/* === SEX TAB CONTENT === */}
        {activeTab === 'sex' && (
            <>
                <div className="md:col-span-1 order-2 md:order-1">
                     <Card title={t(lang, 'history')} className="h-full max-h-[600px] flex flex-col">
                        <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                            {historySex.map(s => (
                                <div key={s.id} className={`flex justify-between items-center text-sm border-b border-slate-50 pb-3 group ${editingSexId === s.id ? 'bg-purple-50 rounded-lg p-2 -mx-2' : ''}`}>
                                    <div>
                                        <div className="font-medium text-slate-700">{formatDate(s.date)}</div>
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${s.protection === 'Protected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {t(lang, s.protection === 'Protected' ? 'lowRisk' : 'highRisk' as any)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEditSex(s)} className="text-slate-400 hover:text-blue-500"><Pencil size={14}/></button>
                                        <button onClick={() => onDeleteSex(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                            {historySex.length === 0 && <p className="text-center text-slate-400 text-sm py-4">{t(lang, 'noRecords')}</p>}
                        </div>
                     </Card>
                </div>
                <div className="md:col-span-2 order-1 md:order-2">
                    <Card title={editingSexId ? t(lang, 'edit') : t(lang, 'logSex')}>
                        <form onSubmit={handleSexSubmit} className="space-y-6">
                            <Input 
                                type="date" 
                                label={t(lang, 'sexLogDate')}
                                value={sexDate} 
                                onChange={(e) => setSexDate(e.target.value)} 
                                required
                            />
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t(lang, 'protection')}</label>
                                <div className="flex gap-2">
                                    {['Protected', 'Unprotected'].map((p) => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setProtection(p as any)}
                                        className={`flex-1 py-3 px-3 rounded-xl border text-sm transition-all ${
                                        protection === p 
                                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold' 
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t(lang, p.toLowerCase() as any)}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                {editingSexId && (
                                    <Button type="button" onClick={resetSexForm} variant="outline" fullWidth className="py-4 rounded-2xl">
                                        {t(lang, 'cancel')}
                                    </Button>
                                )}
                                <Button type="submit" fullWidth className="py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
                                    {editingSexId ? t(lang, 'update') : t(lang, 'save')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default Records;
