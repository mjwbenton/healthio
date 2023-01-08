import { Duration, Stack } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "path";

export default class HealthioIngestionStack extends Stack {
  public readonly dataTable: ITable;
  public readonly ingestionFunction: IFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.dataTable = new Table(this, "DataTable", {
      partitionKey: { name: "aggregation", type: AttributeType.STRING },
      sortKey: { name: "date", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    this.ingestionFunction = new NodejsFunction(this, "Lambda", {
      entry: path.join(__dirname, "../../ingestion-lambda/dist/index.js"),
      handler: "handler",
      bundling: {
        target: "es2021",
        environment: {
          NODE_ENV: "production",
        },
      },
      timeout: Duration.minutes(1),
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
    });
  }
}
