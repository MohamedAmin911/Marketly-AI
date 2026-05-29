import { Schema } from "mongoose";

export const objectId = (ref: string, required = false) => ({
  index: true,
  ref,
  required,
  type: Schema.Types.ObjectId,
});

export const schemaOptions = {
  minimize: false,
  optimisticConcurrency: true,
  timestamps: true,
  versionKey: "revision",
} as const;

export const softDeleteFields = {
  deletedAt: { default: null, index: true, type: Date },
  deletedBy: { default: null, ref: "User", type: Schema.Types.ObjectId },
  isDeleted: { default: false, index: true, type: Boolean },
  schemaVersion: { default: 1, min: 1, type: Number },
};

export const moneySchema = new Schema(
  {
    amount: { default: 0, min: 0, type: Number },
    currency: { default: "USD", maxlength: 3, minlength: 3, uppercase: true, type: String },
  },
  { _id: false },
);

export const assetRefSchema = new Schema(
  {
    alt: { maxlength: 240, trim: true, type: String },
    fileId: { maxlength: 240, trim: true, type: String },
    height: { min: 0, type: Number },
    metadata: { default: () => ({}), type: Schema.Types.Mixed },
    mimeType: { maxlength: 120, trim: true, type: String },
    storageKey: { maxlength: 512, trim: true, type: String },
    thumbnailUrl: { maxlength: 2048, trim: true, type: String },
    uploadId: { ref: "Upload", type: Schema.Types.ObjectId },
    url: { maxlength: 2048, trim: true, type: String },
    width: { min: 0, type: Number },
  },
  { _id: false },
);

export const colorPaletteSchema = new Schema(
  {
    accent: { maxlength: 16, trim: true, type: String },
    background: { maxlength: 16, trim: true, type: String },
    primary: { maxlength: 16, trim: true, type: String },
    secondary: { maxlength: 16, trim: true, type: String },
    text: { maxlength: 16, trim: true, type: String },
  },
  { _id: false },
);

export const platformMetricSchema = new Schema(
  {
    clicks: { default: 0, min: 0, type: Number },
    conversions: { default: 0, min: 0, type: Number },
    engagementRate: { default: 0, min: 0, type: Number },
    impressions: { default: 0, min: 0, type: Number },
    spend: { default: 0, min: 0, type: Number },
  },
  { _id: false },
);

export const generationSettingsSchema = new Schema(
  {
    aspectRatio: { maxlength: 24, trim: true, type: String },
    cfgScale: { max: 30, min: 0, type: Number },
    fps: { max: 120, min: 1, type: Number },
    height: { max: 4320, min: 128, type: Number },
    seed: { type: Number },
    steps: { max: 200, min: 1, type: Number },
    stylePreset: { maxlength: 80, trim: true, type: String },
    temperature: { max: 2, min: 0, type: Number },
    width: { max: 7680, min: 128, type: Number },
  },
  { _id: false },
);

export const aiInsightSchema = new Schema(
  {
    confidence: { max: 1, min: 0, type: Number },
    label: { maxlength: 160, trim: true, type: String },
    reason: { maxlength: 2000, trim: true, type: String },
  },
  { _id: true, timestamps: true },
);

export const timeSeriesPointSchema = new Schema(
  {
    clicks: { default: 0, min: 0, type: Number },
    conversions: { default: 0, min: 0, type: Number },
    date: { index: true, required: true, type: Date },
    engagementRate: { default: 0, min: 0, type: Number },
    impressions: { default: 0, min: 0, type: Number },
    revenue: { default: 0, min: 0, type: Number },
    spend: { default: 0, min: 0, type: Number },
  },
  { _id: false },
);

export function addBasePlugins(schema: Schema) {
  schema.pre(/^find/, function (this: { where: (criteria: Record<string, unknown>) => void }) {
    this.where({ isDeleted: { $ne: true } });
  });

  schema.methods.softDelete = async function (deletedBy?: unknown) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy ?? null;
    return this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
}
