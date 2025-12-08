// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();

    const transactions = await Transaction.find({}).sort({ date: -1 });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { type, amount, category, date, note } = await req.json();

    if (!type || !amount || !category) {
      return NextResponse.json(
        { success: false, message: "type, amount, category are required" },
        { status: 400 }
      );
    }

    const newTx = await Transaction.create({
      type,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      note,
    });

    return NextResponse.json(
      { success: true, data: newTx },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create transaction" },
      { status: 500 }
    );
  }
}