import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const TABLE_NAME = process.env.JOBS_TABLE_NAME ?? "";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const jsonResponse = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (!TABLE_NAME) {
    return jsonResponse(500, { error: "Missing JOBS_TABLE_NAME" });
  }

  const jobId = event.pathParameters?.jobId;
  if (!jobId) {
    return jsonResponse(400, { error: "Missing jobId" });
  }

  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { jobId }
    })
  );

  if (!result.Item) {
    return jsonResponse(404, { error: "Job not found" });
  }

  return jsonResponse(200, {
    jobId: result.Item.jobId,
    status: result.Item.status,
    progress: result.Item.progress,
    resultMarkdown: result.Item.resultMarkdown,
    message: result.Item.message
  });
};
