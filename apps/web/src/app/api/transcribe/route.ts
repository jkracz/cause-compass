import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(arrayBuffer);

    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: audioData,
    });

    return NextResponse.json({
      text: result.text,
      language: result.language,
      durationInSeconds: result.durationInSeconds,
    });
  } catch (error) {
    console.error("Transcription error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Transcription service not configured" },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
