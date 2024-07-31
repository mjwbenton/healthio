import { App } from "aws-cdk-lib";
import HealthioDataStack from "./HealthioDataStack";
import HealthioGraphqlStack from "./HealthioGraphqlStack";
import HealthioIngestionStack from "./HealthioIngestionStack";
import HealthioSyncStack from "./HealthioSyncStack";

const app = new App();
const dataStack = new HealthioDataStack(app, "HealthioData");
new HealthioSyncStack(app, "HealthioSync", {
  dataBucket: dataStack.sourceDataBucket,
});
const ingestionStack = new HealthioIngestionStack(app, "HealthioIngestion");
dataStack.subscribeLambdaToNewData(ingestionStack.ingestionFunction);
new HealthioGraphqlStack(app, "HealthioGraphql", {
  dataTable: ingestionStack.dataTable,
  workoutTable: ingestionStack.workoutTable,
});
