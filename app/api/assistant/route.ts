import { NextRequest, NextResponse } from "next/server";
import { processUserTranscript } from "@/lib/ai/agents/searchAgent";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const intent = await processUserTranscript(transcript);

    return NextResponse.json(intent);
  } catch (error) {
    logger.error({ err: error }, "Assistant API Error");
    return NextResponse.json({ error: "Failed to process voice command" }, { status: 500 });
  }
}
