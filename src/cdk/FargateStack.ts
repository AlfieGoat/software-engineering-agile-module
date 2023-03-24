import { Stack, type StackProps } from "aws-cdk-lib";
import { type ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { type IVpc } from "aws-cdk-lib/aws-ec2";
import { type DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import {
  AwsLogDriver,
  AwsLogDriverMode,
  Cluster,
  Compatibility,
  ContainerImage,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { type IHostedZone } from "aws-cdk-lib/aws-route53";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { type Construct } from "constructs";

interface FargateStackProps extends StackProps {
  vpc: IVpc;

  databaseUrl: string;

  dockerImage: DockerImageAsset;

  certificate: ICertificate;
  domainName: string;
  hostedZone: IHostedZone;
}

export class FargateStack extends Stack {
  constructor(scope: Construct, id: string, props: FargateStackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, `${id}-Cluster`, {
      vpc: props.vpc,
    });

    const taskDefinition = new TaskDefinition(this, `${id}-TaskDefinition`, {
      compatibility: Compatibility.FARGATE,
      memoryMiB: "512",
      cpu: "256",
      taskRole: new Role(this, `${id}-TaskRole`, {
        assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
        inlinePolicies: {},
      }),
    });

    const secretConfig = Secret.fromSecretNameV2(
      this,
      `${id}-SecretConfig`,
      "ProductBuilderConfig"
    );

    taskDefinition.addContainer(`${id}-FargateContainer`, {
      image: ContainerImage.fromDockerImageAsset(props.dockerImage),
      portMappings: [{ containerPort: 3000, hostPort: 3000 }],
      environment: {
        DATABASE_URL: props.databaseUrl,
        NEXTAUTH_URL: secretConfig
          .secretValueFromJson("NEXTAUTH_URL")
          .unsafeUnwrap()
          .toString(),
        GITHUB_CLIENT_ID: secretConfig
          .secretValueFromJson("GITHUB_CLIENT_ID")
          .unsafeUnwrap()
          .toString(),
        GITHUB_CLIENT_SECRET: secretConfig
          .secretValueFromJson("GITHUB_CLIENT_SECRET")
          .unsafeUnwrap()
          .toString(),
        NEXTAUTH_SECRET: secretConfig
          .secretValueFromJson("NEXTAUTH_SECRET")
          .unsafeUnwrap()
          .toString(),
      },
      logging: new AwsLogDriver({
        logRetention: RetentionDays.ONE_MONTH,
        streamPrefix: `${id}-FargateContainer`,
        mode: AwsLogDriverMode.NON_BLOCKING,
      }),
    });

    const fargateService = new ApplicationLoadBalancedFargateService(
      this,
      `${id}-FargateService`,
      {
        cluster: cluster,
        desiredCount: 1,
        taskDefinition,
        publicLoadBalancer: true,
        assignPublicIp: true,

        certificate: props.certificate,
        domainName: props.domainName,
        domainZone: props.hostedZone,
        redirectHTTP: true,
      }
    );

    fargateService.targetGroup.configureHealthCheck({ path: "/" });
  }
}
