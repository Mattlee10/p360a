export type DailyMetrics = {
  date: string; // YYYY-MM-DD
  hrv: number | null;
  sleep: number | null;
  load: number | null;
};

export type MetricComparison = 'lower' | 'within' | 'higher';

export type DecisionPhase = 'OBSERVE' | 'CONSIDER_ADJUSTMENT';

export type ComparisonResult = {
  hrv: MetricComparison | null;
  sleep: MetricComparison | null;
  load: MetricComparison | null;
};

export type Baseline = {
  hrv: number;
  sleep: number;
  load: number;
};

