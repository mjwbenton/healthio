import { APIGatewayEvent, S3Event, SNSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  MetricsData,
  WorkoutData,
  isMetricsData,
  isWorkoutData,
} from "./SourceData";
import { handleMetricsData } from "./metrics";
import { handleWorkoutData } from "./workouts";

const S3 = new S3Client({});

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
  const data: MetricsData | WorkoutData = JSON.parse(dataStr);

  if (isMetricsData(data)) {
    return handleMetricsData(data);
  }

  if (isWorkoutData(data)) {
    return handleWorkoutData(data);
  }

  throw new Error("Invalid data type");
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
