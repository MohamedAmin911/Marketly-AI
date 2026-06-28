import mongoose, { Schema, type Model } from "mongoose";

import { GENERATION_STATUSES, WORKFLOW_STATUSES, type GenerationStatus, type WorkflowStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface StoryboardScene {
  cameraAngle?: string;
  description: string;
  duration: number;
  generatedImage?: Record<string, unknown> | null;
  generationErrors?: string[];
  generationStatus: GenerationStatus;
  imagePrompt: string;
  title: string;
  transition?: string;
}

export interface IStoryboard extends BaseEntity {
  campaignId?: ObjectId;
  concept?: string;
  generationStatus: GenerationStatus;
  modelUsed?: string;
  projectId: ObjectId;
  scenes: StoryboardScene[];
  status: WorkflowStatus;
  title: string;
  userId: ObjectId;
}

const storyboardSceneSchema = new Schema<StoryboardScene>(
  {
    cameraAngle: { maxlength: 120, trim: true, type: String },
    description: { maxlength: 2000, required: true, trim: true, type: String },
    duration: { default: 5, max: 300, min: 1, type: Number },
    generatedImage: { default: null, type: assetRefSchema },
    generationErrors: { default: [], type: [String] },
    generationStatus: { default: "queued", enum: GENERATION_STATUSES, type: String },
    imagePrompt: { maxlength: 4000, required: true, trim: true, type: String },
    title: { maxlength: 180, required: true, trim: true, type: String },
    transition: { maxlength: 120, trim: true, type: String },
  },
  { _id: true },
);

const storyboardSchema = new Schema<IStoryboard>(
  {
    ...softDeleteFields,
    campaignId: objectId("Campaign"),
    concept: { maxlength: 3000, trim: true, type: String },
    generationStatus: { default: "queued", enum: GENERATION_STATUSES, type: String },
    modelUsed: { maxlength: 120, trim: true, type: String },
    projectId: objectId("Project", true),
    scenes: { default: [], type: [storyboardSceneSchema] },
    status: { default: "draft", enum: WORKFLOW_STATUSES, index: true, type: String },
    title: { maxlength: 180, required: true, trim: true, type: String },
    userId: objectId("User", true),
  },
  schemaOptions,
);

storyboardSchema.index({ userId: 1, projectId: 1, createdAt: -1 });
addBasePlugins(storyboardSchema);

export const StoryboardModel = (mongoose.models.Storyboard as Model<IStoryboard>) ?? mongoose.model<IStoryboard>("Storyboard", storyboardSchema);
