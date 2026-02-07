import chunk from "lodash.chunk";
import { CHUNK_SIZE, DYNAMO_CLIENT, WORKOUT_TABLE } from "./dynamo";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { Workout, WorkoutData } from "./SourceData";
import { parse } from "date-fns/parse";
import { KJ_TO_KCAL, KM_TO_M } from "./conversion";

export async function handleWorkoutData(data: WorkoutData) {
  const workoutData = data.data.workouts.map((workout) => {
    const type = extractWorkoutType(workout);
    return {
      type: extractWorkoutType(workout),
      start: extractStart(workout),
      durationSeconds: extractDuration(workout),
      activeEnergyBurned: extractActiveEnergyBurned(workout),
      ...extractOptionalWorkoutData(workout),
    };
  });
  await writeWorkouts(workoutData);

  return {
    statusCode: 200,
    body: {
      workoutData,
    },
  };
}

async function writeWorkouts(
  data: Array<{
    type: string;
    start: string;
    durationSeconds: number;
    activeEnergyBurned: number;
    distance?: number;
  }>
) {
  return Promise.all(
    chunk(data, CHUNK_SIZE).map(async (batch) => {
      try {
        return await DYNAMO_CLIENT.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [WORKOUT_TABLE]: batch.map((item) => ({
                PutRequest: {
                  Item: {
                    type: { S: item.type },
                    start: { S: item.start },
                    durationSeconds: { N: item.durationSeconds.toString() },
                    activeEnergyBurned: {
                      N: item.activeEnergyBurned.toString(),
                    },
                    ...(item.distance
                      ? { distance: { N: item.distance.toString() } }
                      : {}),
                  },
                },
              })),
            },
          })
        );
      } catch (e) {
        throw new Error(
          `Failed on chunk containing workout data: ${JSON.stringify(
            batch,
            null,
            2
          )}`
        );
      }
    })
  );
}

function extractWorkoutType(workout: Workout) {
  return workout.name.toLowerCase().replaceAll(" ", "_");
}

function parseWorkoutStart(workout: Workout): Date {
  return parse(workout.start, "yyyy-MM-dd HH:mm:ss XX", new Date());
}

function extractStart(workout: Workout) {
  return parseWorkoutStart(workout).toISOString();
}

function extractDuration(workout: Workout) {
  return Math.round(workout.duration);
}

function extractUnitsValue(
  datum: { qty?: number; units: string },
  expectedUnits: string
) {
  if (!datum.qty) {
    return 0;
  }
  if (datum.units !== expectedUnits) {
    throw new Error(`Expecting ${expectedUnits} units`);
  }
  return Math.round(datum.qty + Number.EPSILON);
}

function extractKmValue(datum: { qty?: number; units: string }) {
  if (!datum.qty) {
    return 0;
  }
  if (datum.units !== "km") {
    throw new Error("Expecting km units");
  }
  return Math.round((datum.qty + Number.EPSILON) * KM_TO_M);
}

function extractOptionalWorkoutData(workout: Workout) {
  if (workout.distance) {
    if (workout.distance.units !== "km") {
      throw new Error("Expecting km units for distance");
    }
    return {
      distance: extractKmValue(workout.distance),
    };
  }
  return {};
}

// The date when Auto Export fixed the kJ/kcal bug
const AUTO_EXPORT_KJ_BUG_FIX_DATE = new Date("2026-01-19T00:00:00Z");

function extractActiveEnergyBurned(workout: Workout): number {
  if (!workout.activeEnergyBurned?.qty) {
    return 0;
  }
  if (workout.activeEnergyBurned.units !== "kJ") {
    throw new Error("Expecting kJ units");
  }

  const startDate = parseWorkoutStart(workout);
  const qty = workout.activeEnergyBurned.qty;

  if (startDate >= AUTO_EXPORT_KJ_BUG_FIX_DATE) {
    // After bug fix: kJ is actually kJ, convert to kcal
    return Math.round(qty * KJ_TO_KCAL + Number.EPSILON);
  } else {
    // Before bug fix: kJ was actually kcal, use as-is
    return Math.round(qty + Number.EPSILON);
  }
}
