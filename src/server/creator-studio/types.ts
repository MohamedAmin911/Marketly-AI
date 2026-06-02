export type CreatorAsset = {
  color: string;
  id: string;
  mimeType: string;
  name: string;
  size: number;
  tag: string;
  title: string;
  url: string;
};

export type CreatorGenerationRecord = {
  angle: string;
  background: string;
  createdAt: string;
  downloaded: boolean;
  favorited: boolean;
  generatedImages: CreatorAsset[];
  generationErrors: string[];
  generationStatus: "queued" | "processing" | "completed" | "failed";
  id: string;
  lighting: string;
  mode: string;
  productImage: CreatorAsset;
  prompt: string;
  quality: string;
  referenceImage?: CreatorAsset;
};
