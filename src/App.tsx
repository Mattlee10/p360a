import { determineDecisionPhase } from './decisionEngine';
import { mockDailyMetrics } from './mockData';
import type { ComparisonResult } from './types';

function App() {
  const result = determineDecisionPhase(mockDailyMetrics);

  const getComparisonIcon = (comparison: 'lower' | 'within' | 'higher' | null) => {
    if (comparison === null) return '—';
    switch (comparison) {
      case 'lower':
        return '↓';
      case 'higher':
        return '↑';
      case 'within':
        return '→';
    }
  };

  const getComparisonText = (comparison: 'lower' | 'within' | 'higher' | null) => {
    if (comparison === null) return 'No data';
    switch (comparison) {
      case 'lower':
        return 'Below baseline';
      case 'higher':
        return 'Above baseline';
      case 'within':
        return 'Within baseline';
    }
  };

  const getMetricLabel = (metric: keyof ComparisonResult) => {
    const labels = {
      hrv: 'HRV',
      sleep: 'Sleep',
      load: 'Load',
    };
    return labels[metric];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Decision Phase Label */}
        <div className="mb-10">
          <div
            className={`text-6xl font-extrabold tracking-tight mb-2 ${
              result.phase === 'CONSIDER_ADJUSTMENT'
                ? 'text-orange-600'
                : 'text-slate-800'
            }`}
          >
            {result.phase === 'CONSIDER_ADJUSTMENT'
              ? 'CONSIDER ADJUSTMENT'
              : 'OBSERVE'}
          </div>
        </div>

        {/* Reason Summary */}
        <div className="mb-14">
          <p className="text-xl text-slate-700 leading-relaxed font-light">
            {result.reason}
          </p>
        </div>

        {/* Baseline Comparison */}
        <div className="mb-16">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">
            Baseline Comparison
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
            {(['hrv', 'sleep', 'load'] as const).map((metric) => {
              const comparison = result.comparison[metric];
              const iconColor =
                comparison === 'lower'
                  ? 'text-blue-500'
                  : comparison === 'higher'
                  ? 'text-red-500'
                  : 'text-slate-400';
              
              return (
                <div
                  key={metric}
                  className="flex items-center justify-between py-5 px-6 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base font-medium text-slate-800">
                    {getMetricLabel(metric)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-light ${iconColor}`}>
                      {getComparisonIcon(comparison)}
                    </span>
                    <span className="text-sm text-slate-600 font-medium min-w-[120px] text-right">
                      {getComparisonText(comparison)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Message */}
        <div className="mt-20 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400 text-center font-light italic">
            The user decides what to change.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
