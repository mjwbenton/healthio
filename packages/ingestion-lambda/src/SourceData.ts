export interface MetricsData {
  data: {
    metrics: Metric[];
  };
}

export interface WorkoutData {
  data: {
    workouts: Workout[];
  };
}

export interface Metric {
  name: string;
  data: Datum[];
}

export interface Datum {
  date: string;
  qty?: number;
}

export interface Workout {
  name: string;
  start: string;
  duration: number;
}

export function isMetricsData(
  data: MetricsData | WorkoutData
): data is MetricsData {
  return (data as MetricsData).data.metrics !== undefined;
}

export function isWorkoutData(
  data: MetricsData | WorkoutData
): data is WorkoutData {
  return (data as WorkoutData).data.workouts !== undefined;
}
