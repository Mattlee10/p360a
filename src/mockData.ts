import type { DailyMetrics } from './types';

// Mock data for the most recent 14 days
export const mockDailyMetrics: DailyMetrics[] = [
  { date: '2024-01-01', hrv: 45, sleep: 7.5, load: 12.5 },
  { date: '2024-01-02', hrv: 48, sleep: 8.0, load: 14.2 },
  { date: '2024-01-03', hrv: 46, sleep: 7.8, load: 13.8 },
  { date: '2024-01-04', hrv: 50, sleep: 8.2, load: 11.5 },
  { date: '2024-01-05', hrv: 47, sleep: 7.9, load: 15.1 },
  { date: '2024-01-06', hrv: 49, sleep: 8.1, load: 13.2 },
  { date: '2024-01-07', hrv: 48, sleep: 8.0, load: 14.0 },
  { date: '2024-01-08', hrv: 46, sleep: 7.7, load: 12.8 },
  { date: '2024-01-09', hrv: 51, sleep: 8.3, load: 11.0 },
  { date: '2024-01-10', hrv: 47, sleep: 7.6, load: 14.5 },
  { date: '2024-01-11', hrv: 42, sleep: 7.2, load: 16.0 }, // 2 days ago
  { date: '2024-01-12', hrv: 40, sleep: 7.0, load: 16.5 }, // yesterday
  { date: '2024-01-13', hrv: 38, sleep: 6.8, load: 17.0 }, // today (low HRV, Sleep, high Load)
];

