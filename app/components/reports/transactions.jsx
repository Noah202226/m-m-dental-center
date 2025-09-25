"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "../../stores/useTransactionStore";
import { FiDollarSign, FiFilter } from "react-icons/fi";
import { FaPesoSign } from "react-icons/fa6";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../Roboto-font";

export default function SalesDashboard() {
  const { transactions, fetchTransactions, filterByDate, filteredTotal } =
    useTransactionStore();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Automatically set first and last day of current month
  useEffect(() => {
    const updateMonthRange = () => {
      const now = new Date();

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      setStartDate(firstDay);
      setEndDate(lastDay);

      // Auto-filter data when month changes
      filterByDate(firstDay, lastDay);
    };

    updateMonthRange();

    // ✅ Auto-refresh when month changes (check every hour)
    const interval = setInterval(() => {
      updateMonthRange();
    }, 1000 * 60 * 60); // 1 hour

    return () => clearInterval(interval);
  }, [filterByDate]);

  // PDF Report
  const generateReport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.setFont("Roboto-font");
    doc.text("Sales Report", 14, 20);

    // Date range
    if (startDate && endDate) {
      doc.setFontSize(11);
      doc.text(`From: ${startDate} To: ${endDate}`, 14, 28);
    }

    // Build table rows
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      t.patientName,
      t.serviceName,
      t.paymentType,
      `PHP ${t.amount.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Date", "Patient", "Service", "Type", "Amount"]],
      body: rows,
      styles: { font: "helvetica" },
    });

    // Totals
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    doc.setFontSize(12);
    doc.text(
      `Total: PHP ${totalAmount.toLocaleString()}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    // Save PDF
    doc.save("sales_report.pdf");
  };

  // Totals calculation
  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    let todayTotal = 0,
      monthTotal = 0,
      yearTotal = 0;

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (t.date.startsWith(today)) todayTotal += t.amount;
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        monthTotal += t.amount;
      if (d.getFullYear() === now.getFullYear()) yearTotal += t.amount;
    });

    return { today: todayTotal, month: monthTotal, year: yearTotal };
  }, [transactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden text-yellow-400">
      {/* 🔹 Fixed Header (totals + filter) */}
      <div className="shrink-0 bg-black pb-2 z-5">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaPesoSign /> Sales Dashboard
        </h2>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4 text-yellow-400">
            <h3 className="text-sm font-medium text-gray-400">Today</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{totals.today.toLocaleString()}
            </p>
          </div>
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4 text-yellow-400">
            <h3 className="text-sm font-medium text-gray-400">This Month</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{totals.month.toLocaleString()}
            </p>
          </div>
          <div className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4 text-yellow-400">
            <h3 className="text-sm font-medium text-gray-400">This Year</h3>
            <p className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              ₱{totals.year.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
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
            Generate Sales Report
          </button>
        </div>

        {filteredTotal > 0 && (
          <p className="mb-3 text-green-400 font-bold">
            Total in Range: ₱{filteredTotal.toLocaleString()}
          </p>
        )}
      </div>

      {/* 🔹 Scrollable content */}
      <div className="flex-1 min-h-full overflow-y-auto">
        {/* Desktop Table */}
        <div className="hidden md:block  h-100 overflow-x-auto rounded-box border border-base-content/5">
          <table className="table overflow-auto text-yellow-400">
            <thead>
              <tr className="bg-yellow-500 text-black sticky top-0">
                <th>Date</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.$id}>
                  <td>
                    {new Date(t.date).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{t.patientName}</td>
                  <td>{t.serviceName}</td>
                  <td>{t.paymentType}</td>
                  <td>₱{t.amount.toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No transactions found for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-4 md:hidden p-2">
          {transactions.map((t) => (
            <div
              key={t.$id}
              className="card bg-[var(--theme-bg)] border border-yellow-500/40 shadow-lg rounded-2xl p-4 hover:shadow-yellow-500/20 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-400">
                  {new Date(t.date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="badge badge-warning text-black font-bold px-3 py-1 rounded-full">
                  {t.paymentType}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-yellow-400">
                {t.patientName} – {t.serviceName}
              </h2>

              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-xl font-bold text-yellow-400">
                  ₱{t.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
