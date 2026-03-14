import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

/**
 * Extracts readable content from a URL using a multi-strategy approach:
 * 1. Direct fetch + Mozilla Readability (handles most static pages)
 * 2. Jina AI Reader fallback (handles JS-rendered / SPA pages for free)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // --- YouTube-specific: use oEmbed to get title + try transcript extraction ---
    const isYouTube = /^(www\.)?(youtube\.com|youtu\.be)$/i.test(parsedUrl.hostname);
    let youtubeTitle: string | null = null;

    if (isYouTube) {
      youtubeTitle = await extractYouTubeTitle(parsedUrl.toString());
    }

    // --- Strategy 1: Direct fetch + Readability ---
    let result = await extractWithReadability(parsedUrl.toString());

    // --- Strategy 2: Jina Reader fallback (handles JS-rendered pages) ---
    if (!result || result.content.length < 100) {
      console.log("[Extract] Readability extraction insufficient, trying Jina Reader fallback...");
      result = await extractWithJinaReader(parsedUrl.toString());
    }

    if (!result || result.content.length < 50) {
      // For YouTube, even if content extraction fails, return the title so topic extraction works
      if (isYouTube && youtubeTitle) {
        return NextResponse.json({
          title: youtubeTitle,
          content: youtubeTitle, // Use title as content so AI can extract a topic from it
          wordCount: youtubeTitle.split(/\s+/).length,
          sourceUrl: url,
        });
      }

      return NextResponse.json(
        {
          error:
            "Could not extract meaningful content from this URL. The page may require authentication or have very little text content.",
        },
        { status: 422 }
      );
    }

    // Override title with YouTube oEmbed title if available (more reliable than Readability)
    if (isYouTube && youtubeTitle) {
      result.title = youtubeTitle;
    }

    const wordCount = result.content.split(/\s+/).length;

    return NextResponse.json({
      title: result.title,
      content: result.content,
      wordCount,
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Extract error:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json(
        { error: "URL took too long to respond (15s timeout)" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: `Failed to extract content: ${message}` },
      { status: 500 }
    );
  }
}

// ─── Strategy 1: Direct Fetch + Mozilla Readability ──────────────────

async function extractWithReadability(
  url: string
): Promise<{ title: string; content: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[Extract] Direct fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();

    // Use JSDOM to parse the HTML into a proper DOM
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Use Readability to extract the article content
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      console.warn("[Extract] Readability could not parse article content");
      return null;
    }

    // Clean up the extracted text
    const cleanText = article.textContent
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    return {
      title: article.title || "Untitled",
      content: cleanText,
    };
  } catch (error) {
    console.warn("[Extract] Readability strategy failed:", error);
    return null;
  }
}

// ─── Strategy 2: Jina AI Reader (handles JS-rendered pages) ─────────

async function extractWithJinaReader(
  url: string
): Promise<{ title: string; content: string } | null> {
  try {
    // Jina Reader: prefix any URL with r.jina.ai to get markdown content
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
      },
      signal: AbortSignal.timeout(25000), // Jina may take longer since it renders JS
    });

    if (!response.ok) {
      console.warn(`[Extract] Jina Reader failed: ${response.status}`);
      return null;
    }

    const text = await response.text();

    // Extract title from first line if it looks like a heading
    let title = "Untitled";
    const lines = text.split("\n");
    const firstLine = lines[0]?.trim();
    if (firstLine && (firstLine.startsWith("# ") || firstLine.startsWith("Title:"))) {
      title = firstLine.replace(/^#\s*/, "").replace(/^Title:\s*/i, "").trim();
    }

    // Clean the markdown content to plain text
    const cleanText = text
      // Remove markdown images
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Remove markdown links but keep text
      .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
      // Remove markdown formatting
      .replace(/[*_~`#]/g, "")
      // Clean up whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    return {
      title,
      content: cleanText,
    };
  } catch (error) {
    console.warn("[Extract] Jina Reader strategy failed:", error);
    return null;
  }
}

// ─── YouTube oEmbed Title Extraction ────────────────────────────────

async function extractYouTubeTitle(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[Extract] YouTube oEmbed failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const title = data.title?.trim();

    if (title && title.length > 0) {
      console.log(`[Extract] YouTube oEmbed title: "${title}"`);
      return title;
    }

    return null;
  } catch (error) {
    console.warn("[Extract] YouTube oEmbed extraction failed:", error);
    return null;
  }
}
