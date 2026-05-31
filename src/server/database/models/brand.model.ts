import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, colorPaletteSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IBrand extends BaseEntity {
  ageRange?: { max?: number; min?: number };
  analytics: ObjectId[];
  businessGoals: string[];
  campaigns: ObjectId[];
  colorPalette: Record<string, string>;
  competitors: string[];
  description?: string;
  dos: string[];
  donts: string[];
  forbiddenWords: string[];
  gender?: string;
  industry?: string;
  interests: string[];
  locations: string[];
  logo?: Record<string, unknown>;
  name: string;
  niches: string[];
  platforms: string[];
  preferredAngles: string[];
  preferredCTAs: string[];
  preferredContentStyle?: string;
  preferredLighting?: string;
  preferredVideoStyle?: string;
  projects: ObjectId[];
  slug: string;
  tone?: string;
  typography?: Record<string, string>;
  userId: ObjectId;
  visualStyle?: string;
  voice?: string;
  website?: string;
}

const brandSchema = new Schema<IBrand>(
  {
    ...softDeleteFields,
    ageRange: {
      max: { max: 120, min: 0, type: Number },
      min: { max: 120, min: 0, type: Number },
    },
    analytics: [{ ref: "Analytics", type: Schema.Types.ObjectId }],
    businessGoals: [{ maxlength: 160, trim: true, type: String }],
    campaigns: [{ ref: "Campaign", type: Schema.Types.ObjectId }],
    colorPalette: { default: () => ({}), type: colorPaletteSchema },
    competitors: [{ maxlength: 160, trim: true, type: String }],
    description: { maxlength: 2000, trim: true, type: String },
    dos: [{ maxlength: 240, trim: true, type: String }],
    donts: [{ maxlength: 240, trim: true, type: String }],
    forbiddenWords: [{ lowercase: true, maxlength: 80, trim: true, type: String }],
    gender: { maxlength: 80, trim: true, type: String },
    industry: { maxlength: 120, trim: true, type: String },
    interests: [{ maxlength: 120, trim: true, type: String }],
    locations: [{ maxlength: 120, trim: true, type: String }],
    logo: { default: null, type: assetRefSchema },
    name: { maxlength: 140, required: true, trim: true, type: String },
    niches: [{ maxlength: 120, trim: true, type: String }],
    platforms: [{ maxlength: 80, trim: true, type: String }],
    preferredAngles: [{ maxlength: 80, trim: true, type: String }],
    preferredCTAs: [{ maxlength: 120, trim: true, type: String }],
    preferredContentStyle: { maxlength: 120, trim: true, type: String },
    preferredLighting: { maxlength: 120, trim: true, type: String },
    preferredVideoStyle: { maxlength: 120, trim: true, type: String },
    projects: [{ ref: "Project", type: Schema.Types.ObjectId }],
    slug: { lowercase: true, maxlength: 160, required: true, trim: true, type: String },
    tone: { maxlength: 120, trim: true, type: String },
    typography: { default: () => ({}), type: Map, of: String },
    userId: objectId("User", true),
    visualStyle: { maxlength: 120, trim: true, type: String },
    voice: { maxlength: 120, trim: true, type: String },
    website: { maxlength: 2048, trim: true, type: String },
  },
  schemaOptions,
);

brandSchema.index({ userId: 1, slug: 1 }, { partialFilterExpression: { isDeleted: false }, unique: true });
brandSchema.index({ userId: 1, createdAt: -1 });
brandSchema.index({ slug: 1 });
addBasePlugins(brandSchema);

export const BrandModel = (mongoose.models.Brand as Model<IBrand>) ?? mongoose.model<IBrand>("Brand", brandSchema);
