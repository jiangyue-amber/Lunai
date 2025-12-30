
import { CycleLog, PredictionResult, CycleStats, PredictedCycle } from '../types';
import { addDays, diffInDays, getPhase } from '../utils/dateHelpers';

export const PredictionService = {
  calculateStats: (cycles: CycleLog[]): CycleStats => {
    const DEFAULT_CYCLE = 28;
    const DEFAULT_PERIOD = 5;

    if (cycles.length < 2) {
      let avgPeriod = DEFAULT_PERIOD;
      if (cycles.length === 1 && cycles[0].endDate) {
         avgPeriod = diffInDays(new Date(cycles[0].endDate), new Date(cycles[0].startDate)) + 1;
      }
      return {
        avgCycleLength: DEFAULT_CYCLE,
        avgPeriodLength: avgPeriod,
        lastCycleLength: DEFAULT_CYCLE,
        isIrregular: false,
        cycleVariation: 0
      };
    }

    const cycleLengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const currentStart = new Date(cycles[i].startDate);
      const prevStart = new Date(cycles[i+1].startDate);
      const length = diffInDays(currentStart, prevStart);
      if (length > 15 && length < 100) {
        cycleLengths.push(length);
      }
    }

    const periodLengths: number[] = [];
    cycles.forEach(c => {
      if (c.endDate) {
        const len = diffInDays(new Date(c.endDate), new Date(c.startDate)) + 1;
        if (len > 0 && len < 15) periodLengths.push(len);
      }
    });

    const recentCycleLengths = cycleLengths.slice(0, 6);
    const avgCycleLength = recentCycleLengths.length > 0
      ? Math.round(recentCycleLengths.reduce((a, b) => a + b, 0) / recentCycleLengths.length)
      : DEFAULT_CYCLE;

    const recentPeriodLengths = periodLengths.slice(0, 6);
    const avgPeriodLength = recentPeriodLengths.length > 0
      ? Math.round(recentPeriodLengths.reduce((a, b) => a + b, 0) / recentPeriodLengths.length)
      : DEFAULT_PERIOD;

    // Calculate variation range (Max - Min)
    const cycleVariation = recentCycleLengths.length > 1
      ? Math.max(...recentCycleLengths) - Math.min(...recentCycleLengths)
      : 0;

    const isIrregular = recentCycleLengths.length > 1 && (cycleVariation > 7);

    return {
      avgCycleLength,
      avgPeriodLength,
      lastCycleLength: cycleLengths.length > 0 ? cycleLengths[0] : DEFAULT_CYCLE,
      isIrregular,
      cycleVariation
    };
  },

  predict: (cycles: CycleLog[]): PredictionResult | null => {
    if (cycles.length === 0) return null;

    const stats = PredictionService.calculateStats(cycles);
    const lastPeriod = cycles[0];
    const lastStartDate = new Date(lastPeriod.startDate);
    
    const ESTIMATED_LUTEAL_LENGTH = 14; 
    const estimatedFollicularLength = stats.avgCycleLength - ESTIMATED_LUTEAL_LENGTH;

    // Window Calculation Logic
    // If variation is 0 (e.g. only 2 identical cycles), we still want a small buffer (+/- 2 days)
    // If variation is large (e.g. 10 days), we take half of it (+/- 5 days)
    const bufferDays = Math.max(2, Math.ceil(stats.cycleVariation / 2));

    // Predictions for the next 3 cycles
    const nextCycles: PredictedCycle[] = [];
    let currentBaseDate = lastStartDate;

    for (let i = 0; i < 3; i++) {
        // Next Start = Current Base + Avg Cycle Length
        const predictedStart = addDays(currentBaseDate, stats.avgCycleLength);
        
        // Range calculation for START DATE
        const rangeStart = addDays(predictedStart, -bufferDays);
        const rangeEnd = addDays(predictedStart, bufferDays);

        // Next End = Next Start + Avg Period Duration - 1 (inclusive)
        const predictedEnd = addDays(predictedStart, stats.avgPeriodLength - 1);
        
        // Status Check for the *immediate* next cycle
        let isLate = false;
        let daysLate = 0;
        
        if (i === 0) {
            const today = new Date();
            today.setHours(0,0,0,0);
            // Late if today is past the latest possible start date
            if (today > rangeEnd) {
                isLate = true;
                daysLate = diffInDays(today, predictedStart);
            }
        }

        nextCycles.push({
            startDate: predictedStart,
            startDateRange: [rangeStart, rangeEnd],
            endDate: predictedEnd,
            isLate,
            daysLate
        });

        // Move base forward for next iteration
        currentBaseDate = predictedStart;
    }

    const currentCycleOvulation = addDays(lastStartDate, estimatedFollicularLength);
    const fertileWindowStart = addDays(currentCycleOvulation, -5);
    const fertileWindowEnd = addDays(currentCycleOvulation, 1);

    // Urgency
    const firstPrediction = nextCycles[0];
    let urgency: 'normal' | 'warning' | 'critical' = 'normal';
    if (firstPrediction.daysLate >= 7) urgency = 'critical';
    else if (firstPrediction.daysLate >= 1) urgency = 'warning';

    const today = new Date();
    const daysSinceStart = diffInDays(today, lastStartDate);
    const currentPhase = getPhase(daysSinceStart, stats.avgCycleLength);

    return {
      nextCycles,
      ovulationDate: currentCycleOvulation,
      fertileWindowStart,
      fertileWindowEnd,
      urgency,
      currentPhase,
      stats
    };
  }
};
