import type { RenderStatus } from "@/server/database/enums";

export type VideoAsset = {
  alt?: string;
  fileId?: string;
  height?: number;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  provider?: string;
  size?: number;
  storageKey?: string;
  thumbnailUrl?: string;
  url?: string;
  width?: number;
};

export type VideoRecord = {
  createdAt: string;
  id: string;
  productImage?: VideoAsset;
  prompt: string;
  renderErrors: string[];
  renderStatus: RenderStatus;
  renderTime: number;
  selectedStyle: string;
  thumbnailUrl?: string;
  title: string;
  updatedAt: string;
  videoUrl?: string;
};
