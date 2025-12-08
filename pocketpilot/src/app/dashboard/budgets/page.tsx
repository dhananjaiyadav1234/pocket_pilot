// src/app/dashboard/budgets/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";

interface Budget {
  _id: string;
  category: string;
  month: number; // 1-12
  year: number;
  limit: number;
}

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

export default function BudgetsPage() {
  const today = new Date();
  const currentMonthIndex = today.getMonth(); // 0-based
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentMonthIndex + 1
  ); // 1-based
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const selectedMonthLabel = MONTHS[selectedMonth - 1];
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // ---------- Fetch budgets for selected month/year ----------
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/budgets?month=${selectedMonth}&year=${selectedYear}`
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load budgets");
        }

        setBudgets(data.data);
      } catch (err: any) {
        console.error("GET /api/budgets error:", err);
        setError(err?.message || "Network error while loading budgets");
        setBudgets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  // ---------- Add budget handler ----------
  const handleAddBudget = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newCategory.trim() || !newLimit.trim()) {
      setFormError("Please fill both category and limit.");
      return;
    }

    const numericLimit = Number(newLimit);
    if (Number.isNaN(numericLimit) || numericLimit <= 0) {
      setFormError("Limit must be a positive number.");
      return;
    }

    try {
      setFormLoading(true);

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newCategory.trim(),
          limit: numericLimit,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create budget");
      }

      const created: Budget = data.data;

      // Update local list so UI updates instantly
      setBudgets((prev) => [...prev, created]);

      setNewCategory("");
      setNewLimit("");
      setFormSuccess(
        `Added budget for ${created.category} – ₹${created.limit} (${selectedMonthLabel} ${selectedYear})`
      );
    } catch (err: any) {
      console.error("POST /api/budgets error:", err);
      setFormError(err?.message || "Something went wrong while adding budget.");
    } finally {
      setFormLoading(false);
    }
  };

  const monthBudgets = budgets.filter(
    (b) => b.month === selectedMonth && b.year === selectedYear
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Budgets</h1>
          <p className="mt-1 text-xs text-slate-400">
            Set category-wise limits for each month so PocketPilot can warn you
            before you overspend.
          </p>
        </div>

        {/* Month / year picker */}
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
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

      {/* Add budget form */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Add budget for {selectedMonthLabel} {selectedYear}
        </h2>

        <form
          onSubmit={handleAddBudget}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            placeholder="Category (e.g. Food, Rent, Travel)"
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <input
            type="number"
            placeholder="Limit (₹)"
            className="w-32 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
          />
          <button
            type="submit"
            disabled={formLoading}
            className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {formLoading ? "Saving..." : "Add budget"}
          </button>
        </form>

        {formError && (
          <p className="text-xs text-rose-400 mt-1">{formError}</p>
        )}
        {formSuccess && (
          <p className="text-xs text-emerald-400 mt-1">{formSuccess}</p>
        )}
      </section>

      {/* Budgets list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Budgets for {selectedMonthLabel} {selectedYear}
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400">Loading budgets…</p>
        ) : monthBudgets.length === 0 ? (
          <p className="text-sm text-slate-400">
            No budgets set for this month yet. Add one above to get started.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {monthBudgets.map((b) => (
              <div
                key={b._id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-sm font-medium text-slate-100">
                  {b.category}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Limit:{" "}
                  <span className="font-semibold text-slate-50">
                    ₹{b.limit.toFixed(0)}
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Applied to {MONTHS[b.month - 1]} {b.year}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}