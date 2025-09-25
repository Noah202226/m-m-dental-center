"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SalesDashboard from "../reports/transactions";
import ExpensesTab from "../reports/ExpensesTab";
// later you can add more reports like ExpenseReports, PatientReports, etc.

export default function ReportsTabs() {
  const [activeTab, setActiveTab] = useState("transactions");

  const tabs = [
    { key: "transactions", label: "SALES" },
    { key: "expenses", label: "EXPENSES" },
    // { key: "patients", label: "PATIENTS" },
    // { key: "financial", label: "FINANCIAL SUMMARY" },
  ];

  return (
    <div className="w-full h-full">
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-400">Reports</h2>
      </div> */}

      {/* 🚀 Custom Scrollable Tab Bar */}
      <div className="relative border-b border-yellow-400 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2 rounded-md font-semibold transition-colors 
                  ${
                    isActive
                      ? "text-black bg-yellow-400"
                      : "text-gray-400 hover:text-yellow-300 hover:bg-yellow-400/20"
                  }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeReportTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className=" flex-col mt-6 border p-2 border-yellow-400 rounded-lg bg-black text-yellow-400 h-full">
        {/* 🔹 Transactions Report */}
        {activeTab === "transactions" && (
          <div className="flex-1 overflow-hidden h-full">
            <SalesDashboard />
          </div>
        )}

        {/* 🔹 Expenses Report */}
        {activeTab === "expenses" && (
          <div>
            <ExpensesTab />
          </div>
        )}

        {/* 🔹 Patients Report */}
        {activeTab === "patients" && (
          <div>
            <p className="mb-4">🧑‍⚕️ Patients Report coming soon...</p>
            <button className="btn bg-yellow-400 text-black">
              Generate Patient Report
            </button>
          </div>
        )}

        {/* 🔹 Financial Summary */}
        {activeTab === "financial" && (
          <div>
            <p className="mb-4">📊 Financial Summary coming soon...</p>
            <button className="btn bg-yellow-400 text-black">
              Generate Financial Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
