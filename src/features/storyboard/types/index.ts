export type CinematicStoryboardScene = {
  generatedImage: string;
  imagePrompt: string;
  sceneTitle: string;
  script: string;
};

export type CinematicStoryboardResult = {
  generationId: string;
  scenes: CinematicStoryboardScene[];
};

export type StoryboardGenerationRequest = {
  campaignPrompt: string;
  productImage: File;
};
