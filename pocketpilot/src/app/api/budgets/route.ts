// src/app/api/budgets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Budget } from "@/models/Budget";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
    const year = yearParam ? Number(yearParam) : now.getFullYear();

    const budgets = await Budget.find({ month, year }).sort({ category: 1 });

    return NextResponse.json({ success: true, data: budgets });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { category, limit, month, year } = await req.json();

    if (!category || !limit) {
      return NextResponse.json(
        { success: false, message: "category and limit are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { category, month: m, year: y },
      { category, month: m, year: y, limit },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save budget" },
      { status: 500 }
    );
  }
}