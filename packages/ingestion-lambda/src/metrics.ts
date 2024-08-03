import chunk from "lodash.chunk";
import { Datum, MetricsData } from "./SourceData";
import { CHUNK_SIZE, DATA_TABLE, DYNAMO_CLIENT } from "./dynamo";
import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";

const WALKING_METRIC = "walking_running_distance";
const SWIMMING_METRIC = "swimming_distance";
const KM_TO_M = 1000;

export async function handleMetricsData(data: MetricsData) {
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

function extractDate(datum: Datum) {
  return datum.date.slice(0, 10);
}

function extractValue(datum: Datum, multiplier: number = 1) {
  if (!datum.qty) {
    return 0;
  }
  return Math.round((datum.qty + Number.EPSILON) * multiplier);
}
