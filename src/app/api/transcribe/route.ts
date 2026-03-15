import { NextRequest, NextResponse } from "next/server";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";

// --- Transcription response shape ---
interface TranscriptionResult {
  transcript: string;
  duration: number;
  language: string;
  status: "complete" | "error";
}

// --- Mock transcription content ---
const MOCK_TRANSCRIPT = `Content creation has evolved dramatically in the last few years. What used to be a single blog post now needs to be repurposed across five, six, sometimes ten different platforms. Each one has its own format, its own culture, its own unwritten rules.

The challenge for creators isn't just making good content anymore — it's making good content efficiently. You need a LinkedIn post that sounds professional, a tweet thread that's punchy and quotable, an Instagram caption that's visual and hashtagged, and a YouTube script that holds attention for ten minutes.

That's exactly why tools like Splintr exist. You feed in one piece of source content — maybe a podcast transcript, maybe a blog draft, maybe just a rough idea — and it generates platform-optimized outputs for every channel you care about. It's not about replacing your voice. It's about amplifying it across every platform without burning out.

The key is maintaining authenticity. Your audience on LinkedIn is different from your audience on TikTok, but they should all recognize your voice. The tone might shift, the format definitely changes, but the core message and personality should stay consistent.

We're seeing creators save anywhere from ten to twenty hours per week by automating the repurposing step. That's time they can spend on strategy, community engagement, or just taking a break — which, let's be honest, most creators desperately need.`;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_WHISPER_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_WHISPER_URL =
  "https://api.openai.com/v1/audio/transcriptions";

const SUPPORTED_FORMATS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".flac",
  ".mp4",
  ".mov",
  ".mpeg",
  ".mpga",
  ".webm",
];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // --- Validate input ---
    if (!file) {
      return NextResponse.json(
        { error: "An audio or video file is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "File too large. Maximum size for transcription is 25 MB.",
        },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isSupported = SUPPORTED_FORMATS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isSupported) {
      return NextResponse.json(
        {
          error: `Unsupported audio format. Supported: ${SUPPORTED_FORMATS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // --- Mock mode: return sample transcription ---
    if (MOCK_AUTH_ENABLED) {
      return NextResponse.json<TranscriptionResult>({
        transcript: MOCK_TRANSCRIPT,
        duration: 127,
        language: "en",
        status: "complete",
      });
    }

    // --- Real mode: call a Whisper-compatible API ---
    // Priority: Groq (free, fast) → OpenAI Whisper → error
    const { apiUrl, apiKey, provider } = resolveWhisperProvider();

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        {
          error:
            "Transcription service is not configured. Set GROQ_API_KEY or OPENAI_API_KEY in your environment.",
        },
        { status: 503 }
      );
    }

    const whisperForm = new FormData();
    whisperForm.append("file", file);
    whisperForm.append(
      "model",
      provider === "groq" ? "whisper-large-v3" : "whisper-1"
    );
    whisperForm.append("response_format", "verbose_json");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!response.ok) {
      return handleWhisperError(response, provider);
    }

    const result = (await response.json()) as {
      text: string;
      duration?: number;
      language?: string;
    };

    return NextResponse.json<TranscriptionResult>({
      transcript: result.text,
      duration: result.duration ?? 0,
      language: result.language ?? "en",
      status: "complete",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to transcribe: ${message}` },
      { status: 500 }
    );
  }
}

// --- Helpers ---

function resolveWhisperProvider(): {
  apiUrl: string | null;
  apiKey: string | null;
  provider: "groq" | "openai";
} {
  if (GROQ_API_KEY) {
    return {
      apiUrl: GROQ_WHISPER_URL,
      apiKey: GROQ_API_KEY,
      provider: "groq",
    };
  }
  if (OPENAI_API_KEY) {
    return {
      apiUrl: OPENAI_WHISPER_URL,
      apiKey: OPENAI_API_KEY,
      provider: "openai",
    };
  }
  return { apiUrl: null, apiKey: null, provider: "groq" };
}

async function handleWhisperError(
  response: Response,
  provider: string
): Promise<NextResponse> {
  const errorBody = await response.text();
  console.error(`${provider} Whisper error:`, response.status, errorBody);

  if (response.status === 429) {
    return NextResponse.json(
      {
        error:
          "Transcription rate limit reached. Please try again in a minute.",
      },
      { status: 429 }
    );
  }

  if (response.status === 401 || response.status === 403) {
    return NextResponse.json(
      {
        error: `Transcription service authentication failed. Check your ${provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY"}.`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: `Transcription failed: ${response.statusText}` },
    { status: 500 }
  );
}
