import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import crypto from "node:crypto";
import path from "node:path";

const AUDIO_BUCKET_NAME = process.env.AUDIO_BUCKET_NAME ?? "";
const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

const s3 = new S3Client({});

type UploadRequest = {
  filename: string;
  contentType: string;
  size: number;
};

const jsonResponse = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (!AUDIO_BUCKET_NAME) {
    return jsonResponse(500, { error: "Missing AUDIO_BUCKET_NAME" });
  }

  if (!event.body) {
    return jsonResponse(400, { error: "Missing request body" });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  const payload = JSON.parse(rawBody) as UploadRequest;
  if (!payload.filename || !payload.contentType || !payload.size) {
    return jsonResponse(400, { error: "Missing upload metadata" });
  }

  if (payload.size > MAX_AUDIO_BYTES) {
    return jsonResponse(400, { error: "Audio file exceeds 200MB limit" });
  }

  if (!payload.contentType.startsWith("audio/")) {
    return jsonResponse(400, { error: "Unsupported audio content type" });
  }

  const safeFilename = path.basename(payload.filename);
  const objectKey = `uploads/${crypto.randomUUID()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: AUDIO_BUCKET_NAME,
    Key: objectKey,
    ContentType: payload.contentType,
    ContentLength: payload.size
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return jsonResponse(200, {
    uploadUrl,
    s3Key: objectKey
  });
};
