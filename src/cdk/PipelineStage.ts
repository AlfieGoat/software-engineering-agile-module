import { Stage, type StageProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { join } from "path";
import { FargateStack } from "./FargateStack";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new FargateStack(this, "ProductBuilder", {
      dockerImageDirectory: join("../../"),
      dockerFile: join("."),
    });
  }
}
