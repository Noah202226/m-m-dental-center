"use client";

import { useEffect, useState } from "react";
import { databases, ID, DATABASE_ID } from "../../../lib/appwrite"; // adjust import path
import toast from "react-hot-toast";
import { useTransactionStore } from "@/app/stores/useTransactionStore";

export default function AddPaymentModal({ patient, onClose, fetchPatients }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { transactions, fetchTransactions } = useTransactionStore();

  console.log(transactions);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      setLoading(true);

      const paymentAmount = Number(amount);
      const newBalance = (patient.balance || 0) - paymentAmount;

      // 1️⃣ Create transaction first
      const transaction = await databases.createDocument(
        DATABASE_ID,
        "transactions",
        ID.unique(),
        {
          patientId: patient.$id,
          patientName: patient.patientName,
          serviceName: patient.serviceName,
          subServiceName: patient.subServiceName ?? "",
          amount: paymentAmount,
          paymentType: "Installment",
          date: new Date().toISOString(),
        }
      );

      // 2️⃣ Create installment linked with transactionId
      await databases.createDocument(DATABASE_ID, "installments", ID.unique(), {
        patientId: patient.$id,
        amountPaid: paymentAmount,
        paymentDate: new Date().toISOString(),
        balanceAfter: newBalance,
        transactionId: transaction.$id, // ✅ link
      });

      // 3️⃣ Update patient balance
      await databases.updateDocument(DATABASE_ID, "patients", patient.$id, {
        balance: newBalance,
      });

      toast.success("Payment added successfully!");
      onClose();
      await fetchPatients();
      await fetchTransactions();
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Failed to add payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-96">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          Add Payment for {patient.patientName}
        </h2>

        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Payment Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg"
            >
              {loading ? "Saving..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
