import type { DailyMetrics, DecisionPhase, ComparisonResult } from './types';
import { calculateBaseline, compareToBaseline } from './baselineCalculator';

/**
 * Decision Phase Logic Implementation
 * 
 * Rules:
 * 1. Compare today's metrics to baseline (lower/within/higher)
 * 2. If 2+ metrics in the same direction (lower or higher) are outside baseline for 2 consecutive days
 *    → CONSIDER_ADJUSTMENT
 * 3. All other cases → OBSERVE
 */
export function determineDecisionPhase(
  metrics: DailyMetrics[]
): {
  phase: DecisionPhase;
  comparison: ComparisonResult;
  reason: string;
} {
  if (metrics.length < 2) {
    throw new Error('At least 2 days of data required.');
  }

  const baseline = calculateBaseline(metrics);
  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2];

  // Compare today's and yesterday's metrics to baseline
  const todayComparison: ComparisonResult = {
    hrv: compareToBaseline(today.hrv, baseline.hrv),
    sleep: compareToBaseline(today.sleep, baseline.sleep),
    load: compareToBaseline(today.load, baseline.load),
  };

  const yesterdayComparison: ComparisonResult = {
    hrv: compareToBaseline(yesterday.hrv, baseline.hrv),
    sleep: compareToBaseline(yesterday.sleep, baseline.sleep),
    load: compareToBaseline(yesterday.load, baseline.load),
  };

  // Check metrics that have been outside baseline for 2 consecutive days in the same direction
  // Only check metrics that have valid (non-null) comparisons
  const metricsToCheck: Array<keyof ComparisonResult> = ['hrv', 'sleep', 'load'];

  // Count metrics that have been lower for 2 consecutive days (skip null values)
  const consecutiveLower = metricsToCheck.filter(
    metric =>
      todayComparison[metric] !== null &&
      yesterdayComparison[metric] !== null &&
      todayComparison[metric] === 'lower' &&
      yesterdayComparison[metric] === 'lower'
  ).length;

  // Count metrics that have been higher for 2 consecutive days (skip null values)
  const consecutiveHigher = metricsToCheck.filter(
    metric =>
      todayComparison[metric] !== null &&
      yesterdayComparison[metric] !== null &&
      todayComparison[metric] === 'higher' &&
      yesterdayComparison[metric] === 'higher'
  ).length;

  // Check if 2+ metrics in the same direction have been outside baseline for 2 consecutive days
  if (consecutiveLower >= 2 || consecutiveHigher >= 2) {
    // Determine direction
    const direction = consecutiveLower >= 2 ? 'lower' : 'higher';
    const count = direction === 'lower' ? consecutiveLower : consecutiveHigher;

    const reason =
      direction === 'lower'
        ? `${count} recovery signals have been outside baseline for 2 consecutive days.`
        : `${count} load signals have been outside baseline for 2 consecutive days.`;

    return {
      phase: 'CONSIDER_ADJUSTMENT',
      comparison: todayComparison,
      reason,
    };
  }

  // All other cases
  return {
    phase: 'OBSERVE',
    comparison: todayComparison,
    reason: 'Observing current state.',
  };
}

