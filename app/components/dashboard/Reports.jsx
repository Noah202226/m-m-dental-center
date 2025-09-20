"use client";

import SalesDashboard from "../reports/transactions";

export default function Reports() {
  return (
    <div>
      <p className="text-gray-400">View financial and treatment reports</p>

      <div className="mt-4">
        <button className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition">
          Generate Report
        </button>
      </div>

      <SalesDashboard />
    </div>
  );
}
