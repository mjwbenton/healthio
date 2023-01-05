import { APIGatewayEvent } from "aws-lambda";

export async function handler(event: APIGatewayEvent) {
  console.log(JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
}
