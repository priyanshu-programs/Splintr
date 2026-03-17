import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export type Platform = "linkedin" | "x" | "instagram" | "blog" | "youtube" | "tiktok" | "threads" | "meta" | "video-short" | "video-long";

interface PlatformOverride {
  tone?: string;
  sliders?: { label: string; from: string; to: string; value: number }[];
}

interface GenerateOptions {
  sourceContent: string;
  platform: Platform;
  outputType: string;
  voiceProfile?: {
    systemPrompt: string;
    tone: string;
    writingSamples: string[];
    platformOverrides?: Record<string, PlatformOverride>;
  };
  template?: string;
}

const platformInstructions: Record<Platform, string> = {
  linkedin: `Write for LinkedIn. Max ~3000 chars. Start with a hook (pattern interrupt first line). Use short paragraphs with line breaks. Professional but personal tone. End with a CTA.`,
  x: `Write for X/Twitter. Max 280 chars for a single post, or create a thread (each tweet max 280 chars). Use punchy, concise language. Threads should have a hook tweet, numbered points, and a summary tweet.`,
  instagram: `Write an Instagram caption. Use an engaging hook as the first line. Include a CTA. Keep it visual and emotional.`,
  blog: `Write a full blog article. Include a title (H1), structured headings (H2, H3), introduction, body sections, and conclusion. Use markdown formatting. Aim for 800-1500 words. SEO-friendly.`,
  youtube: `Write for YouTube. Create a compelling title, description, and script outline. Hook viewers in the first 10 seconds. Include timestamps for key sections. End with a strong CTA (subscribe, like, comment).`,
  tiktok: `Write for TikTok. Max 60 seconds of spoken content. Start with a pattern-interrupt hook in the first 2 seconds. Use casual, energetic language. Trend-aware. Include visual cues in brackets. End with engagement prompt.`,
  threads: `Write for Threads. Max 500 chars. Conversational and authentic tone. Can be a single post or a short thread. Similar to Twitter but more casual and community-focused. No hashtag spam.`,
  meta: `Write for Facebook/Meta. Can be longer form (up to 63,206 chars). Use storytelling format. Engaging opening line. Include a question or CTA to drive comments. Optimized for sharing.`,
  "video-short": `Write a short-form video script (30-60 seconds). Include: HOOK (first 3 seconds), BODY (main content), CTA (end). Use conversational tone. Include visual/action notes in brackets.`,
  "video-long": `Write a long-form video script (5-10 minutes). Include: INTRO with hook, SECTIONS with transitions, OUTRO with CTA. Include [B-ROLL], [GRAPHIC], and [CUT TO] notes.`,
};

const writingStyleGuardrails = `
CRITICAL WRITING RULES - follow these without exception:
- NEVER include hashtags (e.g. #topic). Not at the end, not inline, nowhere.
- NEVER include emojis. Write with words only.
- Do NOT use rhetorical one-liner questions as hooks (e.g. "The biggest mistake?", "Want to know the secret?"). Open with a concrete statement, observation, or story instead.
- Maintain natural, consistent sentence rhythm. Do NOT alternate between very short punchy fragments and long complex sentences in a repeating pattern. That cadence reads as AI-generated. Vary length naturally the way a human essayist would: mostly medium-length sentences with occasional short or long ones, not a deliberate short-long-short-long drumbeat.
- Avoid cliché AI transition phrases like "Here's the thing", "Let me be clear", "The truth is", "Let's break it down", "Think about it".
- NEVER use em dashes (\u2014). Use commas, semicolons, colons, or separate sentences instead.
- Write like a knowledgeable person talking to a peer, not like a copywriter performing for an audience.
`;

