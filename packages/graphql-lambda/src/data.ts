import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import formatISO from "date-fns/formatISO";
import { DATA_TABLE, WORKOUT_TABLE } from "./env";

const DYNAMO_CLIENT = new DynamoDBClient({});

export type MetricData = {
  total: number;
  days: Array<{
    date: string;
    m: number;
  }>;
};

export async function getMetricData(
  metric: string,
  from: Date,
  to: Date
): Promise<MetricData> {
  const results = await DYNAMO_CLIENT.send(
    new QueryCommand({
      TableName: DATA_TABLE,
      KeyConditionExpression:
        "metric = :m and #dateAttribute between :d1 and :d2",
      ExpressionAttributeValues: {
        ":m": { S: metric },
        ":d1": { S: formatISO(from, { representation: "date" }) },
        ":d2": { S: formatISO(to, { representation: "date" }) },
      },
      ExpressionAttributeNames: {
        "#dateAttribute": "date",
      },
    })
  );
  if (results.LastEvaluatedKey) {
    throw new Error("Failed to get all data required");
  }
  const total =
    results.Items?.reduce(
      (acc, cur) => acc + parseInt(cur.value.N ?? "0"),
      0
    ) ?? 0;
  return {
    total,
    days:
      results.Items?.map((val) => ({
        date: val.date!.S!,
        m: parseInt(val.value.N ?? "0"),
      })) ?? [],
  };
}

export type Workout = {
  startTime: string;
  duration: number;
  activeEnergyBurned: number;
  distance?: number;
};

export async function getWorkoutData(
  type: string,
  from: Date,
  to: Date
): Promise<Array<Workout>> {
  const results = await DYNAMO_CLIENT.send(
    new QueryCommand({
      TableName: WORKOUT_TABLE,
      KeyConditionExpression: "type = :t and start between :d1 and :d2",
      ExpressionAttributeValues: {
        ":t": { S: type },
        ":d1": { S: from.toISOString() },
        ":d2": { S: to.toISOString() },
      },
    })
  );
  if (results.LastEvaluatedKey) {
    throw new Error("Failed to get all data required");
  }
  const workouts =
    results.Items?.map((val) => ({
      startTime: val.start!.S!,
      duration: parseInt(val.duration!.N ?? "0"),
      activeEnergyBurned: parseInt(val.activeEnergyBurned!.N ?? "0"),
      distance: val.distance?.N ? parseInt(val.distance.N) : undefined,
    })) ?? [];

  return workouts;
}
