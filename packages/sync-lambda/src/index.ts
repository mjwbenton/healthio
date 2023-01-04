import { APIGatewayEvent } from "aws-lambda";

export async function handler(event: APIGatewayEvent) {
  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
}
