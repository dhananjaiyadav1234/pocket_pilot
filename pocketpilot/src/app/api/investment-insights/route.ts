// src/app/api/investment-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai =
  process.env.OPENAI_API_KEY &&
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      riskLevel,
      goalType,
      goalHorizonYears,
      monthlySavingsEstimate,
      savingsRate,
      totalIncome,
      totalExpense,
      monthLabel,
      monthTotalExpense,
      topCategory,
    } = body;

    // Basic validation
    if (!riskLevel || !goalType) {
      return NextResponse.json(
        { success: false, message: "riskLevel and goalType are required" },
        { status: 400 }
      );
    }

    // Fallback rule-based suggestion if no AI key is configured
    if (!openai) {
      const simpleText = buildRuleBasedSuggestion({
        riskLevel,
        goalType,
        goalHorizonYears,
        monthlySavingsEstimate,
        savingsRate,
        totalIncome,
        totalExpense,
        monthLabel,
        monthTotalExpense,
        topCategory,
      });

      return NextResponse.json({
        success: true,
        data: {
          text:
            simpleText +
            "\n\n(Connect an OPENAI_API_KEY to enable richer AI insights.)",
          source: "rule-based",
        },
      });
    }

    // Build prompt for AI
    const prompt = buildPrompt({
      riskLevel,
      goalType,
      goalHorizonYears,
      monthlySavingsEstimate,
      savingsRate,
      totalIncome,
      totalExpense,
      monthLabel,
      monthTotalExpense,
      topCategory,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or any other chat model you have access to
      messages: [
        {
          role: "system",
          content:
            "You are a friendly financial education assistant. You help beginners understand how to allocate their savings across broad investment categories. " +
            "You are NOT a financial advisor. Do NOT recommend specific funds, stocks, or tickers. Only talk about general categories like equity mutual funds, index funds, debt funds, liquid funds, PPF, etc. " +
            "Always include a short disclaimer that this is educational, not financial advice.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const text =
      completion.choices[0]?.message?.content ??
      "Unable to generate insight at the moment.";

    return NextResponse.json({
      success: true,
      data: { text, source: "ai" },
    });
  } catch (error) {
    console.error("POST /api/investment-insights error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate investment insight",
      },
      { status: 500 }
    );
  }
}

// ---- Helpers ----

type InsightInput = {
  riskLevel: string;
  goalType: string;
  goalHorizonYears?: number;
  monthlySavingsEstimate?: number;
  savingsRate?: number;
  totalIncome?: number;
  totalExpense?: number;
  monthLabel?: string;
  monthTotalExpense?: number;
  topCategory?: { name: string; amount: number } | null;
};

function buildPrompt(input: InsightInput): string {
  const {
    riskLevel,
    goalType,
    goalHorizonYears,
    monthlySavingsEstimate,
    savingsRate,
    totalIncome,
    totalExpense,
    monthLabel,
    monthTotalExpense,
    topCategory,
  } = input;

  return `
User profile for investment guidance (India, beginner):

- Risk level: ${riskLevel}
- Goal type: ${goalType}
- Goal horizon (years): ${goalHorizonYears ?? "not specified"}
- Estimated monthly savings: ₹${monthlySavingsEstimate ?? 0}
- Savings rate (net / income): ${savingsRate?.toFixed?.(1) ?? "N/A"}%
- Monthly income: ₹${totalIncome ?? 0}
- Monthly expense: ₹${totalExpense ?? 0}
- Current month: ${monthLabel ?? "N/A"}
- Total expenses this month: ₹${monthTotalExpense ?? 0}
- Biggest spending category this month: ${
    topCategory
      ? `${topCategory.name} (₹${topCategory.amount})`
      : "not enough data"
  }

Tasks:
1. Suggest a high-level monthly allocation of their savings across 3–5 buckets, such as:
   - equity index mutual funds
   - diversified equity funds
   - debt or liquid funds
   - PPF / safer instruments
   - emergency fund
2. Explain the reasoning in simple, conversational language (this is a student/beginner).
3. Add 2–3 practical habits they can follow (SIP, emergency fund, diversification).
4. End with a short disclaimer that this is general educational information, not personal financial advice.
`;
}

function buildRuleBasedSuggestion(input: InsightInput): string {
  const {
    riskLevel,
    goalType,
    monthlySavingsEstimate = 0,
    savingsRate,
  } = input;

  const savingsText = monthlySavingsEstimate
    ? `Based on your estimated monthly savings of around ₹${monthlySavingsEstimate.toFixed(
        0
      )}, `
    : "Based on your savings pattern, ";

  let allocation: string;

  if (riskLevel === "low") {
    allocation =
      "• 20% – Equity index mutual funds (long-term growth)\n" +
      "• 40% – Short-term debt / liquid funds\n" +
      "• 40% – Safer options like RD/PPF / high-interest savings for emergency fund";
  } else if (riskLevel === "high") {
    allocation =
      "• 60% – Equity mutual funds / index funds (long-term growth)\n" +
      "• 25% – Debt / liquid funds (stability)\n" +
      "• 15% – Emergency fund (very safe, easily accessible)";
  } else {
    // medium / default
    allocation =
      "• 40% – Equity index mutual funds (core long-term growth)\n" +
      "• 30% – Diversified equity or hybrid funds\n" +
      "• 20% – Debt / liquid funds\n" +
      "• 10% – Emergency fund (bank / liquid fund)";
  }

  const goalLine = goalType
    ? `Your primary goal is **${goalType}**, so the plan focuses on balancing growth with safety.\n\n`
    : "";

  const savingsRateLine =
    savingsRate && savingsRate > 0
      ? `Your current savings rate is around **${savingsRate.toFixed(
          1
        )}%**, which is a good starting point.\n\n`
      : "";

  return (
    `Here’s a simple high-level plan for how you could think about allocating your savings:\n\n` +
    savingsText +
    `you could roughly split it like this:\n\n` +
    allocation +
    `\n\n` +
    goalLine +
    savingsRateLine +
    `This is just a rule-of-thumb educational example. As you grow your income and savings, you can increase the percentage going into long-term growth options.\n\n` +
    `**Note:** This is general educational information, not personalized financial advice. Please research carefully or talk to a qualified advisor before investing.`
  );
}