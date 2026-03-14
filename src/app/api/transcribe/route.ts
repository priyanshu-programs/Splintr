import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Transcription service is not configured (missing GROQ_API_KEY)" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "An audio or video file is required" },
        { status: 400 }
      );
    }

    // Groq Whisper has a 25MB limit
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size for transcription is 25MB." },
        { status: 413 }
      );
    }

    const supportedFormats = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".mpeg", ".mpga", ".webm"];
    const fileName = file.name.toLowerCase();
    const isSupported = supportedFormats.some((ext) => fileName.endsWith(ext));

    if (!isSupported) {
      return NextResponse.json(
        { error: `Unsupported audio format. Supported: ${supportedFormats.join(", ")}` },
        { status: 400 }
      );
    }

    // Send to Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("response_format", "verbose_json");

    const response = await fetch(GROQ_WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq Whisper error:", response.status, errorBody);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Transcription rate limit reached. Please try again in a minute." },
          { status: 429 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Transcription service authentication failed. Check GROQ_API_KEY." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Transcription failed: ${response.statusText}` },
        { status: 500 }
      );
    }

    const result = await response.json() as {
      text: string;
      duration?: number;
      language?: string;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    return NextResponse.json({
      transcript: result.text,
      duration: result.duration || 0,
      language: result.language || "en",
      status: "complete",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to transcribe: ${message}` },
      { status: 500 }
    );
  }
}
