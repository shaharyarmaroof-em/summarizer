import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import crypto from "node:crypto";

const TABLE_NAME = process.env.JOBS_TABLE_NAME ?? "";
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN ?? "";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sfn = new SFNClient({});

type StartJobRequest = {
  s3Key: string;
  notes?: string;
};

const jsonResponse = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (!TABLE_NAME || !STATE_MACHINE_ARN) {
    return jsonResponse(500, { error: "Missing backend configuration" });
  }

  try {
    if (!event.body) {
      return jsonResponse(400, { error: "Missing request body" });
    }
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    const payload = JSON.parse(rawBody) as StartJobRequest;
    if (!payload.s3Key) {
      return jsonResponse(400, { error: "Missing s3Key" });
    }
    if (!payload.s3Key.startsWith("uploads/")) {
      return jsonResponse(400, { error: "Invalid s3Key" });
    }
    const notes = payload.notes ?? "";
    if (notes.length > 4000) {
      throw new Error("Notes exceed 4000 characters");
    }
    const jobId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 60 * 24;
    const transcriptKey = `jobs/${jobId}/transcript.json`;

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          jobId,
          status: "QUEUED",
          progress: 5,
          createdAt: now,
          updatedAt: now,
          expiresAt,
          notes
        }
      })
    );

    await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify({
          jobId,
          audioKey: payload.s3Key,
          transcriptKey,
          notes,
          now
        })
      })
    );

    return jsonResponse(200, { jobId, status: "QUEUED" });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : "Invalid request"
    });
  }
};
