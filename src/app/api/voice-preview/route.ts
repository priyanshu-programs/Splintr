import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tone, formalityIndex, humorCoefficient, customPrompt } = body as {
      tone?: string;
      formalityIndex?: number;
      humorCoefficient?: number;
      customPrompt?: string;
    };

    let systemPrompt = "You are a professional content writer.";

    if (customPrompt) {
      systemPrompt = customPrompt;
    }

    // Build voice parameters from sliders
    const formalityDesc =
      formalityIndex !== undefined
        ? formalityIndex > 70
          ? "very formal and corporate"
          : formalityIndex > 40
            ? "balanced between casual and formal"
            : "casual and conversational"
        : null;

    const humorDesc =
      humorCoefficient !== undefined
        ? humorCoefficient > 60
          ? "witty with frequent humor"
          : humorCoefficient > 25
            ? "lightly humorous"
            : "dry and straightforward"
        : null;

    if (formalityDesc || humorDesc || tone) {
      const voiceNotes = [
        formalityDesc && `Formality: ${formalityDesc} (${formalityIndex}%)`,
        humorDesc && `Humor: ${humorDesc} (${humorCoefficient}%)`,
        tone && `Tone summary: ${tone}`,
      ]
        .filter(Boolean)
        .join(". ");

      if (customPrompt) {
        systemPrompt += `\n\nVoice calibration: ${voiceNotes}`;
      } else {
        systemPrompt += ` ${voiceNotes}.`;
      }
    }

    const userMessage =
      "Write a short sample LinkedIn post (3-5 sentences) about the importance of authentic personal branding in the age of AI. This is a voice calibration preview — demonstrate the configured writing style clearly.";

    const response = await openrouter.chat.send({
      chatGenerationParams: {
        model: "openrouter/free",
        maxTokens: 512,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
    });

    // Non-streaming response is a ChatResponse
    const chatResponse = response as { choices: Array<{ message: { content: string | null } }> };
    const text = chatResponse.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No content returned from the model." },
        { status: 500 }
      );
    }

    return NextResponse.json({ preview: text });
  } catch (error: unknown) {
    console.error("Voice preview error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to generate voice preview: ${message}` },
      { status: 500 }
    );
  }
}
