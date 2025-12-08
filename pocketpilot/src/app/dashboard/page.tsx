// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note?: string;
}

interface Budget {
  _id: string;
  category: string;
  month: number; // 1-12
  year: number;
  limit: number;
}

const COLORS = ["#34d399", "#60a5fa", "#f87171", "#fbbf24", "#a78bfa"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OverviewPage() {
  const today = new Date();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    today.getMonth() // 0-based
  );
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const selectedMonthNumber = selectedMonthIndex + 1;
  const monthLabel = MONTHS[selectedMonthIndex];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // year options in dropdown
  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [txRes, budRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch(`/api/budgets?month=${selectedMonthNumber}&year=${selectedYear}`),
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
        } else {
          console.warn("Failed to load budgets:", budData.message);
        }
      } catch (err) {
        console.error("Error loading overview data:", err);
        setError("Network error while loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [selectedMonthNumber, selectedYear]);

  // ---------- Helpers for selected month/year ----------

  const isInSelectedMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear
    );
  };

  const txForMonth = transactions.filter((t) => isInSelectedMonth(t.date));
  const incomeForMonth = txForMonth.filter((t) => t.type === "income");
  const expensesForMonth = txForMonth.filter((t) => t.type === "expense");

  const totalIncome = incomeForMonth.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expensesForMonth.reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpense;

  // Expense breakdown (for selected month)
  const expenseByCategory = expensesForMonth.reduce(
    (acc: { name: string; value: number }[], curr) => {
      const existing = acc.find((i) => i.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    },
    [] as { name: string; value: number }[]
  );

  // Daily spending (selected month)
  const dailySpendingMap = new Map<number, number>();
  expensesForMonth.forEach((t) => {
    const d = new Date(t.date);
    const day = d.getDate();
    dailySpendingMap.set(day, (dailySpendingMap.get(day) || 0) + t.amount);
  });

  const dailySpendingData = Array.from(dailySpendingMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, amount]) => ({ day: day.toString(), amount }));

  // Monthly spend per category (selected month)
  const monthlyCategorySpend: Record<string, number> =
    expensesForMonth.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthTotalExpense = Object.values(monthlyCategorySpend).reduce(
    (sum, v) => sum + v,
    0
  );

  // For forecast, if it's the current month use today's date, else use full month
  const daysInSelectedMonth = new Date(
    selectedYear,
    selectedMonthIndex + 1,
    0
  ).getDate();
  const daysSoFar =
    selectedMonthIndex === today.getMonth() &&
    selectedYear === today.getFullYear()
      ? today.getDate()
      : daysInSelectedMonth;

  const avgDailySpend = daysSoFar > 0 ? monthTotalExpense / daysSoFar : 0;
  const projectedMonthExpense = avgDailySpend * daysInSelectedMonth;

  const totalBudgetForMonth = budgets
    .filter(
      (b) => b.month === selectedMonthNumber && b.year === selectedYear
    )
    .reduce((sum, b) => sum + b.limit, 0);

  const savingsRate =
    totalIncome > 0 ? Math.max(0, (net / totalIncome) * 100) : 0;

  const topCategoryEntry =
    Object.entries(monthlyCategorySpend).sort((a, b) => b[1] - a[1])[0];

  // ---------- Budget / category matching (case-insensitive) ----------

  const normalize = (s: string) => s.trim().toLowerCase();

  const budgetsForSelectedMonth = budgets.filter(
    (b) => b.month === selectedMonthNumber && b.year === selectedYear
  );

  const getSpentForBudgetCategory = (category: string) => {
    const normCat = normalize(category);
    return expensesForMonth
      .filter((t) => normalize(t.category) === normCat)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const overspentCategories = budgetsForSelectedMonth.filter((b) => {
    const spent = getSpentForBudgetCategory(b.category);
    return spent > b.limit;
  });

  const nearLimitCategories = budgetsForSelectedMonth.filter((b) => {
    const spent = getSpentForBudgetCategory(b.category);
    if (!b.limit) return false;
    const percent = (spent / b.limit) * 100;
    return percent >= 80 && percent <= 100;
  });

  return (
    <div className="space-y-8">
      {/* Header row: title + month/year selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Overview – {monthLabel} {selectedYear}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            See how your money behaved across different months.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {/* Budget Alerts */}
{(overspentCategories.length > 0 || nearLimitCategories.length > 0) && (
  <section className="space-y-2">
    {overspentCategories.map((b) => (
      <div
        key={`over-${b._id}`}
        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
      >
        ⚠️ <span className="font-medium">{b.category}</span> is{" "}
        <b>over budget</b> for {monthLabel}.  
        You spent ₹{getSpentForBudgetCategory(b.category)} out of ₹{b.limit}.
      </div>
    ))}

    {nearLimitCategories.map((b) => (
      <div
        key={`near-${b._id}`}
        className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
      >
        ⏳ <span className="font-medium">{b.category}</span> has crossed{" "}
        <b>80%</b> of its budget for {monthLabel}.  
        ₹{getSpentForBudgetCategory(b.category)} / ₹{b.limit}.
      </div>
    ))}
  </section>
)}

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 p-4">
          <p className="text-sm text-slate-400">Total Income</p>
          <p className="text-2xl font-semibold mt-2">₹{totalIncome}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 p-4">
          <p className="text-sm text-slate-400">Total Expense</p>
          <p className="text-2xl font-semibold mt-2">₹{totalExpense}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 p-4">
          <p className="text-sm text-slate-400">Net Savings</p>
          <p
            className={`text-2xl font-semibold mt-2 ${
              net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ₹{net}
          </p>
        </div>
      </section>

      {/* Smart insights */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Savings health */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">
            Savings Health
          </p>
          <p className="mt-2 text-lg font-semibold">
            {savingsRate ? savingsRate.toFixed(1) : "0.0"}%
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {savingsRate >= 20
              ? "Nice! You’re saving a healthy chunk of your income."
              : savingsRate > 0
              ? "You’re saving a bit — try pushing this closer to 20%."
              : "No savings yet this month. A small buffer can help a lot."}
          </p>
        </div>

        

        {/* Biggest spend */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-sky-300/80">
            Biggest Spend This Month
          </p>
          {topCategoryEntry ? (
            <>
              <p className="mt-2 text-lg font-semibold">
                {topCategoryEntry[0]}
              </p>
              <p className="mt-1 text-sm text-slate-100">
                ₹{topCategoryEntry[1]} spent in {monthLabel}.
              </p>
              <p className="mt-1 text-xs text-slate-300">
                This is where cutting 5–10% will make the biggest impact.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              Add a few expenses to see where your money actually goes.
            </p>
          )}
        </div>

        {/* Budget forecast */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-300/80">
            Budget Forecast
          </p>
          {monthTotalExpense > 0 ? (
            <>
              <p className="mt-2 text-sm text-slate-100">
                Avg spend:{" "}
                <span className="font-semibold">
                  ₹{avgDailySpend.toFixed(0)}
                </span>{" "}
                / day
              </p>
              <p className="mt-1 text-sm text-slate-100">
                Total spent:{" "}
                <span className="font-semibold">
                  ₹{monthTotalExpense.toFixed(0)}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-100">
                Projected month spend:{" "}
                <span className="font-semibold">
                  ₹{projectedMonthExpense.toFixed(0)}
                </span>
              </p>
              {totalBudgetForMonth > 0 && (
                <p className="mt-1 text-xs text-slate-300">
                  {projectedMonthExpense <= totalBudgetForMonth
                    ? "You’re on track to stay within your total budgets."
                    : "Warning: at this pace you’ll overshoot your total budgets."}
                </p>
              )}
              {overspentCategories.length > 0 && (
                <p className="mt-1 text-xs text-rose-300">
                  Already over budget in{" "}
                  {overspentCategories.map((b) => b.category).join(", ")}.
                </p>
              )}
              {overspentCategories.length === 0 &&
                nearLimitCategories.length > 0 && (
                  <p className="mt-1 text-xs text-amber-300">
                    Getting close in{" "}
                    {nearLimitCategories.map((b) => b.category).join(", ")}.
                  </p>
                )}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              Once you log a few expenses, PocketPilot will forecast your month
              for you.
            </p>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-2xl border border-slate-800 p-4">
          <h3 className="font-semibold mb-4">Expense Breakdown</h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-slate-500 text-sm">No expenses yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {expenseByCategory.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="rounded-2xl border border-slate-800 p-4">
          <h3 className="font-semibold mb-4">
            Daily Spending ({monthLabel})
          </h3>
          {dailySpendingData.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No expenses yet this month
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" tickLine={false} />
                  <YAxis tickLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="amount"
                    radius={[8, 8, 0, 0]}
                    fill="#34d399"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Budgets summary for selected month */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm text-slate-100">
          Budgets for {monthLabel}
        </h3>

        {budgetsForSelectedMonth.length === 0 ? (
          <p className="text-sm text-slate-400">
            No budgets set for this month yet. Go to the Budgets page to add
            some.
          </p>
        ) : (
          <div className="space-y-2">
            {budgetsForSelectedMonth.map((b) => {
              const spent = getSpentForBudgetCategory(b.category); // ✅ case-insensitive
              const percent =
                b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;
              let status = "On track";
              let statusColor = "text-emerald-400";

              if (spent > b.limit) {
                status = "Over budget";
                statusColor = "text-rose-400";
              } else if (percent >= 80) {
                status = "Close to limit";
                statusColor = "text-amber-300";
              }

              return (
                <div
                  key={b._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-slate-100">
                      {b.category}
                    </p>
                    <p className="text-xs text-slate-400">
                      ₹{spent.toFixed(0)} / ₹{b.limit.toFixed(0)}{" "}
                      <span className="ml-1 text-[11px] text-slate-500">
                        ({percent.toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        spent > b.limit ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-[11px] ${statusColor}`}>{status}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {loading && (
        <p className="text-slate-500 text-xs">Loading latest data…</p>
      )}
    </div>
  );
}