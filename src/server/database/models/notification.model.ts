import mongoose, { Schema, type Model } from "mongoose";

import { NOTIFICATION_TYPES, type NotificationType } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface INotification extends BaseEntity {
  actionUrl?: string;
  message: string;
  read: boolean;
  readAt?: Date;
  title: string;
  type: NotificationType;
  userId: ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    ...softDeleteFields,
    actionUrl: { maxlength: 2048, trim: true, type: String },
    message: { maxlength: 1000, required: true, trim: true, type: String },
    read: { default: false, index: true, type: Boolean },
    readAt: { type: Date },
    title: { maxlength: 180, required: true, trim: true, type: String },
    type: { enum: NOTIFICATION_TYPES, required: true, type: String },
    userId: objectId("User", true),
  },
  schemaOptions,
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
addBasePlugins(notificationSchema);

export const NotificationModel = (mongoose.models.Notification as Model<INotification>) ?? mongoose.model<INotification>("Notification", notificationSchema);
