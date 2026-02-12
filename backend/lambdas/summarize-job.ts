import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Context } from "aws-lambda";

const TABLE_NAME = process.env.JOBS_TABLE_NAME ?? "";
const AUDIO_BUCKET_NAME = process.env.AUDIO_BUCKET_NAME ?? "";
const MODEL_ID = process.env.MODEL_ID ?? "";
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS ?? "24000");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const bedrock = new BedrockRuntimeClient({});

type SummarizeEvent = {
  jobId: string;
  bucket: string;
  transcriptKey: string;
  audioKey: string;
  notes?: string;
};

type TranscribeOutput = {
  results?: {
    transcripts?: Array<{ transcript?: string }>;
  };
};

const getTranscriptText = (payload: TranscribeOutput) =>
  payload.results?.transcripts?.[0]?.transcript ?? "";

const streamToString = async (stream: unknown): Promise<string> => {
  if (!stream || typeof (stream as { on?: unknown }).on !== "function") {
    return "";
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    (stream as NodeJS.ReadableStream)
      .on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

const updateJob = async (jobId: string, values: Record<string, unknown>) => {
  const expressionParts = Object.keys(values).map((key) => `#${key} = :${key}`);
  const expressionAttributeNames = Object.fromEntries(
    Object.keys(values).map((key) => [`#${key}`, key])
  );
  const expressionAttributeValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [`:${key}`, value])
  );

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { jobId },
      UpdateExpression: `SET ${expressionParts.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    })
  );
};

const buildPrompt = (transcript: string, notes: string) => `
You are a meeting summarizer. Use the transcript and notes to produce a concise summary in the exact template below.
Do not add any extra sections or commentary.

Template:
# Voice Note — <DATE TIME>

## Title - <TITLE>

## Summary

- <SUMMARY_TEXT>

## Key Points

- <KEY_POINT>
- <KEY_POINT>

## Tasks

- [ ] <TASK_ITEM>
- [ ] <TASK_ITEM>

## Reminders

- <REMINDER_ITEM>

## Follow up Questions

- <QUESTION_ITEM>

Notes:
${notes || "(none)"}

Transcript:
${transcript}
`;

export const handler = async (event: SummarizeEvent, _context: Context) => {
  if (!TABLE_NAME || !AUDIO_BUCKET_NAME || !MODEL_ID) {
    throw new Error("Missing backend configuration");
  }

  const now = Math.floor(Date.now() / 1000);
  await updateJob(event.jobId, { status: "SUMMARIZING", progress: 60, updatedAt: now });

  try {
    const transcriptObject = await s3.send(
      new GetObjectCommand({
        Bucket: AUDIO_BUCKET_NAME,
        Key: event.transcriptKey
      })
    );
    const transcriptBody = await streamToString(transcriptObject.Body);
    const transcriptJson = JSON.parse(transcriptBody) as TranscribeOutput;
    const transcript = getTranscriptText(transcriptJson).slice(0, MAX_INPUT_CHARS);
    if (!transcript.trim()) {
      throw new Error("Transcript was empty");
    }

    const prompt = buildPrompt(transcript, event.notes ?? "");

    const response = await bedrock.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [
          {
            text: "You produce structured meeting notes. Follow the template exactly."
          }
        ],
        messages: [
          {
            role: "user",
            content: [{ text: prompt }]
          }
        ],
        inferenceConfig: {
          maxTokens: 1024,
          temperature: 0.2
        }
      })
    );

    await updateJob(event.jobId, { status: "FORMATTING", progress: 85, updatedAt: now });

    const outputText = response.output?.message?.content
      ?.map((item) => item.text ?? "")
      .join("")
      .trim();

    const fallbackMarkdown = `# Voice Note — ${new Date().toISOString()}\n\n## Title - ...\n\n## Summary\n\n- ...\n\n## Key Points\n\n- ...\n- ...\n\n## Tasks\n\n- [ ] ...\n\n## Reminders\n\n- ...\n\n## Follow up Questions\n\n- ...`;
    const resultMarkdown = outputText || fallbackMarkdown;

    await updateJob(event.jobId, {
      status: "SUCCEEDED",
      progress: 100,
      updatedAt: Math.floor(Date.now() / 1000),
      resultMarkdown
    });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: AUDIO_BUCKET_NAME,
        Key: event.audioKey
      })
    );
    await s3.send(
      new DeleteObjectCommand({
        Bucket: AUDIO_BUCKET_NAME,
        Key: event.transcriptKey
      })
    );
  } catch (error) {
    await updateJob(event.jobId, {
      status: "FAILED",
      progress: 100,
      updatedAt: Math.floor(Date.now() / 1000),
      message: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
};
