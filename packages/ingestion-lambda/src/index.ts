import { APIGatewayEvent, S3Event, SNSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Datum, SourceData } from "./SourceData";
import {
  BatchWriteItemCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import chunk from "lodash.chunk";
import { cleanEnv, str } from "envalid";

const S3 = new S3Client({});

const WALKING_METRIC = "walking_running_distance";
const SWIMMING_METRIC = "swimming_distance";

const DYNAMO_CLIENT = new DynamoDBClient({});
const CHUNK_SIZE = 25;

const KM_TO_M = 1000;

const { DATA_TABLE } = cleanEnv(process.env, {
  DATA_TABLE: str(),
});

export async function handler(event: SNSEvent | APIGatewayEvent) {
  const { bucket, key } = isSNSEvent(event)
    ? extractFromSNSEvent(event)
    : extractFromAPIEvent(event);
  const s3Response = await S3.send(
    new GetObjectCommand({ Key: decodeURIComponent(key), Bucket: bucket })
  );
  const dataStr = await s3Response.Body?.transformToString();
  if (!dataStr) {
    throw new Error("Failed to read data from S3");
  }
  const data: SourceData = JSON.parse(dataStr);

  const walkingData = data.data.metrics
    .find((metric) => metric.name === WALKING_METRIC)
    ?.data?.map((datum) => ({
      date: extractDate(datum),
      value: extractValue(datum, KM_TO_M),
    }));
  if (walkingData) {
    await writeData(WALKING_METRIC, walkingData);
  }

  const swimmingData = data.data.metrics
    .find((metric) => metric.name === SWIMMING_METRIC)
    ?.data?.map((datum) => ({
      date: extractDate(datum),
      value: extractValue(datum),
    }));
  if (swimmingData) {
    await writeData(SWIMMING_METRIC, swimmingData);
  }

  return {
    statusCode: 200,
    body: {
      walkingData,
      swimmingData,
    },
  };
}

async function writeData(
  metric: string,
  data: Array<{ date: string; value: number }>
) {
  return Promise.all(
    chunk(data, CHUNK_SIZE).map(async (batch) => {
      try {
        return await DYNAMO_CLIENT.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [DATA_TABLE]: batch.map((item) => ({
                PutRequest: {
                  Item: {
                    metric: { S: metric },
                    date: { S: item.date },
                    value: { N: item.value.toString() },
                  },
                },
              })),
            },
          })
        );
      } catch (e) {
        throw new Error(
          `Failed on chunk containing ${metric} data: ${JSON.stringify(
            batch,
            null,
            2
          )}`
        );
      }
    })
  );
}

function isSNSEvent(e: SNSEvent | APIGatewayEvent): e is SNSEvent {
  return "Records" in e;
}

function extractFromSNSEvent(event: SNSEvent): { bucket: string; key: string } {
  const parsedEvent: S3Event = JSON.parse(event.Records[0].Sns.Message);
  const {
    object: { key },
    bucket: { name: bucket },
  } = parsedEvent.Records[0].s3;
  return { key, bucket };
}

function extractFromAPIEvent(event: APIGatewayEvent): {
  bucket: string;
  key: string;
} {
  const { bucket, key } = event.queryStringParameters ?? {};
  if (!bucket || !key) {
    throw new Error("Invalid bucket and key in API event");
  }
  return { bucket, key };
}

function extractDate(datum: Datum) {
  return datum.date.slice(0, 10);
}

function extractValue(datum: Datum, multiplier: number = 1) {
  if (!datum.qty) {
    return 0;
  }
  return Math.round((datum.qty + Number.EPSILON) * multiplier);
}
