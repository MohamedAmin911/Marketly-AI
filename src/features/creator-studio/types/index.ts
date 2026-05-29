export type GeneratedImage = {
  title: string;
  tag: string;
  color: string;
};

export type CreatorAsset = GeneratedImage & {
  id: string;
  mimeType?: string;
  name?: string;
  size?: number;
  url?: string;
};

export type CreatorGeneration = {
  angle: string;
  background: string;
  downloaded: boolean;
  favorited: boolean;
  generatedImages: CreatorAsset[];
  generationStatus: "queued" | "processing" | "completed" | "failed";
  id: string;
  lighting: string;
  mode: string;
  productImage: CreatorAsset;
  prompt: string;
  quality: string;
  referenceImage?: CreatorAsset;
};
