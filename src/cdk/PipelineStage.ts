import { Stage, type StageProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { join } from "path";
import { DatabaseStack } from "./DatabaseStack";
import { DockerImageStack } from "./DockerImageStack";
import { FargateStack } from "./FargateStack";
import { HostedZoneStack } from "./HostedZoneStack";
import { VpcStack } from "./VpcStack";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    const domainName = `graphqlproductbuilder.co.uk`;

    const hostedZoneStack = new HostedZoneStack(this, "HostedZoneStack", {
      domainName,
    });

    const { vpc } = new VpcStack(this, "VpcStack", {});

    const dockerImageStack = new DockerImageStack(this, `${id}-DockerImage`, {
      dockerImageDirectory: join(__dirname, "../../"),
      dockerFile: join("./Dockerfile"),
    });

    const databaseStack = new DatabaseStack(this, `${id}-DatabaseStack`, {
      vpc,
      dockerImage: dockerImageStack.dockerImage,
    });

    const databaseUrl = databaseStack.getDatabaseUrl();

    const fargateStack = new FargateStack(this, `${id}-ProductBuilder`, {
      vpc,

      databaseUrl,

      dockerImage: dockerImageStack.dockerImage,

      certificate: hostedZoneStack.certificate,
      hostedZone: hostedZoneStack.hostedZone,
      domainName,
    });

    fargateStack.addDependency(databaseStack);
  }
}
