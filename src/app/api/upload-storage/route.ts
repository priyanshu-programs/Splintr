import { NextRequest, NextResponse } from "next/server";

// ── Constants ──

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  document: [".pdf", ".txt", ".md"],
  audio: [".mp3", ".wav", ".m4a"],
};

const MOCK_STORAGE_BASE = "https://mock-storage.splintr.dev";

// ── Helpers ──

function getAllowedExtensions(): string[] {
  return Object.values(ALLOWED_EXTENSIONS).flat();
}

function isAllowedExtension(filename: string): boolean {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  return getAllowedExtensions().includes(ext);
}

function generateStoragePath(filename: string, userId: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${userId}/${timestamp}-${rand}.${ext}`;
}

function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

// ── POST: Upload file ──

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const platform = formData.get("platform") as string | null;
    const contentItemId = formData.get("contentItemId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Validate file type
    if (!isAllowedExtension(file.name)) {
      const allowed = getAllowedExtensions().join(", ");
      return NextResponse.json(
        { error: `Unsupported file type. Allowed extensions: ${allowed}` },
        { status: 400 }
      );
    }

    // ── Mock mode ──
    if (isMockAuth()) {
      const mockUserId = "00000000-0000-0000-0000-000000000001";
      const storagePath = generateStoragePath(file.name, mockUserId);
      const url = `${MOCK_STORAGE_BASE}/${storagePath}`;

      return NextResponse.json({
        url,
        filename: file.name,
        size: file.size,
        type: file.type,
        path: storagePath,
        platform: platform || undefined,
        contentItemId: contentItemId || undefined,
      });
    }

    // ── Real mode: Supabase Storage ──
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const storagePath = generateStoragePath(file.name, user.id);

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      path: data.path,
      platform: platform || undefined,
      contentItemId: contentItemId || undefined,
    });
  } catch (error) {
    console.error("Upload storage error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to upload file: ${message}` },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove uploaded file ──

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body as { path?: string };

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // ── Mock mode ──
    if (isMockAuth()) {
      return NextResponse.json({ success: true });
    }

    // ── Real mode: Supabase Storage ──
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure user can only delete their own files
    if (!path.startsWith(user.id + "/")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase.storage
      .from("uploads")
      .remove([path]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete storage error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to delete file: ${message}` },
      { status: 500 }
    );
  }
}
