import { App } from "aws-cdk-lib";
import HealthioDataStack from "./HealthioDataStack";

const app = new App();
new HealthioDataStack(app, "HealthioDataStack");
