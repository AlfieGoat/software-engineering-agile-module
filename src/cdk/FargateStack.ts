import { Stack, type StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
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
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { type Construct } from "constructs";

interface FargateStackProps extends StackProps {
  dockerImageDirectory: string;
  dockerFile: string;
}

export class FargateStack extends Stack {
  constructor(scope: Construct, id: string, props: FargateStackProps) {
    super(scope, id, props);

    const dockerImage = new DockerImageAsset(this, `${id}-BackDockerImage`, {
      directory: props.dockerImageDirectory,
      exclude: [
        "cdk.out",
        ".env",
        "Dockerfile",
        ".dockerignore",
        "node_modules",
        "npm-debug.log",
        ".next",
        ".git",
        "README.md",
      ],
      file: props.dockerFile,
    });

    const vpc = new Vpc(this, `${id}-VPC`, {
      cidr: "10.0.0.0/20",
      maxAzs: 3,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: "PublicSubnet",
        },
      ],
    });

    const cluster = new Cluster(this, `${id}-Cluster`, {
      vpc: vpc,
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
      image: ContainerImage.fromDockerImageAsset(dockerImage),
      portMappings: [{ containerPort: 3000, hostPort: 3000 }],
      environment: {
        DATABASE_URL: secretConfig
          .secretValueFromJson("DATABASE_URL")
          .unsafeUnwrap()
          .toString(),
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

    taskDefinition.addContainer(`${id}-PostgresContainer`, {
      image: ContainerImage.fromRegistry("docker.io/postgres/postgres:latest"),
      portMappings: [{ containerPort: 5432, hostPort: 5432 }],
      environment: {
        POSTGRES_PASSWORD: secretConfig
          .secretValueFromJson("POSTGRES_PASSWORD")
          .unsafeUnwrap()
          .toString(),
      },
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
      }
    );

    fargateService.targetGroup.configureHealthCheck({ path: "/" });
  }
}
