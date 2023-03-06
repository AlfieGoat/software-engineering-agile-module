import { Stage, type StageProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { join } from "path";
import { FargateStack } from "./FargateStack";
import { HostedZoneStack } from "./HostedZoneStack";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    const domainName = `graphqlproductbuilder.co.uk`;

    const hostedZoneStack = new HostedZoneStack(this, "HostedZoneStack", {
      domainName,
    });

    new FargateStack(this, "ProductBuilder", {
      dockerImageDirectory: join(__dirname, "../../"),
      dockerFile: join("./Dockerfile"),

      certificate: hostedZoneStack.certificate,
      hostedZone: hostedZoneStack.hostedZone,
      domainName,
    });
  }
}
