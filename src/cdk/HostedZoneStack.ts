import { Stack, type StackProps } from "aws-cdk-lib";
import {
    Certificate,
    CertificateValidation,
    type ICertificate
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone, type IHostedZone } from "aws-cdk-lib/aws-route53";
import { type Construct } from "constructs";

interface HostedZoneStackProps extends StackProps {
  domainName: string;
}

export class HostedZoneStack extends Stack {
  readonly hostedZone: IHostedZone;
  readonly certificate: ICertificate;

  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);

    this.hostedZone = new HostedZone(this, `${id}-HostedZone`, {
      zoneName: props.domainName,
    });

    this.certificate = new Certificate(this, `${id}-TlCertificate`, {
      domainName: props.domainName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

  }
}
