import { useTransactionStore } from "../../stores/useTransactionStore";
import { useExpensesStore } from "../../stores/useExpenseStore";
import React, { useMemo } from "react";

const DashboardData = () => {
  const { transactions } = useTransactionStore();
  const { expenses } = useExpensesStore();

  // 🔹 Sales totals (transactions)
  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    let todayTotal = 0,
      monthTotal = 0,
      yearTotal = 0,
      allTotal = 0;

    transactions.forEach((t) => {
      const d = new Date(t.date);
      allTotal += t.amount; // ✅ total sales all time
      if (t.date.startsWith(today)) todayTotal += t.amount;
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        monthTotal += t.amount;
      if (d.getFullYear() === now.getFullYear()) yearTotal += t.amount;
    });

    return {
      today: todayTotal,
      month: monthTotal,
      year: yearTotal,
      all: allTotal,
    };
  }, [transactions]);

  // 🔹 Expense totals
  const expenseTotals = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // yyyy-mm-dd
    const month = today.getMonth();
    const year = today.getFullYear();

    let tTotal = 0,
      mTotal = 0,
      yTotal = 0,
      allTotal = 0;

    expenses.forEach((e) => {
      const d = new Date(e.date);
      allTotal += e.amount; // ✅ all-time expenses
      if (d.toISOString().split("T")[0] === todayStr) {
        tTotal += e.amount;
      }
      if (d.getMonth() === month && d.getFullYear() === year) {
        mTotal += e.amount;
      }
      if (d.getFullYear() === year) {
        yTotal += e.amount;
      }
    });

    return {
      today: tTotal,
      month: mTotal,
      year: yTotal,
      all: allTotal,
    };
  }, [expenses]);

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-yellow-400">Overview</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Sales */}
        <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
          <p className="text-gray-400">Total Sales</p>
          <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
            ₱{totals.all.toLocaleString()}
          </h4>
        </div>

        {/* Expenses */}
        <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
          <p className="text-gray-400">Total Expenses</p>
          <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
            ₱{expenseTotals.all.toLocaleString()}
          </h4>
        </div>

        {/* Revenue (Sales - Expenses) */}
        <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
          <p className="text-gray-400">Revenue</p>
          <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
            ₱{(totals.all - expenseTotals.all).toLocaleString()}
          </h4>
        </div>

        {/* Today’s Quick View */}
        {/* <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
          <p className="text-gray-400">Today</p>
          <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
            Sales ₱{totals.today.toLocaleString()} / Expenses ₱
            {expenseTotals.today.toLocaleString()}
          </h4>
        </div> */}
      </div>
    </div>
  );
};

export default DashboardData;
