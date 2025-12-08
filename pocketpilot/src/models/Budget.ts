// src/models/Budget.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  category: string;
  month: number; // 1–12
  year: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    category: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    limit: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);