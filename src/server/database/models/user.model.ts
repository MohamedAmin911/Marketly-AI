import mongoose, { Schema, type Model } from "mongoose";

import { AUTH_PROVIDERS, PLAN_TYPES, THEMES, USER_ROLES, USER_STATUSES, type AuthProvider, type PlanType, type Theme, type UserRole, type UserStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface UsageLimits {
  aiTokensPerMonth: number;
  campaignsPerMonth: number;
  imagesPerMonth: number;
  storageGb: number;
  videosPerMonth: number;
}

export interface RefreshTokenSession {
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  jti: string;
  replacedByTokenHash?: string;
  revokedAt?: Date | null;
  tokenHash: string;
  userAgent?: string;
}

export interface IUser extends BaseEntity {
  accountLockedUntil?: Date | null;
  authProvider: AuthProvider;
  avatar?: Record<string, unknown>;
  bio?: string;
  brands: ObjectId[];
  campaigns: ObjectId[];
  currentPlan: PlanType;
  email: string;
  emailVerified: boolean;
  failedLoginAttempts: number;
  fullName: string;
  language: string;
  lastLogin?: Date;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  passwordHash?: string;
  passwordResetExpires?: Date;
  passwordResetToken?: string;
  phone?: string;
  projects: ObjectId[];
  refreshTokens: RefreshTokenSession[];
  role: UserRole;
  status: UserStatus;
  subscriptionId?: ObjectId;
  theme: Theme;
  timezone: string;
  usageLimits: UsageLimits;
  username: string;
  verificationToken?: string;
}

const usageLimitsSchema = new Schema<UsageLimits>(
  {
    aiTokensPerMonth: { default: 50_000, min: 0, type: Number },
    campaignsPerMonth: { default: 5, min: 0, type: Number },
    imagesPerMonth: { default: 100, min: 0, type: Number },
    storageGb: { default: 5, min: 0, type: Number },
    videosPerMonth: { default: 10, min: 0, type: Number },
  },
  { _id: false },
);

const refreshTokenSchema = new Schema<RefreshTokenSession>(
  {
    createdAt: { default: () => new Date(), type: Date },
    expiresAt: { index: true, required: true, type: Date },
    ipAddress: { maxlength: 80, trim: true, type: String },
    jti: { index: true, maxlength: 80, required: true, trim: true, type: String },
    replacedByTokenHash: { maxlength: 128, select: false, trim: true, type: String },
    revokedAt: { default: null, type: Date },
    tokenHash: { maxlength: 128, required: true, select: false, trim: true, type: String },
    userAgent: { maxlength: 512, trim: true, type: String },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    ...softDeleteFields,
    accountLockedUntil: { default: null, type: Date },
    authProvider: { default: "credentials", enum: AUTH_PROVIDERS, type: String },
    avatar: { default: null, type: assetRefSchema },
    bio: { maxlength: 500, trim: true, type: String },
    brands: [{ ref: "Brand", type: Schema.Types.ObjectId }],
    campaigns: [{ ref: "Campaign", type: Schema.Types.ObjectId }],
    currentPlan: { default: "free", enum: PLAN_TYPES, type: String },
    email: { lowercase: true, maxlength: 254, required: true, trim: true, type: String },
    emailVerified: { default: false, type: Boolean },
    failedLoginAttempts: { default: 0, min: 0, type: Number },
    fullName: { maxlength: 140, required: true, trim: true, type: String },
    language: { default: "en", maxlength: 12, trim: true, type: String },
    lastLogin: { type: Date },
    notificationsEnabled: { default: true, type: Boolean },
    onboardingCompleted: { default: false, type: Boolean },
    onboardingStep: { default: 0, min: 0, type: Number },
    passwordHash: { select: false, type: String },
    passwordResetExpires: { select: false, type: Date },
    passwordResetToken: { select: false, type: String },
    phone: { maxlength: 32, trim: true, type: String },
    projects: [{ ref: "Project", type: Schema.Types.ObjectId }],
    refreshTokens: { default: () => [], select: false, type: [refreshTokenSchema] },
    role: { default: "owner", enum: USER_ROLES, type: String },
    status: { default: "active", enum: USER_STATUSES, index: true, type: String },
    subscriptionId: { ref: "Subscription", type: Schema.Types.ObjectId },
    theme: { default: "dark", enum: THEMES, type: String },
    timezone: { default: "UTC", maxlength: 80, trim: true, type: String },
    usageLimits: { default: () => ({}), type: usageLimitsSchema },
    username: { lowercase: true, maxlength: 40, minlength: 3, required: true, trim: true, type: String },
    verificationToken: { select: false, type: String },
  },
  schemaOptions,
);

userSchema.index({ email: 1 }, { partialFilterExpression: { isDeleted: false }, unique: true });
userSchema.index({ username: 1 }, { partialFilterExpression: { isDeleted: false }, unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, currentPlan: 1 });
addBasePlugins(userSchema);

export const UserModel = (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", userSchema);
