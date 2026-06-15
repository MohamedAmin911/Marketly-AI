import mongoose, { Schema, type Model } from "mongoose";

export interface IBrand {
  userId: string;
  name: string;
  tagline: string;
  elevatorPitch: string;
  industry: string;
  targetAudience: string;
  language: string;
  aiPersonality: "formal" | "casual" | "technical";
  tones: string[];
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    userId: { type: String, required: true, index: true, unique: true },
    name: { type: String, default: "", maxlength: 160, trim: true },
    tagline: { type: String, default: "", maxlength: 240, trim: true },
    elevatorPitch: { type: String, default: "", maxlength: 1000, trim: true },
    industry: { type: String, default: "", maxlength: 120, trim: true },
    targetAudience: { type: String, default: "", maxlength: 500, trim: true },
    language: { type: String, default: "en", enum: ["en", "ar"] },
    aiPersonality: { type: String, default: "formal", enum: ["formal", "casual", "technical"] },
    tones: [{ type: String, maxlength: 80 }],
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "#72ff5f" },
    secondaryColor: { type: String, default: "#b8f7a9" },
    accentColor: { type: String, default: "#62ff9a" },
    socialLinks: {
      website: String,
      linkedin: String,
      twitter: String,
      instagram: String,
    },
  },
  { timestamps: true },
);

export const BrandModel =
  (mongoose.models.Brand as Model<IBrand>) ??
  mongoose.model<IBrand>("Brand", brandSchema);