import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, EventType, IBucket } from "aws-cdk-lib/aws-s3";
import { SnsDestination } from "aws-cdk-lib/aws-s3-notifications";
import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export default class HealthioDataStack extends Stack {
  public readonly sourceDataBucket: IBucket;
  private readonly newDataTopic: ITopic;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.sourceDataBucket = new Bucket(this, "SourceDataBucket");
    this.newDataTopic = new Topic(this, "NewDataTopic");
    this.sourceDataBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new SnsDestination(this.newDataTopic)
    );
  }

  public subscribeLambdaToNewData(fn: IFunction) {
    this.newDataTopic.addSubscription(new LambdaSubscription(fn));
    this.sourceDataBucket.grantRead(fn);
  }
}
