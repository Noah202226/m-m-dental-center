"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { usePatientStore } from "@/app/stores/usePatientStore";

export default function AddPaymentModal({ patient, onClose }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Grab actions from the store
  const { addTransaction, fetchTransactions, fetchPatients } =
    usePatientStore();

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      setLoading(true);

      const paymentAmount = Number(amount);
      const newBalance = (patient.balance || 0) - paymentAmount;

      // ✅ Use store method instead of calling Appwrite directly
      await addTransaction(patient.$id, {
        patientId: patient.$id,
        patientName: patient.patientName,
        serviceName: patient.serviceName,
        subServiceName: patient.subServiceName ?? "",
        amount: paymentAmount,
        paymentType: "Installment",
        date: new Date().toISOString(),
      });

      // 🔄 Refresh state so UI is always synced
      await fetchTransactions(patient.$id);
      await fetchPatients(true);

      toast.success("Payment added successfully!");
      onClose();
    } catch (err) {
      console.error("Error adding payment:", err);
      toast.error("Failed to add payment.");
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
