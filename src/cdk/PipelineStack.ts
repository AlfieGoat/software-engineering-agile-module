import { Stack, type StackProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { type Construct } from "constructs";
import { PipelineStage } from "./PipelineStage";

/**
 * The stack that defines the application pipeline
 */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "ProductBuilderPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
          "AlfieGoat/software-engineering-agile-module",
          "mainline"
        ),
        env: {
          SKIP_ENV_VALIDATION: "1",
        },
        commands: ["npm install", "npm run synth"],
      }),
    });

    const betaStage = new PipelineStage(this, "BetaStage", {});

    pipeline.addStage(betaStage);

    const prodStage = new PipelineStage(this, "ProdStage", {});

    pipeline.addStage(prodStage);
  }
}
