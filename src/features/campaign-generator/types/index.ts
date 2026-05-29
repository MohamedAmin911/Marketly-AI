export type CampaignAsset = {
  alt?: string;
  fileId?: string;
  height?: number;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  storageKey?: string;
  thumbnailUrl?: string;
  url?: string;
  width?: number;
};

export type SocialPostConcept = {
  caption: string;
  id: string;
  platform: string;
  title: string;
  visualDirection: string;
};

export type SocialCampaignRecord = {
  createdAt: string;
  customIdeas: string[];
  generationStatus: string;
  id: string;
  mode: "auto" | "custom";
  modelUsed: string;
  moodPreset: string;
  posts: SocialPostConcept[];
  productImage?: CampaignAsset;
  theme: string;
  title: string;
  updatedAt: string;
};

export type SocialCampaignGenerationRequest = {
  customIdeas: string[];
  mode: "auto" | "custom";
  moodPreset: string;
  productFile: File;
  theme: string;
};

export type CampaignRecord = SocialCampaignRecord;

export type CampaignAd = {
  caption: string;
  color: string;
  title: string;
  type: string;
};
