"use client";

import React, { useMemo, useState } from "react";
import { useTransactionStore } from "../../stores/useTransactionStore";
import { useExpensesStore } from "../../stores/useExpenseStore";
import { usePatientStore } from "../../stores/usePatientStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

const DashboardData = () => {
  const { transactions } = useTransactionStore();
  const { expenses } = useExpensesStore();
  const { patients } = usePatientStore();
  const [period, setPeriod] = useState("month"); // 'today' | 'month' | 'year' | 'all'

  // Sales totals
  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    let todayTotal = 0,
      monthTotal = 0,
      yearTotal = 0,
      allTotal = 0;

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const amt = Number(t.amount) || 0;
      allTotal += amt;
      if (t.date.startsWith(today)) todayTotal += amt;
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        monthTotal += amt;
      }
      if (d.getFullYear() === now.getFullYear()) yearTotal += amt;
    });

    return {
      today: todayTotal,
      month: monthTotal,
      year: yearTotal,
      all: allTotal,
    };
  }, [transactions]);

  // Expense totals
  const expenseTotals = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const month = today.getMonth();
    const year = today.getFullYear();

    let tTotal = 0,
      mTotal = 0,
      yTotal = 0,
      allTotal = 0;

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const amt = Number(e.amount) || 0;
      allTotal += amt;
      if (d.toISOString().split("T")[0] === todayStr) {
        tTotal += amt;
      }
      if (d.getMonth() === month && d.getFullYear() === year) {
        mTotal += amt;
      }
      if (d.getFullYear() === year) {
        yTotal += amt;
      }
    });

    return {
      today: tTotal,
      month: mTotal,
      year: yTotal,
      all: allTotal,
    };
  }, [expenses]);

  const activeSales = totals[period];
  const activeExpenses = expenseTotals[period];
  const activeNet = activeSales - activeExpenses;

  // Uncollected installment balances
  const totalReceivables = useMemo(() => {
    return patients.reduce((acc, p) => acc + (Number(p.balance) || 0), 0);
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Financial Overview
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Real-time clinic revenue, operational expenditures, and receivables
          </p>
        </div>

        {/* Period Selector Pills */}
        <div className="flex items-center gap-1 bg-[hsl(var(--muted))] p-1 rounded-xl border border-[hsl(var(--border))] self-start">
          {[
            { id: "today", label: "Today" },
            { id: "month", label: "This Month" },
            { id: "year", label: "This Year" },
            { id: "all", label: "All Time" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                period === item.id
                  ? "bg-amber-500 text-black font-semibold shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales */}
        <Card className="relative overflow-hidden hover:border-amber-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Gross Collections
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ₱{activeSales.toLocaleString()}
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1">
              <span className="text-amber-500 font-medium">
                {period === "month"
                  ? "Current Month Revenue"
                  : period === "today"
                  ? "Today's Collections"
                  : period === "year"
                  ? "Year-to-Date"
                  : "Lifetime Revenue"}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="relative overflow-hidden hover:border-red-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Total Expenses
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ₱{activeExpenses.toLocaleString()}
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1">
              <span className="text-red-400 font-medium">
                Clinic operating expenses
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Net Clinic Revenue */}
        <Card className="relative overflow-hidden hover:border-emerald-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Net Income
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                activeNet >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              ₱{activeNet.toLocaleString()}
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
              Gross collections minus expenses
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="relative overflow-hidden hover:border-blue-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Pending Receivables
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              ₱{totalReceivables.toLocaleString()}
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
              Unpaid patient installment balances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot Summary Rows */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span>Multi-Period Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Today
                </p>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                  ₱{totals.today.toLocaleString()}
                </p>
              </div>
              <Badge variant={totals.today > 0 ? "success" : "secondary"}>
                {totals.today > 0 ? "Active Sales" : "No Records Yet"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  This Month
                </p>
                <p className="text-sm font-bold text-amber-500">
                  ₱{totals.month.toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Expenses: ₱{expenseTotals.month.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  This Year
                </p>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                  ₱{totals.year.toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-emerald-500 font-medium">
                Net: ₱{(totals.year - expenseTotals.year).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              <span>Patient Directory Highlights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Registered Patients
                </p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {patients.length} Total Patients
                </p>
              </div>
              <Badge variant="default">All Records</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Active Installment Plans
                </p>
                <p className="text-sm font-bold text-amber-500">
                  {patients.filter((p) => p.serviceType === "Installment" && Number(p.balance) > 0).length} Patients with Balance
                </p>
              </div>
              <Badge variant="warning">Installments</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Fully Settled Patients
                </p>
                <p className="text-sm font-bold text-emerald-500">
                  {patients.filter((p) => Number(p.balance) === 0).length} Cleared
                </p>
              </div>
              <Badge variant="success">Fully Paid</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardData;
