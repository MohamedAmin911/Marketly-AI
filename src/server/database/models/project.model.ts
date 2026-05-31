import mongoose, { Schema, type Model } from "mongoose";

import { PROJECT_TYPES, WORKFLOW_STATUSES, type ProjectType, type WorkflowStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, generationSettingsSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IProject extends BaseEntity {
  brandId: ObjectId;
  campaigns: ObjectId[];
  defaultStyles: Record<string, unknown>;
  description?: string;
  generatedContents: ObjectId[];
  generationPreferences: Record<string, unknown>;
  name: string;
  preferredPlatforms: string[];
  status: WorkflowStatus;
  storyboards: ObjectId[];
  tags: string[];
  type: ProjectType;
  userId: ObjectId;
  videos: ObjectId[];
}

const projectSchema = new Schema<IProject>(
  {
    ...softDeleteFields,
    brandId: objectId("Brand", true),
    campaigns: [{ ref: "Campaign", type: Schema.Types.ObjectId }],
    defaultStyles: { default: () => ({}), type: Map, of: Schema.Types.Mixed },
    description: { maxlength: 2000, trim: true, type: String },
    generatedContents: [{ ref: "GeneratedContent", type: Schema.Types.ObjectId }],
    generationPreferences: { default: () => ({}), type: generationSettingsSchema },
    name: { maxlength: 180, required: true, trim: true, type: String },
    preferredPlatforms: [{ maxlength: 80, trim: true, type: String }],
    status: { default: "draft", enum: WORKFLOW_STATUSES, index: true, type: String },
    storyboards: [{ ref: "Storyboard", type: Schema.Types.ObjectId }],
    tags: [{ lowercase: true, maxlength: 64, trim: true, type: String }],
    type: { default: "campaign", enum: PROJECT_TYPES, type: String },
    userId: objectId("User", true),
    videos: [{ ref: "Video", type: Schema.Types.ObjectId }],
  },
  schemaOptions,
);

projectSchema.index({ userId: 1, status: 1, createdAt: -1 });
projectSchema.index({ brandId: 1, status: 1 });
projectSchema.index({ userId: 1, brandId: 1 });
projectSchema.index({ tags: 1 });
addBasePlugins(projectSchema);

export const ProjectModel = (mongoose.models.Project as Model<IProject>) ?? mongoose.model<IProject>("Project", projectSchema);
