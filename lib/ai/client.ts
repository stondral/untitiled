import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

const region = process.env.AWS_REGION || "us-east-1";

export const bedrockClient = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const NOVA_LITE_MODEL_ID = "amazon.nova-lite-v1:0";
