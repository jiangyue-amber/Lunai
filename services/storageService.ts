
import { CycleLog, SexLog, UserProfile, ChatMessage, DailyLog } from '../types';

const KEYS = {
  CYCLES: 'calmcycle_cycles',
  DAILY_LOGS: 'calmcycle_daily_logs',
  SEX_LOGS: 'calmcycle_sex_logs',
  PROFILE: 'calmcycle_profile',
  CHAT_HISTORY: 'calmcycle_chat_history',
};

const defaultProfile: UserProfile = {
  name: 'User',
  language: 'en',
  averageCycleLength: 28,
  averagePeriodLength: 7, // Updated default to 7
  onboardingCompleted: false
};

export const StorageService = {
  getCycles: (): CycleLog[] => {
    const data = localStorage.getItem(KEYS.CYCLES);
    const cycles: CycleLog[] = data ? JSON.parse(data) : [];
    return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },

  saveCycles: (cycles: CycleLog[]) => {
    localStorage.setItem(KEYS.CYCLES, JSON.stringify(cycles));
  },

  addCycle: (cycle: CycleLog) => {
    const cycles = StorageService.getCycles();
    const existingIdx = cycles.findIndex(c => c.startDate === cycle.startDate);
    if (existingIdx >= 0) {
      cycles[existingIdx] = cycle;
    } else {
      cycles.push(cycle);
    }
    localStorage.setItem(KEYS.CYCLES, JSON.stringify(cycles));
  },

  updateCycle: (cycle: CycleLog) => {
    const cycles = StorageService.getCycles();
    const index = cycles.findIndex(c => c.id === cycle.id);
    if (index !== -1) {
      cycles[index] = cycle;
      localStorage.setItem(KEYS.CYCLES, JSON.stringify(cycles));
    }
  },

  deleteCycle: (id: string) => {
    const cycles = StorageService.getCycles();
    const newCycles = cycles.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CYCLES, JSON.stringify(newCycles));
  },

  // --- Daily Logs ---
  getDailyLogs: (): Record<string, DailyLog> => {
    const data = localStorage.getItem(KEYS.DAILY_LOGS);
    return data ? JSON.parse(data) : {};
  },

  saveDailyLog: (log: DailyLog) => {
    const logs = StorageService.getDailyLogs();
    // If log is empty (no flow, no symptoms, no notes), remove it to save space
    if (!log.flow && (!log.symptoms || log.symptoms.length === 0) && !log.notes) {
      delete logs[log.date];
    } else {
      logs[log.date] = log;
    }
    localStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
  },

  getDailyLog: (date: string): DailyLog | undefined => {
    const logs = StorageService.getDailyLogs();
    return logs[date];
  },
  // ----------------

  getSexLogs: (): SexLog[] => {
    const data = localStorage.getItem(KEYS.SEX_LOGS);
    return data ? JSON.parse(data) : [];
  },

  addSexLog: (log: SexLog) => {
    const logs = StorageService.getSexLogs();
    logs.push(log);
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(KEYS.SEX_LOGS, JSON.stringify(logs));
  },

  updateSexLog: (log: SexLog) => {
    const logs = StorageService.getSexLogs();
    const index = logs.findIndex(l => l.id === log.id);
    if (index !== -1) {
      logs[index] = log;
      logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem(KEYS.SEX_LOGS, JSON.stringify(logs));
    }
  },

  deleteSexLog: (id: string) => {
    const logs = StorageService.getSexLogs();
    const newLogs = logs.filter(l => l.id !== id);
    localStorage.setItem(KEYS.SEX_LOGS, JSON.stringify(newLogs));
  },

  getProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
  },

  updateProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getChatHistory: (): ChatMessage[] => {
    const data = localStorage.getItem(KEYS.CHAT_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveChatHistory: (messages: ChatMessage[]) => {
    localStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(messages));
  }
};
