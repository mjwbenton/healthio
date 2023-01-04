import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";

export default class HealthioSyncStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { dataBucket }: { dataBucket: IBucket }
  ) {
    super(scope, id);

    const lambda = new NodejsFunction(this, "Lambda", {
      entry: path.join(__dirname, "../../sync-lambda/dist/index.js"),
      handler: "handler",
      bundling: {
        target: "es2021",
        environment: {
          NODE_ENV: "production",
        },
      },
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
      },
    });
    const url = lambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    new CfnOutput(this, "LambdaUrl", {
      value: url.url,
    });
  }
}
