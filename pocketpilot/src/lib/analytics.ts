// src/lib/analytics.ts

export type TransactionType = "income" | "expense";

export interface TransactionDTO {
  _id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string coming from API
  note?: string;
}

export interface BudgetDTO {
  _id: string;
  category: string;
  limit: number;
  month: number; // 0-11 or 1-12, we'll handle both
  year: number;
}

/* ---------- BASIC STATS ---------- */

export function getBasicStats(transactions: TransactionDTO[]) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  return { totalIncome, totalExpense, netSavings };
}

/* ---------- CATEGORY SPEND (THIS MONTH) ---------- */

export function getMonthlyCategorySpend(
  transactions: TransactionDTO[],
  month: number,
  year: number
) {
  const spendByCategory: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.type !== "expense") return;

    const d = new Date(t.date);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (m === month && y === year) {
      spendByCategory[t.category] =
        (spendByCategory[t.category] || 0) + t.amount;
    }
  });

  // Find biggest spend category
  let biggestCategory = "";
  let biggestAmount = 0;
  Object.entries(spendByCategory).forEach(([cat, amt]) => {
    if (amt > biggestAmount) {
      biggestAmount = amt;
      biggestCategory = cat;
    }
  });

  return { spendByCategory, biggestCategory, biggestAmount };
}

/* ---------- BUDGET INSIGHTS + ALERTS ---------- */

export interface BudgetSummary {
  budgetId: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  usage: number; // 0–1+, 1.2 = 120%
  status: "ok" | "warning" | "danger";
}

export interface BudgetInsights {
  summaries: BudgetSummary[];
  alerts: string[];
}

export function getBudgetInsights(
  transactions: TransactionDTO[],
  budgets: BudgetDTO[],
  month: number,
  year: number
): BudgetInsights {
  const expenseByCategory: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.type !== "expense") return;

    const d = new Date(t.date);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (m === month && y === year) {
      expenseByCategory[t.category] =
        (expenseByCategory[t.category] || 0) + t.amount;
    }
  });

  const summaries: BudgetSummary[] = [];
  const alerts: string[] = [];

  budgets.forEach((b) => {
    // handle both 0–11 and 1–12 style months
    const budgetMonthIndex = b.month > 11 ? b.month - 1 : b.month;

    if (budgetMonthIndex !== month || b.year !== year) return;

    const spent = expenseByCategory[b.category] || 0;
    const usage = b.limit > 0 ? spent / b.limit : 0;
    const remaining = b.limit - spent;

    let status: BudgetSummary["status"] = "ok";

    if (usage >= 1) status = "danger";
    else if (usage >= 0.8) status = "warning";

    summaries.push({
      budgetId: b._id,
      category: b.category,
      limit: b.limit,
      spent,
      remaining,
      usage,
      status,
    });

    if (status === "danger") {
      alerts.push(
        `You are OVER budget for ${b.category} (₹${spent.toFixed(
          0
        )} / ₹${b.limit.toFixed(0)}).`
      );
    } else if (status === "warning") {
      alerts.push(
        `You are close to the limit for ${b.category} (₹${spent.toFixed(
          0
        )} / ₹${b.limit.toFixed(0)}).`
      );
    }
  });

  return { summaries, alerts };
}