import mongoose, { Schema, type Model } from "mongoose";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";
import type { BaseEntity, ObjectId } from "@/server/database/types";

export interface IAssistantSession extends BaseEntity {
  user: ObjectId;
  title: string;
  provider: string; // e.g., "openai", "anthropic"
}

const assistantSessionSchema = new Schema<IAssistantSession>(
  {
    ...softDeleteFields,
    user: { ref: "User", required: true, type: Schema.Types.ObjectId },
    title: { required: true, type: String },
    provider: { default: "openai", type: String },
  },
  schemaOptions,
);

assistantSessionSchema.index({ user: 1, createdAt: -1 });
addBasePlugins(assistantSessionSchema);

export const AssistantSessionModel = (mongoose.models.AssistantSession as Model<IAssistantSession>) ?? mongoose.model<IAssistantSession>("AssistantSession", assistantSessionSchema);
