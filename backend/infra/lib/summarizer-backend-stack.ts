import { Arn, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { CorsHttpMethod, HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket, BucketEncryption, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import {
  Choice,
  Condition,
  JsonPath,
  Pass,
  StateMachine,
  TaskInput,
  Wait,
  WaitTime
} from "aws-cdk-lib/aws-stepfunctions";
import {
  DynamoUpdateItem,
  LambdaInvoke,
  CallAwsService,
  DynamoAttributeValue
} from "aws-cdk-lib/aws-stepfunctions-tasks";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import path from "node:path";

export class SummarizerBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const jobsTable = new Table(this, "JobsTable", {
      partitionKey: { name: "jobId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: RemovalPolicy.DESTROY
    });

    const audioBucket = new Bucket(this, "AudioBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: Duration.days(1)
        }
      ]
    });

    const modelId = this.node.tryGetContext("bedrockModelId") ?? "us.amazon.nova-2-lite-v1:0";
    const bedrockModelArn = Arn.format(
      {
        service: "bedrock",
        region: this.region,
        account: "",
        resource: "foundation-model",
        resourceName: modelId
      },
      this
    );

    const summarizeJobLambda = new NodejsFunction(this, "SummarizeJobLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambdas", "summarize-job.ts"),
      handler: "handler",
      timeout: Duration.minutes(2),
      environment: {
        JOBS_TABLE_NAME: jobsTable.tableName,
        AUDIO_BUCKET_NAME: audioBucket.bucketName,
        MODEL_ID: modelId,
        MAX_INPUT_CHARS: "24000"
      }
    });

    const createUploadUrlLambda = new NodejsFunction(this, "CreateUploadUrlLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambdas", "create-upload-url.ts"),
      handler: "handler",
      timeout: Duration.seconds(10),
      environment: {
        AUDIO_BUCKET_NAME: audioBucket.bucketName
      }
    });

    const updateToTranscribing = new DynamoUpdateItem(this, "UpdateToTranscribing", {
      table: jobsTable,
      key: { jobId: DynamoAttributeValue.fromString(JsonPath.stringAt("$.jobId")) },
      updateExpression: "SET #status = :status, #progress = :progress, #updatedAt = :updatedAt",
      expressionAttributeNames: {
        "#status": "status",
        "#progress": "progress",
        "#updatedAt": "updatedAt"
      },
      expressionAttributeValues: {
        ":status": DynamoAttributeValue.fromString("TRANSCRIBING"),
        ":progress": DynamoAttributeValue.fromNumber(25),
        ":updatedAt": DynamoAttributeValue.fromNumber(JsonPath.numberAt("$.now"))
      },
      resultPath: JsonPath.DISCARD
    });

    const transcribeJobArn = this.formatArn({
      service: "transcribe",
      resource: "transcription-job",
      resourceName: "*"
    });

    const startTranscribe = new CallAwsService(this, "StartTranscriptionJob", {
      service: "transcribe",
      action: "startTranscriptionJob",
      iamResources: [transcribeJobArn],
      parameters: {
        TranscriptionJobName: JsonPath.format("job-{}", JsonPath.stringAt("$.jobId")),
        LanguageCode: "en-US",
        Media: {
          MediaFileUri: JsonPath.format(
            "s3://{}/{}",
            JsonPath.stringAt("$.bucket"),
            JsonPath.stringAt("$.audioKey")
          )
        },
        OutputBucketName: JsonPath.stringAt("$.bucket"),
        OutputKey: JsonPath.stringAt("$.transcriptKey")
      },
      resultPath: JsonPath.DISCARD
    });

    const waitForTranscribe = new Wait(this, "WaitForTranscribe", {
      time: WaitTime.duration(Duration.seconds(10))
    });

    const getTranscribe = new CallAwsService(this, "GetTranscriptionJob", {
      service: "transcribe",
      action: "getTranscriptionJob",
      iamResources: [transcribeJobArn],
      parameters: {
        TranscriptionJobName: JsonPath.format("job-{}", JsonPath.stringAt("$.jobId"))
      },
      resultPath: "$.transcribe"
    });

    const updateFailed = new DynamoUpdateItem(this, "UpdateFailed", {
      table: jobsTable,
      key: { jobId: DynamoAttributeValue.fromString(JsonPath.stringAt("$.jobId")) },
      updateExpression: "SET #status = :status, #message = :message, #updatedAt = :updatedAt",
      expressionAttributeNames: {
        "#status": "status",
        "#message": "message",
        "#updatedAt": "updatedAt"
      },
      expressionAttributeValues: {
        ":status": DynamoAttributeValue.fromString("FAILED"),
        ":message": DynamoAttributeValue.fromString(
          JsonPath.stringAt("$.transcribe.TranscriptionJob.FailureReason")
        ),
        ":updatedAt": DynamoAttributeValue.fromNumber(JsonPath.numberAt("$.now"))
      },
      resultPath: JsonPath.DISCARD
    });

    const deleteAudio = new CallAwsService(this, "DeleteAudioObject", {
      service: "s3",
      action: "deleteObject",
      iamResources: [audioBucket.arnForObjects("*")],
      parameters: {
        Bucket: audioBucket.bucketName,
        Key: JsonPath.stringAt("$.audioKey")
      },
      resultPath: JsonPath.DISCARD
    });

    const deleteTranscript = new CallAwsService(this, "DeleteTranscriptObject", {
      service: "s3",
      action: "deleteObject",
      iamResources: [audioBucket.arnForObjects("*")],
      parameters: {
        Bucket: audioBucket.bucketName,
        Key: JsonPath.stringAt("$.transcriptKey")
      },
      resultPath: JsonPath.DISCARD
    });

    const summarizeJob = new LambdaInvoke(this, "SummarizeJob", {
      lambdaFunction: summarizeJobLambda,
      payload: TaskInput.fromObject({
        jobId: JsonPath.stringAt("$.jobId"),
        bucket: JsonPath.stringAt("$.bucket"),
        transcriptKey: JsonPath.stringAt("$.transcriptKey"),
        audioKey: JsonPath.stringAt("$.audioKey"),
        notes: JsonPath.stringAt("$.notes")
      }),
      resultPath: JsonPath.DISCARD
    });

    const definition = new Pass(this, "PrepareInput", {
      parameters: {
        "jobId.$": "$.jobId",
        "audioKey.$": "$.audioKey",
        "notes.$": "$.notes",
        "bucket": audioBucket.bucketName,
        "transcriptKey.$": "$.transcriptKey",
        "now.$": "$.now",
        "attempt": 0
      }
    })
      .next(updateToTranscribing)
      .next(startTranscribe)
      .next(waitForTranscribe)
      .next(getTranscribe);

    const incrementAttempt = new Pass(this, "IncrementAttempt", {
      parameters: {
        "jobId.$": "$.jobId",
        "audioKey.$": "$.audioKey",
        "notes.$": "$.notes",
        "bucket.$": "$.bucket",
        "transcriptKey.$": "$.transcriptKey",
        "now.$": "$.now",
        "attempt.$": JsonPath.mathAdd(JsonPath.numberAt("$.attempt"), 1),
        "transcribe.$": "$.transcribe"
      }
    });

    const updateTimedOut = new DynamoUpdateItem(this, "UpdateTimedOut", {
      table: jobsTable,
      key: { jobId: DynamoAttributeValue.fromString(JsonPath.stringAt("$.jobId")) },
      updateExpression: "SET #status = :status, #message = :message, #updatedAt = :updatedAt",
      expressionAttributeNames: {
        "#status": "status",
        "#message": "message",
        "#updatedAt": "updatedAt"
      },
      expressionAttributeValues: {
        ":status": DynamoAttributeValue.fromString("FAILED"),
        ":message": DynamoAttributeValue.fromString("Transcription timed out"),
        ":updatedAt": DynamoAttributeValue.numberFromString(JsonPath.stringAt("$.now"))
      },
      resultPath: JsonPath.DISCARD
    });

    updateTimedOut.next(deleteAudio).next(deleteTranscript);

    const checkAttempt = new Choice(this, "AttemptsExceeded?");
    checkAttempt
      .when(Condition.numberGreaterThanEquals("$.attempt", 60), updateTimedOut)
      .otherwise(waitForTranscribe);

    const checkTranscribe = new Choice(this, "TranscribeComplete?");
    checkTranscribe
      .when(
        Condition.stringEquals(
          "$.transcribe.TranscriptionJob.TranscriptionJobStatus",
          "COMPLETED"
        ),
        summarizeJob
      )
      .when(
        Condition.stringEquals(
          "$.transcribe.TranscriptionJob.TranscriptionJobStatus",
          "FAILED"
        ),
        updateFailed.next(deleteAudio).next(deleteTranscript)
      )
      .otherwise(incrementAttempt.next(checkAttempt));

    waitForTranscribe.next(getTranscribe).next(checkTranscribe);

    const workflow = new StateMachine(this, "SummaryWorkflow", {
      definition,
      timeout: Duration.minutes(10)
    });

    const startJobLambda = new NodejsFunction(this, "StartJobLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambdas", "start-job.ts"),
      handler: "handler",
      timeout: Duration.seconds(15),
      environment: {
        JOBS_TABLE_NAME: jobsTable.tableName,
        STATE_MACHINE_ARN: workflow.stateMachineArn
      }
    });

    const getJobLambda = new NodejsFunction(this, "GetJobLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambdas", "get-job.ts"),
      handler: "handler",
      timeout: Duration.seconds(10),
      environment: {
        JOBS_TABLE_NAME: jobsTable.tableName
      }
    });

    jobsTable.grantReadWriteData(startJobLambda);
    jobsTable.grantReadData(getJobLambda);
    jobsTable.grantReadWriteData(summarizeJobLambda);
    audioBucket.grantReadWrite(startJobLambda);
    audioBucket.grantReadWrite(summarizeJobLambda);
    audioBucket.grantPut(createUploadUrlLambda);
    workflow.grantStartExecution(startJobLambda);

    summarizeJobLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [bedrockModelArn]
      })
    );

    const corsOrigins =
      (this.node.tryGetContext("corsOrigins") as string[] | undefined) ?? ["*"];

    const api = new HttpApi(this, "SummarizerApi", {
      apiName: "summarizer-api",
      corsPreflight: {
        allowHeaders: ["Content-Type", "x-api-key"],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowOrigins: corsOrigins,
        maxAge: Duration.days(10)
      }
    });

    api.addRoutes({
      path: "/v1/summary/uploads",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("CreateUploadIntegration", createUploadUrlLambda)
    });

    api.addRoutes({
      path: "/v1/summary/jobs",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("StartJobIntegration", startJobLambda)
    });

    api.addRoutes({
      path: "/v1/summary/jobs/{jobId}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetJobIntegration", getJobLambda)
    });
  }
}
