import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    let content = "";

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      // Plain text / Markdown — read directly
      content = await file.text();
    } else if (fileName.endsWith(".csv")) {
      content = await file.text();
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".pdf")) {
      // For .docx and .pdf, extract what we can as raw text
      // This is a basic approach — for .docx we extract from the XML, for .pdf we extract readable strings
      const buffer = Buffer.from(await file.arrayBuffer());

      if (fileName.endsWith(".docx")) {
        // DOCX is a ZIP containing XML. Extract text from word/document.xml
        // We'll do a simple regex extraction of text between XML tags
        const textContent = buffer.toString("utf8");
        // Extract readable text segments (non-XML content between tags)
        content = textContent
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .replace(/[^\x20-\x7E\n\r]/g, " ")
          .trim();

        // If we got almost nothing, the binary parts dominated — give a better message
        if (content.length < 50) {
          return NextResponse.json(
            { error: "Could not extract text from this .docx file. Try converting to .txt first." },
            { status: 422 }
          );
        }
      } else {
        // PDF: extract text strings (very basic — works for text-based PDFs)
        const textContent = buffer.toString("utf8");
        // Extract text between parentheses (PDF text operators) and BT/ET blocks
        const textMatches = textContent.match(/\(([^)]+)\)/g);
        if (textMatches) {
          content = textMatches
            .map((m) => m.slice(1, -1))
            .filter((t) => t.length > 1 && /[a-zA-Z]/.test(t))
            .join(" ");
        }

        if (content.length < 50) {
          return NextResponse.json(
            { error: "Could not extract text from this PDF. It may be image-based or scanned. Try converting to .txt first." },
            { status: 422 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileName.split(".").pop()}. Supported: .txt, .md, .csv, .docx, .pdf` },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "File appears to be empty or contains no readable text." },
        { status: 422 }
      );
    }

    const wordCount = content.split(/\s+/).length;

    return NextResponse.json({
      content: content.trim(),
      wordCount,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to process file: ${message}` },
      { status: 500 }
    );
  }
}
