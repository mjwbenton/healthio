import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import formatISO from "date-fns/formatISO";
import { cleanEnv, str } from "envalid";

const DYNAMO_CLIENT = new DynamoDBClient({});

const { DATA_TABLE } = cleanEnv(process.env, {
  DATA_TABLE: str(),
});

export async function getSummedValue(
  metric: string,
  from: Date,
  to: Date
): Promise<number> {
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
  return (
    results.Items?.reduce(
      (acc, cur) => acc + parseInt(cur.value.N ?? "0"),
      0
    ) ?? 0
  );
}
