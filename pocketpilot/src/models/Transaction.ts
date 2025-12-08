// src/models/Transaction.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "income" | "expense";

export interface ITransaction extends Document {
  // userId?: string; // we'll add this later when we do auth
  type: TransactionType;
  amount: number;
  category: string;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    // Make userId optional or remove it for now
    // userId: { type: String },

    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);