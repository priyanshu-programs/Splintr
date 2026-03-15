import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";

// ── Types ──

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface UploadMetadata {
  platform?: string;
  contentItemId?: string;
}

interface StoredUpload {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  platform?: string;
  contentItemId?: string;
  createdAt: string;
}

// ── Constants ──

const STORAGE_KEY = "splintr_uploads";
const MOCK_STORAGE_BASE = "https://mock-storage.splintr.dev";

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "text/plain",
    "text/markdown",
    // .md files sometimes report as application/octet-stream
  ],
  audio: ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"],
};

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  document: [".pdf", ".txt", ".md"],
  audio: [".mp3", ".wav", ".m4a"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Validation helpers ──

function getAllowedExtensions(): string[] {
  return Object.values(ALLOWED_EXTENSIONS).flat();
}

function getAllowedMimeTypes(): string[] {
  return Object.values(ALLOWED_TYPES).flat();
}

export function isValidFileType(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validByExt = getAllowedExtensions().includes(ext);
  const validByMime = getAllowedMimeTypes().includes(file.type);
  // Accept if either extension or mime type matches (some browsers report wrong mime)
  return validByExt || validByMime;
}

export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function getFileCategory(file: File): string {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  for (const [category, extensions] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (extensions.includes(ext)) return category;
  }
  for (const [category, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(file.type)) return category;
  }
  return "unknown";
}

// ── Mock mode helpers ──

function getStoredUploads(): StoredUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUploads(uploads: StoredUpload[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateStoragePath(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${rand}.${ext}`;
}

// ── Public API ──

/**
 * Upload a file to storage (mock: localStorage metadata, real: Supabase Storage).
 * In the browser (mock mode), this stores metadata locally and returns a fake URL.
 * For real uploads, call the /api/upload-storage endpoint instead — this client
 * helper is for mock mode convenience.
 */
export async function uploadFile(
  file: File,
  metadata?: UploadMetadata
): Promise<UploadResult> {
  // Validate
  if (!isValidFileType(file)) {
    const allowed = getAllowedExtensions().join(", ");
    throw new Error(`Unsupported file type. Allowed: ${allowed}`);
  }

  if (!isValidFileSize(file)) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  if (MOCK_AUTH_ENABLED) {
    return uploadFileMock(file, metadata);
  }

  return uploadFileReal(file, metadata);
}

async function uploadFileMock(
  file: File,
  metadata?: UploadMetadata
): Promise<UploadResult> {
  const storageName = generateStoragePath(file.name);
  const url = `${MOCK_STORAGE_BASE}/${storageName}`;

  const entry: StoredUpload = {
    id: generateId(),
    filename: storageName,
    originalName: file.name,
    size: file.size,
    type: file.type,
    url,
    platform: metadata?.platform,
    contentItemId: metadata?.contentItemId,
    createdAt: new Date().toISOString(),
  };

  const uploads = getStoredUploads();
  uploads.push(entry);
  saveStoredUploads(uploads);

  return {
    url,
    filename: file.name,
    size: file.size,
    type: file.type,
  };
}

async function uploadFileReal(
  file: File,
  metadata?: UploadMetadata
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.platform) formData.append("platform", metadata.platform);
  if (metadata?.contentItemId) formData.append("contentItemId", metadata.contentItemId);

  const res = await fetch("/api/upload-storage", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to upload file");
  }

  return data as UploadResult;
}

/**
 * Get the public URL for an uploaded file path.
 * Mock mode: returns mock-storage URL.
 * Real mode: returns the Supabase Storage public URL.
 */
export function getUploadUrl(path: string): string {
  if (MOCK_AUTH_ENABLED) {
    return `${MOCK_STORAGE_BASE}/${path}`;
  }

  // In real mode, construct the Supabase storage public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  return `${supabaseUrl}/storage/v1/object/public/uploads/${path}`;
}

/**
 * Delete an uploaded file.
 * Mock mode: removes from localStorage.
 * Real mode: calls the delete endpoint.
 */
export async function deleteUpload(path: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const uploads = getStoredUploads();
    const filtered = uploads.filter(
      (u) => u.filename !== path && u.url !== path
    );
    saveStoredUploads(filtered);
    return;
  }

  const res = await fetch("/api/upload-storage", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete file");
  }
}

/**
 * List all uploaded files (mock mode only — useful for debugging).
 */
export function listUploads(): StoredUpload[] {
  return getStoredUploads();
}
