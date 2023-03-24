import { Stack, type StackProps } from "aws-cdk-lib";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { type Construct } from "constructs";

interface FargateStackProps extends StackProps {
  dockerImageDirectory: string;
  dockerFile: string;
}

export class DockerImageStack extends Stack {
  dockerImage: DockerImageAsset;

  constructor(scope: Construct, id: string, props: FargateStackProps) {
    super(scope, id, props);

    this.dockerImage = new DockerImageAsset(this, `${id}-BackDockerImage`, {
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
  }
}
