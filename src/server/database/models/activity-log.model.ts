import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IActivityLog extends BaseEntity {
  action: string;
  entityId?: ObjectId;
  entityType: string;
  ipAddress?: string;
  metadata: Record<string, unknown>;
  userAgent?: string;
  userId: ObjectId;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    ...softDeleteFields,
    action: { maxlength: 160, required: true, trim: true, type: String },
    entityId: { type: Schema.Types.ObjectId },
    entityType: { maxlength: 80, required: true, trim: true, type: String },
    ipAddress: { maxlength: 80, trim: true, type: String },
    metadata: { default: () => ({}), type: Map, of: Schema.Types.Mixed },
    userAgent: { maxlength: 512, trim: true, type: String },
    userId: objectId("User", true),
  },
  schemaOptions,
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
addBasePlugins(activityLogSchema);

export const ActivityLogModel = (mongoose.models.ActivityLog as Model<IActivityLog>) ?? mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
