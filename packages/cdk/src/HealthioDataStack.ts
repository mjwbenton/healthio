import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";

export default class HealthioDataStack extends Stack {
  public readonly sourceDataBucket: IBucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.sourceDataBucket = new Bucket(this, "SourceDataBucket");
  }
}
