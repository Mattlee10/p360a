import type { DailyMetrics } from './types';

/**
 * WHOOP API Raw Response Types
 * Based on WHOOP API documentation
 */
export type WhoopRecoveryResponse = {
  id: number;
  user_id: number;
  cycle_id: number;
  sleep_id: number;
  score: {
    recovery_score: number | null;
    resting_heart_rate: number | null;
    hrv_rmssd_milli: number | null;
    spo2_percentage: number | null;
    skin_temp_celsius: number | null;
  };
  created_at: string;
};

export type WhoopSleepResponse = {
  id: number;
  user_id: number;
  created_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score: {
    stage_summary: {
      total_sleep_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
    };
    respiratory_rate: number | null;
    sleep_performance_percentage: number | null;
    sleep_consistency_percentage: number | null;
    sleep_efficiency_percentage: number | null;
  };
};

export type WhoopWorkoutResponse = {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score: {
    strain: number | null;
    average_heart_rate: number | null;
    max_heart_rate: number | null;
    kilojoule: number | null;
    percent_recorded: number | null;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
  sport_id: number | null;
  source: {
    workout_id: number | null;
    device_id: number | null;
    device_type: string | null;
  };
};

/**
 * WHOOP API Data Adapter
 * 
 * Converts WHOOP raw API responses to internal DailyMetrics format.
 * 
 * Important: This adapter does NOT expose:
 * - Recovery score
 * - Coach recommendations
 * - Behavioral advice
 * 
 * Only extracts raw metrics (HRV, Sleep, Load) for baseline comparison.
 */
export class WhoopAdapter {
  /**
   * Converts WHOOP recovery data to DailyMetrics format
   * Extracts HRV from recovery score data
   */
  static extractHRV(recovery: WhoopRecoveryResponse): number | null {
    // HRV is stored as HRV RMSSD in milliseconds
    // Convert to standard HRV value (milliseconds to milliseconds, or convert to ms if needed)
    if (recovery.score.hrv_rmssd_milli === null || recovery.score.hrv_rmssd_milli === undefined) {
      return null;
    }
    // WHOOP returns HRV in milliseconds, return as-is
    return recovery.score.hrv_rmssd_milli;
  }

  /**
   * Converts WHOOP sleep data to hours
   * Extracts total sleep duration from sleep data
   */
  static extractSleep(sleep: WhoopSleepResponse): number | null {
    if (!sleep.score?.stage_summary?.total_sleep_time_milli) {
      return null;
    }
    // Convert milliseconds to hours
    const hours = sleep.score.stage_summary.total_sleep_time_milli / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Extracts daily strain/load from workout data
   * Aggregates strain from all workouts in a day
   */
  static extractLoad(workouts: WhoopWorkoutResponse[]): number | null {
    if (!workouts || workouts.length === 0) {
      return null;
    }
    
    // WHOOP provides daily strain, but if we have multiple workouts,
    // we need to aggregate. For now, use the maximum strain or sum.
    // Note: WHOOP typically provides daily strain separately, but if we only have workouts,
    // we'll use the max strain value from workouts
    const strains = workouts
      .map(w => w.score?.strain)
      .filter((s): s is number => s !== null && s !== undefined);
    
    if (strains.length === 0) {
      return null;
    }
    
    // Use maximum strain if multiple workouts, or single value
    return Math.max(...strains);
  }

  /**
   * Converts date string to YYYY-MM-DD format
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Main adapter function: Converts WHOOP API responses to DailyMetrics array
   * 
   * @param recoveries - Array of WHOOP recovery responses
   * @param sleeps - Array of WHOOP sleep responses
   * @param workouts - Array of WHOOP workout responses (grouped by date)
   * @returns Array of DailyMetrics sorted by date
   */
  static toDailyMetrics(
    recoveries: WhoopRecoveryResponse[],
    sleeps: WhoopSleepResponse[],
    workouts: Record<string, WhoopWorkoutResponse[]> // date -> workouts mapping
  ): DailyMetrics[] {
    // Create a map of date -> metrics
    const metricsMap = new Map<string, Partial<DailyMetrics>>();

    // Process recoveries (HRV)
    recoveries.forEach(recovery => {
      const date = this.formatDate(recovery.created_at);
      const hrv = this.extractHRV(recovery);
      
      if (!metricsMap.has(date)) {
        metricsMap.set(date, { date, hrv: null, sleep: null, load: null });
      }
      const metrics = metricsMap.get(date)!;
      metrics.hrv = hrv;
    });

    // Process sleeps
    sleeps.forEach(sleep => {
      const date = this.formatDate(sleep.start);
      const sleepHours = this.extractSleep(sleep);
      
      if (!metricsMap.has(date)) {
        metricsMap.set(date, { date, hrv: null, sleep: null, load: null });
      }
      const metrics = metricsMap.get(date)!;
      metrics.sleep = sleepHours;
    });

    // Process workouts (load/strain)
    Object.entries(workouts).forEach(([date, dayWorkouts]) => {
      const load = this.extractLoad(dayWorkouts);
      
      if (!metricsMap.has(date)) {
        metricsMap.set(date, { date, hrv: null, sleep: null, load: null });
      }
      const metrics = metricsMap.get(date)!;
      metrics.load = load;
    });

    // Convert map to array and sort by date
    const metricsArray = Array.from(metricsMap.values()) as DailyMetrics[];
    return metricsArray.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Fetches and converts WHOOP data for a date range
   * This is a helper that would typically be called from a server-side API route
   * 
   * @param accessToken - WHOOP API access token (from server-side only)
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise<DailyMetrics[]>
   */
  static async fetchAndConvert(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<DailyMetrics[]> {
    const baseUrl = 'https://api.prod.whoop.com/developer/v1';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Fetch recoveries
    const recoveryUrl = `${baseUrl}/recovery?start=${startDate}&end=${endDate}`;
    const recoveryResponse = await fetch(recoveryUrl, { headers });
    if (!recoveryResponse.ok) {
      throw new Error(`Failed to fetch recoveries: ${recoveryResponse.statusText}`);
    }
    const recoveries: WhoopRecoveryResponse[] = await recoveryResponse.json();

    // Fetch sleeps
    const sleepUrl = `${baseUrl}/activity/sleep?start=${startDate}&end=${endDate}`;
    const sleepResponse = await fetch(sleepUrl, { headers });
    if (!sleepResponse.ok) {
      throw new Error(`Failed to fetch sleeps: ${sleepResponse.statusText}`);
    }
    const sleeps: WhoopSleepResponse[] = await sleepResponse.json();

    // Fetch workouts
    const workoutUrl = `${baseUrl}/activity/workout?start=${startDate}&end=${endDate}`;
    const workoutResponse = await fetch(workoutUrl, { headers });
    if (!workoutResponse.ok) {
      throw new Error(`Failed to fetch workouts: ${workoutResponse.statusText}`);
    }
    const workouts: WhoopWorkoutResponse[] = await workoutResponse.json();

    // Group workouts by date
    const workoutsByDate: Record<string, WhoopWorkoutResponse[]> = {};
    workouts.forEach(workout => {
      const date = this.formatDate(workout.start);
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = [];
      }
      workoutsByDate[date].push(workout);
    });

    // Convert to DailyMetrics
    return this.toDailyMetrics(recoveries, sleeps, workoutsByDate);
  }
}

