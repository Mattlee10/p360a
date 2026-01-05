# p360

A minimal web application for interpreting wearable recovery/readiness data. p360 provides a daily decision label without interpretation or advice—simply indicating whether today is a day to make decisions or just observe.

## Overview

p360 analyzes daily metrics (HRV, Sleep, Load) and determines a decision phase:
- **OBSERVE**: Normal observation period
- **CONSIDER_ADJUSTMENT**: Two or more metrics have been outside baseline for two consecutive days

## Core Philosophy

- **No interpretation**: Does not explain why or provide physiological explanations
- **No advice**: No recommendations, warnings, or coaching
- **Decision labeling only**: Users decide what to change
- **Clean UX**: Read and close—no buttons, CTAs, or notifications

## Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: None (frontend-only v0)
- **Data**: Mock data (designed for future WHOOP API integration)

## Data Model

```typescript
type DailyMetrics = {
  date: string; // YYYY-MM-DD
  hrv: number;
  sleep: number; // sleep score or duration
  load: number; // strain / activity load
};
```

Uses the most recent 14 days of data to calculate personal baselines.

## Baseline Calculation

- Personal baseline only (no user comparison)
- Uses median of the most recent 7-14 days
- Each metric (HRV, Sleep, Load) calculated independently

## Decision Phase Logic

1. Compare today's metrics to baseline → classify as `lower` / `within` / `higher`
2. If 2+ metrics in the same direction (lower or higher) are outside baseline for 2 consecutive days:
   → `CONSIDER_ADJUSTMENT`
3. All other cases:
   → `OBSERVE`

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:5173

### Build

```bash
npm run build
```

## Project Structure

```
src/
  ├── types.ts              # Type definitions
  ├── mockData.ts           # Mock daily metrics data
  ├── baselineCalculator.ts # Baseline calculation logic
  ├── decisionEngine.ts     # Decision phase logic
  ├── App.tsx              # Main UI component
  ├── index.css            # Tailwind CSS imports
  └── main.tsx             # Entry point
```

## Future Integration

The codebase is structured to easily integrate with the WHOOP API. The data fetching layer can be swapped out while keeping the core logic intact.

## License

Private project
