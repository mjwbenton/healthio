export interface MetricsData {
  data: {
    metrics: Metric[];
  };
}

export interface WorkoutData {
  data: {
    workouts: BaseWorkout[];
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

export interface BaseWorkout {
  name: string;
  start: string;
  duration: number;
  activityEnergyBurned: {
    qty: number;
    units: "kJ"; // This is being incorrectly returned by Auto Export. Is actually kcal.
  };
}

export interface PoolWorkout extends BaseWorkout {
  name: "Pool Swim";
  distance: {
    qty: number;
    units: "km";
  };
}

export type Workout = PoolWorkout | BaseWorkout;

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

export function isPoolWorkout(workout: Workout): workout is PoolWorkout {
  return workout.name === "Pool Swim";
}
