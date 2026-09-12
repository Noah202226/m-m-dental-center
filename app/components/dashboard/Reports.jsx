"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SalesDashboard from "../reports/transactions";
import ExpensesTab from "../reports/ExpensesTab";
import { Card } from "../ui/Card";
import { FileText, TrendingUp, Receipt } from "lucide-react";

export default function ReportsTabs() {
  const [activeTab, setActiveTab] = useState("transactions");

  const tabs = [
    { key: "transactions", label: "SALES & REVENUE", icon: <TrendingUp size={16} /> },
    { key: "expenses", label: "CLINIC EXPENSES", icon: <Receipt size={16} /> },
  ];

  return (
    <div className="w-full h-full space-y-4">
      {/* 🚀 Modern Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Card */}
      <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 min-h-[calc(100vh-13rem)]">
        {/* 🔹 Transactions Report */}
        {activeTab === "transactions" && (
          <div className="flex-1 overflow-hidden h-full">
            <SalesDashboard />
          </div>
        )}

        {/* 🔹 Expenses Report */}
        {activeTab === "expenses" && (
          <div className="flex-1 overflow-hidden h-full">
            <ExpensesTab />
          </div>
        )}
      </Card>
    </div>
  );
}
