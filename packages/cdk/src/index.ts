import { App } from "aws-cdk-lib";
import HealthioDataStack from "./HealthioDataStack";
import HealthioIngestionStack from "./HealthioIngestionStack";
import HealthioSyncStack from "./HealthioSyncStack";

const app = new App();
const dataStack = new HealthioDataStack(app, "HealthioData");
new HealthioSyncStack(app, "HealthioSync", {
  dataBucket: dataStack.sourceDataBucket,
});
const ingestionStack = new HealthioIngestionStack(app, "HealthioIngestion");
dataStack.subscribeLambdaToNewData(ingestionStack.ingestionFunction);
