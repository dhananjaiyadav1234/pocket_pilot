// src/app/dashboard/ai-planner/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

interface Budget {
  _id: string;
  category: string;
  month: number;
  year: number;
  limit: number;
}

export default function AiPlannerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [aiRisk, setAiRisk] = useState("medium");
  const [aiGoal, setAiGoal] = useState("Wealth growth");
  const [aiHorizon, setAiHorizon] = useState("5");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMonthNumber = currentMonth + 1;
  const monthLabel = today.toLocaleString("default", { month: "long" });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [txRes, budRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch(`/api/budgets?month=${currentMonthNumber}&year=${currentYear}`),
        ]);

        const txData = await txRes.json();
        const budData = await budRes.json();

        if (!txData.success) {
          setError(txData.message || "Failed to load transactions");
        } else {
          setTransactions(txData.data);
        }

        if (budData.success) {
          setBudgets(budData.data);
        }
      } catch (err) {
        console.error("Error loading AI planner data:", err);
        setError("Network error while loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentMonthNumber, currentYear]);

  // Stats for AI
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const net = totalIncome - totalExpense;

  const monthlyCategorySpend = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: Record<string, number>, curr) => {
      const d = new Date(curr.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      }
      return acc;
    }, {} as Record<string, number>);

  const monthTotalExpense = Object.values(monthlyCategorySpend).reduce(
    (sum, v) => sum + v,
    0
  );

  const savingsRate =
    totalIncome > 0 ? Math.max(0, (net / totalIncome) * 100) : 0;

  const topCategoryEntry =
    Object.entries(monthlyCategorySpend).sort((a, b) => b[1] - a[1])[0] ??
    null;

  const handleGetInvestmentInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    setAiLoading(true);
    setAiResult(null);

    try {
      const body = {
        riskLevel: aiRisk,
        goalType: aiGoal,
        goalHorizonYears: Number(aiHorizon) || 0,
        monthlySavingsEstimate: net > 0 ? net : 0,
        savingsRate,
        totalIncome,
        totalExpense,
        monthLabel,
        monthTotalExpense,
        topCategory: topCategoryEntry
          ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] }
          : null,
      };

      const res = await fetch("/api/investment-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAiError(data.message || "Failed to generate insight");
        return;
      }

      setAiResult(data.data.text);
    } catch (err) {
      console.error("Error getting investment insight:", err);
      setAiError("Network error while contacting AI");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Plan with AI · Investment Planner</h2>
      <p className="text-slate-400 text-sm">
        Using your PocketPilot data for {monthLabel} {currentYear}, get a
        high-level suggestion on how to split your savings across different
        investment buckets. This is educational only – not financial advice.
      </p>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 p-4 space-y-4">
        <form
          onSubmit={handleGetInvestmentInsight}
          className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              value={aiRisk}
              onChange={(e) => setAiRisk(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
            </select>

            <select
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option>Wealth growth</option>
              <option>Emergency fund</option>
              <option>Big purchase</option>
              <option>Education</option>
              <option>Travel / lifestyle</option>
            </select>

            <input
              type="number"
              min={1}
              placeholder="Horizon (years)"
              value={aiHorizon}
              onChange={(e) => setAiHorizon(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none md:w-32"
            />
          </div>

        <button
          type="submit"
          disabled={aiLoading}
          className="rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 transition px-4 py-2 text-xs font-medium text-slate-950"
        >
          {aiLoading ? "Thinking..." : "Get AI Insight"}
        </button>
        </form>

        {aiError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
            {aiError}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 whitespace-pre-line">
          {aiResult ? (
            aiResult
          ) : (
            <span className="text-slate-400">
              Choose your risk level, goal and time horizon, then click{" "}
              <span className="font-semibold text-slate-100">
                “Get AI Insight”
              </span>{" "}
              to see a suggested allocation. This is for learning only, not
              financial advice.
            </span>
          )}
        </div>
      </section>

      {loading && (
        <p className="text-slate-500 text-xs">
          Loading latest data for AI planner…
        </p>
      )}
    </div>
  );
}