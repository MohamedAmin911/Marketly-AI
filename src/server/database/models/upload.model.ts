import mongoose, { Schema, type Model } from "mongoose";

import { FILE_TYPES, UPLOAD_STATUSES, type FileType, type UploadStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IUpload extends BaseEntity {
  checksum?: string;
  fileSize: number;
  fileType: FileType;
  mimeType: string;
  originalName: string;
  storageKey?: string;
  storageUrl: string;
  uploadStatus: UploadStatus;
  userId: ObjectId;
}

const uploadSchema = new Schema<IUpload>(
  {
    ...softDeleteFields,
    checksum: { index: true, maxlength: 128, trim: true, type: String },
    fileSize: { max: 1024 * 1024 * 500, min: 0, required: true, type: Number },
    fileType: { enum: FILE_TYPES, required: true, type: String },
    mimeType: { maxlength: 120, required: true, trim: true, type: String },
    originalName: { maxlength: 255, required: true, trim: true, type: String },
    storageKey: { maxlength: 512, trim: true, type: String },
    storageUrl: { maxlength: 2048, required: true, trim: true, type: String },
    uploadStatus: { default: "pending", enum: UPLOAD_STATUSES, index: true, type: String },
    userId: objectId("User", true),
  },
  schemaOptions,
);

uploadSchema.index({ userId: 1, createdAt: -1 });
uploadSchema.index({ userId: 1, checksum: 1 }, { sparse: true });
uploadSchema.index({ uploadStatus: 1, createdAt: 1 });
addBasePlugins(uploadSchema);

export const UploadModel = (mongoose.models.Upload as Model<IUpload>) ?? mongoose.model<IUpload>("Upload", uploadSchema);
