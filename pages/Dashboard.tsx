
import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/storageService';
import { PredictionService } from '../services/predictionService';
import { CycleLog, PredictionResult, UserProfile, SexLog, DailyLog } from '../types';
import { Link } from 'react-router-dom';
import { Droplets, Activity, ChevronLeft, ChevronRight, Heart, Info, Clock, Calendar, Sparkles, BarChart2, Zap } from 'lucide-react';
import { formatDate, diffInDays, toISODate, addDays } from '../utils/dateHelpers';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { t } from '../utils/translations';

const Dashboard: React.FC = () => {
  const [profile] = useState<UserProfile>(StorageService.getProfile());
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [sexLogs, setSexLogs] = useState<SexLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const loadedCycles = StorageService.getCycles();
    const loadedSexLogs = StorageService.getSexLogs();
    const loadedDailyLogs = StorageService.getDailyLogs();
    setCycles(loadedCycles);
    setSexLogs(loadedSexLogs);
    setDailyLogs(loadedDailyLogs);
    const result = PredictionService.predict(loadedCycles);
    setPrediction(result);
  }, [profile]);

  const lang = profile.language;

  if (cycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mb-4">
          <Droplets size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{t(lang, 'welcome')}</h2>
        <p className="text-slate-500 max-w-md">
          {t(lang, 'welcomeDesc')}
        </p>
        <Link to="/records">
          <Button className="px-8">{t(lang, 'logFirstPeriod')}</Button>
        </Link>
      </div>
    );
  }

  // Calculation Logic
  let status: 'Late' | 'Future' | 'Current' = 'Future';
  let daysDisplay = 0;
  let dateRangeDisplay = "";
  
  if (prediction && prediction.nextCycles.length > 0) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextCycle = prediction.nextCycles[0];
    const rangeStart = nextCycle.startDateRange[0];
    const rangeEnd = nextCycle.startDateRange[1];

    dateRangeDisplay = `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;

    // If latest cycle log is ongoing
    const latestLog = cycles[0];
    const isOngoing = !latestLog.endDate;

    if (isOngoing) {
        status = 'Current';
        daysDisplay = 0;
    } else {
        if (nextCycle.isLate) {
            status = 'Late';
            daysDisplay = nextCycle.daysLate;
        } else {
            status = 'Future';
            daysDisplay = diffInDays(nextCycle.startDate, today);
            if (daysDisplay < 0) daysDisplay = 0;
        }
    }
  }

  // --- Summary Logic ---
  const getSummary = () => {
      const greeting = t(lang, 'summaryHello', [profile.name || 'User']);
      let content = "";
      
      const today = new Date();
      let recentSymptoms: string[] = [];
      for(let i=0; i<7; i++) {
          const d = addDays(today, -i);
          const iso = toISODate(d);
          const log = dailyLogs[iso];
          if (log && log.symptoms) {
              recentSymptoms = [...recentSymptoms, ...log.symptoms];
          }
      }
      recentSymptoms = Array.from(new Set(recentSymptoms));

      if (recentSymptoms.length > 0 && status !== 'Current') {
          const symptomName = t(lang, `sym_${recentSymptoms[0]}` as any);
          content = t(lang, 'summarySymptomCare', [symptomName]);
      } else {
          if (status === 'Current') content = t(lang, 'summaryPeriod');
          else if (status === 'Late') content = t(lang, 'summaryLate', [daysDisplay]);
          else content = status === 'Future' ? t(lang, 'summaryFuture') : t(lang, 'summaryRegular');
      }
      
      return { greeting, content };
  };
  const summary = getSummary();

  // Color determination based on status
  const getRingColor = () => {
    if (!prediction) return '#e2e8f0';
    if (status === 'Late') {
        if (daysDisplay >= 7) return '#ef4444'; // Red-500
        return '#f59e0b'; // Amber-500
    }
    if (status === 'Current') return '#f59e0b'; // Amber/Yellow
    return '#a7f3d0'; // Soft Green
  };

  const ringColor = getRingColor();
  const phaseData = [{ name: 'Remaining', value: 100, color: ringColor }];

  // --- Chart Data Preparation ---
  const chartData = [...cycles].reverse().slice(-6).map(c => {
      const [y, m, d] = c.startDate.split('-').map(Number);
      const start = new Date(y, m-1, d);
      
      const duration = c.endDate ? diffInDays(new Date(c.endDate), new Date(c.startDate)) + 1 : 0;
      
      const originalIndex = cycles.findIndex(oc => oc.id === c.id);
      let cycleLen = 0;
      if (originalIndex < cycles.length - 1) {
          cycleLen = diffInDays(new Date(cycles[originalIndex].startDate), new Date(cycles[originalIndex + 1].startDate));
      }
      
      return {
          date: start.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {month: 'short', day: 'numeric'}),
          duration: duration > 0 ? duration : null,
          cycleLen: cycleLen > 0 ? cycleLen : null
      };
  }).filter(d => d.cycleLen !== null || d.duration !== null);

  const getChartSummary = () => {
      if (prediction?.stats.isIrregular) return t(lang, 'trendSummary_irregular');
      const lengths = chartData.map(d => d.cycleLen).filter(Boolean) as number[];
      const min = Math.min(...lengths);
      const max = Math.max(...lengths);
      if (max - min > 5) return t(lang, 'trendSummary_varying');
      return t(lang, 'trendSummary_stable');
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(year, month, d);
      const isoCurrentDay = toISODate(currentDay);
      currentDay.setHours(0,0,0,0);
      
      const isPeriod = cycles.some(c => {
        const [sy, sm, sd] = c.startDate.split('-').map(Number);
        const start = new Date(sy, sm-1, sd);
        const avgPeriod = prediction?.stats.avgPeriodLength || 5;
        let end;
        if (c.endDate) {
           const [ey, em, ed] = c.endDate.split('-').map(Number);
           end = new Date(ey, em-1, ed);
        } else {
           end = addDays(start, avgPeriod - 1);
        }
        return currentDay >= start && currentDay <= end;
      });

      let predictionOpacity = 0; 
      // 0 = none
      // 0.2 = range (Very light pink)
      // 0.6 = core (Soft Pink)
      if (prediction && !isPeriod) {
          const avgDuration = prediction.stats.avgPeriodLength;
          for (const pc of prediction.nextCycles) {
              const rangeStart = new Date(pc.startDateRange[0]);
              const rangeEnd = new Date(pc.startDateRange[1]);
              const coreStart = new Date(pc.startDate);
              const coreEnd = addDays(coreStart, avgDuration - 1);
              
              rangeStart.setHours(0,0,0,0);
              rangeEnd.setHours(0,0,0,0);
              coreStart.setHours(0,0,0,0);
              coreEnd.setHours(0,0,0,0);

              const maxWindowEnd = addDays(rangeEnd, avgDuration - 1);

              if (currentDay >= rangeStart && currentDay <= maxWindowEnd) {
                  if (currentDay >= coreStart && currentDay <= coreEnd) {
                      predictionOpacity = 0.6; // Core: Distinct but soft pink
                  } else {
                      predictionOpacity = 0.2; // Range: Very faint pink
                  }
                  break;
              }
          }
      }

      const hasSexLog = sexLogs.some(s => s.date === isoCurrentDay);
      const isToday = isoCurrentDay === toISODate(today);

      days.push(
        <div key={d} className="h-10 flex flex-col items-center justify-center relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium relative transition-colors
            ${isPeriod ? 'bg-red-400 text-white' : 
              predictionOpacity > 0 ? 'bg-pink-400 text-white' : 
              'text-slate-400 hover:bg-slate-50'
            }`}
            style={{ 
                opacity: isPeriod ? 1 : (predictionOpacity > 0 ? predictionOpacity : 1),
                backgroundColor: !isPeriod && predictionOpacity === 0 ? 'transparent' : undefined
            }}
            >
            {d}
            {hasSexLog && (
                <Heart size={10} className="absolute -top-1 -right-1 text-purple-400 fill-purple-400" />
            )}
            {isToday && (
              <div className="absolute inset-0 rounded-full border border-slate-400 pointer-events-none" />
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const handlePrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
        {/* Personalized Summary */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl p-6 text-white shadow-lg shadow-purple-100 flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Sparkles size={24} className="text-white" />
            </div>
            <div>
                <h2 className="font-bold text-xl mb-1">{summary.greeting}</h2>
                <p className="text-purple-50 leading-relaxed opacity-95 text-sm">{summary.content}</p>
            </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOP LEFT: Main Status Card (Donut Chart) */}
        <Card className="flex flex-col items-center justify-center text-center p-8 relative overflow-hidden h-full min-h-[350px]">
          <div className="relative w-56 h-56 mb-6">
             {/* Soft Glow */}
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse ${
                status === 'Late' ? 'bg-red-300' : (status === 'Current' ? 'bg-amber-300' : 'bg-green-300')
            }`}></div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={95}
                  startAngle={90}
                  endAngle={450}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={ringColor} className="drop-shadow-sm" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <span className="text-5xl font-bold text-slate-800 tracking-tight">
                {status === 'Current' ? t(lang, 'isTheDay') : daysDisplay}
              </span>
              <span className="text-sm text-slate-400 uppercase tracking-wide font-medium mt-1">
                {status === 'Late' ? t(lang, 'daysLateLabel') : (status === 'Future' ? t(lang, 'daysLeft') : '')}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mb-1 flex items-center gap-2">
            {t(lang, (prediction?.currentPhase.toLowerCase() || 'menstrual') as any)}
          </h2>

          <div className="text-slate-500 mb-2 mt-2 bg-slate-50 px-4 py-2 rounded-lg">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">{t(lang, 'estimatedStart')}</p>
            <p className="font-medium text-slate-700">
              {prediction && prediction.nextCycles.length > 0 && dateRangeDisplay}
            </p>
          </div>
        </Card>

        {/* TOP RIGHT: Calendar Card */}
        <Card title={t(lang, 'calendar')} className="flex flex-col h-full min-h-[350px]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
                <span className="font-medium text-slate-700">
                    {calendarDate.toLocaleDateString(profile.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-xs font-bold text-slate-300 uppercase">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                {renderCalendar()}
            </div>
            <div className="flex gap-4 justify-center mt-4 text-[10px] text-slate-400 flex-wrap">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Period</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-400 opacity-60"></div> Likely</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-400 opacity-20"></div> Range</div>
            </div>
        </Card>

        {/* BOTTOM LEFT: Stats Chart Card */}
        <Card title={t(lang, 'trends')} className="flex flex-col">
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            itemStyle={{fontSize: '12px'}}
                        />
                        <Bar dataKey="cycleLen" name={t(lang, 'cycleLength')} fill="#c084fc" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="duration" name={t(lang, 'periodLength')} fill="#f472b6" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 flex items-start gap-2">
                    <BarChart2 size={16} className="shrink-0 mt-0.5 text-purple-400" />
                    {getChartSummary()}
                </p>
            </div>
        </Card>

        {/* BOTTOM RIGHT: Cycle Stats Card 2x2 Grid */}
        <Card title={t(lang, 'cycleHealth')} className="flex flex-col justify-center">
             {prediction?.stats ? (
                 <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                     {/* Avg Cycle */}
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                                <Clock size={16} />
                             </div>
                             {t(lang, 'avgCycle')}
                         </div>
                         <p className="text-xl font-bold text-slate-800 ml-1">{prediction.stats.avgCycleLength} <span className="text-xs font-normal text-slate-400">{t(lang, 'days')}</span></p>
                     </div>

                     {/* Avg Period */}
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg">
                                <Calendar size={16} />
                             </div>
                             {t(lang, 'avgDuration')}
                         </div>
                         <p className="text-xl font-bold text-slate-800 ml-1">{prediction.stats.avgPeriodLength} <span className="text-xs font-normal text-slate-400">{t(lang, 'days')}</span></p>
                     </div>

                     {/* Variation */}
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                                <Activity size={16} />
                             </div>
                             {t(lang, 'cycleVariation')}
                         </div>
                         <p className="text-xl font-bold text-slate-800 ml-1">+/- {prediction.stats.cycleVariation} <span className="text-xs font-normal text-slate-400">{t(lang, 'days')}</span></p>
                     </div>

                     {/* Next Fertile */}
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                                <Zap size={16} />
                             </div>
                             {t(lang, 'nextFertile')}
                         </div>
                         <p className="text-sm font-bold text-slate-800 ml-1 mt-1 leading-tight">
                            {formatDate(prediction.fertileWindowStart)} - {formatDate(prediction.fertileWindowEnd)}
                         </p>
                     </div>
                 </div>
             ) : (
                 <p className="text-sm text-slate-400">Log more data to see stats.</p>
             )}
        </Card>
        
        {/* Full Width: History & Future List Module */}
        <Card className="md:col-span-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Past */}
                 <div>
                     <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                         <Clock size={18} className="text-slate-400"/> {t(lang, 'pastCycles')}
                     </h3>
                     <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                         {cycles.slice(0, 10).map((c, i) => {
                             const duration = c.endDate ? diffInDays(new Date(c.endDate), new Date(c.startDate)) + 1 : '...';
                             return (
                                 <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                                     <div className="flex flex-col">
                                        <span className="text-slate-700 font-medium">{formatDate(c.startDate)} - {c.endDate ? formatDate(c.endDate) : 'Ongoing'}</span>
                                     </div>
                                     <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-medium">{duration} {t(lang, 'days')}</span>
                                 </div>
                             )
                         })}
                     </div>
                 </div>

                 {/* Future */}
                 <div>
                     <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                         <Sparkles size={18} className="text-purple-400"/> {t(lang, 'futureCycles')}
                     </h3>
                     <div className="space-y-3">
                         {prediction?.nextCycles.map((c, i) => (
                             <div key={i} className="flex justify-between items-center text-sm bg-purple-50 p-3 rounded-xl border border-purple-100">
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <span className="font-bold text-slate-700 block mb-1">
                                             {t(lang, 'expectedWindow')}: 
                                         </span>
                                         <span className="text-purple-700 font-bold bg-white px-2 rounded-md shadow-sm mb-1 ml-2">
                                             {formatDate(c.startDateRange[0])} - {formatDate(c.startDateRange[1])}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         ))}
                         {(!prediction || prediction.nextCycles.length === 0) && (
                             <p className="text-sm text-slate-400 italic">Not enough data for predictions.</p>
                         )}
                     </div>
                 </div>
             </div>
        </Card>

        {/* Phase Guide Grid */}
        <div className="md:col-span-2 mt-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4 px-1">{t(lang, 'phasesGuide')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 mb-3">
                        <Droplets size={16} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{t(lang, 'menstrual')}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t(lang, 'phaseDesc_menstrual')}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-3">
                        <Sparkles size={16} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{t(lang, 'follicular')}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t(lang, 'phaseDesc_follicular')}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 mb-3">
                        <Zap size={16} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{t(lang, 'ovulation')}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t(lang, 'phaseDesc_ovulation')}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-3">
                        <Activity size={16} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{t(lang, 'luteal')}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t(lang, 'phaseDesc_luteal')}</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
