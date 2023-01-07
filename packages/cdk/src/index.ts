import { App } from "aws-cdk-lib";
import HealthioDataStack from "./HealthioDataStack";
import HealthioSyncStack from "./HealthioSyncStack";

const app = new App();
const dataStack = new HealthioDataStack(app, "HealthioData");
new HealthioSyncStack(app, "HealthioSync", {
  dataBucket: dataStack.sourceDataBucket,
});
