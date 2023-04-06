import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  type IVpc,
} from "aws-cdk-lib/aws-ec2";
import { type DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import {
  AwsLogDriver,
  AwsLogDriverMode,
  Cluster,
  Compatibility,
  ContainerImage,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  type IDatabaseCluster,
} from "aws-cdk-lib/aws-rds";
import { Secret, type ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { type Construct } from "constructs";

import { RunTask } from "cdk-fargate-run-task";

const PORT = 3306;

const DATABASE_NAME = "product_builder_db";

const SECRET_USERNAME_KEY = "username";
const SECRET_PASSWORD_KEY = "password";

interface DatabaseStackProps extends StackProps {
  vpc: IVpc;
  dockerImage: DockerImageAsset;
}

export class DatabaseStack extends Stack {
  private database: IDatabaseCluster;
  public databaseSecret: ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new SecurityGroup(this, `${id}-DbSecurityGroup`, {
      vpc: props.vpc,
    });

    dbSecurityGroup.addIngressRule(
      Peer.ipv4(props.vpc.vpcCidrBlock),
      Port.tcp(PORT),
      `Allow port ${PORT} for database connections within the VPC.`
    );

    this.databaseSecret = new Secret(this, `${id}-databaseSecret`, {
      secretName: "db-root-secret",
      description: "Database root user credentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          [SECRET_USERNAME_KEY]: "rootuser",
        }),
        generateStringKey: SECRET_PASSWORD_KEY,
        passwordLength: 16,
        excludePunctuation: true,
      },
    });

    this.database = new DatabaseCluster(this, `${id}-DBCluster`, {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      port: PORT,
      defaultDatabaseName: DATABASE_NAME,
      credentials: Credentials.fromSecret(this.databaseSecret),
      backup: { retention: Duration.days(14), preferredWindow: "01:00-02:00" },
      storageEncrypted: true,
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
        securityGroups: [dbSecurityGroup],
        allowMajorVersionUpgrade: true,
        autoMinorVersionUpgrade: true,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      },
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
      command: ["npx", "prisma", "migrate", "deploy"],
      environment: {
        DATABASE_URL: this.getDatabaseUrl(),
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

    const cluster = new Cluster(this, `${id}-Cluster`, {
      vpc: props.vpc,
    });

    new RunTask(this, "RunDemoTaskOnce", {
      task: taskDefinition,
      cluster,
      assignPublicIp: true,
    });
  }

  getDatabaseUrl() {
    return `mysql://${this.databaseSecret
      .secretValueFromJson(SECRET_USERNAME_KEY)
      .unsafeUnwrap()
      .toString()}:${this.databaseSecret
      .secretValueFromJson(SECRET_PASSWORD_KEY)
      .unsafeUnwrap()
      .toString()}@${this.database.clusterEndpoint.hostname}:${
      this.database.clusterEndpoint.port
    }/${DATABASE_NAME}`;
  }
}
