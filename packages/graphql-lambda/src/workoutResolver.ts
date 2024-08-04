import parseISO from "date-fns/parseISO";
import { Workout, getWorkoutData } from "./data";
import { ActivityWorkoutsArgs, QueryActivityArgs } from "./generated/graphql";
import { getForwardedArgs } from "./util";
import { getYear } from "date-fns/esm";

const VALID_WORKOUT_TYPES = [
  "pool_swim",
  "functional_strength_training",
  "outdoor_run",
];

export default async function workoutResolver(
  parent: unknown,
  { type }: ActivityWorkoutsArgs
) {
  if (!VALID_WORKOUT_TYPES.includes(type)) {
    return null;
  }
  const { startDate, endDate } = getForwardedArgs<QueryActivityArgs>(parent);
  const workouts = await getWorkoutData(type, startDate, endDate);

  return {
    type,
    ...transformNumbers(aggregateWorkouts(workouts)),
    workouts: workouts.map(transformWorkout),
    months: generateMonthsBetween(startDate, endDate).map((date) => {
      const monthWorkouts = workouts.filter((workout) => {
        const workoutDate = parseISO(workout.startTime);
        return (
          workoutDate.getFullYear() === date.getFullYear() &&
          workoutDate.getMonth() === date.getMonth()
        );
      });
      return {
        year: getYear(date),
        month: date.getMonth() + 1,
        workouts: monthWorkouts.map(transformWorkout),
        ...transformNumbers(aggregateWorkouts(monthWorkouts)),
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

function aggregateWorkouts(workouts: Array<Workout>) {
  return workouts.reduce(
    (acc, cur) => {
      acc.durationSeconds += cur.durationSeconds;
      acc.activeEnergyBurned += cur.activeEnergyBurned;
      if (cur.distance) {
        acc.distance = (acc.distance ?? 0) + cur.distance;
      }
      return acc;
    },
    {
      durationSeconds: 0,
      activeEnergyBurned: 0,
      distance: undefined as number | undefined,
    }
  );
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
