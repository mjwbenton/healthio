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
  units: string;
}

export interface Workout {
  name: string;
  start: string;
  duration: number;
  distance?: {
    qty: number;
    units: "km";
  };
  activeEnergyBurned: {
    qty: number;
    units: "kJ"; // This is being incorrectly returned by Auto Export. Is actually kcal.
  };
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
