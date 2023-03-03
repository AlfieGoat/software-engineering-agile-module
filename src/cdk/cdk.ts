import { App } from "aws-cdk-lib";
import { PipelineStack } from "./PipelineStack";

const app = new App();

new PipelineStack(app, "Pipeline", {});