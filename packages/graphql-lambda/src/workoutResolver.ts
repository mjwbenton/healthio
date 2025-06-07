import parseISO from "date-fns/parseISO";
import { Workout, getWorkoutData } from "./data";
import { ActivityWorkoutsArgs, QueryActivityArgs } from "./generated/graphql";
import { getForwardedArgs } from "./util";
import { getYear } from "date-fns/esm";
import { endOfDay } from "date-fns/esm";
import { startOfDay } from "date-fns/esm";

const VALID_WORKOUT_TYPES = [
  "pool_swim",
  "functional_strength_training",
  "outdoor_run",
];

type TransformedWorkout = ReturnType<typeof transformWorkout>;

export default async function workoutResolver(
  parent: unknown,
  { type }: ActivityWorkoutsArgs
) {
  const { startDate, endDate } = getForwardedArgs<QueryActivityArgs>(parent);

  const typesToFetch = type ? [type] : VALID_WORKOUT_TYPES;
  if (!typesToFetch.every((t) => VALID_WORKOUT_TYPES.includes(t))) {
    return null;
  }

  const allWorkoutsResults = await Promise.all(
    typesToFetch.map((workoutType) =>
      getWorkoutData(workoutType, startOfDay(startDate), endOfDay(endDate))
    )
  );
  const allWorkouts: TransformedWorkout[] = allWorkoutsResults
    .flat()
    .map(transformWorkout)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return {
    count: allWorkouts.length,
    ...aggregateWorkouts(allWorkouts),
    workouts: allWorkouts,
    months: generateMonthsBetween(startDate, endDate).map((date) => {
      const monthWorkouts = allWorkouts.filter((workout) => {
        const workoutDate = workout.startTime;
        return (
          workoutDate.getFullYear() === date.getFullYear() &&
          workoutDate.getMonth() === date.getMonth()
        );
      });
      return {
        count: monthWorkouts.length,
        year: getYear(date),
        month: date.getMonth() + 1,
        workouts: monthWorkouts,
        ...aggregateWorkouts(monthWorkouts),
      };
    }),
  };
}

function generateMonthsBetween(from: Date, to: Date) {
  const months = [];
  let current = from;
  while (current <= to) {
    months.push(current);
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  return months;
}

function aggregateWorkouts(workouts: TransformedWorkout[]) {
  const aggregated = workouts.reduce(
    (acc, cur) => {
      acc.durationSeconds += cur.durationSeconds;
      acc.activeEnergyBurned += cur.activeEnergyBurned;
      if (cur.distance) {
        acc.distance = (acc.distance ?? 0) + cur.distance.m;
      }
      return acc;
    },
    {
      durationSeconds: 0,
      activeEnergyBurned: 0,
      distance: undefined as number | undefined,
    }
  );
  return transformNumbers(aggregated);
}

function transformNumbers(workout: Omit<Workout, "startTime">) {
  return {
    durationSeconds: workout.durationSeconds,
    activeEnergyBurned: workout.activeEnergyBurned,
    ...(workout.distance
      ? {
          distance: { m: workout.distance, km: workout.distance / 1000 },
          speed: {
            mps:
              Math.round((workout.distance / workout.durationSeconds) * 100) /
              100,
            spm:
              Math.round((workout.durationSeconds / workout.distance) * 100) /
              100,
          },
        }
      : {}),
  };
}

function transformWorkout(workout: Workout) {
  return {
    startTime: parseISO(workout.startTime),
    ...transformNumbers(workout),
  };
}
