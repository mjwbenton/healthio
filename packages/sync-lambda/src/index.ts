import { APIGatewayEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { str, cleanEnv } from "envalid";

const SECRET_HEADER_NAME = "x-healthio-secret";

const { DATA_BUCKET, SECRET_NAME } = cleanEnv(process.env, {
  DATA_BUCKET: str(),
  SECRET_NAME: str(),
});

const S3 = new S3Client({});
const SecretsManager = new SecretsManagerClient({});

export async function handler(event: APIGatewayEvent) {
  const Key = `${new Date().toISOString()}.json`;

  const { SecretString: secretValue } = await SecretsManager.send(
    new GetSecretValueCommand({
      SecretId: SECRET_NAME,
    })
  );
  const secretHeaderValue = event.headers[SECRET_HEADER_NAME];

  if (secretHeaderValue !== secretValue) {
    console.log(`Recieved ${secretHeaderValue} in ${SECRET_HEADER_NAME}`);
    throw new Error("Invalid secret");
  }

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
