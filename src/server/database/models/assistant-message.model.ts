import mongoose, { Schema, type Model } from "mongoose";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";
import type { BaseEntity, ObjectId } from "@/server/database/types";

export interface IAssistantMessage extends BaseEntity {
  session: ObjectId;
  role: "system" | "user" | "assistant";
  content: string;
  tokensUsed?: number;
  cost?: number;
}

const assistantMessageSchema = new Schema<IAssistantMessage>(
  {
    ...softDeleteFields,
    session: { ref: "AssistantSession", required: true, type: Schema.Types.ObjectId },
    role: { enum: ["system", "user", "assistant"], required: true, type: String },
    content: { required: true, type: String },
    tokensUsed: { type: Number },
    cost: { type: Number },
  },
  schemaOptions,
);

assistantMessageSchema.index({ session: 1, createdAt: 1 });
addBasePlugins(assistantMessageSchema);

export const AssistantMessageModel = (mongoose.models.AssistantMessage as Model<IAssistantMessage>) ?? mongoose.model<IAssistantMessage>("AssistantMessage", assistantMessageSchema);
