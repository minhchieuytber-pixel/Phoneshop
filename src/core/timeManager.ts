import type { SimSpeed } from './types';

export const SPEED_MULTIPLIERS: Record<SimSpeed, number> = {
  paused: 0,
  slow: 0.45,   // ~2.2 real sec per game minute
  normal: 1.4,  // ~0.7 real sec per game minute
  fast: 4.5,    // ~0.22 real sec per game minute
};

export interface FormattedGameTime {
  day: number;
  month: number;
  year: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  timeStr: string;
  dateStr: string;
  periodLabel: string;
  isOpenHours: boolean;
  sunProgress: number; // 0 (midnight) -> 0.5 (noon) -> 1 (midnight)
}

export function formatGameTime(totalMinutes: number): FormattedGameTime {
  const wholeMinutes = Math.floor(totalMinutes);
  const minuteOfDay = ((wholeMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const totalDays = Math.floor(wholeMinutes / 1440) + 1;
  const month = Math.floor((totalDays - 1) / 30) + 1;
  const dayOfMonth = ((totalDays - 1) % 30) + 1;
  const year = 2026 + Math.floor((month - 1) / 12);

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');

  let periodLabel = 'Đêm (Đóng cửa)';
  if (hour >= 6 && hour < 11) periodLabel = 'Buổi sáng';
  else if (hour >= 11 && hour < 14) periodLabel = 'Buổi trưa';
  else if (hour >= 14 && hour < 18) periodLabel = 'Buổi chiều';
  else if (hour >= 18 && hour < 22) periodLabel = 'Buổi tối';

  const isOpenHours = hour >= 6 && hour < 22;
  const sunProgress = minuteOfDay / 1440;

  return {
    day: totalDays,
    month: ((month - 1) % 12) + 1,
    year,
    dayOfMonth,
    hour,
    minute,
    timeStr: `${hh}:${mm}`,
    dateStr: `Ngày ${totalDays} (${String(dayOfMonth).padStart(2, '0')}/${String(((month - 1) % 12) + 1).padStart(2, '0')}/${year})`,
    periodLabel,
    isOpenHours,
    sunProgress,
  };
}

export function formatVND(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('vi-VN');
  return amount < 0 ? `-${formatted} ₫` : `${formatted} ₫`;
}

export function formatShortVND(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)}k`;
  }
  return `${sign}${Math.round(abs)} ₫`;
}
