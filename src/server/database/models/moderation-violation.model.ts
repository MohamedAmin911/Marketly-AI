import mongoose, { Schema, type Model } from "mongoose";

export const VIOLATION_CATEGORIES = [
  "sexual_content",
  "child_safety",
  "violence",
  "self_harm",
  "extremism",
  "terrorism",
  "illegal_drugs",
  "weapons",
  "fraud_scam",
  "hacking_malware",
  "prompt_injection",
  "privacy",
  "hate_speech",
  "harassment",
  "other",
] as const;

export const VIOLATION_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const AI_FEATURES = [
  "ai_assistant",
  "image_generation",
  "video_generation",
  "campaign_generator",
  "growth_engine",
  "marketing_strategy",
  "text_generation",
  "storyboard",
  "advertisement",
  "tts",
  "transcription",
  "unknown",
] as const;

export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];
export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];
export type AiFeature = (typeof AI_FEATURES)[number];

export interface IModerationViolation {
  userId: string;
  email?: string;
  feature: AiFeature;
  prompt: string;
  matchedWords: string[];
  severity: ViolationSeverity;
  category: ViolationCategory;
  ip?: string;
  strikeNumber: number;
  moderationReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const moderationViolationSchema = new Schema<IModerationViolation>(
  {
    userId: { type: String, required: true, index: true, trim: true },
    email: { type: String, index: true, lowercase: true, trim: true },
    feature: { type: String, required: true, enum: AI_FEATURES, index: true },
    prompt: { type: String, required: true, maxlength: 8000, trim: true },
    matchedWords: { type: [String], default: [], required: true },
    severity: { type: String, required: true, enum: VIOLATION_SEVERITIES, index: true },
    category: { type: String, required: true, enum: VIOLATION_CATEGORIES, index: true },
    ip: { type: String, maxlength: 80, trim: true },
    strikeNumber: { type: Number, required: true, min: 1 },
    moderationReason: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: true },
);

moderationViolationSchema.index({ userId: 1, createdAt: -1 });
moderationViolationSchema.index({ category: 1, createdAt: -1 });
moderationViolationSchema.index({ feature: 1, createdAt: -1 });
moderationViolationSchema.index({ severity: 1, createdAt: -1 });

export const ModerationViolationModel =
  (mongoose.models.ModerationViolation as Model<IModerationViolation>) ??
  mongoose.model<IModerationViolation>("ModerationViolation", moderationViolationSchema);
