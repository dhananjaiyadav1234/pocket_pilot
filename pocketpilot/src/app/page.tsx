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
}

const COLORS = ["#34d399", "#60a5fa", "#f87171", "#fbbf24", "#a78bfa"];

export default function OverviewPage() {
  const [tx, setTx] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((d) => setTx(d.data || []));
  }, []);

  const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  const expenseByCategory = tx
    .filter(t => t.type === "expense")
    .reduce((acc: any[], t) => {
      const f = acc.find(i => i.name === t.category);
      f ? f.value += t.amount : acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Income" value={`₹${income}`} />
        <Card title="Expense" value={`₹${expense}`} />
        <Card title="Net Savings" value={`₹${net}`} green={net >= 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Expense Breakdown">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expenseByCategory} dataKey="value" label>
                {expenseByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Spending">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={expenseByCategory}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Card({ title, value, green }: any) {
  return (
    <div className="border border-slate-800 rounded-xl p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`text-2xl font-semibold ${green ? "text-emerald-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="border border-slate-800 rounded-xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}