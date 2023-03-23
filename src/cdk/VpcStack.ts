import { Stack, type StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc, type IVpc } from "aws-cdk-lib/aws-ec2";
import { type Construct } from "constructs";

export class VpcStack extends Stack {
  readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, `${id}-VPC`, {
      cidr: "10.0.0.0/20",
      maxAzs: 99, // To use "all AZs" available to your account, use a high number (such as 99).
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: "PublicSubnet",
        },
        {
          name: 'Database',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        }
      ],
    });
  }
}
