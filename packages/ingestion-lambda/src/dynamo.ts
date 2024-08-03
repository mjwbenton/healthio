import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { cleanEnv, str } from "envalid";

export const { DATA_TABLE, WORKOUT_TABLE } = cleanEnv(process.env, {
  DATA_TABLE: str(),
  WORKOUT_TABLE: str(),
});
export const DYNAMO_CLIENT = new DynamoDBClient({});
export const CHUNK_SIZE = 25;
