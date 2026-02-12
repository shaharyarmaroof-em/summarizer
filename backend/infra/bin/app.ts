#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { SummarizerBackendStack } from "../lib/summarizer-backend-stack.js";

const app = new App();

new SummarizerBackendStack(app, "SummarizerBackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
