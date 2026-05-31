import mongoose, { Schema, type Model } from "mongoose";

import { RENDER_STATUSES, VIDEO_TYPES, type RenderStatus, type VideoType } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IVideo extends BaseEntity {
  campaignId?: ObjectId;
  duration: number;
  effects: string[];
  fps: number;
  productImage?: Record<string, unknown>;
  projectId?: ObjectId;
  prompt?: string;
  renderErrors: string[];
  renderProgress: number;
  renderStatus: RenderStatus;
  renderTime: number;
  resolution: string;
  sceneImages: Record<string, unknown>[];
  thumbnailUrl?: string;
  title: string;
  transitions: string[];
  type: VideoType;
  userId: ObjectId;
  selectedStyle?: string;
  videoAsset?: Record<string, unknown>;
  videoPrompt?: string;
  videoUrl?: string;
}

const videoSchema = new Schema<IVideo>(
  {
    ...softDeleteFields,
    campaignId: objectId("Campaign"),
    duration: { default: 0, min: 0, type: Number },
    effects: [{ maxlength: 120, trim: true, type: String }],
    fps: { default: 30, max: 120, min: 1, type: Number },
    productImage: { default: null, type: assetRefSchema },
    projectId: objectId("Project", false),
    prompt: { maxlength: 4000, trim: true, type: String },
    renderErrors: [{ maxlength: 1000, trim: true, type: String }],
    renderProgress: { default: 0, max: 100, min: 0, type: Number },
    renderStatus: { default: "queued", enum: RENDER_STATUSES, index: true, type: String },
    renderTime: { default: 0, min: 0, type: Number },
    resolution: { default: "1080p", maxlength: 40, trim: true, type: String },
    sceneImages: [assetRefSchema],
    thumbnailUrl: { maxlength: 2048, trim: true, type: String },
    title: { maxlength: 180, required: true, trim: true, type: String },
    transitions: [{ maxlength: 120, trim: true, type: String }],
    type: { default: "ad", enum: VIDEO_TYPES, type: String },
    userId: objectId("User", true),
    selectedStyle: { maxlength: 80, trim: true, type: String },
    videoAsset: { default: null, type: assetRefSchema },
    videoPrompt: { maxlength: 4000, trim: true, type: String },
    videoUrl: { maxlength: 2048, trim: true, type: String },
  },
  schemaOptions,
);

videoSchema.index({ userId: 1, projectId: 1, createdAt: -1 });
videoSchema.index({ campaignId: 1 });
videoSchema.index({ renderStatus: 1, createdAt: 1 });
addBasePlugins(videoSchema);

export const VideoModel = (mongoose.models.Video as Model<IVideo>) ?? mongoose.model<IVideo>("Video", videoSchema);
