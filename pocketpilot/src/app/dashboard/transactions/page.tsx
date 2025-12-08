// src/app/dashboard/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note?: string;
}

const CATEGORIES = [
  "Food",
  "Travel",
  "Rent",
  "Shopping",
  "Subscriptions",
  "Others",
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    date: "",
    note: "",
  });

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "Failed to load transactions");
        } else {
          setTransactions(data.data);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Network error while loading transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.amount) {
      setError("Amount is required");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save transaction");
        return;
      }

      setTransactions((prev) => [data.data, ...prev]);

      setForm({
        type: "expense",
        amount: "",
        category: "Food",
        date: "",
        note: "",
      });
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Network error while saving transaction");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Track · Transactions</h2>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[1.1fr,2fr] items-start">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 p-4"
        >
          <h3 className="font-semibold text-lg">Add Transaction</h3>

          <div className="flex gap-2">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              name="amount"
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
              required
            />
          </div>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
          />

          <input
            name="note"
            placeholder="Note (optional)"
            value={form.note}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 transition py-2 text-sm font-medium text-slate-950"
          >
            Save Transaction
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800 p-4">
          <h3 className="font-semibold text-lg mb-3">Recent Transactions</h3>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No transactions yet. Add your first one!
            </p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {transactions.map((t) => (
                <li
                  key={t._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {t.category}{" "}
                      {t.note && (
                        <span className="text-slate-400">· {t.note}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={
                      t.type === "income"
                        ? "text-emerald-400 font-semibold"
                        : "text-rose-400 font-semibold"
                    }
                  >
                    {t.type === "income" ? "+" : "-"}₹{t.amount}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}