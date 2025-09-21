"use client";
import { useExpensesStore } from "../../stores/useExpenseStore";
import { FiFilter } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExpensesTab() {
  const { filteredExpenses, filterByDate, clearFilter, fetchExpenses } =
    useExpensesStore();

  // PDF Report
  const generateReport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.setFont("Roboto-font");
    doc.text("Expenses Report", 14, 20);

    // Date range
    if (startDate && endDate) {
      doc.setFontSize(11);
      doc.text(`From: ${startDate} To: ${endDate}`, 14, 28);
    }

    // Build table rows
    const rows = filteredExpenses.map((t) => [
      new Date(t.date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      t.title,
      t.category,
      `PHP ${t.amount.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Date", "Patient", "Service", "Amount"]],
      body: rows,
      styles: { font: "helvetica" },
    });

    // Totals
    const totalAmount = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
    doc.setFontSize(12);
    doc.text(
      `Total: PHP ${totalAmount.toLocaleString()}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    // Save PDF
    doc.save("expenses_report.pdf");
  };

  // 📅 Calculate first & last day of month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatDate = (d) => d.toISOString().split("T")[0];

  // 🔹 Keep inputs in state (but don’t filter until clicked)
  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(lastDay));

  // 🔹 Totals
  const { todayTotal, monthTotal, yearTotal } = useMemo(() => {
    const todayStr = today.toISOString().split("T")[0];
    const month = today.getMonth();
    const year = today.getFullYear();

    let tTotal = 0,
      mTotal = 0,
      yTotal = 0;

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
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
      todayTotal: tTotal,
      monthTotal: mTotal,
      yearTotal: yTotal,
    };
  }, [filteredExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden text-yellow-400">
      {/* 🔹 Fixed Header (summary + filter) */}
      <div className="shrink-0 bg-black pb-2 z-5">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          💰 Expenses Report
        </h2>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400">Today</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{todayTotal.toLocaleString()}
            </p>
          </div>
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400">This Month</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{monthTotal.toLocaleString()}
            </p>
          </div>
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400">This Year</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{yearTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input input-sm bg-black border border-yellow-400 text-yellow-400 rounded-lg"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input input-sm bg-black border border-yellow-400 text-yellow-400 rounded-lg"
          />
          <button
            onClick={() => filterByDate(startDate, endDate)}
            className="btn btn-sm bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
          >
            <FiFilter /> Filter
          </button>
          <button
            onClick={generateReport}
            className="btn btn-sm bg-yellow-400 text-black"
          >
            Generate Expense Report
          </button>
        </div>
      </div>

      {/* 🔹 Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="table  w-full text-yellow-400">
            <thead>
              <tr className="bg-yellow-500 text-black sticky top-0">
                <th>Date</th>
                <th>Expense</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.$id}>
                  <td>
                    {new Date(e.date).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{e.title}</td>
                  <td>{e.category}</td>
                  <td>₱{e.amount.toLocaleString()}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No expenses found for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-4 md:hidden p-2">
          {filteredExpenses.map((e) => (
            <div
              key={e.$id}
              className="card bg-[var(--theme-bg)] border border-yellow-500/40 shadow-lg rounded-2xl p-4 hover:shadow-yellow-500/20 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-400">
                  {new Date(e.date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="badge badge-warning text-black font-bold px-3 py-1 rounded-full">
                  {e.category}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-yellow-400">
                {e.title}
              </h2>

              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-xl font-bold text-yellow-400">
                  ₱{e.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