export async function generateContent(options: GenerateOptions): Promise<string> {
  const { sourceContent, platform, outputType, voiceProfile, template } = options;

  let systemPrompt = "You are a professional content writer who creates engaging, platform-optimized content.";

  if (voiceProfile) {
    // Check for platform-specific override
    const override = voiceProfile.platformOverrides?.[platform];
    const effectiveTone = override?.tone || voiceProfile.tone;

    const parts: string[] = [];

    if (voiceProfile.systemPrompt) {
      parts.push(voiceProfile.systemPrompt);
    } else {
      parts.push("You are a professional content writer who creates engaging, platform-optimized content.");
    }

    if (effectiveTone) {
      parts.push(`Tone: ${effectiveTone}`);
    }

    if (override?.sliders) {
      const sliderDescs = override.sliders.map((s) => {
        if (s.value <= 30) return `${s.from.toLowerCase()}`;
        if (s.value >= 70) return `${s.to.toLowerCase()}`;
        return `balanced between ${s.from.toLowerCase()} and ${s.to.toLowerCase()}`;
      });
      parts.push(`Platform-specific style adjustments for ${platform}: ${sliderDescs.join(", ")}`);
    }

    if (voiceProfile.writingSamples.length > 0) {
      parts.push(`Writing style reference:\n${voiceProfile.writingSamples.slice(0, 3).join("\n---\n")}`);
    }

    systemPrompt = parts.join("\n\n");
  }

  const userPrompt = `${platformInstructions[platform]}
${writingStyleGuardrails}
Source content to repurpose:
---
${sourceContent}
---

${template ? `Use this template structure:\n${template}\n\n` : ""}Output type: ${outputType}

Generate the ${outputType} for ${platform}. Only output the final content, no explanations.`;

  const response = await openrouter.chat.send({
    chatGenerationParams: {
      model: "openrouter/free",
      maxTokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  });

  const chatResponse = response as { choices: Array<{ message: { content: string | null } }> };
  const text = chatResponse.choices?.[0]?.message?.content;
  return text ?? "";
}

export async function generateBatch(
  sourceContent: string,
  platforms: Platform[],
  voiceProfile?: GenerateOptions["voiceProfile"]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Generate for each platform in parallel
  const promises = platforms.map(async (platform) => {
    const outputType = getDefaultOutputType(platform);
    const content = await generateContent({
      sourceContent,
      platform,
      outputType,
      voiceProfile,
    });
    results[platform] = content;
  });

  await Promise.all(promises);
  return results;
}

export function getDefaultOutputType(platform: Platform): string {
  const defaults: Record<Platform, string> = {
    linkedin: "post",
    x: "thread",
    instagram: "caption",
    blog: "article",
    youtube: "script",
    tiktok: "script",
    threads: "post",
    meta: "post",
    "video-short": "script_short",
    "video-long": "script_long",
  };
  return defaults[platform];
}

/**
 * Extract a concise topic label (3–5 words) from source content using AI.
 */
export async function extractTopic(sourceContent: string): Promise<string> {
  // If the source content is just a URL, skip AI extraction — caller should use extracted page title
  const trimmed = sourceContent.trim();
  if (/^https?:\/\/\S+$/i.test(trimmed) && !trimmed.includes(" ")) {
    return "";
  }

  try {
    const response = await openrouter.chat.send({
      chatGenerationParams: {
        model: "openrouter/free",
        maxTokens: 20,
        messages: [
          {
            role: "system",
            content:
              "You are a topic extractor. Given content, reply with ONLY a concise topic label of 3 to 5 words. No punctuation, no quotes, no explanation, no URLs. Examples: 'AI Marketing Automation', 'Remote Work Productivity', 'Sustainable Fashion Trends'.",
          },
          {
            role: "user",
            content: sourceContent.slice(0, 500),
          },
        ],
      },
    });

    const chatResponse = response as { choices: Array<{ message: { content: string | null } }> };
    let topic = chatResponse.choices?.[0]?.message?.content?.trim() || "";

    // Clean up any accidental quotes, punctuation, or URL fragments
    topic = topic.replace(/^["']+|["']+$/g, "").replace(/\.+$/, "").trim();

    // Reject if it looks like a URL, is empty, or is too long
    if (topic && topic.length > 0 && topic.length < 60 && !/^https?:\/\//i.test(topic) && !topic.includes("youtu")) {
      // Cap at 5 words
      const words = topic.split(/\s+/);
      if (words.length > 5) {
        topic = words.slice(0, 5).join(" ");
      }
      return topic;
    }
  } catch (error) {
    console.error("Topic extraction failed:", error);
  }

  // Fallback: first ~40 chars of content (skip if it's a URL)
  if (/^https?:\/\//i.test(trimmed)) return "";
  const fallback = trimmed.slice(0, 40).replace(/\n/g, " ").trim();
  return fallback + (trimmed.length > 40 ? "…" : "");
}
