import chunk from "lodash.chunk";
import { CHUNK_SIZE, DYNAMO_CLIENT, WORKOUT_TABLE } from "./dynamo";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { Workout, WorkoutData } from "./SourceData";
import { parse } from "date-fns/parse";
import { KM_TO_M } from "./conversion";

export async function handleWorkoutData(data: WorkoutData) {
  const workoutData = data.data.workouts.map((workout) => {
    const type = extractWorkoutType(workout);
    return {
      type: extractWorkoutType(workout),
      start: extractStart(workout),
      durationSeconds: extractDuration(workout),
      activeEnergyBurned: extractUnitsValue(workout.activeEnergyBurned, "kJ"), // This is being incorrectly returned by Auto Export. Is actually kcal.
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
  return workout.name.toLowerCase().replace(" ", "_");
}

function extractStart(workout: Workout) {
  return parse(
    workout.start,
    "yyyy-MM-dd HH:mm:ss XX",
    new Date()
  ).toISOString();
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
