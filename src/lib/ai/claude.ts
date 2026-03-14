import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type Platform = "linkedin" | "x" | "instagram" | "blog" | "video-short" | "video-long";

interface GenerateOptions {
  sourceContent: string;
  platform: Platform;
  outputType: string;
  voiceProfile?: {
    systemPrompt: string;
    tone: string;
    writingSamples: string[];
  };
  template?: string;
}

const platformInstructions: Record<Platform, string> = {
  linkedin: `Write for LinkedIn. Max ~3000 chars. Start with a hook (pattern interrupt first line). Use short paragraphs with line breaks. Professional but personal tone. End with a CTA.`,
  x: `Write for X/Twitter. Max 280 chars for a single post, or create a thread (each tweet max 280 chars). Use punchy, concise language. Threads should have a hook tweet, numbered points, and a summary tweet.`,
  instagram: `Write an Instagram caption. Use an engaging hook as the first line. Include a CTA. Keep it visual and emotional.`,
  blog: `Write a full blog article. Include a title (H1), structured headings (H2, H3), introduction, body sections, and conclusion. Use markdown formatting. Aim for 800-1500 words. SEO-friendly.`,
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

  const systemPrompt = voiceProfile?.systemPrompt
    ? `${voiceProfile.systemPrompt}\n\nTone: ${voiceProfile.tone}\n\nWriting style reference:\n${voiceProfile.writingSamples.slice(0, 3).join("\n---\n")}`
    : "You are a professional content writer who creates engaging, platform-optimized content.";

  const userPrompt = `${platformInstructions[platform]}
${writingStyleGuardrails}
Source content to repurpose:
---
${sourceContent}
---

${template ? `Use this template structure:\n${template}\n\n` : ""}
Output type: ${outputType}

Generate the ${outputType} for ${platform}. Only output the final content, no explanations.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
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

function getDefaultOutputType(platform: Platform): string {
  const defaults: Record<Platform, string> = {
    linkedin: "post",
    x: "thread",
    instagram: "caption",
    blog: "article",
    "video-short": "script_short",
    "video-long": "script_long",
  };
  return defaults[platform];
}
