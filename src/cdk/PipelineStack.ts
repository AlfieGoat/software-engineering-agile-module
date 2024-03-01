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

    const githubRepo = CodePipelineSource.gitHub(
      "AlfieGoat/software-engineering-agile-module",
      "mainline"
    );

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "ProductBuilderPipeline",
      synth: new ShellStep("Synth", {
        input: githubRepo,
        env: {
          SKIP_ENV_VALIDATION: "1",
        },
        commands: ["npm install", "npm run synth"],
      }),
    });

    const betaStage = pipeline.addStage(
      new PipelineStage(this, "BetaStage", {
        domainName: "beta.graphqlproductbuilder.co.uk",
      })
    );

    betaStage.addPost(
      new ShellStep("Beta End To End Integration Tests", {
        input: githubRepo,
        env: {
          SKIP_ENV_VALIDATION: "1",
        },
        commands: ["npm install", "npm run e2e"],
      })
    );

    const prodStage = pipeline.addStage(
      new PipelineStage(this, "ProdStage", {
        domainName: "prod.graphqlproductbuilder.co.uk",
      })
    );

    prodStage.addPost(
      new ShellStep("Prod End To End Integration Tests", {
        input: githubRepo,
        env: {
          SKIP_ENV_VALIDATION: "1",
        },
        commands: ["npm install", "npm run e2e"],
      })
    );
  }
}
