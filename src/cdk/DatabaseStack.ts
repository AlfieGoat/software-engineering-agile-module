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
import {
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  type IDatabaseCluster,
} from "aws-cdk-lib/aws-rds";
import { Secret, type ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { type Construct } from "constructs";

const PORT = 3306;

const DATABASE_NAME = "product_builder_db";

const SECRET_USERNAME_KEY = "username";
const SECRET_PASSWORD_KEY = "password";

interface DatabaseStackProps extends StackProps {
  vpc: IVpc;
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
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
        securityGroups: [dbSecurityGroup],
        allowMajorVersionUpgrade: true,
        autoMinorVersionUpgrade: true,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      },
    });
  }

  getDatabaseUrl() {
    return `mysql://${this.databaseSecret
      .secretValueFromJson(SECRET_USERNAME_KEY)
      .unsafeUnwrap()
      .toString()}:${this.databaseSecret
      .secretValueFromJson(SECRET_PASSWORD_KEY)
      .unsafeUnwrap()
      .toString()}@${this.database.clusterEndpoint.hostname}:${this.database.clusterEndpoint.port}/${DATABASE_NAME}`;
  }
}
