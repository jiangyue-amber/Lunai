
export interface CycleLog {
  id: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate?: string;
}

export interface DailyLog {
  date: string; // ISO key YYYY-MM-DD
  flow?: 'Light' | 'Medium' | 'Heavy';
  symptoms?: string[];
  notes?: string;
}

export interface SexLog {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  protection: 'Protected' | 'Unprotected';
  notes?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface UserProfile {
  name: string;
  language: 'en' | 'zh';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastCycleLength: number;
  isIrregular: boolean;
  cycleVariation: number; // Max difference between recent cycles
}

export interface PredictedCycle {
  startDate: Date;
  startDateRange: [Date, Date]; // Start of window, End of window
  endDate: Date;
  isLate: boolean;
  daysLate: number;
}

export interface PredictionResult {
  nextCycles: PredictedCycle[]; // Now an array for future predictions
  ovulationDate: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  urgency: 'normal' | 'warning' | 'critical';
  currentPhase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';
  stats: CycleStats;
}
