import { Duration, Fn, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as path from "path";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginProtocolPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

const HOSTED_ZONE = "mattb.tech";
const HOSTED_ZONE_ID = "Z2GPSB1CDK86DH";
const DOMAIN_NAME = "graphql.healthio.mattb.tech";

export default class HealthioGraphqlStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { dataTable, workoutTable }: { dataTable: ITable; workoutTable: ITable }
  ) {
    super(scope, id);

    const lambda = new NodejsFunction(this, "Lambda", {
      entry: path.join(__dirname, "../../graphql-lambda/dist/index.js"),
      handler: "handler",
      bundling: {
        target: "es2021",
        environment: {
          NODE_ENV: "production",
        },
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string): string[] => {
            return [
              `cp ${inputDir}/packages/graphql-lambda/src/schema.graphql ${outputDir}`,
            ];
          },
        },
      },
      timeout: Duration.minutes(1),
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      environment: {
        DATA_TABLE: dataTable.tableName,
        WORKOUT_TABLE: workoutTable.tableName,
      },
    });
    const url = lambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });
    dataTable.grantReadData(lambda);
    workoutTable.grantReadData(lambda);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: HOSTED_ZONE_ID,
      zoneName: HOSTED_ZONE,
    });

    const certificate = new DnsValidatedCertificate(this, "Certificate", {
      domainName: DOMAIN_NAME,
      hostedZone,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new HttpOrigin(Fn.select(2, Fn.split("/", url.url)), {
          protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          httpsPort: 443,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      certificate,
      domainNames: [DOMAIN_NAME],
    });

    new ARecord(this, "DomainRecord", {
      zone: hostedZone,
      recordName: DOMAIN_NAME,
      ttl: Duration.minutes(5),
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
