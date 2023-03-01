import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import formatISO from "date-fns/formatISO";
import { cleanEnv, str } from "envalid";

const DYNAMO_CLIENT = new DynamoDBClient({});

const { DATA_TABLE } = cleanEnv(process.env, {
  DATA_TABLE: str(),
});

export type Data = {
  total: number;
  days: Array<{
    date: string;
    m: number;
  }>;
};

export async function getData(
  metric: string,
  from: Date,
  to: Date
): Promise<Data> {
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
