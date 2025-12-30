
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // Parse YYYY-MM-DD manually to avoid UTC/Timezone conversion shifts
    const [y, m, d] = date.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const toISODate = (date: Date): string => {
  // Use local get methods to avoid UTC shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const diffInDays = (date1: Date, date2: Date): number => {
  // Normalize to local midnight to avoid DST issues affecting day difference
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

export const getPhase = (dayInCycle: number, cycleLength: number): 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal' => {
  if (dayInCycle <= 5) return 'Menstrual';
  if (dayInCycle <= 12) return 'Follicular';
  if (dayInCycle <= 16) return 'Ovulation';
  return 'Luteal';
};
