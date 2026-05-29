import type { HydratedDocument, Model, Types } from "mongoose";

export type ObjectId = Types.ObjectId;

export type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

export type SoftDeletable = {
  deletedAt?: Date | null;
  deletedBy?: ObjectId | null;
  isDeleted: boolean;
};

export type Versioned = {
  schemaVersion: number;
};

export type BaseEntity = Timestamped & SoftDeletable & Versioned;

export type MarketlyDocument<T> = HydratedDocument<T>;
export type MarketlyModel<T> = Model<T>;
