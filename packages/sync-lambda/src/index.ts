import { APIGatewayEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { str, cleanEnv } from "envalid";

const { DATA_BUCKET } = cleanEnv(process.env, {
  DATA_BUCKET: str(),
});

const S3 = new S3Client({});

export async function handler(event: APIGatewayEvent) {
  const Key = new Date().toISOString();
  const Body = event.body;
  if (!Body) {
    throw new Error("Missing request body");
  }
  await S3.send(
    new PutObjectCommand({
      Bucket: DATA_BUCKET,
      Key,
      Body,
    })
  );
  return {
    statusCode: 200,
  };
}
