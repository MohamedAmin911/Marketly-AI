import mongoose, { Schema, type Model } from "mongoose";

import { THEMES, type Theme } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface ISettings extends BaseEntity {
  AISettings: Record<string, unknown>;
  language: string;
  notificationSettings: Record<string, unknown>;
  privacySettings: Record<string, unknown>;
  theme: Theme;
  userId: ObjectId;
}

const notificationSettingsSchema = new Schema(
  {
    billing: { default: true, type: Boolean },
    campaignUpdates: { default: true, type: Boolean },
    email: { default: true, type: Boolean },
    generationComplete: { default: true, type: Boolean },
    push: { default: false, type: Boolean },
    security: { default: true, type: Boolean },
  },
  { _id: false },
);

const privacySettingsSchema = new Schema(
  {
    allowAnalytics: { default: true, type: Boolean },
    allowModelTraining: { default: false, type: Boolean },
    profileDiscoverable: { default: false, type: Boolean },
  },
  { _id: false },
);

const aiSettingsSchema = new Schema(
  {
    defaultModel: { default: "mock", maxlength: 120, trim: true, type: String },
    memoryEnabled: { default: true, type: Boolean },
    personalizationEnabled: { default: true, type: Boolean },
    safetyLevel: { default: "standard", enum: ["strict", "standard", "relaxed"], type: String },
  },
  { _id: false },
);

const settingsSchema = new Schema<ISettings>(
  {
    ...softDeleteFields,
    AISettings: { default: () => ({}), type: aiSettingsSchema },
    language: { default: "en", maxlength: 12, trim: true, type: String },
    notificationSettings: { default: () => ({}), type: notificationSettingsSchema },
    privacySettings: { default: () => ({}), type: privacySettingsSchema },
    theme: { default: "dark", enum: THEMES, type: String },
    userId: objectId("User", true),
  },
  schemaOptions,
);

settingsSchema.index({ userId: 1 }, { partialFilterExpression: { isDeleted: false }, unique: true });
addBasePlugins(settingsSchema);

export const SettingsModel = (mongoose.models.Settings as Model<ISettings>) ?? mongoose.model<ISettings>("Settings", settingsSchema);
