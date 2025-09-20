"use client";

import { useEffect, useState } from "react";
import { databases } from "../../lib/appwrite";
import { FiDollarSign, FiFilter } from "react-icons/fi";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const TRANSACTIONS_COLLECTION_ID = "transactions";

export default function SalesDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ today: 0, month: 0, year: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredTotal, setFilteredTotal] = useState(0);

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        []
      );
      const docs = res.documents;
      setTransactions(docs);

      // Compute totals
      calculateTotals(docs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  // Compute daily/monthly/yearly totals
  const calculateTotals = (docs) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();

    let todayTotal = 0,
      monthTotal = 0,
      yearTotal = 0;

    docs.forEach((t) => {
      const d = new Date(t.date);

      if (t.date.startsWith(today)) todayTotal += t.amount;
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        monthTotal += t.amount;
      if (d.getFullYear() === now.getFullYear()) yearTotal += t.amount;
    });

    setTotals({ today: todayTotal, month: monthTotal, year: yearTotal });
  };

  // Filter transactions by date range
  const filterByDate = async () => {
    if (!startDate || !endDate) return;

    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        [
          Query.greaterThanEqual("date", new Date(startDate).toISOString()),
          Query.lessThanEqual("date", new Date(endDate).toISOString()),
        ]
      );

      const docs = res.documents;
      setTransactions(docs);

      // Calculate filtered total
      const total = docs.reduce((sum, t) => sum + t.amount, 0);
      setFilteredTotal(total);
    } catch (error) {
      console.error("Error filtering transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="p-6 text-yellow-400">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiDollarSign /> Sales Dashboard
      </h2>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black border border-yellow-400 p-4 rounded-lg">
          <p className="text-gray-300">Today</p>
          <h3 className="text-xl font-bold">
            ₱{totals.today.toLocaleString()}
          </h3>
        </div>
        <div className="bg-black border border-yellow-400 p-4 rounded-lg">
          <p className="text-gray-300">This Month</p>
          <h3 className="text-xl font-bold">
            ₱{totals.month.toLocaleString()}
          </h3>
        </div>
        <div className="bg-black border border-yellow-400 p-4 rounded-lg">
          <p className="text-gray-300">This Year</p>
          <h3 className="text-xl font-bold">₱{totals.year.toLocaleString()}</h3>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
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
          onClick={filterByDate}
          className="btn btn-sm bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
        >
          <FiFilter /> Filter
        </button>
      </div>

      {filteredTotal > 0 && (
        <p className="mb-4 text-green-400 font-bold">
          Total in Range: ₱{filteredTotal.toLocaleString()}
        </p>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-black border border-yellow-400 rounded-lg">
        <table className="table w-full">
          <thead>
            <tr className="bg-yellow-400 text-black">
              <th>Date</th>
              <th>Patient</th>
              <th>Service</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.$id} className="hover:bg-gray-800">
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.patientName}</td>
                <td>{t.serviceName}</td>
                <td>{t.paymentType}</td>
                <td>₱{t.amount.toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No transactions found for this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
