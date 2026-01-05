import type { DailyMetrics, Baseline } from './types';

/**
 * Calculate personal baseline from the most recent 7-14 days of data
 * Uses median value
 */
export function calculateBaseline(metrics: DailyMetrics[]): Baseline {
  if (metrics.length === 0) {
    throw new Error('No data available.');
  }

  // Use the most recent 7-14 days of data (max 14 days, min 7 days)
  const recentMetrics = metrics.slice(-14);
  const count = Math.max(7, Math.min(14, recentMetrics.length));

  const values = recentMetrics.slice(-count);

  // Calculate median for each metric (filter out null values)
  const hrvValues = values
    .map(m => m.hrv)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const sleepValues = values
    .map(m => m.sleep)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const loadValues = values
    .map(m => m.load)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const median = (arr: number[]) => {
    if (arr.length === 0) {
      return null;
    }
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0
      ? (arr[mid - 1] + arr[mid]) / 2
      : arr[mid];
  };

  return {
    hrv: median(hrvValues) ?? 0,
    sleep: median(sleepValues) ?? 0,
    load: median(loadValues) ?? 0,
  };
}

/**
 * Determine where a value stands relative to baseline
 * ±5% range from baseline is considered "within"
 * Returns null if value is null (no comparison possible)
 */
export function compareToBaseline(
  value: number | null,
  baseline: number,
  tolerancePercent: number = 5
): 'lower' | 'within' | 'higher' | null {
  if (value === null) {
    return null;
  }

  const tolerance = baseline * (tolerancePercent / 100);
  const lowerBound = baseline - tolerance;
  const upperBound = baseline + tolerance;

  if (value < lowerBound) {
    return 'lower';
  } else if (value > upperBound) {
    return 'higher';
  } else {
    return 'within';
  }
}

