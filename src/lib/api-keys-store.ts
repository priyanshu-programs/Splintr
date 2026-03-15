/**
 * api-keys-store.ts
 *
 * Dual-mode storage layer for API key and webhook management.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage
 * - Real mode: also uses localStorage for now (no api_keys table in schema)
 *
 * TODO: Migrate to Supabase when api_keys and webhooks tables are added to the schema.
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";

/* ── Types ── */

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  lastTriggered: string | null;
  successRate: number;
}

/* ── localStorage helpers ── */

const API_KEYS_STORAGE_KEY = "splintr_api_keys";
const WEBHOOKS_STORAGE_KEY = "splintr_webhooks";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateKeyValue(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk_live_";
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

function readLocalKeys(): ApiKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed
  }
  // Seed with one example key on first access
  const seed: ApiKey[] = [
    {
      id: generateId(),
      name: "Production Key",
      key: generateKeyValue(),
      prefix: "",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
  ];
  seed[0].prefix = seed[0].key.slice(0, 12) + "...";
  writeLocalKeys(seed);
  return seed;
}

function writeLocalKeys(keys: ApiKey[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

function readLocalWebhooks(): Webhook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WEBHOOKS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed
  }
  // Seed with one example webhook on first access
  const seed: Webhook[] = [
    {
      id: generateId(),
      url: "https://api.myapp.com/webhooks/splintr",
      events: ["generation.completed", "content.published"],
      isActive: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastTriggered: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      successRate: 98.5,
    },
  ];
  writeLocalWebhooks(seed);
  return seed;
}

function writeLocalWebhooks(webhooks: Webhook[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(webhooks));
}

/* ── API Keys ── */

export async function getApiKeys(): Promise<ApiKey[]> {
  // Both mock and real mode use localStorage until a Supabase table exists
  return readLocalKeys();
}

export async function generateApiKey(name: string): Promise<ApiKey> {
  const keyValue = generateKeyValue();
  const newKey: ApiKey = {
    id: generateId(),
    name,
    key: keyValue,
    prefix: keyValue.slice(0, 12) + "...",
    createdAt: new Date().toISOString(),
    lastUsed: null,
    isActive: true,
  };
  const keys = readLocalKeys();
  keys.unshift(newKey);
  writeLocalKeys(keys);
  return newKey;
}

export async function revokeApiKey(id: string): Promise<void> {
  const keys = readLocalKeys();
  const idx = keys.findIndex((k) => k.id === id);
  if (idx !== -1) {
    keys[idx].isActive = false;
    writeLocalKeys(keys);
  }
}

/* ── Webhooks ── */

export async function getWebhooks(): Promise<Webhook[]> {
  return readLocalWebhooks();
}

export async function createWebhook(url: string, events: string[]): Promise<Webhook> {
  const webhook: Webhook = {
    id: generateId(),
    url,
    events,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastTriggered: null,
    successRate: 100,
  };
  const webhooks = readLocalWebhooks();
  webhooks.unshift(webhook);
  writeLocalWebhooks(webhooks);
  return webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  const webhooks = readLocalWebhooks().filter((w) => w.id !== id);
  writeLocalWebhooks(webhooks);
}

export async function testWebhook(id: string): Promise<{ success: boolean; statusCode: number }> {
  // Simulate a webhook test — in production this would make an actual HTTP request
  const webhooks = readLocalWebhooks();
  const idx = webhooks.findIndex((w) => w.id === id);
  if (idx !== -1) {
    webhooks[idx].lastTriggered = new Date().toISOString();
    writeLocalWebhooks(webhooks);
  }
  // Simulate success with ~90% probability
  const success = Math.random() > 0.1;
  return { success, statusCode: success ? 200 : 500 };
}

/* ── Usage Stats ── */

export async function getApiUsageStats(): Promise<{
  totalKeys: number;
  activeWebhooks: number;
  monthlyRequests: number;
}> {
  const keys = readLocalKeys();
  const webhooks = readLocalWebhooks();
  return {
    totalKeys: keys.filter((k) => k.isActive).length,
    activeWebhooks: webhooks.filter((w) => w.isActive).length,
    // Mock monthly requests — in production this would query usage logs
    monthlyRequests: Math.floor(Math.random() * 500) + 800,
  };
}
