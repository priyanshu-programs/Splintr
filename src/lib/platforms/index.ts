export type Platform =
  | "linkedin"
  | "instagram"
  | "x"
  | "blog"
  | "youtube"
  | "tiktok"
  | "threads"
  | "meta";

export type OutputType =
  | "post"
  | "thread"
  | "article"
  | "caption"
  | "script_short"
  | "script_long"
  | "carousel"
  | "video";

export interface PlatformConfig {
  name: string;
  maxLength: number | null;
  outputTypes: OutputType[];
  hashtagSupport: boolean;
  mediaSupport: boolean;
}

export const platformConfigs: Record<Platform, PlatformConfig> = {
  linkedin: {
    name: "LinkedIn",
    maxLength: 3000,
    outputTypes: ["post", "article"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  x: {
    name: "X / Twitter",
    maxLength: 280,
    outputTypes: ["post", "thread"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  instagram: {
    name: "Instagram",
    maxLength: 2200,
    outputTypes: ["caption", "carousel"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  blog: {
    name: "Blog",
    maxLength: null,
    outputTypes: ["article"],
    hashtagSupport: false,
    mediaSupport: true,
  },
  youtube: {
    name: "YouTube",
    maxLength: 5000,
    outputTypes: ["script_long", "post"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  tiktok: {
    name: "TikTok",
    maxLength: 2200,
    outputTypes: ["script_short", "caption"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  threads: {
    name: "Threads",
    maxLength: 500,
    outputTypes: ["post", "thread"],
    hashtagSupport: true,
    mediaSupport: true,
  },
  meta: {
    name: "Meta",
    maxLength: 63206,
    outputTypes: ["post", "article"],
    hashtagSupport: true,
    mediaSupport: true,
  },
};

export function getPlatformConfig(platform: Platform): PlatformConfig {
  return platformConfigs[platform];
}

export function validateContentLength(platform: Platform, content: string): boolean {
  const config = platformConfigs[platform];
  if (config.maxLength === null) return true;
  return content.length <= config.maxLength;
}
